import { PrismaClient } from '@prisma/client'

async function test() {
  console.log('Creating Prisma Client...')
  const prisma = new PrismaClient()
  console.log('Prisma Client created:', typeof prisma)
  console.log('Has aTM:', typeof prisma.aTM)
  console.log('Has count method:', typeof prisma.aTM?.count)
}

test().catch(console.error)
