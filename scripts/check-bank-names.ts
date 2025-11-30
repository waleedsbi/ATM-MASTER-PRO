import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkBankNames() {
  try {
    console.log('🔍 فحص أسماء البنوك في قاعدة البيانات...\n');
    
    // Test connection
    const count = await prisma.aTM.count();
    console.log(`✅ الاتصال بقاعدة البيانات نجح. عدد الماكينات: ${count}\n`);
    
    if (count === 0) {
      console.log('⚠️  قاعدة البيانات فارغة! لا توجد ماكينات.');
      return;
    }

    // Get all unique bank names
    const allAtms = await prisma.aTM.findMany({
      select: {
        bankName: true,
        atmCode: true,
        city: true,
        governorate: true,
      },
    });

    console.log(`📊 إجمالي الماكينات: ${allAtms.length}\n`);

    // Get unique bank names
    const uniqueBanks = new Set(allAtms.map(a => a.bankName));
    console.log('🏦 أسماء البنوك الفريدة في قاعدة البيانات:');
    Array.from(uniqueBanks).sort().forEach((bank, index) => {
      const count = allAtms.filter(a => a.bankName === bank).length;
      console.log(`   ${index + 1}. "${bank}" (${count} ماكينة)`);
    });

    // Check specifically for "البنك العربي"
    console.log('\n🔎 فحص البنك العربي:');
    const arabBankVariations = [
      'البنك العربي',
      'البنك العربي ',
      ' البنك العربي',
      'البنك العربي الإفريقي',
      'البنك العربي الافريقي',
    ];

    arabBankVariations.forEach(variation => {
      const count = allAtms.filter(a => a.bankName === variation).length;
      if (count > 0) {
        console.log(`   "${variation}": ${count} ماكينة`);
      }
    });

    // Check for ATMs in "القاهرة الجديدة" for any bank
    console.log('\n📍 الماكينات في مدينة "القاهرة الجديدة":');
    const newCairoAtms = allAtms.filter(a => a.city === 'القاهرة الجديدة');
    console.log(`   إجمالي: ${newCairoAtms.length} ماكينة\n`);

    const newCairoBanks = new Map<string, number>();
    newCairoAtms.forEach(atm => {
      const count = newCairoBanks.get(atm.bankName) || 0;
      newCairoBanks.set(atm.bankName, count + 1);
    });

    console.log('   البنوك في القاهرة الجديدة:');
    Array.from(newCairoBanks.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([bank, count]) => {
        console.log(`     "${bank}": ${count} ماكينة`);
      });

    // Check specifically for "البنك العربي" in "القاهرة الجديدة"
    console.log('\n🎯 الماكينات للبنك العربي في القاهرة الجديدة:');
    const arabBankNewCairo = allAtms.filter(
      a => a.city === 'القاهرة الجديدة' && 
           (a.bankName.includes('البنك العربي') || a.bankName === 'البنك العربي')
    );
    
    console.log(`   العدد: ${arabBankNewCairo.length} ماكينة`);
    if (arabBankNewCairo.length > 0) {
      console.log('\n   أمثلة:');
      arabBankNewCairo.slice(0, 5).forEach(atm => {
        console.log(`     - ${atm.atmCode}: "${atm.bankName}"`);
      });
    }

    // Show exact bank name from static data
    console.log('\n📋 اسم البنك في القائمة الثابتة:');
    console.log('   "البنك العربي"');

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBankNames();

