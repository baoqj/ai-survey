#!/bin/bash

# 智问数研AI智能问卷调研系统 - 开发环境设置脚本

set -e

echo "🛠️ 设置智问数研开发环境..."

# 检查 Node.js 版本
NODE_VERSION=$(node --version)
echo "📋 Node.js 版本: $NODE_VERSION"

if ! node -e "process.exit(process.version.match(/v(\d+)/)[1] >= 20 ? 0 : 1)"; then
    echo "❌ 错误: 需要 Node.js 20 或更高版本"
    exit 1
fi

# 检查环境文件
if [ ! -f ".env" ]; then
    echo "📝 创建环境配置文件..."
    cp .env.example .env
    echo "⚠️ 请编辑 .env 文件并配置必要的环境变量"
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 生成 Prisma 客户端
echo "🔧 生成 Prisma 客户端..."
npx prisma generate

# 检查数据库连接
echo "🔍 检查数据库连接..."
if npx prisma db pull --preview-feature 2>/dev/null; then
    echo "✅ 数据库连接成功"
    
    # 运行迁移
    echo "🗄️ 运行数据库迁移..."
    npx prisma migrate dev --name init
    
    # 运行种子数据
    echo "🌱 初始化种子数据..."
    npx tsx prisma/seed.ts
else
    echo "⚠️ 数据库连接失败，请检查 DATABASE_URL 配置"
    echo "💡 提示: 确保数据库服务正在运行并且连接字符串正确"
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p logs
mkdir -p uploads

# 设置权限
chmod +x scripts/*.sh

echo "🎉 开发环境设置完成！"
echo ""
echo "📋 接下来的步骤:"
echo "  1. 编辑 .env 文件配置环境变量"
echo "  2. 运行 'npm run dev' 启动开发服务器"
echo "  3. 访问 http://localhost:3001/api/v1/health 检查服务状态"
echo ""
echo "🔗 有用的命令:"
echo "  - npm run dev          # 启动开发服务器"
echo "  - npx prisma studio    # 打开数据库管理界面"
echo "  - npm run lint         # 代码检查"
echo "  - npm test             # 运行测试"
echo ""
echo "📚 文档: 查看 README.md 获取更多信息"
