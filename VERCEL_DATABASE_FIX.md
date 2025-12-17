# 🔧 إصلاح مشكلة الاتصال بقاعدة البيانات على Vercel

## 🔍 المشكلة

عند النشر على Vercel، لا يمكن الاتصال بقاعدة البيانات SQL Server.

## ✅ الحلول

### الحل 1: إضافة متغيرات البيئة في Vercel (الأهم!)

#### الخطوة 1: الوصول إلى إعدادات Vercel

1. اذهب إلى: https://vercel.com/dashboard
2. اختر مشروعك: **atm-master-pro**
3. اضغط على **Settings** (الإعدادات)
4. اضغط على **Environment Variables** (متغيرات البيئة)

#### الخطوة 2: إضافة المتغيرات التالية

**⚠️ مهم:** لكل متغير، اختر **All** environments (Production, Preview, Development)

---

#### المتغير 1: DATABASE_URL

**Name:**
```
DATABASE_URL
```

**Value:**
```
sqlserver://sa:2221983%40ahmed@95.216.63.80:1433;database=LinkSoft;encrypt=true;trustServerCertificate=true;connectionTimeout=30
```

**Environments:** ✅ Production ✅ Preview ✅ Development

**ملاحظات:**
- `%40` هو ترميز URL للرمز `@` في كلمة المرور
- `encrypt=true` مطلوب للاتصال الآمن
- `trustServerCertificate=true` لتجنب مشاكل SSL

---

#### المتغير 2: NEXTAUTH_SECRET

**Name:**
```
NEXTAUTH_SECRET
```

**Value:**
```
7Cxf9UbdVoOEo6m7tGLX3NzYZtTrNdlTOLN9IWg7dOo=
```

**Environments:** ✅ Production ✅ Preview ✅ Development

**ملاحظة:** هذا هو المفتاح الذي تم توليده تلقائياً. يمكنك توليد مفتاح جديد باستخدام:
```bash
npm run generate:secret
```

---

#### المتغير 3: NEXTAUTH_URL

**Name:**
```
NEXTAUTH_URL
```

**Value:**
```
https://atm-master-pro.vercel.app
```

**Environments:** ✅ Production فقط

**ملاحظة:** استبدل `atm-master-pro.vercel.app` بعنوان Vercel الخاص بك.

---

#### المتغير 4: NODE_ENV

**Name:**
```
NODE_ENV
```

**Value:**
```
production
```

**Environments:** ✅ Production فقط

---

#### المتغير 5: NEXT_PUBLIC_APP_URL (اختياري)

**Name:**
```
NEXT_PUBLIC_APP_URL
```

**Value:**
```
https://atm-master-pro.vercel.app
```

**Environments:** ✅ Production فقط

---

### الحل 2: التحقق من إعدادات Firewall

SQL Server يجب أن يسمح بالاتصالات من Vercel. Vercel يستخدم IP addresses ديناميكية، لذلك:

#### الخيار 1: السماح لجميع IPs (للتطوير فقط - غير آمن للإنتاج)

```sql
-- في SQL Server Management Studio
EXEC sp_set_firewall_rule N'AllowVercel', '0.0.0.0', '255.255.255.255';
```

#### الخيار 2: استخدام Vercel IP Ranges (موصى به)

Vercel يستخدم IP ranges محددة. يمكنك إضافة هذه الـ IPs في firewall:

1. اذهب إلى: https://vercel.com/docs/security/deployment-protection#ip-ranges
2. احصل على IP ranges الحالية
3. أضفها في SQL Server firewall

---

### الحل 3: استخدام Connection Pooling

إذا استمرت المشكلة، يمكنك استخدام connection pooling:

#### تحديث DATABASE_URL:

```
sqlserver://sa:2221983%40ahmed@95.216.63.80:1433;database=LinkSoft;encrypt=true;trustServerCertificate=true;connectionTimeout=30;pooling=true;maxPoolSize=10
```

---

### الحل 4: إعادة النشر بعد إضافة المتغيرات

بعد إضافة جميع المتغيرات:

1. اذهب إلى **Deployments** tab
2. ابحث عن آخر deployment
3. اضغط على **⋮** (ثلاث نقاط)
4. اضغط على **Redeploy**
5. تأكد من اختيار **Use existing Build Cache** = ❌ (لإعادة البناء من الصفر)

---

## 🔍 التحقق من الحل

### 1. التحقق من Build Logs

1. اذهب إلى **Deployments** tab
2. اضغط على آخر deployment
3. تحقق من **Build Logs**:
   - يجب أن ترى: `✔ Generated Prisma Client`
   - يجب ألا ترى أخطاء في الاتصال بقاعدة البيانات

### 2. التحقق من Runtime Logs

1. اذهب إلى **Deployments** tab
2. اضغط على آخر deployment
3. اضغط على **Runtime Logs**
4. تحقق من عدم وجود أخطاء مثل:
   - `Can't reach database server`
   - `Connection timeout`
   - `Authentication failed`

### 3. اختبار التطبيق

1. افتح: https://atm-master-pro.vercel.app
2. جرب تسجيل الدخول
3. تحقق من أن الصفحات تعمل بدون أخطاء 500

---

## 🐛 استكشاف الأخطاء

### خطأ: "Can't reach database server"

**السبب:** Firewall يمنع الاتصال من Vercel

**الحل:**
1. تحقق من إعدادات firewall في SQL Server
2. أضف Vercel IP ranges
3. أو استخدم VPN/Proxy server

---

### خطأ: "Authentication failed"

**السبب:** كلمة المرور أو اسم المستخدم غير صحيح

**الحل:**
1. تحقق من `DATABASE_URL` في Vercel Environment Variables
2. تأكد من ترميز `@` كـ `%40`
3. تأكد من عدم وجود مسافات إضافية

---

### خطأ: "Connection timeout"

**السبب:** قاعدة البيانات غير متاحة أو firewall يمنع الاتصال

**الحل:**
1. تحقق من أن SQL Server يعمل
2. تحقق من إعدادات firewall
3. جرب زيادة `connectionTimeout` في `DATABASE_URL`

---

### خطأ: "Prisma Client not generated"

**السبب:** `postinstall` script لم يعمل

**الحل:**
1. تحقق من `package.json` يحتوي على:
   ```json
   "postinstall": "prisma generate"
   ```
2. أعد النشر بدون build cache

---

## 📋 قائمة التحقق النهائية

- [ ] ✅ تم إضافة `DATABASE_URL` في Vercel
- [ ] ✅ تم إضافة `NEXTAUTH_SECRET` في Vercel
- [ ] ✅ تم إضافة `NEXTAUTH_URL` في Vercel
- [ ] ✅ تم إضافة `NODE_ENV` في Vercel
- [ ] ✅ تم إعادة النشر بعد إضافة المتغيرات
- [ ] ✅ Build logs تظهر نجاح البناء
- [ ] ✅ Runtime logs لا تظهر أخطاء قاعدة البيانات
- [ ] ✅ التطبيق يعمل بدون أخطاء 500

---

## 🔗 روابط مفيدة

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel IP Ranges](https://vercel.com/docs/security/deployment-protection#ip-ranges)
- [Prisma SQL Server Connection](https://www.prisma.io/docs/concepts/database-connectors/sql-server)

---

## 📞 الدعم

إذا استمرت المشكلة:
1. تحقق من Runtime Logs في Vercel
2. تحقق من Build Logs
3. تحقق من إعدادات SQL Server firewall
4. راجع `DATABASE_ERROR_HELP.md` للمزيد من الحلول

