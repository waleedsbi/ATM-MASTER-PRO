import { PrismaClient } from '@prisma/client';
import { governorates } from '../src/lib/data';

const prisma = new PrismaClient();

// Create a mapping for governorates (fix spelling variations)
const governorateMapping: Record<string, string> = {
  'الاسكندرية': 'الإسكندرية',
  'اسكندرية': 'الإسكندرية',
  'اسيوط': 'أسيوط',
  'الاقصر': 'الأقصر',
  'اقصر': 'الأقصر',
  'اسوان': 'أسوان',
  'الاسماعيلية': 'الإسماعيلية',
  'اسماعيلية': 'الإسماعيلية',
  'بورسعيد': 'بورسعيد',
  'بني سويف': 'بني سويف',
};

// Create a mapping of common city variations
const cityNameMapping: Record<string, string> = {
  'الشروق': 'مدينة الشروق',
  'المقطم': 'الخليفة والمقطم',
  '6 اكتوبر': 'السادس من اكتوبر',
  'المعادي': 'المعادى',
  'المعادى': 'المعادى',
  'جاردن سيتي': 'جاردن سيتى',
  'جاردن سيتى': 'جاردن سيتى',
  'المهندسين': 'العجوزة', // المهندسين جزء من العجوزة
  'الدقي': 'الدقى',
  'الدقى': 'الدقى',
  'الزمالك': 'الزمالك', // need to add to governorates
  'أسوان': 'اسوان',
  'الرحاب': 'القاهرة الجديدة', // الرحاب جزء من القاهرة الجديدة
  'مدينتي': 'القاهرة الجديدة', // مدينتي جزء من القاهرة الجديدة
  'بورسعيد': 'شرق',
  'بني سويف': 'بنى سويف',
  'بنى سويف': 'بنى سويف',
  'التجمع الخامس': 'القاهرة الجديدة',
  'القرية الذكية': 'السادس من اكتوبر',
  'الأزهر': 'الازبكية',
  'فيصل': 'الهرم',
  'العباسية': 'عين شمس',
  'رمسيس': 'الزاوية الحمراء',
  'الجمالية': 'الموسكى',
  'الوايلي': 'الوايلى',
  'أوسيم': 'اوسيم',
  'أشمون': 'اشمون',
  'ملوي': 'ملوى',
  'أخميم': 'اخميم',
  'نجع حمادي': 'نجع حمادى',
  'أطفيح': 'اطفيح',
  'ايتاي البارود': 'ايتاى البارود',
  'القطامية': 'القاهرة الجديدة',
  'العاصمة الإدارية': 'العاصمة الادارية',
  'حدائق اكتوبر': 'السادس من اكتوبر',
  'الاسكندرية': 'وسط', // مدينة الإسكندرية -> وسط
  'العجمي': 'العجمى',
};

async function fixCityNames() {
  console.log('🔄 بدء تحديث أسماء المدن...\n');

  try {
    // Get all ATMs with their current city names
    const atms = await prisma.aTM.findMany({
      select: {
        atmCode: true,
        city: true,
        governorate: true,
      },
    });

    console.log(`📊 عدد الماكينات: ${atms.length}\n`);

    let updatedCount = 0;
    let unmatchedCities = new Set<string>();

    for (const atm of atms) {
      if (!atm.city || !atm.governorate) continue;

      // Special case: الزمالك always belongs to الجيزة
      if (atm.city === 'الزمالك' && atm.governorate === 'القاهرة') {
        console.log(`🔄 نقل الزمالك: ${atm.atmCode} - من القاهرة إلى الجيزة`);
        
        await prisma.aTM.update({
          where: { atmCode: atm.atmCode },
          data: { governorate: 'الجيزة' },
        });
        
        updatedCount++;
        continue;
      }

      // Map governorate name if needed
      const mappedGovernorate = governorateMapping[atm.governorate] || atm.governorate;
      
      // Update governorate if it was mapped
      if (mappedGovernorate !== atm.governorate) {
        console.log(`🔄 تحديث محافظة: ${atm.atmCode} - "${atm.governorate}" ➜ "${mappedGovernorate}"`);
        
        await prisma.aTM.update({
          where: { atmCode: atm.atmCode },
          data: { governorate: mappedGovernorate },
        });
        
        updatedCount++;
      }

      // Find the governorate in the data
      const gov = governorates.find(
        (g) => g.nameAr === mappedGovernorate
      );

      if (!gov) {
        console.log(`⚠️  محافظة غير موجودة: ${mappedGovernorate}`);
        continue;
      }

      // Check if city name needs to be updated
      const cityExists = gov.cities.some((c) => c.nameAr === atm.city);

      if (!cityExists) {
        // Try to find a match in the mapping
        const mappedCityName = cityNameMapping[atm.city];
        
        if (mappedCityName) {
          // Check if mapped name exists in governorate
          const cityInGov = gov.cities.find((c) => c.nameAr === mappedCityName);
          
          if (cityInGov) {
            console.log(`🔄 تحديث: ${atm.atmCode} - "${atm.city}" ➜ "${mappedCityName}"`);
            
            await prisma.aTM.update({
              where: { atmCode: atm.atmCode },
              data: { city: mappedCityName },
            });
            
            updatedCount++;
          } else {
            unmatchedCities.add(`${atm.governorate}/${atm.city}`);
          }
        } else {
          // Try to find similar city names
          const similarCity = gov.cities.find((c) =>
            c.nameAr.includes(atm.city) || atm.city.includes(c.nameAr)
          );

          if (similarCity) {
            console.log(`🔄 تحديث: ${atm.atmCode} - "${atm.city}" ➜ "${similarCity.nameAr}"`);
            
            await prisma.aTM.update({
              where: { atmCode: atm.atmCode },
              data: { city: similarCity.nameAr },
            });
            
            updatedCount++;
          } else {
            unmatchedCities.add(`${atm.governorate}/${atm.city}`);
          }
        }
      }
    }

    console.log('\n=== النتيجة ===');
    console.log(`✅ تم تحديث: ${updatedCount} ماكينة`);
    
    if (unmatchedCities.size > 0) {
      console.log(`\n⚠️  مدن لم يتم العثور على مطابقة لها (${unmatchedCities.size}):`);
      Array.from(unmatchedCities).forEach((city) => {
        console.log(`   - ${city}`);
      });
      
      console.log('\n💡 يرجى إضافة هذه المدن يدوياً إلى cityNameMapping في ملف fix-city-names.ts');
    }

  } catch (error) {
    console.error('❌ حدث خطأ:', error);
    process.exit(1);
  }
}

fixCityNames()
  .catch((e) => {
    console.error('حدث خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

