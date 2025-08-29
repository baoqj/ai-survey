import OpenAI from 'openai'
import { prisma } from '../../../_lib/db'
import { aiAnalyzeResponseSchema } from '../../../_lib/schemas'
import { getSession, requireAuth } from '../../../_lib/auth'
import { ok, badRequest, notFound, forbidden, corsPreflightResponse, setCorsHeaders, parseJsonBody, methodNotAllowed, validateUUID, getClientIP, checkRateLimit, tooManyRequests } from '../../../_lib/utils'

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
    // Require authentication for AI analysis
    const session = await getSession(req)
    const authSession = requireAuth(session)

    // Rate limiting for AI requests
    const clientIP = getClientIP(req)
    const rateLimit = checkRateLimit(`ai_analyze:${clientIP}`, 20, 60 * 60 * 1000) // 20 requests per hour
    
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
    const parsed = aiAnalyzeResponseSchema.safeParse(body)
    
    if (!parsed.success) {
      const response = badRequest('VALIDATION_ERROR', 'Invalid AI analysis request', parsed.error.flatten())
      return setCorsHeaders(response, origin)
    }

    const { response_id, analysis_types } = parsed.data

    // Validate response ID
    if (!validateUUID(response_id)) {
      const response = badRequest('INVALID_ID', 'Invalid response ID format')
      return setCorsHeaders(response, origin)
    }

    // Get response with survey info
    const responseData = await prisma.response.findUnique({
      where: { id: response_id },
      include: {
        survey: {
          select: {
            id: true,
            title: true,
            questions: true,
            creator_id: true
          }
        },
        respondent: {
          select: {
            id: true,
            nickname: true
          }
        }
      }
    })

    if (!responseData) {
      const response = notFound('Response not found')
      return setCorsHeaders(response, origin)
    }

    // Check if user owns the survey or is admin
    if (responseData.survey.creator_id !== authSession.userId && authSession.userType !== 'ADMIN') {
      const response = forbidden('You can only analyze responses to your own surveys')
      return setCorsHeaders(response, origin)
    }

    // Perform AI analysis
    const analysisResults = await performAIAnalysis(responseData, analysis_types)

    // Store analysis results
    for (const [analysisType, result] of Object.entries(analysisResults)) {
      await prisma.responseAnalytics.upsert({
        where: {
          response_id_analysis_type: {
            response_id: response_id,
            analysis_type: analysisType
          }
        },
        update: {
          analysis_result: result.analysis,
          confidence: result.confidence,
          model_version: 'gpt-4'
        },
        create: {
          response_id: response_id,
          analysis_type: analysisType,
          analysis_result: result.analysis,
          confidence: result.confidence,
          model_version: 'gpt-4'
        }
      })
    }

    // Update response with overall quality score
    const qualityScore = determineQualityScore(analysisResults)
    await prisma.response.update({
      where: { id: response_id },
      data: { 
        ai_analysis: analysisResults,
        quality_score: qualityScore
      }
    })

    // Log AI analysis
    console.log(`AI analysis completed for response ${response_id} by user ${authSession.userId}`)

    const response = ok({
      response_id,
      analysis_results: analysisResults,
      quality_score: qualityScore,
      analyzed_at: new Date().toISOString()
    })
    
    return setCorsHeaders(response, origin)

  } catch (error) {
    console.error('AI analyze API error:', error)
    
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

async function performAIAnalysis(responseData: any, analysisTypes: string[]) {
  const results: Record<string, any> = {}
  
  // Prepare context for AI analysis
  const questions = responseData.survey.questions as any[]
  const answers = responseData.answers as any[]
  
  // Create analysis context
  const context = {
    survey_title: responseData.survey.title,
    questions: questions.map(q => ({
      id: q.id,
      content: q.content,
      type: q.type
    })),
    answers: answers.map(a => {
      const question = questions.find(q => q.id === a.question_id)
      return {
        question: question?.content || 'Unknown question',
        answer_type: a.answer_type,
        text_value: a.text_value,
        choice_values: a.choice_values,
        numeric_value: a.numeric_value
      }
    }),
    completion_rate: responseData.completion_rate,
    time_spent: responseData.time_spent,
    is_anonymous: responseData.is_anonymous
  }

  // Perform different types of analysis
  for (const analysisType of analysisTypes) {
    try {
      switch (analysisType) {
        case 'sentiment':
          results[analysisType] = await analyzeSentiment(context)
          break
        case 'keywords':
          results[analysisType] = await extractKeywords(context)
          break
        case 'quality':
          results[analysisType] = await assessQuality(context)
          break
        case 'insights':
          results[analysisType] = await generateInsights(context)
          break
        default:
          console.warn(`Unknown analysis type: ${analysisType}`)
      }
    } catch (error) {
      console.error(`Error in ${analysisType} analysis:`, error)
      results[analysisType] = {
        analysis: { error: 'Analysis failed' },
        confidence: 0
      }
    }
  }

  return results
}

async function analyzeSentiment(context: any) {
  const textAnswers = context.answers
    .filter((a: any) => a.text_value)
    .map((a: any) => `${a.question}: ${a.text_value}`)
    .join('\n')

  if (!textAnswers) {
    return {
      analysis: { sentiment: 'neutral', reason: 'No text answers to analyze' },
      confidence: 0.5
    }
  }

  const prompt = `分析以下问卷回答的情感倾向，返回JSON格式：
{
  "sentiment": "positive|negative|neutral",
  "score": 0-1之间的数值,
  "reason": "分析原因"
}

问卷回答：
${textAnswers}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 500
  })

  const result = completion.choices[0]?.message?.content
  try {
    const analysis = JSON.parse(result || '{}')
    return {
      analysis,
      confidence: analysis.score || 0.5
    }
  } catch {
    return {
      analysis: { sentiment: 'neutral', reason: 'Failed to parse analysis' },
      confidence: 0.3
    }
  }
}

async function extractKeywords(context: any) {
  const textAnswers = context.answers
    .filter((a: any) => a.text_value)
    .map((a: any) => a.text_value)
    .join(' ')

  if (!textAnswers) {
    return {
      analysis: { keywords: [], themes: [] },
      confidence: 0.5
    }
  }

  const prompt = `从以下文本中提取关键词和主题，返回JSON格式：
{
  "keywords": ["关键词1", "关键词2"],
  "themes": ["主题1", "主题2"],
  "frequency": {"词汇": 频次}
}

文本内容：
${textAnswers}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 500
  })

  const result = completion.choices[0]?.message?.content
  try {
    const analysis = JSON.parse(result || '{}')
    return {
      analysis,
      confidence: 0.8
    }
  } catch {
    return {
      analysis: { keywords: [], themes: [] },
      confidence: 0.3
    }
  }
}

async function assessQuality(context: any) {
  const prompt = `评估以下问卷回答的质量，返回JSON格式：
{
  "score": "green|amber|red",
  "completeness": 0-1,
  "thoughtfulness": 0-1,
  "consistency": 0-1,
  "issues": ["问题1", "问题2"],
  "recommendations": ["建议1", "建议2"]
}

问卷信息：
完成率: ${context.completion_rate}
用时: ${context.time_spent}秒
回答内容: ${JSON.stringify(context.answers, null, 2)}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 800
  })

  const result = completion.choices[0]?.message?.content
  try {
    const analysis = JSON.parse(result || '{}')
    return {
      analysis,
      confidence: 0.85
    }
  } catch {
    return {
      analysis: { score: 'amber', issues: ['Analysis failed'] },
      confidence: 0.3
    }
  }
}

async function generateInsights(context: any) {
  const prompt = `基于以下问卷回答生成洞察分析，返回JSON格式：
{
  "insights": ["洞察1", "洞察2"],
  "patterns": ["模式1", "模式2"],
  "recommendations": ["建议1", "建议2"],
  "summary": "总结"
}

问卷: ${context.survey_title}
回答: ${JSON.stringify(context.answers, null, 2)}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 1000
  })

  const result = completion.choices[0]?.message?.content
  try {
    const analysis = JSON.parse(result || '{}')
    return {
      analysis,
      confidence: 0.75
    }
  } catch {
    return {
      analysis: { insights: [], summary: 'Analysis failed' },
      confidence: 0.3
    }
  }
}

function determineQualityScore(analysisResults: any): 'GREEN' | 'AMBER' | 'RED' {
  const qualityAnalysis = analysisResults.quality
  if (qualityAnalysis?.analysis?.score) {
    return qualityAnalysis.analysis.score.toUpperCase()
  }
  
  // Fallback logic based on other analyses
  const avgConfidence = Object.values(analysisResults)
    .map((r: any) => r.confidence || 0)
    .reduce((sum: number, conf: number) => sum + conf, 0) / Object.keys(analysisResults).length

  if (avgConfidence > 0.7) return 'GREEN'
  if (avgConfidence > 0.4) return 'AMBER'
  return 'RED'
}
