import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// قائمة الماكينات من الملف
const atmsData = [
  { atmCode: 'ATM9333', atmSerial: 'GEUT0064262', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'فرع بنك تجاري دولي - مول', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9212', atmSerial: 'GEUT0064230', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'التجمع الخامس', address: 'Point 90 Mall', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9213', atmSerial: 'GEUT0064231', atmModel: '6632 PERSONAS77 ESSEMPILY', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'التجمع الخامس', address: 'STYLISH', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9334', atmSerial: 'GEUT0064263', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: '(DOWNTOWN)', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9212', atmSerial: 'GEUT0064272', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'POINTGO CENTER MALL', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9425', atmSerial: 'GEUT0064273', atmModel: '6632 PERSONAS77 IN DRIVE LINE P/E: 1 Max', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'التجمع الخامس', address: 'SHELL IN DRIVE', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9336', atmSerial: 'GEUT0064265', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'AKL ALMAROUKA', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9337', atmSerial: 'GEUT0064264', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'ALTAJAMO ALKHAMIS', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9338', atmSerial: 'GEUT0064267', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'Galina Mall Egypt', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9212', atmSerial: 'GEUT0064268', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'GREEN PLAZA 2', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9340', atmSerial: 'GEUT0064269', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'CITY LIGHT MALL', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9341', atmSerial: 'GEUT0064270', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'YASSEF NAMANI', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9342', atmSerial: 'GEUT0064271', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'New City', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9343', atmSerial: 'GEUT0064264', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'North Coast Grand Height', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9344', atmSerial: 'GEUT0064274', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'NILE CITY', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9345', atmSerial: 'GEUT0064275', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'Port Said', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9346', atmSerial: 'GEUT0064276', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'Nozha Branch', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9347', atmSerial: 'GEUT0064277', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'Safina Mall', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9222', atmSerial: 'GEUT0064232', atmModel: 'WINCOR2', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'WINCOR 2', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9348', atmSerial: 'GEUT0064278', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'Beit Mall', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9349', atmSerial: 'GEUT0064279', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'WAN 1', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9350', atmSerial: 'GEUT0064280', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'MEANA CANEL SHAD', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9351', atmSerial: 'GEUT0064281', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'Club by cleopatra', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9352', atmSerial: 'GEUT0064282', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'Downtown Mall', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9353', atmSerial: 'GEUT0064283', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'NILE CITY 2', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9354', atmSerial: 'GEUT0064284', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'CITYA STARS', startDate: new Date('2025-03-05') },
  { atmCode: 'ATM9355', atmSerial: 'GEUT0064285', atmModel: '6632 PERSONAS77', bankName: 'البنك الأهلي المصري', governorate: 'القاهرة', city: 'القاهرة الجديدة', address: 'NEW LIFE DRIVE', startDate: new Date('2025-03-05') },
  // يمكن إضافة المزيد من الماكينات هنا...
];

async function main() {
  console.log('بدء إضافة الماكينات...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const atmData of atmsData) {
    try {
      await prisma.aTM.upsert({
        where: { atmCode: atmData.atmCode },
        update: {
          ...atmData,
          status: 'active',
        },
        create: {
          ...atmData,
          status: 'active',
          lastMaintenance: null,
        },
      });
      successCount++;
      console.log(`✅ تمت إضافة: ${atmData.atmCode} - ${atmData.address}`);
    } catch (error) {
      errorCount++;
      console.error(`❌ فشل في إضافة: ${atmData.atmCode}`, error instanceof Error ? error.message : error);
    }
  }
  
  console.log('\n=== النتيجة ===');
  console.log(`✅ تم إضافة: ${successCount} ماكينة`);
  console.log(`❌ فشل: ${errorCount} ماكينة`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('خطأ:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

