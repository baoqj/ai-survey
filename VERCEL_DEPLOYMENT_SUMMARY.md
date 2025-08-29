# 智问数研AI智能问卷调研系统 - Vercel部署总结

## 🎯 部署架构

项目采用**前后端分离**的现代Vercel部署架构：

```
GitHub Repository: baoqj/ai-survey
├── 前端项目 (frontend/) → Vercel Project 1
└── 后端项目 (backend/)  → Vercel Project 2
```

## 📋 部署步骤

### 1. 后端API部署

**项目配置**:
- **仓库**: `baoqj/ai-survey`
- **根目录**: `backend`
- **项目名**: `ai-survey-backend`
- **框架**: Other (Serverless Functions)

**关键文件**:
- `backend/api/health.ts` - 健康检查API
- `backend/api/users.ts` - 用户管理API
- `backend/api/surveys.ts` - 问卷管理API
- `backend/api/ai.ts` - AI服务API
- `backend/vercel.json` - 后端配置
- `backend/package.json` - 依赖和Node版本

### 2. 前端应用部署

**项目配置**:
- **仓库**: `baoqj/ai-survey`
- **根目录**: `frontend`
- **项目名**: `ai-survey-frontend`
- **框架**: Next.js (自动检测)

**关键文件**:
- `frontend/vercel.json` - 前端配置和API重写规则
- `frontend/package.json` - 前端依赖

## 🔧 技术特点

### 后端 (Serverless Functions)
- **运行时**: `@vercel/node@3.0.7`
- **Node版本**: 18.x (固定)
- **函数格式**: Vercel Serverless Functions
- **CORS**: 自动配置跨域支持
- **API路径**: `/api/*`

### 前端 (Next.js)
- **框架**: Next.js 14 + TypeScript
- **API代理**: 通过rewrite规则代理到后端
- **安全头**: 完整的安全头配置
- **自动构建**: Vercel自动检测和构建

## 🌐 API路由映射

前端通过rewrite规则将API请求代理到后端：

```
前端请求: https://frontend-domain.vercel.app/api/health
实际转发: https://backend-domain.vercel.app/api/health
```

## 📝 部署检查清单

### 后端部署
- [ ] 创建后端Vercel项目
- [ ] 设置根目录为 `backend`
- [ ] 确认Node版本为18.x
- [ ] 部署成功并记录域名
- [ ] 测试API端点: `/api/health`

### 前端部署
- [ ] 创建前端Vercel项目
- [ ] 设置根目录为 `frontend`
- [ ] 更新 `frontend/vercel.json` 中的后端域名
- [ ] 部署成功
- [ ] 测试前端访问和API代理

## 🔍 测试端点

### 后端API测试
```bash
# 健康检查
curl https://your-backend-domain.vercel.app/api/health

# 用户API
curl https://your-backend-domain.vercel.app/api/users

# 问卷API
curl https://your-backend-domain.vercel.app/api/surveys

# AI服务API
curl -X POST https://your-backend-domain.vercel.app/api/ai \
  -H "Content-Type: application/json" \
  -d '{"action":"generate_survey","data":{"topic":"用户体验"}}'
```

### 前端API代理测试
```bash
# 通过前端代理访问后端API
curl https://your-frontend-domain.vercel.app/api/health
```

## ⚡ 性能优化

- **Serverless冷启动**: 后端函数按需启动
- **CDN缓存**: 前端静态资源全球CDN
- **API代理**: 避免跨域问题，提升性能
- **自动扩展**: 根据流量自动扩展

## 🔒 安全配置

- **CORS**: 后端配置跨域访问
- **安全头**: 前端配置完整安全头
- **HTTPS**: 全站HTTPS加密
- **环境变量**: 敏感信息通过环境变量管理

## 📊 监控和日志

- **Vercel Analytics**: 自动性能监控
- **函数日志**: 后端函数执行日志
- **构建日志**: 前端构建过程日志
- **错误追踪**: 实时错误监控

## 🚀 下一步

1. **环境变量配置**: 配置数据库、AI服务等环境变量
2. **域名绑定**: 绑定自定义域名
3. **SSL证书**: 配置SSL证书（Vercel自动提供）
4. **性能优化**: 根据监控数据优化性能
5. **功能扩展**: 继续开发和部署新功能

## 📞 支持

如遇到部署问题：
1. 检查Vercel部署日志
2. 确认根目录设置正确
3. 验证Node版本配置
4. 测试API端点连通性

---

**部署完成后，您将拥有一个完全现代化的、可扩展的AI智能问卷调研系统！**
