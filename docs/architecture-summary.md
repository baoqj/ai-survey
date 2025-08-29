# 智问数研问卷系统 - 整体架构总结

## 项目概述
基于 `prompt.md` 要求设计的移动优先问卷调查系统，支持AI驱动的个性化分析报告生成。系统采用现代化技术栈，具备高性能、高可用性和良好的用户体验。

## 核心特性
- ✅ 移动优先设计，单题页面展示
- ✅ AI驱动的个性化风险分析报告
- ✅ 雷达图可视化展示五维风险评分
- ✅ 多语言支持（中文/英文）
- ✅ 管理后台数据统计分析
- ✅ 本地缓存续答功能
- ✅ 实时数据同步

## 技术架构概览

### 前端架构
```
技术栈: Next.js 15 + TypeScript + TailwindCSS
状态管理: Zustand
图表库: Recharts (雷达图)
动画: Framer Motion
```

**页面路由设计:**
- `/` - 首页 (Landing Page)
- `/survey?surveyId=xxx` - 问卷答题页
- `/result?surveyId=xxx&userId=xxx` - 结果分析页
- `/profile` - 用户建档页
- `/admin/*` - 管理后台

**核心组件:**
- QuestionCard - 单题展示组件
- RadarChart - 雷达图组件
- ProgressBar - 进度条组件
- NavigationButtons - 导航按钮组件

### 后端架构
```
API框架: Next.js API Routes + Edge Functions
数据库: Supabase (PostgreSQL + RLS)
AI服务: Hugging Face API
认证: JWT + Row-Level Security
```

**API接口设计:**
- `/api/surveys/*` - 问卷管理
- `/api/users/*` - 用户管理
- `/api/responses/*` - 答题记录
- `/api/ai/*` - AI分析服务
- `/api/admin/*` - 管理后台

### 数据库设计
```sql
核心表结构:
- users (用户表)
- surveys (问卷表)
- questions (题目表)
- options (选项表)
- responses (答题记录表)
- answers (答案表)
- ai_analyses (AI分析结果表)
```

**安全特性:**
- Row-Level Security (RLS) 数据隔离
- JWT 认证机制
- 数据匿名化处理
- HTTPS 加密传输

### AI集成架构
```
AI服务: Hugging Face API (主) + OpenAI (备选)
核心功能: 个性化风险分析报告生成
多语言: 中文/英文支持
```

**AI分析流程:**
1. 收集用户答题数据
2. 构建分析提示词
3. 调用AI服务生成分析
4. 解析结构化结果
5. 存储分析报告

**风险评分维度:**
- 金融账户风险 (0-100分)
- 控制人风险 (0-100分)
- 结构复杂度 (0-100分)
- 合规风险 (0-100分)
- 税务风险 (0-100分)

### 部署架构
```
部署平台: Vercel (Serverless)
CDN: Cloudflare
数据库: Supabase 托管服务
监控: Vercel Analytics + Sentry
```

**CI/CD流程:**
- GitHub Actions 自动化部署
- 自动化测试和代码检查
- 预览环境和生产环境分离
- 数据库迁移自动化

## 项目结构
```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 首页
│   ├── survey/            # 问卷页面
│   ├── result/            # 结果页面
│   ├── profile/           # 用户建档
│   ├── admin/             # 管理后台
│   └── api/               # API Routes
├── components/            # React 组件
│   ├── ui/               # 基础UI组件
│   ├── survey/           # 问卷相关组件
│   ├── result/           # 结果页组件
│   └── admin/            # 管理后台组件
├── lib/                  # 工具库
│   ├── supabase.ts       # 数据库客户端
│   ├── ai/               # AI服务集成
│   └── utils.ts          # 通用工具
├── store/                # 状态管理
├── types/                # TypeScript 类型
└── hooks/                # 自定义 Hooks
```

## 核心功能实现

### 1. 问卷答题流程
```typescript
// 答题状态管理
interface SurveyState {
  currentSurvey: Survey | null;
  currentQuestionIndex: number;
  answers: Answer[];
  isLoading: boolean;
}

// 核心方法
- loadSurvey() - 加载问卷
- setAnswer() - 设置答案
- nextQuestion() - 下一题
- prevQuestion() - 上一题
- submitSurvey() - 提交问卷
- saveToLocal() - 本地缓存
```

### 2. AI分析报告生成
```typescript
// AI服务接口
interface AIService {
  generateAnalysis(answers, userProfile, language): Promise<AIAnalysisResult>
}

// 分析结果结构
interface AIAnalysisResult {
  riskScores: RiskScores;     // 五维风险评分
  summary: string;            // 分析摘要
  suggestions: string[];      // 改进建议
  confidence: number;         // 置信度
  language: 'zh' | 'en';     // 语言
}
```

### 3. 雷达图可视化
```typescript
// 使用 Recharts 实现五维风险雷达图
<RadarChart data={riskData}>
  <PolarGrid />
  <PolarAngleAxis dataKey="subject" />
  <PolarRadiusAxis domain={[0, 100]} />
  <Radar dataKey="score" stroke="#7C3AED" fill="#7C3AED" />
</RadarChart>
```

### 4. 管理后台统计
```typescript
// 统计数据接口
interface DashboardStats {
  totalSurveys: number;
  totalResponses: number;
  completionRate: number;
  questionStats: QuestionStat[];
}
```

## 性能优化策略

### 前端优化
- **代码分割**: 按路由和组件分割
- **懒加载**: 非关键组件懒加载
- **缓存策略**: 本地存储答题进度
- **图片优化**: Next.js Image 组件 + WebP

### 后端优化
- **Edge Functions**: 全球边缘计算
- **数据库索引**: 关键查询优化
- **API缓存**: 响应缓存机制
- **连接池**: 数据库连接优化

### AI服务优化
- **重试机制**: 指数退避重试
- **错误处理**: 优雅降级
- **缓存结果**: 分析结果缓存
- **批量处理**: 批量分析优化

## 安全措施

### 数据安全
- Row-Level Security (RLS) 数据隔离
- JWT Token 认证
- 数据加密存储
- 敏感信息脱敏

### 应用安全
- HTTPS 强制加密
- CSP 内容安全策略
- XSS 防护
- CSRF 防护
- 速率限制

### 隐私保护
- 用户数据匿名化
- 最小权限原则
- 数据导出/删除权利
- 合规性检查

## 监控和运维

### 应用监控
- Vercel Analytics - 性能监控
- Sentry - 错误监控
- 健康检查端点
- 实时日志记录

### 数据库监控
- Supabase Dashboard
- 查询性能监控
- 连接数监控
- 存储使用监控

### AI服务监控
- API调用统计
- 响应时间监控
- 错误率统计
- 成本控制

## 扩展性设计

### 水平扩展
- Serverless 架构自动扩展
- CDN 全球分发
- 数据库读写分离
- 微服务架构准备

### 功能扩展
- 多问卷类型支持
- 更多AI模型集成
- 高级分析功能
- 第三方集成API

### 国际化扩展
- 多语言支持框架
- 本地化内容管理
- 时区处理
- 货币和数字格式

## 部署清单

### 环境准备
- [ ] Vercel 账号和项目配置
- [ ] Supabase 项目创建
- [ ] Hugging Face API Key
- [ ] 域名和SSL证书
- [ ] 监控服务配置

### 部署步骤
1. 克隆代码仓库
2. 配置环境变量
3. 运行数据库迁移
4. 部署到Vercel
5. 配置CDN和域名
6. 设置监控和告警

### 验证测试
- [ ] 功能测试
- [ ] 性能测试
- [ ] 安全测试
- [ ] 兼容性测试
- [ ] 压力测试

## 总结

本架构设计完全基于 `prompt.md` 的要求，实现了：

1. **移动优先的用户体验** - 单题页面、流畅动画、本地缓存
2. **AI驱动的智能分析** - 个性化报告、多语言支持、雷达图展示
3. **完整的管理后台** - 数据统计、问卷管理、用户管理
4. **现代化技术栈** - Next.js 15、Supabase、Vercel部署
5. **高性能和安全性** - Edge Functions、RLS、监控告警

系统具备良好的可扩展性和维护性，能够支持未来的功能扩展和性能优化需求。
