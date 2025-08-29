// LLM服务相关类型定义

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface AIServiceConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
}

export interface LLMService {
  generateCompletion(request: LLMRequest): Promise<LLMResponse>;
  generateAnalysis(prompt: string, context?: string): Promise<string>;
  isAvailable(): Promise<boolean>;
}
