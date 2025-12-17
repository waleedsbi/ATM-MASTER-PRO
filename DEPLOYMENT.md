# دليل نشر النظام على الخادم

## متطلبات الخادم

- Node.js 18+ 
- npm أو yarn
- SQL Server (قاعدة البيانات)
- PM2 (لإدارة العملية) - اختياري

## خطوات النشر

### 1. إعداد متغيرات البيئة

أنشئ ملف `.env.production` في المجلد الرئيسي:

```env
# قاعدة البيانات
# ملاحظة: إذا كانت كلمة المرور تحتوي على @ أو : يجب ترميزها (URL encoding)
# @ = %40, : = %3A
DATABASE_URL="sqlserver://sa:2221983%40ahmed@95.216.63.80:1433;database=LinkSoft;encrypt=true;trustServerCertificate=true;connectionTimeout=30"

# بيئة الإنتاج
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://springtradingclean.com

# المنفذ (اختياري)
PORT=9002
```

### 2. رفع الملفات إلى الخادم

#### الطريقة الأولى: استخدام SCP/SFTP

```bash
# من جهازك المحلي
scp -r . user@95.216.63.80:/var/www/atm-master-pro
```

#### الطريقة الثانية: استخدام Git

```bash
# على الخادم
cd /var/www
git clone <your-repo-url> atm-master-pro
cd atm-master-pro
```

### 3. تثبيت المتطلبات

```bash
# على الخادم
cd /var/www/atm-master-pro
npm install --production
```

### 4. إعداد قاعدة البيانات

```bash
# توليد Prisma Client
npx prisma generate

# دفع Schema إلى قاعدة البيانات
npx prisma db push
```

### 5. بناء المشروع

```bash
npm run build
```

### 6. تشغيل الخادم

#### الطريقة الأولى: استخدام PM2 (موصى به)

```bash
# تثبيت PM2
npm install -g pm2

# تشغيل التطبيق
pm2 start npm --name "atm-master-pro" -- start

# حفظ الإعدادات
pm2 save

# إعداد PM2 للبدء تلقائياً
pm2 startup
```

#### الطريقة الثانية: استخدام systemd

أنشئ ملف `/etc/systemd/system/atm-master-pro.service`:

```ini
[Unit]
Description=ATM Master Pro Next.js App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/atm-master-pro
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

ثم:

```bash
sudo systemctl daemon-reload
sudo systemctl enable atm-master-pro
sudo systemctl start atm-master-pro
sudo systemctl status atm-master-pro
```

#### الطريقة الثالثة: تشغيل مباشر

```bash
npm start
```

### 7. إعداد Nginx كـ Reverse Proxy (اختياري)

أنشئ ملف `/etc/nginx/sites-available/atm-master-pro`:

```nginx
server {
    listen 80;
    server_name 95.216.63.80;

    location / {
        proxy_pass http://localhost:9002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

ثم:

```bash
sudo ln -s /etc/nginx/sites-available/atm-master-pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. إعداد Firewall

```bash
# فتح المنفذ 9002
sudo ufw allow 9002/tcp

# أو إذا كنت تستخدم Nginx
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## التحقق من النشر

1. افتح المتصفح واذهب إلى: `https://95.216.63.80`
2. يجب أن ترى صفحة تسجيل الدخول
3. سجل دخول باستخدام:
   - البريد: `admin@atmpro.com`
   - كلمة المرور: `admin123`

## تحديث النظام

```bash
# على الخادم
cd /var/www/atm-master-pro

# سحب التحديثات (إذا كنت تستخدم Git)
git pull

# تثبيت المتطلبات الجديدة
npm install --production

# تحديث قاعدة البيانات
npx prisma generate
npx prisma db push

# إعادة بناء المشروع
npm run build

# إعادة تشغيل الخادم
pm2 restart atm-master-pro
# أو
sudo systemctl restart atm-master-pro
```

## استكشاف الأخطاء

### فحص السجلات

```bash
# PM2
pm2 logs atm-master-pro

# systemd
sudo journalctl -u atm-master-pro -f

# Next.js
tail -f .next/server.log
```

### فحص الاتصال بقاعدة البيانات

```bash
# اختبار الاتصال
npx prisma db pull
```

### فحص المنافذ

```bash
# فحص المنفذ 9002
netstat -tulpn | grep 9002
```

## ملاحظات مهمة

1. **الأمان**: تأكد من تغيير كلمة مرور المستخدم الافتراضي بعد أول تسجيل دخول
2. **HTTPS**: يُنصح بإعداد SSL Certificate (Let's Encrypt) لـ HTTPS
3. **النسخ الاحتياطي**: قم بعمل نسخة احتياطية من قاعدة البيانات بانتظام
4. **المراقبة**: راقب استخدام الموارد (CPU, RAM, Disk)

