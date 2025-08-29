# 智问数研 - AI智能问卷调研系统

智问数研是一个以AI驱动的智能问卷调研平台，致力于为企业客户提供高效、智能的数据收集与分析解决方案，同时为C端用户创造有价值的参与体验。

## 📁 项目结构

```
zhiwen-shuyuan/                     # 智问数研项目根目录
├── frontend/                       # 前端应用 (Next.js 15)
│   ├── src/
│   │   ├── app/                   # App Router 页面
│   │   │   ├── page.tsx           # 首页
│   │   │   ├── survey/            # 问卷答题页
│   │   │   ├── result/            # 结果分析页
│   │   │   ├── profile/           # 用户建档页
│   │   │   ├── admin/             # 管理后台
│   │   │   ├── api/               # API Routes
│   │   │   ├── globals.css        # 全局样式
│   │   │   └── layout.tsx         # 根布局
│   │   ├── components/            # React组件
│   │   │   ├── ui/               # 基础UI组件
│   │   │   ├── survey/           # 问卷相关组件
│   │   │   └── admin/            # 管理后台组件
│   │   ├── lib/                  # 前端工具库
│   │   ├── store/                # Zustand状态管理
│   │   ├── hooks/                # 自定义Hooks
│   │   └── types/                # 前端类型定义
│   ├── public/                    # 静态资源
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vercel.json               # Vercel部署配置
├── backend/                       # 后端API服务 (Node.js/Express)
│   ├── src/
│   │   ├── controllers/          # 控制器
│   │   ├── services/             # 业务逻辑层
│   │   │   ├── llm/             # LLM服务抽象层
│   │   │   │   ├── index.ts     # 服务管理器
│   │   │   │   ├── huggingface.ts
│   │   │   │   ├── openai.ts
│   │   │   │   ├── deepseek.ts
│   │   │   │   └── qwen.ts
│   │   │   ├── ai/              # AI分析服务
│   │   │   ├── database/        # 数据库服务
│   │   │   └── email/           # 邮件服务
│   │   ├── middleware/           # 中间件
│   │   ├── routes/              # 路由定义
│   │   ├── utils/               # 后端工具函数
│   │   ├── config/              # 配置文件
│   │   ├── types/               # 后端类型定义
│   │   └── index.ts             # 应用入口
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── shared/                        # 共享类型和工具
│   ├── src/
│   │   ├── types/               # 共享类型定义
│   │   ├── utils/               # 共享工具函数
│   │   └── index.ts             # 导出文件
│   ├── package.json
│   └── tsconfig.json
├── docs/                          # 项目文档
│   ├── DEPLOYMENT.md             # 部署指南
│   ├── API.md                    # API文档
│   ├── DEVELOPMENT.md            # 开发指南
│   └── ARCHITECTURE.md           # 架构说明
├── .github/                       # GitHub Actions CI/CD
│   └── workflows/
│       ├── ci.yml               # 持续集成
│       └── deploy.yml           # 部署流程
├── database/                      # 数据库相关
│   ├── schema.sql               # 数据库结构
│   ├── migrations/              # 数据库迁移
│   └── seeds/                   # 初始数据
├── nginx/                         # Nginx配置（生产环境）
│   ├── nginx.conf
│   └── ssl/
├── package.json                   # 根项目配置 (Monorepo)
├── docker-compose.yml             # Docker开发环境
├── .env.example                   # 环境变量模板
├── .gitignore
└── README.md                      # 项目说明
```

## 🚀 项目特性

- ✅ **移动优先设计** - 响应式UI，完美适配手机、平板和桌面端
- ✅ **AI智能分析** - 基于Hugging Face API的个性化风险评估
- ✅ **实时数据同步** - 基于Supabase的实时数据库
- ✅ **现代化技术栈** - Next.js 15 + TypeScript + TailwindCSS
- ✅ **状态管理** - Zustand轻量级状态管理
- ✅ **动画效果** - Framer Motion流畅动画
- ✅ **本地缓存** - 支持答题续答功能
- ✅ **管理后台** - 完整的数据统计和管理功能

## 🛠️ 技术栈

### 前端技术
- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: TailwindCSS + CSS-in-JS
- **状态管理**: Zustand
- **动画**: Framer Motion
- **图表**: Recharts
- **表单**: React Hook Form + Zod
- **UI组件**: 自定义组件库

### 后端技术
- **API**: Next.js API Routes + Edge Functions
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT + Row-Level Security
- **AI服务**: Hugging Face API
- **文件处理**: ExcelJS

### 部署架构
- **部署平台**: Vercel
- **CDN**: Cloudflare
- **监控**: Vercel Analytics + Sentry

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 首页
│   ├── survey/            # 问卷答题页
│   ├── result/            # 结果分析页
│   ├── profile/           # 用户建档页
│   ├── admin/             # 管理后台
│   │   ├── layout.tsx     # 后台布局
│   │   ├── page.tsx       # 仪表板
│   │   └── surveys/       # 问卷管理
│   ├── api/               # API Routes (待实现)
│   ├── globals.css        # 全局样式
│   └── layout.tsx         # 根布局
├── components/            # React组件
│   ├── ui/               # 基础UI组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Loading.tsx
│   ├── survey/           # 问卷相关组件
│   │   ├── QuestionCard.tsx
│   │   ├── ProgressBar.tsx
│   │   └── NavigationButtons.tsx
│   └── admin/            # 管理后台组件 (待扩展)
├── lib/                  # 工具库
│   └── utils.ts          # 通用工具函数
├── store/                # 状态管理
│   ├── surveyStore.ts    # 问卷状态
│   ├── userStore.ts      # 用户状态
│   └── adminStore.ts     # 管理后台状态
├── types/                # TypeScript类型定义
│   └── index.ts
└── hooks/                # 自定义Hooks (待实现)
```

## 🎨 UI设计特色

### 设计系统
- **主色调**: 品牌紫色 (#7C3AED)
- **字体**: Inter字体系统
- **圆角**: 统一的圆角设计语言
- **阴影**: 分层阴影系统
- **动画**: 流畅的过渡动画

### 响应式设计
- **移动端**: < 768px (单列布局)
- **平板端**: 768px - 1024px (双列布局)
- **桌面端**: > 1024px (多列布局)

### 组件特性
- **自适应**: 所有组件支持多设备适配
- **可访问性**: 符合WCAG 2.1标准
- **主题化**: 支持深色/浅色主题切换
- **国际化**: 预留多语言支持接口

## 📱 页面功能

### 用户端页面
1. **首页 (`/`)**
   - 品牌展示和功能介绍
   - CTA按钮引导用户开始测试
   - 特性展示和流程说明

2. **问卷答题页 (`/survey`)**
   - 单题页面展示，支持左右滑动
   - 实时进度显示
   - 本地缓存续答功能
   - 移动端浮动导航

3. **结果分析页 (`/result`)**
   - AI生成的个性化分析报告
   - 五维风险雷达图展示
   - 详细建议和改进方案
   - 报告下载和分享功能

4. **用户建档页 (`/profile`)**
   - 个人信息收集和管理
   - 实时表单验证
   - 数据本地存储

### 管理后台页面
1. **仪表板 (`/admin`)**
   - 数据概览和统计图表
   - 实时活动监控
   - 快速操作入口

2. **问卷管理 (`/admin/surveys`)**
   - 问卷列表和搜索筛选
   - 问卷创建和编辑
   - 统计数据查看

3. **答题记录 (`/admin/answers`)** (待实现)
   - 答题记录管理
   - 数据导出功能

## 🔧 开发指南

### 环境要求
- Node.js 18+
- npm/yarn/pnpm

### 安装依赖
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发运行
```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

### 构建部署
```bash
npm run build
npm run start
```

### 代码检查
```bash
npm run lint
npm run type-check
```

## 🎯 核心功能实现

### 1. 问卷答题流程
- 支持单选、多选、文本等多种题型
- 实时答案保存和验证
- 流畅的页面切换动画
- 本地缓存防止数据丢失

### 2. AI分析引擎
- 集成Hugging Face API
- 个性化风险评估算法
- 多语言分析报告生成
- 置信度评估机制

### 3. 数据可视化
- Recharts图表库集成
- 雷达图风险展示
- 响应式图表设计
- 交互式数据展示

### 4. 状态管理
- Zustand轻量级状态管理
- 持久化存储支持
- 类型安全的状态更新
- 中间件支持

## 🔒 安全特性

- **数据加密**: 敏感数据加密存储
- **输入验证**: 严格的表单验证
- **XSS防护**: 内容安全策略
- **CSRF防护**: 跨站请求伪造防护

## 📈 性能优化

- **代码分割**: 按路由和组件分割
- **懒加载**: 非关键组件懒加载
- **图片优化**: Next.js Image组件
- **缓存策略**: 多层缓存机制

## 🚀 部署说明

### Vercel部署
1. 连接GitHub仓库
2. 配置环境变量
3. 自动部署和预览

### 环境变量
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
HUGGINGFACE_API_KEY=your-huggingface-key
NEXT_PUBLIC_APP_URL=your-app-url
```

## 📋 待实现功能

- [ ] 后端API接口实现
- [ ] Supabase数据库集成
- [ ] AI服务接口对接
- [ ] 用户认证系统
- [ ] 数据导出功能
- [ ] 邮件通知系统
- [ ] 多语言支持
- [ ] 深色主题模式

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 📄 许可证

MIT License

## 📞 联系方式

- 项目地址: [GitHub Repository]
- 问题反馈: [Issues]
- 文档地址: [Documentation]

---

**CRS Check** - 让合规检查更智能、更简单！
