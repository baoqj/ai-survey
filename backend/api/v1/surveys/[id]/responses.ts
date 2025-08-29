import { prisma, handleDatabaseError } from '../../../../_lib/db'
import { submitResponseSchema, paginationSchema } from '../../../../_lib/schemas'
import { getSession, requireAuth } from '../../../../_lib/auth'
import { ok, badRequest, notFound, forbidden, corsPreflightResponse, setCorsHeaders, parseJsonBody, parseQuery, methodNotAllowed, validateUUID, getClientIP, checkRateLimit, tooManyRequests } from '../../../../_lib/utils'

export const config = { runtime: 'nodejs' }

export default async function handler(req: Request) {
  const origin = req.headers.get('origin')
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/')
  const surveyId = pathParts[pathParts.length - 2] // surveys/[id]/responses
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(origin)
  }

  // Validate survey ID
  if (!validateUUID(surveyId)) {
    const response = badRequest('INVALID_ID', 'Invalid survey ID format')
    return setCorsHeaders(response, origin)
  }

  try {
    if (req.method === 'POST') {
      return await handleSubmitResponse(req, surveyId, origin)
    }

    if (req.method === 'GET') {
      return await handleGetResponses(req, surveyId, url, origin)
    }

    const response = methodNotAllowed(['POST', 'GET'])
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Survey responses API error:', error)
    
    const response = new Response(JSON.stringify({
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
    
    return setCorsHeaders(response, origin)
  }
}

async function handleSubmitResponse(req: Request, surveyId: string, origin?: string) {
  try {
    // Rate limiting for response submission
    const clientIP = getClientIP(req)
    const rateLimit = checkRateLimit(`submit:${clientIP}`, 10, 60 * 1000) // 10 submissions per minute
    
    if (!rateLimit.allowed) {
      const response = tooManyRequests(Math.ceil((rateLimit.resetTime - Date.now()) / 1000))
      return setCorsHeaders(response, origin)
    }

    // Get session (optional for anonymous responses)
    const session = await getSession(req)

    // Find survey and validate
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: {
        id: true,
        title: true,
        status: true,
        access_type: true,
        access_code: true,
        max_responses: true,
        response_count: true,
        expires_at: true,
        questions: true,
        config: true
      }
    })

    if (!survey) {
      const response = notFound('Survey not found')
      return setCorsHeaders(response, origin)
    }

    // Check if survey is published and accessible
    if (survey.status !== 'PUBLISHED') {
      const response = badRequest('SURVEY_NOT_PUBLISHED', 'Survey is not published')
      return setCorsHeaders(response, origin)
    }

    // Check if survey has expired
    if (survey.expires_at && new Date() > survey.expires_at) {
      const response = badRequest('SURVEY_EXPIRED', 'Survey has expired')
      return setCorsHeaders(response, origin)
    }

    // Check response limit
    if (survey.max_responses && survey.response_count >= survey.max_responses) {
      const response = badRequest('RESPONSE_LIMIT_REACHED', 'Survey has reached maximum responses')
      return setCorsHeaders(response, origin)
    }

    // Check access permissions
    const config = survey.config as any || {}
    if (!config.allowAnonymous && session.anonymous) {
      const response = badRequest('LOGIN_REQUIRED', 'Login required to submit response')
      return setCorsHeaders(response, origin)
    }

    // Parse and validate request body
    const body = await parseJsonBody(req)
    const parsed = submitResponseSchema.safeParse(body)
    
    if (!parsed.success) {
      const response = badRequest('VALIDATION_ERROR', 'Invalid response data', parsed.error.flatten())
      return setCorsHeaders(response, origin)
    }

    const responseData = parsed.data

    // Validate answers against survey questions
    const questions = survey.questions as any[]
    const validationResult = validateAnswers(responseData.answers, questions)
    
    if (!validationResult.valid) {
      const response = badRequest('INVALID_ANSWERS', validationResult.error)
      return setCorsHeaders(response, origin)
    }

    // Check for duplicate responses (if user is logged in)
    if (!session.anonymous) {
      const existingResponse = await prisma.response.findFirst({
        where: {
          survey_id: surveyId,
          respondent_id: session.userId,
          status: 'COMPLETED'
        }
      })

      if (existingResponse) {
        const response = badRequest('DUPLICATE_RESPONSE', 'You have already submitted a response to this survey')
        return setCorsHeaders(response, origin)
      }
    }

    // Create response in transaction
    const newResponse = await prisma.$transaction(async (tx) => {
      // Create the response
      const response = await tx.response.create({
        data: {
          survey_id: surveyId,
          respondent_id: session.anonymous ? null : session.userId,
          answers: responseData.answers,
          metadata: {
            ...responseData.metadata,
            ip_address: clientIP,
            user_agent: req.headers.get('user-agent'),
            submitted_from: 'web'
          },
          time_spent: responseData.time_spent,
          started_at: responseData.started_at ? new Date(responseData.started_at) : null,
          completed_at: new Date(),
          status: 'COMPLETED',
          is_anonymous: session.anonymous,
          completion_rate: 1.0 // Assuming all required questions are answered
        },
        select: {
          id: true,
          survey_id: true,
          completed_at: true,
          time_spent: true,
          status: true
        }
      })

      // Update survey response count
      await tx.survey.update({
        where: { id: surveyId },
        data: { response_count: { increment: 1 } }
      })

      // Award points to user if logged in
      if (!session.anonymous) {
        const pointsEarned = calculateResponsePoints(responseData.answers, questions)
        
        await tx.user.update({
          where: { id: session.userId },
          data: { points: { increment: pointsEarned } }
        })

        // Record point transaction
        await tx.pointTransaction.create({
          data: {
            user_id: session.userId!,
            type: 'EARN',
            amount: pointsEarned,
            balance_after: 0, // Will be updated by trigger or separate query
            source: 'survey_complete',
            reference_id: response.id,
            reference_type: 'response',
            description: `Completed survey: ${survey.title}`
          }
        })
      }

      return response
    })

    // Log response submission
    console.log(`Response submitted: Survey ${surveyId}, Response ${newResponse.id}`)

    const response = ok({
      ...newResponse,
      message: 'Response submitted successfully',
      points_earned: session.anonymous ? 0 : calculateResponsePoints(responseData.answers, questions)
    }, 201)
    
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Submit response error:', error)
    
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = handleDatabaseError(error)
      const response = badRequest(dbError.code, dbError.message, dbError.details)
      return setCorsHeaders(response, origin)
    }

    throw error
  }
}

async function handleGetResponses(req: Request, surveyId: string, url: URL, origin?: string) {
  try {
    // Require authentication and ownership
    const session = await getSession(req)
    const authSession = requireAuth(session)

    // Check if user owns the survey or is admin
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: { creator_id: true, title: true }
    })

    if (!survey) {
      const response = notFound('Survey not found')
      return setCorsHeaders(response, origin)
    }

    if (survey.creator_id !== authSession.userId && authSession.userType !== 'ADMIN') {
      const response = forbidden('You can only view responses to your own surveys')
      return setCorsHeaders(response, origin)
    }

    // Parse pagination
    const pagination = parseQuery(url, paginationSchema)
    const { page, pageSize } = pagination

    // Get responses with pagination
    const [responses, total] = await Promise.all([
      prisma.response.findMany({
        where: { 
          survey_id: surveyId,
          status: 'COMPLETED'
        },
        select: {
          id: true,
          answers: true,
          metadata: true,
          ai_analysis: true,
          quality_score: true,
          completion_rate: true,
          time_spent: true,
          completed_at: true,
          is_anonymous: true,
          respondent: {
            select: {
              id: true,
              nickname: true
            }
          }
        },
        orderBy: { completed_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.response.count({ 
        where: { 
          survey_id: surveyId,
          status: 'COMPLETED'
        }
      })
    ])

    const response = ok({
      responses,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total
      }
    })
    
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Get responses error:', error)
    throw error
  }
}

// Helper functions
function validateAnswers(answers: any[], questions: any[]): { valid: boolean; error?: string } {
  // Basic validation - ensure all required questions are answered
  const requiredQuestions = questions.filter(q => q.required !== false)
  const answeredQuestionIds = answers.map(a => a.question_id)
  
  for (const question of requiredQuestions) {
    if (!answeredQuestionIds.includes(question.id)) {
      return { valid: false, error: `Required question not answered: ${question.content}` }
    }
  }
  
  return { valid: true }
}

function calculateResponsePoints(answers: any[], questions: any[]): number {
  // Base points for completing survey
  let points = 20
  
  // Bonus points for text answers (more effort)
  const textAnswers = answers.filter(a => a.answer_type === 'text' && a.text_value && a.text_value.length > 10)
  points += textAnswers.length * 5
  
  // Bonus for completing all questions
  if (answers.length === questions.length) {
    points += 10
  }
  
  return points
}
