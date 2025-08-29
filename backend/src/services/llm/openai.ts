import axios, { AxiosInstance } from 'axios'
import { LLMMessage, LLMRequest, LLMResponse, AIServiceConfig } from '@crs-check/shared'
import { LLMService } from './index'
import { logger } from '@/utils/logger'
import { retry } from '@crs-check/shared'

export class OpenAIService implements LLMService {
  private client: AxiosInstance
  private config: AIServiceConfig

  constructor(config: AIServiceConfig) {
    this.config = config
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    })
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await retry(async () => {
        return await this.client.post('/chat/completions', {
          model: this.config.model || 'gpt-3.5-turbo',
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 1000,
          stream: false,
        })
      }, 3, 1000)

      return response.data
    } catch (error) {
      logger.error('OpenAI API error:', error)
      throw new Error(`OpenAI service failed: ${error}`)
    }
  }

  async generateAnalysis(prompt: string, context?: string): Promise<string> {
    try {
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: 'You are a professional CRS compliance risk assessment expert. Please provide detailed analysis in Chinese.',
        },
      ]

      if (context) {
        messages.push({
          role: 'system',
          content: `Context: ${context}`,
        })
      }

      messages.push({
        role: 'user',
        content: prompt,
      })

      const response = await this.generateCompletion({
        messages,
        temperature: 0.3,
        max_tokens: 2000,
      })

      return response.choices[0]?.message?.content || '分析失败'
    } catch (error) {
      logger.error('OpenAI analysis error:', error)
      throw new Error(`OpenAI analysis failed: ${error}`)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.get('/models', {
        timeout: 5000,
      })
      return response.status === 200
    } catch (error) {
      logger.warn('OpenAI service unavailable:', error)
      return false
    }
  }
}

// 专门用于CRS分析的OpenAI服务
export class OpenAICRSAnalyzer {
  private service: OpenAIService

  constructor(config: AIServiceConfig) {
    this.service = new OpenAIService(config)
  }

  async analyzeCRSRisk(answers: any[], userProfile?: any): Promise<{
    riskScores: Record<string, number>
    summary: string
    suggestions: string[]
    confidence: number
  }> {
    const analysisPrompt = this.buildCRSAnalysisPrompt(answers, userProfile)
    
    try {
      const result = await this.service.generateAnalysis(analysisPrompt)
      return this.parseCRSAnalysisResult(result)
    } catch (error) {
      logger.error('OpenAI CRS analysis failed:', error)
      throw new Error('CRS风险分析失败，请稍后重试')
    }
  }

  private buildCRSAnalysisPrompt(answers: any[], userProfile?: any): string {
    return `
作为CRS（共同申报准则）合规风险评估专家，请根据以下用户问卷回答进行专业分析：

用户回答数据：
${JSON.stringify(answers, null, 2)}

${userProfile ? `用户基本信息：${JSON.stringify(userProfile, null, 2)}` : ''}

请从以下五个维度进行风险评估（0-100分）：
1. 金融账户风险：评估境外金融账户的合规风险
2. 控制人风险：评估实际控制人和受益人的税收居民身份风险
3. 结构复杂度：评估企业架构和持股结构的复杂程度
4. 合规风险：评估现有合规制度和流程的完善程度
5. 税务风险：评估税务申报和信息披露的风险

请严格按照以下JSON格式返回结果：
{
  "riskScores": {
    "financial": 数值,
    "control": 数值,
    "structure": 数值,
    "compliance": 数值,
    "tax": 数值
  },
  "summary": "详细的风险分析总结，包含主要风险点和整体评估",
  "suggestions": [
    "具体的改进建议1",
    "具体的改进建议2",
    "具体的改进建议3",
    "具体的改进建议4",
    "具体的改进建议5"
  ],
  "confidence": 0.85
}

请确保：
1. 所有风险评分都在0-100之间
2. 总结要专业、详细且针对性强
3. 建议要具体可执行
4. 置信度要基于数据完整性和分析准确性
`
  }

  private parseCRSAnalysisResult(result: string): {
    riskScores: Record<string, number>
    summary: string
    suggestions: string[]
    confidence: number
  } {
    try {
      // 提取JSON部分
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        
        // 验证和清理数据
        const riskScores = {
          financial: this.validateScore(parsed.riskScores?.financial),
          control: this.validateScore(parsed.riskScores?.control),
          structure: this.validateScore(parsed.riskScores?.structure),
          compliance: this.validateScore(parsed.riskScores?.compliance),
          tax: this.validateScore(parsed.riskScores?.tax),
        }

        return {
          riskScores,
          summary: parsed.summary || '分析结果生成失败',
          suggestions: Array.isArray(parsed.suggestions) 
            ? parsed.suggestions.slice(0, 5) 
            : ['请联系专业顾问获取详细建议'],
          confidence: this.validateConfidence(parsed.confidence),
        }
      }
    } catch (error) {
      logger.warn('Failed to parse OpenAI analysis result:', error)
    }

    // 如果解析失败，返回默认结果
    return {
      riskScores: {
        financial: 50,
        control: 50,
        structure: 50,
        compliance: 50,
        tax: 50,
      },
      summary: '分析结果解析失败，建议重新进行评估',
      suggestions: [
        '请检查问卷回答的完整性',
        '建议咨询专业税务顾问',
        '定期进行合规风险评估',
      ],
      confidence: 0.3,
    }
  }

  private validateScore(score: any): number {
    const num = Number(score)
    if (isNaN(num)) return 50
    return Math.min(100, Math.max(0, num))
  }

  private validateConfidence(confidence: any): number {
    const num = Number(confidence)
    if (isNaN(num)) return 0.5
    return Math.min(1, Math.max(0, num))
  }
}
