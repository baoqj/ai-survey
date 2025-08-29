# 部署架构设计

## 部署平台选择
- **主要平台**: Vercel (Serverless)
- **CDN**: Cloudflare
- **数据库**: Supabase (托管PostgreSQL)
- **AI服务**: Hugging Face API
- **监控**: Vercel Analytics + Sentry

## Vercel 部署配置

### 1. vercel.json 配置
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["hkg1", "sin1"],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/health",
      "destination": "/api/health"
    }
  ]
}
```

### 2. next.config.js 配置
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  images: {
    domains: ['supabase.co', 'avatars.githubusercontent.com'],
    formats: ['image/webp', 'image/avif']
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true
      }
    ];
  }
};

module.exports = nextConfig;
```

## 环境变量配置

### 1. 生产环境变量
```bash
# .env.production
NODE_ENV=production

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI 服务配置
HUGGINGFACE_API_KEY=your-huggingface-key
OPENAI_API_KEY=your-openai-key
DEEPSEEK_API_KEY=your-deepseek-key

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME="CRS Check"

# 安全配置
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# 监控配置
SENTRY_DSN=your-sentry-dsn
VERCEL_ANALYTICS_ID=your-analytics-id

# 邮件服务（可选）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. 开发环境变量
```bash
# .env.local
NODE_ENV=development

# Supabase 配置（开发环境）
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# AI 服务配置
HUGGINGFACE_API_KEY=your-huggingface-key

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="CRS Check (Dev)"

# 调试配置
DEBUG=true
LOG_LEVEL=debug
```

## CI/CD 流程

### 1. GitHub Actions 配置
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Run linting
        run: npm run lint
      
      - name: Type check
        run: npm run type-check

  deploy-preview:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel (Preview)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}
```

### 2. 数据库迁移脚本
```bash
#!/bin/bash
# scripts/migrate.sh

echo "Running database migrations..."

# 检查 Supabase CLI 是否安装
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# 运行迁移
supabase db push --db-url $SUPABASE_DB_URL

# 运行种子数据
supabase db seed --db-url $SUPABASE_DB_URL

echo "Database migration completed!"
```

## 性能优化配置

### 1. 缓存策略
```typescript
// lib/cache.ts
export class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, { data: any; expires: number }>();

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  set(key: string, data: any, ttl: number = 300000): void { // 5分钟默认TTL
    const expires = Date.now() + ttl;
    this.cache.set(key, { data, expires });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### 2. Edge Functions 配置
```typescript
// app/api/surveys/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const preferredRegion = ['hkg1', 'sin1']; // 亚洲区域

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 设置缓存头
  const response = NextResponse.json(data);
  response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  return response;
}
```

## 监控和日志

### 1. 健康检查端点
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      database: 'unknown',
      ai: 'unknown'
    }
  };

  try {
    // 检查数据库连接
    const { error: dbError } = await supabase
      .from('system_configs')
      .select('id')
      .limit(1);
    
    checks.services.database = dbError ? 'unhealthy' : 'healthy';

    // 检查AI服务（简单ping）
    try {
      const aiResponse = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
        }
      });
      checks.services.ai = aiResponse.ok ? 'healthy' : 'unhealthy';
    } catch {
      checks.services.ai = 'unhealthy';
    }

    // 如果任何服务不健康，返回503
    const isHealthy = Object.values(checks.services).every(status => status === 'healthy');
    checks.status = isHealthy ? 'healthy' : 'degraded';

    return NextResponse.json(checks, {
      status: isHealthy ? 200 : 503
    });
  } catch (error) {
    return NextResponse.json({
      ...checks,
      status: 'unhealthy',
      error: 'Health check failed'
    }, { status: 503 });
  }
}
```

### 2. 错误监控配置
```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // 过滤敏感信息
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.phone;
    }
    return event;
  }
});

export function logError(error: Error, context?: Record<string, any>) {
  console.error('Application Error:', error);
  
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

export function logInfo(message: string, data?: Record<string, any>) {
  console.log(message, data);
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.addBreadcrumb({
      message,
      data,
      level: 'info'
    });
  }
}
```

## 安全配置

### 1. 安全头配置
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 安全头
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CSP
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api-inference.huggingface.co https://*.supabase.co;"
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 2. 环境变量验证
```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  HUGGINGFACE_API_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
```

## 备份和恢复

### 1. 数据库备份脚本
```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "Creating database backup..."
pg_dump $SUPABASE_DB_URL > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "Backup created successfully: $BACKUP_FILE"
    
    # 压缩备份文件
    gzip $BACKUP_FILE
    echo "Backup compressed: $BACKUP_FILE.gz"
    
    # 删除7天前的备份
    find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
    echo "Old backups cleaned up"
else
    echo "Backup failed!"
    exit 1
fi
```

### 2. 自动化备份（GitHub Actions）
```yaml
# .github/workflows/backup.yml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *' # 每天凌晨2点
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Create backup
        run: |
          pg_dump ${{ secrets.SUPABASE_DB_URL }} > backup_$(date +%Y%m%d).sql
          
      - name: Upload to S3
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
          
      - name: Sync to S3
        run: |
          aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/database/
```
