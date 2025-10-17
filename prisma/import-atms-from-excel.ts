import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importATMs() {
  try {
    // مسار ملف Excel
    const excelFilePath = path.join(process.cwd(), 'prisma', 'atms-data.xlsx');
    
    // التحقق من وجود الملف
    if (!fs.existsSync(excelFilePath)) {
      console.error('❌ ملف Excel غير موجود!');
      console.log('📁 يرجى وضع ملف Excel في المسار التالي:');
      console.log(`   ${excelFilePath}`);
      console.log('\n💡 أو يمكنك تسمية الملف: atms-data.xlsx');
      return;
    }

    console.log('📖 قراءة ملف Excel...');
    
    // قراءة ملف Excel
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0]; // أول sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // تحويل إلى JSON
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 تم قراءة ${rawData.length} صف من Excel`);
    console.log('\n🔍 عينة من البيانات:');
    console.log(rawData[0]); // عرض أول صف كعينة
    
    console.log('\n⚙️ بدء معالجة وإضافة الماكينات...\n');
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      
      try {
        // استخراج البيانات من الصف
        // قم بتعديل أسماء الأعمدة حسب ملف Excel الخاص بك
        const atmCode = row['ATM Code'] || row['atmCode'] || row['كود الماكينة'] || row['رقم الماكينة'];
        const atmSerial = row['Serial'] || row['atmSerial'] || row['السريال'] || row['الرقم التسلسلي'];
        const atmModel = row['Model'] || row['atmModel'] || row['الموديل'] || row['النوع'];
        const bankName = row['Bank'] || row['bankName'] || row['البنك'] || row['اسم البنك'];
        const governorate = row['Governorate'] || row['governorate'] || row['المحافظة'];
        const city = row['City'] || row['city'] || row['المدينة'];
        const address = row['Address'] || row['address'] || row['العنوان'];
        
        // التحقق من البيانات الأساسية
        if (!atmCode) {
          console.log(`⚠️  الصف ${i + 1}: لا يوجد كود للماكينة - تخطي`);
          skippedCount++;
          continue;
        }
        
        // إنشاء كائن البيانات
        const atmData = {
          atmCode: String(atmCode).trim(),
          atmSerial: atmSerial ? String(atmSerial).trim() : 'N/A',
          atmModel: atmModel ? String(atmModel).trim() : 'Unknown',
          bankName: bankName ? String(bankName).trim() : 'غير محدد',
          governorate: governorate ? String(governorate).trim() : 'غير محدد',
          city: city ? String(city).trim() : 'غير محدد',
          address: address ? String(address).trim() : 'غير محدد',
          startDate: new Date(),
          status: 'active',
          lastMaintenance: null,
        };
        
        // إضافة أو تحديث في قاعدة البيانات
        await prisma.aTM.upsert({
          where: { atmCode: atmData.atmCode },
          update: atmData,
          create: atmData,
        });
        
        successCount++;
        console.log(`✅ ${successCount}. تمت إضافة: ${atmData.atmCode} - ${atmData.address}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ خطأ في الصف ${i + 1}:`, error instanceof Error ? error.message : error);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 النتيجة النهائية:');
    console.log('='.repeat(60));
    console.log(`✅ تم إضافة بنجاح: ${successCount} ماكينة`);
    console.log(`❌ فشل: ${errorCount} ماكينة`);
    console.log(`⚠️  تم تخطي: ${skippedCount} صف`);
    console.log(`📝 الإجمالي: ${rawData.length} صف`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ حدث خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل الاستيراد
importATMs();

