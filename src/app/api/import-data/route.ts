import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم إرفاق ملف' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'لم يتم تحديد نوع البيانات' }, { status: 400 });
    }

    // قراءة محتوى الملف
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let rawData: any[];

    // Parse file
    if (file.name.endsWith('.csv')) {
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
      
      console.log('📊 تم قراءة Excel. عدد الصفوف:', rawData.length);
      console.log('📊 الأعمدة في أول صف:', rawData[0] ? Object.keys(rawData[0]).join(', ') : 'لا توجد بيانات');
      console.log('📊 عينة من أول صف:', rawData[0] ? JSON.stringify(rawData[0]).substring(0, 300) : 'فارغ');
    }

    console.log(`📊 استيراد ${type}: تم قراءة ${rawData.length} صف`);

    let result;
    switch (type) {
      case 'atms':
        result = await importATMs(rawData);
        break;
      case 'representatives':
        result = await importRepresentatives(rawData);
        break;
      case 'banks':
        result = await importBanks(rawData);
        break;
      case 'governorates':
        result = await importGovernorates(rawData);
        break;
      default:
        return NextResponse.json({ error: 'نوع بيانات غير مدعوم' }, { status: 400 });
    }

    return NextResponse.json(result);

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

async function importATMs(rawData: any[]) {
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];

  console.log(`🔍 بدء استيراد ${rawData.length} صف من الماكينات...`);

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    try {
      if (i < 3) {  // Log first 3 rows for debugging
        console.log(`📝 صف ${i + 2}:`, JSON.stringify(row).substring(0, 400));
      }
      
      // Support multiple column name formats (with and without spaces)
      const atmCode = row['ATMCode'] || row['ATM Code'] || row['atmCode'] || row['Atm Code'] || 
                      row['ATM_Code'] || row['atm_code'] || row['كود الماكينة'] || row['رقم الماكينة'] ||
                      row['ATM'] || row['atm'];
      
      if (!atmCode || String(atmCode).trim() === '') {
        const skipReason = `لا يوجد ATM Code. الأعمدة المتاحة: ${Object.keys(row).join(', ')}`;
        if (i < 5) {  // Log first 5 errors
          console.log(`⚠️  صف ${i + 2}: ${skipReason}`);
        }
        errors.push(`صف ${i + 2}: ${skipReason}`);
        skippedCount++;
        continue;
      }

      const cleanAtmCode = String(atmCode).trim();
      const serialNumber = String(
        row['ATMSerial'] || row['Serial'] || row['atmSerial'] || row['السريال'] || ''
      ).trim();
      
      // Create unique atmCode: use serial if atmCode is duplicate
      let uniqueAtmCode = cleanAtmCode;
      if (serialNumber && serialNumber !== 'N/A' && serialNumber !== '') {
        // Check if this exact atmCode already exists in DB
        const existingWithSameCode = await prisma.aTM.findUnique({
          where: { atmCode: cleanAtmCode }
        });
        
        if (existingWithSameCode && existingWithSameCode.atmSerial !== serialNumber) {
          // This is a different machine with same code - use serial as part of code
          uniqueAtmCode = `${cleanAtmCode}-${serialNumber}`;
          console.log(`📝 صف ${i + 2}: استخدام ${uniqueAtmCode} بدلاً من ${cleanAtmCode} (مكرر)`);
        }
      }
      
      const atmData = {
        atmCode: uniqueAtmCode,
        atmSerial: serialNumber || 'N/A',
        atmModel: String(
          row['ATMModel'] || row['Model'] || row['atmModel'] || row['الموديل'] || 'Unknown'
        ).trim(),
        bankName: String(
          row['BanknameL1'] || row['Bankname'] || row['Bank'] || row['bankName'] || row['البنك'] || 'غير محدد'
        ).trim(),
        governorate: String(
          row['GovernorateNameL1'] || row['Governorate'] || row['governorate'] || row['المحافظة'] || 'غير محدد'
        ).trim(),
        city: String(
          row['CityNameL1'] || row['City'] || row['city'] || row['المدينة'] || 'غير محدد'
        ).trim(),
        address: String(
          row['ATMAddress'] || row['Address'] || row['address'] || row['العنوان'] || 'غير محدد'
        ).trim(),
        startDate: row['StartDate'] ? new Date(row['StartDate']) : new Date(),
        status: 'active',
        lastMaintenance: null,
      };

      // Check if ATM already exists
      const existingATM = await prisma.aTM.findUnique({
        where: { atmCode: uniqueAtmCode }
      });

      if (existingATM) {
        // Update existing
        await prisma.aTM.update({
          where: { atmCode: uniqueAtmCode },
          data: atmData
        });
        updatedCount++;
        console.log(`🔄 صف ${i + 2}: تم تحديث ${uniqueAtmCode}`);
      } else {
        // Create new
        await prisma.aTM.create({
          data: atmData
        });
        successCount++;
        console.log(`✅ صف ${i + 2}: تم إضافة ${uniqueAtmCode}`);
      }

    } catch (error) {
      errorCount++;
      const errorMsg = `صف ${i + 2}: ${error instanceof Error ? error.message : 'خطأ'}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  console.log(`\n📊 النتيجة:`);
  console.log(`✅ تم إضافة: ${successCount}`);
  console.log(`🔄 تم تحديث: ${updatedCount}`);
  console.log(`❌ فشل: ${errorCount}`);
  console.log(`⚠️  تخطي: ${skippedCount}`);
  console.log(`📝 الإجمالي: ${rawData.length}`);

  return { 
    success: successCount, 
    updated: updatedCount,
    failed: errorCount, 
    skipped: skippedCount, 
    total: rawData.length, 
    errors: errors.slice(0, 10),
    message: `تم إضافة ${successCount} ماكينة جديدة وتحديث ${updatedCount} ماكينة موجودة`
  };
}

async function importRepresentatives(rawData: any[]) {
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    try {
      const name = row['Name'] || row['name'] || row['الاسم'];
      const email = row['Email'] || row['email'] || row['البريد'];
      
      if (!name || !email) {
        skippedCount++;
        continue;
      }

      const username = row['Username'] || row['username'] || email.split('@')[0];

      await prisma.representative.upsert({
        where: { email: String(email).trim().toLowerCase() },
        update: {
          name: String(name).trim(),
          username: String(username).trim(),
        },
        create: {
          name: String(name).trim(),
          username: String(username).trim(),
          email: String(email).trim().toLowerCase(),
        },
      });

      successCount++;
    } catch (error) {
      errorCount++;
      errors.push(`صف ${i + 2}: ${error instanceof Error ? error.message : 'خطأ'}`);
    }
  }

  return { success: successCount, failed: errorCount, skipped: skippedCount, total: rawData.length, errors: errors.slice(0, 10) };
}

async function importBanks(rawData: any[]) {
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    try {
      const name = row['Name'] || row['name'] || row['الاسم'];
      
      if (!name) {
        skippedCount++;
        continue;
      }

      const location = row['Location'] || row['location'] || row['الموقع'] || 'غير محدد';
      const contact = row['Contact'] || row['contact'] || row['الاتصال'] || 'غير محدد';

      await prisma.bank.create({
        data: {
          name: String(name).trim(),
          location: String(location).trim(),
          contact: String(contact).trim(),
        },
      });

      successCount++;
    } catch (error) {
      errorCount++;
      errors.push(`صف ${i + 2}: ${error instanceof Error ? error.message : 'خطأ'}`);
    }
  }

  return { success: successCount, failed: errorCount, skipped: skippedCount, total: rawData.length, errors: errors.slice(0, 10) };
}

async function importGovernorates(rawData: any[]) {
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  // Group by governorate
  const govMap = new Map<string, Set<string>>();

  for (const row of rawData) {
    const govName = row['Governorate'] || row['governorate'] || row['المحافظة'];
    const cityName = row['City'] || row['city'] || row['المدينة'];

    if (govName) {
      if (!govMap.has(govName)) {
        govMap.set(govName, new Set());
      }
      if (cityName) {
        govMap.get(govName)!.add(cityName);
      }
    }
  }

  for (const [govName, cities] of govMap) {
    try {
      const gov = await prisma.governorate.upsert({
        where: { name: String(govName).trim() },
        update: {},
        create: { name: String(govName).trim() },
      });

      for (const cityName of cities) {
        try {
          await prisma.city.create({
            data: {
              name: String(cityName).trim(),
              governorateId: gov.id,
            },
          });
          successCount++;
        } catch (error) {
          // City might already exist
          if (error instanceof Error && error.message.includes('Unique constraint')) {
            skippedCount++;
          } else {
            errorCount++;
            errors.push(`المدينة ${cityName}: ${error instanceof Error ? error.message : 'خطأ'}`);
          }
        }
      }
    } catch (error) {
      errorCount++;
      errors.push(`المحافظة ${govName}: ${error instanceof Error ? error.message : 'خطأ'}`);
    }
  }

  return { success: successCount, failed: errorCount, skipped: skippedCount, total: rawData.length, errors: errors.slice(0, 10) };
}

