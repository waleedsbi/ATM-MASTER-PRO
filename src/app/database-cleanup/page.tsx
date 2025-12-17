'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  RefreshCw,
  Trash2,
  Shield,
  Database,
  CheckCircle,
  Info,
  Download,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useHasPermission } from '@/hooks/use-permissions';
import { Checkbox } from '@/components/ui/checkbox';

interface TableInfo {
  name: string;
  rowCount: number;
  columnCount: number;
  sizeKb: number;
  sizeMb: string;
  isUsed: boolean;
  isProtected: boolean;
}

interface Analysis {
  totalTables: number;
  usedTables: TableInfo[];
  unusedTables: TableInfo[];
  protectedTables: TableInfo[];
  statistics: {
    usedCount: number;
    unusedCount: number;
    protectedCount: number;
    totalRows: number;
    unusedRows: number;
  };
}

export default function DatabaseCleanupPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const canManageDB = useHasPermission('canManageDatabase'); // Only ADMIN

  const [analysis, setAnalysis] = React.useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedTables, setSelectedTables] = React.useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  // Check permissions
  React.useEffect(() => {
    if (user && !canManageDB) {
      toast({
        variant: 'destructive',
        title: 'غير مصرح',
        description: 'ليس لديك صلاحية الوصول لتنظيف قاعدة البيانات',
      });
      router.push('/');
    }
  }, [user, canManageDB, router, toast]);

  // Fetch analysis
  const fetchAnalysis = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/database/analyze-tables');
      if (!response.ok) throw new Error('فشل تحليل الجداول');

      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل تحليل قاعدة البيانات',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Delete selected tables
  const deleteTables = React.useCallback(async () => {
    if (selectedTables.length === 0) return;

    try {
      setIsLoading(true);

      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const tableName of selectedTables) {
        try {
          const response = await fetch('/api/database/delete-table', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: tableName }),
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            const error = await response.json();
            errors.push(`${tableName}: ${error.error}`);
          }
        } catch (error) {
          failCount++;
          errors.push(`${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      toast({
        title: successCount > 0 ? 'تم الحذف' : 'فشل الحذف',
        description: `تم حذف ${successCount} جدول بنجاح${failCount > 0 ? `، فشل ${failCount}` : ''}`,
        variant: failCount > 0 ? 'destructive' : 'default',
      });

      setShowDeleteDialog(false);
      setSelectedTables([]);
      fetchAnalysis();
    } catch (error) {
      console.error('Error deleting tables:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل حذف الجداول',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedTables, toast, fetchAnalysis]);

  // Toggle table selection
  const toggleTable = (tableName: string) => {
    setSelectedTables(prev =>
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  // Select all unused tables
  const selectAllUnused = () => {
    if (!analysis) return;
    const allUnused = analysis.unusedTables.map(t => t.name);
    setSelectedTables(allUnused);
  };

  // Create backup before cleanup
  const createBackup = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/database/backup', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('فشل إنشاء النسخة الاحتياطية');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_before_cleanup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'تم إنشاء النسخة الاحتياطية',
        description: 'تم تنزيل النسخة الاحتياطية قبل التنظيف',
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل إنشاء النسخة الاحتياطية',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (canManageDB) {
      fetchAnalysis();
    }
  }, [canManageDB, fetchAnalysis]);

  if (!canManageDB) {
    return (
      <div className="flex-1 p-8">
        <Card>
          <CardHeader>
            <CardTitle>غير مصرح</CardTitle>
            <CardDescription>ليس لديك صلاحية الوصول لتنظيف قاعدة البيانات</CardDescription>
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
            تنظيف قاعدة البيانات
          </h2>
          <p className="text-muted-foreground">
            تحليل وحذف الجداول غير المستخدمة لتحسين الأداء
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={createBackup} variant="outline" disabled={isLoading}>
            <Download className="ml-2 h-4 w-4" />
            نسخة احتياطية
          </Button>
          <Button onClick={fetchAnalysis} variant="outline" disabled={isLoading}>
            <RefreshCw className={`ml-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث التحليل
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {analysis && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">إجمالي الجداول</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysis.totalTables}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">جداول مستخدمة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analysis.statistics.usedCount + analysis.statistics.protectedCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">جداول غير مستخدمة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {analysis.statistics.unusedCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">مساحة قابلة للتوفير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {(analysis.unusedTables.reduce((sum, t) => sum + t.sizeKb, 0) / 1024).toFixed(2)} MB
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Warnings */}
      <div className="space-y-2">
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800 dark:text-red-200">
              <p className="font-semibold mb-2">تحذير مهم جداً:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>حذف الجداول عملية غير قابلة للتراجع</li>
                <li>قم بإنشاء نسخة احتياطية كاملة قبل الحذف</li>
                <li>تأكد من أن الجداول غير مستخدمة فعلاً</li>
                <li>بعض الجداول قد تكون مستخدمة في أنظمة أخرى</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">نصيحة:</p>
              <p>الجداول "غير المستخدمة" هي التي لم يتم العثور عليها في كود التطبيق الحالي. قد تكون مستخدمة في تطبيقات أخرى أو محفوظة لأغراض تاريخية.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Lists */}
      {analysis && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Protected Tables */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    جداول محمية
                  </CardTitle>
                  <CardDescription>
                    {analysis.protectedTables.length} جدول - لا يمكن حذفها
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-50">
                  {analysis.statistics.protectedCount}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {analysis.protectedTables.map((table) => (
                  <div key={table.name} className="flex items-center justify-between p-2 rounded-md border bg-green-50/50">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{table.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{table.rowCount.toLocaleString()}</Badge>
                      <span className="text-xs text-muted-foreground">{table.sizeMb} MB</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Used Tables */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    جداول مستخدمة
                  </CardTitle>
                  <CardDescription>
                    {analysis.usedTables.length} جدول - مستخدمة في التطبيق
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-blue-50">
                  {analysis.statistics.usedCount}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {analysis.usedTables.map((table) => (
                  <div key={table.name} className="flex items-center justify-between p-2 rounded-md border bg-blue-50/50">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{table.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{table.rowCount.toLocaleString()}</Badge>
                      <span className="text-xs text-muted-foreground">{table.sizeMb} MB</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Unused Tables */}
      {analysis && analysis.unusedTables.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  جداول غير مستخدمة
                </CardTitle>
                <CardDescription>
                  {analysis.unusedTables.length} جدول - يمكن حذفها لتوفير المساحة
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllUnused}>
                  تحديد الكل
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={selectedTables.length === 0}
                >
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف ({selectedTables.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTables.length === analysis.unusedTables.length}
                      onCheckedChange={selectAllUnused}
                    />
                  </TableHead>
                  <TableHead>اسم الجدول</TableHead>
                  <TableHead>عدد الصفوف</TableHead>
                  <TableHead>عدد الأعمدة</TableHead>
                  <TableHead>الحجم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.unusedTables.map((table) => (
                  <TableRow key={table.name}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTables.includes(table.name)}
                        onCheckedChange={() => toggleTable(table.name)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{table.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{table.rowCount.toLocaleString()}</Badge>
                    </TableCell>
                    <TableCell>{table.columnCount}</TableCell>
                    <TableCell>{table.sizeMb} MB</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* No Unused Tables */}
      {analysis && analysis.unusedTables.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-lg font-medium mb-2">قاعدة البيانات نظيفة!</p>
            <p className="text-sm text-muted-foreground">
              جميع الجداول مستخدمة في النظام
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <DialogTitle>تأكيد حذف الجداول</DialogTitle>
            </div>
            <DialogDescription>
              أنت على وشك حذف <strong>{selectedTables.length}</strong> جدول نهائياً
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200 font-semibold mb-2">
                ⚠️ هذا الإجراء خطير ولا يمكن التراجع عنه!
              </p>
              <p className="text-sm text-red-800 dark:text-red-200">
                سيتم حذف جميع البيانات في الجداول التالية نهائياً:
              </p>
            </div>
            <div className="max-h-[200px] overflow-y-auto border rounded-md p-2">
              <ul className="text-sm space-y-1">
                {selectedTables.map((tableName) => (
                  <li key={tableName} className="flex items-center gap-2">
                    <Trash2 className="h-3 w-3 text-destructive" />
                    {tableName}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                💡 تأكد من أنك أنشأت نسخة احتياطية قبل المتابعة
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={deleteTables} disabled={isLoading}>
              {isLoading ? <RefreshCw className="ml-2 h-4 w-4 animate-spin" /> : <Trash2 className="ml-2 h-4 w-4" />}
              حذف نهائياً
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

