import { Router, Request, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()

// 健康检查
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: process.memoryUsage(),
    services: {
      database: 'OK', // TODO: 实际检查数据库连接
      ai: 'OK', // TODO: 实际检查AI服务
    }
  }

  res.status(200).json({
    data: healthCheck,
    timestamp: new Date().toISOString()
  })
}))

// 详细健康检查
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const detailedCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    services: {
      database: {
        status: 'OK',
        responseTime: 0 // TODO: 实际测试数据库响应时间
      },
      ai: {
        status: 'OK',
        responseTime: 0 // TODO: 实际测试AI服务响应时间
      },
      cache: {
        status: 'OK',
        responseTime: 0 // TODO: 实际测试缓存响应时间
      }
    }
  }

  res.status(200).json({
    data: detailedCheck,
    timestamp: new Date().toISOString()
  })
}))

export default router
