/**
 * سكربت لحذف جميع بيانات الماكينات مباشرة من قاعدة البيانات
 * 
 * الاستخدام:
 * node scripts/delete-all-atms-direct.js
 * 
 * ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه!
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllATMs() {
  console.log('🗑️  بدء حذف جميع بيانات الماكينات...\n');

  const results = {
    deletedFromATM: 0,
    deletedFromBankATM: 0,
    errors: [],
  };

  try {
    // حذف من جدول ATM (الجدول الجديد)
    if (prisma.aTM) {
      try {
        const countBefore = await prisma.aTM.count();
        console.log(`📊 عدد الماكينات في جدول ATM: ${countBefore}`);
        
        if (countBefore > 0) {
          await prisma.aTM.deleteMany({});
          results.deletedFromATM = countBefore;
          console.log(`✅ تم حذف ${countBefore} ماكينة من جدول ATM\n`);
        } else {
          console.log(`ℹ️  جدول ATM فارغ بالفعل\n`);
        }
      } catch (error) {
        const errorMsg = `❌ خطأ في حذف جدول ATM: ${error.message}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    } else {
      console.log('ℹ️  جدول ATM غير متاح\n');
    }

    // حذف من جدول BankATM (الجدول القديم)
    if (prisma.bankATM) {
      try {
        // استخدام raw query لحذف جميع السجلات
        const countResult = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM [dbo].[BankATM]
        `;
        const countBefore = Number(countResult[0]?.count || 0);
        console.log(`📊 عدد الماكينات في جدول BankATM: ${countBefore}`);

        if (countBefore > 0) {
          await prisma.$executeRawUnsafe(`DELETE FROM [dbo].[BankATM]`);
          results.deletedFromBankATM = countBefore;
          console.log(`✅ تم حذف ${countBefore} ماكينة من جدول BankATM\n`);
        } else {
          console.log(`ℹ️  جدول BankATM فارغ بالفعل\n`);
        }
      } catch (error) {
        const errorMsg = `❌ خطأ في حذف جدول BankATM: ${error.message}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    } else {
      console.log('ℹ️  جدول BankATM غير متاح\n');
    }

    // عرض النتائج النهائية
    const totalDeleted = results.deletedFromATM + results.deletedFromBankATM;
    
    console.log('========================================');
    console.log('📊 النتائج النهائية:');
    console.log('========================================');
    console.log(`✅ تم حذف ${results.deletedFromATM} ماكينة من جدول ATM`);
    console.log(`✅ تم حذف ${results.deletedFromBankATM} ماكينة من جدول BankATM`);
    console.log(`📦 إجمالي المحذوف: ${totalDeleted} ماكينة`);
    
    if (results.errors.length > 0) {
      console.log(`\n⚠️  الأخطاء:`);
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (totalDeleted > 0) {
      console.log('\n✅ تم حذف جميع بيانات الماكينات بنجاح!');
    } else {
      console.log('\nℹ️  لا توجد بيانات ماكينات للحذف');
    }
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ حدث خطأ عام:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// تنفيذ الحذف
deleteAllATMs()
  .catch((error) => {
    console.error('❌ فشل تنفيذ الحذف:', error);
    process.exit(1);
  });

