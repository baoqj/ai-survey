# 部署指南

## 🚀 Vercel 部署

### 前置条件
- GitHub 账号
- Vercel 账号
- Supabase 项目
- AI 服务 API 密钥

### 1. 准备代码仓库
```bash
# 克隆项目
git clone https://github.com/your-username/crs-check.git
cd crs-check

# 安装依赖
npm install

# 构建共享包
npm run build:shared
```

### 2. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

#### 必需的环境变量
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
HUGGINGFACE_API_KEY=your-huggingface-key
JWT_SECRET=your-jwt-secret-32-chars-minimum
```

#### 可选的环境变量
```
OPENAI_API_KEY=your-openai-key
DEEPSEEK_API_KEY=your-deepseek-key
QWEN_API_KEY=your-qwen-key
SENTRY_DSN=your-sentry-dsn
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

### 3. 部署步骤

#### 方法一：通过 Vercel Dashboard
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入 GitHub 仓库
4. 设置项目配置：
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. 添加环境变量
6. 点击 "Deploy"

#### 方法二：通过 Vercel CLI
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署项目
cd frontend
vercel --prod
```

#### 方法三：通过 GitHub Actions（推荐）
1. 在 GitHub 仓库设置中添加 Secrets：
   ```
   VERCEL_TOKEN=your-vercel-token
   VERCEL_ORG_ID=your-org-id
   VERCEL_PROJECT_ID=your-project-id
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   PRODUCTION_APP_URL=https://your-domain.com
   ```

2. 推送代码到 main 分支：
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

3. GitHub Actions 将自动部署到 Vercel

### 4. 自定义域名配置

1. 在 Vercel 项目设置中添加自定义域名
2. 配置 DNS 记录：
   ```
   Type: CNAME
   Name: your-subdomain (或 @)
   Value: cname.vercel-dns.com
   ```
3. 等待 DNS 传播（通常几分钟到几小时）

## 🐳 Docker 部署

### 开发环境
```bash
# 启动开发环境
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 生产环境
```bash
# 启动生产环境
docker-compose --profile production up -d

# 更新服务
docker-compose pull
docker-compose up -d
```

## 🔧 环境配置

### Supabase 设置
1. 创建 Supabase 项目
2. 运行数据库迁移：
   ```sql
   -- 在 Supabase SQL Editor 中运行
   -- 参考 database/schema.sql
   ```
3. 配置 Row Level Security (RLS)
4. 获取项目 URL 和 API 密钥

### AI 服务配置

#### Hugging Face
1. 注册 [Hugging Face](https://huggingface.co/) 账号
2. 创建 API Token
3. 设置环境变量 `HUGGINGFACE_API_KEY`

#### OpenAI（可选）
1. 注册 [OpenAI](https://openai.com/) 账号
2. 创建 API Key
3. 设置环境变量 `OPENAI_API_KEY`

#### DeepSeek（可选）
1. 注册 [DeepSeek](https://www.deepseek.com/) 账号
2. 获取 API Key
3. 设置环境变量 `DEEPSEEK_API_KEY`

## 📊 监控和日志

### Vercel Analytics
- 在 Vercel Dashboard 中启用 Analytics
- 查看访问统计和性能指标

### Sentry 错误监控
```bash
# 安装 Sentry
npm install @sentry/nextjs

# 配置 Sentry
# 参考 frontend/sentry.client.config.js
```

### 日志管理
- 生产环境日志通过 Vercel Functions 查看
- 开发环境日志在控制台输出

## 🔒 安全配置

### HTTPS 配置
- Vercel 自动提供 HTTPS
- 自定义域名自动获取 SSL 证书

### 环境变量安全
- 敏感信息使用环境变量
- 不要在代码中硬编码密钥
- 定期轮换 API 密钥

### CORS 配置
```javascript
// 在 next.config.js 中配置
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
      ],
    },
  ]
}
```

## 🚨 故障排除

### 常见问题

1. **构建失败**
   - 检查环境变量是否正确设置
   - 确保所有依赖都已安装
   - 查看构建日志获取详细错误信息

2. **API 调用失败**
   - 检查 API 密钥是否有效
   - 确认网络连接正常
   - 查看服务器日志

3. **数据库连接问题**
   - 验证 Supabase 连接字符串
   - 检查数据库权限设置
   - 确认 RLS 策略正确

### 性能优化

1. **启用缓存**
   ```javascript
   // 在 API 路由中添加缓存头
   res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
   ```

2. **图片优化**
   - 使用 Next.js Image 组件
   - 配置图片域名白名单

3. **代码分割**
   - 使用动态导入
   - 懒加载非关键组件

## 📈 扩展部署

### 多环境部署
- 开发环境：`develop` 分支自动部署
- 预览环境：PR 自动创建预览部署
- 生产环境：`main` 分支部署到生产

### 蓝绿部署
```bash
# 使用 Vercel 别名进行蓝绿部署
vercel --prod --name blue
vercel alias blue.vercel.app your-domain.com
```

### 回滚策略
```bash
# 回滚到上一个版本
vercel rollback your-domain.com
```
