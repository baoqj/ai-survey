import { ok, corsPreflightResponse, setCorsHeaders } from '../../_lib/utils'
import { checkDatabaseConnection } from '../../_lib/db'

export const config = { runtime: 'nodejs' }

export default async function handler(req: Request) {
  const origin = req.headers.get('origin')
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(origin)
  }

  if (req.method !== 'GET') {
    const response = new Response(JSON.stringify({
      code: 'METHOD_NOT_ALLOWED',
      message: 'Only GET method allowed'
    }), { status: 405 })
    return setCorsHeaders(response, origin)
  }

  try {
    // Check database connection
    const dbHealth = await checkDatabaseConnection()
    
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: dbHealth.healthy ? 'OK' : 'ERROR',
        ai: process.env.OPENAI_API_KEY ? 'OK' : 'NOT_CONFIGURED'
      },
      ...(dbHealth.error && { databaseError: dbHealth.error })
    }

    const response = ok(healthData)
    return setCorsHeaders(response, origin)
  } catch (error) {
    console.error('Health check error:', error)
    const response = new Response(JSON.stringify({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
    return setCorsHeaders(response, origin)
  }
}
