# إعدادات متغيرات البيئة للنشر

## معلومات قاعدة البيانات المقدمة:
- **Server**: 95.216.63.80
- **Database**: LinkSoft
- **User**: sa
- **Password**: 2221983@ahmed
- **Encrypt**: true
- **TrustServerCertificate**: true

## ملف .env.production

أنشئ ملف `.env.production` في المجلد الرئيسي مع المحتوى التالي:

```env
# قاعدة البيانات SQL Server
# ملاحظة: @ في كلمة المرور تم ترميزها كـ %40
DATABASE_URL="sqlserver://sa:2221983%40ahmed@95.216.63.80:1433;database=LinkSoft;encrypt=true;trustServerCertificate=true;connectionTimeout=30"

# بيئة الإنتاج
NODE_ENV=production

# رابط التطبيق
NEXT_PUBLIC_APP_URL=https://springtradingclean.com

# المنفذ
PORT=9002
```

## ملاحظات مهمة:

1. **ترميز كلمة المرور**: الرمز `@` في كلمة المرور تم ترميزه كـ `%40` في رابط الاتصال
2. **المنفذ**: 1433 هو المنفذ الافتراضي لـ SQL Server
3. **الأمان**: هذا الملف يحتوي على معلومات حساسة، لا ترفعه إلى Git!

## خطوات النشر:

### 1. على جهازك المحلي:

```bash
# إنشاء ملف .env.production
cat > .env.production << 'EOF'
DATABASE_URL="sqlserver://sa:2221983%40ahmed@95.216.63.80:1433;database=LinkSoft;encrypt=true;trustServerCertificate=true;connectionTimeout=30"
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://springtradingclean.com
PORT=9002
EOF
```

### 2. رفع الملفات إلى الخادم:

```bash
# رفع جميع الملفات
scp -r . user@95.216.63.80:/var/www/atm-master-pro

# أو رفع ملف .env.production فقط
scp .env.production user@95.216.63.80:/var/www/atm-master-pro/.env.production
```

### 3. على الخادم:

```bash
# الانتقال إلى مجلد المشروع
cd /var/www/atm-master-pro

# التأكد من وجود ملف .env.production
cat .env.production

# تشغيل سكريبت النشر
chmod +x deploy.sh
./deploy.sh
```

## التحقق من الاتصال:

بعد النشر، يمكنك التحقق من الاتصال بقاعدة البيانات:

```bash
# على الخادم
cd /var/www/atm-master-pro
npx prisma db pull
```

إذا نجح الأمر، فالاتصال يعمل بشكل صحيح!

