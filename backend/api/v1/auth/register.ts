import { prisma, handleDatabaseError } from '../../../_lib/db'
import { createUserSchema } from '../../../_lib/schemas'
import { hashPassword, generateToken } from '../../../_lib/auth'
import { ok, badRequest, corsPreflightResponse, setCorsHeaders, parseJsonBody, getClientIP, checkRateLimit, tooManyRequests } from '../../../_lib/utils'

export const config = { runtime: 'nodejs' }

export default async function handler(req: Request) {
  const origin = req.headers.get('origin')
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(origin)
  }

  if (req.method !== 'POST') {
    const response = new Response(JSON.stringify({
      code: 'METHOD_NOT_ALLOWED',
      message: 'Only POST method allowed'
    }), { status: 405 })
    return setCorsHeaders(response, origin)
  }

  try {
    // Rate limiting
    const clientIP = getClientIP(req)
    const rateLimit = checkRateLimit(`register:${clientIP}`, 5, 15 * 60 * 1000) // 5 attempts per 15 minutes
    
    if (!rateLimit.allowed) {
      const response = tooManyRequests(Math.ceil((rateLimit.resetTime - Date.now()) / 1000))
      return setCorsHeaders(response, origin)
    }

    // Parse and validate request body
    const body = await parseJsonBody(req)
    const parsed = createUserSchema.safeParse(body)
    
    if (!parsed.success) {
      const response = badRequest('VALIDATION_ERROR', 'Invalid input data', parsed.error.flatten())
      return setCorsHeaders(response, origin)
    }

    const { email, password, nickname, phone, user_type } = parsed.data

    // Hash password
    const password_hash = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        nickname,
        phone,
        user_type,
        status: 'ACTIVE',
        points: 100, // Welcome bonus
        level: 1
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        user_type: true,
        points: true,
        level: true,
        createdAt: true
      }
    })

    // Create user profile
    await prisma.userProfile.create({
      data: {
        user_id: user.id
      }
    })

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.user_type
    })

    // Log registration
    console.log(`User registered: ${user.email} (${user.id})`)

    const response = ok({
      user,
      token,
      message: 'Registration successful'
    }, 201)
    
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle database errors
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = handleDatabaseError(error)
      const response = badRequest(dbError.code, dbError.message, dbError.details)
      return setCorsHeaders(response, origin)
    }

    const response = new Response(JSON.stringify({
      code: 'REGISTRATION_ERROR',
      message: 'Registration failed',
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
    
    return setCorsHeaders(response, origin)
  }
}
