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
import { format, parseISO, isValid } from 'date-fns';
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
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Download, Trash2, Save, CalendarIcon, Pencil, X, Search } from 'lucide-react';
import type { ATMData } from '@/lib/types';
import { atmData } from '@/lib/data';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

function DatePicker({ date: initialDate, onSelectDate }: { date?: Date, onSelectDate: (date?: Date) => void }) {
    const [date, setDate] = React.useState<Date | undefined>(initialDate)

    React.useEffect(() => {
        setDate(initialDate);
    }, [initialDate])
    
    const handleSelect = (selectedDate?: Date) => {
        setDate(selectedDate);
        onSelectDate(selectedDate);
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
            <Button
                variant={"outline"}
                className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
                )}
            >
                <CalendarIcon className="mr-auto h-4 w-4" />
                {date ? format(date, "PPP") : <span></span>}
            </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
            <Calendar
                mode="single"
                selected={date}
                onSelect={handleSelect}
                initialFocus
            />
            </PopoverContent>
        </Popover>
    )
}

export default function AtmDataPage() {
  const { toast } = useToast();
  const [data, setData] = React.useState<ATMData[]>(atmData);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [editingRow, setEditingRow] = React.useState<ATMData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [rowToDelete, setRowToDelete] = React.useState<ATMData | null>(null);
  const [isNewDialogOpen, setIsNewDialogOpen] = React.useState(false);
  const [selectedBank, setSelectedBank] = React.useState<string>('all');
  const [selectedGovernorate, setSelectedGovernorate] = React.useState<string>('all');
  const [selectedCity, setSelectedCity] = React.useState<string>('all');
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    // Try to fetch real ATMs from API; fallback to local mock data
    (async () => {
      try {
        const res = await fetch('/api/atms', { cache: 'no-store' });
        if (res.ok) {
          const atms = await res.json();
          if (Array.isArray(atms) && atms.length) {
            setData(atms);
          }
        }
      } catch (e) {
        // Ignore, keep existing mock data
      }
    })();
  }, []);

  const governorates = React.useMemo(() => {
    const uniqueGovernorates = new Set(data.map(item => item.governorate).filter(gov => gov));
    return Array.from(uniqueGovernorates).sort();
  }, [data]);

  // Derive banks list from current data to ensure it reflects DB truth
  const banksList = React.useMemo(() => {
    const uniqueBanks = new Set(data.map(item => item.bankName).filter(Boolean));
    return Array.from(uniqueBanks).sort();
  }, [data]);
  
  const cities = React.useMemo(() => {
      // إذا تم اختيار محافظة، عرض المدن التابعة لها فقط
      const filteredData = selectedGovernorate === 'all' 
        ? data 
        : data.filter(item => item.governorate === selectedGovernorate);
      
      const uniqueCities = new Set(filteredData.map(item => item.city).filter(city => city));
      return Array.from(uniqueCities).sort();
  }, [data, selectedGovernorate]);

  const handleUpdate = () => {
    if (!editingRow) return;

    if (editingRow.id) {
        // Update existing row
        setData(prevData => prevData.map(d => d.id === editingRow.id ? editingRow : d));
         toast({
            title: "تم التحديث",
            description: "تم تحديث بيانات الصراف الآلي بنجاح.",
        });
    } else {
        // Add new row
        const newRowWithId = { ...editingRow, id: `atm-data-${Date.now()}`};
        setData(prevData => [newRowWithId, ...prevData]);
        toast({
            title: "تم الحفظ",
            description: `تم حفظ بيانات الصراف الآلي ${newRowWithId.atmCode} بنجاح.`,
        });
    }
    setEditingRow(null);
    setIsNewDialogOpen(false); // Close dialog after saving
  };

  const openDeleteDialog = (row: ATMData) => {
    setRowToDelete(row);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!rowToDelete) return;
    setData(data.filter(d => d.id !== rowToDelete.id));
    toast({
        title: "تم الحذف",
        description: "تم حذف بيانات الصراف الآلي بنجاح.",
    });
    setRowToDelete(null);
    setIsDeleteDialogOpen(false);
  }
  
  const handleEditClick = (row: ATMData) => {
    setEditingRow(row);
    setIsNewDialogOpen(true);
  };
  
  const handleAddNewClick = () => {
    setEditingRow({id: '', bankName: '', startDate: '', governorate: '', city: '', atmModel: '', atmSerial: '', atmCode: '', atmAddress: ''});
    setIsNewDialogOpen(true);
  };


  const columns: ColumnDef<ATMData>[] = [
    {
      accessorKey: 'bankName',
      header: 'اسم البنك',
    },
    {
      accessorKey: 'startDate',
      header: 'تاريخ البداء',
      cell: ({ row }) => {
        const dateValue = row.getValue('startDate') as string;
        if (!dateValue) return '';
        const parsedDate = parseISO(dateValue);
        return isValid(parsedDate) ? format(parsedDate, 'dd/MM/yyyy') : '';
      },
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
      accessorKey: 'atmModel',
      header: 'موديل المكينة',
    },
    {
      accessorKey: 'atmSerial',
      header: 'سريل المكينة',
    },
    {
      accessorKey: 'atmCode',
      header: 'كود المكينة',
    },
    {
      accessorKey: 'atmAddress',
      header: 'عنوان المكينة',
    },
    {
      id: 'actions',
      header: 'تعديل',
      cell: ({ row }) => (
        <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" onClick={() => handleEditClick(row.original)} suppressHydrationWarning>
                <Pencil className="h-4 w-4" />
            </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => openDeleteDialog(row.original)} suppressHydrationWarning>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="w-full p-4 md:p-8" suppressHydrationWarning>
      <Dialog open={isNewDialogOpen} onOpenChange={(isOpen) => {
          setIsNewDialogOpen(isOpen);
          if (!isOpen) {
              setEditingRow(null);
          }
      }}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="flex flex-col gap-2">
                <Label htmlFor="bank-select" className="text-sm font-medium">البنك</Label>
                <Select value={selectedBank} onValueChange={(value) => {
                  setSelectedBank(value);
                  table.getColumn('bankName')?.setFilterValue(value === 'all' ? '' : value);
                }}>
                  <SelectTrigger id="bank-select" suppressHydrationWarning><SelectValue placeholder="أختار البنك" /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {banksList.map((bankName) => (
                          <SelectItem key={bankName} value={bankName}>{bankName}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
             </div>
             <div className="flex flex-col gap-2">
                <Label htmlFor="governorate-select" className="text-sm font-medium">المحافظة</Label>
                <Select value={selectedGovernorate} onValueChange={(value) => {
                  setSelectedGovernorate(value);
                  setSelectedCity('all'); // إعادة تعيين اختيار المدينة عند تغيير المحافظة
                  table.getColumn('governorate')?.setFilterValue(value === 'all' ? '' : value);
                  table.getColumn('city')?.setFilterValue(''); // مسح فلتر المدينة
                }}>
                  <SelectTrigger id="governorate-select" suppressHydrationWarning><SelectValue placeholder="أختار المحافظة" /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {governorates.map(gov => (
                          <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
             </div>
             <div className="flex flex-col gap-2">
                <Label htmlFor="city-select" className="text-sm font-medium">المدينة</Label>
                <Select value={selectedCity} onValueChange={(value) => {
                  setSelectedCity(value);
                  table.getColumn('city')?.setFilterValue(value === 'all' ? '' : value);
                }}>
                  <SelectTrigger id="city-select" suppressHydrationWarning><SelectValue placeholder="أختار المدينة" /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
             </div>
             <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">البحث في</Label>
                <p className="text-sm text-muted-foreground">ATMCode - ATMSerial - ATMAddress - ATMModel</p>
             </div>
          </div>
          {(selectedBank !== 'all' || selectedGovernorate !== 'all' || selectedCity !== 'all') && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSelectedBank('all');
                  setSelectedGovernorate('all');
                  setSelectedCity('all');
                  table.getColumn('bankName')?.setFilterValue('');
                  table.getColumn('governorate')?.setFilterValue('');
                  table.getColumn('city')?.setFilterValue('');
                }}
                className="h-8"
                suppressHydrationWarning
              >
                <X className="ml-2 h-4 w-4" /> مسح جميع الفلاتر
              </Button>
              <div className="text-sm text-muted-foreground">
                {selectedBank !== 'all' && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md mr-1">البنك: {selectedBank}</span>}
                {selectedGovernorate !== 'all' && <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md mr-1">المحافظة: {selectedGovernorate}</span>}
                {selectedCity !== 'all' && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md mr-1">المدينة: {selectedCity}</span>}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="بحث في الماكينات..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="w-full pr-10"
                suppressHydrationWarning
              />
            </div>
            <div className="flex gap-2">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleAddNewClick} suppressHydrationWarning>
                    <PlusCircle className="ml-2 h-4 w-4" /> إضافة
                </Button>
                <Button variant="outline" className="bg-orange-500 hover:bg-orange-600 text-white" suppressHydrationWarning>
                    <Download className="ml-2 h-4 w-4" /> تصدير
                </Button>
            </div>
          </div>
        </div>

        <div className="rounded-md border mt-4">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <Button
                            variant="ghost"
                            onClick={() => header.column.toggleSorting(header.column.getIsSorted() === 'asc')}
                            suppressHydrationWarning
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <CaretSortIcon className="mr-2 h-4 w-4" />
                        </Button>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
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
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    لا توجد نتائج.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between space-x-2 py-4">
           <div className="flex-1 text-sm text-muted-foreground">
             صفحة {table.getState().pagination.pageIndex + 1} من {table.getPageCount()} ({table.getFilteredRowModel().rows.length} عنصر)
          </div>
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-1">
                <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                suppressHydrationWarning
                >
                &lt;&lt;
                </Button>
                <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                suppressHydrationWarning
                >
                &lt;
                </Button>
             </div>
            <div className="flex items-center gap-1">
              {isMounted && Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                const pageIndex = Math.max(0, Math.min(table.getState().pagination.pageIndex - 2, table.getPageCount() - 5)) + i;
                if (pageIndex >= table.getPageCount()) return null;
                return (
                  <Button
                    key={pageIndex}
                    variant={table.getState().pagination.pageIndex === pageIndex ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => table.setPageIndex(pageIndex)}
                    suppressHydrationWarning
                  >
                    {pageIndex + 1}
                  </Button>
                );
              })}
            </div>
             <div className="flex items-center gap-1">
                <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                suppressHydrationWarning
                >
                &gt;
                </Button>
                 <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                suppressHydrationWarning
                >
                &gt;&gt;
                </Button>
            </div>
            <Select
                onValueChange={(value) => {
                    table.setPageSize(Number(value))
                }}
                defaultValue={`${table.getState().pagination.pageSize}`}
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
                إجمالي العناصر
            </div>
          </div>
        </div>
        
        {editingRow && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRow.id ? 'تعديل' : 'إضافة'} بيانات الماكينات</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bank" className="text-right">أختار البنك</Label>
                   <Select value={editingRow.bankName} onValueChange={(value) => setEditingRow({...editingRow, bankName: value})}>
                      <SelectTrigger className="col-span-3"><SelectValue placeholder="أختار اسم البنك" /></SelectTrigger>
                      <SelectContent>
                          {banks.map(bank => (
                              <SelectItem key={bank.id} value={bank.nameAr}>{bank.nameAr}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">تاريخ البدء</Label>
                  <div className="col-span-3">
                      <DatePicker 
                        date={editingRow.startDate && isValid(parseISO(editingRow.startDate)) ? parseISO(editingRow.startDate) : undefined}
                        onSelectDate={(date) => setEditingRow({...editingRow, startDate: date?.toISOString() ?? ''})}
                      />
                  </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="governorate" className="text-right">أختار المحافظة</Label>
                  <Select value={editingRow.governorate} onValueChange={(value) => setEditingRow({...editingRow, governorate: value})}>
                      <SelectTrigger className="col-span-3"><SelectValue placeholder="أختار المحافظة" /></SelectTrigger>
                      <SelectContent>
                          {governorates.map(gov => (
                                <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                            ))}
                      </SelectContent>
                  </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="city" className="text-right">أختار المدينة</Label>
                  <Select value={editingRow.city} onValueChange={(value) => setEditingRow({...editingRow, city: value})}>
                      <SelectTrigger className="col-span-3"><SelectValue placeholder="أختار المدينة" /></SelectTrigger>
                      <SelectContent>
                          {cities.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="atmModel" className="text-right">موديل المكينة</Label>
                  <Input id="atmModel" value={editingRow.atmModel} onChange={(e) => setEditingRow({...editingRow, atmModel: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="atmSerial" className="text-right">تسلسل المكينة</Label>
                  <Input id="atmSerial" value={editingRow.atmSerial} onChange={(e) => setEditingRow({...editingRow, atmSerial: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="atmCode" className="text-right">كود المكينة</Label>
                  <Input id="atmCode" value={editingRow.atmCode} onChange={(e) => setEditingRow({...editingRow, atmCode: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="atmAddress" className="text-right">عنوان المكينة</Label>
                  <Input id="atmAddress" value={editingRow.atmAddress} onChange={(e) => setEditingRow({...editingRow, atmAddress: e.target.value})} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
               <Button onClick={handleUpdate} type="submit" className="bg-orange-500 hover:bg-orange-600 text-white"><Save className="ml-2 h-4 w-4" /> حفظ</Button>
              <DialogClose asChild>
                  <Button variant="ghost">إلغاء</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف بيانات الصراف الآلي بشكل دائم.
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
