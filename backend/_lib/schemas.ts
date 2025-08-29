import { z } from 'zod'

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
})

// User schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nickname: z.string().min(1).max(100),
  phone: z.string().optional(),
  user_type: z.enum(['CONSUMER', 'BUSINESS']).default('CONSUMER')
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export const updateUserProfileSchema = z.object({
  nickname: z.string().min(1).max(100).optional(),
  age: z.number().int().min(1).max(150).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  occupation: z.string().max(100).optional(),
  education: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
  interests: z.record(z.any()).optional(),
  preferences: z.record(z.any()).optional()
})

// Survey schemas
export const createSurveySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  questions: z.array(
    z.object({
      id: z.string().optional(),
      type: z.enum(['single_choice', 'multiple_choice', 'text', 'rating', 'matrix']),
      content: z.string().min(1),
      required: z.boolean().default(true),
      options: z.array(
        z.object({
          label: z.string().min(1),
          value: z.string().optional(),
          score: z.number().int().min(0).max(100).default(0)
        })
      ).optional()
    })
  ).min(1),
  config: z.object({
    allowAnonymous: z.boolean().default(true),
    requireLogin: z.boolean().default(false),
    showProgress: z.boolean().default(true),
    allowBack: z.boolean().default(true),
    randomizeQuestions: z.boolean().default(false),
    timeLimit: z.number().int().positive().optional()
  }).optional(),
  access_type: z.enum(['PUBLIC', 'PRIVATE', 'PASSWORD', 'INVITE']).default('PUBLIC'),
  access_code: z.string().optional(),
  max_responses: z.number().int().positive().optional(),
  expires_at: z.string().datetime().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([])
})

export const updateSurveySchema = createSurveySchema.partial()

export const publishSurveySchema = z.object({
  status: z.enum(['PUBLISHED', 'PAUSED', 'CLOSED'])
})

// Response schemas
export const submitResponseSchema = z.object({
  answers: z.array(
    z.object({
      question_id: z.string(),
      answer_type: z.enum(['text', 'single_choice', 'multiple_choice', 'rating']),
      text_value: z.string().optional(),
      choice_values: z.array(z.string()).optional(),
      numeric_value: z.number().optional()
    })
  ).min(1),
  metadata: z.object({
    user_agent: z.string().optional(),
    screen_resolution: z.string().optional(),
    timezone: z.string().optional(),
    language: z.string().optional()
  }).optional(),
  started_at: z.string().datetime().optional(),
  time_spent: z.number().int().positive().optional()
})

// AI schemas
export const aiSuggestSchema = z.object({
  topic: z.string().min(1).max(200),
  target_audience: z.string().max(200).optional(),
  question_count: z.number().int().min(1).max(20).default(5),
  question_types: z.array(z.enum(['single_choice', 'multiple_choice', 'text', 'rating'])).optional(),
  existing_questions: z.array(z.string()).optional(),
  language: z.enum(['zh', 'en']).default('zh')
})

export const aiAnalyzeResponseSchema = z.object({
  response_id: z.string(),
  analysis_types: z.array(z.enum(['sentiment', 'keywords', 'quality', 'insights'])).default(['quality'])
})

// Template schemas
export const createTemplateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  questions: z.array(z.any()).min(1), // Reuse question structure from survey
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  price: z.number().int().min(0).default(0),
  is_public: z.boolean().default(true)
})

// Point transaction schemas
export const pointTransactionSchema = z.object({
  type: z.enum(['EARN', 'SPEND']),
  amount: z.number().int().positive(),
  source: z.string().min(1),
  reference_id: z.string().optional(),
  reference_type: z.string().optional(),
  description: z.string().optional()
})

// Common response schemas
export const errorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  timestamp: z.string().datetime()
})

export const successResponseSchema = z.object({
  data: z.any(),
  timestamp: z.string().datetime(),
  meta: z.object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    total: z.number().optional(),
    hasMore: z.boolean().optional()
  }).optional()
})

// Validation helper types
export type CreateUserInput = z.infer<typeof createUserSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateSurveyInput = z.infer<typeof createSurveySchema>
export type UpdateSurveyInput = z.infer<typeof updateSurveySchema>
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>
export type AiSuggestInput = z.infer<typeof aiSuggestSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
