'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Upload, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Info,
  Database,
  FileJson,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useHasPermission } from '@/hooks/use-permissions';
import { Checkbox } from '@/components/ui/checkbox';

interface BackupInfo {
  timestamp: string;
  database: string;
  tables: { [key: string]: any };
  summary?: {
    totalTables: number;
    successfulTables: number;
    failedTables: number;
  };
}

export default function DatabaseRestorePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const canManageDB = useHasPermission('canManageDatabase'); // Only ADMIN
  
  const [backupFile, setBackupFile] = React.useState<File | null>(null);
  const [backupInfo, setBackupInfo] = React.useState<BackupInfo | null>(null);
  const [selectedTables, setSelectedTables] = React.useState<string[]>([]);
  const [restoreMode, setRestoreMode] = React.useState<'merge' | 'replace' | 'upsert'>('upsert');
  const [isLoading, setIsLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [currentStep, setCurrentStep] = React.useState<'upload' | 'preview' | 'restore' | 'complete'>('upload');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Check permissions
  React.useEffect(() => {
    if (user && !canManageDB) {
      toast({
        variant: 'destructive',
        title: 'غير مصرح',
        description: 'ليس لديك صلاحية الوصول لاستعادة قاعدة البيانات',
      });
      router.push('/');
    }
  }, [user, canManageDB, router, toast]);

  // Handle file selection
  const handleFileSelect = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى اختيار ملف JSON',
      });
      return;
    }

    try {
      setIsLoading(true);
      setProgress(10);
      
      // Read and parse file
      const text = await file.text();
      setProgress(30);
      
      const backup = JSON.parse(text);
      setProgress(50);
      
      // Validate structure
      if (!backup.tables || typeof backup.tables !== 'object') {
        throw new Error('صيغة النسخة الاحتياطية غير صالحة');
      }

      setBackupFile(file);
      setBackupInfo(backup);
      
      // Select all tables by default
      const tableNames = Object.keys(backup.tables).filter(
        name => backup.tables[name].data && !backup.tables[name].error
      );
      setSelectedTables(tableNames);
      
      setProgress(100);
      setCurrentStep('preview');
      
      toast({
        title: 'تم تحميل الملف',
        description: `تم العثور على ${tableNames.length} جدول`,
      });
    } catch (error) {
      console.error('Error reading backup file:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل قراءة الملف',
      });
      setBackupFile(null);
      setBackupInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Handle restore
  const handleRestore = React.useCallback(async () => {
    if (!backupFile || selectedTables.length === 0) return;

    try {
      setIsLoading(true);
      setCurrentStep('restore');
      setProgress(0);

      const formData = new FormData();
      formData.append('file', backupFile);
      formData.append('mode', restoreMode);
      formData.append('tables', JSON.stringify(selectedTables));

      setProgress(20);

      const response = await fetch('/api/database/restore', {
        method: 'POST',
        body: formData,
      });

      setProgress(80);

      const result = await response.json();

      if (response.ok) {
        setProgress(100);
        setCurrentStep('complete');
        
        toast({
          title: 'تمت الاستعادة بنجاح',
          description: result.message || `تم استعادة ${result.successfulTables} جدول (${result.insertedRows} صف)`,
        });
      } else {
        throw new Error(result.error || 'فشلت الاستعادة');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل استعادة النسخة الاحتياطية',
      });
      setCurrentStep('preview');
    } finally {
      setIsLoading(false);
    }
  }, [backupFile, selectedTables, restoreMode, toast]);

  // Toggle table selection
  const toggleTable = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  // Select/Deselect all tables
  const toggleAllTables = () => {
    if (!backupInfo) return;
    
    const allTables = Object.keys(backupInfo.tables).filter(
      name => backupInfo.tables[name].data && !backupInfo.tables[name].error
    );
    
    if (selectedTables.length === allTables.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(allTables);
    }
  };

  // Reset to start
  const resetProcess = React.useCallback(() => {
    setBackupFile(null);
    setBackupInfo(null);
    setSelectedTables([]);
    setCurrentStep('upload');
    setProgress(0);
  }, []);

  if (!canManageDB) {
    return (
      <div className="flex-1 p-8">
        <Card>
          <CardHeader>
            <CardTitle>غير مصرح</CardTitle>
            <CardDescription>ليس لديك صلاحية الوصول لاستعادة قاعدة البيانات</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            استعادة النسخة الاحتياطية
          </h2>
          <p className="text-muted-foreground">
            استعادة البيانات من ملف نسخة احتياطية سابقة
          </p>
        </div>
        {currentStep !== 'upload' && (
          <Button onClick={resetProcess} variant="outline">
            <RefreshCw className="ml-2 h-4 w-4" />
            بداية جديدة
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-2 ${currentStep === 'upload' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${currentStep === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <span className="text-sm font-medium">رفع الملف</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${currentStep === 'preview' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${currentStep === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <span className="text-sm font-medium">معاينة واختيار</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${currentStep === 'restore' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${currentStep === 'restore' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                3
              </div>
              <span className="text-sm font-medium">الاستعادة</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${currentStep === 'complete' ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">اكتمل</span>
            </div>
          </div>
          {isLoading && <Progress value={progress} className="w-full" />}
        </CardContent>
      </Card>

      {/* Step 1: Upload File */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>الخطوة 1: رفع ملف النسخة الاحتياطية</CardTitle>
            <CardDescription>
              اختر ملف JSON الذي يحتوي على النسخة الاحتياطية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileJson className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                <Upload className="ml-2 h-4 w-4" />
                اختر ملف النسخة الاحتياطية
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                يجب أن يكون الملف بصيغة JSON
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-2">نصائح مهمة:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>تأكد من أن الملف تم إنشاؤه من نفس النظام</li>
                    <li>يُنصح بإنشاء نسخة احتياطية من البيانات الحالية أولاً</li>
                    <li>قد تستغرق العملية عدة دقائق للملفات الكبيرة</li>
                    <li>لا تغلق المتصفح أثناء عملية الاستعادة</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview and Select Tables */}
      {currentStep === 'preview' && backupInfo && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الخطوة 2: معاينة واختيار الجداول</CardTitle>
              <CardDescription>
                اختر الجداول التي تريد استعادتها
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Backup Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">تاريخ النسخة</p>
                  <p className="text-sm font-medium">
                    {new Date(backupInfo.timestamp).toLocaleString('ar-EG')}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">قاعدة البيانات</p>
                  <p className="text-sm font-medium">{backupInfo.database}</p>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">عدد الجداول</p>
                  <p className="text-sm font-medium">
                    {Object.keys(backupInfo.tables).length} جدول
                  </p>
                </div>
              </div>

              {/* Restore Mode */}
              <div>
                <Label htmlFor="restore-mode">وضع الاستعادة</Label>
                <Select value={restoreMode} onValueChange={(v: any) => setRestoreMode(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upsert">تحديث أو إدراج (موصى به) ⭐</SelectItem>
                    <SelectItem value="merge">دمج - إضافة فقط (تخطي الموجود)</SelectItem>
                    <SelectItem value="replace">استبدال - حذف ثم إدراج (خطير) ⚠️</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  {restoreMode === 'upsert' && (
                    <p>✅ يحدّث السجلات الموجودة ويضيف الجديدة</p>
                  )}
                  {restoreMode === 'merge' && (
                    <p>✅ يضيف سجلات جديدة فقط ويتخطى الموجودة</p>
                  )}
                  {restoreMode === 'replace' && (
                    <p>⚠️ يحذف كل البيانات القديمة ثم يضيف من النسخة</p>
                  )}
                </div>
              </div>

              {restoreMode === 'replace' && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">
                    تحذير: سيتم حذف جميع البيانات الحالية في الجداول المحددة قبل الاستعادة!
                  </p>
                </div>
              )}

              {/* Table Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>اختر الجداول للاستعادة ({selectedTables.length} محدد)</Label>
                  <Button variant="ghost" size="sm" onClick={toggleAllTables}>
                    {selectedTables.length === Object.keys(backupInfo.tables).length ? 'إلغاء الكل' : 'تحديد الكل'}
                  </Button>
                </div>
                <Card>
                  <CardContent className="pt-4 max-h-[400px] overflow-y-auto">
                    <div className="space-y-2">
                      {Object.entries(backupInfo.tables).map(([tableName, tableData]: [string, any]) => {
                        const hasData = tableData.data && !tableData.error;
                        const rowCount = tableData.rowCount || (Array.isArray(tableData.data) ? tableData.data.length : 0);
                        
                        return (
                          <div
                            key={tableName}
                            className={`flex items-center justify-between p-3 rounded-md border ${
                              hasData ? 'hover:bg-muted cursor-pointer' : 'opacity-50 cursor-not-allowed'
                            }`}
                            onClick={() => hasData && toggleTable(tableName)}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedTables.includes(tableName)}
                                disabled={!hasData}
                              />
                              <div>
                                <p className="font-medium">{tableName}</p>
                                {tableData.error ? (
                                  <p className="text-xs text-destructive">{tableData.error}</p>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    {rowCount.toLocaleString()} صف
                                  </p>
                                )}
                              </div>
                            </div>
                            {hasData ? (
                              <Badge variant="secondary">{rowCount}</Badge>
                            ) : (
                              <Badge variant="destructive">خطأ</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button onClick={resetProcess} variant="outline" className="flex-1">
                  إلغاء
                </Button>
                <Button 
                  onClick={handleRestore} 
                  disabled={selectedTables.length === 0}
                  className="flex-1"
                >
                  <Database className="ml-2 h-4 w-4" />
                  استعادة {selectedTables.length} جدول
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Restoring */}
      {currentStep === 'restore' && (
        <Card>
          <CardHeader>
            <CardTitle>الخطوة 3: جاري الاستعادة...</CardTitle>
            <CardDescription>
              يرجى الانتظار حتى تكتمل عملية الاستعادة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="h-16 w-16 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium mb-2">جاري استعادة البيانات...</p>
              <p className="text-sm text-muted-foreground">
                استعادة {selectedTables.length} جدول
              </p>
              <Progress value={progress} className="w-full max-w-md mt-4" />
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  لا تغلق هذه الصفحة أو المتصفح حتى تكتمل العملية
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {currentStep === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              اكتملت الاستعادة بنجاح!
            </CardTitle>
            <CardDescription>
              تم استعادة البيانات بنجاح
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-20 w-20 text-green-500 mb-4" />
              <p className="text-lg font-medium mb-2">تمت الاستعادة بنجاح!</p>
              <p className="text-sm text-muted-foreground">
                تم استعادة {selectedTables.length} جدول
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={resetProcess} variant="outline" className="flex-1">
                استعادة نسخة أخرى
              </Button>
              <Button onClick={() => router.push('/database-manager')} className="flex-1">
                <Database className="ml-2 h-4 w-4" />
                إدارة قاعدة البيانات
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

