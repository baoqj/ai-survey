# 后端API架构设计

## 技术栈
- **框架**: Next.js API Routes + Edge Functions
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT + Row-Level Security
- **AI服务**: Hugging Face API
- **文件处理**: ExcelJS

## API接口设计

### 1. 问卷管理 API

#### GET /api/surveys
```typescript
// 获取问卷列表
interface GetSurveysResponse {
  surveys: Survey[];
  total: number;
  page: number;
  limit: number;
}
```

#### GET /api/surveys/[id]
```typescript
// 获取单个问卷详情
interface GetSurveyResponse {
  survey: Survey;
  questions: Question[];
  options: Option[];
}
```

#### POST /api/surveys
```typescript
// 创建新问卷
interface CreateSurveyRequest {
  title: string;
  description?: string;
  questions: {
    content: string;
    order: number;
    options: {
      label: string;
      score: number;
    }[];
  }[];
}
```

#### PUT /api/surveys/[id]
```typescript
// 更新问卷
interface UpdateSurveyRequest {
  title?: string;
  description?: string;
  questions?: Question[];
}
```

#### DELETE /api/surveys/[id]
```typescript
// 删除问卷
interface DeleteSurveyResponse {
  success: boolean;
  message: string;
}
```

### 2. 用户管理 API

#### POST /api/users
```typescript
// 创建用户档案
interface CreateUserRequest {
  name: string;
  phone: string;
}

interface CreateUserResponse {
  user: User;
  token: string;
}
```

#### GET /api/users/[id]
```typescript
// 获取用户信息
interface GetUserResponse {
  user: User;
  responseCount: number;
  lastActivity: string;
}
```

#### PUT /api/users/[id]
```typescript
// 更新用户信息
interface UpdateUserRequest {
  name?: string;
  phone?: string;
}
```

### 3. 答题记录 API

#### POST /api/responses
```typescript
// 提交答题记录
interface CreateResponseRequest {
  userId: string;
  surveyId: string;
  answers: {
    questionId: string;
    optionId: string;
  }[];
}

interface CreateResponseResponse {
  response: Response;
  analysisId: string; // 用于获取AI分析结果
}
```

#### GET /api/responses/[id]
```typescript
// 获取答题记录详情
interface GetResponseResponse {
  response: Response;
  answers: Answer[];
  analysis?: AIAnalysis;
}
```

#### GET /api/responses
```typescript
// 获取答题记录列表（管理员）
interface GetResponsesQuery {
  surveyId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

interface GetResponsesResponse {
  responses: Response[];
  total: number;
  statistics: {
    completionRate: number;
    averageScore: number;
    responsesByDate: { date: string; count: number }[];
  };
}
```

### 4. AI分析 API

#### POST /api/ai/analyze
```typescript
// 生成AI分析报告
interface AIAnalyzeRequest {
  responseId: string;
  language?: 'zh' | 'en'; // 多语言支持
}

interface AIAnalyzeResponse {
  analysis: {
    riskAreas: {
      financial: number;
      control: number;
      structure: number;
      compliance: number;
      tax: number;
    };
    summary: string;
    suggestions: string[];
    confidence: number;
  };
  processingTime: number;
}
```

#### GET /api/ai/analysis/[id]
```typescript
// 获取AI分析结果
interface GetAnalysisResponse {
  analysis: AIAnalysis;
  createdAt: string;
  language: string;
}
```

### 5. 统计分析 API

#### GET /api/admin/dashboard
```typescript
// 管理后台仪表板数据
interface DashboardResponse {
  overview: {
    totalSurveys: number;
    totalResponses: number;
    totalUsers: number;
    completionRate: number;
  };
  recentActivity: {
    date: string;
    responses: number;
    newUsers: number;
  }[];
  topSurveys: {
    surveyId: string;
    title: string;
    responseCount: number;
    completionRate: number;
  }[];
}
```

#### GET /api/admin/surveys/[id]/statistics
```typescript
// 单个问卷统计数据
interface SurveyStatisticsResponse {
  survey: Survey;
  statistics: {
    totalResponses: number;
    completionRate: number;
    averageCompletionTime: number;
    questionStats: {
      questionId: string;
      content: string;
      optionStats: {
        optionId: string;
        label: string;
        count: number;
        percentage: number;
      }[];
    }[];
  };
}
```

## 数据验证与错误处理

### 请求验证
```typescript
// 使用 Zod 进行数据验证
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1).max(50),
  phone: z.string().regex(/^1[3-9]\d{9}$/) // 中国手机号格式
});

const CreateSurveySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  questions: z.array(z.object({
    content: z.string().min(1),
    order: z.number().int().positive(),
    options: z.array(z.object({
      label: z.string().min(1),
      score: z.number().int().min(0).max(100)
    })).min(2).max(10)
  })).min(1).max(50)
});
```

### 错误响应格式
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}

// 常见错误码
enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR'
}
```

## 中间件设计

### 1. 认证中间件
```typescript
// middleware/auth.ts
export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Missing token' });
      }
      
      const user = await verifyToken(token);
      req.user = user;
      
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
```

### 2. 速率限制中间件
```typescript
// middleware/rateLimit.ts
export function withRateLimit(limit: number = 100) {
  return async (req: NextApiRequest, res: NextApiResponse, next: Function) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `rate_limit:${ip}`;
    
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, 3600); // 1小时窗口
    }
    
    if (current > limit) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    next();
  };
}
```

### 3. 日志中间件
```typescript
// middleware/logging.ts
export function withLogging(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const start = Date.now();
    
    console.log(`${req.method} ${req.url} - ${req.ip}`);
    
    const result = await handler(req, res);
    
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    
    return result;
  };
}
```

## AI服务集成

### Hugging Face API 集成
```typescript
// lib/ai.ts
export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api-inference.huggingface.co';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generateAnalysis(answers: Answer[], language: 'zh' | 'en' = 'zh'): Promise<AIAnalysis> {
    const prompt = this.buildPrompt(answers, language);
    
    const response = await fetch(`${this.baseUrl}/models/microsoft/DialoGPT-medium`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 500,
          temperature: 0.7
        }
      })
    });
    
    const result = await response.json();
    return this.parseAnalysis(result, language);
  }
  
  private buildPrompt(answers: Answer[], language: 'zh' | 'en'): string {
    // 构建分析提示词
    const template = language === 'zh' 
      ? '基于以下问卷答案，生成风险分析报告：'
      : 'Based on the following survey answers, generate a risk analysis report:';
    
    return `${template}\n${JSON.stringify(answers)}`;
  }
  
  private parseAnalysis(result: any, language: string): AIAnalysis {
    // 解析AI返回结果，提取风险评分和建议
    return {
      riskAreas: {
        financial: Math.random() * 100, // 实际应从AI结果解析
        control: Math.random() * 100,
        structure: Math.random() * 100,
        compliance: Math.random() * 100,
        tax: Math.random() * 100
      },
      summary: result.generated_text || '',
      suggestions: [],
      confidence: 0.85
    };
  }
}
```
