# 🔴 إصلاح خطأ "Server returned error status: {}"

## المشكلة
إذا رأيت هذا الخطأ عند محاولة إضافة خطة عمل:
```
Error: Server returned error status: {}
```

**السبب:** قاعدة البيانات غير متصلة أو غير مُعدة بشكل صحيح.

---

## ✅ الحل السريع (خطوة بخطوة)

### 1️⃣ تحقق من حالة النظام
افتح في المتصفح:
```
http://localhost:9002/system-status
```

سترى صفحة تخبرك بالضبط ما هي المشكلة.

---

### 2️⃣ إنشاء ملف `.env`

**أ) أنشئ ملف جديد** في المجلد الرئيسي للمشروع واسمه `.env`

**ب) أضف هذا المحتوى:**
```env
DATABASE_URL="sqlserver://localhost:1433;database=atm_master_pro;user=sa;password=YourPassword123;encrypt=true;trustServerCertificate=true"
NEXTAUTH_SECRET="change-this-to-random-string-in-production"
NEXTAUTH_URL="http://localhost:9002"
NODE_ENV="development"
```

**⚠️ هام:** غيّر المعلومات التالية حسب إعداداتك:
- `localhost:1433` → عنوان و port الخادم
- `atm_master_pro` → اسم قاعدة البيانات
- `sa` → اسم المستخدم
- `YourPassword123` → كلمة المرور الحقيقية

---

### 3️⃣ إعداد قاعدة البيانات

افتح Terminal في مجلد المشروع وقم بتشغيل:

```bash
# الخطوة 1: إنشاء الجداول في قاعدة البيانات
npx prisma db push

# الخطوة 2: توليد Prisma Client
npx prisma generate
```

---

### 4️⃣ (اختياري) إضافة بيانات تجريبية

```bash
# تثبيت tsx
npm install -D tsx

# إضافة بيانات تجريبية (5 مندوبين + 5 ماكينات ATM)
npm run db:seed
```

---

### 5️⃣ إعادة تشغيل التطبيق

```bash
# أوقف التطبيق (Ctrl+C) ثم شغله مرة أخرى
npm run dev
```

---

## 🧪 التحقق من نجاح الإعداد

### الطريقة الأولى: صفحة حالة النظام
افتح:
```
http://localhost:9002/system-status
```
يجب أن ترى:
- ✅ قاعدة البيانات: **متصل**
- ✅ الخادم: **يعمل**

### الطريقة الثانية: API مباشرة
افتح:
```
http://localhost:9002/api/health
```
يجب أن ترى:
```json
{
  "status": "healthy",
  "database": "connected",
  "data": {
    "representatives": 5,
    "atms": 5,
    "workPlans": 0
  }
}
```

---

## 🔍 المشاكل الشائعة

### ❌ المشكلة: "Login failed for user"
**الحل:**
- تأكد من أن username و password صحيحين في ملف `.env`
- تأكد من تفعيل SQL Server Authentication

### ❌ المشكلة: "Cannot connect to server"
**الحل:**
- تأكد من أن SQL Server يعمل
- تأكد من Port 1433 مفتوح
- جرّب: `telnet localhost 1433`

### ❌ المشكلة: "Invalid object name 'Representative'"
**الحل:**
```bash
npx prisma db push
```

### ❌ المشكلة: "PrismaClient is unable to run"
**الحل:**
```bash
npx prisma generate
```

---

## 📚 مزيد من المساعدة

راجع ملف `SETUP_DATABASE.md` للحصول على تفاصيل أكثر.

---

## ✅ بعد الإعداد الناجح

الآن يمكنك:
1. ✅ إضافة خطط عمل من الواجهة
2. ✅ اختيار المندوبين من القائمة
3. ✅ اختيار ماكينات ATM
4. ✅ حفظ البيانات في قاعدة البيانات

---

**💡 نصيحة:** احتفظ بصفحة حالة النظام مفتوحة أثناء التطوير للتأكد من أن كل شيء يعمل:
```
http://localhost:9002/system-status
```

