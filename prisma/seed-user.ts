import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🔑 Seeding single admin user...')

  // بيانات المستخدم الافتراضي
  const email = 'waleed@admin.com'
  const password = 'admin123'

  const hashedPassword = await hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'المسؤول',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  })

  console.log('✅ Admin user is ready:')
  console.log('   Email:', email)
  console.log('   Password:', password)
  console.log('   Role:', user.role)
}

main()
  .catch(async (e) => {
    console.error('❌ Error while seeding admin user:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


