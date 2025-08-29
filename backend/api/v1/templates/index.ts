import { prisma, handleDatabaseError } from '../../../_lib/db'
import { paginationSchema, createTemplateSchema } from '../../../_lib/schemas'
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
    const rateLimit = checkRateLimit(`templates:${clientIP}`, 100, 15 * 60 * 1000) // 100 requests per 15 minutes
    
    if (!rateLimit.allowed) {
      const response = tooManyRequests(Math.ceil((rateLimit.resetTime - Date.now()) / 1000))
      return setCorsHeaders(response, origin)
    }

    if (req.method === 'GET') {
      return await handleGetTemplates(req, url, origin)
    }

    if (req.method === 'POST') {
      return await handleCreateTemplate(req, origin)
    }

    const response = methodNotAllowed(['GET', 'POST'])
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Templates API error:', error)
    
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

async function handleGetTemplates(req: Request, url: URL, origin?: string) {
  try {
    // Get session (optional for public templates)
    const session = await getSession(req)

    // Parse pagination parameters
    const pagination = parseQuery(url, paginationSchema)
    const { page, pageSize } = pagination

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
      is_public: true
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

    const priceFilter = url.searchParams.get('price')
    if (priceFilter === 'free') {
      where.price = 0
    } else if (priceFilter === 'paid') {
      where.price = { gt: 0 }
    }

    // Get templates with pagination
    const [templates, total] = await Promise.all([
      prisma.surveyTemplate.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          tags: true,
          price: true,
          usage_count: true,
          rating: true,
          rating_count: true,
          createdAt: true,
          questions: true // Include questions for preview
        },
        orderBy: [
          { rating: 'desc' },
          { usage_count: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.surveyTemplate.count({ where })
    ])

    // Get categories for filtering
    const categories = await prisma.surveyTemplate.groupBy({
      by: ['category'],
      where: { status: 'ACTIVE', is_public: true },
      _count: { id: true }
    })

    // Check if user has purchased templates (if authenticated)
    let purchasedTemplates: string[] = []
    if (!session.anonymous) {
      const purchases = await prisma.templatePurchase.findMany({
        where: { 
          buyer_id: session.userId,
          status: 'COMPLETED'
        },
        select: { template_id: true }
      })
      purchasedTemplates = purchases.map(p => p.template_id)
    }

    const response = ok({
      templates: templates.map(template => ({
        ...template,
        is_purchased: purchasedTemplates.includes(template.id),
        question_count: Array.isArray(template.questions) ? template.questions.length : 0
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total
      },
      categories: categories.map(c => ({
        name: c.category,
        count: c._count.id
      }))
    })
    
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Get templates error:', error)
    throw error
  }
}

async function handleCreateTemplate(req: Request, origin?: string) {
  try {
    // Require authentication for creating templates
    const session = await getSession(req)
    const authSession = requireAuth(session)

    // Parse and validate request body
    const body = await parseJsonBody(req)
    const parsed = createTemplateSchema.safeParse(body)
    
    if (!parsed.success) {
      const response = badRequest('VALIDATION_ERROR', 'Invalid template data', parsed.error.flatten())
      return setCorsHeaders(response, origin)
    }

    const templateData = parsed.data

    // Create template
    const template = await prisma.surveyTemplate.create({
      data: {
        creator_id: authSession.userId,
        title: templateData.title,
        description: templateData.description,
        questions: templateData.questions,
        category: templateData.category,
        tags: templateData.tags,
        price: templateData.price,
        is_public: templateData.is_public,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        tags: true,
        price: true,
        is_public: true,
        createdAt: true
      }
    })

    // Award points for creating template (if it's public and free)
    if (templateData.is_public && templateData.price === 0) {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: authSession.userId },
          data: { points: { increment: 100 } }
        })

        await tx.pointTransaction.create({
          data: {
            user_id: authSession.userId,
            type: 'EARN',
            amount: 100,
            balance_after: 0, // Will be updated by trigger or separate query
            source: 'template_create',
            reference_id: template.id,
            reference_type: 'template',
            description: '创建公共模板获得积分'
          }
        })
      })
    }

    console.log(`Template created: ${template.title} (${template.id}) by user ${authSession.userId}`)

    const response = ok(template, 201)
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Create template error:', error)
    
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = handleDatabaseError(error)
      const response = badRequest(dbError.code, dbError.message, dbError.details)
      return setCorsHeaders(response, origin)
    }

    throw error
  }
}
