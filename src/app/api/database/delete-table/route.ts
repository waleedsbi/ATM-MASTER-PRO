import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit-log';
import { checkAuthAndPermission } from '@/lib/auth-middleware';

export async function DELETE(request: NextRequest) {
  // التحقق من الصلاحيات - فقط المدير يمكنه حذف الجداول
  const authCheck = await checkAuthAndPermission(request, 'canManageDatabase');
  if (authCheck.error) {
    return authCheck.error;
  }

  try {
    const { table } = await request.json();
    
    if (!table) {
      return NextResponse.json({ error: 'اسم الجدول مطلوب' }, { status: 400 });
    }

    // Validate table name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      return NextResponse.json({ error: 'اسم جدول غير صالح' }, { status: 400 });
    }

    // List of protected tables that should not be deleted
    const protectedTables = [
      'User',
      'AspNetUsers',
      'AspNetRoles',
      '__EFMigrationsHistory',
    ];

    if (protectedTables.includes(table)) {
      return NextResponse.json(
        { error: 'هذا الجدول محمي ولا يمكن حذفه' },
        { status: 403 }
      );
    }

    const prisma = getPrisma();
    
    // Drop the table
    await prisma.$executeRawUnsafe(`DROP TABLE [dbo].[${table}]`);
    
    // Log delete operation
    await createAuditLog({
      action: 'DELETE',
      tableName: table,
      details: `حذف الجدول ${table}`,
      success: true,
    }, request);
    
    return NextResponse.json({ 
      success: true, 
      message: `تم حذف الجدول ${table} بنجاح` 
    });
  } catch (error) {
    console.error('Error deleting table:', error);
    return NextResponse.json(
      { error: 'فشل حذف الجدول', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

