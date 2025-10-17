'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Camera, Upload, Check, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Suspense } from 'react';

interface WorkPlan {
  id: number;
  bankName: string;
  startDate: string;
  endDate: string;
  governorate: string;
  city: string;
  statement: string;
  representativeId: number;
  atmCodes: string[];
  atmReports: Record<string, {
    beforeImages: string[];
    afterImages: string[];
    notes: any[];
    status: string;
  }>;
}

function MobileUploadContent() {
  const searchParams = useSearchParams();
  const workPlanId = searchParams.get('workPlanId');
  const { toast } = useToast();

  const [workPlan, setWorkPlan] = React.useState<WorkPlan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedAtm, setSelectedAtm] = React.useState<string | null>(null);
  const [beforeImages, setBeforeImages] = React.useState<string[]>([]);
  const [afterImages, setAfterImages] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    if (workPlanId) {
      fetchWorkPlan();
    } else {
      setLoading(false);
    }
  }, [workPlanId]);

  const fetchWorkPlan = async () => {
    try {
      const response = await fetch(`/api/work-plans`);
      if (!response.ok) throw new Error('Failed to fetch work plan');
      
      const allPlans = await response.json();
      const plan = allPlans.find((p: any) => p.id === parseInt(workPlanId!));
      
      if (!plan) {
        throw new Error('Work plan not found');
      }

      // Parse JSON strings
      const atmCodes = JSON.parse(plan.atmCodes || '[]');
      const atmReports = JSON.parse(plan.atmReports || '{}');

      setWorkPlan({
        ...plan,
        atmCodes,
        atmReports,
      });

      // Select first ATM by default
      if (atmCodes.length > 0) {
        setSelectedAtm(atmCodes[0]);
        loadAtmImages(atmCodes[0], atmReports);
      }
    } catch (error) {
      console.error('Error fetching work plan:', error);
      toast({
        title: "خطأ",
        description: "فشل تحميل بيانات خطة العمل",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAtmImages = (atmCode: string, reports: any) => {
    const atmData = reports[atmCode] || { beforeImages: [], afterImages: [] };
    setBeforeImages(atmData.beforeImages || []);
    setAfterImages(atmData.afterImages || []);
  };

  const handleAtmSelect = (atmCode: string) => {
    setSelectedAtm(atmCode);
    loadAtmImages(atmCode, workPlan?.atmReports || {});
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Convert files to base64 for permanent storage
      const base64Promises = files.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });
      
      try {
        const base64Images = await Promise.all(base64Promises);
        
        if (type === 'before') {
          setBeforeImages(prev => [...prev, ...base64Images]);
        } else {
          setAfterImages(prev => [...prev, ...base64Images]);
        }
      } catch (error) {
        console.error('Error converting images to base64:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'فشل تحميل الصور. حاول مرة أخرى.',
        });
      }
    }
  };

  const removeImage = (index: number, type: 'before' | 'after') => {
    if (type === 'before') {
      setBeforeImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setAfterImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleUpload = async () => {
    if (!selectedAtm || !workPlan) return;

    setUploading(true);
    try {
      const response = await fetch('/api/work-plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: workPlan.id,
          atmCode: selectedAtm,
          beforeImages,
          afterImages,
        }),
      });

      if (!response.ok) throw new Error('Failed to upload images');

      toast({
        title: "تم الحفظ ✓",
        description: `تم حفظ الصور للماكينة ${selectedAtm} بنجاح`,
      });

      // Reload work plan to get updated data
      await fetchWorkPlan();
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "خطأ",
        description: "فشل حفظ الصور",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!workPlanId || !workPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">⚠️ خطأ</CardTitle>
            <CardDescription className="text-center">
              رابط غير صالح. يرجى استخدام الرابط المرسل لك من النظام.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const selectedAtmData = selectedAtm && workPlan.atmReports[selectedAtm];
  const isCompleted = selectedAtmData?.status === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 pb-20">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              رفع صور الزيارة
            </CardTitle>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <div><strong>البنك:</strong> {workPlan.bankName}</div>
              <div><strong>المحافظة:</strong> {workPlan.governorate} - {workPlan.city}</div>
              <div><strong>البيان:</strong> {workPlan.statement}</div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* ATM Selection */}
      <div className="max-w-2xl mx-auto mb-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">اختر الماكينة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {workPlan.atmCodes.map((atmCode) => {
                const atmData = workPlan.atmReports[atmCode];
                const status = atmData?.status || 'pending';
                const hasImages = (atmData?.beforeImages?.length || 0) > 0 || (atmData?.afterImages?.length || 0) > 0;
                
                return (
                  <Button
                    key={atmCode}
                    variant={selectedAtm === atmCode ? "default" : "outline"}
                    className="h-auto py-3 flex flex-col items-start gap-1"
                    onClick={() => handleAtmSelect(atmCode)}
                  >
                    <span className="font-bold">{atmCode}</span>
                    <div className="flex gap-1">
                      {hasImages && (
                        <Badge variant="secondary" className="text-xs">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          {(atmData?.beforeImages?.length || 0) + (atmData?.afterImages?.length || 0)}
                        </Badge>
                      )}
                      {status === 'completed' && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          مكتملة
                        </Badge>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Upload Section */}
      {selectedAtm && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">صور الماكينة {selectedAtm}</CardTitle>
                {isCompleted && (
                  <Badge variant="default" className="bg-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    مكتملة
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="before" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="before">
                    صور قبل ({beforeImages.length})
                  </TabsTrigger>
                  <TabsTrigger value="after">
                    صور بعد ({afterImages.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="before" className="space-y-4">
                  <div>
                    <input
                      type="file"
                      id="before-upload"
                      className="hidden"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={(e) => handleFileChange(e, 'before')}
                    />
                    <label htmlFor="before-upload">
                      <Button variant="outline" className="w-full" asChild>
                        <span>
                          <Camera className="mr-2 h-4 w-4" />
                          التقط/أضف صور قبل العمل
                        </span>
                      </Button>
                    </label>
                  </div>

                  {beforeImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {beforeImages.map((src, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={src}
                            alt={`قبل ${index + 1}`}
                            width={200}
                            height={200}
                            className="rounded-lg object-cover aspect-square w-full"
                          />
                          <button
                            onClick={() => removeImage(index, 'before')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="after" className="space-y-4">
                  <div>
                    <input
                      type="file"
                      id="after-upload"
                      className="hidden"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={(e) => handleFileChange(e, 'after')}
                    />
                    <label htmlFor="after-upload">
                      <Button variant="outline" className="w-full" asChild>
                        <span>
                          <Camera className="mr-2 h-4 w-4" />
                          التقط/أضف صور بعد العمل
                        </span>
                      </Button>
                    </label>
                  </div>

                  {afterImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {afterImages.map((src, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={src}
                            alt={`بعد ${index + 1}`}
                            width={200}
                            height={200}
                            className="rounded-lg object-cover aspect-square w-full"
                          />
                          <button
                            onClick={() => removeImage(index, 'after')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Save Button */}
      {selectedAtm && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white to-transparent dark:from-gray-900 dark:to-transparent">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleUpload}
              disabled={uploading || (beforeImages.length === 0 && afterImages.length === 0)}
              className="w-full h-14 text-lg font-bold shadow-lg"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  حفظ الصور ({beforeImages.length + afterImages.length})
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MobileUploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <MobileUploadContent />
    </Suspense>
  );
}

