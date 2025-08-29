# 智问数研AI智能问卷调研系统 - Vercel部署指南

## 📋 部署前准备

### 1. 确认项目结构
项目已成功推送到GitHub仓库：https://github.com/baoqj/ai-survey

### 2. 项目技术栈
- **前端**: Next.js 14 + TypeScript + TailwindCSS
- **后端**: Next.js API Routes
- **数据库**: Supabase (PostgreSQL)
- **AI服务**: 支持多种LLM (OpenAI, DeepSeek, Qwen等)

## 🚀 Vercel部署步骤

### 步骤1: 登录Vercel
1. 访问 https://vercel.com
2. 使用GitHub账号登录
3. 授权Vercel访问您的GitHub仓库

### 步骤2: 导入项目
1. 点击 "New Project"
2. 选择 "Import Git Repository"
3. 找到并选择 `baoqj/ai-survey` 仓库
4. 点击 "Import"

### 步骤3: 配置项目设置
**Framework Preset**: Next.js
**Root Directory**: `frontend` (重要！)
**Build Command**: `npm run build`
**Output Directory**: `.next`
**Install Command**: `npm install`

### 步骤4: 配置环境变量
在Vercel项目设置中添加以下环境变量：

#### 必需的环境变量
```env
# 应用配置
NEXT_PUBLIC_APP_URL=https://your-app-domain.vercel.app
NODE_ENV=production

# Supabase配置 (需要创建Supabase项目)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AI服务配置 (至少配置一个)
OPENAI_API_KEY=your-openai-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
QWEN_API_KEY=your-qwen-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d
```

#### 可选的环境变量
```env
# 邮件服务
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password

# 监控服务
SENTRY_DSN=your-sentry-dsn
```

### 步骤5: 部署项目
1. 确认所有配置正确
2. 点击 "Deploy"
3. 等待构建完成（通常需要2-5分钟）

## 🔧 部署后配置

### 1. 设置自定义域名（可选）
1. 在Vercel项目设置中点击 "Domains"
2. 添加您的自定义域名
3. 按照提示配置DNS记录

### 2. 配置Supabase数据库
1. 访问 https://supabase.com
2. 创建新项目
3. 在SQL编辑器中运行数据库初始化脚本
4. 配置Row Level Security (RLS)
5. 更新Vercel环境变量中的Supabase配置

### 3. 测试部署
1. 访问部署的URL
2. 测试主要功能：
   - 用户注册/登录
   - 问卷创建
   - 问卷答题
   - AI分析功能

## 📊 监控和维护

### 1. Vercel Analytics
- 自动启用基础分析
- 查看访问量、性能指标
- 监控错误和异常

### 2. 日志查看
- 在Vercel控制台查看函数日志
- 监控API调用和错误

### 3. 性能优化
- 启用Edge Functions（如需要）
- 配置CDN缓存策略
- 优化图片和静态资源

## 🔍 常见问题解决

### 问题1: 构建失败
**可能原因**: 
- 依赖安装失败
- TypeScript类型错误
- 环境变量缺失

**解决方案**:
1. 检查package.json依赖
2. 修复TypeScript错误
3. 确认所有必需环境变量已配置

### 问题2: API调用失败
**可能原因**:
- 环境变量配置错误
- API密钥无效
- 网络连接问题

**解决方案**:
1. 验证API密钥有效性
2. 检查环境变量拼写
3. 查看Vercel函数日志

### 问题3: 数据库连接失败
**可能原因**:
- Supabase配置错误
- 网络策略限制
- 认证失败

**解决方案**:
1. 验证Supabase URL和密钥
2. 检查数据库连接字符串
3. 确认RLS策略配置

## 📝 部署检查清单

- [ ] GitHub仓库已创建并推送代码
- [ ] Vercel项目已创建
- [ ] 根目录设置为 `frontend`
- [ ] 所有必需环境变量已配置
- [ ] Supabase项目已创建并配置
- [ ] 数据库表结构已初始化
- [ ] AI服务API密钥已配置
- [ ] 部署成功并可访问
- [ ] 主要功能测试通过
- [ ] 自定义域名已配置（如需要）
- [ ] 监控和分析已启用

## 🎯 下一步

1. **功能完善**: 根据PRD文档继续开发缺失功能
2. **性能优化**: 监控性能指标并优化
3. **用户测试**: 邀请用户测试并收集反馈
4. **安全加固**: 实施额外的安全措施
5. **扩展部署**: 考虑多环境部署策略

## 📞 技术支持

如遇到部署问题，请：
1. 查看Vercel部署日志
2. 检查GitHub Actions状态
3. 参考项目文档
4. 联系技术团队

---

**部署完成后，您的智问数研AI智能问卷调研系统将在以下地址可用：**
- 主域名: https://your-project-name.vercel.app
- 自定义域名: https://your-custom-domain.com（如已配置）
