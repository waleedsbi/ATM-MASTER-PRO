# نظام إدارة المستخدمين والصلاحيات

## نظرة عامة

تم إنشاء نظام إدارة المستخدمين مع ثلاثة أدوار رئيسية:

### الأدوار المتاحة:

1. **مدير النظام (ADMIN)**
   - لديه كل الصلاحيات
   - يمكن إدارة المستخدمين
   - يمكن إدارة جميع البيانات والعمليات

2. **المراجع (REVIEWER)**
   - صلاحيات تعديل البيانات
   - إضافة الماكينات والمندوبين والمحافظات
   - إنشاء الخطط
   - رفع الصور
   - كل ما يتعلق بالعمليات في النظام
   - **لا يمكن حذف البيانات**
   - **لا يمكن إدارة المستخدمين**

3. **العميل (CLIENT)**
   - صلاحية المراجعة كعميل فقط
   - إضافة ملاحظات على الصور
   - **لا يمكن إضافة أو تعديل أو حذف البيانات**

## الملفات المُنشأة/المُحدّثة:

### 1. قاعدة البيانات
- `prisma/schema.prisma`: تم إضافة نموذج `User` مع الحقول:
  - `id`: معرف فريد
  - `name`: اسم المستخدم
  - `email`: البريد الإلكتروني (فريد)
  - `password`: كلمة المرور (مشفرة)
  - `role`: الدور (ADMIN, REVIEWER, CLIENT)
  - `isActive`: حالة الحساب
  - `createdAt`, `updatedAt`: تواريخ الإنشاء والتحديث

### 2. نظام الصلاحيات
- `src/lib/permissions.ts`: يحتوي على:
  - تعريف الأدوار والصلاحيات
  - دالة `getPermissions()` للحصول على صلاحيات دور معين
  - دالة `hasPermission()` للتحقق من صلاحية محددة

### 3. API Endpoints
- `src/app/api/users/route.ts`: 
  - `GET`: جلب جميع المستخدمين
  - `POST`: إضافة مستخدم جديد
  
- `src/app/api/users/[id]/route.ts`:
  - `GET`: جلب مستخدم محدد
  - `PUT`: تحديث مستخدم
  - `DELETE`: حذف مستخدم

- `src/app/api/auth/login/route.ts`: تسجيل الدخول

### 4. Middleware والتحقق من الصلاحيات
- `src/lib/auth-middleware.ts`: 
  - `getUserFromRequest()`: استخراج معلومات المستخدم من الطلب
  - `checkPermission()`: التحقق من صلاحية
  - `checkAuthAndPermission()`: التحقق من المصادقة والصلاحيات

### 5. Hooks للواجهة
- `src/hooks/use-permissions.ts`:
  - `usePermissions()`: الحصول على صلاحيات المستخدم الحالي
  - `useHasPermission()`: التحقق من صلاحية محددة

### 6. الواجهات
- `src/app/users/page.tsx`: صفحة إدارة المستخدمين (محدثة)
- `src/app/atm-data/page.tsx`: مثال على استخدام الصلاحيات لإخفاء/إظهار الأزرار
- `src/contexts/AuthContext.tsx`: محدث لدعم الأدوار الجديدة

## كيفية الاستخدام:

### 1. إنشاء مستخدم جديد:

```typescript
// في صفحة المستخدمين
// اختر الدور من القائمة المنسدلة:
// - ADMIN: مدير النظام
// - REVIEWER: المراجع
// - CLIENT: العميل
```

### 2. استخدام الصلاحيات في الواجهات:

```typescript
import { useHasPermission } from '@/hooks/use-permissions';

function MyComponent() {
  const canAdd = useHasPermission('canAdd');
  const canEdit = useHasPermission('canEdit');
  const canDelete = useHasPermission('canDelete');
  
  return (
    <>
      {canAdd && <Button>إضافة</Button>}
      {canEdit && <Button>تعديل</Button>}
      {canDelete && <Button>حذف</Button>}
    </>
  );
}
```

### 3. التحقق من الصلاحيات في API Routes:

```typescript
import { checkAuthAndPermission } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  const { user, error } = await checkAuthAndPermission(request, 'canAdd');
  
  if (error) {
    return error; // إرجاع خطأ 401 أو 403
  }
  
  // المستخدم لديه الصلاحية، المتابعة...
}
```

## الصلاحيات المتاحة:

- `canView`: عرض البيانات
- `canAdd`: إضافة بيانات جديدة
- `canEdit`: تعديل البيانات
- `canDelete`: حذف البيانات
- `canManageUsers`: إدارة المستخدمين
- `canManageATMs`: إدارة الماكينات
- `canManageRepresentatives`: إدارة المندوبين
- `canManageGovernorates`: إدارة المحافظات
- `canCreateWorkPlans`: إنشاء خطط العمل
- `canUploadImages`: رفع الصور
- `canReviewAsClient`: المراجعة كعميل
- `canAddComments`: إضافة ملاحظات

## الخطوات التالية:

1. **تشغيل Prisma migrations:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **إنشاء مستخدم مدير افتراضي:**
   - يمكن إنشاء مستخدم من صفحة المستخدمين
   - أو من خلال API مباشرة

3. **تحديث باقي الصفحات:**
   - إضافة استخدام الصلاحيات في صفحات أخرى مثل:
     - `work-plan/page.tsx`
     - `representatives/page.tsx`
     - `client-review/page.tsx`
     - وغيرها

4. **تحديث API Routes:**
   - إضافة التحقق من الصلاحيات في جميع API endpoints

## ملاحظات مهمة:

- كلمات المرور يتم تشفيرها باستخدام bcrypt
- يجب أن يكون المستخدم نشطاً (`isActive: true`) لتسجيل الدخول
- الصلاحيات يتم التحقق منها في كل من الواجهة والـ API
- يمكن تخصيص الصلاحيات لكل دور حسب الحاجة

