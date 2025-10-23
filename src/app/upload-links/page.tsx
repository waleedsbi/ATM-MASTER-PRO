'use client';

import * as React from 'react';
import { Copy, Check, ExternalLink, Share2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface WorkPlan {
  id: number;
  bankName: string;
  startDate: string;
  endDate: string;
  governorate: string;
  city: string;
  statement: string;
  representativeId: number;
  atmCodes: string;
  status: string;
}

interface Representative {
  id: number;
  name: string;
}

export default function UploadLinksPage() {
  const { toast } = useToast();
  const [workPlans, setWorkPlans] = React.useState<WorkPlan[]>([]);
  const [representatives, setRepresentatives] = React.useState<Representative[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copiedId, setCopiedId] = React.useState<number | null>(null);

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, repsRes] = await Promise.all([
        fetch('/api/work-plans'),
        fetch('/api/representatives'),
      ]);

      const plans = await plansRes.json();
      const reps = await repsRes.json();

      setWorkPlans(plans);
      setRepresentatives(reps);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "خطأ",
        description: "فشل تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUploadLink = (workPlanId: number) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/mobile-upload?workPlanId=${workPlanId}`;
    }
    return '';
  };

  const copyToClipboard = async (workPlanId: number) => {
    const link = getUploadLink(workPlanId);
    try {
      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        setCopiedId(workPlanId);
        toast({
          title: "تم النسخ ✓",
          description: "تم نسخ الرابط إلى الحافظة",
        });
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل نسخ الرابط",
        variant: "destructive",
      });
    }
  };

  const shareLink = async (workPlanId: number, plan: WorkPlan) => {
    const link = getUploadLink(workPlanId);
    const text = `رابط رفع صور الزيارة\n\nالبنك: ${plan.bankName}\nالمحافظة: ${plan.governorate} - ${plan.city}\nالبيان: ${plan.statement}\n\nالرابط:\n${link}`;

    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'رابط رفع صور الزيارة',
          text: text,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else if (typeof window !== 'undefined') {
      // Fallback: Open WhatsApp Web
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const openLink = (workPlanId: number) => {
    const link = getUploadLink(workPlanId);
    if (typeof window !== 'undefined') {
      window.open(link, '_blank');
    }
  };

  const getRepresentativeName = (representativeId: number) => {
    const rep = representatives.find(r => r.id === representativeId);
    return rep?.name || 'غير معروف';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      pending: { label: 'قيد الانتظار', variant: 'secondary' },
      completed: { label: 'مكتملة', variant: 'default' },
      rejected: { label: 'مرفوضة', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">روابط رفع الصور</h1>
        <p className="text-gray-600 dark:text-gray-400">
          قم بنسخ أو مشاركة روابط رفع الصور للمندوبين عبر واتساب
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>خطط العمل</CardTitle>
          <CardDescription>
            اضغط على زر "نسخ الرابط" لنسخه، أو "مشاركة" لإرساله عبر واتساب
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>البنك</TableHead>
                  <TableHead>الموقع</TableHead>
                  <TableHead>البيان</TableHead>
                  <TableHead>المندوب</TableHead>
                  <TableHead>الماكينات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      لا توجد خطط عمل متاحة
                    </TableCell>
                  </TableRow>
                ) : (
                  workPlans.map((plan) => {
                    let atmCodes: string[] = [];
                    try {
                      atmCodes = JSON.parse(plan.atmCodes || '[]');
                    } catch (e) {
                      console.error('Error parsing atmCodes:', e);
                    }

                    return (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.bankName}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{plan.governorate}</div>
                            <div className="text-gray-500">{plan.city}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{plan.statement}</TableCell>
                        <TableCell>{getRepresentativeName(plan.representativeId)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{atmCodes.length} ماكينة</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(plan.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(plan.id)}
                              className="gap-1"
                            >
                              {copiedId === plan.id ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  تم النسخ
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4" />
                                  نسخ
                                </>
                              )}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => shareLink(plan.id, plan)}
                              className="gap-1"
                            >
                              <Share2 className="h-4 w-4" />
                              مشاركة
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openLink(plan.id)}
                              className="gap-1"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            كيفية الاستخدام
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-blue-200 space-y-2">
          <ol className="list-decimal list-inside space-y-2">
            <li>اضغط على زر "نسخ" لنسخ الرابط إلى الحافظة</li>
            <li>أرسل الرابط للمندوب عبر واتساب أو أي تطبيق مراسلة</li>
            <li>سيفتح المندوب الرابط من موبايله</li>
            <li>يختار الماكينة ويلتقط/يرفع الصور مباشرة</li>
            <li>الصور تُحفظ تلقائياً في النظام</li>
          </ol>
          <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-md">
            <p className="text-sm font-semibold mb-1">💡 نصيحة:</p>
            <p className="text-sm">
              استخدم زر "مشاركة" لإرسال الرابط مباشرة عبر واتساب مع جميع تفاصيل الخطة
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

