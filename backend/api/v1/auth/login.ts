import { prisma } from '../../../_lib/db'
import { loginSchema } from '../../../_lib/schemas'
import { verifyPassword, generateToken } from '../../../_lib/auth'
import { ok, badRequest, unauthorized, corsPreflightResponse, setCorsHeaders, parseJsonBody, getClientIP, checkRateLimit, tooManyRequests } from '../../../_lib/utils'

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
    const rateLimit = checkRateLimit(`login:${clientIP}`, 10, 15 * 60 * 1000) // 10 attempts per 15 minutes
    
    if (!rateLimit.allowed) {
      const response = tooManyRequests(Math.ceil((rateLimit.resetTime - Date.now()) / 1000))
      return setCorsHeaders(response, origin)
    }

    // Parse and validate request body
    const body = await parseJsonBody(req)
    const parsed = loginSchema.safeParse(body)
    
    if (!parsed.success) {
      const response = badRequest('VALIDATION_ERROR', 'Invalid input data', parsed.error.flatten())
      return setCorsHeaders(response, origin)
    }

    const { email, password } = parsed.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password_hash: true,
        nickname: true,
        user_type: true,
        status: true,
        points: true,
        level: true,
        last_login_at: true
      }
    })

    if (!user) {
      const response = unauthorized('Invalid email or password')
      return setCorsHeaders(response, origin)
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      const response = unauthorized('Account is not active')
      return setCorsHeaders(response, origin)
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)
    
    if (!isValidPassword) {
      const response = unauthorized('Invalid email or password')
      return setCorsHeaders(response, origin)
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    })

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.user_type
    })

    // Prepare user data (exclude password_hash)
    const userData = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      user_type: user.user_type,
      points: user.points,
      level: user.level,
      last_login_at: user.last_login_at
    }

    // Log login
    console.log(`User logged in: ${user.email} (${user.id})`)

    const response = ok({
      user: userData,
      token,
      message: 'Login successful'
    })
    
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('Login error:', error)
    
    const response = new Response(JSON.stringify({
      code: 'LOGIN_ERROR',
      message: 'Login failed',
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
    
    return setCorsHeaders(response, origin)
  }
}
