# AI集成架构设计

## AI服务概述
- **主要AI服务**: Hugging Face API
- **备选方案**: OpenAI GPT-4, DeepSeek, Qwen
- **核心功能**: 个性化分析报告生成
- **多语言支持**: 中文、英文

## AI服务架构

### 1. AI服务抽象层
```typescript
// lib/ai/AIService.ts
export abstract class AIService {
  abstract generateAnalysis(
    answers: Answer[], 
    userProfile?: UserProfile,
    language?: 'zh' | 'en'
  ): Promise<AIAnalysisResult>;
  
  abstract generateSuggestions(
    riskScores: RiskScores,
    language?: 'zh' | 'en'
  ): Promise<string[]>;
  
  abstract translateContent(
    content: string,
    fromLang: string,
    toLang: string
  ): Promise<string>;
}
```

### 2. Hugging Face 实现
```typescript
// lib/ai/HuggingFaceService.ts
export class HuggingFaceService extends AIService {
  private apiKey: string;
  private baseUrl = 'https://api-inference.huggingface.co';
  private models = {
    analysis: 'microsoft/DialoGPT-medium',
    translation: 'Helsinki-NLP/opus-mt-zh-en',
    sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest'
  };

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async generateAnalysis(
    answers: Answer[], 
    userProfile?: UserProfile,
    language: 'zh' | 'en' = 'zh'
  ): Promise<AIAnalysisResult> {
    try {
      const prompt = this.buildAnalysisPrompt(answers, userProfile, language);
      
      const response = await this.callHuggingFace(
        this.models.analysis,
        { inputs: prompt }
      );
      
      return this.parseAnalysisResponse(response, language);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new AIServiceError('分析生成失败', error);
    }
  }

  private buildAnalysisPrompt(
    answers: Answer[], 
    userProfile?: UserProfile,
    language: 'zh' | 'en'
  ): string {
    const templates = {
      zh: `
基于以下问卷答案，生成详细的风险分析报告：

用户信息：
${userProfile ? `姓名：${userProfile.name}，行业：${userProfile.industry || '未知'}` : '匿名用户'}

问卷答案：
${answers.map((answer, index) => 
  `${index + 1}. ${answer.question}: ${answer.selectedOption}`
).join('\n')}

请按以下格式生成分析报告：
1. 风险评分（0-100分）：
   - 金融账户风险：[分数]
   - 控制人风险：[分数]
   - 结构复杂度：[分数]
   - 合规风险：[分数]
   - 税务风险：[分数]

2. 综合分析：[200字以内的分析摘要]

3. 改进建议：[3-5条具体建议]
      `,
      en: `
Based on the following survey answers, generate a detailed risk analysis report:

User Information:
${userProfile ? `Name: ${userProfile.name}, Industry: ${userProfile.industry || 'Unknown'}` : 'Anonymous User'}

Survey Answers:
${answers.map((answer, index) => 
  `${index + 1}. ${answer.question}: ${answer.selectedOption}`
).join('\n')}

Please generate the analysis report in the following format:
1. Risk Scores (0-100):
   - Financial Account Risk: [score]
   - Control Person Risk: [score]
   - Structure Complexity: [score]
   - Compliance Risk: [score]
   - Tax Risk: [score]

2. Comprehensive Analysis: [Summary within 200 words]

3. Improvement Suggestions: [3-5 specific recommendations]
      `
    };

    return templates[language];
  }

  private async callHuggingFace(model: string, payload: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API Error: ${response.statusText}`);
    }

    return response.json();
  }

  private parseAnalysisResponse(response: any, language: 'zh' | 'en'): AIAnalysisResult {
    const text = response[0]?.generated_text || response.generated_text || '';
    
    // 使用正则表达式解析结构化输出
    const riskScores = this.extractRiskScores(text);
    const summary = this.extractSummary(text);
    const suggestions = this.extractSuggestions(text);

    return {
      riskScores,
      summary,
      suggestions,
      confidence: this.calculateConfidence(text),
      language,
      rawResponse: text
    };
  }

  private extractRiskScores(text: string): RiskScores {
    const patterns = {
      financial: /金融账户风险[：:]\s*(\d+)|Financial Account Risk[：:]\s*(\d+)/i,
      control: /控制人风险[：:]\s*(\d+)|Control Person Risk[：:]\s*(\d+)/i,
      structure: /结构复杂度[：:]\s*(\d+)|Structure Complexity[：:]\s*(\d+)/i,
      compliance: /合规风险[：:]\s*(\d+)|Compliance Risk[：:]\s*(\d+)/i,
      tax: /税务风险[：:]\s*(\d+)|Tax Risk[：:]\s*(\d+)/i
    };

    const scores: RiskScores = {
      financial: 0,
      control: 0,
      structure: 0,
      compliance: 0,
      tax: 0
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = text.match(pattern);
      if (match) {
        scores[key as keyof RiskScores] = parseInt(match[1] || match[2] || '0');
      }
    });

    return scores;
  }

  private extractSummary(text: string): string {
    const patterns = [
      /综合分析[：:]\s*([^]*?)(?=\n\d+\.|改进建议|$)/i,
      /Comprehensive Analysis[：:]\s*([^]*?)(?=\n\d+\.|Improvement|$)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return '暂无分析摘要';
  }

  private extractSuggestions(text: string): string[] {
    const patterns = [
      /改进建议[：:]\s*([^]*?)$/i,
      /Improvement Suggestions[：:]\s*([^]*?)$/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1]
          .split(/\n/)
          .filter(line => line.trim())
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(line => line.length > 0);
      }
    }

    return [];
  }

  private calculateConfidence(text: string): number {
    // 基于文本长度和结构完整性计算置信度
    const hasRiskScores = /\d+/.test(text);
    const hasSummary = text.length > 100;
    const hasSuggestions = text.includes('建议') || text.includes('Suggestion');
    
    let confidence = 0.5; // 基础置信度
    if (hasRiskScores) confidence += 0.2;
    if (hasSummary) confidence += 0.2;
    if (hasSuggestions) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }
}
```

### 3. AI服务工厂
```typescript
// lib/ai/AIServiceFactory.ts
export class AIServiceFactory {
  static create(provider: 'huggingface' | 'openai' | 'deepseek' = 'huggingface'): AIService {
    switch (provider) {
      case 'huggingface':
        return new HuggingFaceService(process.env.HUGGINGFACE_API_KEY!);
      case 'openai':
        return new OpenAIService(process.env.OPENAI_API_KEY!);
      case 'deepseek':
        return new DeepSeekService(process.env.DEEPSEEK_API_KEY!);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
}
```

## 数据类型定义

### 1. AI相关类型
```typescript
// types/ai.ts
export interface RiskScores {
  financial: number;    // 金融账户风险 0-100
  control: number;      // 控制人风险 0-100
  structure: number;    // 结构复杂度 0-100
  compliance: number;   // 合规风险 0-100
  tax: number;         // 税务风险 0-100
}

export interface AIAnalysisResult {
  riskScores: RiskScores;
  summary: string;
  suggestions: string[];
  confidence: number;
  language: 'zh' | 'en';
  rawResponse?: string;
  processingTime?: number;
}

export interface UserProfile {
  name: string;
  phone: string;
  industry?: string;
  company?: string;
  position?: string;
}

export interface Answer {
  questionId: string;
  question: string;
  optionId: string;
  selectedOption: string;
  score: number;
}

export class AIServiceError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'AIServiceError';
  }
}
```

## API端点实现

### 1. AI分析API
```typescript
// app/api/ai/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AIServiceFactory } from '@/lib/ai/AIServiceFactory';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { responseId, language = 'zh' } = await request.json();
    
    // 获取答题记录和答案
    const { data: response, error: responseError } = await supabase
      .from('responses')
      .select(`
        *,
        user:users(*),
        answers:answers(
          *,
          question:questions(*),
          option:options(*)
        )
      `)
      .eq('id', responseId)
      .single();

    if (responseError || !response) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      );
    }

    // 转换数据格式
    const answers: Answer[] = response.answers.map((answer: any) => ({
      questionId: answer.question.id,
      question: answer.question.content,
      optionId: answer.option.id,
      selectedOption: answer.option.label,
      score: answer.option.score
    }));

    const userProfile: UserProfile | undefined = response.user ? {
      name: response.user.name,
      phone: response.user.phone
    } : undefined;

    // 调用AI服务
    const aiService = AIServiceFactory.create('huggingface');
    const startTime = Date.now();
    
    const analysisResult = await aiService.generateAnalysis(
      answers,
      userProfile,
      language
    );
    
    const processingTime = Date.now() - startTime;

    // 保存分析结果
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('ai_analyses')
      .insert({
        response_id: responseId,
        analysis_type: 'risk_assessment',
        language,
        risk_scores: analysisResult.riskScores,
        summary: analysisResult.summary,
        suggestions: analysisResult.suggestions,
        confidence: analysisResult.confidence,
        ai_model: 'huggingface',
        processing_time: processingTime
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save analysis:', saveError);
    }

    return NextResponse.json({
      analysis: {
        ...analysisResult,
        processingTime
      },
      analysisId: savedAnalysis?.id
    });

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json(
      { error: 'AI analysis failed' },
      { status: 500 }
    );
  }
}
```

### 2. 获取分析结果API
```typescript
// app/api/ai/analysis/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: analysis, error } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Get Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to get analysis' },
      { status: 500 }
    );
  }
}
```

## 前端AI集成

### 1. AI Hook
```typescript
// hooks/useAI.ts
export function useAI() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = async (responseId: string, language: 'zh' | 'en' = 'zh') => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ responseId, language })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysisResult(data.analysis);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAnalysis = async (analysisId: string) => {
    try {
      const response = await fetch(`/api/ai/analysis/${analysisId}`);
      if (!response.ok) {
        throw new Error('Failed to get analysis');
      }
      const data = await response.json();
      setAnalysisResult(data.analysis);
      return data.analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    isAnalyzing,
    analysisResult,
    error,
    generateAnalysis,
    getAnalysis
  };
}
```

### 2. 雷达图组件
```typescript
// components/result/RadarChart.tsx
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface RadarChartProps {
  riskScores: RiskScores;
  language?: 'zh' | 'en';
}

export function RiskRadarChart({ riskScores, language = 'zh' }: RadarChartProps) {
  const labels = {
    zh: {
      financial: '金融账户',
      control: '控制人',
      structure: '结构复杂度',
      compliance: '合规',
      tax: '税务'
    },
    en: {
      financial: 'Financial',
      control: 'Control',
      structure: 'Structure',
      compliance: 'Compliance',
      tax: 'Tax'
    }
  };

  const data = Object.entries(riskScores).map(([key, value]) => ({
    subject: labels[language][key as keyof typeof labels.zh],
    score: value,
    fullMark: 100
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={false}
          />
          <Radar
            name="Risk Score"
            dataKey="score"
            stroke="#7C3AED"
            fill="#7C3AED"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

## 错误处理和重试机制

### 1. AI服务错误处理
```typescript
// lib/ai/errorHandler.ts
export class AIErrorHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        // 指数退避
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }

    throw new AIServiceError(`Operation failed after ${maxRetries} attempts`, lastError);
  }

  static handleAPIError(error: any): never {
    if (error.response?.status === 429) {
      throw new AIServiceError('AI服务请求过于频繁，请稍后再试');
    } else if (error.response?.status === 401) {
      throw new AIServiceError('AI服务认证失败');
    } else if (error.response?.status >= 500) {
      throw new AIServiceError('AI服务暂时不可用');
    } else {
      throw new AIServiceError('AI分析失败，请重试');
    }
  }
}
```
