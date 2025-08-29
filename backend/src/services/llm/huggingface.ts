import axios, { AxiosInstance } from 'axios'
import { LLMMessage, LLMRequest, LLMResponse, AIServiceConfig } from '@crs-check/shared'
import { LLMService } from './index'
import { logger } from '@/utils/logger'
import { retry } from '@crs-check/shared'

export class HuggingFaceService implements LLMService {
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
      // Hugging Face Inference API 格式转换
      const prompt = this.formatMessagesToPrompt(request.messages)
      
      const response = await retry(async () => {
        return await this.client.post('/models/microsoft/DialoGPT-medium', {
          inputs: prompt,
          parameters: {
            max_length: request.max_tokens || 1000,
            temperature: request.temperature || 0.7,
            do_sample: true,
            top_p: 0.9,
          },
          options: {
            wait_for_model: true,
            use_cache: false,
          },
        })
      }, 3, 1000)

      // 转换为标准格式
      const generatedText = response.data[0]?.generated_text || ''
      const cleanedText = this.cleanGeneratedText(generatedText, prompt)

      return {
        id: `hf-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'microsoft/DialoGPT-medium',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: cleanedText,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: this.estimateTokens(prompt),
          completion_tokens: this.estimateTokens(cleanedText),
          total_tokens: this.estimateTokens(prompt + cleanedText),
        },
      }
    } catch (error) {
      logger.error('Hugging Face API error:', error)
      throw new Error(`Hugging Face service failed: ${error}`)
    }
  }

  async generateAnalysis(prompt: string, context?: string): Promise<string> {
    try {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt
      
      const response = await retry(async () => {
        return await this.client.post('/models/microsoft/DialoGPT-medium', {
          inputs: fullPrompt,
          parameters: {
            max_length: 2000,
            temperature: 0.3,
            do_sample: true,
            top_p: 0.8,
          },
          options: {
            wait_for_model: true,
            use_cache: false,
          },
        })
      }, 3, 1000)

      const generatedText = response.data[0]?.generated_text || ''
      return this.cleanGeneratedText(generatedText, fullPrompt)
    } catch (error) {
      logger.error('Hugging Face analysis error:', error)
      throw new Error(`Hugging Face analysis failed: ${error}`)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.get('/models/microsoft/DialoGPT-medium', {
        timeout: 5000,
      })
      return response.status === 200
    } catch (error) {
      logger.warn('Hugging Face service unavailable:', error)
      return false
    }
  }

  private formatMessagesToPrompt(messages: LLMMessage[]): string {
    return messages
      .map(msg => {
        switch (msg.role) {
          case 'system':
            return `System: ${msg.content}`
          case 'user':
            return `Human: ${msg.content}`
          case 'assistant':
            return `Assistant: ${msg.content}`
          default:
            return msg.content
        }
      })
      .join('\n') + '\nAssistant:'
  }

  private cleanGeneratedText(generatedText: string, originalPrompt: string): string {
    // 移除原始提示词
    let cleaned = generatedText.replace(originalPrompt, '').trim()
    
    // 移除可能的前缀
    cleaned = cleaned.replace(/^(Assistant:|Human:|System:)/, '').trim()
    
    // 移除重复的内容
    const lines = cleaned.split('\n')
    const uniqueLines = [...new Set(lines)]
    cleaned = uniqueLines.join('\n').trim()
    
    return cleaned || '抱歉，我无法生成有效的回复。'
  }

  private estimateTokens(text: string): number {
    // 简单的token估算：中文字符按2个token计算，英文单词按1个token计算
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    return chineseChars * 2 + englishWords
  }
}

// 专门用于CRS分析的Hugging Face服务
export class HuggingFaceCRSAnalyzer {
  private service: HuggingFaceService

  constructor(config: AIServiceConfig) {
    this.service = new HuggingFaceService(config)
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
      logger.error('CRS analysis failed:', error)
      throw new Error('CRS风险分析失败，请稍后重试')
    }
  }

  private buildCRSAnalysisPrompt(answers: any[], userProfile?: any): string {
    const context = `
你是一个专业的CRS（共同申报准则）合规风险评估专家。请根据用户的问卷回答，从以下五个维度进行风险评估：

1. 金融账户风险 (0-100分)
2. 控制人风险 (0-100分) 
3. 结构复杂度 (0-100分)
4. 合规风险 (0-100分)
5. 税务风险 (0-100分)

用户回答：
${JSON.stringify(answers, null, 2)}

${userProfile ? `用户信息：${JSON.stringify(userProfile, null, 2)}` : ''}

请按照以下JSON格式返回分析结果：
{
  "riskScores": {
    "financial": 数字(0-100),
    "control": 数字(0-100),
    "structure": 数字(0-100),
    "compliance": 数字(0-100),
    "tax": 数字(0-100)
  },
  "summary": "详细的风险分析总结",
  "suggestions": ["建议1", "建议2", "建议3"],
  "confidence": 数字(0-1)
}
`

    return context
  }

  private parseCRSAnalysisResult(result: string): {
    riskScores: Record<string, number>
    summary: string
    suggestions: string[]
    confidence: number
  } {
    try {
      // 尝试解析JSON格式的结果
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          riskScores: parsed.riskScores || {},
          summary: parsed.summary || '分析结果解析失败',
          suggestions: parsed.suggestions || [],
          confidence: parsed.confidence || 0.5,
        }
      }
    } catch (error) {
      logger.warn('Failed to parse structured analysis result:', error)
    }

    // 如果JSON解析失败，使用文本解析
    return this.parseTextAnalysisResult(result)
  }

  private parseTextAnalysisResult(result: string): {
    riskScores: Record<string, number>
    summary: string
    suggestions: string[]
    confidence: number
  } {
    // 简单的文本解析逻辑
    const riskScores = {
      financial: this.extractScore(result, '金融账户') || 50,
      control: this.extractScore(result, '控制人') || 50,
      structure: this.extractScore(result, '结构') || 50,
      compliance: this.extractScore(result, '合规') || 50,
      tax: this.extractScore(result, '税务') || 50,
    }

    const suggestions = this.extractSuggestions(result)
    
    return {
      riskScores,
      summary: result.substring(0, 500) + '...',
      suggestions,
      confidence: 0.6,
    }
  }

  private extractScore(text: string, keyword: string): number | null {
    const regex = new RegExp(`${keyword}[^0-9]*([0-9]+)`, 'i')
    const match = text.match(regex)
    return match ? Math.min(100, Math.max(0, parseInt(match[1]))) : null
  }

  private extractSuggestions(text: string): string[] {
    const suggestions: string[] = []
    const lines = text.split('\n')
    
    for (const line of lines) {
      if (line.includes('建议') || line.includes('应该') || line.includes('需要')) {
        suggestions.push(line.trim())
      }
    }
    
    return suggestions.slice(0, 5) // 最多返回5个建议
  }
}
