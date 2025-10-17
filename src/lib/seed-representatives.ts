const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedRepresentatives() {
  const representatives = [
    {
      name: 'Yassin',
      username: 'yassin',
      email: 'yassin@spring.com'
    },
    {
      name: 'Mahmoud Mostafa',
      username: 'mahmoudmostafa',
      email: 'mahmoudmostafa@spring.com'
    },
    {
      name: 'Abdulrahman Ramadan',
      username: 'abdulrahmanramadan',
      email: 'abdulrahmanramadan@spring.com'
    },
    {
      name: 'Mahmoud Abdul Sapoor',
      username: 'mahmoudabdulsapoor',
      email: 'mahmoudabdulsapoor@spring.com'
    },
    {
      name: 'Admin EG',
      username: 'admineg',
      email: 'admineg@gmail.com'
    },
    {
      name: 'Admin AIX',
      username: 'adminaix',
      email: 'adminaix@gmail.com'
    },
    {
      name: 'Yousef Tarek',
      username: 'youseftarek',
      email: 'youseftarek@spring.com'
    },
    {
      name: 'Abdul Alim Fahmy',
      username: 'abdulalimfahmy',
      email: 'abdulalimfahmy@spring.com'
    },
    {
      name: 'Mariam',
      username: 'mariam',
      email: 'mariam@gmail.com'
    },
    {
      name: 'M. Mohsen',
      username: 'mmohsen',
      email: 'm.mohsen@gmail.com'
    },
    {
      name: 'EgyAdmin',
      username: 'egyadmin',
      email: 'egyadmin@gmail.com'
    },
    {
      name: 'Tarek',
      username: 'tarek',
      email: 'tarek@spring.com'
    },
    {
      name: 'Muhammad Soltan',
      username: 'muhammadsoltan',
      email: 'muhammadsoltan@spring.com'
    },
    {
      name: 'Yehia Ramadan',
      username: 'yehiaramadan',
      email: 'yehiaramadan@spring.com'
    },
    {
      name: 'Ahmed Abdul Shafi',
      username: 'ahmedabdulshafi',
      email: 'ahmedabdulshafi@spring.com'
    },
    {
      name: 'Saeed Farg',
      username: 'saeedfarg',
      email: 'saeedfarg@spring.com'
    },
    {
      name: 'Ali',
      username: 'ali',
      email: 'ali@admnn.com'
    },
    {
      name: 'Admin',
      username: 'admin',
      email: 'admin@gmail.com'
    },
    {
      name: 'Omar Ramadan',
      username: 'omarramadan',
      email: 'omarramadan@spring.com'
    }
  ]

  console.log('بدء إضافة بيانات المندوبين...')

  for (const representative of representatives) {
    await prisma.representative.create({
      data: representative
    }).catch((error: Error) => {
      console.log(`خطأ في إضافة المندوب ${representative.name}:`, error.message)
    })
  }

  console.log('تم إضافة بيانات المندوبين بنجاح')
}

seedRepresentatives()
  .catch((e) => {
    console.error('حدث خطأ:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })