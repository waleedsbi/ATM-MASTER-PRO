'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FixResult {
  step: string;
  action: string;
  success: boolean;
  message?: string;
  data?: any;
}

interface FixResponse {
  success: boolean;
  message: string;
  results?: FixResult[];
  finalCheck?: {
    step: string;
    action: string;
    success: boolean;
    columns?: any[];
  };
  errors?: any[];
  summary?: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
  };
}

export default function FixEncodingPage() {
  const { toast } = useToast();
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<FixResponse | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);

  // فحص الترميز الحالي
  const checkEncoding = React.useCallback(async () => {
    try {
      setIsChecking(true);
      const response = await fetch('/api/database/check-encoding');
      const data = await response.json();
      setCheckResult(data);
    } catch (error) {
      console.error('Error checking encoding:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل فحص الترميز',
      });
    } finally {
      setIsChecking(false);
    }
  }, [toast]);

  // إصلاح الترميز
  const fixEncoding = React.useCallback(async () => {
    if (!confirm('هل أنت متأكد من إصلاح الترميز؟ سيتم تعديل بنية الجداول.')) {
      return;
    }

    try {
      setIsFixing(true);
      setResult(null);

      const response = await fetch('/api/database/fix-encoding-after-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data: FixResponse = await response.json();
      setResult(data);

      if (data.success) {
        toast({
          title: 'نجح الإصلاح!',
          description: data.message,
        });
        // إعادة فحص الترميز بعد الإصلاح
        setTimeout(() => {
          checkEncoding();
        }, 1000);
      } else {
        toast({
          variant: 'destructive',
          title: 'فشل الإصلاح',
          description: data.message || 'حدث خطأ أثناء إصلاح الترميز',
        });
      }
    } catch (error) {
      console.error('Error fixing encoding:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل إصلاح الترميز',
      });
    } finally {
      setIsFixing(false);
    }
  }, [toast, checkEncoding]);

  // فحص الترميز عند تحميل الصفحة
  React.useEffect(() => {
    checkEncoding();
  }, [checkEncoding]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            إصلاح الترميز العربي
          </h2>
          <p className="text-muted-foreground">
            إصلاح مشكلة الأسماء العربية بعد استعادة النسخة الاحتياطية
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={checkEncoding} variant="outline" disabled={isChecking}>
            <RefreshCw className={`ml-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            فحص الترميز
          </Button>
          <Button onClick={fixEncoding} disabled={isFixing || isChecking}>
            {isFixing ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإصلاح...
              </>
            ) : (
              <>
                <CheckCircle className="ml-2 h-4 w-4" />
                إصلاح الترميز
              </>
            )}
          </Button>
        </div>
      </div>

      {/* نتائج الفحص */}
      {checkResult && (
        <Card>
          <CardHeader>
            <CardTitle>نتائج فحص الترميز</CardTitle>
            <CardDescription>حالة الترميز الحالية في قاعدة البيانات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {checkResult.databaseCollation && (
              <div>
                <p className="text-sm font-medium mb-2">COLLATION لقاعدة البيانات:</p>
                <Badge variant="outline">
                  {checkResult.databaseCollation.Collation || 'غير محدد'}
                </Badge>
              </div>
            )}

            {checkResult.columnInfo && checkResult.columnInfo.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">حالة الحقول:</p>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {checkResult.columnInfo.map((col: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{col.TABLE_NAME}.{col.COLUMN_NAME}</span>
                          <span className="text-muted-foreground text-sm mr-2">
                            ({col.DATA_TYPE})
                          </span>
                        </div>
                        <Badge
                          variant={
                            col.Status?.includes('✅') ? 'default' :
                            col.Status?.includes('⚠️') ? 'secondary' :
                            'destructive'
                          }
                        >
                          {col.Status || 'غير معروف'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {checkResult.needsFix && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>يحتاج إصلاح</AlertTitle>
                <AlertDescription>
                  تم العثور على حقول تحتاج إصلاح. اضغط على "إصلاح الترميز" لإصلاحها.
                </AlertDescription>
              </Alert>
            )}

            {!checkResult.needsFix && checkResult.columnInfo && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>الترميز صحيح</AlertTitle>
                <AlertDescription>
                  جميع الحقول مضبوطة بشكل صحيح ولا تحتاج إصلاح.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* نتائج الإصلاح */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>
              {result.success ? 'تم الإصلاح بنجاح' : 'فشل الإصلاح'}
            </CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.summary && (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold">{result.summary.totalSteps}</div>
                  <div className="text-sm text-muted-foreground">إجمالي الخطوات</div>
                </div>
                <div className="text-center p-4 border rounded bg-green-50">
                  <div className="text-2xl font-bold text-green-600">
                    {result.summary.successfulSteps}
                  </div>
                  <div className="text-sm text-muted-foreground">نجحت</div>
                </div>
                <div className="text-center p-4 border rounded bg-red-50">
                  <div className="text-2xl font-bold text-red-600">
                    {result.summary.failedSteps}
                  </div>
                  <div className="text-sm text-muted-foreground">فشلت</div>
                </div>
              </div>
            )}

            {result.results && result.results.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">تفاصيل الخطوات:</p>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {result.results.map((step, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 border rounded ${
                          step.success ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <div>
                          <span className="font-medium">{step.action}</span>
                          {step.message && (
                            <span className="text-sm text-muted-foreground mr-2">
                              - {step.message}
                            </span>
                          )}
                        </div>
                        {step.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>أخطاء</AlertTitle>
                <AlertDescription>
                  <ScrollArea className="h-32">
                    <ul className="list-disc list-inside space-y-1">
                      {result.errors.map((error: any, idx: number) => (
                        <li key={idx} className="text-sm">
                          {error.action}: {error.error}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* معلومات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            • هذا الإصلاح يحول الحقول من <code className="bg-muted px-1 rounded">VARCHAR</code> إلى{' '}
            <code className="bg-muted px-1 rounded">NVARCHAR</code> مع{' '}
            <code className="bg-muted px-1 rounded">COLLATE Arabic_CI_AS</code>
          </p>
          <p>
            • إذا كانت البيانات تظهر كعلامات استفهام <code className="bg-muted px-1 rounded">?????</code>،
            فهذا يعني أن البيانات تالفة ولا يمكن استرجاعها تلقائياً
          </p>
          <p>
            • يجب إعادة استيراد البيانات التالفة من ملف Excel/CSV الأصلي
          </p>
          <p>
            • راجع ملف <code className="bg-muted px-1 rounded">FIX_ARABIC_AFTER_BACKUP_RESTORE.md</code> للحلول التفصيلية
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

