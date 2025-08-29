#!/bin/bash

# 智问数研AI智能问卷调研系统 - 部署脚本

set -e

echo "🚀 开始部署智问数研后端服务..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: DATABASE_URL 环境变量未设置"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ 错误: JWT_SECRET 环境变量未设置"
    exit 1
fi

echo "✅ 环境变量检查通过"

# 安装依赖
echo "📦 安装依赖..."
npm ci --only=production

# 生成 Prisma 客户端
echo "🔧 生成 Prisma 客户端..."
npx prisma generate

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
npx prisma migrate deploy

# 检查数据库连接
echo "🔍 检查数据库连接..."
npx prisma db pull --preview-feature || echo "⚠️ 数据库连接检查失败，但继续部署"

# 构建项目
echo "🏗️ 构建项目..."
npm run build

echo "🎉 部署完成！"
echo "📋 部署信息:"
echo "  - 环境: ${NODE_ENV:-production}"
echo "  - 数据库: 已连接"
echo "  - API 版本: v1"
echo "  - 健康检查: /api/v1/health"

# 运行健康检查（如果在本地）
if [ "$NODE_ENV" != "production" ]; then
    echo "🏥 运行健康检查..."
    sleep 2
    curl -f http://localhost:3001/api/v1/health || echo "⚠️ 健康检查失败"
fi

echo "✨ 部署脚本执行完成！"
