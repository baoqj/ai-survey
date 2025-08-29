import { Request, Response, NextFunction } from 'express'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { config } from '../config'

// 创建速率限制器
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req: Request) => req.ip,
  points: config.rateLimit.max, // 请求数量
  duration: config.rateLimit.windowMs / 1000, // 时间窗口（秒）
})

// API速率限制器
const apiRateLimiter = new RateLimiterMemory({
  keyGenerator: (req: Request) => `api_${req.ip}`,
  points: 1000, // API每小时1000次请求
  duration: 3600, // 1小时
})

// AI服务速率限制器
const aiRateLimiter = new RateLimiterMemory({
  keyGenerator: (req: Request) => `ai_${req.ip}`,
  points: 50, // AI服务每小时50次请求
  duration: 3600, // 1小时
})

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await rateLimiter.consume(req.ip)
    next()
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1
    res.set('Retry-After', String(secs))
    res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests, please try again later.',
        retryAfter: secs,
      },
      timestamp: new Date().toISOString(),
    })
  }
}

export const apiRateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await apiRateLimiter.consume(req.ip)
    next()
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1
    res.set('Retry-After', String(secs))
    res.status(429).json({
      error: {
        code: 'API_RATE_LIMIT_EXCEEDED',
        message: 'API rate limit exceeded, please try again later.',
        retryAfter: secs,
      },
      timestamp: new Date().toISOString(),
    })
  }
}

export const aiRateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await aiRateLimiter.consume(req.ip)
    next()
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1
    res.set('Retry-After', String(secs))
    res.status(429).json({
      error: {
        code: 'AI_RATE_LIMIT_EXCEEDED',
        message: 'AI service rate limit exceeded, please try again later.',
        retryAfter: secs,
      },
      timestamp: new Date().toISOString(),
    })
  }
}

export { rateLimiterMiddleware as rateLimiter }
