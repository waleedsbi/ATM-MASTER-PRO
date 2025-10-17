# أمثلة على استخدام نظام متابعة العملاء

## مثال 1: سيناريو كامل لمتابعة تقرير صيانة

### الخطوة 1: العميل يراجع التقرير
```typescript
// العميل يفتح التقرير ويشاهد الصور
// يلاحظ مشكلة في صورة قبل العمل
```

### الخطوة 2: العميل يضيف تعليق على صورة معينة
```typescript
// في صفحة client-review
// 1. اضغط على زر التعليق على الصورة
// 2. اكتب التعليق
const comment = {
  workPlanId: 123,
  atmCode: "ATM001",
  imageUrl: "https://example.com/image1.jpg",
  imageType: "before",
  commentText: "الصورة غير واضحة، يرجى رفع صورة بجودة أفضل",
  commentBy: "أحمد محمد",
  commentByRole: "client"
}
// 3. اضغط "إضافة تعليق"
```

### الخطوة 3: المراجع يتلقى إشعار
```typescript
// في شريط التطبيق العلوي
// - يظهر رقم 1 على أيقونة الجرس 🔔
// - المراجع يضغط على الجرس
// - يرى: "أحمد محمد علّق على تقرير ATM001"
```

### الخطوة 4: المراجع يفتح التقرير ويرد
```typescript
// المراجع يضغط على "عرض التفاصيل"
// يرى تعليق العميل
// يضغط "رد"
const reply = {
  workPlanId: 123,
  atmCode: "ATM001",
  commentText: "شكراً على الملاحظة. تم رفع صورة جديدة بجودة أعلى. يرجى المراجعة.",
  commentBy: "محمد علي - مراجع",
  commentByRole: "reviewer",
  parentCommentId: 1 // معرف تعليق العميل
}
```

### الخطوة 5: العميل يتلقى رد
```typescript
// العميل يتلقى إشعار بالرد الجديد
// يفتح التقرير ويرى:
// 
// [عميل] أحمد محمد - منذ ساعة
// "الصورة غير واضحة..."
//   └─ [مراجع] محمد علي - منذ 30 دقيقة
//      "شكراً على الملاحظة. تم رفع صورة..."
```

### الخطوة 6: إغلاق التعليق
```typescript
// بعد مراجعة الصورة الجديدة
// العميل أو المراجع يغير حالة التعليق إلى "resolved"
PUT /api/client-comments
{
  id: 1,
  status: "resolved"
}
```

## مثال 2: استخدام API مباشرة

### جلب جميع التعليقات لمكينة معينة
```typescript
async function fetchCommentsForATM(workPlanId: number, atmCode: string) {
  const response = await fetch(
    `/api/client-comments?workPlanId=${workPlanId}&atmCode=${atmCode}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }
  
  const comments = await response.json();
  return comments;
}

// استخدام
const comments = await fetchCommentsForATM(123, "ATM001");
console.log(`عدد التعليقات: ${comments.length}`);
```

### إضافة تعليق جديد
```typescript
async function addComment(commentData: {
  workPlanId: number;
  atmCode: string;
  commentText: string;
  commentBy: string;
  commentByRole: 'client' | 'reviewer';
  imageUrl?: string;
  imageType?: 'before' | 'after';
}) {
  const response = await fetch('/api/client-comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(commentData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add comment');
  }
  
  const newComment = await response.json();
  return newComment;
}

// استخدام
const comment = await addComment({
  workPlanId: 123,
  atmCode: "ATM001",
  commentText: "العمل ممتاز، شكراً للفريق",
  commentBy: "سارة أحمد",
  commentByRole: "client"
});
```

### إضافة رد على تعليق
```typescript
async function replyToComment(
  parentCommentId: number,
  replyData: {
    workPlanId: number;
    atmCode: string;
    commentText: string;
    commentBy: string;
    commentByRole: 'client' | 'reviewer';
  }
) {
  const response = await fetch('/api/client-comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...replyData,
      parentCommentId
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add reply');
  }
  
  return await response.json();
}

// استخدام
const reply = await replyToComment(1, {
  workPlanId: 123,
  atmCode: "ATM001",
  commentText: "شكراً لكم على الملاحظة",
  commentBy: "فريق الدعم",
  commentByRole: "reviewer"
});
```

### تحديث حالة التعليق
```typescript
async function updateCommentStatus(
  commentId: number,
  status: 'open' | 'resolved' | 'pending'
) {
  const response = await fetch('/api/client-comments', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: commentId,
      status
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update comment');
  }
  
  return await response.json();
}

// استخدام
await updateCommentStatus(1, 'resolved');
console.log('تم تحديث حالة التعليق إلى: تم الحل');
```

### وضع علامة مقروء على التعليقات
```typescript
async function markCommentsAsRead(commentIds: number[]) {
  const response = await fetch('/api/client-comments', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: commentIds[0], // لتحديث تعليق واحد
      isRead: true
    }),
  });
  
  return await response.json();
}

// أو باستخدام API الإشعارات لتحديث عدة تعليقات
async function markMultipleAsRead(commentIds: number[]) {
  const response = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commentIds }),
  });
  
  return await response.json();
}
```

### حذف تعليق
```typescript
async function deleteComment(commentId: number) {
  const response = await fetch(
    `/api/client-comments?id=${commentId}`,
    { method: 'DELETE' }
  );
  
  if (!response.ok) {
    throw new Error('Failed to delete comment');
  }
  
  return await response.json();
}

// استخدام
await deleteComment(1);
console.log('تم حذف التعليق');
```

## مثال 3: استخدام مكون الإشعارات

### في مكون React
```typescript
import { NotificationBell } from '@/components/notifications-bell';

function MyComponent() {
  return (
    <div>
      {/* للعملاء */}
      <NotificationBell userRole="client" />
      
      {/* للمراجعين */}
      <NotificationBell userRole="reviewer" />
    </div>
  );
}
```

### جلب الإشعارات يدوياً
```typescript
async function getNotifications(userRole: 'client' | 'reviewer') {
  const response = await fetch(`/api/notifications?userRole=${userRole}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  
  const data = await response.json();
  console.log(`عدد الإشعارات غير المقروءة: ${data.unreadCount}`);
  console.log('آخر التعليقات:', data.recentComments);
  
  return data;
}

// استخدام
const notifications = await getNotifications('client');
```

## مثال 4: سيناريو متعدد المراحل

```typescript
// سيناريو: متابعة مشكلة في مكينة من البداية للنهاية

// 1. العميل يفتح تقرير ويضيف ملاحظة
const initialComment = await addComment({
  workPlanId: 456,
  atmCode: "ATM999",
  commentText: "المكينة لا تعمل بشكل صحيح بعد الصيانة",
  commentBy: "إدارة البنك",
  commentByRole: "client"
});
console.log('تم إضافة التعليق:', initialComment.id);

// 2. المراجع يستلم الإشعار ويرد
const firstReply = await replyToComment(initialComment.id, {
  workPlanId: 456,
  atmCode: "ATM999",
  commentText: "شكراً على الإبلاغ. ما هي المشكلة بالتحديد؟",
  commentBy: "فريق الدعم الفني",
  commentByRole: "reviewer"
});

// 3. العميل يوضح المشكلة
const secondComment = await replyToComment(initialComment.id, {
  workPlanId: 456,
  atmCode: "ATM999",
  commentText: "الشاشة لا تعرض الخيارات بشكل صحيح",
  commentBy: "إدارة البنك",
  commentByRole: "client"
});

// 4. المراجع يحدث الحالة إلى "قيد المعالجة"
await updateCommentStatus(initialComment.id, 'pending');

// 5. المراجع يرد بخطة الحل
const solutionReply = await replyToComment(initialComment.id, {
  workPlanId: 456,
  atmCode: "ATM999",
  commentText: "سيتم إرسال فني للموقع غداً صباحاً لفحص الشاشة",
  commentBy: "فريق الدعم الفني",
  commentByRole: "reviewer"
});

// 6. بعد الإصلاح - المراجع يغلق التعليق
await updateCommentStatus(initialComment.id, 'resolved');

// 7. جلب جميع التعليقات للمراجعة
const allComments = await fetchCommentsForATM(456, "ATM999");
console.log('سجل المحادثة الكامل:', allComments);
```

## مثال 5: إحصائيات وتقارير

```typescript
// جلب جميع التعليقات المفتوحة
async function getOpenComments() {
  const response = await fetch('/api/client-comments');
  const allComments = await response.json();
  
  const openComments = allComments.filter(
    (c: any) => c.status === 'open'
  );
  
  return openComments;
}

// حساب متوسط وقت الرد
async function calculateAverageResponseTime() {
  const response = await fetch('/api/client-comments');
  const allComments = await response.json();
  
  let totalTime = 0;
  let count = 0;
  
  allComments.forEach((comment: any) => {
    if (comment.replies && comment.replies.length > 0) {
      const commentTime = new Date(comment.createdAt).getTime();
      const replyTime = new Date(comment.replies[0].createdAt).getTime();
      totalTime += replyTime - commentTime;
      count++;
    }
  });
  
  const averageHours = (totalTime / count) / (1000 * 60 * 60);
  console.log(`متوسط وقت الرد: ${averageHours.toFixed(2)} ساعة`);
  
  return averageHours;
}

// إحصائيات حسب نوع المستخدم
async function getStatsByRole() {
  const response = await fetch('/api/client-comments');
  const allComments = await response.json();
  
  const stats = {
    client: 0,
    reviewer: 0,
    total: 0
  };
  
  function countComments(comments: any[]) {
    comments.forEach((comment: any) => {
      stats.total++;
      if (comment.commentByRole === 'client') stats.client++;
      if (comment.commentByRole === 'reviewer') stats.reviewer++;
      
      if (comment.replies && comment.replies.length > 0) {
        countComments(comment.replies);
      }
    });
  }
  
  countComments(allComments);
  
  console.log('إحصائيات التعليقات:', stats);
  return stats;
}
```

## الخلاصة

هذه الأمثلة توضح كيفية استخدام نظام متابعة العملاء في سيناريوهات مختلفة. يمكن تطبيق هذه الأمثلة مباشرة أو تعديلها حسب الاحتياجات الخاصة بك.

للمزيد من المعلومات، راجع الملف الرئيسي: `CLIENT_FOLLOW_UP_SYSTEM.md`

