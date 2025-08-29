import OpenAI from 'openai'
import { aiSuggestSchema } from '../../../_lib/schemas'
import { getSession, requireAuth } from '../../../_lib/auth'
import { badRequest, corsPreflightResponse, setCorsHeaders, parseJsonBody, methodNotAllowed, getClientIP, checkRateLimit, tooManyRequests } from '../../../_lib/utils'

export const config = { runtime: 'nodejs' }

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req: Request) {
  const origin = req.headers.get('origin')
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(origin)
  }

  if (req.method !== 'POST') {
    const response = methodNotAllowed(['POST'])
    return setCorsHeaders(response, origin)
  }

  try {
    // Require authentication for AI services
    const session = await getSession(req)
    const authSession = requireAuth(session)

    // Rate limiting for AI requests
    const clientIP = getClientIP(req)
    const rateLimit = checkRateLimit(`ai:${clientIP}`, 10, 60 * 60 * 1000) // 10 requests per hour
    
    if (!rateLimit.allowed) {
      const response = tooManyRequests(Math.ceil((rateLimit.resetTime - Date.now()) / 1000))
      return setCorsHeaders(response, origin)
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      const response = new Response(JSON.stringify({
        code: 'AI_SERVICE_UNAVAILABLE',
        message: 'AI service is not configured',
        timestamp: new Date().toISOString()
      }), { 
        status: 503,
        headers: { 'content-type': 'application/json' }
      })
      return setCorsHeaders(response, origin)
    }

    // Parse and validate request body
    const body = await parseJsonBody(req)
    const parsed = aiSuggestSchema.safeParse(body)
    
    if (!parsed.success) {
      const response = badRequest('VALIDATION_ERROR', 'Invalid AI request data', parsed.error.flatten())
      return setCorsHeaders(response, origin)
    }

    const { topic, target_audience, question_count, question_types, existing_questions, language } = parsed.data

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial event
          controller.enqueue(encoder('event: start\ndata: {"status": "generating"}\n\n'))

          // Generate system prompt
          const systemPrompt = createSystemPrompt(language)
          
          // Generate user prompt
          const userPrompt = createUserPrompt({
            topic,
            target_audience,
            question_count,
            question_types,
            existing_questions,
            language
          })

          // Call OpenAI API with streaming
          const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 2000
          })

          let fullResponse = ''
          let questionCount = 0

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || ''
            fullResponse += content

            // Try to parse and stream individual questions
            const questions = extractQuestionsFromResponse(fullResponse)
            
            // Stream new questions as they become complete
            while (questionCount < questions.length) {
              const question = questions[questionCount]
              controller.enqueue(encoder(`event: question\ndata: ${JSON.stringify(question)}\n\n`))
              questionCount++
            }
          }

          // Final processing and validation
          const finalQuestions = extractQuestionsFromResponse(fullResponse)
          
          // Send completion event
          controller.enqueue(encoder(`event: complete\ndata: ${JSON.stringify({
            total_questions: finalQuestions.length,
            topic,
            generated_at: new Date().toISOString()
          })}\n\n`))

          controller.close()

          // Log AI usage
          console.log(`AI suggestions generated for user ${authSession.userId}: ${topic} (${finalQuestions.length} questions)`)

        } catch (error) {
          console.error('AI suggestion error:', error)
          
          const errorData = {
            error: 'AI_GENERATION_FAILED',
            message: error instanceof Error ? error.message : 'Failed to generate suggestions'
          }
          
          controller.enqueue(encoder(`event: error\ndata: ${JSON.stringify(errorData)}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      status: 200,
      headers: setCorsHeaders(new Response(), origin).headers
    })

  } catch (error) {
    console.error('AI suggest API error:', error)
    
    const response = new Response(JSON.stringify({
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
    
    return setCorsHeaders(response, origin)
  }
}

// Helper functions
const encoder = (text: string) => new TextEncoder().encode(text)

function createSystemPrompt(language: string): string {
  if (language === 'en') {
    return `You are an expert survey designer. Generate high-quality survey questions based on the user's requirements.

Rules:
1. Generate questions in valid JSON format
2. Each question should have: id, type, content, options (if applicable)
3. Question types: single_choice, multiple_choice, text, rating
4. For choice questions, provide 3-5 meaningful options
5. For rating questions, use 1-5 or 1-10 scale
6. Questions should be clear, unbiased, and professional
7. Avoid leading or loaded questions
8. Consider survey flow and logical progression

Output format:
[
  {
    "id": "q1",
    "type": "single_choice",
    "content": "Question text here?",
    "options": [
      {"label": "Option 1", "value": "opt1"},
      {"label": "Option 2", "value": "opt2"}
    ]
  }
]`
  } else {
    return `你是一位专业的问卷设计专家。根据用户需求生成高质量的问卷题目。

规则：
1. 生成有效的JSON格式问题
2. 每个问题包含：id, type, content, options（如适用）
3. 问题类型：single_choice（单选）, multiple_choice（多选）, text（文本）, rating（评分）
4. 选择题提供3-5个有意义的选项
5. 评分题使用1-5或1-10量表
6. 问题应清晰、无偏见、专业
7. 避免引导性或倾向性问题
8. 考虑问卷流程和逻辑顺序

输出格式：
[
  {
    "id": "q1",
    "type": "single_choice",
    "content": "问题内容？",
    "options": [
      {"label": "选项1", "value": "opt1"},
      {"label": "选项2", "value": "opt2"}
    ]
  }
]`
  }
}

function createUserPrompt(params: any): string {
  const { topic, target_audience, question_count, question_types, existing_questions, language } = params
  
  if (language === 'en') {
    let prompt = `Generate ${question_count} survey questions about: ${topic}\n`
    
    if (target_audience) {
      prompt += `Target audience: ${target_audience}\n`
    }
    
    if (question_types && question_types.length > 0) {
      prompt += `Preferred question types: ${question_types.join(', ')}\n`
    }
    
    if (existing_questions && existing_questions.length > 0) {
      prompt += `Avoid similar questions to these existing ones:\n${existing_questions.join('\n')}\n`
    }
    
    prompt += '\nGenerate diverse, engaging questions that provide valuable insights.'
    
    return prompt
  } else {
    let prompt = `生成${question_count}个关于"${topic}"的问卷题目\n`
    
    if (target_audience) {
      prompt += `目标受众：${target_audience}\n`
    }
    
    if (question_types && question_types.length > 0) {
      prompt += `偏好题型：${question_types.join('、')}\n`
    }
    
    if (existing_questions && existing_questions.length > 0) {
      prompt += `避免与以下现有题目重复：\n${existing_questions.join('\n')}\n`
    }
    
    prompt += '\n请生成多样化、有吸引力的问题，能够提供有价值的洞察。'
    
    return prompt
  }
}

function extractQuestionsFromResponse(response: string): any[] {
  try {
    // Try to find JSON array in the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0])
      if (Array.isArray(questions)) {
        return questions.filter(q => q.id && q.type && q.content)
      }
    }
    
    // Fallback: try to extract individual question objects
    const questionMatches = response.match(/\{[^}]*"id"[^}]*\}/g) || []
    const questions = []
    
    for (const match of questionMatches) {
      try {
        const question = JSON.parse(match)
        if (question.id && question.type && question.content) {
          questions.push(question)
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
    
    return questions
  } catch (error) {
    console.error('Error extracting questions:', error)
    return []
  }
}
