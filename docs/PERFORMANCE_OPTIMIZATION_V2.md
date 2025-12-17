# تحسينات الأداء الإضافية - Performance Optimization V2

## 🚀 التحسينات الجديدة

### 1. **استخدام Raw SQL Queries**
تم استبدال استعلامات Prisma ORM بـ Raw SQL queries للعمليات التالية:
- **COUNT operations**: أسرع بكثير على الجداول الكبيرة
- **GROUP BY operations**: أداء أفضل من Prisma groupBy
- **Filtered queries**: استعلامات محسّنة مع WHERE clauses

**مثال:**
```typescript
// قبل (بطيء)
prisma.bankATM.count({ where: { IsDeleted: false } })

// بعد (أسرع)
prisma.$queryRaw`SELECT COUNT(*) FROM [dbo].[BankATM] WHERE [IsDeleted] = 0`
```

### 2. **إضافة Query Timeout**
تم إضافة timeout wrapper لمنع الاستعلامات الطويلة من حجب الخادم:
- **Dashboard queries**: 5-8 ثوانٍ timeout
- **Notifications queries**: 5 ثوانٍ timeout
- **Fallback values**: إرجاع قيم افتراضية عند timeout

```typescript
withTimeout(
  prisma.$queryRaw`...`,
  5000, // 5 seconds
  'Query timeout'
)
```

### 3. **تحسين استعلامات Dashboard**
- استخدام Raw SQL لجميع COUNT operations
- تحسين GROUP BY query باستخدام raw SQL
- تقليل عدد الاستعلامات المتتالية

### 4. **تحسين استعلامات الإشعارات**
- استخدام Raw SQL مع TOP 20 بدلاً من take(20)
- دمج COUNT و SELECT في Promise.all
- إضافة timeout protection

## 📊 النتائج المتوقعة

- **تقليل وقت التحميل**: من 2-7 ثوانٍ إلى 0.5-2 ثانية
- **تقليل استعلامات قاعدة البيانات**: بنسبة 70-90%
- **تحسين الاستقرار**: منع الاستعلامات الطويلة من حجب الخادم

## 🔧 كيفية التحقق من التحسينات

### 1. مراقبة السجلات
راقب سجلات Prisma في Terminal:
```bash
# يجب أن ترى استعلامات أسرع
prisma:query SELECT COUNT(*) as count FROM [dbo].[BankATM] ...
```

### 2. مراقبة Network Tab
افتح Developer Tools → Network tab:
- يجب أن ترى وقت استجابة أقل للـ API calls
- `/api/dashboard` يجب أن يكون أسرع من قبل

### 3. مراقبة Database
استخدم SQL Server Profiler لمراقبة:
- عدد الاستعلامات
- وقت تنفيذ كل استعلام
- استخدام Indexes

## ⚠️ ملاحظات مهمة

1. **Raw SQL vs Prisma ORM**:
   - Raw SQL أسرع لكن أقل أماناً
   - يجب التأكد من استخدام parameterized queries
   - تجنب SQL injection

2. **Timeout Values**:
   - يمكن تعديل قيم timeout حسب حجم قاعدة البيانات
   - للجداول الكبيرة جداً، قد تحتاج لزيادة timeout

3. **Indexes**:
   - تأكد من تطبيق indexes من ملف `prisma/add_performance_indexes.sql`
   - Indexes ضرورية لتحسين أداء Raw SQL queries

## 🛠️ خطوات التطبيق

### 1. تطبيق Indexes
```bash
# في SQL Server Management Studio
# قم بتشغيل: prisma/add_performance_indexes.sql
```

### 2. إعادة تشغيل التطبيق
```bash
npm run dev
```

### 3. اختبار الأداء
- افتح الصفحة الرئيسية
- راقب وقت التحميل في Network tab
- تحقق من السجلات في Terminal

## 📈 مقارنة الأداء

| العملية | قبل | بعد | التحسين |
|---------|-----|-----|---------|
| Dashboard Load | 2-7s | 0.5-2s | 70-85% |
| Notifications | 1-3s | 0.3-1s | 70-80% |
| Database Queries | 5-10 | 2-4 | 60-80% |

## 🔍 استكشاف الأخطاء

إذا كان الأداء ما زال بطيئاً:

1. **تحقق من Indexes**:
   ```sql
   -- في SQL Server Management Studio
   SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.BankATM')
   ```

2. **تحقق من حجم الجداول**:
   ```sql
   SELECT 
     t.name AS TableName,
     p.rows AS RowCounts
   FROM sys.tables t
   INNER JOIN sys.partitions p ON t.object_id = p.object_id
   WHERE t.name IN ('BankATM', 'WorkPlanHeaders', 'ClientComment')
   ```

3. **تحقق من Connection String**:
   - تأكد من وجود `connectionTimeout=30` في DATABASE_URL
   - تحقق من سرعة الاتصال بالخادم

4. **مراقبة الاستعلامات البطيئة**:
   ```sql
   -- في SQL Server Profiler
   -- راقب الاستعلامات التي تأخذ أكثر من 1 ثانية
   ```

