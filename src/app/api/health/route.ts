import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Try a simple query
    const representativeCount = await prisma.representative.count()
    const atmCount = await prisma.aTM.count()
    const workPlanCount = await prisma.workPlan.count()
    const commentCount = await prisma.clientComment.count()
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      data: {
        representatives: representativeCount,
        atms: atmCount,
        workPlans: workPlanCount,
        comments: commentCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isDatabaseError = errorMessage.includes('database') || 
                           errorMessage.includes('connection') ||
                           errorMessage.includes('ECONNREFUSED')
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: errorMessage,
      isDatabaseError,
      hint: isDatabaseError 
        ? 'يرجى التحقق من ملف .env والتأكد من أن SQL Server يعمل'
        : 'حدث خطأ غير متوقع',
      timestamp: new Date().toISOString(),
    }, { status: 503 })
  }
}

