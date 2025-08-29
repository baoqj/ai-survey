# 智问数研 - 前端应用

智问数研是一个以AI驱动的智能问卷调研平台前端应用。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: TailwindCSS
- **UI组件**: 自定义组件库
- **动画**: Framer Motion
- **图标**: Lucide React

## 功能特性

### MVP版本功能
- ✅ 响应式首页设计
- ✅ 问卷调研页面
- ✅ 基础导航组件
- ✅ 问卷答题流程
- ✅ 进度指示器
- ✅ 多种题型支持（单选、多选、文本）

### 页面结构
- `/` - 首页，展示产品介绍和功能特性
- `/survey` - 问卷调研页面，支持答题流程

## 开发指南

### 安装依赖
```bash
# 在项目根目录运行
yarn install
```

### 启动开发服务器
```bash
# 启动前端开发服务器
yarn dev:frontend

# 或者在frontend目录中运行
cd frontend && npm run dev
```

### 构建生产版本
```bash
# 构建前端应用
yarn build:frontend

# 或者在frontend目录中运行
cd frontend && npm run build
```

## 项目结构

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router页面
│   │   ├── globals.css     # 全局样式
│   │   ├── layout.tsx      # 根布局
│   │   ├── page.tsx        # 首页
│   │   └── survey/         # 问卷页面
│   │       └── page.tsx
│   ├── components/         # 可复用组件
│   │   ├── ui/            # UI基础组件
│   │   │   ├── button.tsx
│   │   │   └── card.tsx
│   │   └── navigation.tsx  # 导航组件
│   └── lib/               # 工具函数
│       └── utils.ts
├── public/                # 静态资源
├── tailwind.config.js     # TailwindCSS配置
├── next.config.js         # Next.js配置
└── package.json           # 依赖配置
```

## 设计系统

### 颜色主题
- **主色调**: 蓝色系 (#2563eb)
- **成功色**: 绿色 (#10b981)
- **警告色**: 橙色 (#f59e0b)
- **错误色**: 红色 (#ef4444)

### 组件规范
- 使用TailwindCSS进行样式设计
- 遵循响应式设计原则
- 支持深色模式（未来扩展）

## 开发规范

- 使用TypeScript进行类型安全开发
- 遵循ESLint代码规范
- 使用Prettier进行代码格式化
- 组件采用函数式组件 + Hooks

## 部署

项目支持部署到Vercel平台：

1. 连接GitHub仓库到Vercel
2. 设置构建命令：`yarn build:frontend`
3. 设置输出目录：`frontend/.next`

## 后续开发计划

- [ ] 用户认证系统
- [ ] AI问卷生成功能
- [ ] 数据可视化图表
- [ ] 问卷模板市场
- [ ] 移动端优化
- [ ] 多语言支持
