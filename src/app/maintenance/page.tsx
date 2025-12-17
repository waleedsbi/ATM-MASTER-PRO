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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import type { MaintenanceTask } from '@/lib/types';
import { PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';


const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Completed: 'default',
  'In Progress': 'secondary',
  Pending: 'outline',
  Cancelled: 'destructive'
};

const priorityVariant: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
    High: 'destructive',
    Medium: 'secondary',
    Low: 'default',
};

const columns: ColumnDef<MaintenanceTask & { atmLocation?: string; technicianName?: string }>[] = [
  {
    accessorKey: 'description',
    header: 'المهمة',
    cell: ({ row }) => <div className="font-medium">{row.getValue('description')}</div>,
  },
  {
    accessorKey: 'atmLocation',
    header: 'موقع الصراف الآلي',
    cell: ({ row }) => <div>{row.original.atmLocation || 'N/A'}</div>,
  },
  {
    accessorKey: 'technicianName',
    header: 'الفني المسؤول',
    cell: ({ row }) => <div>{row.original.technicianName || 'غير معين'}</div>,
  },
  {
    accessorKey: 'status',
    header: 'الحالة',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return <Badge variant={statusVariant[status]}>{status}</Badge>;
    },
  },
    {
    accessorKey: 'priority',
    header: 'الأولوية',
    cell: ({ row }) => {
      const priority = row.getValue('priority') as string;
      return <Badge variant={priorityVariant[priority]}>{priority}</Badge>;
    },
  },
  {
    accessorKey: 'scheduledDate',
    header: 'تاريخ الاستحقاق',
    cell: ({ row }) => <div>{format(new Date(row.getValue('scheduledDate')), 'PPP')}</div>,
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const task = row.original;
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
            <DropdownMenuItem>عرض التفاصيل</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DialogTrigger asChild>
                <DropdownMenuItem>تعديل المهمة</DropdownMenuItem>
            </DialogTrigger>
            <DropdownMenuItem className="text-destructive">إلغاء المهمة</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function MaintenancePage() {
  const [data, setData] = React.useState<(MaintenanceTask & { atmLocation?: string; technicianName?: string })[]>([]);
  const [atms, setAtms] = React.useState<any[]>([]);
  const [technicians, setTechnicians] = React.useState<any[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [date, setDate] = React.useState<Date>();

  React.useEffect(() => {
    // جلب مهام الصيانة من قاعدة البيانات
    (async () => {
      try {
        const [tasksRes, atmsRes, techsRes] = await Promise.all([
          fetch('/api/maintenance-tasks', { cache: 'no-store' }),
          fetch('/api/atms', { cache: 'no-store' }),
          fetch('/api/technicians', { cache: 'no-store' }),
        ]);

        const [tasks, atmsData, techniciansData] = await Promise.all([
          tasksRes.ok ? tasksRes.json() : [],
          atmsRes.ok ? atmsRes.json() : [],
          techsRes.ok ? techsRes.json() : [],
        ]);

        // حفظ البيانات في state
        setAtms(Array.isArray(atmsData) ? atmsData : []);
        setTechnicians(Array.isArray(techniciansData) ? techniciansData : []);

        const mapped = Array.isArray(tasks)
          ? tasks.map((t: any) => ({
              ...t,
              atmLocation: atmsData.find((a: any) => a.atmCode === t.atmCode)?.atmAddress,
              technicianName: techniciansData.find((tech: any) => tech.id === t.technicianId)?.name,
            }))
          : [];

        setData(mapped);
      } catch (e) {
        console.error('Error fetching maintenance page data:', e);
      }
    })();
  }, []);

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

  return (
    <div className="w-full p-4 md:p-8">
       <Dialog>
        <div className="flex items-center justify-between py-4">
            <div>
                 <h2 className="text-3xl font-bold tracking-tight font-headline">جدولة الصيانة</h2>
                 <p className="text-muted-foreground">
                    جدولة وإدارة مهام صيانة أجهزة الصراف الآلي.
                 </p>
            </div>
            <DialogTrigger asChild>
                <Button><PlusCircle className="ml-2 h-4 w-4"/> جدولة مهمة</Button>
            </DialogTrigger>
        </div>
        <div className="flex items-center justify-between">
            <Input
            placeholder="تصفية حسب المهمة..."
            value={(table.getColumn('description')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
                table.getColumn('description')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            />
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
                        {column.id}
                    </DropdownMenuCheckboxItem>
                    );
                })}
            </DropdownMenuContent>
            </DropdownMenu>
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
       
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>جدولة مهمة صيانة</DialogTitle>
            <DialogDescription>
              املأ التفاصيل لجدولة مهمة صيانة جديدة.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="atm">الصراف الآلي</Label>
               <Select>
                <SelectTrigger>
                  <SelectValue placeholder="اختر صراف آلي" />
                </SelectTrigger>
                <SelectContent>
                  {atms.map((atm: any) => (
                    <SelectItem key={atm.id || atm.atmCode} value={atm.id || atm.atmCode}>
                      {atm.bankName || atm.bank} - {atm.atmAddress || atm.location || atm.atmCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">وصف المهمة</Label>
              <Textarea id="description" placeholder="صف مهمة الصيانة..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                  <Label htmlFor="technician">تعيين فني</Label>
                   <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر فني" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">غير معين</SelectItem>
                      {technicians.map(tech => <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="priority">الأولوية</Label>
                   <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="تحديد الأولوية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="date">التاريخ المجدول</Label>
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
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">جدولة المهمة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
