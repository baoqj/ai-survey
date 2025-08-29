import winston from 'winston'
import { config } from '../config'

// 创建日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// 开发环境格式
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`
  })
)

// 创建传输器
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: config.env === 'development' ? devFormat : logFormat
  })
]

// 生产环境添加文件日志
if (config.env === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat
    })
  )
}

// 创建logger实例
export const logger = winston.createLogger({
  level: config.monitoring.logLevel,
  format: logFormat,
  transports,
  exitOnError: false
})

// 流接口，用于morgan
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim())
  }
}

// 便捷方法
export const logError = (message: string, error?: Error, meta?: any) => {
  logger.error(message, {
    error: error?.message,
    stack: error?.stack,
    ...meta
  })
}

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta)
}

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta)
}

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta)
}
