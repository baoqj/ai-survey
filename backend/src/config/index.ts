import { z } from 'zod'

// 环境变量验证schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  
  // Supabase配置
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  
  // AI服务配置
  HUGGINGFACE_API_KEY: z.string(),
  OPENAI_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  QWEN_API_KEY: z.string().optional(),
  
  // JWT配置
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // 应用配置
  APP_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:3001'),
  
  // 邮件配置（可选）
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // 监控配置
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
})

// 验证环境变量
const env = envSchema.parse(process.env)

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  
  // 数据库配置
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // AI服务配置
  ai: {
    huggingface: {
      apiKey: env.HUGGINGFACE_API_KEY,
      baseUrl: 'https://api-inference.huggingface.co',
      models: {
        analysis: 'microsoft/DialoGPT-medium',
        translation: 'Helsinki-NLP/opus-mt-zh-en',
        sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      },
    },
    openai: {
      apiKey: env.OPENAI_API_KEY,
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
    },
    deepseek: {
      apiKey: env.DEEPSEEK_API_KEY,
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
    },
    qwen: {
      apiKey: env.QWEN_API_KEY,
      baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
      model: 'qwen-turbo',
    },
  },
  
  // JWT配置
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  
  // 应用URL
  urls: {
    app: env.APP_URL,
    api: env.API_URL,
  },
  
  // CORS配置
  cors: {
    origins: [
      env.APP_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      ...(env.NODE_ENV === 'development' ? ['http://localhost:3002'] : []),
    ],
  },
  
  // 邮件配置
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  
  // 监控配置
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    logLevel: env.LOG_LEVEL,
  },
  
  // 速率限制配置
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP最多100个请求
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
  
  // 文件上传配置
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ],
  },
  
  // 缓存配置
  cache: {
    ttl: 5 * 60 * 1000, // 5分钟
    maxSize: 100, // 最多缓存100个项目
  },
  
  // AI分析配置
  analysis: {
    timeout: 30000, // 30秒超时
    retryAttempts: 3,
    retryDelay: 1000, // 1秒延迟
  },
}

export type Config = typeof config
