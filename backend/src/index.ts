import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createServer } from 'http'

import { config } from './config'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'
import { authMiddleware } from './middleware/auth'

// 路由导入
import surveyRoutes from './routes/surveys'
import userRoutes from './routes/users'
import responseRoutes from './routes/responses'
import aiRoutes from './routes/ai'
import adminRoutes from './routes/admin'
import healthRoutes from './routes/health'

// 加载环境变量
dotenv.config()

const app = express()
const server = createServer(app)

// 基础中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api-inference.huggingface.co"],
    },
  },
}))

app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(compression())
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 速率限制
app.use(rateLimiter)

// 健康检查路由（无需认证）
app.use('/api/health', healthRoutes)

// API路由
app.use('/api/surveys', surveyRoutes)
app.use('/api/users', userRoutes)
app.use('/api/responses', responseRoutes)
app.use('/api/ai', aiRoutes)

// 管理后台路由（需要认证）
app.use('/api/admin', authMiddleware, adminRoutes)

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'API endpoint not found',
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  })
})

// 错误处理中间件
app.use(errorHandler)

// 启动服务器
const PORT = config.port || 3001

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`)
  logger.info(`📝 Environment: ${config.env}`)
  logger.info(`🔗 API Base URL: http://localhost:${PORT}/api`)
})

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

export default app
