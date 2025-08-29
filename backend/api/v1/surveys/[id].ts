import { prisma, handleDatabaseError } from '../../../_lib/db'
import { updateSurveySchema, publishSurveySchema } from '../../../_lib/schemas'
import { getSession, requireAuth } from '../../../_lib/auth'
import { ok, badRequest, notFound, forbidden, corsPreflightResponse, setCorsHeaders, parseJsonBody, methodNotAllowed, validateUUID } from '../../../_lib/utils'

export const config = { runtime: 'nodejs' }

export default async function handler(req: Request) {
  const origin = req.headers.get('origin')
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/')
  const surveyId = pathParts[pathParts.length - 1]
  
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
    if (req.method === 'GET') {
      return await handleGetSurvey(req, surveyId, origin)
    }

    if (req.method === 'PATCH') {
      return await handleUpdateSurvey(req, surveyId, origin)
    }

    if (req.method === 'DELETE') {
      return await handleDeleteSurvey(req, surveyId, origin)
    }

    const response = methodNotAllowed(['GET', 'PATCH', 'DELETE'])
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Survey API error:', error)
    
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

async function handleGetSurvey(req: Request, surveyId: string, origin?: string) {
  try {
    const session = await getSession(req)

    // Find survey
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        creator: {
          select: {
            id: true,
            nickname: true
          }
        },
        responses: {
          select: {
            id: true,
            completed_at: true,
            quality_score: true
          },
          where: {
            status: 'COMPLETED'
          }
        }
      }
    })

    if (!survey) {
      const response = notFound('Survey not found')
      return setCorsHeaders(response, origin)
    }

    // Check access permissions
    const canAccess = 
      survey.status === 'PUBLISHED' && survey.access_type === 'PUBLIC' ||
      (!session.anonymous && survey.creator_id === session.userId) ||
      (!session.anonymous && session.userType === 'ADMIN')

    if (!canAccess) {
      const response = forbidden('Access denied to this survey')
      return setCorsHeaders(response, origin)
    }

    // Increment view count for public surveys
    if (survey.status === 'PUBLISHED' && survey.access_type === 'PUBLIC') {
      await prisma.survey.update({
        where: { id: surveyId },
        data: { view_count: { increment: 1 } }
      })
    }

    // Calculate response statistics
    const responseStats = {
      total: survey.responses.length,
      quality_distribution: {
        green: survey.responses.filter(r => r.quality_score === 'GREEN').length,
        amber: survey.responses.filter(r => r.quality_score === 'AMBER').length,
        red: survey.responses.filter(r => r.quality_score === 'RED').length
      }
    }

    // Remove responses from survey object and add stats
    const { responses, ...surveyData } = survey
    const surveyWithStats = {
      ...surveyData,
      response_stats: responseStats
    }

    const response = ok(surveyWithStats)
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Get survey error:', error)
    throw error
  }
}

async function handleUpdateSurvey(req: Request, surveyId: string, origin?: string) {
  try {
    // Require authentication
    const session = await getSession(req)
    const authSession = requireAuth(session)

    // Find survey and check ownership
    const existingSurvey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: { id: true, creator_id: true, status: true }
    })

    if (!existingSurvey) {
      const response = notFound('Survey not found')
      return setCorsHeaders(response, origin)
    }

    // Check ownership or admin permission
    if (existingSurvey.creator_id !== authSession.userId && authSession.userType !== 'ADMIN') {
      const response = forbidden('You can only edit your own surveys')
      return setCorsHeaders(response, origin)
    }

    // Parse request body
    const body = await parseJsonBody(req)
    
    // Check if this is a status update (publish/unpublish)
    const statusUpdate = publishSurveySchema.safeParse(body)
    if (statusUpdate.success) {
      const updatedSurvey = await prisma.survey.update({
        where: { id: surveyId },
        data: { 
          status: statusUpdate.data.status,
          published_at: statusUpdate.data.status === 'PUBLISHED' ? new Date() : null
        },
        include: {
          creator: {
            select: { id: true, nickname: true }
          }
        }
      })

      console.log(`Survey ${statusUpdate.data.status.toLowerCase()}: ${updatedSurvey.title} (${surveyId})`)

      const response = ok(updatedSurvey)
      return setCorsHeaders(response, origin)
    }

    // Otherwise, treat as general survey update
    const parsed = updateSurveySchema.safeParse(body)
    if (!parsed.success) {
      const response = badRequest('VALIDATION_ERROR', 'Invalid survey data', parsed.error.flatten())
      return setCorsHeaders(response, origin)
    }

    const updateData = parsed.data

    // Don't allow editing published surveys (except status)
    if (existingSurvey.status === 'PUBLISHED' && Object.keys(updateData).some(key => key !== 'status')) {
      const response = badRequest('SURVEY_PUBLISHED', 'Cannot edit published survey content')
      return setCorsHeaders(response, origin)
    }

    // Update survey
    const updatedSurvey = await prisma.survey.update({
      where: { id: surveyId },
      data: {
        ...updateData,
        expires_at: updateData.expires_at ? new Date(updateData.expires_at) : undefined,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: { id: true, nickname: true }
        }
      }
    })

    console.log(`Survey updated: ${updatedSurvey.title} (${surveyId})`)

    const response = ok(updatedSurvey)
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Update survey error:', error)
    
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = handleDatabaseError(error)
      const response = badRequest(dbError.code, dbError.message, dbError.details)
      return setCorsHeaders(response, origin)
    }

    throw error
  }
}

async function handleDeleteSurvey(req: Request, surveyId: string, origin?: string) {
  try {
    // Require authentication
    const session = await getSession(req)
    const authSession = requireAuth(session)

    // Find survey and check ownership
    const existingSurvey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: { 
        id: true, 
        creator_id: true, 
        title: true,
        status: true,
        response_count: true
      }
    })

    if (!existingSurvey) {
      const response = notFound('Survey not found')
      return setCorsHeaders(response, origin)
    }

    // Check ownership or admin permission
    if (existingSurvey.creator_id !== authSession.userId && authSession.userType !== 'ADMIN') {
      const response = forbidden('You can only delete your own surveys')
      return setCorsHeaders(response, origin)
    }

    // Don't allow deleting surveys with responses (soft delete instead)
    if (existingSurvey.response_count > 0) {
      await prisma.survey.update({
        where: { id: surveyId },
        data: { status: 'ARCHIVED' }
      })

      console.log(`Survey archived: ${existingSurvey.title} (${surveyId})`)

      const response = ok({ 
        message: 'Survey archived due to existing responses',
        archived: true 
      })
      return setCorsHeaders(response, origin)
    }

    // Hard delete survey with no responses
    await prisma.survey.delete({
      where: { id: surveyId }
    })

    console.log(`Survey deleted: ${existingSurvey.title} (${surveyId})`)

    const response = ok({ 
      message: 'Survey deleted successfully',
      deleted: true 
    })
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Delete survey error:', error)
    
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = handleDatabaseError(error)
      const response = badRequest(dbError.code, dbError.message, dbError.details)
      return setCorsHeaders(response, origin)
    }

    throw error
  }
}
