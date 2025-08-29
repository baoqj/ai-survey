import { prisma } from '../../../_lib/db'
import { getSession, requireAuth } from '../../../_lib/auth'
import { ok, corsPreflightResponse, setCorsHeaders, methodNotAllowed } from '../../../_lib/utils'

export const config = { runtime: 'nodejs' }

export default async function handler(req: Request) {
  const origin = req.headers.get('origin')
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(origin)
  }

  if (req.method !== 'GET') {
    const response = methodNotAllowed(['GET'])
    return setCorsHeaders(response, origin)
  }

  try {
    // Require authentication
    const session = await getSession(req)
    const authSession = requireAuth(session)

    // Get dashboard statistics based on user type
    if (authSession.userType === 'CONSUMER') {
      return await handleConsumerStats(authSession.userId, origin)
    } else if (authSession.userType === 'BUSINESS') {
      return await handleBusinessStats(authSession.userId, origin)
    } else if (authSession.userType === 'ADMIN') {
      return await handleAdminStats(origin)
    }

    const response = ok({
      message: 'Dashboard stats',
      user_type: authSession.userType
    })
    
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Dashboard stats API error:', error)
    
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

async function handleConsumerStats(userId: string, origin?: string) {
  try {
    // Get consumer statistics
    const [user, responseStats, recentActivity] = await Promise.all([
      // User basic info
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          points: true,
          level: true,
          createdAt: true
        }
      }),
      
      // Response statistics
      prisma.response.aggregate({
        where: {
          respondent_id: userId,
          status: 'COMPLETED'
        },
        _count: { id: true },
        _avg: { time_spent: true }
      }),
      
      // Recent activity
      prisma.response.findMany({
        where: {
          respondent_id: userId,
          status: 'COMPLETED'
        },
        select: {
          id: true,
          completed_at: true,
          time_spent: true,
          survey: {
            select: {
              id: true,
              title: true,
              category: true
            }
          }
        },
        orderBy: { completed_at: 'desc' },
        take: 10
      })
    ])

    // Get point transactions
    const pointTransactions = await prisma.pointTransaction.findMany({
      where: { user_id: userId },
      select: {
        type: true,
        amount: true,
        source: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Calculate statistics
    const totalEarned = pointTransactions
      .filter(t => t.type === 'EARN')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalSpent = pointTransactions
      .filter(t => t.type === 'SPEND')
      .reduce((sum, t) => sum + t.amount, 0)

    // Get surveys available for completion
    const availableSurveys = await prisma.survey.findMany({
      where: {
        status: 'PUBLISHED',
        access_type: 'PUBLIC',
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ],
        NOT: {
          responses: {
            some: {
              respondent_id: userId,
              status: 'COMPLETED'
            }
          }
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        response_count: true,
        view_count: true,
        creator: {
          select: {
            nickname: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    const stats = {
      overview: {
        current_points: user?.points || 0,
        current_level: user?.level || 1,
        surveys_completed: responseStats._count.id,
        total_points_earned: totalEarned,
        total_points_spent: totalSpent,
        avg_completion_time: Math.round(responseStats._avg.time_spent || 0),
        member_since: user?.createdAt
      },
      recent_activity: recentActivity,
      available_surveys: availableSurveys,
      point_history: pointTransactions.slice(0, 10)
    }

    const response = ok(stats)
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Consumer stats error:', error)
    throw error
  }
}

async function handleBusinessStats(userId: string, origin?: string) {
  try {
    // Get business user statistics
    const [user, surveyStats, responseStats] = await Promise.all([
      // User basic info
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          points: true,
          level: true,
          createdAt: true
        }
      }),
      
      // Survey statistics
      prisma.survey.aggregate({
        where: { creator_id: userId },
        _count: { id: true }
      }),
      
      // Response statistics across all surveys
      prisma.response.aggregate({
        where: {
          survey: { creator_id: userId },
          status: 'COMPLETED'
        },
        _count: { id: true }
      })
    ])

    // Get detailed survey data
    const surveys = await prisma.survey.findMany({
      where: { creator_id: userId },
      select: {
        id: true,
        title: true,
        status: true,
        response_count: true,
        view_count: true,
        category: true,
        published_at: true,
        createdAt: true,
        responses: {
          select: {
            quality_score: true,
            completed_at: true
          },
          where: { status: 'COMPLETED' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate response trends (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentResponses = await prisma.response.findMany({
      where: {
        survey: { creator_id: userId },
        status: 'COMPLETED',
        completed_at: { gte: thirtyDaysAgo }
      },
      select: {
        completed_at: true,
        quality_score: true
      },
      orderBy: { completed_at: 'asc' }
    })

    // Group responses by day
    const dailyResponses = recentResponses.reduce((acc, response) => {
      const date = response.completed_at?.toISOString().split('T')[0]
      if (date) {
        acc[date] = (acc[date] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Calculate quality distribution
    const qualityDistribution = {
      green: surveys.reduce((sum, s) => sum + s.responses.filter(r => r.quality_score === 'GREEN').length, 0),
      amber: surveys.reduce((sum, s) => sum + s.responses.filter(r => r.quality_score === 'AMBER').length, 0),
      red: surveys.reduce((sum, s) => sum + s.responses.filter(r => r.quality_score === 'RED').length, 0)
    }

    const stats = {
      overview: {
        total_surveys: surveyStats._count.id,
        published_surveys: surveys.filter(s => s.status === 'PUBLISHED').length,
        draft_surveys: surveys.filter(s => s.status === 'DRAFT').length,
        total_responses: responseStats._count.id,
        total_views: surveys.reduce((sum, s) => sum + s.view_count, 0),
        avg_response_rate: surveys.length > 0 
          ? (responseStats._count.id / surveys.reduce((sum, s) => sum + s.view_count, 1) * 100).toFixed(2)
          : 0,
        member_since: user?.createdAt
      },
      surveys: surveys.slice(0, 10), // Recent surveys
      response_trends: {
        daily_responses: dailyResponses,
        quality_distribution: qualityDistribution
      },
      top_performing: surveys
        .filter(s => s.response_count > 0)
        .sort((a, b) => b.response_count - a.response_count)
        .slice(0, 5)
    }

    const response = ok(stats)
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Business stats error:', error)
    throw error
  }
}

async function handleAdminStats(origin?: string) {
  try {
    // Get system-wide statistics
    const [userStats, surveyStats, responseStats] = await Promise.all([
      // User statistics
      prisma.user.groupBy({
        by: ['user_type', 'status'],
        _count: { id: true }
      }),
      
      // Survey statistics
      prisma.survey.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      
      // Response statistics
      prisma.response.aggregate({
        where: { status: 'COMPLETED' },
        _count: { id: true }
      })
    ])

    // Get recent activity
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        user_type: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const recentSurveys = await prisma.survey.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        response_count: true,
        creator: {
          select: { nickname: true }
        },
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const stats = {
      overview: {
        total_users: userStats.reduce((sum, stat) => sum + stat._count.id, 0),
        active_users: userStats
          .filter(stat => stat.status === 'ACTIVE')
          .reduce((sum, stat) => sum + stat._count.id, 0),
        business_users: userStats
          .filter(stat => stat.user_type === 'BUSINESS')
          .reduce((sum, stat) => sum + stat._count.id, 0),
        consumer_users: userStats
          .filter(stat => stat.user_type === 'CONSUMER')
          .reduce((sum, stat) => sum + stat._count.id, 0),
        total_surveys: surveyStats.reduce((sum, stat) => sum + stat._count.id, 0),
        published_surveys: surveyStats
          .filter(stat => stat.status === 'PUBLISHED')
          .reduce((sum, stat) => sum + stat._count.id, 0),
        total_responses: responseStats._count.id
      },
      recent_activity: {
        new_users: recentUsers,
        new_surveys: recentSurveys
      },
      user_distribution: userStats,
      survey_distribution: surveyStats
    }

    const response = ok(stats)
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Admin stats error:', error)
    throw error
  }
}
