import { prisma } from '../../../_lib/db'
import { paginationSchema } from '../../../_lib/schemas'
import { getSession, requireAuth } from '../../../_lib/auth'
import { ok, corsPreflightResponse, setCorsHeaders, parseQuery, methodNotAllowed } from '../../../_lib/utils'

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
    // Require authentication
    const session = await getSession(req)
    const authSession = requireAuth(session)

    // Parse pagination parameters
    const pagination = parseQuery(url, paginationSchema)
    const { page, pageSize } = pagination

    // Get transaction type filter
    const type = url.searchParams.get('type') // 'EARN' | 'SPEND' | 'TRANSFER' | 'REFUND'
    const source = url.searchParams.get('source') // 'survey_complete' | 'survey_create' etc.

    // Build where clause
    const where: any = { user_id: authSession.userId }
    if (type) where.type = type
    if (source) where.source = source

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.pointTransaction.findMany({
        where,
        select: {
          id: true,
          type: true,
          amount: true,
          balance_after: true,
          source: true,
          reference_id: true,
          reference_type: true,
          description: true,
          metadata: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.pointTransaction.count({ where })
    ])

    // Get current user points
    const user = await prisma.user.findUnique({
      where: { id: authSession.userId },
      select: { points: true, level: true }
    })

    // Calculate statistics
    const stats = await prisma.pointTransaction.aggregate({
      where: { user_id: authSession.userId },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    const earnedStats = await prisma.pointTransaction.aggregate({
      where: { 
        user_id: authSession.userId,
        type: 'EARN'
      },
      _sum: {
        amount: true
      }
    })

    const spentStats = await prisma.pointTransaction.aggregate({
      where: { 
        user_id: authSession.userId,
        type: 'SPEND'
      },
      _sum: {
        amount: true
      }
    })

    const response = ok({
      transactions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total
      },
      summary: {
        current_points: user?.points || 0,
        current_level: user?.level || 1,
        total_earned: earnedStats._sum.amount || 0,
        total_spent: spentStats._sum.amount || 0,
        total_transactions: stats._count.id || 0
      }
    })
    
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Point transactions API error:', error)
    
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
