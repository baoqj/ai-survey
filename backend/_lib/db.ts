import { PrismaClient } from '@prisma/client'

const prismaGlobal = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  prismaGlobal.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') {
  prismaGlobal.prisma = prisma
}

// Helper function to handle database errors
export function handleDatabaseError(error: any) {
  console.error('Database error:', error)
  
  if (error.code === 'P2002') {
    return {
      code: 'UNIQUE_CONSTRAINT_VIOLATION',
      message: 'A record with this value already exists',
      details: error.meta
    }
  }
  
  if (error.code === 'P2025') {
    return {
      code: 'RECORD_NOT_FOUND',
      message: 'The requested record was not found',
      details: error.meta
    }
  }
  
  return {
    code: 'DATABASE_ERROR',
    message: 'An unexpected database error occurred',
    details: process.env.NODE_ENV === 'development' ? error : undefined
  }
}

// Connection health check
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { healthy: true }
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
