# 智问数研AI智能问卷调研系统 - 项目代码目录结构

## 项目概述
基于PRD文档要求，采用 Next.js + TypeScript + Supabase 技术栈的 Monorepo 架构，支持前后端分离、AI服务集成、向量检索等功能。

## 根目录结构
```
survey/
├── README.md                    # 项目说明文档
├── package.json                 # 根目录依赖管理
├── tsconfig.json               # TypeScript 全局配置
├── next.config.js              # Next.js 配置
├── tailwind.config.js          # TailwindCSS 配置
├── postcss.config.js           # PostCSS 配置
├── docker-compose.yml          # Docker 容器编排
├── .env.example                # 环境变量示例
├── .gitignore                  # Git 忽略文件
├── .eslintrc.js               # ESLint 配置
├── .prettierrc                # Prettier 配置
├── pnpm-workspace.yaml        # PNPM 工作空间配置
├── frontend/                   # 前端应用
├── backend/                    # 后端API服务
├── shared/                     # 共享类型和工具
├── docs/                       # 项目文档
├── prompt/                     # 项目需求和设计文档
├── scripts/                    # 构建和部署脚本
├── tests/                      # 端到端测试
└── deployment/                 # 部署配置
```

## Frontend 前端目录结构
```
frontend/
├── package.json               # 前端依赖
├── next.config.js            # Next.js 配置
├── tsconfig.json             # TypeScript 配置
├── vercel.json               # Vercel 部署配置
├── public/                   # 静态资源
│   ├── icons/               # 图标文件
│   ├── images/              # 图片资源
│   └── favicon.ico          # 网站图标
├── src/
│   ├── app/                 # Next.js 13+ App Router
│   │   ├── globals.css      # 全局样式
│   │   ├── layout.tsx       # 根布局组件
│   │   ├── page.tsx         # 首页
│   │   ├── loading.tsx      # 加载页面
│   │   ├── error.tsx        # 错误页面
│   │   ├── not-found.tsx    # 404页面
│   │   ├── (auth)/          # 认证相关页面
│   │   │   ├── login/       # 登录页面
│   │   │   ├── register/    # 注册页面
│   │   │   └── reset-password/ # 密码重置
│   │   ├── (dashboard)/     # 仪表板页面组
│   │   │   ├── dashboard/   # 用户仪表板
│   │   │   ├── surveys/     # 问卷管理
│   │   │   ├── responses/   # 答卷管理
│   │   │   ├── analytics/   # 数据分析
│   │   │   ├── templates/   # 模板市场
│   │   │   ├── points/      # 积分管理
│   │   │   └── profile/     # 个人资料
│   │   ├── (public)/        # 公开页面组
│   │   │   ├── survey/      # 问卷答题页面
│   │   │   │   └── [id]/    # 动态问卷页面
│   │   │   ├── marketplace/ # 模板市场
│   │   │   └── about/       # 关于页面
│   │   ├── admin/           # 管理员页面
│   │   │   ├── users/       # 用户管理
│   │   │   ├── content/     # 内容审核
│   │   │   ├── analytics/   # 平台分析
│   │   │   └── settings/    # 系统设置
│   │   └── api/             # API 路由
│   │       ├── auth/        # 认证API
│   │       ├── surveys/     # 问卷API
│   │       ├── responses/   # 答卷API
│   │       ├── ai/          # AI服务API
│   │       ├── analytics/   # 分析API
│   │       ├── points/      # 积分API
│   │       ├── templates/   # 模板API
│   │       └── admin/       # 管理API
│   ├── components/          # React 组件
│   │   ├── ui/              # 基础UI组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Chart.tsx
│   │   │   └── index.ts
│   │   ├── forms/           # 表单组件
│   │   │   ├── SurveyForm.tsx
│   │   │   ├── QuestionForm.tsx
│   │   │   ├── ResponseForm.tsx
│   │   │   └── index.ts
│   │   ├── layout/          # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   ├── survey/          # 问卷相关组件
│   │   │   ├── SurveyBuilder.tsx
│   │   │   ├── QuestionTypes.tsx
│   │   │   ├── SurveyPreview.tsx
│   │   │   └── ResponseViewer.tsx
│   │   ├── analytics/       # 分析图表组件
│   │   │   ├── ChartWrapper.tsx
│   │   │   ├── DataTable.tsx
│   │   │   └── StatCards.tsx
│   │   └── common/          # 通用组件
│   │       ├── Loading.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── SEOHead.tsx
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── useSurvey.ts
│   │   ├── useAnalytics.ts
│   │   ├── usePoints.ts
│   │   └── useLocalStorage.ts
│   ├── lib/                 # 工具库
│   │   ├── supabase.ts      # Supabase 客户端
│   │   ├── auth.ts          # 认证工具
│   │   ├── api.ts           # API 客户端
│   │   ├── utils.ts         # 通用工具函数
│   │   ├── validations.ts   # 表单验证
│   │   ├── constants.ts     # 常量定义
│   │   └── types.ts         # 类型定义
│   ├── store/               # 状态管理
│   │   ├── authStore.ts     # 认证状态
│   │   ├── surveyStore.ts   # 问卷状态
│   │   ├── uiStore.ts       # UI状态
│   │   └── index.ts
│   ├── styles/              # 样式文件
│   │   ├── globals.css      # 全局样式
│   │   ├── components.css   # 组件样式
│   │   └── utilities.css    # 工具样式
│   └── middleware.ts        # Next.js 中间件
└── .env.local              # 本地环境变量
```

## Backend 后端目录结构
```
backend/
├── package.json            # 后端依赖
├── tsconfig.json          # TypeScript 配置
├── .env.example           # 环境变量示例
├── src/
│   ├── index.ts           # 应用入口
│   ├── app.ts             # Express 应用配置
│   ├── server.ts          # 服务器启动
│   ├── config/            # 配置文件
│   │   ├── index.ts       # 配置入口
│   │   ├── database.ts    # 数据库配置
│   │   ├── redis.ts       # Redis 配置
│   │   ├── auth.ts        # 认证配置
│   │   └── ai.ts          # AI 服务配置
│   ├── controllers/       # 控制器
│   │   ├── authController.ts
│   │   ├── surveyController.ts
│   │   ├── responseController.ts
│   │   ├── aiController.ts
│   │   ├── analyticsController.ts
│   │   ├── pointsController.ts
│   │   ├── templateController.ts
│   │   └── adminController.ts
│   ├── services/          # 业务服务
│   │   ├── authService.ts
│   │   ├── surveyService.ts
│   │   ├── responseService.ts
│   │   ├── aiService.ts
│   │   ├── analyticsService.ts
│   │   ├── pointsService.ts
│   │   ├── emailService.ts
│   │   ├── fileService.ts
│   │   └── llm/           # LLM 服务
│   │       ├── index.ts
│   │       ├── openai.ts
│   │       ├── qwen.ts
│   │       └── deepseek.ts
│   ├── models/            # 数据模型
│   │   ├── User.ts
│   │   ├── Survey.ts
│   │   ├── Question.ts
│   │   ├── Response.ts
│   │   ├── Template.ts
│   │   ├── Points.ts
│   │   └── Analytics.ts
│   ├── routes/            # 路由定义
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── surveys.ts
│   │   ├── responses.ts
│   │   ├── ai.ts
│   │   ├── analytics.ts
│   │   ├── points.ts
│   │   ├── templates.ts
│   │   └── admin.ts
│   ├── middleware/        # 中间件
│   │   ├── auth.ts        # 认证中间件
│   │   ├── validation.ts  # 验证中间件
│   │   ├── rateLimit.ts   # 限流中间件
│   │   ├── cors.ts        # CORS 中间件
│   │   ├── logger.ts      # 日志中间件
│   │   └── error.ts       # 错误处理中间件
│   ├── utils/             # 工具函数
│   │   ├── logger.ts      # 日志工具
│   │   ├── encryption.ts  # 加密工具
│   │   ├── validation.ts  # 验证工具
│   │   ├── email.ts       # 邮件工具
│   │   ├── file.ts        # 文件处理工具
│   │   └── helpers.ts     # 辅助函数
│   ├── database/          # 数据库相关
│   │   ├── connection.ts  # 数据库连接
│   │   ├── migrations/    # 数据库迁移
│   │   ├── seeds/         # 数据种子
│   │   └── queries/       # SQL 查询
│   ├── ai/                # AI 相关功能
│   │   ├── promptTemplates.ts  # Prompt 模板
│   │   ├── vectorStore.ts      # 向量存储
│   │   ├── ragService.ts       # RAG 服务
│   │   ├── analysisEngine.ts   # 分析引擎
│   │   └── tagGenerator.ts     # 标签生成器
│   ├── jobs/              # 定时任务
│   │   ├── scheduler.ts   # 任务调度器
│   │   ├── emailJobs.ts   # 邮件任务
│   │   ├── analyticsJobs.ts # 分析任务
│   │   └── cleanupJobs.ts # 清理任务
│   ├── scripts/           # 脚本文件
│   │   ├── migrate.ts     # 数据库迁移脚本
│   │   ├── seed.ts        # 数据种子脚本
│   │   └── backup.ts      # 备份脚本
│   └── types/             # 类型定义
│       ├── express.d.ts   # Express 类型扩展
│       ├── api.ts         # API 类型
│       └── database.ts    # 数据库类型
├── tests/                 # 测试文件
│   ├── unit/              # 单元测试
│   ├── integration/       # 集成测试
│   └── fixtures/          # 测试数据
└── dist/                  # 编译输出目录
```

## Shared 共享模块目录结构
```
shared/
├── package.json           # 共享模块依赖
├── tsconfig.json         # TypeScript 配置
├── src/
│   ├── index.ts          # 导出入口
│   ├── types/            # 共享类型定义
│   │   ├── index.ts      # 类型导出
│   │   ├── user.ts       # 用户类型
│   │   ├── survey.ts     # 问卷类型
│   │   ├── response.ts   # 答卷类型
│   │   ├── analytics.ts  # 分析类型
│   │   ├── points.ts     # 积分类型
│   │   ├── template.ts   # 模板类型
│   │   └── api.ts        # API 类型
│   ├── utils/            # 共享工具函数
│   │   ├── index.ts      # 工具导出
│   │   ├── validation.ts # 验证工具
│   │   ├── formatting.ts # 格式化工具
│   │   ├── constants.ts  # 常量定义
│   │   └── helpers.ts    # 辅助函数
│   ├── schemas/          # Zod 验证模式
│   │   ├── user.ts       # 用户验证
│   │   ├── survey.ts     # 问卷验证
│   │   ├── response.ts   # 答卷验证
│   │   └── auth.ts       # 认证验证
│   └── enums/            # 枚举定义
│       ├── userRoles.ts  # 用户角色
│       ├── questionTypes.ts # 问题类型
│       ├── surveyStatus.ts  # 问卷状态
│       └── pointsActions.ts # 积分操作
└── dist/                 # 编译输出
```

## 其他目录说明

### docs/ 文档目录
```
docs/
├── README.md             # 文档说明
├── DEVELOPMENT.md        # 开发指南
├── DEPLOYMENT.md         # 部署指南
├── API.md               # API 文档
├── DATABASE.md          # 数据库文档
├── ARCHITECTURE.md      # 架构文档
├── CONTRIBUTING.md      # 贡献指南
└── CHANGELOG.md         # 更新日志
```

### scripts/ 脚本目录
```
scripts/
├── build.sh             # 构建脚本
├── deploy.sh            # 部署脚本
├── test.sh              # 测试脚本
├── backup.sh            # 备份脚本
└── setup.sh             # 环境设置脚本
```

### tests/ 测试目录
```
tests/
├── e2e/                 # 端到端测试
│   ├── auth.spec.ts     # 认证测试
│   ├── survey.spec.ts   # 问卷测试
│   └── admin.spec.ts    # 管理测试
├── fixtures/            # 测试数据
└── utils/               # 测试工具
```

### deployment/ 部署配置
```
deployment/
├── docker/              # Docker 配置
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.prod.yml
├── kubernetes/          # K8s 配置
├── nginx/               # Nginx 配置
└── ssl/                 # SSL 证书
```

## 技术栈对应关系

- **前端**: Next.js 13+ App Router + TypeScript + TailwindCSS
- **后端**: Express.js + TypeScript + Supabase
- **数据库**: PostgreSQL + pgvector (向量检索)
- **缓存**: Redis
- **AI服务**: OpenAI GPT-4o + Qwen + DeepSeek
- **部署**: Vercel (前端) + Railway/Render (后端)
- **监控**: Winston (日志) + Sentry (错误追踪)

这个目录结构完全符合PRD文档中的功能需求，支持问卷创建、AI生成、数据分析、积分系统、模板市场等所有核心功能。
