'use client';
import * as React from 'react';
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
} from '@radix-ui/react-icons';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Employee } from '@/lib/types';
import { employees } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PlusCircle, Upload, Printer, FileDown, CalendarIcon, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const getAvatarUrl = (avatarId: string) => {
  return PlaceHolderImages.find(img => img.id === avatarId)?.imageUrl;
};



export default function EmployeesPage() {
  const { toast } = useToast();
  const [data, setData] = React.useState<Employee[]>(employees);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = React.useState(false);
  const [isImportEmployeeOpen, setIsImportEmployeeOpen] = React.useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [employeeToDelete, setEmployeeToDelete] = React.useState<Employee | null>(null);

  const openDeleteDialog = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (employeeToDelete) {
      setData(data.filter((emp) => emp.id !== employeeToDelete.id));
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      toast({
        title: "تم الحذف",
        description: `تم حذف الموظف "${employeeToDelete.nameAr}" بنجاح.`,
      });
    }
  };

  const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          رقم الموظف
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
     cell: ({ row }) => <div className="font-medium">{row.getValue('id')}</div>,
  },
  {
    accessorKey: 'nameAr',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          الاسم العربي
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
     cell: ({ row }) => <div className="font-medium">{row.getValue('nameAr')}</div>,
  },
  {
    accessorKey: 'nameEn',
    header: 'الاسم الانجليزي',
    cell: ({ row }) => <div>{row.getValue('nameEn')}</div>,
  },
    {
    accessorKey: 'avatarId',
    header: 'الصورة',
    cell: ({ row }) => (
       <Avatar>
          <AvatarImage src={getAvatarUrl(row.original.avatarId)} data-ai-hint="person portrait" />
          <AvatarFallback>{row.original.nameAr.charAt(0)}</AvatarFallback>
        </Avatar>
    ),
  },
  {
    accessorKey: 'city',
    header: 'أسم المدينة',
    cell: ({ row }) => <div>{row.getValue('city')}</div>,
  },
  {
    accessorKey: 'hireDate',
    header: 'تاريخ التعيين',
    cell: ({ row }) => <div>{format(parseISO(row.getValue('hireDate')), 'P')}</div>,
  },
  {
    accessorKey: 'mobile',
    header: 'الموبيل',
    cell: ({ row }) => <div>{row.getValue('mobile')}</div>,
  },
  {
    id: 'actions',
    header: "تعديل",
    enableHiding: false,
    cell: ({ row }) => {
      const employee = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">فتح القائمة</span>
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                setEditingEmployee(employee);
                setIsEditEmployeeOpen(true);
              }}
            >
              تعديل الموظف
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
                className="text-destructive"
                onClick={() => openDeleteDialog(employee)}
            >
                حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];


  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const exportToCsv = () => {
    const headers = ['رقم الموظف', 'الاسم العربي', 'الاسم الانجليزي', 'المدينة', 'تاريخ التعيين', 'الموبيل'];
    const visibleRows = table.getFilteredRowModel().rows;
    const csvContent = [
      headers.join(','),
      ...visibleRows.map(row => {
        const { id, nameAr, nameEn, city, hireDate, mobile } = row.original;
        const formattedDate = format(parseISO(hireDate), 'yyyy-MM-dd');
        return [id, nameAr, nameEn, city, formattedDate, mobile].join(',');
      })
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
        URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="w-full p-4 md:p-8">
        <div className="flex items-center justify-between py-4">
            <div>
                 <h2 className="text-3xl font-bold tracking-tight font-headline">بيانات الموظفين</h2>
                 <p className="text-muted-foreground">
                    إدارة بيانات الموظفين في النظام.
                 </p>
            </div>
        </div>
        <div className="flex items-center justify-between gap-2">
            <Input
            placeholder="البحث..."
            value={(table.getColumn('nameAr')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
                table.getColumn('nameAr')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            />
            <div className="flex gap-2">
                <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="ml-2 h-4 w-4"/> إضافة</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>إضافة موظف</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-6">
                        <fieldset className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded-lg">
                            <legend className="px-2 font-medium">بيانات الموظفين</legend>
                            <div className="grid gap-2">
                                <Label htmlFor="mobile">موبيل الموظف <span className="text-red-500">*</span></Label>
                                <Input id="mobile" />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="phone">تليفون الموظف</Label>
                                <Input id="phone" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="whatsapp">وتس الموظف</Label>
                                <Input id="whatsapp" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">أميل الموظف</Label>
                                <Input id="email" type="email"/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="military">الخدمة العسكرية</Label>
                                <Select>
                                    <SelectTrigger><SelectValue placeholder="أختار الخدمة العسكرية" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="completed">أدى الخدمة</SelectItem>
                                        <SelectItem value="exempted">إعفاء</SelectItem>
                                        <SelectItem value="postponed">مؤجل</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </fieldset>

                        <fieldset className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded-lg">
                            <legend className="px-2 font-medium">بيانات التعليم</legend>
                            <div className="grid gap-2">
                                <Label htmlFor="education">التعليم</Label>
                                <Select><SelectTrigger><SelectValue placeholder="أختار أسم التعليم" /></SelectTrigger><SelectContent><SelectItem value="highschool">ثانوية عامة</SelectItem><SelectItem value="diploma">دبلوم</SelectItem><SelectItem value="bachelor">بكالوريوس</SelectItem><SelectItem value="master">ماجستير</SelectItem><SelectItem value="phd">دكتوراة</SelectItem></SelectContent></Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="university">الجامعة</Label>
                                <Select><SelectTrigger><SelectValue placeholder="أختار الجامعة" /></SelectTrigger><SelectContent><SelectItem value="uni1">جامعة الملك سعود</SelectItem><SelectItem value="uni2">جامعة القاهرة</SelectItem></SelectContent></Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="grad-year">سنة التخرج</Label>
                                <Input id="grad-year" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="grade">التقدير</Label>
                                <Select><SelectTrigger><SelectValue placeholder="أختار التقدير العام" /></SelectTrigger><SelectContent><SelectItem value="excellent">ممتاز</SelectItem><SelectItem value="vgood">جيد جداً</SelectItem><SelectItem value="good">جيد</SelectItem><SelectItem value="pass">مقبول</SelectItem></SelectContent></Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="start-date">تاريخ البدء <span className="text-red-500">*</span></Label>
                                <DatePicker />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end-date">تاريخ الانتهاء</Label>
                                <DatePicker />
                            </div>
                        </fieldset>

                         <fieldset className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded-lg">
                            <legend className="px-2 font-medium">بيانات الوظيفة</legend>
                            <div className="grid gap-2">
                                <Label htmlFor="type">النوع</Label>
                                <Select><SelectTrigger><SelectValue placeholder="أختار النوع" /></SelectTrigger><SelectContent><SelectItem value="male">ذكر</SelectItem><SelectItem value="female">أنثى</SelectItem></SelectContent></Select>
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="marital-status">الحالة الاجتماعية</Label>
                                <Select><SelectTrigger><SelectValue placeholder="أختار الحالة الاجتماعية" /></SelectTrigger><SelectContent><SelectItem value="single">أعزب</SelectItem><SelectItem value="married">متزوج</SelectItem></SelectContent></Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="job-title">الوظيفة</Label>
                                <Select><SelectTrigger><SelectValue placeholder="أختار أسم الوظيفة" /></SelectTrigger><SelectContent><SelectItem value="job1">مهندس</SelectItem><SelectItem value="job2">محاسب</SelectItem></SelectContent></Select>
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="department">الادارة</Label>
                                <Select><SelectTrigger><SelectValue placeholder="أختار أسم الادارة" /></SelectTrigger><SelectContent><SelectItem value="dep1">الإدارة الهندسية</SelectItem><SelectItem value="dep2">الإدارة المالية</SelectItem></SelectContent></Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="group">مجموعة العمل</Label>
                                <Select><SelectTrigger><SelectValue placeholder="مجموعة العمل..." /></SelectTrigger><SelectContent><SelectItem value="g1">فريق أ</SelectItem><SelectItem value="g2">فريق ب</SelectItem></SelectContent></Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="payment-method">طريقة الدفع</Label>
                                <Select><SelectTrigger><SelectValue placeholder="أختار طريقة الدفع" /></SelectTrigger><SelectContent><SelectItem value="bank">تحويل بنكي</SelectItem><SelectItem value="cash">نقداً</SelectItem></SelectContent></Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="basic-salary">الراتب الاساسي</Label>
                                <Input id="basic-salary" type="number" />
                            </div>
                         </fieldset>
                        
                        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg">
                            <legend className="px-2 font-medium">الكورسات</legend>
                            <div className="grid gap-2">
                                <Label htmlFor="courses">الكورسات</Label>
                                <Textarea id="courses" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="course-details">تفاصيل الكورسات</Label>
                                <Textarea id="course-details" />
                            </div>
                        </fieldset>

                         <fieldset className="border p-4 rounded-lg">
                            <legend className="px-2 font-medium">الخبرات</legend>
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                                <div className="grid gap-2 col-span-2">
                                    <Label htmlFor="exp-job">الوظيفة</Label>
                                    <Input id="exp-job" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="exp-from">من تاريخ</Label>
                                    <DatePicker />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="exp-to">إلى تاريخ</Label>
                                    <DatePicker />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="exp-company">الشركة</Label>
                                    <Input id="exp-company" />
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="exp-salary">الراتب</Label>
                                    <Input id="exp-salary" type="number" />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="exp-details">تفاصيل الوظيفة</Label>
                                    <Textarea id="exp-details" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="exp-grade">الدرجه</Label>
                                    <Textarea id="exp-grade" />
                                </div>
                            </div>
                        </fieldset>

                         <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg">
                            <legend className="px-2 font-medium">مرفقات</legend>
                            <div className="grid gap-2">
                                <Label htmlFor="picture">الصورة</Label>
                                <Input id="picture" type="file" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="statement">البيان</Label>
                                <Textarea id="statement" />
                            </div>
                        </fieldset>
                      </div>
                      <DialogFooter className="pt-4 border-t">
                        <Button type="submit">إضافة</Button>
                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                      </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Dialog open={isImportEmployeeOpen} onOpenChange={setIsImportEmployeeOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline"><Upload className="ml-2 h-4 w-4"/> استيراد</Button>
                    </DialogTrigger>
                     <DialogContent>
                        <DialogHeader>
                            <DialogTitle>استيراد الموظفين</DialogTitle>
                            <DialogDescription>
                                اختر ملف CSV يحتوي على بيانات الموظفين. يجب أن يتوافق الملف مع التنسيق المطلوب.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="import-file">ملف الموظفين</Label>
                                <Input id="import-file" type="file" accept=".csv" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">استيراد</Button>
                            <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={() => window.print()}><Printer className="ml-2 h-4 w-4"/> طباعة</Button>
                <Button variant="outline" onClick={exportToCsv}><FileDown className="ml-2 h-4 w-4"/> تصدير</Button>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                    الأعمدة <ChevronDownIcon className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                        return (
                        <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                            }
                        >
                            {column.id === 'nameAr' ? 'الاسم العربي' : 
                             column.id === 'id' ? 'رقم الموظف' :
                             column.id === 'nameEn' ? 'الاسم الانجليزي' :
                             column.id === 'city' ? 'المدينة' :
                             column.id === 'hireDate' ? 'تاريخ التعيين' :
                             column.id === 'mobile' ? 'الموبيل' :
                             column.id === 'avatarId' ? 'الصورة' :
                             column.id
                            }
                        </DropdownMenuCheckboxItem>
                        );
                    })}
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        <div className="rounded-md border mt-4">
            <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                    return (
                        <TableHead key={header.id}>
                        {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                            )}
                        </TableHead>
                    );
                    })}
                </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                    <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    >
                    
                        {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                            {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                            )}
                            </TableCell>
                        ))}
                      
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                    >
                    لا توجد نتائج.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredRowModel().rows.length} من العناصر
            </div>
            <div className="space-x-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
            >
                السابق
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
            >
                التالي
            </Button>
            </div>
        </div>
       
        <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
            <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>تعديل موظف</DialogTitle>
                <DialogDescription>
                    قم بتحديث بيانات الموظف هنا. انقر على حفظ عند الانتهاء.
                </DialogDescription>
              </DialogHeader>
              {editingEmployee && (
                 <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-6">
                 <fieldset className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded-lg">
                     <legend className="px-2 font-medium">بيانات الموظفين</legend>
                     <div className="grid gap-2">
                         <Label htmlFor="edit-nameAr">الاسم العربي <span className="text-red-500">*</span></Label>
                         <Input id="edit-nameAr" defaultValue={editingEmployee.nameAr} />
                     </div>
                      <div className="grid gap-2">
                         <Label htmlFor="edit-nameEn">الاسم الانجليزي</Label>
                         <Input id="edit-nameEn" defaultValue={editingEmployee.nameEn} />
                     </div>
                     <div className="grid gap-2">
                         <Label htmlFor="edit-mobile">موبيل الموظف <span className="text-red-500">*</span></Label>
                         <Input id="edit-mobile" defaultValue={editingEmployee.mobile} />
                     </div>
                      <div className="grid gap-2">
                         <Label htmlFor="edit-phone">تليفون الموظف</Label>
                         <Input id="edit-phone" />
                     </div>
                     <div className="grid gap-2">
                         <Label htmlFor="edit-whatsapp">وتس الموظف</Label>
                         <Input id="edit-whatsapp" />
                     </div>
                     <div className="grid gap-2">
                         <Label htmlFor="edit-email">أميل الموظف</Label>
                         <Input id="edit-email" type="email"/>
                     </div>
                      <div className="grid gap-2">
                         <Label htmlFor="edit-city">المدينة</Label>
                         <Input id="edit-city" defaultValue={editingEmployee.city} />
                     </div>
                     <div className="grid gap-2">
                         <Label htmlFor="edit-military">الخدمة العسكرية</Label>
                         <Select>
                             <SelectTrigger><SelectValue placeholder="أختار الخدمة العسكرية" /></SelectTrigger>
                             <SelectContent>
                                 <SelectItem value="completed">أدى الخدمة</SelectItem>
                                 <SelectItem value="exempted">إعفاء</SelectItem>
                                 <SelectItem value="postponed">مؤجل</SelectItem>
                             </SelectContent>
                         </Select>
                     </div>
                 </fieldset>
 
                 <fieldset className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded-lg">
                     <legend className="px-2 font-medium">بيانات الوظيفة</legend>
                      <div className="grid gap-2">
                         <Label htmlFor="edit-hireDate">تاريخ التعيين</Label>
                         <DatePicker date={parseISO(editingEmployee.hireDate)} />
                     </div>
                     <div className="grid gap-2">
                         <Label htmlFor="edit-job-title">الوظيفة</Label>
                         <Select><SelectTrigger><SelectValue placeholder="أختار أسم الوظيفة" /></SelectTrigger><SelectContent><SelectItem value="job1">مهندس</SelectItem><SelectItem value="job2">محاسب</SelectItem></SelectContent></Select>
                     </div>
                      <div className="grid gap-2">
                         <Label htmlFor="edit-department">الادارة</Label>
                         <Select><SelectTrigger><SelectValue placeholder="أختار أسم الادارة" /></SelectTrigger><SelectContent><SelectItem value="dep1">الإدارة الهندسية</SelectItem><SelectItem value="dep2">الإدارة المالية</SelectItem></SelectContent></Select>
                     </div>
                 </fieldset>
                 
                 <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg">
                     <legend className="px-2 font-medium">مرفقات</legend>
                     <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={getAvatarUrl(editingEmployee.avatarId)} data-ai-hint="person portrait" />
                            <AvatarFallback>{editingEmployee.nameAr.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-picture">تغيير الصورة</Label>
                            <Input id="edit-picture" type="file" />
                        </div>
                    </div>
                     <div className="grid gap-2">
                         <Label htmlFor="edit-statement">البيان</Label>
                         <Textarea id="edit-statement" />
                     </div>
                 </fieldset>
               </div>
              )}
              <DialogFooter className="pt-4 border-t">
                <Button type="submit"><Save className="ml-2 h-4 w-4"/> حفظ التغييرات</Button>
                <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
              </DialogFooter>
            </DialogContent>
        </Dialog>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                <AlertDialogDescription>
                  هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف الموظف بشكل دائم من خوادمنا.
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


function DatePicker({ date: initialDate }: { date?: Date }) {
    const [date, setDate] = React.useState<Date | undefined>(initialDate)

    React.useEffect(() => {
        setDate(initialDate);
    }, [initialDate])

    return (
        <Popover>
            <PopoverTrigger asChild>
            <Button
                variant={"outline"}
                className={cn(
                "justify-start text-left font-normal",
                !date && "text-muted-foreground"
                )}
            >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>اختر تاريخًا</span>}
            </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
            />
            </PopoverContent>
        </Popover>
    )
}
