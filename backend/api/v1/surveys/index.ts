import { prisma, handleDatabaseError } from '../../../_lib/db'
import { paginationSchema, createSurveySchema } from '../../../_lib/schemas'
import { getSession, requireAuth } from '../../../_lib/auth'
import { ok, badRequest, corsPreflightResponse, setCorsHeaders, parseJsonBody, parseQuery, methodNotAllowed, getClientIP, checkRateLimit, tooManyRequests } from '../../../_lib/utils'

export const config = { runtime: 'nodejs' }

export default async function handler(req: Request) {
  const origin = req.headers.get('origin')
  const url = new URL(req.url)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(origin)
  }

  try {
    // Rate limiting
    const clientIP = getClientIP(req)
    const rateLimit = checkRateLimit(`surveys:${clientIP}`, 100, 15 * 60 * 1000) // 100 requests per 15 minutes
    
    if (!rateLimit.allowed) {
      const response = tooManyRequests(Math.ceil((rateLimit.resetTime - Date.now()) / 1000))
      return setCorsHeaders(response, origin)
    }

    if (req.method === 'GET') {
      return await handleGetSurveys(req, url, origin)
    }

    if (req.method === 'POST') {
      return await handleCreateSurvey(req, origin)
    }

    const response = methodNotAllowed(['GET', 'POST'])
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Surveys API error:', error)
    
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

async function handleGetSurveys(req: Request, url: URL, origin?: string) {
  try {
    // Parse pagination parameters
    const pagination = parseQuery(url, paginationSchema)
    const { page, pageSize } = pagination

    // Get session (optional for public surveys)
    const session = await getSession(req)

    // Build where clause
    const where: any = {}
    
    // If user is not authenticated, only show public published surveys
    if (session.anonymous) {
      where.status = 'PUBLISHED'
      where.access_type = 'PUBLIC'
    } else {
      // If authenticated, show user's own surveys + public surveys
      where.OR = [
        { creator_id: session.userId },
        { 
          status: 'PUBLISHED',
          access_type: 'PUBLIC'
        }
      ]
    }

    // Add filters from query params
    const category = url.searchParams.get('category')
    if (category) {
      where.category = category
    }

    const search = url.searchParams.get('search')
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get surveys with pagination
    const [surveys, total] = await Promise.all([
      prisma.survey.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          access_type: true,
          category: true,
          tags: true,
          response_count: true,
          view_count: true,
          ai_generated: true,
          published_at: true,
          expires_at: true,
          createdAt: true,
          creator: {
            select: {
              id: true,
              nickname: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.survey.count({ where })
    ])

    const response = ok({
      surveys,
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
    console.error('Get surveys error:', error)
    throw error
  }
}

async function handleCreateSurvey(req: Request, origin?: string) {
  try {
    // Require authentication for creating surveys
    const session = await getSession(req)
    const authSession = requireAuth(session)

    // Parse and validate request body
    const body = await parseJsonBody(req)
    const parsed = createSurveySchema.safeParse(body)
    
    if (!parsed.success) {
      const response = badRequest('VALIDATION_ERROR', 'Invalid survey data', parsed.error.flatten())
      return setCorsHeaders(response, origin)
    }

    const surveyData = parsed.data

    // Create survey in transaction
    const survey = await prisma.$transaction(async (tx) => {
      // Create the survey
      const newSurvey = await tx.survey.create({
        data: {
          creator_id: authSession.userId,
          title: surveyData.title,
          description: surveyData.description,
          questions: surveyData.questions,
          config: surveyData.config || {},
          access_type: surveyData.access_type,
          access_code: surveyData.access_code,
          max_responses: surveyData.max_responses,
          category: surveyData.category,
          tags: surveyData.tags,
          expires_at: surveyData.expires_at ? new Date(surveyData.expires_at) : null,
          status: 'DRAFT'
        },
        select: {
          id: true,
          title: true,
          description: true,
          questions: true,
          config: true,
          status: true,
          access_type: true,
          category: true,
          tags: true,
          createdAt: true,
          creator: {
            select: {
              id: true,
              nickname: true
            }
          }
        }
      })

      // Award points for creating survey
      await tx.user.update({
        where: { id: authSession.userId },
        data: { points: { increment: 50 } }
      })

      // Record point transaction
      await tx.pointTransaction.create({
        data: {
          user_id: authSession.userId,
          type: 'EARN',
          amount: 50,
          balance_after: 0, // Will be updated by trigger or separate query
          source: 'survey_create',
          reference_id: newSurvey.id,
          reference_type: 'survey',
          description: 'Created new survey'
        }
      })

      return newSurvey
    })

    // Log survey creation
    console.log(`Survey created: ${survey.title} (${survey.id}) by user ${authSession.userId}`)

    const response = ok(survey, 201)
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Create survey error:', error)
    
    // Handle database errors
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = handleDatabaseError(error)
      const response = badRequest(dbError.code, dbError.message, dbError.details)
      return setCorsHeaders(response, origin)
    }

    throw error
  }
}
