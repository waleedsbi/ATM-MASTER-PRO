'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestImportPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setResult({ type: 'health', data });
    } catch (error) {
      setResult({ type: 'error', error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testUpload = async () => {
    setLoading(true);
    try {
      // Create a test CSV file
      const testData = `ATM Code,Serial,Model,Bank,Governorate,City,Address
TEST001,SN001,Model A,Test Bank,Cairo,Nasr City,Test Address`;
      
      const blob = new Blob([testData], { type: 'text/csv' });
      const file = new File([blob], 'test.csv', { type: 'text/csv' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'atms');
      
      console.log('Sending test import...');
      
      const response = await fetch('/api/import-data', {
        method: 'POST',
        body: formData,
      });
      
      console.log('Response status:', response.status);
      
      const text = await response.text();
      console.log('Response text:', text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { raw: text, parseError: String(e) };
      }
      
      setResult({ 
        type: 'import', 
        status: response.status,
        ok: response.ok,
        data 
      });
    } catch (error) {
      console.error('Test error:', error);
      setResult({ type: 'error', error: String(error), stack: error instanceof Error ? error.stack : null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">اختبار الاستيراد</h1>
      
      <div className="grid gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>اختبار الاتصال</CardTitle>
            <CardDescription>تحقق من اتصال قاعدة البيانات</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testConnection} disabled={loading}>
              اختبار الاتصال
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>اختبار الاستيراد</CardTitle>
            <CardDescription>إرسال ملف تجريبي صغير</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testUpload} disabled={loading}>
              اختبار استيراد ملف
            </Button>
          </CardContent>
        </Card>
      </div>

      {loading && <div>جاري التحميل...</div>}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>النتيجة</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

