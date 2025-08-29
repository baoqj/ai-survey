import { LLMMessage, LLMRequest, LLMResponse, AIServiceConfig, LLMService } from '../../types/llm'
import { HuggingFaceService } from './huggingface'
import { OpenAIService } from './openai'
import { DeepSeekService } from './deepseek'
import { QwenService } from './qwen'
import { logger } from '../../utils/logger'
import { config } from '../../config'

export class LLMServiceManager {
  private services: Map<string, LLMService> = new Map()
  private primaryService: string = 'huggingface'
  private fallbackServices: string[] = ['openai', 'deepseek', 'qwen']

  constructor() {
    this.initializeServices()
  }

  private initializeServices() {
    // 初始化Hugging Face服务
    if (config.ai.huggingface.apiKey) {
      this.services.set('huggingface', new HuggingFaceService({
        provider: 'huggingface',
        apiKey: config.ai.huggingface.apiKey,
        baseUrl: config.ai.huggingface.baseUrl,
        timeout: config.analysis.timeout,
      }))
    }

    // 初始化OpenAI服务
    if (config.ai.openai.apiKey) {
      this.services.set('openai', new OpenAIService({
        provider: 'openai',
        apiKey: config.ai.openai.apiKey,
        baseUrl: config.ai.openai.baseUrl,
        model: config.ai.openai.model,
        timeout: config.analysis.timeout,
      }))
    }

    // 初始化DeepSeek服务
    if (config.ai.deepseek.apiKey) {
      this.services.set('deepseek', new DeepSeekService({
        provider: 'deepseek',
        apiKey: config.ai.deepseek.apiKey,
        baseUrl: config.ai.deepseek.baseUrl,
        model: config.ai.deepseek.model,
        timeout: config.analysis.timeout,
      }))
    }

    // 初始化Qwen服务
    if (config.ai.qwen.apiKey) {
      this.services.set('qwen', new QwenService({
        provider: 'qwen',
        apiKey: config.ai.qwen.apiKey,
        baseUrl: config.ai.qwen.baseUrl,
        model: config.ai.qwen.model,
        timeout: config.analysis.timeout,
      }))
    }

    logger.info(`Initialized ${this.services.size} LLM services`)
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    const servicesToTry = [this.primaryService, ...this.fallbackServices]
    
    for (const serviceName of servicesToTry) {
      const service = this.services.get(serviceName)
      if (!service) continue

      try {
        logger.debug(`Trying LLM service: ${serviceName}`)
        const response = await service.generateCompletion(request)
        logger.info(`Successfully generated completion using ${serviceName}`)
        return response
      } catch (error) {
        logger.warn(`LLM service ${serviceName} failed:`, error)
        continue
      }
    }

    throw new Error('All LLM services failed to generate completion')
  }

  async generateAnalysis(prompt: string, context?: string): Promise<string> {
    const servicesToTry = [this.primaryService, ...this.fallbackServices]
    
    for (const serviceName of servicesToTry) {
      const service = this.services.get(serviceName)
      if (!service) continue

      try {
        logger.debug(`Trying analysis with service: ${serviceName}`)
        const result = await service.generateAnalysis(prompt, context)
        logger.info(`Successfully generated analysis using ${serviceName}`)
        return result
      } catch (error) {
        logger.warn(`Analysis service ${serviceName} failed:`, error)
        continue
      }
    }

    throw new Error('All LLM services failed to generate analysis')
  }

  async checkServiceHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {}
    
    for (const [name, service] of this.services) {
      try {
        health[name] = await service.isAvailable()
      } catch (error) {
        health[name] = false
        logger.warn(`Health check failed for ${name}:`, error)
      }
    }
    
    return health
  }

  getAvailableServices(): string[] {
    return Array.from(this.services.keys())
  }

  setPrimaryService(serviceName: string) {
    if (this.services.has(serviceName)) {
      this.primaryService = serviceName
      logger.info(`Primary LLM service set to: ${serviceName}`)
    } else {
      throw new Error(`Service ${serviceName} is not available`)
    }
  }
}

// 单例实例
export const llmManager = new LLMServiceManager()

// 导出服务类
export { HuggingFaceService, OpenAIService, DeepSeekService, QwenService }
