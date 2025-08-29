import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

export type Session = { 
  userId?: string | null
  userType?: string
  anonymous: boolean 
}

export interface JWTPayload {
  userId: string
  email: string
  userType: string
  iat: number
  exp: number
}

// Get session from request headers
export async function getSession(req: Request): Promise<Session> {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { anonymous: true }
    }

    const token = authHeader.substring(7)
    const secret = process.env.JWT_SECRET

    if (!secret) {
      console.error('JWT_SECRET not configured')
      return { anonymous: true }
    }

    const decoded = jwt.verify(token, secret) as JWTPayload
    
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, status: true, user_type: true }
    })

    if (!user || user.status !== 'ACTIVE') {
      return { anonymous: true }
    }

    return {
      userId: decoded.userId,
      userType: decoded.userType,
      anonymous: false
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return { anonymous: true }
  }
}

// Generate JWT token
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET not configured')
  }

  return jwt.sign(payload, secret, {
    expiresIn: '7d',
    issuer: 'survey.aibao.me'
  })
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Require authentication middleware
export function requireAuth(session: Session) {
  if (session.anonymous) {
    throw new Error('Authentication required')
  }
  return session as Required<Session>
}

// Require specific user type
export function requireUserType(session: Session, allowedTypes: string[]) {
  const authSession = requireAuth(session)
  if (!allowedTypes.includes(authSession.userType)) {
    throw new Error('Insufficient permissions')
  }
  return authSession
}

// Generate secure random code
export function generateSecureCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone format (Chinese mobile)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

// Rate limiting helper (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  key: string, 
  maxRequests: number = 100, 
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    // New window or expired
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: maxRequests - 1, resetTime }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count++
  rateLimitStore.set(key, record)
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime }
}

// Clean up expired rate limit records
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes
