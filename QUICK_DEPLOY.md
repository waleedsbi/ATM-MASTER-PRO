# دليل النشر السريع

## الخطوات السريعة للنشر على الخادم springtradingclean.com (95.216.63.80)

### 1. إعداد ملف البيئة

```bash
# إنشاء ملف .env.production
cat > .env.production << 'EOF'
DATABASE_URL="sqlserver://sa:2221983%40ahmed@95.216.63.80:1433;database=LinkSoft;encrypt=true;trustServerCertificate=true;connectionTimeout=30"
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://springtradingclean.com
PORT=9002
EOF

# أو عدّل الملف يدوياً
nano .env.production
```

**ملاحظة مهمة**: الرمز `@` في كلمة المرور تم ترميزه كـ `%40` في رابط الاتصال.

### 2. رفع الملفات

```bash
# من جهازك المحلي
scp -r . user@95.216.63.80:/var/www/atm-master-pro
```

### 3. على الخادم - تشغيل سكريبت النشر

```bash
# تسجيل الدخول إلى الخادم
ssh user@95.216.63.80

# الانتقال إلى مجلد المشروع
cd /var/www/atm-master-pro

# جعل سكريبت النشر قابل للتنفيذ
chmod +x deploy.sh

# تشغيل سكريبت النشر
./deploy.sh
```

### 4. تشغيل الخادم باستخدام PM2

```bash
# تثبيت PM2 (مرة واحدة فقط)
npm install -g pm2

# تشغيل التطبيق
pm2 start ecosystem.config.js

# حفظ الإعدادات
pm2 save

# إعداد PM2 للبدء تلقائياً عند إعادة تشغيل الخادم
pm2 startup
```

### 5. التحقق من التشغيل

```bash
# فحص الحالة
pm2 status

# فحص السجلات
pm2 logs atm-master-pro

# فتح المتصفح
# https://springtradingclean.com
```

## تحديث النظام لاحقاً

```bash
cd /var/www/atm-master-pro
git pull  # إذا كنت تستخدم Git
./deploy.sh
pm2 restart atm-master-pro
```

## استكشاف الأخطاء

```bash
# فحص السجلات
pm2 logs atm-master-pro --lines 100

# فحص الاتصال بقاعدة البيانات
npx prisma db pull

# إعادة تشغيل الخادم
pm2 restart atm-master-pro
```

