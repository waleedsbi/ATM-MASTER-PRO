const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedAdditionalRepresentatives() {
  const representatives = [
    {
      name: 'Ahmed Attia',
      username: 'ahmedattia',
      email: 'ahmedattia@spring.com'
    },
    {
      name: 'Mahmoud Muhammad',
      username: 'mahmoudmuhammad',
      email: 'mahmoudmuhammad@spring.com'
    },
    {
      name: 'Abdullah Ahmed',
      username: 'abdullahahmed',
      email: 'abdullahahmed@spring.com'
    },
    {
      name: 'El Saeed',
      username: 'elsaeed',
      email: 'elsaeed@spring.com'
    },
    {
      name: 'Islam',
      username: 'islam',
      email: 'islam@spring.com'
    },
    {
      name: 'Admin NBD',
      username: 'adminnbd',
      email: 'adminenbd@gmail.com'
    }
  ]

  console.log('بدء إضافة بيانات المندوبين الإضافيين...')

  for (const representative of representatives) {
    await prisma.representative.create({
      data: representative
    }).catch((error: Error) => {
      console.log(`خطأ في إضافة المندوب ${representative.name}:`, error.message)
    })
  }

  console.log('تم إضافة بيانات المندوبين الإضافيين بنجاح')
}

seedAdditionalRepresentatives()
  .catch((e) => {
    console.error('حدث خطأ:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })