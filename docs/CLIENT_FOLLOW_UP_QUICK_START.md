# نظام متابعة العملاء - دليل البدء السريع

## 🚀 التثبيت والإعداد

### 1. تطبيق التغييرات على قاعدة البيانات

```bash
# تطبيق التغييرات على قاعدة البيانات
npx prisma db push

# أو إنشاء migration جديد
npx prisma migrate dev --name add_client_comments_system
```

### 2. تحديث Prisma Client

```bash
npx prisma generate
```

### 3. التحقق من التثبيت

```bash
# تشغيل الخادم
npm run dev

# زيارة الصفحة
# http://localhost:3000/client-review
```

## 📋 الملفات المضافة/المعدلة

### ملفات جديدة:
- `src/app/api/client-comments/route.ts` - API للتعليقات
- `src/app/api/notifications/route.ts` - API للإشعارات
- `src/components/notifications-bell.tsx` - مكون الإشعارات
- `docs/CLIENT_FOLLOW_UP_SYSTEM.md` - التوثيق الكامل
- `docs/CLIENT_FOLLOW_UP_EXAMPLES.md` - أمثلة الاستخدام
- `prisma/migrations/20251008000000_add_client_comments/migration.sql` - ملف الترحيل

### ملفات معدلة:
- `prisma/schema.prisma` - إضافة جدول ClientComment
- `src/lib/types.ts` - إضافة أنواع TypeScript
- `src/app/client-review/page.tsx` - تحديث كامل للصفحة
- `src/components/layout/app-shell.tsx` - إضافة مكون الإشعارات

## ✨ الميزات الرئيسية

### 1. نظام التعليقات والردود
- ✅ إضافة تعليقات على التقارير
- ✅ التعليق على صور محددة (قبل/بعد العمل)
- ✅ نظام ردود متسلسل
- ✅ تمييز العملاء والمراجعين

### 2. نظام الإشعارات
- ✅ إشعارات فورية للردود الجديدة
- ✅ عداد التعليقات غير المقروءة
- ✅ تحديث تلقائي كل 30 ثانية
- ✅ قائمة آخر 5 تعليقات

### 3. إدارة الحالة
- ✅ حالات التعليق (مفتوح/تم الحل/قيد المعالجة)
- ✅ علامة المقروء/غير المقروء
- ✅ تتبع تاريخ التعليقات

### 4. واجهة مستخدم حديثة
- ✅ تصميم محادثة تفاعلي
- ✅ عرض الصور بالحجم الكامل
- ✅ تكبير وتحريك الصور
- ✅ واجهة سريعة الاستجابة

## 🎯 الاستخدام السريع

### للعملاء:
1. افتح `/client-review`
2. اختر "عميل" من خيارات العرض
3. انقر "عرض التفاصيل" لأي تقرير
4. أضف تعليقاتك أو رد على المراجعين

### للمراجعين:
1. افتح `/client-review`
2. اختر "مراجع" من خيارات العرض
3. راقب أيقونة الجرس 🔔 للإشعارات الجديدة
4. رد على تعليقات العملاء

## 📝 أمثلة سريعة

### إضافة تعليق عبر API:

```typescript
const response = await fetch('/api/client-comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workPlanId: 123,
    atmCode: "ATM001",
    commentText: "ممتاز!",
    commentBy: "أحمد",
    commentByRole: "client"
  })
});
```

### جلب التعليقات:

```typescript
const response = await fetch(
  '/api/client-comments?workPlanId=123&atmCode=ATM001'
);
const comments = await response.json();
```

### جلب الإشعارات:

```typescript
const response = await fetch('/api/notifications?userRole=client');
const { unreadCount, recentComments } = await response.json();
console.log(`لديك ${unreadCount} إشعار جديد`);
```

## 🔧 التخصيص

### تغيير تردد التحديث التلقائي:

في `src/components/notifications-bell.tsx`:
```typescript
// تغيير من 30 ثانية إلى 60 ثانية
const interval = setInterval(fetchNotifications, 60000);
```

### تغيير عدد الإشعارات المعروضة:

في `src/app/api/notifications/route.ts`:
```typescript
// تغيير من 5 إلى 10
take: 10,
```

## 📚 مزيد من المعلومات

- **التوثيق الكامل:** `docs/CLIENT_FOLLOW_UP_SYSTEM.md`
- **أمثلة الاستخدام:** `docs/CLIENT_FOLLOW_UP_EXAMPLES.md`

## 🐛 استكشاف الأخطاء

### المشكلة: التعليقات لا تظهر
**الحل:**
```bash
# تحقق من قاعدة البيانات
npx prisma studio

# أعد إنشاء Prisma Client
npx prisma generate
```

### المشكلة: الإشعارات لا تتحدث
**الحل:**
- تأكد من تشغيل الخادم
- افتح console في المتصفح للتحقق من الأخطاء
- تحقق من اتصال الشبكة

### المشكلة: خطأ في قاعدة البيانات
**الحل:**
```bash
# إعادة تطبيق التغييرات
npx prisma db push --force-reset
# تحذير: سيحذف جميع البيانات!
```

## 🎨 لقطات الشاشة

### صفحة مراجعة العميل
- جدول التقارير مع حالاتها
- نافذة التفاصيل مع الصور
- نظام المحادثة التفاعلي

### نظام الإشعارات
- أيقونة الجرس مع العداد
- قائمة الإشعارات المنبثقة
- تفاصيل كل إشعار

## 🤝 المساهمة

لتحسين النظام:
1. أضف ميزات جديدة
2. أبلغ عن الأخطاء
3. حسّن الأداء
4. وثّق التغييرات

## 📞 الدعم

للحصول على المساعدة:
- راجع التوثيق الكامل
- تحقق من الأمثلة
- اتصل بفريق الدعم الفني

---

**تم إنشاء النظام:** 8 أكتوبر 2025  
**الإصدار:** 1.0.0  
**الحالة:** ✅ جاهز للإنتاج

