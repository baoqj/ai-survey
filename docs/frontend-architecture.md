# 前端架构设计

## 技术栈
- **框架**: Next.js 15 + TypeScript
- **样式**: TailwindCSS (移动优先设计)
- **状态管理**: Zustand (轻量级状态管理)
- **图表库**: Recharts (雷达图展示)
- **动画**: Framer Motion (页面切换动画)

## 项目结构
```
src/
├── app/                    # Next.js 13+ App Router
│   ├── page.tsx           # 首页 (/)
│   ├── survey/
│   │   └── page.tsx       # 问卷答题页 (/survey)
│   ├── result/
│   │   └── page.tsx       # 结果页 (/result)
│   ├── profile/
│   │   └── page.tsx       # 用户建档页 (/profile)
│   ├── admin/
│   │   ├── page.tsx       # 管理后台首页
│   │   ├── dashboard/
│   │   ├── surveys/
│   │   └── answers/
│   ├── api/               # API Routes
│   │   ├── surveys/
│   │   ├── users/
│   │   ├── responses/
│   │   └── ai/
│   ├── globals.css
│   └── layout.tsx
├── components/            # 可复用组件
│   ├── ui/               # 基础UI组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   ├── survey/           # 问卷相关组件
│   │   ├── QuestionCard.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── NavigationButtons.tsx
│   │   └── OptionSelector.tsx
│   ├── result/           # 结果页组件
│   │   ├── RadarChart.tsx
│   │   ├── AnalysisCard.tsx
│   │   └── RecommendationList.tsx
│   └── admin/            # 管理后台组件
│       ├── SurveyManager.tsx
│       ├── DataVisualization.tsx
│       └── UserManagement.tsx
├── lib/                  # 工具库
│   ├── supabase.ts      # Supabase 客户端
│   ├── api.ts           # API 调用封装
│   ├── utils.ts         # 通用工具函数
│   └── validations.ts   # 表单验证
├── store/               # 状态管理
│   ├── surveyStore.ts   # 问卷状态
│   ├── userStore.ts     # 用户状态
│   └── adminStore.ts    # 管理后台状态
├── types/               # TypeScript 类型定义
│   ├── survey.ts
│   ├── user.ts
│   └── api.ts
└── hooks/               # 自定义 Hooks
    ├── useSurvey.ts
    ├── useLocalStorage.ts
    └── useAI.ts
```

## 页面路由设计

### 1. 首页 (/)
- **功能**: 展示 Logo + "CRS Check" + 介绍语 + "立即开始自测"按钮
- **组件**: LandingPage, HeroSection, CTAButton
- **跳转**: 点击按钮跳转至 `/survey?surveyId=default`

### 2. 问卷答题页 (/survey)
- **功能**: 单题页面展示，支持前后导航
- **组件**: QuestionCard, ProgressBar, NavigationButtons
- **特性**: 
  - 每页展示一题（单选）
  - 显示进度 "QUESTION {i} OF {total}"
  - 左右滑动切换动画
  - 本地缓存续答功能

### 3. 结果页 (/result)
- **功能**: 雷达图展示 + AI分析报告
- **组件**: RadarChart, AnalysisCard, RecommendationList
- **特性**: 五维风险展示，个性化建议

### 4. 用户建档页 (/profile)
- **功能**: 姓名 + 手机号输入
- **组件**: ProfileForm, InputField
- **验证**: 表单验证 + 数据提交

### 5. 管理后台 (/admin)
- **功能**: 问卷管理 + 数据统计
- **子路由**:
  - `/admin/dashboard` - 仪表板
  - `/admin/surveys` - 问卷管理
  - `/admin/answers` - 答题记录

## 状态管理设计

### surveyStore (问卷状态)
```typescript
interface SurveyState {
  currentSurvey: Survey | null;
  currentQuestionIndex: number;
  answers: Answer[];
  isLoading: boolean;
  
  // Actions
  loadSurvey: (surveyId: string) => Promise<void>;
  setAnswer: (questionId: string, optionId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  submitSurvey: () => Promise<void>;
  saveToLocal: () => void;
  loadFromLocal: () => void;
}
```

### userStore (用户状态)
```typescript
interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  
  // Actions
  createProfile: (name: string, phone: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  logout: () => void;
}
```

## UI设计规范

### 主题色彩
- **主色**: #7C3AED (品牌紫色)
- **辅助色**: #F3F4F6 (浅灰)
- **文字色**: #1F2937 (深灰)
- **成功色**: #10B981 (绿色)
- **警告色**: #F59E0B (橙色)

### 组件设计原则
- **移动优先**: 所有组件优先适配移动端
- **圆角设计**: 按钮和卡片使用圆角 (rounded-lg)
- **阴影效果**: 卡片使用轻微阴影 (shadow-sm)
- **动画过渡**: 使用 Framer Motion 实现流畅动画

### 响应式断点
```css
/* TailwindCSS 断点 */
sm: 640px   /* 小屏幕 */
md: 768px   /* 中等屏幕 */
lg: 1024px  /* 大屏幕 */
xl: 1280px  /* 超大屏幕 */
```

## 性能优化策略

### 1. 代码分割
- 使用 Next.js 动态导入
- 按路由分割代码
- 懒加载非关键组件

### 2. 缓存策略
- 本地存储答题进度
- API 响应缓存
- 静态资源缓存

### 3. 图片优化
- 使用 Next.js Image 组件
- WebP 格式支持
- 响应式图片

### 4. 数据预取
- 预加载下一题数据
- 用户行为预测
- 关键路径优化
