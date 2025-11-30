import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkCityNames() {
  try {
    console.log('🔍 فحص أسماء المدن في قاعدة البيانات للبنك العربي...\n');

    // Get all ATMs for "البنك العربي"
    const arabBankAtms = await prisma.aTM.findMany({
      where: {
        bankName: {
          contains: 'البنك العربي',
        },
      },
      select: {
        atmCode: true,
        bankName: true,
        city: true,
        governorate: true,
      },
      orderBy: {
        city: 'asc',
      },
    });

    console.log(`📊 إجمالي الماكينات للبنك العربي: ${arabBankAtms.length}\n`);

    if (arabBankAtms.length === 0) {
      console.log('⚠️  لا توجد ماكينات للبنك العربي في قاعدة البيانات');
      return;
    }

    // Get unique city names
    const cityMap = new Map<string, { count: number; governorate: string; samples: string[] }>();
    
    arabBankAtms.forEach(atm => {
      const city = atm.city || 'غير محدد';
      const gov = atm.governorate || 'غير محدد';
      
      if (!cityMap.has(city)) {
        cityMap.set(city, {
          count: 0,
          governorate: gov,
          samples: [],
        });
      }
      
      const cityData = cityMap.get(city)!;
      cityData.count++;
      if (cityData.samples.length < 3) {
        cityData.samples.push(atm.atmCode);
      }
    });

    console.log('📍 أسماء المدن الفريدة للبنك العربي:\n');
    Array.from(cityMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([city, data]) => {
        const isEnglish = /^[A-Za-z]/.test(city);
        const marker = isEnglish ? '⚠️  [ENGLISH]' : '✅ [ARABIC]';
        console.log(`   ${marker} "${city}" (${data.count} ماكينة) - ${data.governorate}`);
        console.log(`      أمثلة: ${data.samples.join(', ')}`);
      });

    // Check specifically for "القاهرة الجديدة" variations
    console.log('\n🎯 فحص مدينة "القاهرة الجديدة":\n');
    const newCairoVariations = [
      'القاهرة الجديدة',
      'New Cairo',
      'new cairo',
      'NEW CAIRO',
      'القاهرة الجديده',
      'القاهره الجديدة',
    ];

    newCairoVariations.forEach(variation => {
      const matching = arabBankAtms.filter(a => 
        a.city && a.city.toLowerCase().trim() === variation.toLowerCase().trim()
      );
      if (matching.length > 0) {
        console.log(`   "${variation}": ${matching.length} ماكينة`);
        console.log(`      أمثلة: ${matching.slice(0, 3).map(a => a.atmCode).join(', ')}`);
      }
    });

    // Check for English city names
    console.log('\n🌐 المدن باللغة الإنجليزية:\n');
    const englishCities = Array.from(cityMap.keys()).filter(city => /^[A-Za-z]/.test(city));
    if (englishCities.length > 0) {
      console.log(`   ⚠️  وجدت ${englishCities.length} مدينة باللغة الإنجليزية:`);
      englishCities.forEach(city => {
        const data = cityMap.get(city)!;
        console.log(`      - "${city}" (${data.count} ماكينة)`);
      });
      console.log('\n   💡 هذه المدن قد لا تطابق أسماء المدن العربية في الواجهة!');
    } else {
      console.log('   ✅ جميع المدن باللغة العربية');
    }

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCityNames();

