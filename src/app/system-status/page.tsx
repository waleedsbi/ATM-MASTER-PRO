'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, Server, CheckCircle, XCircle } from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  database: 'connected' | 'disconnected';
  data?: {
    representatives: number;
    atms: number;
    workPlans: number;
  };
  error?: string;
  hint?: string;
  timestamp: string;
}

export default function SystemStatusPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to check health:', error);
      setHealth({
        status: 'unhealthy',
        database: 'disconnected',
        error: 'فشل الاتصال بالخادم',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">حالة النظام</h1>
          <p className="text-muted-foreground mt-2">فحص حالة قاعدة البيانات والخوادم</p>
        </div>
        <Button onClick={checkHealth} disabled={loading}>
          <RefreshCw className={`ml-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {loading && !health ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري فحص النظام...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Database Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  قاعدة البيانات
                </CardTitle>
                <Badge variant={health?.database === 'connected' ? 'default' : 'destructive'}>
                  {health?.database === 'connected' ? (
                    <><CheckCircle className="ml-1 h-3 w-3" /> متصل</>
                  ) : (
                    <><XCircle className="ml-1 h-3 w-3" /> غير متصل</>
                  )}
                </Badge>
              </div>
              <CardDescription>
                حالة الاتصال بقاعدة بيانات SQL Server
              </CardDescription>
            </CardHeader>
            <CardContent>
              {health?.database === 'connected' ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المندوبين:</span>
                    <span className="font-medium">{health.data?.representatives || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ماكينات ATM:</span>
                    <span className="font-medium">{health.data?.atms || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">خطط العمل:</span>
                    <span className="font-medium">{health.data?.workPlans || 0}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-destructive text-sm">
                    <strong>الخطأ:</strong> {health?.error || 'غير معروف'}
                  </div>
                  {health?.hint && (
                    <div className="text-sm bg-muted p-3 rounded-md">
                      <strong>الحل:</strong> {health.hint}
                    </div>
                  )}
                  <div className="mt-4 space-y-2 text-sm">
                    <p className="font-medium">الخطوات المطلوبة:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>تأكد من وجود ملف .env</li>
                      <li>تأكد من أن SQL Server يعمل</li>
                      <li>تحقق من DATABASE_URL في ملف .env</li>
                      <li>قم بتشغيل: npx prisma db push</li>
                      <li>قم بتشغيل: npx prisma generate</li>
                    </ol>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Server Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  الخادم
                </CardTitle>
                <Badge variant={health?.status === 'healthy' ? 'default' : 'destructive'}>
                  {health?.status === 'healthy' ? (
                    <><CheckCircle className="ml-1 h-3 w-3" /> يعمل</>
                  ) : (
                    <><XCircle className="ml-1 h-3 w-3" /> لا يعمل</>
                  )}
                </Badge>
              </div>
              <CardDescription>
                حالة خادم التطبيق و API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الحالة العامة:</span>
                  <span className="font-medium">{health?.status || 'غير معروف'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">آخر تحديث:</span>
                  <span className="font-medium text-sm">
                    {health?.timestamp ? new Date(health.timestamp).toLocaleString('ar-EG') : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Setup Instructions */}
      {health?.database === 'disconnected' && (
        <Card className="mt-6 border-destructive">
          <CardHeader>
            <CardTitle>إعداد قاعدة البيانات</CardTitle>
            <CardDescription>
              يبدو أن قاعدة البيانات غير متصلة. اتبع هذه الخطوات للإعداد:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md font-mono text-sm">
              <p className="mb-2">1. أنشئ ملف .env في المجلد الرئيسي:</p>
              <code className="block bg-background p-2 rounded">
                DATABASE_URL="sqlserver://localhost:1433;database=atm_master_pro;user=sa;password=YourPassword123;encrypt=true;trustServerCertificate=true"
              </code>
            </div>
            
            <div className="bg-muted p-4 rounded-md font-mono text-sm">
              <p className="mb-2">2. قم بإنشاء قاعدة البيانات والجداول:</p>
              <code className="block bg-background p-2 rounded">
                npx prisma db push
              </code>
            </div>

            <div className="bg-muted p-4 rounded-md font-mono text-sm">
              <p className="mb-2">3. قم بتوليد Prisma Client:</p>
              <code className="block bg-background p-2 rounded">
                npx prisma generate
              </code>
            </div>

            <div className="bg-muted p-4 rounded-md font-mono text-sm">
              <p className="mb-2">4. (اختياري) أضف بيانات تجريبية:</p>
              <code className="block bg-background p-2 rounded">
                npm install -D tsx<br />
                npm run db:seed
              </code>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

