'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  RefreshCw, 
  Download, 
  Upload, 
  Play,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  FileText,
  History,
  Save,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useHasPermission } from '@/hooks/use-permissions';

interface TableInfo {
  name: string;
  rowCount: number;
  columns: string[];
}

interface QueryResult {
  success: boolean;
  data?: any[];
  rowCount?: number;
  error?: string;
  affectedRows?: number;
}

export default function DatabaseManagerPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const canManageDB = useHasPermission('canManageDatabase'); // Only ADMIN
  
  const [tables, setTables] = React.useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = React.useState<string>('');
  const [tableData, setTableData] = React.useState<any[]>([]);
  const [columns, setColumns] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [customQuery, setCustomQuery] = React.useState('');
  const [queryResult, setQueryResult] = React.useState<QueryResult | null>(null);
  const [showQueryDialog, setShowQueryDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [tableToDelete, setTableToDelete] = React.useState<string>('');
  const [showImportDialog, setShowImportDialog] = React.useState(false);
  const [showAuditDialog, setShowAuditDialog] = React.useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [restoreFile, setRestoreFile] = React.useState<File | null>(null);
  const [importMode, setImportMode] = React.useState<'append' | 'replace'>('append');
  const [restoreMode, setRestoreMode] = React.useState<'merge' | 'replace' | 'upsert'>('upsert');
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [showDeleteATMsDialog, setShowDeleteATMsDialog] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const restoreFileInputRef = React.useRef<HTMLInputElement>(null);

  // Check permissions
  React.useEffect(() => {
    if (user && !canManageDB) {
      toast({
        variant: 'destructive',
        title: 'غير مصرح',
        description: 'ليس لديك صلاحية الوصول لإدارة قاعدة البيانات',
      });
      router.push('/');
    }
  }, [user, canManageDB, router, toast]);

  // Fetch all tables
  const fetchTables = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/database/tables');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || 'فشل جلب الجداول';
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Check if response is an array
      if (Array.isArray(data)) {
        setTables(data);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        setTables([]);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل جلب قائمة الجداول';
      toast({
        variant: 'destructive',
        title: 'خطأ في جلب الجداول',
        description: errorMessage,
      });
      setTables([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch table data
  const fetchTableData = React.useCallback(async (tableName: string) => {
    if (!tableName) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/database/table-data?table=${encodeURIComponent(tableName)}`);
      if (!response.ok) throw new Error('فشل جلب بيانات الجدول');
      
      const result = await response.json();
      setTableData(result.data);
      setColumns(result.columns);
    } catch (error) {
      console.error('Error fetching table data:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل جلب بيانات الجدول',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Execute custom query
  const executeQuery = React.useCallback(async () => {
    if (!customQuery.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى إدخال استعلام SQL',
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customQuery }),
      });

      const result: QueryResult = await response.json();
      setQueryResult(result);
      
      if (result.success) {
        toast({
          title: 'نجح الاستعلام',
          description: result.affectedRows 
            ? `تم تأثير ${result.affectedRows} صف` 
            : `تم جلب ${result.rowCount || 0} صف`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'فشل الاستعلام',
          description: result.error || 'خطأ غير معروف',
        });
      }
    } catch (error) {
      console.error('Error executing query:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل تنفيذ الاستعلام',
      });
    } finally {
      setIsLoading(false);
    }
  }, [customQuery, toast]);

  // Export table data
  const exportTableData = React.useCallback(async () => {
    if (!selectedTable) return;

    try {
      const response = await fetch(`/api/database/export?table=${encodeURIComponent(selectedTable)}`);
      if (!response.ok) throw new Error('فشل تصدير البيانات');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTable}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'تم التصدير',
        description: 'تم تصدير البيانات بنجاح',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل تصدير البيانات',
      });
    }
  }, [selectedTable, toast]);

  // Delete table (dangerous operation)
  const deleteTable = React.useCallback(async () => {
    if (!tableToDelete) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/database/delete-table', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: tableToDelete }),
      });

      if (!response.ok) throw new Error('فشل حذف الجدول');
      
      toast({
        title: 'تم الحذف',
        description: `تم حذف الجدول ${tableToDelete} بنجاح`,
      });
      
      setShowDeleteDialog(false);
      setTableToDelete('');
      fetchTables();
    } catch (error) {
      console.error('Error deleting table:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل حذف الجدول',
      });
    } finally {
      setIsLoading(false);
    }
  }, [tableToDelete, toast, fetchTables]);

  React.useEffect(() => {
    if (canManageDB) {
      fetchTables();
    }
  }, [canManageDB, fetchTables]);

  // Import data from file
  const handleImportData = React.useCallback(async () => {
    if (!importFile || !selectedTable) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('table', selectedTable);
      formData.append('mode', importMode);

      const response = await fetch('/api/database/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'تم الاستيراد',
          description: `تم استيراد ${result.insertedCount} من ${result.totalRows} صف`,
        });
        
        setShowImportDialog(false);
        setImportFile(null);
        fetchTableData(selectedTable);
      } else {
        throw new Error(result.error || 'فشل الاستيراد');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل استيراد البيانات',
      });
    } finally {
      setIsLoading(false);
    }
  }, [importFile, selectedTable, importMode, toast, fetchTableData]);

  // Create full database backup
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
      a.download = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'تم إنشاء النسخة الاحتياطية',
        description: 'تم تنزيل النسخة الاحتياطية الكاملة بنجاح',
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

  // Fetch audit logs
  const fetchAuditLogs = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/database/audit-logs?limit=50');
      if (!response.ok) throw new Error('فشل جلب السجل');

      const logs = await response.json();
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل جلب سجل العمليات',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Delete all ATM data
  const deleteAllATMs = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/atms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'نجح الحذف',
          description: result.message,
        });
        // Refresh tables list
        fetchTables();
      } else {
        toast({
          variant: 'destructive',
          title: 'فشل الحذف',
          description: result.error || result.message || 'فشل حذف بيانات الماكينات',
        });
      }
    } catch (error) {
      console.error('Error deleting ATMs:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل حذف بيانات الماكينات',
      });
    } finally {
      setIsLoading(false);
      setShowDeleteATMsDialog(false);
    }
  }, [toast, fetchTables]);

  // Restore backup
  const handleRestoreBackup = React.useCallback(async () => {
    if (!restoreFile) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', restoreFile);
      formData.append('mode', restoreMode);

      const response = await fetch('/api/database/restore', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'تمت الاستعادة بنجاح',
          description: result.message || `تم استعادة ${result.successfulTables} جدول`,
        });
        
        setShowRestoreDialog(false);
        setRestoreFile(null);
        fetchTables();
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
    } finally {
      setIsLoading(false);
    }
  }, [restoreFile, restoreMode, toast, fetchTables]);

  React.useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable, fetchTableData]);

  if (!canManageDB) {
    return (
      <div className="flex-1 p-8">
        <Card>
          <CardHeader>
            <CardTitle>غير مصرح</CardTitle>
            <CardDescription>ليس لديك صلاحية الوصول لإدارة قاعدة البيانات</CardDescription>
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
            إدارة قاعدة البيانات
          </h2>
          <p className="text-muted-foreground">
            عرض وإدارة جداول وبيانات قاعدة البيانات
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={fetchTables} variant="outline" disabled={isLoading}>
            <RefreshCw className={`ml-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button onClick={() => setShowQueryDialog(true)} variant="outline">
            <Play className="ml-2 h-4 w-4" />
            استعلام SQL
          </Button>
          <Button onClick={createBackup} variant="outline" disabled={isLoading}>
            <Save className="ml-2 h-4 w-4" />
            نسخة احتياطية
          </Button>
          <Button onClick={() => setShowRestoreDialog(true)} variant="outline">
            <Upload className="ml-2 h-4 w-4" />
            استعادة نسخة
          </Button>
          <Button 
            onClick={() => {
              fetchAuditLogs();
              setShowAuditDialog(true);
            }} 
            variant="outline"
          >
            <History className="ml-2 h-4 w-4" />
            سجل العمليات
          </Button>
          <Button 
            onClick={() => setShowDeleteATMsDialog(true)} 
            variant="destructive"
            disabled={isLoading}
          >
            <Trash2 className="ml-2 h-4 w-4" />
            حذف بيانات الماكينات
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">إجمالي الجداول</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tables.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">إجمالي الصفوف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tables.reduce((sum, t) => sum + t.rowCount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">الجدول المحدد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{selectedTable || 'لا يوجد'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>الجداول</CardTitle>
            <CardDescription>{tables.length} جدول متاح</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {tables.map((table) => (
                  <Button
                    key={table.name}
                    variant={selectedTable === table.name ? 'default' : 'ghost'}
                    className="w-full justify-between"
                    onClick={() => setSelectedTable(table.name)}
                  >
                    <span className="truncate">{table.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {table.rowCount}
                    </Badge>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>بيانات الجدول: {selectedTable}</CardTitle>
                <CardDescription>
                  {tableData.length} صف × {columns.length} عمود
                </CardDescription>
              </div>
              {selectedTable && (
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => setShowImportDialog(true)} variant="outline" size="sm">
                    <Upload className="ml-2 h-4 w-4" />
                    استيراد
                  </Button>
                  <Button onClick={exportTableData} variant="outline" size="sm">
                    <Download className="ml-2 h-4 w-4" />
                    تصدير
                  </Button>
                  <Button 
                    onClick={() => {
                      setTableToDelete(selectedTable);
                      setShowDeleteDialog(true);
                    }} 
                    variant="destructive" 
                    size="sm"
                  >
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedTable ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <Database className="h-12 w-12 mb-4 opacity-50" />
                <p>اختر جدولاً لعرض بياناته</p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col}>{col}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="text-center h-24">
                          لا توجد بيانات
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableData.map((row, idx) => (
                        <TableRow key={idx}>
                          {columns.map((col) => (
                            <TableCell key={col}>
                              {row[col] === null 
                                ? <span className="text-muted-foreground">NULL</span>
                                : typeof row[col] === 'object'
                                ? JSON.stringify(row[col])
                                : String(row[col])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Query Dialog */}
      <Dialog open={showQueryDialog} onOpenChange={setShowQueryDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>تنفيذ استعلام SQL</DialogTitle>
            <DialogDescription>
              قم بإدخال استعلام SQL مخصص. كن حذراً مع استعلامات التعديل أو الحذف.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="query">استعلام SQL</Label>
              <Textarea
                id="query"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="SELECT * FROM TableName WHERE ..."
                className="font-mono h-32"
              />
            </div>
            {queryResult && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {queryResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                    <CardTitle className="text-base">
                      {queryResult.success ? 'نجح الاستعلام' : 'فشل الاستعلام'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {queryResult.success ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">
                        {queryResult.affectedRows 
                          ? `تم تأثير ${queryResult.affectedRows} صف` 
                          : `تم جلب ${queryResult.data?.length || 0} صف`}
                      </p>
                      {queryResult.data && queryResult.data.length > 0 && (
                        <ScrollArea className="h-64">
                          <pre className="text-xs">
                            {JSON.stringify(queryResult.data, null, 2)}
                          </pre>
                        </ScrollArea>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-destructive">{queryResult.error}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQueryDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={executeQuery} disabled={isLoading}>
              {isLoading ? <RefreshCw className="ml-2 h-4 w-4 animate-spin" /> : <Play className="ml-2 h-4 w-4" />}
              تنفيذ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <DialogTitle>تحذير: حذف الجدول</DialogTitle>
            </div>
            <DialogDescription>
              هل أنت متأكد من حذف الجدول <strong>{tableToDelete}</strong>؟
              <br />
              <span className="text-destructive font-semibold">
                هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات نهائياً!
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={deleteTable} disabled={isLoading}>
              {isLoading ? <RefreshCw className="ml-2 h-4 w-4 animate-spin" /> : <Trash2 className="ml-2 h-4 w-4" />}
              حذف نهائياً
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All ATMs Dialog */}
      <Dialog open={showDeleteATMsDialog} onOpenChange={setShowDeleteATMsDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <DialogTitle>تحذير: حذف جميع بيانات الماكينات</DialogTitle>
            </div>
            <DialogDescription>
              هل أنت متأكد من حذف <strong>جميع</strong> بيانات الماكينات؟
              <br />
              <span className="text-destructive font-semibold">
                هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع بيانات الماكينات من كلا الجدولين (ATM و BankATM) نهائياً!
              </span>
              <br />
              <br />
              <span className="text-sm text-muted-foreground">
                ننصح بعمل نسخة احتياطية قبل الحذف.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteATMsDialog(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={deleteAllATMs} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف جميع البيانات
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Data Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>استيراد بيانات إلى: {selectedTable}</DialogTitle>
            <DialogDescription>
              قم برفع ملف JSON أو CSV لاستيراد البيانات
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">نصيحة:</p>
                  <p>للاستعادة الكاملة، استخدم صفحة "استعادة النسخة الاحتياطية" من القائمة الجانبية</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="import-file">اختر ملف (JSON أو CSV)</Label>
              <input
                ref={fileInputRef}
                id="import-file"
                type="file"
                accept=".json,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="ml-2 h-4 w-4" />
                {importFile ? importFile.name : 'اختر ملف'}
              </Button>
            </div>
            <div>
              <Label htmlFor="import-mode">وضع الاستيراد</Label>
              <Select value={importMode} onValueChange={(v: any) => setImportMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="append">إضافة للبيانات الموجودة</SelectItem>
                  <SelectItem value="replace">استبدال البيانات (حذف القديمة)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {importMode === 'replace' && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-destructive">
                  تحذير: سيتم حذف جميع البيانات الحالية في الجدول!
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleImportData} disabled={!importFile || isLoading}>
              {isLoading ? <RefreshCw className="ml-2 h-4 w-4 animate-spin" /> : <Upload className="ml-2 h-4 w-4" />}
              استيراد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>استعادة نسخة احتياطية</DialogTitle>
            <DialogDescription>
              قم برفع ملف النسخة الاحتياطية (JSON) لاستعادة البيانات
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">معلومات مهمة:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>يجب أن يكون الملف بصيغة JSON (تم إنشاؤه من نسخة احتياطية)</li>
                    <li>عملية الاستعادة قد تستغرق عدة دقائق للملفات الكبيرة</li>
                    <li>يُنصح بإنشاء نسخة احتياطية قبل الاستعادة</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="restore-file">اختر ملف النسخة الاحتياطية</Label>
              <input
                ref={restoreFileInputRef}
                id="restore-file"
                type="file"
                accept=".json"
                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => restoreFileInputRef.current?.click()}
              >
                <Upload className="ml-2 h-4 w-4" />
                {restoreFile ? restoreFile.name : 'اختر ملف JSON'}
              </Button>
            </div>

            <div>
              <Label htmlFor="restore-mode">وضع الاستعادة</Label>
              <Select value={restoreMode} onValueChange={(v: any) => setRestoreMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merge">دمج مع البيانات الموجودة</SelectItem>
                  <SelectItem value="replace">استبدال البيانات (حذف القديمة)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {restoreMode === 'replace' && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-destructive">
                  تحذير: سيتم حذف جميع البيانات الحالية في الجداول قبل الاستعادة!
                </p>
              </div>
            )}

            {restoreFile && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-1">معلومات الملف:</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>الاسم: {restoreFile.name}</p>
                  <p>الحجم: {(restoreFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p>النوع: {restoreFile.type || 'application/json'}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleRestoreBackup} disabled={!restoreFile || isLoading}>
              {isLoading ? <RefreshCw className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
              استعادة الآن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent className="max-w-5xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>سجل العمليات (Audit Log)</DialogTitle>
            <DialogDescription>
              آخر 50 عملية تم تنفيذها على قاعدة البيانات
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>العملية</TableHead>
                  <TableHead>الجدول</TableHead>
                  <TableHead>التفاصيل</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      {isLoading ? 'جاري التحميل...' : 'لا توجد سجلات'}
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs">
                        {new Date(log.createdAt).toLocaleString('ar-EG')}
                      </TableCell>
                      <TableCell>{log.userName || 'غير معروف'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.tableName || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate text-xs">
                        {log.details || '-'}
                      </TableCell>
                      <TableCell>
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuditDialog(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

