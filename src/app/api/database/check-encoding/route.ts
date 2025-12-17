import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { checkAuthAndPermission } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  // التحقق من الصلاحيات - فقط المدير يمكنه فحص encoding
  const authCheck = await checkAuthAndPermission(request, 'canManageDatabase');
  if (authCheck.error) {
    return authCheck.error;
  }

  try {
    const prisma = getPrisma();
    
    // Check database collation
    const dbCollation = await prisma.$queryRaw<any[]>`
      SELECT 
        name AS DatabaseName,
        collation_name AS Collation
      FROM sys.databases
      WHERE name = DB_NAME()
    `;
    
    // Check column data types for all important tables
    const columnInfo = await prisma.$queryRaw<any[]>`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        COLLATION_NAME,
        CASE 
          WHEN DATA_TYPE = 'varchar' THEN '❌ يحتاج إصلاح'
          WHEN DATA_TYPE = 'nvarchar' AND COLLATION_NAME NOT LIKE '%Arabic%' THEN '⚠️ يحتاج تحديث COLLATION'
          WHEN DATA_TYPE = 'nvarchar' AND COLLATION_NAME LIKE '%Arabic%' THEN '✅ صحيح'
          ELSE '⚠️ غير نصي'
        END AS Status
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME IN ('BankATM', 'BankCode', 'GovernorateCode', 'CityCode')
        AND COLUMN_NAME IN (
          'ATMAddress', 'ATMModel', 'ATMSerial',
          'BanknameL1', 'BanknameL2',
          'GovernorateNameL1', 'GovernorateNameL2',
          'CityNameL1', 'CityNameL2'
        )
      ORDER BY TABLE_NAME, COLUMN_NAME
    `;
    
    // Get sample data to check encoding
    const sampleData = await prisma.$queryRaw<any[]>`
      SELECT TOP 5
        b.ATMId,
        b.ATMCode,
        b.ATMAddress,
        b.ATMModel,
        bank.BanknameL1,
        gov.GovernorateNameL1,
        city.CityNameL1,
        CASE 
          WHEN b.ATMAddress LIKE '%?%' THEN '❌ تالف'
          WHEN b.ATMAddress IS NOT NULL AND LEN(b.ATMAddress) > 0 THEN '✅ سليم'
          ELSE '⚠️ فارغ'
        END AS AddressStatus
      FROM [dbo].[BankATM] b
      LEFT JOIN [dbo].[BankCode] bank ON b.BankCodeId = bank.BankId
      LEFT JOIN [dbo].[GovernorateCode] gov ON b.GovernorateCodeId = gov.GovernorateId
      LEFT JOIN [dbo].[CityCode] city ON b.CityCodeId = city.CityId
      WHERE b.ATMAddress IS NOT NULL
      ORDER BY b.ATMId
    `;
    
    // Count problematic records
    const problematicCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as Count
      FROM [dbo].[BankATM]
      WHERE ATMAddress LIKE '%?%'
    `;
    
    const needsFix = columnInfo.filter((col: any) => 
      col.DATA_TYPE === 'varchar' || 
      (col.DATA_TYPE === 'nvarchar' && col.COLLATION_NAME && !col.COLLATION_NAME.includes('Arabic'))
    );
    
    return NextResponse.json({
      databaseCollation: dbCollation[0],
      columnInfo,
      sampleData,
      problematicRecords: problematicCount[0]?.Count || 0,
      needsFix: needsFix.length > 0,
      analysis: {
        message: needsFix.length > 0 
          ? `تم العثور على ${needsFix.length} حقول تحتاج إصلاح`
          : 'جميع الحقول مضبوطة بشكل صحيح',
        solution: needsFix.length > 0
          ? 'قم بتنفيذ سكربت fix-arabic-encoding-after-restore.sql لإصلاح المشكلة'
          : 'لا توجد مشاكل في الترميز',
        fixScript: 'prisma/fix-arabic-encoding-after-restore.sql',
        documentation: 'FIX_ARABIC_AFTER_BACKUP_RESTORE.md'
      }
    });
  } catch (error) {
    console.error('Error checking encoding:', error);
    return NextResponse.json(
      { error: 'فشل فحص encoding', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

