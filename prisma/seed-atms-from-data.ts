import { PrismaClient } from '@prisma/client';
import { atmData } from '../src/lib/data'; // Import from the existing data file

const prisma = new PrismaClient();

async function seedAtmsFromData() {
  console.log('🔄 بدء تحديث بيانات الماكينات من ملف البيانات...\n');
  console.log(`📊 عدد الماكينات في ملف البيانات: ${atmData.length}\n`);

  // حذف الماكينات القديمة أولاً
  console.log('🗑️  حذف الماكينات القديمة...');
  await prisma.aTM.deleteMany({});
  console.log('✅ تم حذف الماكينات القديمة\n');

  let successCount = 0;
  let errorCount = 0;

  for (const atm of atmData) {
    try {
      await prisma.aTM.upsert({
        where: { atmCode: atm.atmCode },
        update: {
          bankName: atm.bankName,
          startDate: new Date(atm.startDate),
          governorate: atm.governorate,
          city: atm.city,
          atmModel: atm.atmModel,
          atmSerial: atm.atmSerial,
          address: atm.atmAddress,
          status: 'active',
        },
        create: {
          atmCode: atm.atmCode,
          atmSerial: atm.atmSerial,
          atmModel: atm.atmModel,
          bankName: atm.bankName,
          governorate: atm.governorate,
          city: atm.city,
          address: atm.atmAddress,
          status: 'active',
          startDate: new Date(atm.startDate),
        },
      });
      
      if ((successCount + 1) % 50 === 0) {
        console.log(`✅ تم إضافة ${successCount + 1} ماكينة...`);
      }
      successCount++;
    } catch (error: any) {
      console.error(`❌ فشل في إضافة: ${atm.atmCode} \n`, error instanceof Error ? error.message : error);
      errorCount++;
    }
  }

  console.log('\n=== النتيجة ===');
  console.log(`✅ تم إضافة: ${successCount} ماكينة`);
  console.log(`❌ فشل: ${errorCount} ماكينة`);
}

seedAtmsFromData()
  .catch((e) => {
    console.error('❌ حدث خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
