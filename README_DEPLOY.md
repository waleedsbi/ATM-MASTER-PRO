# 🚀 دليل النشر السريع - springtradingclean.com

## معلومات الخادم
- **Domain**: springtradingclean.com
- **IP**: 95.216.63.80
- **Database**: LinkSoft

---

## ⚡ النشر في 5 خطوات

### 1️⃣ إنشاء ملف `.env.production` (على جهازك)

**Windows PowerShell:**
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
./create-env-production.sh
```

### 2️⃣ رفع الملفات إلى الخادم

```bash
scp -r . root@95.216.63.80:/var/www/atm-master-pro
```

### 3️⃣ على الخادم - تشغيل النشر

```bash
ssh root@95.216.63.80
cd /var/www/atm-master-pro
chmod +x deploy.sh
./deploy.sh
```

### 4️⃣ تشغيل التطبيق

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5️⃣ التحقق

افتح: **https://springtradingclean.com**

تسجيل الدخول:
- Email: `admin@atmpro.com`
- Password: `admin123`

---

## 📚 للمزيد من التفاصيل

- **DEPLOY_NOW.md** - دليل شامل خطوة بخطوة
- **DEPLOYMENT.md** - دليل النشر الكامل
- **QUICK_DEPLOY.md** - دليل النشر السريع

---

**جاهز للنشر! 🎉**

