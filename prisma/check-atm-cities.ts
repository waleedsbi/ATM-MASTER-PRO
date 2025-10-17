import { PrismaClient } from '@prisma/client';
import { governorates } from '../src/lib/data';

const prisma = new PrismaClient();

async function checkAtmCities() {
  console.log('🔍 فحص بيانات الماكينات...\n');

  try {
    // Get all ATMs
    const atms = await prisma.aTM.findMany({
      select: {
        atmCode: true,
        city: true,
        governorate: true,
        bankName: true,
      },
      orderBy: {
        city: 'asc',
      },
    });

    console.log(`📊 عدد الماكينات في قاعدة البيانات: ${atms.length}\n`);

    // Group by city
    const citiesMap = new Map<string, { governorate: string; count: number; codes: string[] }>();
    
    atms.forEach((atm) => {
      const key = `${atm.governorate}/${atm.city}`;
      if (!citiesMap.has(key)) {
        citiesMap.set(key, {
          governorate: atm.governorate || '',
          count: 0,
          codes: [],
        });
      }
      const cityData = citiesMap.get(key)!;
      cityData.count++;
      if (cityData.codes.length < 3) {
        cityData.codes.push(atm.atmCode);
      }
    });

    console.log('📍 المدن الموجودة في قاعدة البيانات:\n');
    
    Array.from(citiesMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([key, data]) => {
        const [gov, city] = key.split('/');
        console.log(`   ${gov} - ${city}: ${data.count} ماكينة (${data.codes.join(', ')}...)`);
      });

    console.log('\n\n🗺️  المدن المتوقعة في governorates (القاهرة فقط):\n');
    
    const cairoGov = governorates.find(g => g.nameAr === 'القاهرة');
    if (cairoGov) {
      cairoGov.cities.slice(0, 20).forEach((city) => {
        console.log(`   - ${city.nameAr}`);
      });
      console.log(`   ... (${cairoGov.cities.length} مدينة إجمالاً في القاهرة)`);
    }

    // Check for "الشروق" specifically
    console.log('\n\n🔎 البحث عن "الشروق" في قاعدة البيانات:\n');
    const shoroukAtms = atms.filter(atm => 
      atm.city?.includes('شروق') || atm.city?.includes('الشروق')
    );
    
    if (shoroukAtms.length > 0) {
      console.log(`✅ وجدت ${shoroukAtms.length} ماكينة في الشروق:`);
      shoroukAtms.forEach(atm => {
        console.log(`   - ${atm.atmCode}: ${atm.city} (${atm.governorate})`);
      });
    } else {
      console.log('❌ لا توجد ماكينات في "الشروق" في قاعدة البيانات');
    }

    // Check if Shorouk exists in governorates
    console.log('\n🔎 البحث عن "الشروق" في governorates:\n');
    governorates.forEach(gov => {
      const shoroukCity = gov.cities.find(c => 
        c.nameAr.includes('شروق') || c.nameAr.includes('الشروق')
      );
      if (shoroukCity) {
        console.log(`✅ وجدت في المحافظة: ${gov.nameAr} - المدينة: ${shoroukCity.nameAr}`);
      }
    });

  } catch (error) {
    console.error('❌ حدث خطأ:', error);
    process.exit(1);
  }
}

checkAtmCities()
  .catch((e) => {
    console.error('حدث خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

