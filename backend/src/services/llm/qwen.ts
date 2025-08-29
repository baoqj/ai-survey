import axios, { AxiosInstance } from 'axios'
import { LLMMessage, LLMRequest, LLMResponse, AIServiceConfig, LLMService } from '../../types/llm'
import { logger } from '../../utils/logger'

// 简单的重试函数
const retry = async <T>(fn: () => Promise<T>, retries: number = 3): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error('Retry failed')
}

export class QwenService implements LLMService {
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
        'X-DashScope-SSE': 'disable',
      },
    })
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await retry(async () => {
        return await this.client.post('/services/aigc/text-generation/generation', {
          model: this.config.model || 'qwen-turbo',
          input: {
            messages: request.messages,
          },
          parameters: {
            temperature: request.temperature || 0.7,
            max_tokens: request.max_tokens || 1000,
            top_p: 0.8,
          },
        })
      }, 3, 1000)

      // 转换Qwen响应格式为标准格式
      const qwenResponse = response.data
      return {
        id: qwenResponse.request_id || `qwen-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: this.config.model || 'qwen-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: qwenResponse.output?.text || '',
            },
            finish_reason: qwenResponse.output?.finish_reason || 'stop',
          },
        ],
        usage: {
          prompt_tokens: qwenResponse.usage?.input_tokens || 0,
          completion_tokens: qwenResponse.usage?.output_tokens || 0,
          total_tokens: qwenResponse.usage?.total_tokens || 0,
        },
      }
    } catch (error) {
      logger.error('Qwen API error:', error)
      throw new Error(`Qwen service failed: ${error}`)
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
      logger.error('Qwen analysis error:', error)
      throw new Error(`Qwen analysis failed: ${error}`)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Qwen没有直接的健康检查端点，使用简单的请求测试
      const response = await this.client.post('/services/aigc/text-generation/generation', {
        model: this.config.model || 'qwen-turbo',
        input: {
          messages: [{ role: 'user', content: 'test' }],
        },
        parameters: {
          max_tokens: 1,
        },
      }, {
        timeout: 5000,
      })
      return response.status === 200
    } catch (error) {
      logger.warn('Qwen service unavailable:', error)
      return false
    }
  }
}
