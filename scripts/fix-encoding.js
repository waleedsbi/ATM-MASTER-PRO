/**
 * سكربت لإصلاح الترميز العربي بعد استعادة النسخة الاحتياطية
 * 
 * الاستخدام:
 * node scripts/fix-encoding.js
 * 
 * أو مع URL مخصص:
 * node scripts/fix-encoding.js http://localhost:9002
 */

const http = require('http');
const https = require('https');

const baseUrl = process.argv[2] || 'http://localhost:9002';

console.log('🔧 بدء إصلاح الترميز العربي...');
console.log(`📍 الاتصال بـ: ${baseUrl}`);
console.log('');

// ملاحظة: هذا السكربت يحتاج إلى cookie للمصادقة
// الأفضل هو استخدام الصفحة: http://localhost:9002/fix-encoding

console.log('⚠️  هذا السكربت يحتاج إلى مصادقة.');
console.log('✅ يفضل استخدام الصفحة: http://localhost:9002/fix-encoding');
console.log('');
console.log('أو استخدم curl مع cookie:');
console.log(`curl -X POST ${baseUrl}/api/database/fix-encoding-after-restore \\`);
console.log('  -H "Content-Type: application/json" \\');
console.log('  -H "Cookie: user=YOUR_SESSION_COOKIE"');

