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
    // Get session (optional for viewing public rules)
    const session = await getSession(req)

    // Get all active point rules
    const rules = await prisma.pointRule.findMany({
      where: { is_active: true },
      select: {
        id: true,
        rule_name: true,
        rule_type: true,
        action: true,
        points: true,
        conditions: true,
        daily_limit: true,
        total_limit: true,
        createdAt: true
      },
      orderBy: { rule_type: 'asc' }
    })

    // Group rules by type
    const earnRules = rules.filter(r => r.rule_type === 'EARN')
    const spendRules = rules.filter(r => r.rule_type === 'SPEND')

    // If user is authenticated, get their usage statistics
    let userStats = null
    if (!session.anonymous) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      userStats = await prisma.pointTransaction.groupBy({
        by: ['source'],
        where: {
          user_id: session.userId,
          createdAt: { gte: today }
        },
        _sum: { amount: true },
        _count: { id: true }
      })
    }

    const response = ok({
      earn_rules: earnRules.map(rule => ({
        ...rule,
        daily_used: session.anonymous ? 0 : 
          userStats?.find(s => s.source === rule.action)?._sum.amount || 0,
        daily_remaining: rule.daily_limit ? 
          Math.max(0, rule.daily_limit - (userStats?.find(s => s.source === rule.action)?._sum.amount || 0)) : 
          null
      })),
      spend_rules: spendRules,
      level_system: {
        levels: [
          { level: 1, min_points: 0, benefits: ['基础功能'] },
          { level: 2, min_points: 500, benefits: ['基础功能', '高级模板'] },
          { level: 3, min_points: 1500, benefits: ['基础功能', '高级模板', 'AI分析'] },
          { level: 4, min_points: 3000, benefits: ['基础功能', '高级模板', 'AI分析', '优先支持'] },
          { level: 5, min_points: 6000, benefits: ['所有功能', '专属客服', '定制服务'] }
        ]
      }
    })
    
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Point rules API error:', error)
    
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
