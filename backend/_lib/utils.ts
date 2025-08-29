// Response helpers for consistent API responses
export function ok(data: unknown, status: number = 200, meta?: any) {
  return new Response(JSON.stringify({
    data,
    timestamp: new Date().toISOString(),
    ...(meta && { meta })
  }), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}

export function created(data: unknown) {
  return ok(data, 201)
}

export function badRequest(code: string, message: string, details?: unknown) {
  return errorResponse(400, code, message, details)
}

export function unauthorized(message: string = 'Unauthorized') {
  return errorResponse(401, 'UNAUTHORIZED', message)
}

export function forbidden(message: string = 'Forbidden') {
  return errorResponse(403, 'FORBIDDEN', message)
}

export function notFound(message: string = 'Not found') {
  return errorResponse(404, 'NOT_FOUND', message)
}

export function methodNotAllowed(allowedMethods?: string[]) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (allowedMethods) {
    headers['Allow'] = allowedMethods.join(', ')
  }
  
  return new Response(JSON.stringify({
    code: 'METHOD_NOT_ALLOWED',
    message: 'Method not allowed',
    timestamp: new Date().toISOString()
  }), {
    status: 405,
    headers
  })
}

export function tooManyRequests(retryAfter?: number) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (retryAfter) {
    headers['Retry-After'] = String(retryAfter)
  }
  
  return new Response(JSON.stringify({
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests',
    timestamp: new Date().toISOString(),
    ...(retryAfter && { retryAfter })
  }), {
    status: 429,
    headers
  })
}

export function internalServerError(message: string = 'Internal server error', details?: unknown) {
  return errorResponse(500, 'INTERNAL_SERVER_ERROR', message, details)
}

export function errorResponse(status: number, code: string, message: string, details?: unknown) {
  return new Response(JSON.stringify({
    code,
    message,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  }), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}

// CORS helper
export function setCorsHeaders(response: Response, origin?: string) {
  const allowedOrigin = origin && isAllowedOrigin(origin) ? origin : process.env.ORIGIN || '*'
  
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  return response
}

export function corsPreflightResponse(origin?: string) {
  const response = new Response(null, { status: 204 })
  return setCorsHeaders(response, origin)
}

function isAllowedOrigin(origin: string): boolean {
  const allowedOrigins = [
    'https://survey.aibao.me',
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.ORIGIN
  ].filter(Boolean)
  
  return allowedOrigins.includes(origin)
}

// Request parsing helpers
export async function parseJsonBody<T>(req: Request): Promise<T> {
  try {
    return await req.json()
  } catch (error) {
    throw new Error('Invalid JSON in request body')
  }
}

export function parseQuery(url: URL, schema: any) {
  const params: Record<string, any> = {}
  
  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value
  }
  
  const parsed = schema.safeParse(params)
  if (!parsed.success) {
    throw new Error(`Invalid query parameters: ${parsed.error.message}`)
  }
  
  return parsed.data
}

// IP extraction helper
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

// Validation helpers
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export function sanitizeString(str: string, maxLength: number = 1000): string {
  return str.trim().substring(0, maxLength)
}

// Pagination helpers
export function calculatePagination(page: number, pageSize: number, total: number) {
  const totalPages = Math.ceil(total / pageSize)
  const hasMore = page < totalPages
  const hasPrevious = page > 1
  
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasMore,
    hasPrevious,
    offset: (page - 1) * pageSize
  }
}

// Date helpers
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

export function formatDate(date: Date): string {
  return date.toISOString()
}

// Slug generation
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Random ID generation
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2)
  const id = `${timestamp}${random}`
  
  return prefix ? `${prefix}_${id}` : id
}

// Environment helpers
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

// Logging helper
export function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const logData = { timestamp, level, message, ...(data && { data }) }
  
  if (level === 'error') {
    console.error(JSON.stringify(logData))
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logData))
  } else {
    console.log(JSON.stringify(logData))
  }
}
