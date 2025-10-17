import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('بدء إضافة البيانات التجريبية...');

  // إضافة مندوبين
  console.log('إضافة المندوبين...');
  const representatives = await Promise.all([
    prisma.representative.upsert({
      where: { email: 'ahmed.mohamed@example.com' },
      update: {},
      create: {
        name: 'أحمد محمد',
        username: 'ahmed.mohamed',
        email: 'ahmed.mohamed@example.com',
      },
    }),
    prisma.representative.upsert({
      where: { email: 'mohamed.ali@example.com' },
      update: {},
      create: {
        name: 'محمد علي',
        username: 'mohamed.ali',
        email: 'mohamed.ali@example.com',
      },
    }),
    prisma.representative.upsert({
      where: { email: 'sara.ahmed@example.com' },
      update: {},
      create: {
        name: 'سارة أحمد',
        username: 'sara.ahmed',
        email: 'sara.ahmed@example.com',
      },
    }),
    prisma.representative.upsert({
      where: { email: 'fatima.hassan@example.com' },
      update: {},
      create: {
        name: 'فاطمة حسن',
        username: 'fatima.hassan',
        email: 'fatima.hassan@example.com',
      },
    }),
    prisma.representative.upsert({
      where: { email: 'omar.ibrahim@example.com' },
      update: {},
      create: {
        name: 'عمر إبراهيم',
        username: 'omar.ibrahim',
        email: 'omar.ibrahim@example.com',
      },
    }),
  ]);

  console.log(`تم إضافة ${representatives.length} مندوب`);

  // إضافة ماكينات ATM تجريبية
  console.log('إضافة ماكينات ATM...');
  const atms = [
    {
      atmCode: 'ATM-CAI-001',
      atmSerial: 'SN-2024-001',
      atmModel: 'NCR SelfServ 84',
      bankName: 'البنك الأهلي المصري',
      governorate: 'القاهرة',
      city: 'المعادي',
      address: 'شارع النصر، المعادي',
      startDate: new Date('2024-01-01'),
      status: 'active',
    },
    {
      atmCode: 'ATM-CAI-002',
      atmSerial: 'SN-2024-002',
      atmModel: 'Diebold Nixdorf DN Series',
      bankName: 'بنك مصر',
      governorate: 'القاهرة',
      city: 'مدينة نصر',
      address: 'شارع عباس العقاد، مدينة نصر',
      startDate: new Date('2024-01-15'),
      status: 'active',
    },
    {
      atmCode: 'ATM-CAI-003',
      atmSerial: 'SN-2024-003',
      atmModel: 'Wincor Nixdorf',
      bankName: 'بنك القاهرة',
      governorate: 'القاهرة',
      city: 'وسط البلد',
      address: 'ميدان طلعت حرب',
      startDate: new Date('2024-02-01'),
      status: 'active',
    },
    {
      atmCode: 'ATM-ALX-001',
      atmSerial: 'SN-2024-004',
      atmModel: 'NCR SelfServ 84',
      bankName: 'بنك الإسكندرية',
      governorate: 'الإسكندرية',
      city: 'محرم بك',
      address: 'شارع فؤاد، محرم بك',
      startDate: new Date('2024-01-20'),
      status: 'active',
    },
    {
      atmCode: 'ATM-ALX-002',
      atmSerial: 'SN-2024-005',
      atmModel: 'Diebold Nixdorf DN Series',
      bankName: 'البنك العربي الإفريقي الدولي',
      governorate: 'الإسكندرية',
      city: 'سموحة',
      address: 'شارع فوزي معاذ، سموحة',
      startDate: new Date('2024-02-10'),
      status: 'active',
    },
  ];

  for (const atmData of atms) {
    await prisma.aTM.upsert({
      where: { atmCode: atmData.atmCode },
      update: atmData,
      create: atmData,
    });
  }

  console.log(`تم إضافة ${atms.length} ماكينة ATM`);

  // إضافة مستخدم تجريبي
  console.log('إضافة مستخدم تجريبي...');
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'المسؤول',
      password: '$2a$10$YourHashedPasswordHere', // يجب تشفير كلمة المرور
      role: 'admin',
    },
  });

  console.log('تم إضافة المستخدم التجريبي');
  console.log('✅ تمت إضافة جميع البيانات التجريبية بنجاح');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ خطأ أثناء إضافة البيانات:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

