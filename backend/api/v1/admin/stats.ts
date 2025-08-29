import { prisma } from '../../../_lib/db'
import { getSession, requireUserType } from '../../../_lib/auth'
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
    // Require admin authentication
    const session = await getSession(req)
    requireUserType(session, ['ADMIN'])

    // Get current date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get overall statistics
    const [
      totalUsers,
      totalSurveys,
      totalResponses,
      totalTemplates,
      activeUsers,
      publishedSurveys,
      todayUsers,
      todaySurveys,
      todayResponses,
      weeklyUsers,
      weeklySurveys,
      weeklyResponses
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.survey.count(),
      prisma.response.count({ where: { status: 'COMPLETED' } }),
      prisma.surveyTemplate.count({ where: { status: 'ACTIVE' } }),
      
      // Active counts
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.survey.count({ where: { status: 'PUBLISHED' } }),
      
      // Today's activity
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.survey.count({ where: { createdAt: { gte: today } } }),
      prisma.response.count({ where: { createdAt: { gte: today }, status: 'COMPLETED' } }),
      
      // Weekly activity
      prisma.user.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.survey.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.response.count({ where: { createdAt: { gte: thisWeek }, status: 'COMPLETED' } })
    ])

    // Get user distribution
    const userDistribution = await prisma.user.groupBy({
      by: ['user_type'],
      _count: { id: true }
    })

    // Get survey status distribution
    const surveyDistribution = await prisma.survey.groupBy({
      by: ['status'],
      _count: { id: true }
    })

    // Get response quality distribution
    const qualityDistribution = await prisma.response.groupBy({
      by: ['quality_score'],
      where: { status: 'COMPLETED' },
      _count: { id: true }
    })

    // Get top categories
    const topCategories = await prisma.survey.groupBy({
      by: ['category'],
      where: { 
        status: 'PUBLISHED',
        category: { not: null }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    })

    // Get daily activity for the last 30 days
    const dailyActivity = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        'responses' as type
      FROM responses 
      WHERE created_at >= ${thisMonth} AND status = 'COMPLETED'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    ` as any[]

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
        createdAt: true,
        creator: {
          select: {
            nickname: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Get system health metrics
    const systemHealth = {
      database: 'healthy',
      response_time: Date.now() % 100, // Mock response time
      error_rate: 0.01, // Mock error rate
      uptime: process.uptime()
    }

    const response = ok({
      overview: {
        total_users: totalUsers,
        total_surveys: totalSurveys,
        total_responses: totalResponses,
        total_templates: totalTemplates,
        active_users: activeUsers,
        published_surveys: publishedSurveys
      },
      growth: {
        today: {
          new_users: todayUsers,
          new_surveys: todaySurveys,
          new_responses: todayResponses
        },
        this_week: {
          new_users: weeklyUsers,
          new_surveys: weeklySurveys,
          new_responses: weeklyResponses
        }
      },
      distributions: {
        users: userDistribution.map(d => ({
          type: d.user_type,
          count: d._count.id
        })),
        surveys: surveyDistribution.map(d => ({
          status: d.status,
          count: d._count.id
        })),
        quality: qualityDistribution.map(d => ({
          score: d.quality_score,
          count: d._count.id
        }))
      },
      top_categories: topCategories.map(c => ({
        category: c.category,
        count: c._count.id
      })),
      daily_activity: dailyActivity,
      recent_activity: {
        users: recentUsers,
        surveys: recentSurveys
      },
      system_health: systemHealth
    })
    
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Admin stats API error:', error)
    
    if (error instanceof Error && (error.message === 'Authentication required' || error.message === 'Insufficient permissions')) {
      const response = new Response(JSON.stringify({
        code: error.message === 'Authentication required' ? 'UNAUTHORIZED' : 'FORBIDDEN',
        message: error.message,
        timestamp: new Date().toISOString()
      }), { 
        status: error.message === 'Authentication required' ? 401 : 403,
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
