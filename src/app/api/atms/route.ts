import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'
import { checkAuthAndPermission } from '@/lib/auth-middleware'
import { createAuditLog } from '@/lib/audit-log'

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma()
    const body = await request.json()
    
    const {
      bankName,
      startDate,
      governorate,
      city,
      atmModel,
      atmSerial,
      atmCode,
      atmAddress,
      id, // For updates
    } = body

    // Validate required fields
    if (!atmCode || !bankName || !governorate || !city) {
      return NextResponse.json(
        { error: 'الحقول المطلوبة: كود الماكينة، اسم البنك، المحافظة، المدينة' },
        { status: 400 }
      )
    }

    // Try using aTM model first (simpler)
    if (prisma.aTM) {
      const atmData = {
        atmCode: String(atmCode).trim(),
        atmSerial: atmSerial ? String(atmSerial).trim() : 'N/A',
        atmModel: atmModel ? String(atmModel).trim() : 'غير محدد',
        bankName: String(bankName).trim(),
        governorate: String(governorate).trim(),
        city: String(city).trim(),
        address: atmAddress ? String(atmAddress).trim() : 'غير محدد',
        startDate: startDate ? new Date(startDate) : new Date(),
        status: 'active',
        lastMaintenance: null,
      }

      if (id && id !== '') {
        // Update existing
        const existing = await prisma.aTM.findUnique({
          where: { atmCode: atmData.atmCode }
        })
        
        if (existing) {
          await prisma.aTM.update({
            where: { atmCode: atmData.atmCode },
            data: atmData
          })
          return NextResponse.json({ success: true, message: 'تم تحديث بيانات الماكينة بنجاح' })
        }
      }

      // Create new or upsert
      await prisma.aTM.upsert({
        where: { atmCode: atmData.atmCode },
        update: atmData,
        create: atmData,
      })

      return NextResponse.json({ success: true, message: 'تم حفظ بيانات الماكينة بنجاح' })
    }

    // Fallback to BankATM model (more complex, requires ID lookups)
    if (!prisma.bankATM) {
      return NextResponse.json(
        { error: 'نموذج الماكينة غير متاح في قاعدة البيانات' },
        { status: 500 }
      )
    }

    // Find BankCodeId from bank name
    const bank = await prisma.bankCode.findFirst({
      where: {
        OR: [
          { BanknameL1: { contains: bankName } },
          { BanknameL2: { contains: bankName } },
        ],
        IsDeleted: false,
      },
      select: { BankId: true },
    })

    // Find GovernorateCodeId from governorate name
    const governorateRecord = await prisma.governorateCode.findFirst({
      where: {
        OR: [
          { GovernorateNameL1: { contains: governorate } },
          { GovernorateNameL2: { contains: governorate } },
        ],
      },
      select: { GovernorateId: true },
    })

    // Find CityCodeId from city name (requires governorate)
    let cityRecord = null
    if (governorateRecord) {
      cityRecord = await prisma.cityCode.findFirst({
        where: {
          GovernorateCodeId: governorateRecord.GovernorateId,
          OR: [
            { CityNameL1: { contains: city } },
            { CityNameL2: { contains: city } },
          ],
          IsDeleted: false,
        },
        select: { CityId: true },
      })
    }

    // Check if ATM already exists
    const existingATM = await prisma.bankATM.findFirst({
      where: {
        ATMCode: String(atmCode).trim(),
        IsDeleted: false,
      },
    })

    const bankAtmData: any = {
      ATMCode: String(atmCode).trim(),
      ATMSerial: atmSerial ? String(atmSerial).trim() : 'N/A',
      ATMModel: atmModel ? String(atmModel).trim() : 'غير محدد',
      ATMAddress: atmAddress ? String(atmAddress).trim() : 'غير محدد',
      StartDate: startDate ? new Date(startDate) : new Date(),
      IsDeleted: false,
      IsNotActive: false,
    }

    if (bank) {
      bankAtmData.BankCodeId = bank.BankId
    }
    if (governorateRecord) {
      bankAtmData.GovernorateCodeId = governorateRecord.GovernorateId
    }
    if (cityRecord) {
      bankAtmData.CityCodeId = cityRecord.CityId
    }

    if (existingATM) {
      // Update existing
      await prisma.bankATM.update({
        where: { ATMId: existingATM.ATMId },
        data: bankAtmData,
      })
      return NextResponse.json({ success: true, message: 'تم تحديث بيانات الماكينة بنجاح' })
    } else {
      // Create new
      await prisma.bankATM.create({
        data: bankAtmData,
      })
      return NextResponse.json({ success: true, message: 'تم حفظ بيانات الماكينة بنجاح' })
    }
  } catch (error) {
    console.error('Error saving ATM:', error)
    return NextResponse.json(
      {
        error: 'حدث خطأ أثناء حفظ بيانات الماكينة',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  console.log('=== GET /api/atms called ===');
  
  try {
    const prisma = getPrisma();
    
    console.log('Prisma models available:', {
      hasATM: !!prisma.aTM,
      hasBankATM: !!prisma.bankATM,
    });
    
    // Check BankATM first, but if it's empty, use ATM table
    if (prisma.bankATM) {
      console.log('Using BankATM model for GET /api/atms');
      
      try {
        // Get count first (without filters to see total)
        const totalCount = await prisma.bankATM.count();
        console.log(`Total BankATM count (all records): ${totalCount}`);
        
        // If BankATM is empty, try ATM table instead
        if (totalCount === 0) {
          console.log('BankATM table is empty, trying ATM table...');
          if (prisma.aTM) {
            const atmCount = await prisma.aTM.count();
            console.log(`ATM table has ${atmCount} records`);
            
            if (atmCount > 0) {
              const atms = await prisma.aTM.findMany({
                orderBy: {
                  atmCode: 'asc',
                },
              });
              
              console.log(`Found ${atms.length} ATMs from ATM table`);
              
              // Transform data to match ATMData interface
              const transformedAtms = atms.map(atm => ({
                id: atm.id.toString(),
                bankName: atm.bankName || 'غير محدد',
                startDate: atm.startDate ? new Date(atm.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                governorate: atm.governorate || 'غير محدد',
                city: atm.city || 'غير محدد',
                atmModel: atm.atmModel || 'غير محدد',
                atmSerial: atm.atmSerial || 'N/A',
                atmCode: atm.atmCode || '',
                atmAddress: atm.address || 'غير محدد',
              }));
              
              console.log(`Returning ${transformedAtms.length} transformed ATMs from ATM table`);
              return NextResponse.json(transformedAtms);
            }
          }
        }
        
        // Get count with filters
        const activeCount = await prisma.bankATM.count({
          where: {
            AND: [
              {
                OR: [
                  { IsDeleted: null },
                  { IsDeleted: false },
                ],
              },
              {
                OR: [
                  { IsNotActive: null },
                  { IsNotActive: false },
                ],
              },
            ],
          },
        });
        console.log(`Active BankATM count: ${activeCount}`);
        
        // Use raw query with proper encoding handling for Arabic text
        // Filter out deleted and inactive ATMs
        // Note: SQL Server uses 0/1 for boolean, but Prisma might use true/false
        const bankAtms = await prisma.$queryRaw<any[]>`
          SELECT 
            b.ATMId,
            b.ATMCode,
            b.ATMSerial,
            b.ATMModel,
            CAST(b.ATMAddress AS NVARCHAR(MAX)) COLLATE Arabic_CI_AS as ATMAddress,
            b.StartDate,
            bank.BanknameL1,
            bank.BanknameL2,
            gov.GovernorateNameL1,
            city.CityNameL1
          FROM [dbo].[BankATM] b
          LEFT JOIN [dbo].[BankCode] bank ON b.BankCodeId = bank.BankId
          LEFT JOIN [dbo].[GovernorateCode] gov ON b.GovernorateCodeId = gov.GovernorateId
          LEFT JOIN [dbo].[CityCode] city ON b.CityCodeId = city.CityId
          WHERE (b.IsDeleted IS NULL OR b.IsDeleted = 0 OR b.IsDeleted = CAST(0 AS BIT))
            AND (b.IsNotActive IS NULL OR b.IsNotActive = 0 OR b.IsNotActive = CAST(0 AS BIT))
          ORDER BY b.ATMCode ASC
        `;
        
        console.log(`Fetched ${bankAtms.length} ATMs from BankATM table`);
        
        if (bankAtms.length > 0) {
          console.log('First ATM sample:', {
            ATMId: bankAtms[0].ATMId,
            ATMCode: bankAtms[0].ATMCode,
            ATMAddress: bankAtms[0].ATMAddress,
            BankName: bankAtms[0].BanknameL1,
          });
        } else {
          console.warn('No ATMs found in BankATM. This could mean:');
          console.warn('1. No data in BankATM table');
          console.warn('2. All records are marked as deleted or inactive');
          console.warn('3. There is a connection issue');
        }
        
        const transformedAtms = bankAtms.map((atm: any) => ({
          id: atm.ATMId?.toString() || '',
          bankName: atm.BanknameL1 || atm.BanknameL2 || 'غير محدد',
          startDate: atm.StartDate ? new Date(atm.StartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          governorate: atm.GovernorateNameL1 || 'غير محدد',
          city: atm.CityNameL1 || 'غير محدد',
          atmModel: atm.ATMModel || 'غير محدد',
          atmSerial: atm.ATMSerial || 'N/A',
          atmCode: atm.ATMCode || '',
          atmAddress: atm.ATMAddress || 'غير محدد',
        }));
        
        console.log(`Returning ${transformedAtms.length} transformed ATMs`);
        return NextResponse.json(transformedAtms);
      } catch (bankATMError) {
        console.error('Error fetching from BankATM:', bankATMError);
        console.error('Error details:', bankATMError instanceof Error ? bankATMError.message : String(bankATMError));
        // Try without filters as fallback
        try {
          console.log('Attempting fallback query without filters...');
          const bankAtmsFallback = await prisma.$queryRaw<any[]>`
            SELECT TOP 100
              b.ATMId,
              b.ATMCode,
              b.ATMSerial,
              b.ATMModel,
              CAST(b.ATMAddress AS NVARCHAR(MAX)) COLLATE Arabic_CI_AS as ATMAddress,
              b.StartDate,
              bank.BanknameL1,
              bank.BanknameL2,
              gov.GovernorateNameL1,
              city.CityNameL1
            FROM [dbo].[BankATM] b
            LEFT JOIN [dbo].[BankCode] bank ON b.BankCodeId = bank.BankId
            LEFT JOIN [dbo].[GovernorateCode] gov ON b.GovernorateCodeId = gov.GovernorateId
            LEFT JOIN [dbo].[CityCode] city ON b.CityCodeId = city.CityId
            ORDER BY b.ATMCode ASC
          `;
          console.log(`Fallback query returned ${bankAtmsFallback.length} ATMs`);
          const transformedAtms = bankAtmsFallback.map((atm: any) => ({
            id: atm.ATMId?.toString() || '',
            bankName: atm.BanknameL1 || atm.BanknameL2 || 'غير محدد',
            startDate: atm.StartDate ? new Date(atm.StartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            governorate: atm.GovernorateNameL1 || 'غير محدد',
            city: atm.CityNameL1 || 'غير محدد',
            atmModel: atm.ATMModel || 'غير محدد',
            atmSerial: atm.ATMSerial || 'N/A',
            atmCode: atm.ATMCode || '',
            atmAddress: atm.ATMAddress || 'غير محدد',
          }));
          return NextResponse.json(transformedAtms);
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          // Try ATM table as last resort
          if (prisma.aTM) {
            console.log('Trying ATM table as last resort...');
            const atms = await prisma.aTM.findMany({
              orderBy: {
                atmCode: 'asc',
              },
            });
            const transformedAtms = atms.map(atm => ({
              id: atm.id.toString(),
              bankName: atm.bankName || 'غير محدد',
              startDate: atm.startDate ? new Date(atm.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              governorate: atm.governorate || 'غير محدد',
              city: atm.city || 'غير محدد',
              atmModel: atm.atmModel || 'غير محدد',
              atmSerial: atm.atmSerial || 'N/A',
              atmCode: atm.atmCode || '',
              atmAddress: atm.address || 'غير محدد',
            }));
            return NextResponse.json(transformedAtms);
          }
          throw bankATMError; // Throw original error
        }
      }
    }
    
    // Try using aTM model if it exists
    if (prisma.aTM) {
      console.log('Using ATM model for GET /api/atms');
    
      const atms = await prisma.aTM.findMany({
        orderBy: {
          atmCode: 'asc',
        },
      });
      
      console.log(`Found ${atms.length} ATMs from ATM table`);
      
      // Transform data to match ATMData interface
      const transformedAtms = atms.map(atm => ({
        id: atm.id.toString(),
        bankName: atm.bankName,
        startDate: atm.startDate.toISOString().split('T')[0],
        governorate: atm.governorate,
        city: atm.city,
        atmModel: atm.atmModel,
        atmSerial: atm.atmSerial,
        atmCode: atm.atmCode,
        atmAddress: atm.address,
      }));
      
      console.log(`Returning ${transformedAtms.length} transformed ATMs`);
      return NextResponse.json(transformedAtms);
    }
    
    // If neither model is available
    console.error('No ATM model available!');
    console.error('Prisma models available:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')).join(', '));
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching ATMs:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ error: 'Error fetching ATMs', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}

/**
 * DELETE /api/atms
 * حذف جميع بيانات الماكينات
 * يتطلب صلاحيات إدارة قاعدة البيانات
 */
export async function DELETE(request: NextRequest) {
  // التحقق من الصلاحيات - فقط المدير يمكنه حذف بيانات الماكينات
  const authCheck = await checkAuthAndPermission(request, 'canManageDatabase');
  if (authCheck.error) {
    return authCheck.error;
  }

  try {
    const prisma = getPrisma();
    const results: any = {
      deletedFromATM: 0,
      deletedFromBankATM: 0,
      errors: [] as string[],
    };

    // حذف من جدول ATM (الجدول الجديد)
    if (prisma.aTM) {
      try {
        const countBefore = await prisma.aTM.count();
        await prisma.aTM.deleteMany({});
        results.deletedFromATM = countBefore;
        console.log(`✅ تم حذف ${countBefore} ماكينة من جدول ATM`);
      } catch (error) {
        const errorMsg = `خطأ في حذف جدول ATM: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    // حذف من جدول BankATM (الجدول القديم)
    if (prisma.bankATM) {
      try {
        // استخدام raw query لحذف جميع السجلات
        const countResult = await prisma.$queryRaw<any[]>`
          SELECT COUNT(*) as count FROM [dbo].[BankATM]
        `;
        const countBefore = Number(countResult[0]?.count || 0);

        if (countBefore > 0) {
          await prisma.$executeRawUnsafe(`DELETE FROM [dbo].[BankATM]`);
          results.deletedFromBankATM = countBefore;
          console.log(`✅ تم حذف ${countBefore} ماكينة من جدول BankATM`);
        }
      } catch (error) {
        const errorMsg = `خطأ في حذف جدول BankATM: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    // تسجيل العملية في audit log
    await createAuditLog({
      action: 'DELETE',
      tableName: 'ATMs',
      details: `حذف جميع بيانات الماكينات: ${results.deletedFromATM} من ATM، ${results.deletedFromBankATM} من BankATM`,
      success: results.errors.length === 0,
      errorMessage: results.errors.length > 0 ? results.errors.join('; ') : undefined,
    }, request);

    const totalDeleted = results.deletedFromATM + results.deletedFromBankATM;

    if (results.errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: `تم حذف ${totalDeleted} ماكينة مع بعض الأخطاء`,
        results,
      }, { status: 207 }); // 207 Multi-Status
    }

    return NextResponse.json({
      success: true,
      message: `تم حذف جميع بيانات الماكينات بنجاح (${totalDeleted} ماكينة)`,
      results,
    });
  } catch (error) {
    console.error('Error deleting ATMs:', error);
    
    // تسجيل الخطأ في audit log
    await createAuditLog({
      action: 'DELETE',
      tableName: 'ATMs',
      details: 'محاولة حذف جميع بيانات الماكينات',
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    }, request).catch(() => {}); // Ignore audit log errors

    return NextResponse.json(
      {
        success: false,
        error: 'فشل حذف بيانات الماكينات',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

