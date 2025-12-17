/**
 * سكربت لحذف جميع بيانات الماكينات
 * 
 * الاستخدام:
 * node scripts/delete-all-atms.js
 * 
 * ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه!
 */

const http = require('http');
const https = require('https');

const baseUrl = process.env.API_URL || 'http://localhost:9002';

console.log('🗑️  بدء حذف جميع بيانات الماكينات...');
console.log(`📍 الاتصال بـ: ${baseUrl}`);
console.log('');
console.log('⚠️  تحذير: هذا الإجراء لا يمكن التراجع عنه!');
console.log('');

// ملاحظة: هذا السكربت يحتاج إلى cookie للمصادقة
// الأفضل هو استخدام الواجهة: http://localhost:9002/database-manager

console.log('❌ هذا السكربت يحتاج إلى مصادقة (cookie).');
console.log('');
console.log('✅ يفضل استخدام الواجهة:');
console.log(`   1. افتح: ${baseUrl}/database-manager`);
console.log('   2. اضغط على زر "حذف بيانات الماكينات"');
console.log('   3. أكد الحذف');
console.log('');
console.log('أو استخدم curl مع cookie:');
console.log(`curl -X DELETE ${baseUrl}/api/atms \\`);
console.log('  -H "Content-Type: application/json" \\');
console.log('  -H "Cookie: user=YOUR_SESSION_COOKIE"');

