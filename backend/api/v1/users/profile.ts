import { prisma, handleDatabaseError } from '../../../_lib/db'
import { updateUserProfileSchema } from '../../../_lib/schemas'
import { getSession, requireAuth } from '../../../_lib/auth'
import { ok, badRequest, corsPreflightResponse, setCorsHeaders, parseJsonBody, methodNotAllowed } from '../../../_lib/utils'

export const config = { runtime: 'nodejs' }

export default async function handler(req: Request) {
  const origin = req.headers.get('origin')
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(origin)
  }

  try {
    // Require authentication for all profile operations
    const session = await getSession(req)
    const authSession = requireAuth(session)

    if (req.method === 'GET') {
      return await handleGetProfile(authSession.userId, origin)
    }

    if (req.method === 'PATCH') {
      return await handleUpdateProfile(req, authSession.userId, origin)
    }

    const response = methodNotAllowed(['GET', 'PATCH'])
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('User profile API error:', error)
    
    if (error instanceof Error && error.message === 'Authentication required') {
      const response = new Response(JSON.stringify({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      }), { 
        status: 401,
        headers: { 'content-type': 'application/json' }
      })
      return setCorsHeaders(response, origin)
    }
    
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

async function handleGetProfile(userId: string, origin?: string) {
  try {
    // Get user with profile and statistics
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        avatar_url: true,
        user_type: true,
        status: true,
        points: true,
        level: true,
        email_verified: true,
        phone_verified: true,
        last_login_at: true,
        createdAt: true,
        profile: {
          select: {
            age: true,
            gender: true,
            occupation: true,
            education: true,
            location: true,
            interests: true,
            behavior_tags: true,
            preferences: true
          }
        },
        surveys: {
          select: {
            id: true,
            title: true,
            status: true,
            response_count: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        responses: {
          select: {
            id: true,
            completed_at: true,
            survey: {
              select: {
                id: true,
                title: true
              }
            }
          },
          where: { status: 'COMPLETED' },
          orderBy: { completed_at: 'desc' },
          take: 5
        },
        point_transactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            source: true,
            description: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!user) {
      const response = new Response(JSON.stringify({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        timestamp: new Date().toISOString()
      }), { 
        status: 404,
        headers: { 'content-type': 'application/json' }
      })
      return setCorsHeaders(response, origin)
    }

    // Calculate user statistics
    const stats = {
      surveys_created: user.surveys.length,
      surveys_published: user.surveys.filter(s => s.status === 'PUBLISHED').length,
      total_responses_received: user.surveys.reduce((sum, s) => sum + s.response_count, 0),
      surveys_completed: user.responses.length,
      total_points_earned: user.point_transactions
        .filter(t => t.type === 'EARN')
        .reduce((sum, t) => sum + t.amount, 0),
      total_points_spent: user.point_transactions
        .filter(t => t.type === 'SPEND')
        .reduce((sum, t) => sum + t.amount, 0)
    }

    const profileData = {
      ...user,
      stats
    }

    const response = ok(profileData)
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Get profile error:', error)
    throw error
  }
}

async function handleUpdateProfile(req: Request, userId: string, origin?: string) {
  try {
    // Parse and validate request body
    const body = await parseJsonBody(req)
    const parsed = updateUserProfileSchema.safeParse(body)
    
    if (!parsed.success) {
      const response = badRequest('VALIDATION_ERROR', 'Invalid profile data', parsed.error.flatten())
      return setCorsHeaders(response, origin)
    }

    const updateData = parsed.data

    // Update user and profile in transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user basic info
      const userUpdate: any = {}
      if (updateData.nickname) {
        userUpdate.nickname = updateData.nickname
      }

      let user
      if (Object.keys(userUpdate).length > 0) {
        user = await tx.user.update({
          where: { id: userId },
          data: userUpdate,
          select: {
            id: true,
            email: true,
            nickname: true,
            avatar_url: true,
            user_type: true,
            points: true,
            level: true
          }
        })
      } else {
        user = await tx.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            nickname: true,
            avatar_url: true,
            user_type: true,
            points: true,
            level: true
          }
        })
      }

      // Update profile
      const profileUpdate: any = {}
      if (updateData.age !== undefined) profileUpdate.age = updateData.age
      if (updateData.gender !== undefined) profileUpdate.gender = updateData.gender
      if (updateData.occupation !== undefined) profileUpdate.occupation = updateData.occupation
      if (updateData.education !== undefined) profileUpdate.education = updateData.education
      if (updateData.location !== undefined) profileUpdate.location = updateData.location
      if (updateData.interests !== undefined) profileUpdate.interests = updateData.interests
      if (updateData.preferences !== undefined) profileUpdate.preferences = updateData.preferences

      let profile
      if (Object.keys(profileUpdate).length > 0) {
        profile = await tx.userProfile.upsert({
          where: { user_id: userId },
          update: profileUpdate,
          create: {
            user_id: userId,
            ...profileUpdate
          },
          select: {
            age: true,
            gender: true,
            occupation: true,
            education: true,
            location: true,
            interests: true,
            preferences: true
          }
        })
      } else {
        profile = await tx.userProfile.findUnique({
          where: { user_id: userId },
          select: {
            age: true,
            gender: true,
            occupation: true,
            education: true,
            location: true,
            interests: true,
            preferences: true
          }
        })
      }

      return { ...user, profile }
    })

    console.log(`Profile updated for user: ${userId}`)

    const response = ok({
      ...updatedUser,
      message: 'Profile updated successfully'
    })
    
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Update profile error:', error)
    
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = handleDatabaseError(error)
      const response = badRequest(dbError.code, dbError.message, dbError.details)
      return setCorsHeaders(response, origin)
    }

    throw error
  }
}
