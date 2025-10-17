'use client';
import * as React from 'react';
import {
  Column,
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
import { Label } from '@/components/ui/label';
import { PlusCircle, Download, Trash2, Save, Filter, Pencil } from 'lucide-react';
import type { City } from '@/lib/types';
import { governorates } from '@/lib/data';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

type CityRow = City & { governorateName: string };

const allCities: CityRow[] = governorates.flatMap(gov => 
    gov.cities.map(city => ({
        ...city,
        governorateName: gov.nameAr,
    }))
);

function FilterComponent({ column }: { column: Column<CityRow, unknown> }) {
    const [filterValue, setFilterValue] = React.useState((column.getFilterValue() as string) ?? '');

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            column.setFilterValue(filterValue);
        }, 300);
        return () => clearTimeout(timeout);
    }, [filterValue, column]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Filter size={14}/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2 w-48" align="start">
                <Input
                    placeholder={`Filter ${column.id}...`}
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full"
                />
            </PopoverContent>
        </Popover>
    );
}

export default function CityDataPage() {
  const { toast } = useToast();
  const [data, setData] = React.useState<CityRow[]>(allCities);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingCity, setEditingCity] = React.useState<CityRow | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [rowToDelete, setRowToDelete] = React.useState<CityRow | null>(null);

  const [newCityData, setNewCityData] = React.useState({
    governorateId: '',
    nameAr: '',
    nameEn: '',
  });

 const handleSaveRow = () => {
    if (!editingCity || !editingCity.nameAr || !editingCity.nameEn) {
        toast({
            variant: "destructive",
            title: "خطأ",
            description: "لا يمكن ترك حقول الاسم فارغة.",
        });
        return;
    }
    
    setData(prev => prev.map(r => r.id === editingCity.id ? editingCity : r));
    toast({
        title: "تم الحفظ",
        description: `تم تحديث بيانات مدينة "${editingCity.nameAr}" بنجاح.`,
    });
    setIsEditDialogOpen(false);
    setEditingCity(null);
  };


  const handleAddNewCity = () => {
    if (!newCityData.governorateId || !newCityData.nameAr || !newCityData.nameEn) {
        toast({
            variant: "destructive",
            title: "خطأ",
            description: "يرجى ملء جميع الحقول.",
        });
        return;
    }
    const selectedGov = governorates.find(g => g.id === newCityData.governorateId);
    if (!selectedGov) return;

    const newCity: CityRow = {
        id: `city-${Date.now()}`,
        nameAr: newCityData.nameAr,
        nameEn: newCityData.nameEn,
        governorateName: selectedGov.nameAr,
    };
    
    setData(prev => [newCity, ...prev]);
    toast({
        title: "تمت الإضافة",
        description: `تمت إضافة مدينة "${newCity.nameAr}" بنجاح.`
    });
    
    setNewCityData({ governorateId: '', nameAr: '', nameEn: '' });
    setIsAddDialogOpen(false);
  }
  
  const openDeleteDialog = (row: CityRow) => {
    setRowToDelete(row);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!rowToDelete) return;
    setData(prev => prev.filter(row => row.id !== rowToDelete.id));
    toast({
        title: "تم الحذف",
        description: `تم حذف مدينة "${rowToDelete.nameAr}" بنجاح.`,
    });
    setRowToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const openEditDialog = (city: CityRow) => {
    setEditingCity(city);
    setIsEditDialogOpen(true);
  }

const columns: ColumnDef<CityRow>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => (
        <div className="flex items-center gap-1">
            الكود
            <FilterComponent column={column} />
        </div>
    ),
    cell: ({ row }) => <span>{row.original.id}</span>
  },
  {
    accessorKey: 'governorateName',
    header: ({ column }) => (
        <div className="flex items-center gap-1">
            اسم المحافظة
            <FilterComponent column={column} />
        </div>
    ),
     cell: ({ row }) => <span>{row.original.governorateName}</span>
  },
  {
    accessorKey: 'nameAr',
    header: ({ column }) => (
        <div className="flex items-center gap-1">
            الاسم العربي
            <FilterComponent column={column} />
        </div>
    ),
    cell: ({ row }) => <span>{row.original.nameAr}</span>
  },
  {
    accessorKey: 'nameEn',
    header: ({ column }) => (
        <div className="flex items-center gap-1">
            الاسم الانجليزي
            <FilterComponent column={column} />
        </div>
    ),
     cell: ({ row }) => <span>{row.original.nameEn}</span>
  },
  {
    id: 'actions',
    header: 'تعديل',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" onClick={() => openEditDialog(row.original)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => openDeleteDialog(row.original)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];


  const uniqueGovernorates = React.useMemo(() => {
    const govSet = new Set(allCities.map(city => city.governorateName));
    return Array.from(govSet);
  }, []);
  
  const citiesInSelectedGovernorate = React.useMemo(() => {
    const selectedGovernorateFilter = columnFilters.find(f => f.id === 'governorateName');
    const selectedGovernorate = selectedGovernorateFilter ? selectedGovernorateFilter.value as string : '';

    if (!selectedGovernorate) {
        const uniqueCities = new Set(allCities.map(c => c.nameAr));
        return Array.from(uniqueCities);
    }
    const citySet = new Set(allCities.filter(c => c.governorateName === selectedGovernorate).map(city => city.nameAr));
    return Array.from(citySet);
}, [columnFilters]);


  const table = useReactTable({
    data,
    columns,
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
    meta: {
        updateData: (rowIndex: number, columnId: string, value: unknown) => {
          setData(old =>
            old.map((row, index) => {
              if (index === rowIndex) {
                return {
                  ...old[rowIndex]!,
                  [columnId]: value,
                }
              }
              return row
            })
          )
        },
      },
  });

  const handleGovernorateChange = (value: string) => {
    table.getColumn('governorateName')?.setFilterValue(value === 'all' ? '' : value);
    table.getColumn('nameAr')?.setFilterValue('');
  }
  
  const handleCityChange = (value: string) => {
    table.getColumn('nameAr')?.setFilterValue(value === 'all' ? '' : value);
  }

  return (
    <div className="w-full p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row w-full gap-4">
               <Select 
                  onValueChange={handleGovernorateChange}
                  value={table.getColumn('governorateName')?.getFilterValue() as string ?? ''}
               >
                  <SelectTrigger className="max-w-sm">
                      <SelectValue placeholder="أختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {uniqueGovernorates.map(gov => (
                          <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
              <Select 
                  onValueChange={handleCityChange}
                  value={table.getColumn('nameAr')?.getFilterValue() as string ?? ''}
              >
                  <SelectTrigger className="max-w-sm">
                      <SelectValue placeholder="أختر المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {citiesInSelectedGovernorate.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </div>
          <div className="flex gap-2 self-end">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                          <PlusCircle className="ml-2 h-4 w-4" /> إضافة
                      </Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>إضافة مدينة</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                           <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="governorate" className="text-right">المحافظة</Label>
                              <Select onValueChange={(value) => setNewCityData({...newCityData, governorateId: value})}>
                                  <SelectTrigger className="col-span-3">
                                      <SelectValue placeholder="أختر المحافظة" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {governorates.map(gov => (
                                          <SelectItem key={gov.id} value={gov.id}>{gov.nameAr}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="nameAr" className="text-right">الاسم العربي</Label>
                              <Input id="nameAr" className="col-span-3" value={newCityData.nameAr} onChange={(e) => setNewCityData({...newCityData, nameAr: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="nameEn" className="text-right">الاسم الانجليزي</Label>
                              <Input id="nameEn" className="col-span-3" value={newCityData.nameEn} onChange={(e) => setNewCityData({...newCityData, nameEn: e.target.value})} />
                          </div>
                      </div>
                      <DialogFooter>
                          <Button onClick={handleAddNewCity} type="submit" className="bg-orange-500 hover:bg-orange-600 text-white"><Save className="ml-2 h-4 w-4" /> إضافة</Button>
                          <DialogClose asChild>
                              <Button variant="ghost">إلغاء</Button>
                          </DialogClose>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>
              <Button variant="outline" className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Download className="ml-2 h-4 w-4" /> تصدير
              </Button>
          </div>
      </div>

      <div className="rounded-md border mt-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
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
           Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ({table.getFilteredRowModel().rows.length} items)
        </div>
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-1">
              <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              >
              {'<<'}
              </Button>
              <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              >
              {'<'}
              </Button>
           </div>
          <div className="flex items-center gap-1">
            {[...Array(table.getPageCount())].slice(0, 5).map((_, i) => (
              <Button
                key={i}
                variant={table.getState().pagination.pageIndex === i ? 'default' : 'outline'}
                size="sm"
                onClick={() => table.setPageIndex(i)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
           <div className="flex items-center gap-1">
              <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              >
              {'>'}
              </Button>
               <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              >
              {'>>'}
              </Button>
          </div>
        </div>
      </div>
        
      {editingCity && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>تعديل مدينة</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-governorate" className="text-right">المحافظة</Label>
                        <Input id="edit-governorate" className="col-span-3" value={editingCity.governorateName} disabled />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-nameAr" className="text-right">الاسم العربي</Label>
                        <Input 
                            id="edit-nameAr" 
                            className="col-span-3" 
                            value={editingCity.nameAr} 
                            onChange={(e) => setEditingCity({...editingCity, nameAr: e.target.value})} 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-nameEn" className="text-right">الاسم الانجليزي</Label>
                        <Input 
                            id="edit-nameEn" 
                            className="col-span-3" 
                            value={editingCity.nameEn}
                            onChange={(e) => setEditingCity({...editingCity, nameEn: e.target.value})} 
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSaveRow} type="submit" className="bg-orange-500 hover:bg-orange-600 text-white"><Save className="ml-2 h-4 w-4" /> حفظ التغييرات</Button>
                    <DialogClose asChild>
                        <Button variant="ghost">إلغاء</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف المدينة بشكل دائم.
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
