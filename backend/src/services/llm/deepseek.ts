import axios, { AxiosInstance } from 'axios'
import { LLMMessage, LLMRequest, LLMResponse, AIServiceConfig } from '@crs-check/shared'
import { LLMService } from './index'
import { logger } from '@/utils/logger'
import { retry } from '@crs-check/shared'

export class DeepSeekService implements LLMService {
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
          model: this.config.model || 'deepseek-chat',
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 1000,
          stream: false,
        })
      }, 3, 1000)

      return response.data
    } catch (error) {
      logger.error('DeepSeek API error:', error)
      throw new Error(`DeepSeek service failed: ${error}`)
    }
  }

  async generateAnalysis(prompt: string, context?: string): Promise<string> {
    try {
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: '你是一个专业的CRS合规风险评估专家，请用中文提供详细的分析。',
        },
      ]

      if (context) {
        messages.push({
          role: 'system',
          content: `背景信息：${context}`,
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
      logger.error('DeepSeek analysis error:', error)
      throw new Error(`DeepSeek analysis failed: ${error}`)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.get('/models', {
        timeout: 5000,
      })
      return response.status === 200
    } catch (error) {
      logger.warn('DeepSeek service unavailable:', error)
      return false
    }
  }
}
