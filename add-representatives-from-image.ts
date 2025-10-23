import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// بيانات المندوبين من الصورة
const representatives = [
  {
    name: 'Abdul Alim Fahmy',
    username: 'abdulalimfahmy',
    email: 'abdulalimfahmy@spring.com'
  },
  {
    name: 'Abdulrahman Ramadan',
    username: 'abdulrahmanramadan',
    email: 'abdulrahmanramadan@spring.com'
  },
  {
    name: 'Admin',
    username: 'admin',
    email: 'admin@gmail.com'
  },
  {
    name: 'Admin AIX',
    username: 'adminaix',
    email: 'adminaix@gmail.com'
  },
  {
    name: 'Admin EG',
    username: 'admineg',
    email: 'admineg@gmail.com'
  },
  {
    name: 'Ahmed Abdul Shafi',
    username: 'ahmedabdulshafi',
    email: 'ahmedabdulshafi@spring.com'
  }
];

async function addRepresentatives() {
  console.log('🚀 بدء إضافة المندوبين من الصورة...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const rep of representatives) {
    try {
      // استخدام upsert للتأكد من عدم التكرار
      await prisma.representative.upsert({
        where: { email: rep.email },
        update: {
          name: rep.name,
          username: rep.username,
        },
        create: {
          name: rep.name,
          username: rep.username,
          email: rep.email,
        },
      });
      
      console.log(`✅ تم إضافة/تحديث: ${rep.name} (${rep.email})`);
      successCount++;
    } catch (error) {
      console.error(`❌ خطأ في إضافة ${rep.name}:`, error);
      errorCount++;
    }
  }
  
  console.log('\n📊 النتيجة النهائية:');
  console.log(`✅ تم بنجاح: ${successCount}`);
  console.log(`❌ فشل: ${errorCount}`);
  console.log(`📝 الإجمالي: ${representatives.length}`);
}

addRepresentatives()
  .catch((error) => {
    console.error('خطأ عام:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
