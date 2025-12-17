import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/audit-log';
import { checkAuthAndPermission } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  // التحقق من الصلاحيات - فقط المدير يمكنه عرض سجلات التدقيق
  const authCheck = await checkAuthAndPermission(request, 'canManageDatabase');
  if (authCheck.error) {
    return authCheck.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      userId: searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined,
      action: searchParams.get('action') as any,
      tableName: searchParams.get('tableName') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
    };

    const logs = await getAuditLogs(filters);

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'فشل جلب سجل العمليات', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

