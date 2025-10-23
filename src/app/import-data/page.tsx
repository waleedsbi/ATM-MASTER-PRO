'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Database, Users, Building2, MapPin } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

type DataType = 'atms' | 'representatives' | 'banks' | 'governorates';

interface ImportResult {
  success: number;
  updated?: number;
  failed: number;
  skipped: number;
  total: number;
  errors?: string[];
  message?: string;
}

const dataTypes = [
  {
    value: 'atms',
    label: 'ماكينات ATM',
    icon: Database,
    description: 'استيراد بيانات الماكينات',
    columns: ['ATM Code', 'Serial', 'Model', 'Bank', 'Governorate', 'City', 'Address'],
    example: 'ATM9333,GEUT0064262,6632 PERSONAS77,البنك الأهلي المصري,القاهرة,القاهرة الجديدة,العنوان',
  },
  {
    value: 'representatives',
    label: 'المندوبين',
    icon: Users,
    description: 'استيراد بيانات المندوبين',
    columns: ['Name', 'Username', 'Email'],
    example: 'أحمد محمد,ahmed.mohamed,ahmed@example.com',
  },
  {
    value: 'banks',
    label: 'البنوك',
    icon: Building2,
    description: 'استيراد بيانات البنوك',
    columns: ['Name', 'Location', 'Contact'],
    example: 'البنك الأهلي المصري,القاهرة,19033',
  },
  {
    value: 'governorates',
    label: 'المحافظات والمدن',
    icon: MapPin,
    description: 'استيراد المحافظات ومدنها',
    columns: ['Governorate', 'City'],
    example: 'القاهرة,مدينة نصر',
  },
];

export default function ImportDataPage() {
  const [selectedType, setSelectedType] = useState<DataType>('atms');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const currentDataType = dataTypes.find(dt => dt.value === selectedType)!;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('الرجاء اختيار ملف');
      return;
    }

    setImporting(true);
    setResult(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', selectedType);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/import-data', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

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
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const downloadTemplate = () => {
    const headers = currentDataType.columns.join(',');
    const example = currentDataType.example;
    const csvContent = `${headers}\n${example}`;

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedType}-template.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">استيراد البيانات</h1>
        <p className="text-muted-foreground">
          استيراد البيانات من ملفات Excel أو CSV بشكل سهل وسريع
        </p>
      </div>

      {/* Data Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {dataTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card
              key={type.value}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedType === type.value ? 'border-orange-500 border-2 bg-orange-50' : ''
              }`}
              onClick={() => {
                setSelectedType(type.value as DataType);
                setFile(null);
                setResult(null);
              }}
            >
              <CardHeader className="pb-3">
                <Icon className={`h-8 w-8 mb-2 ${selectedType === type.value ? 'text-orange-500' : 'text-muted-foreground'}`} />
                <CardTitle className="text-base">{type.label}</CardTitle>
                <CardDescription className="text-xs">{type.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              رفع الملف
            </CardTitle>
            <CardDescription>
              اختر ملف Excel (.xlsx) أو CSV يحتوي على بيانات {currentDataType.label}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className={`h-16 w-16 mx-auto mb-4 ${dragActive ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={importing}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
              >
                اضغط لاختيار ملف
              </label>
              <p className="text-sm text-muted-foreground mt-2">
                {file ? (
                  <span className="text-green-600 font-medium">✓ {file.name}</span>
                ) : (
                  'أو اسحب الملف وأفلته هنا'
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                يدعم: Excel (.xlsx, .xls) أو CSV
              </p>
            </div>

            {importing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>جاري الاستيراد...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              size="lg"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  جاري الاستيراد...
                </>
              ) : (
                <>
                  <Upload className="ml-2 h-4 w-4" />
                  استيراد البيانات
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Template & Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              القالب والإرشادات
            </CardTitle>
            <CardDescription>
              معلومات حول تنسيق ملف {currentDataType.label}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium mb-3 text-blue-900">الأعمدة المطلوبة:</h3>
              <div className="space-y-2">
                {currentDataType.columns.map((col, index) => (
                  <div key={col} className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-orange-500' : 'bg-blue-400'}`}></div>
                    <strong className="text-blue-900">{col}</strong>
                    {index === 0 && <span className="text-xs text-orange-600">(إجباري)</span>}
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="w-full border-orange-500 text-orange-500 hover:bg-orange-50"
              size="lg"
            >
              <Download className="ml-2 h-4 w-4" />
              تحميل قالب {currentDataType.label}
            </Button>

            <div className="bg-muted p-4 rounded-lg text-sm">
              <h4 className="font-medium mb-2">💡 نصائح:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• الصف الأول يجب أن يحتوي على أسماء الأعمدة</li>
                <li>• العمود الأول إجباري - باقي الأعمدة اختيارية</li>
                <li>• إذا كان السجل موجود، سيتم تحديثه</li>
                <li>• تأكد من صحة البيانات قبل الرفع</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Result Section */}
      {result && (
        <Card className="mt-6 border-2">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              نتيجة الاستيراد
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {result.message && (
              <Alert className="mb-4 border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">ملخص النتيجة</AlertTitle>
                <AlertDescription className="text-blue-800">{result.message}</AlertDescription>
              </Alert>
            )}
            
            <div className={`grid gap-4 mb-6 ${result.updated ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'}`}>
              <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
                <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-600">{result.success}</div>
                <div className="text-sm text-green-700 font-medium">تم إضافة</div>
              </div>
              {result.updated !== undefined && result.updated > 0 && (
                <div className="text-center p-6 bg-orange-50 rounded-lg border-2 border-orange-200">
                  <AlertCircle className="h-10 w-10 text-orange-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-orange-600">{result.updated}</div>
                  <div className="text-sm text-orange-700 font-medium">تم تحديث</div>
                </div>
              )}
              <div className="text-center p-6 bg-red-50 rounded-lg border-2 border-red-200">
                <XCircle className="h-10 w-10 text-red-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-red-700 font-medium">فشل</div>
              </div>
              <div className="text-center p-6 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <AlertCircle className="h-10 w-10 text-yellow-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-yellow-600">{result.skipped}</div>
                <div className="text-sm text-yellow-700 font-medium">تخطي</div>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <FileSpreadsheet className="h-10 w-10 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-600">{result.total}</div>
                <div className="text-sm text-blue-700 font-medium">الإجمالي</div>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>تنبيه: وجدت أخطاء</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {result.errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-sm font-medium">... و {result.errors.length - 5} أخطاء أخرى</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => window.open('/system-status', '_blank')}
                className="flex-1"
                variant="outline"
              >
                <Database className="ml-2 h-4 w-4" />
                عرض حالة النظام
              </Button>
              <Button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                <Upload className="ml-2 h-4 w-4" />
                استيراد ملف جديد
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

