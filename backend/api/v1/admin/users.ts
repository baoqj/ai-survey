import { prisma } from '../../../_lib/db'
import { paginationSchema } from '../../../_lib/schemas'
import { getSession, requireUserType } from '../../../_lib/auth'
import { ok, badRequest, corsPreflightResponse, setCorsHeaders, parseQuery, methodNotAllowed } from '../../../_lib/utils'

export const config = { runtime: 'nodejs' }

export default async function handler(req: Request) {
  const origin = req.headers.get('origin')
  const url = new URL(req.url)
  
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

    // Parse pagination parameters
    const pagination = parseQuery(url, paginationSchema)
    const { page, pageSize } = pagination

    // Build where clause based on filters
    const where: any = {}
    
    const userType = url.searchParams.get('user_type')
    if (userType && ['CONSUMER', 'BUSINESS', 'ADMIN'].includes(userType)) {
      where.user_type = userType
    }

    const status = url.searchParams.get('status')
    if (status && ['ACTIVE', 'INACTIVE', 'BANNED'].includes(status)) {
      where.status = status
    }

    const search = url.searchParams.get('search')
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          nickname: true,
          user_type: true,
          status: true,
          points: true,
          level: true,
          email_verified: true,
          phone_verified: true,
          last_login_at: true,
          createdAt: true,
          _count: {
            surveys: true,
            responses: true
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.user.count({ where })
    ])

    // Get user statistics
    const userStats = await prisma.user.groupBy({
      by: ['user_type', 'status'],
      _count: { id: true }
    })

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentRegistrations = await prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      }
    })

    const response = ok({
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total
      },
      statistics: {
        total_users: total,
        recent_registrations: recentRegistrations,
        user_distribution: userStats.reduce((acc, stat) => {
          const key = `${stat.user_type.toLowerCase()}_${stat.status.toLowerCase()}`
          acc[key] = stat._count.id
          return acc
        }, {} as Record<string, number>)
      }
    })
    
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Admin users API error:', error)
    
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
