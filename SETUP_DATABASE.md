# إعداد قاعدة البيانات

## المشكلة الحالية
الخطأ الذي تواجهه يحدث لأن قاعدة البيانات غير متصلة. لا يوجد ملف `.env` مع `DATABASE_URL`.

## خطوات الإعداد

### 1. إنشاء ملف `.env`
أنشئ ملف `.env` في المجلد الرئيسي للمشروع:

```env
# Database Connection
# SQL Server connection string format:
DATABASE_URL="sqlserver://localhost:1433;database=atm_master_pro;user=sa;password=YourPassword123;encrypt=true;trustServerCertificate=true"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-change-this-in-production-use-random-string"
NEXTAUTH_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

### 2. تعديل معلومات الاتصال
غيّر القيم التالية حسب إعدادات SQL Server الخاصة بك:
- `localhost:1433` - عنوان وport الخادم
- `atm_master_pro` - اسم قاعدة البيانات
- `sa` - اسم المستخدم
- `YourPassword123` - كلمة المرور

### 3. إنشاء قاعدة البيانات
إذا لم تكن قاعدة البيانات موجودة، أنشئها باستخدام SQL Server Management Studio أو أي أداة أخرى:

```sql
CREATE DATABASE atm_master_pro;
```

### 4. تشغيل Prisma Migrations
بعد إنشاء ملف `.env`، قم بتشغيل:

```bash
# إنشاء جداول قاعدة البيانات
npx prisma migrate dev

# أو إذا كانت قاعدة البيانات موجودة بالفعل
npx prisma db push

# توليد Prisma Client
npx prisma generate
```

### 5. إضافة بيانات تجريبية (اختياري)
لإضافة بيانات تجريبية للمندوبين والـ ATMs:

```bash
# تثبيت tsx إذا لم يكن مثبتاً
npm install -D tsx

# تشغيل ملف seed
npm run db:seed
```

البيانات التجريبية التي سيتم إضافتها:
- 5 مندوبين
- 5 ماكينات ATM في القاهرة والإسكندرية
- مستخدم تجريبي (admin@example.com)

### 6. إعادة تشغيل التطبيق
بعد إعداد قاعدة البيانات، أعد تشغيل التطبيق:

```bash
npm run dev
```

## التحقق من الاتصال

### طريقة 1: صفحة حالة النظام (الأسهل)
افتح المتصفح واذهب إلى:
- **http://localhost:9002/system-status** - صفحة تفاعلية تعرض حالة قاعدة البيانات والنظام

### طريقة 2: التحقق اليدوي من API
افتح المتصفح واذهب إلى:
- http://localhost:9002/api/health - يعرض حالة النظام بصيغة JSON
- http://localhost:9002/api/representatives - يجب أن ترى array فارغ `[]` أو قائمة المندوبين
- http://localhost:9002/api/work-plans - يجب أن ترى array فارغ `[]` أو قائمة الخطط

## مشاكل شائعة

### 1. خطأ في الاتصال بـ SQL Server
تأكد من:
- SQL Server يعمل
- port 1433 مفتوح
- المستخدم وكلمة المرور صحيحة
- SQL Server authentication مفعل

### 2. خطأ "Invalid object name"
قم بتشغيل:
```bash
npx prisma db push
```

### 3. خطأ "Prisma Client is not generated"
قم بتشغيل:
```bash
npx prisma generate
```

