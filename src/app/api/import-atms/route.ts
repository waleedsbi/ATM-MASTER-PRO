import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'لم يتم إرفاق ملف' },
        { status: 400 }
      );
    }

    // قراءة محتوى الملف
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let rawData: any[];

    // Check file type
    if (file.name.endsWith('.csv')) {
      // Parse CSV
      const text = buffer.toString('utf-8');
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      rawData = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',');
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index]?.trim() || '';
          });
          return obj;
        });
    } else {
      // Parse Excel
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const tempData = XLSX.utils.sheet_to_json(worksheet);
      
      // Clean column names: remove spaces, trim
      rawData = tempData.map((row: any) => {
        const cleanedRow: any = {};
        Object.keys(row).forEach(key => {
          // Keep original key AND create cleaned versions
          const cleanKey = String(key).trim();
          cleanedRow[cleanKey] = row[key];
          
          // Also add version without spaces
          const noSpaceKey = cleanKey.replace(/\s+/g, '');
          if (noSpaceKey !== cleanKey) {
            cleanedRow[noSpaceKey] = row[key];
          }
        });
        return cleanedRow;
      });
    }

    console.log(`📊 تم قراءة ${rawData.length} صف`);
    console.log(`📊 الأعمدة في أول صف:`, rawData[0] ? Object.keys(rawData[0]).join(', ') : 'لا توجد بيانات');
    console.log(`📊 عينة من أول صف:`, rawData[0] ? JSON.stringify(rawData[0]).substring(0, 300) : 'فارغ');

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];

      try {
        if (i < 3) {  // Log first 3 rows for debugging
          console.log(`📝 صف ${i + 2}:`, JSON.stringify(row).substring(0, 400));
        }
        
        // Extract data - support multiple column name formats (with and without spaces)
        const atmCode = row['ATMCode'] || row['ATM Code'] || row['atmCode'] || row['Atm Code'] || 
                        row['ATM_Code'] || row['atm_code'] || row['كود الماكينة'] || row['رقم الماكينة'] ||
                        row['ATM'] || row['atm'];
        const atmSerial = row['ATMSerial'] || row['Serial'] || row['atmSerial'] || row['السريال'] || row['الرقم التسلسلي'];
        const atmModel = row['ATMModel'] || row['Model'] || row['atmModel'] || row['الموديل'] || row['النوع'];
        const bankName = row['BanknameL1'] || row['Bankname'] || row['Bank'] || row['bankName'] || row['البنك'] || row['اسم البنك'];
        const governorate = row['GovernorateNameL1'] || row['Governorate'] || row['governorate'] || row['المحافظة'];
        const city = row['CityNameL1'] || row['City'] || row['city'] || row['المدينة'];
        const address = row['ATMAddress'] || row['Address'] || row['address'] || row['العنوان'];
        const startDate = row['StartDate'];

        // Validate required fields
        if (!atmCode || String(atmCode).trim() === '') {
          const skipReason = `لا يوجد ATM Code. الأعمدة المتاحة: ${Object.keys(row).join(', ')}`;
          if (i < 5) {  // Log first 5 errors
            console.log(`⚠️  صف ${i + 2}: ${skipReason}`);
          }
          errors.push(`صف ${i + 2}: ${skipReason}`);
          skippedCount++;
          continue;
        }

        const atmData = {
          atmCode: String(atmCode).trim(),
          atmSerial: atmSerial ? String(atmSerial).trim() : 'N/A',
          atmModel: atmModel ? String(atmModel).trim() : 'Unknown',
          bankName: bankName ? String(bankName).trim() : 'غير محدد',
          governorate: governorate ? String(governorate).trim() : 'غير محدد',
          city: city ? String(city).trim() : 'غير محدد',
          address: address ? String(address).trim() : 'غير محدد',
          startDate: startDate ? new Date(startDate) : new Date(),
          status: 'active',
          lastMaintenance: null,
        };

        await prisma.aTM.upsert({
          where: { atmCode: atmData.atmCode },
          update: atmData,
          create: atmData,
        });

        successCount++;
      } catch (error) {
        errorCount++;
        const errorMsg = `صف ${i + 2}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return NextResponse.json({
      success: successCount,
      failed: errorCount,
      skipped: skippedCount,
      total: rawData.length,
      errors: errors.slice(0, 10), // Return first 10 errors only
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        error: 'حدث خطأ أثناء استيراد البيانات',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

