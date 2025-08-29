import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { createError } from './errorHandler'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    user_type: string
    iat: number
    exp: number
  }
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Access token is required', 401, 'UNAUTHORIZED')
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any
      req.user = decoded
      next()
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw createError('Token has expired', 401, 'TOKEN_EXPIRED')
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        throw createError('Invalid token', 401, 'INVALID_TOKEN')
      } else {
        throw createError('Token verification failed', 401, 'TOKEN_VERIFICATION_FAILED')
      }
    }
  } catch (error) {
    next(error)
  }
}

export const optionalAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      try {
        const decoded = jwt.verify(token, config.jwt.secret) as any
        req.user = decoded
      } catch (jwtError) {
        // 可选认证，忽略token错误
      }
    }
    
    next()
  } catch (error) {
    next(error)
  }
}

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Authentication required', 401, 'UNAUTHORIZED'))
    }

    if (!roles.includes(req.user.user_type)) {
      return next(createError('Insufficient permissions', 403, 'FORBIDDEN'))
    }

    next()
  }
}

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  })
}

export const verifyToken = (token: string): any => {
  return jwt.verify(token, config.jwt.secret)
}
