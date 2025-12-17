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
import type { Bank } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PlusCircle, FileDown, Trash2, Pencil, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";

const getLogoUrl = (logoId: string) => {
  if (!logoId) return "";
  return PlaceHolderImages.find(img => img.id === logoId)?.imageUrl;
};


export default function BanksPage() {
  const { toast } = useToast();
  const [data, setData] = React.useState<Bank[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [bankToDelete, setBankToDelete] = React.useState<Bank | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newBank, setNewBank] = React.useState({
    nameAr: '',
    nameEn: '',
    governorate: '',
    city: '',
    address: '',
    mobile: '',
    phone: '',
    email: '',
    statement: '',
    logo: null as File | null,
  });

  React.useEffect(() => {
    // جلب بيانات البنوك من قاعدة البيانات عبر API
    (async () => {
      try {
        const res = await fetch('/api/banks', { cache: 'no-store' });
        if (res.ok) {
          const banks = await res.json();
          if (Array.isArray(banks)) {
            setData(banks);
          }
        } else {
          console.error('Failed to fetch banks, status:', res.status);
        }
      } catch (e) {
        console.error('Error fetching banks:', e);
      }
    })();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewBank(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setNewBank(prev => ({ ...prev, [id]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewBank(prev => ({ ...prev, logo: e.target.files![0] }));
    }
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBank.nameAr) {
        toast({
            variant: "destructive",
            title: "خطأ",
            description: "الاسم العربي حقل مطلوب.",
        });
        return;
    }

    try {
      const res = await fetch('/api/banks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nameAr: newBank.nameAr,
          nameEn: newBank.nameEn,
          governorate: newBank.governorate,
          city: newBank.city,
          address: newBank.address,
          mobile: newBank.mobile,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'فشل حفظ البنك');
      }

      const created = await res.json();
      setData(prev => [created, ...prev]);
      toast({
        title: "تمت الإضافة بنجاح",
        description: `تمت إضافة بنك "${newBank.nameAr}" بنجاح.`,
      });
    } catch (error) {
      console.error('Error creating bank:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ البنك",
      });
      return;
    }
    setNewBank({
      nameAr: '', nameEn: '', governorate: '', city: '', address: '', mobile: '', phone: '', email: '', statement: '', logo: null
    });
    setIsAddDialogOpen(false);
  };


  const openDeleteDialog = (bank: Bank) => {
    setBankToDelete(bank);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (bankToDelete) {
      (async () => {
        try {
          const res = await fetch(`/api/banks?id=${bankToDelete.id}`, {
            method: 'DELETE',
          });
          if (!res.ok) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.error || 'فشل حذف البنك');
          }
          setData(prev => prev.filter((bank) => bank.id !== bankToDelete.id));
          toast({
            title: "تم الحذف",
            description: `تم حذف بنك "${bankToDelete.nameAr}" بنجاح.`,
          });
        } catch (error) {
          console.error('Error deleting bank:', error);
          toast({
            variant: "destructive",
            title: "خطأ",
            description: error instanceof Error ? error.message : "حدث خطأ أثناء حذف البنك",
          });
        } finally {
          setIsDeleteDialogOpen(false);
          setBankToDelete(null);
        }
      })();
    }
  };
  
  const columns: ColumnDef<Bank>[] = [
  {
    accessorKey: 'nameAr',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        الاسم العربي
        <CaretSortIcon className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue('nameAr')}</div>,
  },
  {
    accessorKey: 'nameEn',
    header: 'الاسم الانجليزي',
    cell: ({ row }) => <div>{row.getValue('nameEn')}</div>,
  },
    {
    accessorKey: 'governorate',
    header: 'أسم المحافظة',
    cell: ({ row }) => <div>{row.getValue('governorate')}</div>,
  },
  {
    accessorKey: 'city',
    header: 'أسم المدينة',
    cell: ({ row }) => <div>{row.getValue('city')}</div>,
  },
  {
    accessorKey: 'address',
    header: 'العنوان',
    cell: ({ row }) => <div>{row.getValue('address')}</div>,
  },
  {
    accessorKey: 'mobile',
    header: 'الموبيل',
    cell: ({ row }) => <div>{row.getValue('mobile')}</div>,
  },
  {
    accessorKey: 'logoId',
    header: 'الشعار',
    cell: ({ row }) => (
       <Avatar>
          <AvatarImage src={getLogoUrl(row.original.logoId)} data-ai-hint="bank logo" />
          <AvatarFallback>{row.original.nameAr.charAt(0)}</AvatarFallback>
        </Avatar>
    ),
  },
  {
    id: 'actions',
    header: "تعديل",
    enableHiding: false,
    cell: ({ row }) => {
      const bank = row.original;
      return (
        <div className="flex gap-2">
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => openDeleteDialog(bank)}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
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
    const headers = ['الاسم العربي', 'الاسم الانجليزي', 'المحافظة', 'المدينة', 'العنوان', 'الموبايل'];
    const visibleRows = table.getFilteredRowModel().rows;
    const csvContent = [
      headers.join(','),
      ...visibleRows.map(row => {
        const { nameAr, nameEn, governorate, city, address, mobile } = row.original;
        return [nameAr, nameEn, governorate, city, address, mobile].join(',');
      })
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
        URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = `banks_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="w-full p-4 md:p-8">
       <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <div className="flex items-center justify-between py-4">
            <div>
                 <h2 className="text-3xl font-bold tracking-tight font-headline">بيانات البنوك</h2>
                 <p className="text-muted-foreground">
                    إدارة بيانات البنوك في النظام.
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
                <DialogTrigger asChild>
                    <Button><PlusCircle className="ml-2 h-4 w-4"/> إضافة</Button>
                </DialogTrigger>
                <Button variant="outline" onClick={exportToCsv}><FileDown className="ml-2 h-4 w-4"/> تصدير</Button>
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
       
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>إضافة بنك</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBank}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
              <div className="grid gap-2">
                  <Label htmlFor="nameAr">الاسم العربي <span className="text-red-500">*</span></Label>
                  <Input id="nameAr" value={newBank.nameAr} onChange={handleInputChange} />
              </div>
               <div className="grid gap-2">
                  <Label htmlFor="nameEn">الاسم الانجليزي</Label>
                  <Input id="nameEn" value={newBank.nameEn} onChange={handleInputChange}/>
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="governorate">أختار المحافظة</Label>
                  <Select onValueChange={(value) => handleSelectChange('governorate', value)} value={newBank.governorate}>
                      <SelectTrigger><SelectValue placeholder="أختار أسم المحافظة" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="cairo">القاهرة</SelectItem>
                          <SelectItem value="giza">الجيزة</SelectItem>
                          <SelectItem value="alex">الإسكندرية</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="city">أختار المدينة</Label>
                  <Select onValueChange={(value) => handleSelectChange('city', value)} value={newBank.city}>
                      <SelectTrigger><SelectValue placeholder="أختار اسم المدينة" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="nasr_city">مدينة نصر</SelectItem>
                          <SelectItem value="maadi">المعادي</SelectItem>
                          <SelectItem value="heliopolis">مصر الجديدة</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="address">العنوان</Label>
                  <Input id="address" value={newBank.address} onChange={handleInputChange}/>
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="mobile">موبيل البنك</Label>
                  <Input id="mobile" value={newBank.mobile} onChange={handleInputChange}/>
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="phone">تليفون البنك</Label>
                  <Input id="phone" value={newBank.phone} onChange={handleInputChange}/>
              </div>
               <div className="grid gap-2">
                  <Label htmlFor="email">أميل البنك</Label>
                  <Input id="email" type="email" value={newBank.email} onChange={handleInputChange}/>
              </div>
               <div className="grid gap-2">
                  <Label htmlFor="statement">البيان</Label>
                  <Textarea id="statement" value={newBank.statement} onChange={handleInputChange}/>
              </div>
              <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="logo">الشعار</Label>
                  <Input id="logo" type="file" onChange={handleFileChange} />
              </div>
            </div>
            <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
              <Button type="submit"><Save className="ml-2 h-4 w-4" /> إضافة</Button>
              <DialogClose asChild>
                  <Button variant="outline">إلغاء</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف البنك بشكل دائم من خوادمنا.
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
