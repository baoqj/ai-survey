import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export interface AppError extends Error {
  statusCode?: number
  code?: string
  isOperational?: boolean
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 记录错误日志
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  })

  // 默认错误状态码
  const statusCode = err.statusCode || 500
  const code = err.code || 'INTERNAL_SERVER_ERROR'

  // 开发环境返回详细错误信息
  const isDevelopment = process.env.NODE_ENV === 'development'

  res.status(statusCode).json({
    error: {
      code,
      message: err.message,
      ...(isDevelopment && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  })
}

export const createError = (
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_SERVER_ERROR'
): AppError => {
  const error = new Error(message) as AppError
  error.statusCode = statusCode
  error.code = code
  error.isOperational = true
  return error
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
