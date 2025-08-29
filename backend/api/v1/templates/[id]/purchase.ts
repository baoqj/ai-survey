import { prisma, handleDatabaseError } from '../../../../_lib/db'
import { getSession, requireAuth } from '../../../../_lib/auth'
import { ok, badRequest, notFound, forbidden, corsPreflightResponse, setCorsHeaders, methodNotAllowed, validateUUID } from '../../../../_lib/utils'

export const config = { runtime: 'nodejs' }

export default async function handler(req: Request) {
  const origin = req.headers.get('origin')
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/')
  const templateId = pathParts[pathParts.length - 2] // templates/[id]/purchase
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(origin)
  }

  if (req.method !== 'POST') {
    const response = methodNotAllowed(['POST'])
    return setCorsHeaders(response, origin)
  }

  // Validate template ID
  if (!validateUUID(templateId)) {
    const response = badRequest('INVALID_ID', 'Invalid template ID format')
    return setCorsHeaders(response, origin)
  }

  try {
    // Require authentication for purchasing templates
    const session = await getSession(req)
    const authSession = requireAuth(session)

    // Get template details
    const template = await prisma.surveyTemplate.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        title: true,
        price: true,
        status: true,
        is_public: true,
        creator_id: true
      }
    })

    if (!template) {
      const response = notFound('Template not found')
      return setCorsHeaders(response, origin)
    }

    // Check if template is available for purchase
    if (template.status !== 'ACTIVE') {
      const response = badRequest('TEMPLATE_UNAVAILABLE', 'Template is not available for purchase')
      return setCorsHeaders(response, origin)
    }

    if (!template.is_public) {
      const response = badRequest('TEMPLATE_PRIVATE', 'Template is not public')
      return setCorsHeaders(response, origin)
    }

    // Check if user is trying to buy their own template
    if (template.creator_id === authSession.userId) {
      const response = badRequest('CANNOT_BUY_OWN_TEMPLATE', 'You cannot purchase your own template')
      return setCorsHeaders(response, origin)
    }

    // Check if template is free
    if (template.price === 0) {
      const response = badRequest('TEMPLATE_FREE', 'This template is free and does not require purchase')
      return setCorsHeaders(response, origin)
    }

    // Check if user already purchased this template
    const existingPurchase = await prisma.templatePurchase.findUnique({
      where: {
        buyer_id_template_id: {
          buyer_id: authSession.userId,
          template_id: templateId
        }
      }
    })

    if (existingPurchase) {
      const response = badRequest('ALREADY_PURCHASED', 'You have already purchased this template')
      return setCorsHeaders(response, origin)
    }

    // Get user's current points
    const user = await prisma.user.findUnique({
      where: { id: authSession.userId },
      select: { points: true, nickname: true }
    })

    if (!user) {
      const response = notFound('User not found')
      return setCorsHeaders(response, origin)
    }

    // Check if user has enough points
    if (user.points < template.price) {
      const response = badRequest('INSUFFICIENT_POINTS', 'Insufficient points to purchase this template', {
        required: template.price,
        available: user.points,
        shortage: template.price - user.points
      })
      return setCorsHeaders(response, origin)
    }

    // Process purchase in transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // Create purchase record
      const newPurchase = await tx.templatePurchase.create({
        data: {
          buyer_id: authSession.userId,
          template_id: templateId,
          price: template.price,
          payment_method: 'POINTS',
          status: 'COMPLETED'
        },
        select: {
          id: true,
          price: true,
          payment_method: true,
          status: true,
          createdAt: true
        }
      })

      // Deduct points from buyer
      const updatedUser = await tx.user.update({
        where: { id: authSession.userId },
        data: { points: { decrement: template.price } },
        select: { points: true }
      })

      // Record point transaction for buyer
      await tx.pointTransaction.create({
        data: {
          user_id: authSession.userId,
          type: 'SPEND',
          amount: template.price,
          balance_after: updatedUser.points,
          source: 'template_purchase',
          reference_id: newPurchase.id,
          reference_type: 'purchase',
          description: `购买模板: ${template.title}`
        }
      })

      // Award points to template creator (70% of price)
      const creatorEarning = Math.floor(template.price * 0.7)
      if (creatorEarning > 0 && template.creator_id) {
        const updatedCreator = await tx.user.update({
          where: { id: template.creator_id },
          data: { points: { increment: creatorEarning } },
          select: { points: true }
        })

        await tx.pointTransaction.create({
          data: {
            user_id: template.creator_id,
            type: 'EARN',
            amount: creatorEarning,
            balance_after: updatedCreator.points,
            source: 'template_sale',
            reference_id: newPurchase.id,
            reference_type: 'purchase',
            description: `模板销售收入: ${template.title}`
          }
        })
      }

      // Update template usage count
      await tx.surveyTemplate.update({
        where: { id: templateId },
        data: { usage_count: { increment: 1 } }
      })

      return {
        ...newPurchase,
        template: {
          id: template.id,
          title: template.title
        },
        buyer_points_remaining: updatedUser.points
      }
    })

    console.log(`Template purchased: ${template.title} (${templateId}) by user ${authSession.userId}`)

    const response = ok({
      ...purchase,
      message: 'Template purchased successfully'
    }, 201)
    
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Template purchase error:', error)
    
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
    
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = handleDatabaseError(error)
      const response = badRequest(dbError.code, dbError.message, dbError.details)
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
