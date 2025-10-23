# 🔍 تشخيص مشكلة عدم حفظ الصور في قاعدة البيانات

## 🎯 المشكلة المبلغ عنها
**"لا يتم حفظ الصور في قاعدة البيانات"**

---

## 🔍 التحليل التقني

### ✅ ما يعمل بشكل صحيح:

1. **تحويل الصور إلى Base64** ✅
   - الكود يحول الصور إلى `data:image/jpeg;base64,...` بشكل صحيح
   - يتم حفظها في متغيرات `beforeImages` و `afterImages`

2. **إرسال البيانات للـ API** ✅
   - يتم إرسال البيانات عبر PUT request إلى `/api/work-plans`
   - البيانات تحتوي على `id`, `atmCode`, `beforeImages`, `afterImages`

3. **معالجة البيانات في الـ API** ✅
   - API يستقبل البيانات بشكل صحيح
   - يتم تحديث `atmReports` في قاعدة البيانات

### ❓ المشكلة المحتملة:

**المشكلة قد تكون في أحد هذه الأماكن:**

1. **قاعدة البيانات غير متصلة** - الاتصال بـ PostgreSQL فشل
2. **حجم البيانات كبير جداً** - Base64 للصور الكبيرة قد يتجاوز حد قاعدة البيانات
3. **خطأ في JSON parsing** - البيانات لا تُحفظ بشكل صحيح
4. **مشكلة في التحديث** - البيانات تُحفظ لكن لا تُسترجع بشكل صحيح

---

## 🛠️ الحلول المقترحة

### 1️⃣ **فحص قاعدة البيانات مباشرة**

```sql
-- فحص بيانات atmReports في جدول WorkPlan
SELECT id, atmReports FROM "WorkPlan" WHERE id = [workPlanId];

-- فحص حجم البيانات
SELECT 
  id, 
  LENGTH(atmReports) as data_size,
  atmReports 
FROM "WorkPlan" 
WHERE atmReports IS NOT NULL;
```

### 2️⃣ **إضافة تسجيل مفصل (Logging)**

```typescript
// في API route - إضافة تسجيل مفصل
console.log('=== IMAGE SAVE DEBUG ===');
console.log('WorkPlan ID:', body.id);
console.log('ATM Code:', body.atmCode);
console.log('Before Images Count:', body.beforeImages?.length);
console.log('After Images Count:', body.afterImages?.length);
console.log('First Image Preview:', body.beforeImages?.[0]?.substring(0, 100) + '...');
console.log('Data Size:', JSON.stringify(body).length, 'bytes');
```

### 3️⃣ **فحص حجم البيانات**

```typescript
// إضافة فحص حجم البيانات قبل الحفظ
const dataSize = JSON.stringify(atmReports).length;
console.log('Total data size:', dataSize, 'bytes');

if (dataSize > 1000000) { // 1MB
  console.warn('Large data size detected:', dataSize, 'bytes');
}
```

### 4️⃣ **تحسين معالجة الأخطاء**

```typescript
try {
  const workPlan = await prisma.workPlan.update({
    where: { id: body.id },
    data: updateData
  });
  
  console.log('✅ Successfully saved images for ATM:', body.atmCode);
  console.log('✅ Updated atmReports size:', JSON.stringify(atmReports).length);
  
} catch (error) {
  console.error('❌ Database save failed:', error);
  console.error('❌ Data that failed to save:', updateData);
  throw error;
}
```

---

## 🔧 الإصلاحات المطلوبة

### 1️⃣ **إضافة تسجيل مفصل للـ API**

```typescript
// في src/app/api/work-plans/route.ts
export async function PUT(request: Request) {
  console.log('=== PUT /api/work-plans called ===');
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  // ... existing code ...
  
  if (body.beforeImages !== undefined) {
    atmReports[body.atmCode].beforeImages = body.beforeImages;
    console.log('📸 Updating beforeImages for ATM:', body.atmCode);
    console.log('📸 Before images count:', body.beforeImages.length);
    console.log('📸 First image size:', body.beforeImages[0]?.length || 0, 'chars');
  }
  
  if (body.afterImages !== undefined) {
    atmReports[body.atmCode].afterImages = body.afterImages;
    console.log('📸 Updating afterImages for ATM:', body.atmCode);
    console.log('📸 After images count:', body.afterImages.length);
    console.log('📸 First image size:', body.afterImages[0]?.length || 0, 'chars');
  }
  
  const finalDataSize = JSON.stringify(atmReports).length;
  console.log('💾 Final data size:', finalDataSize, 'bytes');
  
  updateData.atmReports = JSON.stringify(atmReports);
  
  try {
    const workPlan = await prisma.workPlan.update({
      where: { id: body.id },
      data: updateData
    });
    
    console.log('✅ Database update successful');
    console.log('✅ WorkPlan ID:', workPlan.id);
    console.log('✅ ATM Reports size:', workPlan.atmReports?.length || 0);
    
    return NextResponse.json(workPlan);
  } catch (error) {
    console.error('❌ Database update failed:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Data that failed:', updateData);
    
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء حفظ الصور في قاعدة البيانات',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
      dataSize: finalDataSize
    }, { status: 500 });
  }
}
```

### 2️⃣ **إضافة فحص حجم البيانات**

```typescript
// إضافة فحص حجم البيانات
const MAX_DATA_SIZE = 10 * 1024 * 1024; // 10MB

if (finalDataSize > MAX_DATA_SIZE) {
  console.error('❌ Data too large:', finalDataSize, 'bytes');
  return NextResponse.json({ 
    error: 'حجم البيانات كبير جداً',
    details: `الحجم: ${Math.round(finalDataSize / 1024)}KB (الحد الأقصى: ${MAX_DATA_SIZE / 1024 / 1024}MB)`
  }, { status: 413 });
}
```

### 3️⃣ **تحسين معالجة الأخطاء في الواجهة الأمامية**

```typescript
// في src/app/work-plan-report/page.tsx
const handleImagesSave = async (id: string, beforeImages: string[], afterImages: string[]) => {
  try {
    console.log('🔄 Starting image save process...');
    console.log('📸 Before images count:', beforeImages.length);
    console.log('📸 After images count:', afterImages.length);
    
    const report = data.find(r => r.id === id);
    if (!report) {
      throw new Error('Report not found');
    }
    
    const workPlanId = report.workPlanId || parseInt(id.split('-')[0]);
    const atmCode = report.atmCode;
    
    console.log('💾 Saving images for ATM:', atmCode, 'workPlanId:', workPlanId);
    
    const requestData = {
      id: workPlanId,
      atmCode: atmCode,
      beforeImages,
      afterImages,
    };
    
    console.log('📤 Request data size:', JSON.stringify(requestData).length, 'bytes');
    
    const response = await fetch('/api/work-plans', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);
      throw new Error(errorData.error || 'Failed to save images');
    }

    const result = await response.json();
    console.log('✅ API Response:', result);
    
    // Update local state
    setData(currentData => currentData.map(item => 
      item.id === id
        ? { ...item, beforeImages, afterImages } 
        : item
    ));
    
    console.log('✅ Images saved successfully for ATM:', atmCode);
    toast({
      title: "تم الحفظ",
      description: `تم حفظ الصور للماكينة ${atmCode}`,
    });
  } catch (error) {
    console.error('❌ Error saving images:', error);
    toast({
      title: "خطأ",
      description: `حدث خطأ أثناء حفظ الصور: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
      variant: "destructive",
    });
  }
};
```

---

## 🧪 اختبار الحل

### 1️⃣ **اختبار بسيط**
1. ارفع صورة واحدة صغيرة
2. اضغط حفظ
3. تحقق من console logs
4. أعد تحميل الصفحة
5. تحقق من وجود الصورة

### 2️⃣ **اختبار متقدم**
1. ارفع عدة صور كبيرة
2. راقب حجم البيانات في console
3. تحقق من قاعدة البيانات مباشرة
4. اختبر على أجهزة مختلفة

---

## 📊 مؤشرات النجاح

### ✅ **علامات أن المشكلة محلولة:**
- ظهور رسالة "تم الحفظ" بدون أخطاء
- ظهور الصور بعد إعادة تحميل الصفحة
- عدم وجود أخطاء في console
- بيانات `atmReports` تظهر في قاعدة البيانات

### ❌ **علامات أن المشكلة ما زالت موجودة:**
- رسائل خطأ في console
- اختفاء الصور بعد إعادة التحميل
- عدم ظهور بيانات في قاعدة البيانات
- أخطاء في network tab

---

## 🎯 الخطوات التالية

1. **إضافة التسجيل المفصل** - لفهم أين تحدث المشكلة
2. **فحص قاعدة البيانات** - للتأكد من حفظ البيانات
3. **اختبار مع صور مختلفة** - لمعرفة إذا كانت المشكلة متعلقة بالحجم
4. **تحسين معالجة الأخطاء** - لعرض رسائل خطأ واضحة

---

## 💡 نصائح إضافية

### **للمستخدمين:**
- استخدم صور بحجم أقل من 500KB
- تأكد من اتصال الإنترنت المستقر
- تحقق من رسائل الخطأ في console

### **للمطورين:**
- راقب حجم البيانات في قاعدة البيانات
- استخدم compression للصور الكبيرة
- فكر في استخدام file storage منفصل للصور الكبيرة

---

**هل تريد مني تطبيق هذه الإصلاحات الآن؟** 🚀
