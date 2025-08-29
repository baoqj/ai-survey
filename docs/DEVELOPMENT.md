# 开发指南

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm/yarn/pnpm
- Git

### 1. 克隆项目
```bash
git clone https://github.com/your-username/crs-check.git
cd crs-check
```

### 2. 安装依赖
```bash
# 安装所有依赖（包括子项目）
npm install

# 或者分别安装
npm install                    # 根目录
cd frontend && npm install     # 前端
cd ../backend && npm install   # 后端
cd ../shared && npm install    # 共享包
```

### 3. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

### 4. 构建共享包
```bash
npm run build:shared
```

### 5. 启动开发服务器
```bash
# 同时启动前后端
npm run dev

# 或者分别启动
npm run dev:frontend    # 前端 (http://localhost:3000)
npm run dev:backend     # 后端 (http://localhost:3001)
```

## 📦 Monorepo 架构

### 工作区配置
项目使用 npm workspaces 管理多个包：

```json
{
  "workspaces": [
    "frontend",
    "backend", 
    "shared"
  ]
}
```

### 包依赖关系
```
frontend → shared
backend  → shared
```

### 常用命令
```bash
# 在根目录执行所有包的命令
npm run build          # 构建所有包
npm run test           # 测试所有包
npm run lint           # 检查所有包

# 在特定包中执行命令
npm run dev:frontend   # 只启动前端
npm run build:backend  # 只构建后端

# 为特定包安装依赖
npm install axios --workspace=backend
npm install react-query --workspace=frontend
```

## 🏗️ 开发流程

### 1. 功能开发流程
```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发功能
# 编写代码...

# 3. 运行测试
npm run test

# 4. 代码检查
npm run lint
npm run type-check

# 5. 提交代码
git add .
git commit -m "feat: add new feature"

# 6. 推送分支
git push origin feature/new-feature

# 7. 创建 Pull Request
```

### 2. 代码规范

#### 提交信息规范
使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

#### 代码风格
- 使用 ESLint + Prettier 进行代码格式化
- TypeScript 严格模式
- 组件使用 PascalCase
- 文件名使用 kebab-case
- 常量使用 UPPER_SNAKE_CASE

### 3. 分支策略
```
main        # 生产环境分支
├── develop # 开发环境分支
├── feature/xxx # 功能分支
├── hotfix/xxx  # 热修复分支
└── release/xxx # 发布分支
```

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
npm run test

# 运行特定包的测试
npm run test:frontend
npm run test:backend

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 测试结构
```
src/
├── components/
│   ├── Button.tsx
│   └── __tests__/
│       └── Button.test.tsx
├── utils/
│   ├── helpers.ts
│   └── __tests__/
│       └── helpers.test.ts
└── __tests__/
    └── setup.ts
```

### 测试类型
- **单元测试**: 测试单个函数/组件
- **集成测试**: 测试组件间交互
- **E2E测试**: 测试完整用户流程

## 🔧 开发工具

### VS Code 配置
推荐安装的扩展：
- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Auto Rename Tag
- GitLens

### 调试配置
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Frontend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/frontend/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/frontend"
    },
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/index.ts",
      "cwd": "${workspaceFolder}/backend",
      "runtimeArgs": ["-r", "tsx/cjs"]
    }
  ]
}
```

## 🎨 UI 开发

### 设计系统
- **颜色**: 基于 Tailwind CSS 调色板
- **字体**: Inter 字体系统
- **间距**: 8px 基础网格系统
- **圆角**: 统一的圆角设计语言

### 组件开发规范
```typescript
// 组件文件结构
interface ComponentProps {
  // Props 类型定义
}

const Component: React.FC<ComponentProps> = ({ ...props }) => {
  // 组件逻辑
  return (
    // JSX
  )
}

export default Component
export type { ComponentProps }
```

### Storybook（可选）
```bash
# 安装 Storybook
npx storybook@latest init

# 启动 Storybook
npm run storybook
```

## 🔌 API 开发

### 路由结构
```
/api/
├── auth/           # 认证相关
├── surveys/        # 问卷管理
├── responses/      # 答题记录
├── users/          # 用户管理
├── ai/            # AI 分析
└── admin/         # 管理后台
```

### API 开发规范
```typescript
// 控制器示例
export const getSurveys = async (req: Request, res: Response) => {
  try {
    const surveys = await surveyService.getAll()
    res.json({
      data: surveys,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    })
  }
}
```

### 中间件开发
```typescript
// 认证中间件示例
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Token required' }
    })
  }
  
  // 验证 token...
  next()
}
```

## 🤖 AI 服务开发

### 添加新的 LLM 服务
1. 在 `backend/src/services/llm/` 创建新服务文件
2. 实现 `LLMService` 接口
3. 在 `LLMServiceManager` 中注册服务
4. 添加配置和环境变量

### 服务接口
```typescript
interface LLMService {
  generateCompletion(request: LLMRequest): Promise<LLMResponse>
  generateAnalysis(prompt: string, context?: string): Promise<string>
  isAvailable(): Promise<boolean>
}
```

## 📊 状态管理

### Zustand Store 开发
```typescript
// Store 示例
interface StoreState {
  data: any[]
  loading: boolean
  error: string | null
}

interface StoreActions {
  fetchData: () => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  data: [],
  loading: false,
  error: null,
  
  fetchData: async () => {
    set({ loading: true, error: null })
    try {
      const data = await api.getData()
      set({ data, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
```

## 🔍 调试技巧

### 前端调试
```typescript
// React DevTools
// 在组件中添加调试信息
useEffect(() => {
  console.log('Component state:', state)
}, [state])

// 网络请求调试
const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use(request => {
  console.log('API Request:', request)
  return request
})
```

### 后端调试
```typescript
// 使用 winston 日志
import { logger } from '@/utils/logger'

logger.debug('Debug info', { data })
logger.info('Info message')
logger.warn('Warning message')
logger.error('Error message', error)
```

### 数据库调试
```typescript
// Supabase 查询调试
const { data, error } = await supabase
  .from('surveys')
  .select('*')
  .eq('id', id)

if (error) {
  logger.error('Database error:', error)
}
```

## 📈 性能优化

### 前端优化
- 使用 React.memo 避免不必要的重渲染
- 使用 useMemo 和 useCallback 优化计算
- 代码分割和懒加载
- 图片优化和预加载

### 后端优化
- 数据库查询优化
- 缓存策略
- 请求限流
- 响应压缩

## 🚨 常见问题

### 1. 依赖安装问题
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 2. TypeScript 类型错误
```bash
# 重新生成类型
npm run type-check
```

### 3. 构建失败
```bash
# 检查环境变量
cat .env

# 重新构建共享包
npm run build:shared
```

### 4. 端口冲突
```bash
# 查看端口占用
lsof -i :3000
lsof -i :3001

# 杀死进程
kill -9 <PID>
```
