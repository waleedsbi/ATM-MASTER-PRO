const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedGovernoratesAndCities() {
  const governorates = [
    {
      name: 'القاهرة',
      cities: ['وسط القاهرة', 'التجمع الخامس', 'مدينة نصر - شرق', 'المعادي', 'مصر الجديدة', 'مدينة الرحاب']
    },
    {
      name: 'الجيزة',
      cities: ['حي الهرم', 'المهندسين', 'التجمع الخامس', 'السادس من اكتوبر']
    },
    {
      name: 'الإسكندرية',
      cities: ['باب شرق', 'السادس من اكتوبر']
    },
    {
      name: 'الإسماعيلية',
      cities: ['الإسماعيلية']
    },
    {
      name: 'الأقصر',
      cities: ['الاقصر']
    },
    {
      name: 'البحر الأحمر',
      cities: ['البحر الاحمر']
    },
    {
      name: 'البحيرة',
      cities: ['البحيره']
    },
    {
      name: 'الدقهلية',
      cities: ['المنصورة']
    },
    {
      name: 'السويس',
      cities: ['السويس', 'العين السخنه']
    },
    {
      name: 'الشرقية',
      cities: ['العاشر من رمضان']
    },
    {
      name: 'الغربية',
      cities: ['المحلة الكبرى - حي أول']
    },
    {
      name: 'القليوبية',
      cities: ['العبور']
    },
    {
      name: 'المنوفية',
      cities: ['شبين الكوم']
    },
    {
      name: 'المنيا',
      cities: ['المنيا']
    },
    {
      name: 'أسوان',
      cities: ['أسوان']
    },
    {
      name: 'أسيوط',
      cities: ['أسيوط']
    },
    {
      name: 'بني سويف',
      cities: ['بني سويف']
    },
    {
      name: 'بورسعيد',
      cities: ['بورسعيد']
    },
    {
      name: 'جنوب سيناء',
      cities: ['جنوب سيناء']
    },
    {
      name: 'دمياط',
      cities: ['الزرقا']
    },
    {
      name: 'سوهاج',
      cities: ['سوهاج']
    },
    {
      name: 'قنا',
      cities: ['قنا']
    }
  ]

  for (const governorate of governorates) {
    const createdGovernorate = await prisma.governorate.create({
      data: {
        name: governorate.name,
      }
    })

    for (const cityName of governorate.cities) {
      await prisma.city.create({
        data: {
          name: cityName,
          governorateId: createdGovernorate.id
        }
      })
    }
  }

  console.log('تم إضافة بيانات المحافظات والمدن بنجاح')
}

// تشغيل عملية إضافة البيانات
seedGovernoratesAndCities()
  .catch((e) => {
    console.error('حدث خطأ أثناء إضافة البيانات:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })