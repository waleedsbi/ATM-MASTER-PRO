'use client';
import * as React from 'react';
import { CaretSortIcon } from '@radix-ui/react-icons';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Download, Trash2, Save, ChevronDown, CalendarIcon, Filter, Edit, Search } from 'lucide-react';
import type { WorkPlan, ATMData, Governorate } from '@/lib/types';
import { banks, governorates } from '@/lib/data';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface Representative {
  id: number;
  name: string;
}


interface WorkPlanFormData {
  bankName: string;
  startDate: string;
  endDate: string;
  governorate: string;
  city: string;
  statement: string;
  representativeId: number;
  atmCodes: string[];
  dates: string[];
  status?: string;
}

const atmColumns: ColumnDef<ATMData>[] = [
  {
    accessorKey: 'atmModel',
    header: () => <div className="flex items-center gap-1">موديل المكينة <Filter size={14}/></div>,
  },
  {
    accessorKey: 'atmSerial',
    header: () => <div className="flex items-center gap-1">سريل المكينة <Filter size={14}/></div>,
  },
  {
    accessorKey: 'atmCode',
    header: () => <div className="flex items-center gap-1">كود المكينة <Filter size={14}/></div>,
  },
  {
    accessorKey: 'atmAddress',
    header: () => <div className="flex items-center gap-1">عنوان المكينة <Filter size={14}/></div>,
  },
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
];




function DatesMultiSelect({ 
    value, 
    onChange,
    startDate,
    endDate 
}: { 
    value: string[], 
    onChange: (dates: string[]) => void,
    startDate?: Date,
    endDate?: Date
}) {
    const dates = React.useMemo(() => {
        if (!startDate || !endDate) return [];
        const dates: string[] = [];
        const current = new Date(startDate);
        const end = new Date(endDate);
        
        while (current <= end) {
            dates.push(format(current, 'yyyy-MM-dd'));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }, [startDate, endDate]);
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                    <span>{value.length > 0 ? `${value.length} تم الاختيار` : "أختار التواريخ"}</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                <DropdownMenuLabel>التواريخ المتاحة</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {dates.map(date => (
                    <DropdownMenuCheckboxItem
                        key={date}
                        checked={value.includes(date)}
                        onCheckedChange={(checked) => {
                            return checked
                                ? onChange([...value, date])
                                : onChange(value.filter(d => d !== date))
                        }}
                    >
                        {date}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function WorkPlanPage() {
  const { toast } = useToast();
  
  // Form state
  const [selectedBank, setSelectedBank] = React.useState('');
  const [startDate, setStartDate] = React.useState<Date>();
  const [endDate, setEndDate] = React.useState<Date>();
  const [selectedGovernorate, setSelectedGovernorate] = React.useState<Governorate | null>(null);
  const [selectedCityName, setSelectedCityName] = React.useState<string | null>(null);
  const [selectedRepresentative, setSelectedRepresentative] = React.useState('');
  const [statement, setStatement] = React.useState('');
  const [selectedDates, setSelectedDates] = React.useState<string[]>([]);

  // UI state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [planToDelete, setPlanToDelete] = React.useState<WorkPlan | null>(null);
  const [planToEdit, setPlanToEdit] = React.useState<WorkPlan | null>(null);
  
  // Table state
  const [data, setData] = React.useState<WorkPlan[]>([]);
  const [representatives, setRepresentatives] = React.useState<Representative[]>([]);
  const [atms, setAtms] = React.useState<ATMData[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});

  // ATM data filtering
  const filteredAtms = React.useMemo(() => {
    if (!selectedCityName) return [];
    return atms.filter(atm => atm.city === selectedCityName);
  }, [selectedCityName, atms]);

  // ATM table
  const atmTable = useReactTable({
    data: filteredAtms,
    columns: atmColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    initialState: {
      pagination: {
        pageSize: 5,
      }
    }
  });

  // Data fetching
  const fetchWorkPlans = React.useCallback(async () => {
    try {
      const response = await fetch('/api/work-plans');
      const plans = await response.json();
      setData(plans);
    } catch (error) {
      console.error('Error fetching work plans:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل خطط العمل",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchRepresentatives = React.useCallback(async () => {
    try {
      const response = await fetch('/api/representatives');
      const data = await response.json();
      setRepresentatives(data);
    } catch (error) {
      console.error('Error fetching representatives:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل بيانات المندوبين",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchAtms = React.useCallback(async () => {
    try {
      const response = await fetch('/api/atms');
      const data = await response.json();
      setAtms(data);
    } catch (error) {
      console.error('Error fetching ATMs:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل بيانات الماكينات",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Initial data fetching
  React.useEffect(() => {
    fetchWorkPlans();
    fetchRepresentatives();
    fetchAtms();
  }, [fetchWorkPlans, fetchRepresentatives, fetchAtms]);



  const handleSubmit = React.useCallback(async () => {
    try {
      console.log('Starting form submission...');
      
      // Validate required fields
      const requiredFields = [];
      if (!selectedBank) requiredFields.push('البنك');
      if (!startDate) requiredFields.push('تاريخ البداية');
      if (!endDate) requiredFields.push('تاريخ الانتهاء');
      if (!selectedGovernorate) requiredFields.push('المحافظة');
      if (!selectedCityName) requiredFields.push('المدينة');
      if (!statement) requiredFields.push('البيان');
      if (!selectedRepresentative) requiredFields.push('المندوب');

      if (requiredFields.length > 0) {
        console.log('Missing required fields:', requiredFields);
        toast({
          title: 'حقول مطلوبة',
          description: `يرجى ملء الحقول التالية: ${requiredFields.join('، ')}`,
          variant: 'destructive',
        });
        return;
      }

      if (!selectedDates.length) {
        toast({
          title: 'خطأ',
          description: 'يرجى اختيار تواريخ العمل',
          variant: 'destructive',
        });
        return;
      }

      // Get selected ATMs
      const selectedAtms = Object.keys(rowSelection)
        .map(index => filteredAtms[parseInt(index)])
        .filter(Boolean);

      console.log('Selected ATMs:', selectedAtms);

      if (selectedAtms.length === 0) {
        toast({
          title: 'خطأ',
          description: 'يرجى اختيار ماكينة واحدة على الأقل',
          variant: 'destructive',
        });
        return;
      }

      // Validate dates are defined and in correct order
      if (!startDate || !endDate) {
        toast({
          title: 'خطأ في التواريخ',
          description: 'يرجى تحديد تاريخ البداية وتاريخ الانتهاء',
          variant: 'destructive',
        });
        return;
      }

      if (startDate > endDate) {
        toast({
          title: 'خطأ في التواريخ',
          description: 'تاريخ البداية يجب أن يكون قبل تاريخ الانتهاء',
          variant: 'destructive',
        });
        return;
      }

      // Find and validate bank details
      const bankDetails = banks.find(b => b.id === selectedBank);
      if (!bankDetails) {
        toast({
          title: 'خطأ',
          description: 'البنك غير موجود',
          variant: 'destructive',
        });
        return;
      }

      if (!selectedGovernorate) {
        toast({
          title: 'خطأ',
          description: 'المحافظة غير محددة',
          variant: 'destructive',
        });
        return;
      }

      // Prepare work plan data
      const workPlanData: WorkPlanFormData = {
        bankName: bankDetails.nameAr,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        governorate: selectedGovernorate.nameAr,
        city: selectedCityName || '',
        statement: statement.trim(),
        representativeId: parseInt(selectedRepresentative),
        atmCodes: selectedAtms.map(atm => atm.atmCode),
        dates: selectedDates,
        status: 'pending'
      };

      console.log('=== WORK PLAN SUBMISSION ===');
      console.log('Sending work plan data:', JSON.stringify(workPlanData, null, 2));
      console.log('Selected dates:', selectedDates);
      console.log('Selected ATMs:', selectedAtms);
      console.log('Row selection:', rowSelection);

      try {
        const isEditing = !!planToEdit;
        const method = isEditing ? 'PUT' : 'POST';
        const dataToSend = isEditing ? { ...workPlanData, id: planToEdit.id } : workPlanData;
        
        console.log('Sending work plan request:', { method, data: dataToSend, isEditing });
        const response = await fetch('/api/work-plans', {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        });

        let responseData;
        const text = await response.text();
        console.log('Raw server response:', text);
        
        try {
          responseData = text ? JSON.parse(text) : null;
          console.log('Parsed response:', responseData);
        } catch (e) {
          console.error('Failed to parse server response:', { error: e, text });
          toast({
            title: 'خطأ في الاستجابة',
            description: 'فشل في تحليل استجابة الخادم',
            variant: 'destructive',
          });
          return;
        }

        if (!response.ok) {
          console.error('Server returned error status:', {
            status: response.status,
            statusText: response.statusText,
            data: responseData,
            url: response.url,
            headers: Object.fromEntries(response.headers.entries())
          });
          
          // Check if responseData is empty or invalid
          if (!responseData || typeof responseData !== 'object' || Object.keys(responseData).length === 0) {
            console.error('Response data is empty or invalid! This usually means database connection failed or server error.');
            
            // Check database health
            try {
              const healthCheck = await fetch('/api/health');
              const healthData = await healthCheck.json();
              
              if (healthData.database === 'disconnected') {
                toast({
                  title: '❌ خطأ في الاتصال بقاعدة البيانات',
                  description: `لا يمكن الاتصال بقاعدة البيانات. يرجى التحقق من:\n1. ملف .env موجود ويحتوي على DATABASE_URL\n2. SQL Server يعمل\n3. معلومات الاتصال صحيحة\n\nالخطأ: ${healthData.error || 'غير معروف'}`,
                  variant: 'destructive',
                });
                return;
              }
            } catch (e) {
              console.error('Failed to check health:', e);
            }
            
            toast({
              title: `خطأ ${response.status}`,
              description: `حدث خطأ في الخادم (${response.status}): ${response.statusText || 'لا توجد تفاصيل'}\n\nيرجى التحقق من:\n✓ ملف .env موجود ويحتوي على DATABASE_URL\n✓ قاعدة البيانات متصلة\n✓ تشغيل الأمر: npx prisma db push\n✓ تشغيل الأمر: npx prisma generate`,
              variant: 'destructive',
            });
            return;
          }
          
          const errorMessage = responseData?.error || responseData?.message || 'حدث خطأ أثناء إنشاء خطة العمل';
          const errorDetails = responseData?.details ? `\nالتفاصيل: ${responseData.details}` : '';
          const errorHint = responseData?.hint ? `\n💡 ${responseData.hint}` : '';
          
          toast({
            title: `خطأ ${response.status}`,
            description: errorMessage + errorDetails + errorHint,
            variant: 'destructive',
          });
          return;
        }

        // Validate successful response
        if (!responseData?.id) {
          console.error('Invalid server response:', { response: responseData });
          toast({
            title: 'خطأ في البيانات',
            description: 'البيانات المستلمة من الخادم غير صالحة',
            variant: 'destructive',
          });
          return;
        }

        await fetchWorkPlans();
        toast({
          title: isEditing ? 'تم التحديث' : 'تم الإضافة',
          description: isEditing ? 'تم تحديث خطة العمل بنجاح' : 'تم إضافة خطة العمل بنجاح',
        });

        // Reset form
        setIsDialogOpen(false);
        setPlanToEdit(null);
        setSelectedBank('');
        setStartDate(undefined);
        setEndDate(undefined);
        setSelectedGovernorate(null);
        setSelectedCityName(null);
        setStatement('');
        setSelectedRepresentative('');
        setSelectedDates([]);
        atmTable.toggleAllRowsSelected(false);
      } catch (error) {
        console.error('Network error:', error);
        toast({
          title: 'خطأ في الاتصال',
          description: 'حدث خطأ أثناء الاتصال بالخادم',
          variant: 'destructive',
        });
      }

    } catch (error) {
      console.error('Error creating work plan:', {
        error,
        type: error instanceof Error ? error.constructor.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'حدث خطأ غير متوقع أثناء إنشاء خطة العمل';
        
      toast({
        title: 'خطأ في النظام',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [
    selectedBank,
    startDate,
    endDate,
    selectedGovernorate,
    selectedCityName,
    statement,
    selectedRepresentative,
    selectedDates,
    rowSelection,
    filteredAtms,
    banks,
    toast,
    fetchWorkPlans,
    atmTable,
    setIsDialogOpen,
    planToEdit
  ]);

  const openEditDialog = React.useCallback((plan: WorkPlan) => {
    setPlanToEdit(plan);
    
    // Parse the work plan data and populate the form
    const bankId = banks.find(b => b.nameAr === plan.bankName)?.id || '';
    const governorate = governorates.find(g => g.nameAr === plan.governorate) || null;
    
    setSelectedBank(bankId);
    setStartDate(parseISO(plan.startDate));
    setEndDate(parseISO(plan.endDate));
    setSelectedGovernorate(governorate);
    setSelectedCityName(plan.city);
    setStatement(plan.statement);
    setSelectedRepresentative(plan.representativeId.toString());
    
    // Parse dates and atmCodes from JSON strings
    try {
      const dates = JSON.parse(plan.dates);
      const atmCodes = JSON.parse(plan.atmCodes);
      setSelectedDates(Array.isArray(dates) ? dates : []);
      
      // Set row selection based on atmCodes
      if (Array.isArray(atmCodes)) {
        const newRowSelection: Record<string, boolean> = {};
        atmCodes.forEach(code => {
          const index = filteredAtms.findIndex(atm => atm.atmCode === code);
          if (index !== -1) {
            newRowSelection[index.toString()] = true;
          }
        });
        setRowSelection(newRowSelection);
      }
    } catch (error) {
      console.error('Error parsing plan data:', error);
    }
    
    setIsDialogOpen(true);
  }, [banks, governorates, filteredAtms]);

  const openDeleteDialog = React.useCallback((plan: WorkPlan) => {
    setPlanToDelete(plan);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDelete = React.useCallback(async () => {
    if (planToDelete) {
      try {
        const response = await fetch(`/api/work-plans?id=${planToDelete.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          await fetchWorkPlans();
          setIsDeleteDialogOpen(false);
          setPlanToDelete(null);
          toast({
            title: "تم الحذف",
            description: `تم حذف الخطة بنجاح.`,
          });
        } else {
          throw new Error('Failed to delete work plan');
        }
      } catch (error) {
        console.error('Error deleting work plan:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء حذف الخطة",
          variant: "destructive",
        });
      }
    }
  }, [planToDelete, toast, fetchWorkPlans]);

  const workPlanColumns: ColumnDef<WorkPlan>[] = React.useMemo(() => [
    {
      accessorKey: 'bankName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          suppressHydrationWarning
        >
          اسم البنك
          <CaretSortIcon className="mr-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'تاريخ البداء',
      cell: ({ row }) => format(parseISO(row.getValue('startDate')), 'dd/MM/yyyy'),
    },
    {
      accessorKey: 'endDate',
      header: 'تاريخ الانتهاء',
      cell: ({ row }) => format(parseISO(row.getValue('endDate')), 'dd/MM/yyyy'),
    },
    {
      accessorKey: 'governorate',
      header: 'اسم المحافظة',
    },
    {
      accessorKey: 'city',
      header: 'اسم المدينة',
    },
    {
      accessorKey: 'statement',
      header: 'البيان',
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => openEditDialog(row.original)}
            suppressHydrationWarning
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive hover:text-destructive/80"
            onClick={() => openDeleteDialog(row.original)}
            suppressHydrationWarning
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [openEditDialog, openDeleteDialog]);

  // Work plans table
  const workPlansTable = useReactTable({
    data,
    columns: workPlanColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  const handleGovernorateChange = React.useCallback((govId: string) => {
    const gov = governorates.find(g => g.id === govId) || null;
    setSelectedGovernorate(gov);
    setSelectedCityName(null);
  }, []);
  
  const handleCityChange = React.useCallback((cityName: string) => {
    setSelectedCityName(cityName);
  }, []);

  return (
    <div className="w-full p-4 md:p-8" suppressHydrationWarning>
      <div className="flex items-center justify-between">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="بحث في خطط العمل..."
              onChange={(event) =>
                workPlansTable.getColumn('bankName')?.setFilterValue(event.target.value)
              }
              className="w-full pr-10"
              suppressHydrationWarning
            />
          </div>
          <div className="flex gap-2">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setIsDialogOpen(true)} suppressHydrationWarning>
                  <PlusCircle className="ml-2 h-4 w-4" /> إضافة
              </Button>
              <Button variant="outline" className="bg-orange-500 hover:bg-orange-600 text-white" suppressHydrationWarning>
                  <Download className="ml-2 h-4 w-4" /> تصدير
              </Button>
               <Button 
                variant="outline" 
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => window.open('/system-status', '_blank')}
                suppressHydrationWarning
              >
                  حالة النظام
              </Button>
          </div>
      </div>

      <div className="rounded-md border mt-4">
        <Table>
          <TableHeader>
            {workPlansTable.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableHead></TableHead>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                        flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {workPlansTable.getRowModel().rows?.length ? (
              workPlansTable.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                      <CaretSortIcon className="h-4 w-4 rotate-90" />
                  </TableCell>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={workPlanColumns.length + 1} className="h-24 text-center">
                  لا توجد نتائج.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
            Page {atmTable.getState().pagination.pageIndex + 1} of {atmTable.getPageCount()} ({atmTable.getFilteredRowModel().rows.length} items)
        </div>
        <div className="flex items-center gap-2">
                               <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => atmTable.setPageIndex(0)}
              disabled={!atmTable.getCanPreviousPage()}
              suppressHydrationWarning
            >
              &lt;&lt;
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => atmTable.previousPage()}
              disabled={!atmTable.getCanPreviousPage()}
              suppressHydrationWarning
            >
              &lt;
            </Button>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Button
                key={i}
                variant={atmTable.getState().pagination.pageIndex === i ? 'default' : 'outline'}
                size="sm"
                onClick={() => atmTable.setPageIndex(i)}
                suppressHydrationWarning
              >
                {i + 1}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => atmTable.nextPage()}
              disabled={!atmTable.getCanNextPage()}
              suppressHydrationWarning
            >
              &gt;
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => atmTable.setPageIndex(atmTable.getPageCount() - 1)}
              disabled={!atmTable.getCanNextPage()}
              suppressHydrationWarning
            >
              &gt;&gt;
            </Button>
          </div>
          <Select
            onValueChange={(value) => {
              atmTable.setPageSize(Number(value))
            }}
            defaultValue={`${atmTable.getState().pagination.pageSize}`}
          >
                            <SelectTrigger className="w-24" suppressHydrationWarning>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            Item Total
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setPlanToEdit(null);
          setSelectedBank('');
          setStartDate(undefined);
          setEndDate(undefined);
          setSelectedGovernorate(null);
          setSelectedCityName(null);
          setStatement('');
          setSelectedRepresentative('');
          setSelectedDates([]);
          atmTable.toggleAllRowsSelected(false);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{planToEdit ? 'تعديل خطة' : 'إضافة خطة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-grow overflow-y-auto pr-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="grid gap-2">
                <Label>اسم البنك</Label>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger><SelectValue placeholder="أختار البنك" /></SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>{bank.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>تاريخ البداء</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-right font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : "أختار التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label>تاريخ الانتهاء</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-right font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy") : "أختار التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) =>
                        startDate ? date < startDate : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label>اسم المحافظة</Label>
                <Select onValueChange={handleGovernorateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="أختار المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    {governorates.map((gov) => (
                      <SelectItem key={gov.id} value={gov.id}>
                        {gov.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>اسم المدينة</Label>
                <Select 
                  value={selectedCityName || ''} 
                  onValueChange={handleCityChange}
                  disabled={!selectedGovernorate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="أختار المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedGovernorate?.cities.map((city) => (
                      <SelectItem key={city.id} value={city.nameAr}>
                        {city.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>أختار المندوب</Label>
                <Select value={selectedRepresentative} onValueChange={setSelectedRepresentative}>
                  <SelectTrigger>
                    <SelectValue placeholder="أختار المندوب" />
                  </SelectTrigger>
                  <SelectContent>
                    {representatives.map((rep) => (
                      <SelectItem key={rep.id} value={rep.id.toString()}>
                        {rep.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>أختار التواريخ</Label>
                <DatesMultiSelect
                  value={selectedDates}
                  onChange={setSelectedDates}
                  startDate={startDate}
                  endDate={endDate}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>البيان</Label>
              <Textarea
                placeholder="أدخل البيان"
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>اختيار الماكينات</Label>
                {selectedCityName && (
                  <div className="text-sm text-muted-foreground">
                    {Object.keys(rowSelection).length > 0 && `تم اختيار ${Object.keys(rowSelection).length} ماكينة`}
                  </div>
                )}
              </div>
              
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {atmTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {atmTable.getRowModel().rows?.length ? (
                    atmTable.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={atmColumns.length} className="h-24 text-center">
                        الرجاء اختيار مدينة لعرض الماكينات.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              <div className="flex justify-between items-center gap-2 mt-4 px-4 pb-4">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => atmTable.setPageIndex(0)}
                    disabled={!atmTable.getCanPreviousPage()}
                  >
                    {'<<'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => atmTable.previousPage()}
                    disabled={!atmTable.getCanPreviousPage()}
                  >
                    {'<'}
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, atmTable.getPageCount()) }, (_, i) => {
                    const currentPage = atmTable.getState().pagination.pageIndex;
                    const totalPages = atmTable.getPageCount();
                    let pageNum: number;

                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage > totalPages - 4) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={`page-${i}-${pageNum}`}
                        variant={atmTable.getState().pagination.pageIndex === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => atmTable.setPageIndex(pageNum)}
                        className={atmTable.getState().pagination.pageIndex === pageNum ? "bg-orange-500 hover:bg-orange-600" : ""}
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => atmTable.nextPage()}
                    disabled={!atmTable.getCanNextPage()}
                  >
                    {'>'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => atmTable.setPageIndex(atmTable.getPageCount() - 1)}
                    disabled={!atmTable.getCanNextPage()}
                  >
                    {'>>'}
                  </Button>
                </div>
                <Select
                  onValueChange={(value) => {
                    atmTable.setPageSize(Number(value))
                  }}
                  defaultValue={`${atmTable.getState().pagination.pageSize}`}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  صفحة {atmTable.getState().pagination.pageIndex + 1} من {atmTable.getPageCount()}
                </div>
              </div>
            </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button onClick={handleSubmit} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Save className="ml-2 h-4 w-4" /> {planToEdit ? 'تحديث' : 'إضافة'}
            </Button>
            <DialogClose asChild>
              <Button variant="ghost">إلغاء</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف الخطة بشكل دائم.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
