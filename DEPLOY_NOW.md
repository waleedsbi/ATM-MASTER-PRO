# 🚀 نشر النظام على springtradingclean.com

## معلومات الخادم
- **Hostname**: springtradingclean.com
- **IP**: 95.216.63.80
- **Database**: LinkSoft (على نفس الخادم)

## ⚡ خطوات النشر السريعة

### الخطوة 1: إعداد ملف البيئة على جهازك المحلي

**Windows (PowerShell):**
```powershell
@"
DATABASE_URL="sqlserver://sa:2221983%40ahmed@95.216.63.80:1433;database=LinkSoft;encrypt=true;trustServerCertificate=true;connectionTimeout=30"
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://springtradingclean.com
PORT=9002
"@ | Out-File -Encoding utf8 .env.production
```

**Linux/Mac:**
```bash
cat > .env.production << 'EOF'
DATABASE_URL="sqlserver://sa:2221983%40ahmed@95.216.63.80:1433;database=LinkSoft;encrypt=true;trustServerCertificate=true;connectionTimeout=30"
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://springtradingclean.com
PORT=9002
EOF
```

### الخطوة 2: رفع الملفات إلى الخادم

```bash
# من جهازك المحلي - رفع جميع الملفات
scp -r . root@95.216.63.80:/var/www/atm-master-pro

# أو إذا كان لديك اسم مستخدم مختلف
scp -r . user@springtradingclean.com:/var/www/atm-master-pro
```

### الخطوة 3: على الخادم - إعداد وتشغيل النظام

```bash
# 1. تسجيل الدخول إلى الخادم
ssh root@95.216.63.80
# أو
ssh user@springtradingclean.com

# 2. الانتقال إلى مجلد المشروع
cd /var/www/atm-master-pro

# 3. التأكد من وجود ملف .env.production
cat .env.production

# 4. جعل السكريبتات قابلة للتنفيذ
chmod +x deploy.sh
chmod +x create-env-production.sh

# 5. تشغيل سكريبت النشر
./deploy.sh

# 6. تثبيت PM2 (إذا لم يكن مثبتاً)
npm install -g pm2

# 7. تشغيل التطبيق باستخدام PM2
pm2 start ecosystem.config.js

# 8. حفظ الإعدادات
pm2 save

# 9. إعداد PM2 للبدء تلقائياً
pm2 startup
# ثم شغّل الأمر الذي يظهر لك (مثل: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root)
```

### الخطوة 4: إعداد Nginx (إذا لم يكن مُعداً)

```bash
# نسخ ملف إعدادات Nginx
sudo cp nginx.conf.example /etc/nginx/sites-available/atm-master-pro

# إنشاء رابط رمزي
sudo ln -s /etc/nginx/sites-available/atm-master-pro /etc/nginx/sites-enabled/

# اختبار الإعدادات
sudo nginx -t

# إعادة تحميل Nginx
sudo systemctl reload nginx
```

### الخطوة 5: فتح Firewall (إذا لزم الأمر)

```bash
# فتح المنفذ 9002
sudo ufw allow 9002/tcp

# أو إذا كنت تستخدم Nginx
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## ✅ التحقق من النشر

1. **فحص حالة PM2:**
   ```bash
   pm2 status
   pm2 logs atm-master-pro
   ```

2. **فتح المتصفح:**
   ```
   https://springtradingclean.com
   ```

3. **تسجيل الدخول:**
   - البريد: `admin@atmpro.com`
   - كلمة المرور: `admin123`

## 🔧 استكشاف الأخطاء

### إذا لم يعمل التطبيق:

```bash
# فحص السجلات
pm2 logs atm-master-pro --lines 100

# فحص الاتصال بقاعدة البيانات
cd /var/www/atm-master-pro
npx prisma db pull

# إعادة تشغيل التطبيق
pm2 restart atm-master-pro

# فحص المنافذ
netstat -tulpn | grep 9002
```

### إذا كان Nginx لا يعمل:

```bash
# فحص حالة Nginx
sudo systemctl status nginx

# فحص السجلات
sudo tail -f /var/log/nginx/error.log

# إعادة تشغيل Nginx
sudo systemctl restart nginx
```

## 📝 ملاحظات مهمة

1. **الأمان**: بعد النشر، غيّر كلمة مرور المستخدم الافتراضي
2. **HTTPS**: يُنصح بإعداد SSL Certificate (Let's Encrypt) لـ HTTPS
3. **النسخ الاحتياطي**: قم بعمل نسخة احتياطية من قاعدة البيانات بانتظام
4. **المراقبة**: راقب استخدام الموارد (CPU, RAM, Disk)

## 🎯 الخطوات التالية بعد النشر

1. ✅ تغيير كلمة مرور المستخدم الافتراضي
2. ✅ إعداد SSL Certificate للـ HTTPS
3. ✅ إعداد النسخ الاحتياطي التلقائي
4. ✅ إعداد المراقبة والتنبيهات

---

**جاهز للنشر الآن! 🚀**

