import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { checkAuthAndPermission } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  // التحقق من الصلاحيات - فقط المدير يمكنه إصلاح encoding
  const authCheck = await checkAuthAndPermission(request, 'canManageDatabase');
  if (authCheck.error) {
    return authCheck.error;
  }

  try {
    const prisma = getPrisma();
    
    // Test query to check encoding
    const sample = await prisma.$queryRaw<any[]>`
      SELECT TOP 5 
        ATMId,
        ATMCode,
        CAST(ATMAddress AS NVARCHAR(MAX)) COLLATE Arabic_CI_AS as ATMAddress,
        ATMModel,
        ATMSerial
      FROM [dbo].[BankATM]
      WHERE ATMAddress IS NOT NULL
    `;
    
    return NextResponse.json({
      message: 'Sample data with Arabic encoding',
      data: sample,
    });
  } catch (error) {
    console.error('Error testing encoding:', error);
    return NextResponse.json(
      { error: 'فشل اختبار encoding', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

