import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit-log';
import { checkAuthAndPermission } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  // التحقق من الصلاحيات - فقط المدير يمكنه تصدير البيانات
  const authCheck = await checkAuthAndPermission(request, 'canManageDatabase');
  if (authCheck.error) {
    return authCheck.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');
    
    if (!tableName) {
      return NextResponse.json({ error: 'اسم الجدول مطلوب' }, { status: 400 });
    }

    // Validate table name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return NextResponse.json({ error: 'اسم جدول غير صالح' }, { status: 400 });
    }

    const prisma = getPrisma();
    
    // Get all data from table
    const data = await prisma.$queryRawUnsafe(
      `SELECT * FROM [dbo].[${tableName}]`
    );
    
    // Convert to JSON
    const jsonData = JSON.stringify(data, null, 2);
    
    // Log export operation
    await createAuditLog({
      action: 'EXPORT',
      tableName,
      details: `تصدير ${Array.isArray(data) ? data.length : 0} صف`,
      success: true,
    }, request);
    
    // Return as downloadable file
    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${tableName}_${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting table:', error);
    return NextResponse.json(
      { error: 'فشل تصدير البيانات', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

