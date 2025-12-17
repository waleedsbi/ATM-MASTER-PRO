import { PrismaClient } from '@prisma/client'

declare global {
  var __prismaClient: PrismaClient | undefined
}

/**
 * إنشاء Prisma Client مع إعدادات الترميز الصحيحة
 * 
 * ملاحظات مهمة حول الترميز العربي:
 * - SQL Server يستخدم NVARCHAR لدعم Unicode (العربية)
 * - Prisma مع SQL Server لا يدعم charset parameter في connection string
 * - يجب ضبط COLLATION في قاعدة البيانات نفسها (Arabic_CI_AS)
 * - عند استعادة النسخة الاحتياطية، يجب تنفيذ سكربت fix-arabic-encoding-after-restore.sql
 * 
 * @see FIX_ARABIC_AFTER_BACKUP_RESTORE.md للحلول الشاملة
 */
function getPrismaClient(): PrismaClient {
  if (globalThis.__prismaClient) {
    return globalThis.__prismaClient
  }

  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error'] // Removed 'warn' to suppress certificate warnings
      : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
        // ملاحظة: Prisma مع SQL Server لا يدعم charset parameter
        // يجب ضبط COLLATION في قاعدة البيانات نفسها
      },
    },
  })

  globalThis.__prismaClient = prisma
  return prisma
}

export function getPrisma(): PrismaClient {
  return getPrismaClient()
}

export const prisma: PrismaClient = getPrismaClient()