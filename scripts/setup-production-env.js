/**
 * سكريبت لإعداد ملف .env.production كاملاً
 * 
 * الاستخدام:
 * node scripts/setup-production-env.js
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

console.log('🔧 إعداد ملف .env.production...\n');

// توليد NEXTAUTH_SECRET عشوائي
const nextAuthSecret = crypto.randomBytes(32).toString('base64');

// محتوى ملف .env.production
const envContent = `# ============================================
# إعدادات البيئة الحية (Production)
# ============================================
# ⚠️ تحذير: هذا الملف يحتوي على معلومات حساسة!
# لا ترفع هذا الملف إلى Git أو أي مستودع عام
# ============================================

# قاعدة البيانات SQL Server
# ملاحظة: @ في كلمة المرور تم ترميزها كـ %40
DATABASE_URL="sqlserver://sa:2221983%40ahmed@95.216.63.80:1433;database=LinkSoft;encrypt=true;trustServerCertificate=true;connectionTimeout=30"

# بيئة الإنتاج
NODE_ENV=production

# رابط التطبيق
NEXT_PUBLIC_APP_URL=https://springtradingclean.com

# المنفذ
PORT=9002

# NextAuth Configuration
# تم توليد هذا المفتاح تلقائياً - احفظه في مكان آمن!
NEXTAUTH_SECRET="${nextAuthSecret}"
NEXTAUTH_URL="https://springtradingclean.com"
`;

// مسار الملف
const envPath = path.join(process.cwd(), '.env.production');

// التحقق من وجود الملف
if (fs.existsSync(envPath)) {
  // إنشاء نسخة احتياطية تلقائياً
  const backupPath = envPath + '.backup.' + Date.now();
  try {
    fs.copyFileSync(envPath, backupPath);
    console.log(`✅ تم إنشاء نسخة احتياطية: ${path.basename(backupPath)}`);
  } catch (backupError) {
    console.warn('⚠️  لم يتم إنشاء نسخة احتياطية:', backupError.message);
  }
  
  console.log('⚠️  ملف .env.production موجود بالفعل!');
  console.log('   سيتم استبداله بملف جديد...\n');
}

// كتابة الملف
try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ تم إنشاء ملف .env.production بنجاح!');
  console.log('');
  console.log('📋 الملف يحتوي على:');
  console.log('  ✅ DATABASE_URL');
  console.log('  ✅ NODE_ENV');
  console.log('  ✅ NEXT_PUBLIC_APP_URL');
  console.log('  ✅ PORT');
  console.log('  ✅ NEXTAUTH_SECRET (تم توليده تلقائياً)');
  console.log('  ✅ NEXTAUTH_URL');
  console.log('');
  console.log('🔐 NEXTAUTH_SECRET الذي تم توليده:');
  console.log(`   ${nextAuthSecret}`);
  console.log('');
  console.log('⚠️  مهم: احفظ NEXTAUTH_SECRET في مكان آمن!');
  console.log('   ستحتاجه عند إعادة النشر أو استعادة النظام.');
  console.log('');
} catch (error) {
  console.error('❌ خطأ في إنشاء الملف:', error.message);
  process.exit(1);
}

