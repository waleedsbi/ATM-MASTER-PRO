/**
 * سكريبت لتوليد NEXTAUTH_SECRET عشوائي آمن
 * 
 * الاستخدام:
 * node scripts/generate-secret.js
 */

const crypto = require('crypto');

// توليد مفتاح عشوائي قوي (64 حرف)
const secret = crypto.randomBytes(32).toString('base64');

console.log('');
console.log('🔐 تم توليد NEXTAUTH_SECRET جديد:');
console.log('');
console.log(secret);
console.log('');
console.log('📋 أضف هذا المفتاح إلى ملف .env.production:');
console.log(`NEXTAUTH_SECRET="${secret}"`);
console.log('');

