import { z } from 'zod'

// 用户相关类型
export interface User {
  id: string;
  email: string;
  phone?: string;
  password_hash: string;
  nickname: string;
  avatar_url?: string;
  user_type: 'consumer' | 'business' | 'admin';
  status: 'active' | 'inactive' | 'banned';
  points: number;
  level: number;
  email_verified: boolean;
  phone_verified: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  occupation?: string;
  education?: string;
  location?: string;
  interests?: Record<string, any>;
  behavior_tags?: Record<string, any>;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserTag {
  id: string;
  user_id: string;
  tag_name: string;
  tag_value?: string;
  confidence: number;
  source: 'system' | 'manual' | 'ai';
  created_at: string;
  updated_at: string;
}

// 问卷相关类型
export interface Survey {
  id: string;
  title: string;
  description?: string;
  created_by?: string;
  is_active: boolean;
  is_public: boolean;
  max_responses?: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  settings?: SurveySettings;
  questions?: Question[];
}

export interface SurveySettings {
  allowAnonymous: boolean;
  requireLogin: boolean;
  showProgress: boolean;
  allowBack: boolean;
}

export interface Question {
  id: string;
  survey_id: string;
  content: string;
  question_type: QuestionType;
  order_index: number;
  is_required: boolean;
  created_at: string;
  config?: Record<string, any>;
  options?: Option[];
}

export type QuestionType = 'single_choice' | 'multiple_choice' | 'text' | 'rating' | 'matrix';

export interface Option {
  id: string;
  question_id: string;
  label: string;
  value?: string;
  score: number;
  order_index: number;
  created_at: string;
  config?: Record<string, any>;
}

// 答题相关类型
export interface Response {
  id: string;
  user_id?: string;
  survey_id: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  started_at: string;
  completed_at?: string;
  is_completed: boolean;
  completion_time?: number;
  metadata?: Record<string, any>;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  response_id: string;
  question_id: string;
  option_id?: string;
  text_value?: string;
  numeric_value?: number;
  created_at: string;
  question?: Question;
  option?: Option;
}

// AI分析相关类型
export interface AIAnalysis {
  id: string;
  response_id: string;
  analysis_type: string;
  language: 'zh' | 'en';
  risk_scores: RiskScores;
  summary?: string;
  suggestions?: string[];
  confidence: number;
  ai_model?: string;
  processing_time?: number;
  created_at: string;
}

export interface RiskScores {
  financial: number;    // 金融账户风险 0-100
  control: number;      // 控制人风险 0-100
  structure: number;    // 结构复杂度 0-100
  compliance: number;   // 合规风险 0-100
  tax: number;         // 税务风险 0-100
}

// 系统配置类型
export interface SystemConfig {
  id: string;
  key: string;
  value: Record<string, any>;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 表单相关类型
export interface CreateUserRequest {
  name: string;
  phone: string;
}

export interface CreateSurveyRequest {
  title: string;
  description?: string;
  questions: CreateQuestionRequest[];
}

export interface CreateQuestionRequest {
  content: string;
  question_type: QuestionType;
  order_index: number;
  is_required?: boolean;
  options: CreateOptionRequest[];
}

export interface CreateOptionRequest {
  label: string;
  value?: string;
  score: number;
  order_index: number;
}

export interface CreateResponseRequest {
  user_id?: string;
  survey_id: string;
  answers: CreateAnswerRequest[];
}

export interface CreateAnswerRequest {
  question_id: string;
  option_id?: string;
  text_value?: string;
  numeric_value?: number;
}

// 统计相关类型
export interface SurveyStatistics {
  survey_id: string;
  total_responses: number;
  completed_responses: number;
  completion_rate: number;
  average_completion_time?: number;
  question_stats: QuestionStatistics[];
}

export interface QuestionStatistics {
  question_id: string;
  content: string;
  response_count: number;
  option_stats: OptionStatistics[];
}

export interface OptionStatistics {
  option_id: string;
  label: string;
  count: number;
  percentage: number;
}

export interface DashboardStats {
  overview: {
    total_surveys: number;
    total_responses: number;
    total_users: number;
    completion_rate: number;
  };
  recent_activity: {
    date: string;
    responses: number;
    new_users: number;
  }[];
  top_surveys: {
    survey_id: string;
    title: string;
    response_count: number;
    completion_rate: number;
  }[];
}

// 错误类型
export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

// Zod验证schemas
export const UserSchema = z.object({
  name: z.string().min(2).max(50),
  phone: z.string().regex(/^1[3-9]\d{9}$/),
  email: z.string().email().optional(),
});

export const SurveySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  is_public: z.boolean().default(true),
});

export const QuestionSchema = z.object({
  content: z.string().min(1),
  question_type: z.enum(['single_choice', 'multiple_choice', 'text', 'rating', 'matrix']),
  order_index: z.number().int().min(0),
  is_required: z.boolean().default(true),
});

export const OptionSchema = z.object({
  label: z.string().min(1),
  value: z.string().optional(),
  score: z.number().int().min(0).max(100),
  order_index: z.number().int().min(0),
});

export const ResponseSchema = z.object({
  survey_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  session_id: z.string().optional(),
});

export const AnswerSchema = z.object({
  question_id: z.string().uuid(),
  option_id: z.string().uuid().optional(),
  text_value: z.string().optional(),
  numeric_value: z.number().optional(),
});

// AI相关类型
export interface AIServiceConfig {
  provider: 'huggingface' | 'openai' | 'deepseek' | 'qwen';
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
}

export interface AIAnalysisRequest {
  answers: Answer[];
  userProfile?: User;
  language?: 'zh' | 'en';
  analysisType?: string;
}

export interface AIAnalysisResult {
  riskScores: RiskScores;
  summary: string;
  suggestions: string[];
  confidence: number;
  language: 'zh' | 'en';
  processingTime?: number;
  rawResponse?: string;
}

// LLM API相关类型
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: LLMMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
