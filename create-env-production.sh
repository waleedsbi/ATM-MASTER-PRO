#!/bin/bash

# سكريبت لإنشاء ملف .env.production تلقائياً

echo "🔧 إنشاء ملف .env.production..."

cat > .env.production << 'EOF'
# قاعدة البيانات SQL Server
# ملاحظة: @ في كلمة المرور تم ترميزها كـ %40
DATABASE_URL="sqlserver://sa:2221983%40ahmed@95.216.63.80:1433;database=LinkSoft;encrypt=true;trustServerCertificate=true;connectionTimeout=30"

# بيئة الإنتاج
NODE_ENV=production

# رابط التطبيق
NEXT_PUBLIC_APP_URL=https://springtradingclean.com

# المنفذ
PORT=9002

# ⚠️ مهم: يجب إضافة هذه المتغيرات يدوياً بعد إنشاء الملف:
# NEXTAUTH_SECRET="your-very-secure-random-secret-key-here-min-32-chars"
# NEXTAUTH_URL="https://springtradingclean.com"
EOF

echo "✅ تم إنشاء ملف .env.production بنجاح!"
echo ""
echo "📋 محتوى الملف:"
cat .env.production
echo ""
echo "⚠️  تحذير: هذا الملف يحتوي على معلومات حساسة!"
echo "   تأكد من عدم رفعه إلى Git (يجب أن يكون في .gitignore)"

