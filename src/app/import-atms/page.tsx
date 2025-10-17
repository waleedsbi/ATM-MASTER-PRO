'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ImportATMsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    skipped: number;
    total: number;
    errors?: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null); // Reset result when selecting new file
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('الرجاء اختيار ملف Excel');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import-atms', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء الاستيراد');
      }

      setResult(data);
    } catch (error) {
      console.error('Import error:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء الاستيراد');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const csvContent = `ATM Code,Serial,Model,Bank,Governorate,City,Address
ATM001,SN001,Model A,البنك الأهلي المصري,القاهرة,مدينة نصر,عنوان المكينة
ATM002,SN002,Model B,بنك مصر,الإسكندرية,سموحة,عنوان المكينة`;

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'atms-template.csv';
    link.click();
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">استيراد ماكينات ATM</h1>
        <p className="text-muted-foreground mt-2">استيراد بيانات الماكينات من ملف Excel أو CSV</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              رفع ملف Excel
            </CardTitle>
            <CardDescription>
              اختر ملف Excel (.xlsx) أو CSV يحتوي على بيانات الماكينات
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
              >
                اضغط لاختيار ملف
              </label>
              <p className="text-sm text-muted-foreground mt-2">
                {file ? `تم اختيار: ${file.name}` : 'أو اسحب الملف هنا'}
              </p>
            </div>

            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {importing ? 'جاري الاستيراد...' : 'استيراد البيانات'}
            </Button>
          </CardContent>
        </Card>

        {/* Template Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              تحميل القالب
            </CardTitle>
            <CardDescription>
              قالب Excel جاهز للاستخدام
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="font-medium mb-4">الأعمدة المطلوبة:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <strong>ATM Code</strong> - كود الماكينة (إجباري)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <strong>Serial</strong> - الرقم التسلسلي
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <strong>Model</strong> - الموديل
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <strong>Bank</strong> - اسم البنك
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <strong>Governorate</strong> - المحافظة
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <strong>City</strong> - المدينة
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <strong>Address</strong> - العنوان
                </li>
              </ul>
            </div>

            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="w-full"
            >
              <Download className="ml-2 h-4 w-4" />
              تحميل القالب
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Result Section */}
      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>نتيجة الاستيراد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{result.success}</div>
                <div className="text-sm text-muted-foreground">نجح</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-muted-foreground">فشل</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
                <div className="text-sm text-muted-foreground">تخطي</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileSpreadsheet className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{result.total}</div>
                <div className="text-sm text-muted-foreground">الإجمالي</div>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>أخطاء:</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() => window.open('/system-status', '_blank')}
              className="w-full"
              variant="outline"
            >
              عرض حالة النظام
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>إرشادات الاستخدام</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>قم بتحميل القالب أو استخدم ملف Excel الخاص بك</li>
            <li>تأكد من أن الصف الأول يحتوي على أسماء الأعمدة</li>
            <li>عمود <strong>ATM Code</strong> إجباري - باقي الأعمدة اختيارية</li>
            <li>إذا كان ATM Code موجود في النظام، سيتم تحديث البيانات</li>
            <li>ارفع الملف واضغط "استيراد البيانات"</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

