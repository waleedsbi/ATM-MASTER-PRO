import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit-log';
import { checkAuthAndPermission } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  // التحقق من الصلاحيات - فقط المدير يمكنه تنفيذ استعلامات قاعدة البيانات
  const authCheck = await checkAuthAndPermission(request, 'canManageDatabase');
  if (authCheck.error) {
    return authCheck.error;
  }

  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'استعلام غير صالح' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    
    // Basic safety checks
    const queryLower = query.toLowerCase().trim();
    
    // Prevent multiple statements
    if (query.includes(';') && query.indexOf(';') < query.length - 1) {
      return NextResponse.json(
        { success: false, error: 'لا يسمح بتنفيذ استعلامات متعددة' },
        { status: 400 }
      );
    }

    // Prevent dangerous operations without confirmation
    const dangerousKeywords = ['drop database', 'drop schema', 'truncate database'];
    if (dangerousKeywords.some(keyword => queryLower.includes(keyword))) {
      return NextResponse.json(
        { success: false, error: 'عملية خطيرة غير مسموح بها' },
        { status: 403 }
      );
    }

    try {
      const result = await prisma.$queryRawUnsafe(query);
      
      // Log successful query
      await createAuditLog({
        action: 'QUERY',
        details: query.substring(0, 200), // First 200 chars
        success: true,
      }, request);
      
      // Check if it's a SELECT query (returns data)
      if (queryLower.startsWith('select')) {
        return NextResponse.json({
          success: true,
          data: result as any[],
          rowCount: Array.isArray(result) ? result.length : 0,
        });
      } else {
        // For INSERT, UPDATE, DELETE
        return NextResponse.json({
          success: true,
          affectedRows: typeof result === 'number' ? result : 0,
          message: 'تم تنفيذ الاستعلام بنجاح',
        });
      }
    } catch (queryError) {
      console.error('Query execution error:', queryError);
      
      // Log failed query
      await createAuditLog({
        action: 'QUERY',
        details: query.substring(0, 200),
        success: false,
        errorMessage: queryError instanceof Error ? queryError.message : 'خطأ في تنفيذ الاستعلام',
      }, request);
      
      return NextResponse.json({
        success: false,
        error: queryError instanceof Error ? queryError.message : 'خطأ في تنفيذ الاستعلام',
      });
    }
  } catch (error) {
    console.error('Error in query endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

