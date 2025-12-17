import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { checkAuthAndPermission } from '@/lib/auth-middleware';

/**
 * API endpoint لإصلاح مشكلة الترميز العربي بعد استعادة النسخة الاحتياطية
 * 
 * يقوم هذا الـ endpoint بـ:
 * 1. فحص COLLATION الحالي
 * 2. تحويل الحقول من VARCHAR إلى NVARCHAR مع COLLATE Arabic_CI_AS
 * 3. إصلاح جميع الجداول الرئيسية
 */
export async function POST(request: NextRequest) {
  // التحقق من الصلاحيات - فقط المدير يمكنه إصلاح encoding
  const authCheck = await checkAuthAndPermission(request, 'canManageDatabase');
  if (authCheck.error) {
    return authCheck.error;
  }

  try {
    const prisma = getPrisma();
    const results: any[] = [];
    const errors: any[] = [];

    // =============================================
    // الخطوة 1: فحص COLLATION الحالي
    // =============================================
    try {
      const dbCollation = await prisma.$queryRaw<any[]>`
        SELECT 
          name AS DatabaseName,
          collation_name AS Collation
        FROM sys.databases
        WHERE name = DB_NAME()
      `;
      results.push({
        step: '1',
        action: 'فحص COLLATION',
        success: true,
        data: dbCollation[0],
      });
    } catch (error) {
      errors.push({
        step: '1',
        action: 'فحص COLLATION',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // =============================================
    // الخطوة 2: إصلاح جدول BankATM
    // =============================================
    const bankATMColumns = [
      { name: 'ATMAddress', type: 'NVARCHAR(MAX)' },
      { name: 'ATMModel', type: 'NVARCHAR(255)' },
      { name: 'ATMSerial', type: 'NVARCHAR(255)' },
    ];

    for (const column of bankATMColumns) {
      try {
        // التحقق من نوع العمود الحالي
        const columnInfo = await prisma.$queryRaw<any[]>`
          SELECT 
            DATA_TYPE,
            COLLATION_NAME
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = 'BankATM'
            AND COLUMN_NAME = ${column.name}
        `;

        if (columnInfo.length > 0) {
          const currentType = columnInfo[0].DATA_TYPE;
          const currentCollation = columnInfo[0].COLLATION_NAME || '';

          if (currentType === 'varchar' || (currentType === 'nvarchar' && !currentCollation.includes('Arabic'))) {
            // تحويل العمود
            await prisma.$executeRawUnsafe(`
              ALTER TABLE [dbo].[BankATM] 
              ALTER COLUMN [${column.name}] ${column.type} COLLATE Arabic_CI_AS
            `);

            results.push({
              step: '2',
              action: `إصلاح BankATM.${column.name}`,
              success: true,
              message: `تم تحويل ${column.name} من ${currentType} إلى ${column.type}`,
            });
          } else {
            results.push({
              step: '2',
              action: `فحص BankATM.${column.name}`,
              success: true,
              message: `${column.name} بالفعل ${currentType} مع COLLATE صحيح`,
            });
          }
        }
      } catch (error) {
        errors.push({
          step: '2',
          action: `إصلاح BankATM.${column.name}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // =============================================
    // الخطوة 3: إصلاح جدول BankCode
    // =============================================
    const bankCodeColumns = [
      { name: 'BanknameL1', type: 'NVARCHAR(255)' },
      { name: 'BanknameL2', type: 'NVARCHAR(255)' },
    ];

    for (const column of bankCodeColumns) {
      try {
        const columnInfo = await prisma.$queryRaw<any[]>`
          SELECT 
            DATA_TYPE,
            COLLATION_NAME
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = 'BankCode'
            AND COLUMN_NAME = ${column.name}
        `;

        if (columnInfo.length > 0) {
          const currentType = columnInfo[0].DATA_TYPE;
          const currentCollation = columnInfo[0].COLLATION_NAME || '';

          if (currentType === 'varchar' || (currentType === 'nvarchar' && !currentCollation.includes('Arabic'))) {
            await prisma.$executeRawUnsafe(`
              ALTER TABLE [dbo].[BankCode] 
              ALTER COLUMN [${column.name}] ${column.type} COLLATE Arabic_CI_AS
            `);

            results.push({
              step: '3',
              action: `إصلاح BankCode.${column.name}`,
              success: true,
              message: `تم تحويل ${column.name} إلى ${column.type}`,
            });
          }
        }
      } catch (error) {
        errors.push({
          step: '3',
          action: `إصلاح BankCode.${column.name}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // =============================================
    // الخطوة 4: إصلاح جدول GovernorateCode
    // =============================================
    const governorateColumns = [
      { name: 'GovernorateNameL1', type: 'NVARCHAR(255)' },
      { name: 'GovernorateNameL2', type: 'NVARCHAR(255)' },
    ];

    for (const column of governorateColumns) {
      try {
        const columnInfo = await prisma.$queryRaw<any[]>`
          SELECT 
            DATA_TYPE,
            COLLATION_NAME
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = 'GovernorateCode'
            AND COLUMN_NAME = ${column.name}
        `;

        if (columnInfo.length > 0) {
          const currentType = columnInfo[0].DATA_TYPE;
          const currentCollation = columnInfo[0].COLLATION_NAME || '';

          if (currentType === 'varchar' || (currentType === 'nvarchar' && !currentCollation.includes('Arabic'))) {
            await prisma.$executeRawUnsafe(`
              ALTER TABLE [dbo].[GovernorateCode] 
              ALTER COLUMN [${column.name}] ${column.type} COLLATE Arabic_CI_AS
            `);

            results.push({
              step: '4',
              action: `إصلاح GovernorateCode.${column.name}`,
              success: true,
              message: `تم تحويل ${column.name} إلى ${column.type}`,
            });
          }
        }
      } catch (error) {
        errors.push({
          step: '4',
          action: `إصلاح GovernorateCode.${column.name}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // =============================================
    // الخطوة 5: إصلاح جدول CityCode
    // =============================================
    const cityColumns = [
      { name: 'CityNameL1', type: 'NVARCHAR(255)' },
      { name: 'CityNameL2', type: 'NVARCHAR(255)' },
    ];

    for (const column of cityColumns) {
      try {
        const columnInfo = await prisma.$queryRaw<any[]>`
          SELECT 
            DATA_TYPE,
            COLLATION_NAME
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = 'CityCode'
            AND COLUMN_NAME = ${column.name}
        `;

        if (columnInfo.length > 0) {
          const currentType = columnInfo[0].DATA_TYPE;
          const currentCollation = columnInfo[0].COLLATION_NAME || '';

          if (currentType === 'varchar' || (currentType === 'nvarchar' && !currentCollation.includes('Arabic'))) {
            await prisma.$executeRawUnsafe(`
              ALTER TABLE [dbo].[CityCode] 
              ALTER COLUMN [${column.name}] ${column.type} COLLATE Arabic_CI_AS
            `);

            results.push({
              step: '5',
              action: `إصلاح CityCode.${column.name}`,
              success: true,
              message: `تم تحويل ${column.name} إلى ${column.type}`,
            });
          }
        }
      } catch (error) {
        errors.push({
          step: '5',
          action: `إصلاح CityCode.${column.name}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // =============================================
    // الخطوة 6: فحص النتائج النهائية
    // =============================================
    let finalCheck: any = null;
    try {
      const finalColumnInfo = await prisma.$queryRaw<any[]>`
        SELECT 
          TABLE_NAME,
          COLUMN_NAME,
          DATA_TYPE,
          COLLATION_NAME
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

      finalCheck = {
        step: '6',
        action: 'الفحص النهائي',
        success: true,
        columns: finalColumnInfo,
      };
    } catch (error) {
      errors.push({
        step: '6',
        action: 'الفحص النهائي',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length === 0 
        ? 'تم إصلاح الترميز بنجاح!' 
        : `تم إصلاح الترميز مع ${errors.length} أخطاء`,
      results,
      finalCheck,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        totalSteps: results.length,
        successfulSteps: results.filter(r => r.success).length,
        failedSteps: errors.length,
      },
    });
  } catch (error) {
    console.error('Error fixing encoding:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل إصلاح الترميز',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

