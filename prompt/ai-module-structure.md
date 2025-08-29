# AI模块代码目录结构设计

## AI功能概述
基于PRD文档，AI模块需要支持：
1. 问卷生成引擎（RAG + LLM）
2. 答卷评估引擎
3. 用户画像建模
4. 标签生成引擎
5. Prompt模板系统
6. 向量检索和语义搜索

## AI模块总体架构

### Backend AI目录结构
```
backend/src/ai/
├── index.ts                    # AI模块统一导出
├── config/                     # AI配置
│   ├── index.ts               # 配置导出
│   ├── llm.ts                 # LLM服务配置
│   ├── vector.ts              # 向量数据库配置
│   ├── prompts.ts             # Prompt配置
│   └── models.ts              # 模型配置
├── core/                       # 核心AI服务
│   ├── llm/                   # 大语言模型服务
│   │   ├── index.ts           # LLM服务导出
│   │   ├── base.ts            # LLM基础抽象类
│   │   ├── openai.ts          # OpenAI GPT-4o服务
│   │   ├── qwen.ts            # 通义千问服务
│   │   ├── deepseek.ts        # DeepSeek服务
│   │   ├── factory.ts         # LLM工厂模式
│   │   └── types.ts           # LLM类型定义
│   ├── vector/                # 向量检索服务
│   │   ├── index.ts           # 向量服务导出
│   │   ├── base.ts            # 向量存储基类
│   │   ├── supabase.ts        # Supabase Vector
│   │   ├── weaviate.ts        # Weaviate服务
│   │   ├── embeddings.ts      # 嵌入向量生成
│   │   ├── similarity.ts      # 相似度计算
│   │   └── types.ts           # 向量类型定义
│   ├── rag/                   # RAG检索增强生成
│   │   ├── index.ts           # RAG服务导出
│   │   ├── retriever.ts       # 检索器
│   │   ├── generator.ts       # 生成器
│   │   ├── reranker.ts        # 重排序器
│   │   ├── context.ts         # 上下文管理
│   │   └── pipeline.ts        # RAG流水线
│   └── memory/                # 记忆和缓存
│       ├── index.ts           # 记忆服务导出
│       ├── conversation.ts    # 对话记忆
│       ├── cache.ts           # 结果缓存
│       └── history.ts         # 历史记录
├── engines/                   # AI引擎实现
│   ├── survey/                # 问卷生成引擎
│   │   ├── index.ts           # 问卷引擎导出
│   │   ├── generator.ts       # 问卷生成器
│   │   ├── optimizer.ts       # 问卷优化器
│   │   ├── validator.ts       # 问卷验证器
│   │   ├── templates.ts       # 问卷模板处理
│   │   └── types.ts           # 问卷生成类型
│   ├── analysis/              # 答卷分析引擎
│   │   ├── index.ts           # 分析引擎导出
│   │   ├── evaluator.ts       # 答卷评估器
│   │   ├── classifier.ts      # 答卷分类器
│   │   ├── sentiment.ts       # 情感分析
│   │   ├── quality.ts         # 质量评估
│   │   ├── insights.ts        # 洞察生成
│   │   └── types.ts           # 分析类型定义
│   ├── profiling/             # 用户画像引擎
│   │   ├── index.ts           # 画像引擎导出
│   │   ├── builder.ts         # 画像构建器
│   │   ├── clustering.ts      # 用户聚类
│   │   ├── segmentation.ts    # 用户分群
│   │   ├── recommendation.ts  # 推荐系统
│   │   └── types.ts           # 画像类型定义
│   ├── tagging/               # 标签生成引擎
│   │   ├── index.ts           # 标签引擎导出
│   │   ├── generator.ts       # 标签生成器
│   │   ├── extractor.ts       # 特征提取器
│   │   ├── classifier.ts      # 标签分类器
│   │   ├── rules.ts           # 规则引擎
│   │   └── types.ts           # 标签类型定义
│   └── content/               # 内容处理引擎
│       ├── index.ts           # 内容引擎导出
│       ├── processor.ts       # 内容处理器
│       ├── summarizer.ts      # 内容摘要
│       ├── translator.ts      # 内容翻译
│       ├── moderator.ts       # 内容审核
│       └── types.ts           # 内容类型定义
├── prompts/                   # Prompt模板管理
│   ├── index.ts               # Prompt导出
│   ├── templates/             # 模板库
│   │   ├── survey/            # 问卷生成模板
│   │   │   ├── basic.ts       # 基础问卷模板
│   │   │   ├── market.ts      # 市场调研模板
│   │   │   ├── satisfaction.ts # 满意度调研模板
│   │   │   ├── feedback.ts    # 反馈收集模板
│   │   │   └── custom.ts      # 自定义模板
│   │   ├── analysis/          # 分析模板
│   │   │   ├── evaluation.ts  # 评估模板
│   │   │   ├── classification.ts # 分类模板
│   │   │   ├── summary.ts     # 摘要模板
│   │   │   └── insights.ts    # 洞察模板
│   │   ├── tagging/           # 标签模板
│   │   │   ├── user.ts        # 用户标签模板
│   │   │   ├── content.ts     # 内容标签模板
│   │   │   └── behavior.ts    # 行为标签模板
│   │   └── common/            # 通用模板
│   │       ├── system.ts      # 系统提示模板
│   │       ├── context.ts     # 上下文模板
│   │       └── format.ts      # 格式化模板
│   ├── builder.ts             # Prompt构建器
│   ├── validator.ts           # Prompt验证器
│   ├── optimizer.ts           # Prompt优化器
│   └── manager.ts             # Prompt管理器
├── processors/                # 数据处理器
│   ├── index.ts               # 处理器导出
│   ├── text/                  # 文本处理
│   │   ├── cleaner.ts         # 文本清洗
│   │   ├── tokenizer.ts       # 分词器
│   │   ├── normalizer.ts      # 文本标准化
│   │   └── extractor.ts       # 特征提取
│   ├── structured/            # 结构化数据处理
│   │   ├── parser.ts          # 数据解析
│   │   ├── validator.ts       # 数据验证
│   │   ├── transformer.ts     # 数据转换
│   │   └── aggregator.ts      # 数据聚合
│   └── multimedia/            # 多媒体处理
│       ├── image.ts           # 图像处理
│       ├── audio.ts           # 音频处理
│       └── video.ts           # 视频处理
├── utils/                     # AI工具函数
│   ├── index.ts               # 工具导出
│   ├── tokenizer.ts           # Token计算
│   ├── formatter.ts           # 格式化工具
│   ├── validator.ts           # 验证工具
│   ├── metrics.ts             # 评估指标
│   ├── logger.ts              # AI日志工具
│   └── helpers.ts             # 辅助函数
├── middleware/                # AI中间件
│   ├── index.ts               # 中间件导出
│   ├── rateLimit.ts           # AI调用限流
│   ├── cache.ts               # 结果缓存中间件
│   ├── monitor.ts             # 性能监控
│   ├── security.ts            # 安全检查
│   └── logging.ts             # 日志记录
├── jobs/                      # AI定时任务
│   ├── index.ts               # 任务导出
│   ├── training.ts            # 模型训练任务
│   ├── indexing.ts            # 向量索引任务
│   ├── cleanup.ts             # 清理任务
│   └── optimization.ts        # 优化任务
├── models/                    # AI数据模型
│   ├── index.ts               # 模型导出
│   ├── Prompt.ts              # Prompt模型
│   ├── Embedding.ts           # 嵌入向量模型
│   ├── Analysis.ts            # 分析结果模型
│   ├── Profile.ts             # 用户画像模型
│   └── Tag.ts                 # 标签模型
├── services/                  # AI业务服务
│   ├── index.ts               # 服务导出
│   ├── surveyAI.ts            # 问卷AI服务
│   ├── analysisAI.ts          # 分析AI服务
│   ├── profilingAI.ts         # 画像AI服务
│   ├── taggingAI.ts           # 标签AI服务
│   ├── recommendationAI.ts    # 推荐AI服务
│   └── moderationAI.ts        # 审核AI服务
├── controllers/               # AI控制器
│   ├── index.ts               # 控制器导出
│   ├── aiController.ts        # 通用AI控制器
│   ├── surveyAIController.ts  # 问卷AI控制器
│   ├── analysisAIController.ts # 分析AI控制器
│   └── promptController.ts    # Prompt控制器
├── routes/                    # AI路由
│   ├── index.ts               # 路由导出
│   ├── ai.ts                  # 通用AI路由
│   ├── survey-ai.ts           # 问卷AI路由
│   ├── analysis-ai.ts         # 分析AI路由
│   └── prompts.ts             # Prompt路由
├── tests/                     # AI测试
│   ├── unit/                  # 单元测试
│   │   ├── llm.test.ts        # LLM测试
│   │   ├── vector.test.ts     # 向量测试
│   │   ├── rag.test.ts        # RAG测试
│   │   └── engines.test.ts    # 引擎测试
│   ├── integration/           # 集成测试
│   │   ├── survey-ai.test.ts  # 问卷AI集成测试
│   │   └── analysis-ai.test.ts # 分析AI集成测试
│   └── fixtures/              # 测试数据
│       ├── prompts.json       # 测试Prompt
│       ├── surveys.json       # 测试问卷
│       └── responses.json     # 测试答卷
└── types/                     # AI类型定义
    ├── index.ts               # 类型导出
    ├── llm.ts                 # LLM类型
    ├── vector.ts              # 向量类型
    ├── rag.ts                 # RAG类型
    ├── engines.ts             # 引擎类型
    └── common.ts              # 通用AI类型
```

## Frontend AI集成目录
```
frontend/src/ai/
├── index.ts                   # AI客户端导出
├── client/                    # AI客户端
│   ├── index.ts               # 客户端导出
│   ├── aiClient.ts            # AI API客户端
│   ├── streamClient.ts        # 流式响应客户端
│   └── types.ts               # 客户端类型
├── hooks/                     # AI相关Hooks
│   ├── useAI.ts               # 通用AI Hook
│   ├── useSurveyAI.ts         # 问卷AI Hook
│   ├── useAnalysisAI.ts       # 分析AI Hook
│   ├── usePrompts.ts          # Prompt Hook
│   └── useStreaming.ts        # 流式响应Hook
├── components/                # AI组件
│   ├── SurveyGenerator.tsx    # 问卷生成器组件
│   ├── AnalysisViewer.tsx     # 分析结果查看器
│   ├── PromptEditor.tsx       # Prompt编辑器
│   ├── AIChat.tsx             # AI对话组件
│   └── LoadingStates.tsx      # AI加载状态
├── utils/                     # AI工具函数
│   ├── formatting.ts          # 格式化工具
│   ├── validation.ts          # 验证工具
│   └── helpers.ts             # 辅助函数
└── types/                     # 前端AI类型
    ├── api.ts                 # API类型
    ├── components.ts          # 组件类型
    └── hooks.ts               # Hook类型
```

## Shared AI类型定义
```
shared/src/ai/
├── index.ts                   # AI类型导出
├── types/                     # AI类型定义
│   ├── llm.ts                 # LLM类型
│   ├── vector.ts              # 向量类型
│   ├── rag.ts                 # RAG类型
│   ├── survey.ts              # 问卷AI类型
│   ├── analysis.ts            # 分析AI类型
│   ├── profiling.ts           # 画像AI类型
│   ├── tagging.ts             # 标签AI类型
│   └── prompts.ts             # Prompt类型
├── schemas/                   # AI验证模式
│   ├── llm.ts                 # LLM验证
│   ├── prompts.ts             # Prompt验证
│   ├── survey.ts              # 问卷AI验证
│   └── analysis.ts            # 分析AI验证
├── enums/                     # AI枚举
│   ├── llmProviders.ts        # LLM提供商
│   ├── promptTypes.ts         # Prompt类型
│   ├── analysisTypes.ts       # 分析类型
│   └── tagTypes.ts            # 标签类型
└── constants/                 # AI常量
    ├── models.ts              # 模型常量
    ├── prompts.ts             # Prompt常量
    └── limits.ts              # 限制常量
```

## 核心AI功能实现要点

### 1. 问卷生成引擎
- 基于RAG的智能问卷生成
- 支持多种问卷类型和行业模板
- 问卷结构优化和验证

### 2. 答卷分析引擎
- RAG等级评估（红/橙/绿）
- 情感分析和质量评估
- 自动洞察生成

### 3. 用户画像系统
- 基于行为和答卷内容的画像构建
- 用户聚类和分群
- 个性化推荐

### 4. 向量检索系统
- 问卷和答卷的向量化存储
- 语义相似度搜索
- RAG上下文检索

### 5. Prompt管理系统
- 模板化Prompt管理
- 动态Prompt构建
- A/B测试支持

这个AI模块结构完全支持PRD文档中提到的所有AI功能需求，为智能问卷系统提供强大的AI能力支撑。

## AI模块核心文件示例

### 1. AI配置文件 (backend/src/ai/config/llm.ts)
```typescript
export interface LLMConfig {
  provider: 'openai' | 'qwen' | 'deepseek';
  model: string;
  apiKey: string;
  baseURL?: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export const llmConfigs: Record<string, LLMConfig> = {
  openai: {
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: process.env.OPENAI_API_KEY!,
    maxTokens: 4096,
    temperature: 0.7,
    timeout: 30000
  },
  qwen: {
    provider: 'qwen',
    model: 'qwen-max',
    apiKey: process.env.QWEN_API_KEY!,
    baseURL: 'https://dashscope.aliyuncs.com/api/v1',
    maxTokens: 2048,
    temperature: 0.7,
    timeout: 30000
  },
  deepseek: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    apiKey: process.env.DEEPSEEK_API_KEY!,
    baseURL: 'https://api.deepseek.com/v1',
    maxTokens: 4096,
    temperature: 0.7,
    timeout: 30000
  }
};
```

### 2. 问卷生成引擎 (backend/src/ai/engines/survey/generator.ts)
```typescript
import { RAGService } from '../../core/rag';
import { LLMService } from '../../core/llm';
import { PromptBuilder } from '../../prompts/builder';

export class SurveyGenerator {
  constructor(
    private ragService: RAGService,
    private llmService: LLMService,
    private promptBuilder: PromptBuilder
  ) {}

  async generateSurvey(request: SurveyGenerationRequest): Promise<GeneratedSurvey> {
    // 1. 检索相关问卷片段
    const relevantContent = await this.ragService.retrieve({
      query: request.objective,
      type: 'survey',
      limit: 5
    });

    // 2. 构建生成Prompt
    const prompt = this.promptBuilder.buildSurveyPrompt({
      objective: request.objective,
      targetAudience: request.targetAudience,
      industry: request.industry,
      context: relevantContent,
      examples: request.examples
    });

    // 3. 调用LLM生成问卷
    const response = await this.llmService.generate({
      prompt,
      maxTokens: 2048,
      temperature: 0.7
    });

    // 4. 解析和验证生成结果
    return this.parseAndValidate(response);
  }
}
```

### 3. 答卷分析引擎 (backend/src/ai/engines/analysis/evaluator.ts)
```typescript
export class ResponseEvaluator {
  async evaluateResponse(response: SurveyResponse): Promise<ResponseEvaluation> {
    const evaluations = await Promise.all([
      this.evaluateQuality(response),
      this.evaluateCompleteness(response),
      this.evaluateSentiment(response),
      this.evaluateInsights(response)
    ]);

    return this.aggregateEvaluations(evaluations);
  }

  private async evaluateQuality(response: SurveyResponse): Promise<QualityScore> {
    const prompt = this.promptBuilder.buildQualityPrompt(response);
    const result = await this.llmService.generate({ prompt });
    return this.parseQualityScore(result);
  }

  private determineRAGLevel(scores: EvaluationScores): 'Red' | 'Amber' | 'Green' {
    const avgScore = (scores.quality + scores.completeness + scores.relevance) / 3;
    if (avgScore >= 0.8) return 'Green';
    if (avgScore >= 0.6) return 'Amber';
    return 'Red';
  }
}
```

### 4. 向量检索服务 (backend/src/ai/core/vector/supabase.ts)
```typescript
export class SupabaseVectorStore implements VectorStore {
  constructor(private supabase: SupabaseClient) {}

  async addDocuments(documents: Document[]): Promise<void> {
    const embeddings = await this.generateEmbeddings(documents);

    const records = documents.map((doc, index) => ({
      content: doc.content,
      metadata: doc.metadata,
      embedding: embeddings[index]
    }));

    await this.supabase
      .from('document_embeddings')
      .insert(records);
  }

  async similaritySearch(query: string, limit: number = 5): Promise<Document[]> {
    const queryEmbedding = await this.generateEmbedding(query);

    const { data } = await this.supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit
    });

    return data?.map(this.mapToDocument) || [];
  }
}
```

### 5. Prompt模板管理 (backend/src/ai/prompts/templates/survey/basic.ts)
```typescript
export const basicSurveyPrompts = {
  generation: `
你是一个专业的问卷设计专家。请根据以下信息生成一份结构合理的问卷：

调研目标：{{objective}}
目标受众：{{targetAudience}}
行业领域：{{industry}}

参考内容：
{{#each context}}
- {{this.content}}
{{/each}}

要求：
1. 问卷应包含5-15个问题
2. 问题类型要多样化（单选、多选、量表、开放题）
3. 逻辑结构清晰，从基础信息到核心问题
4. 语言简洁明了，避免引导性问题

请以JSON格式返回问卷结构。
`,

  optimization: `
请优化以下问卷，提高其专业性和有效性：

原问卷：{{originalSurvey}}

优化要求：
1. 改进问题表述，使其更加清晰
2. 调整问题顺序，优化逻辑流程
3. 确保问题的中性和客观性
4. 提供更好的选项设计

请返回优化后的问卷。
`
};
```

## AI模块部署和监控

### 1. 环境变量配置
```bash
# AI服务配置
OPENAI_API_KEY=sk-xxx
QWEN_API_KEY=sk-xxx
DEEPSEEK_API_KEY=sk-xxx

# 向量数据库配置
SUPABASE_VECTOR_URL=https://xxx.supabase.co
WEAVIATE_URL=http://localhost:8080

# AI服务限制
AI_RATE_LIMIT_PER_MINUTE=60
AI_MAX_CONCURRENT_REQUESTS=10
AI_TIMEOUT_SECONDS=30

# 缓存配置
AI_CACHE_TTL_SECONDS=3600
AI_CACHE_MAX_SIZE=1000
```

### 2. 监控和日志
- AI调用次数和成本监控
- 响应时间和错误率追踪
- 模型性能评估和A/B测试
- 用户反馈收集和模型优化

### 3. 安全和合规
- API密钥安全管理
- 用户数据隐私保护
- 内容审核和过滤
- 合规性检查和报告

这个AI模块架构为智能问卷系统提供了完整的AI能力支撑，支持问卷智能生成、答卷智能分析、用户画像构建等核心功能。
