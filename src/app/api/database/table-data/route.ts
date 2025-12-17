import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit-log';
import { checkAuthAndPermission } from '@/lib/auth-middleware';

// Helper function to serialize complex data types
function serializeTableData(data: any): any {
  if (data === null || data === undefined) return data;
  
  // Handle BigInt
  if (typeof data === 'bigint') {
    return data.toString();
  }
  
  // Handle Date
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  // Handle Buffer (for binary data)
  if (Buffer.isBuffer(data)) {
    return `[Binary: ${data.length} bytes]`;
  }
  
  // Handle objects recursively
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(serializeTableData);
    }
    const serialized: any = {};
    for (const key in data) {
      serialized[key] = serializeTableData(data[key]);
    }
    return serialized;
  }
  
  return data;
}

export async function GET(request: NextRequest) {
  // التحقق من الصلاحيات - فقط المدير يمكنه عرض بيانات الجداول
  const authCheck = await checkAuthAndPermission(request, 'canManageDatabase');
  if (authCheck.error) {
    return authCheck.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    console.log('Fetching table data:', { tableName, limit });
    
    if (!tableName) {
      return NextResponse.json({ error: 'اسم الجدول مطلوب' }, { status: 400 });
    }

    // Validate table name to prevent SQL injection
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      console.error('Invalid table name:', tableName);
      return NextResponse.json({ error: 'اسم جدول غير صالح' }, { status: 400 });
    }

    const prisma = getPrisma();
    
    try {
      // Get column names
      const columnsResult = await prisma.$queryRaw<any[]>`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = ${tableName}
        ORDER BY ORDINAL_POSITION
      `;
      
      console.log(`Found ${columnsResult.length} columns for ${tableName}`);
      const columns = columnsResult.map((c: any) => c.COLUMN_NAME);
      
      // Get table data with limit
      let rawData = await prisma.$queryRawUnsafe(
        `SELECT TOP ${limit} * FROM [dbo].[${tableName}]`
      );
      
      console.log(`Fetched ${Array.isArray(rawData) ? rawData.length : 0} rows from ${tableName}`);
      
      // Serialize data to handle complex types
      const data = serializeTableData(rawData);
      
      // Log view operation (don't await to avoid blocking response)
      createAuditLog({
        action: 'VIEW',
        tableName,
        details: `عرض ${Array.isArray(data) ? data.length : 0} صف`,
        success: true,
      }, request).catch(err => console.error('Failed to log audit:', err));
      
      return NextResponse.json({
        columns,
        data,
        total: Array.isArray(data) ? data.length : 0,
      });
    } catch (queryError) {
      console.error('Query error for table:', tableName, queryError);
      throw queryError;
    }
  } catch (error) {
    console.error('Error fetching table data:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Try to log failed operation
    try {
      const { searchParams } = new URL(request.url);
      const tableName = searchParams.get('table');
      
      await createAuditLog({
        action: 'VIEW',
        tableName: tableName || undefined,
        details: 'فشل عرض البيانات',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }, request);
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }
    
    return NextResponse.json(
      { 
        error: 'فشل جلب بيانات الجدول', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

