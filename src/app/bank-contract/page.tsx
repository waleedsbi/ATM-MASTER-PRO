'use client';
import * as React from 'react';
import { CaretSortIcon } from '@radix-ui/react-icons';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BankContract } from '@/lib/types';
import { bankContracts } from '@/lib/data';
import { PlusCircle, FileDown, Trash2, Pencil, Save, File, Download, CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { banks } from '@/lib/data';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const columns: ColumnDef<BankContract>[] = [
  {
    accessorKey: 'bankName',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        أسم البنك
        <CaretSortIcon className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue('bankName')}</div>,
  },
  {
    accessorKey: 'startDate',
    header: 'تاريخ البداء',
    cell: ({ row }) => <div>{format(parseISO(row.getValue('startDate')), 'P')}</div>,
  },
    {
    accessorKey: 'endDate',
    header: 'تاريخ الانتهاء',
    cell: ({ row }) => <div>{format(parseISO(row.getValue('endDate')), 'P')}</div>,
  },
  {
    accessorKey: 'machineNumber',
    header: 'رقم المكينة',
    cell: ({ row }) => <div>{row.getValue('machineNumber')}</div>,
  },
  {
    accessorKey: 'contractValue',
    header: 'قيمة العقد',
    cell: ({ row }) => <div>{new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(row.getValue('contractValue'))}</div>,
  },
  {
    accessorKey: 'statement',
    header: 'البيان',
    cell: ({ row }) => <div>{row.getValue('statement')}</div>,
  },
  {
    accessorKey: 'fileUrl',
    header: 'الملف',
    cell: ({ row }) => (
       <Button variant="ghost" size="icon" asChild>
        <a href={row.getValue('fileUrl')} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4" />
        </a>
       </Button>
    ),
  },
  {
    id: 'actions',
    header: "تعديل",
    enableHiding: false,
    cell: () => {
      return (
        <div className="flex gap-2">
            <DialogTrigger asChild>
                 <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      );
    },
  },
];

export default function BankContractsPage() {
  const [data, setData] = React.useState<BankContract[]>(bankContracts);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [startDate, setStartDate] = React.useState<Date>();
  const [endDate, setEndDate] = React.useState<Date>();

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <div className="w-full p-4 md:p-8">
       <Dialog>
        <div className="flex items-center justify-between py-4">
            <div>
                 <h2 className="text-3xl font-bold tracking-tight font-headline">بيانات عقود البنك</h2>
                 <p className="text-muted-foreground">
                    إدارة عقود البنوك في النظام.
                 </p>
            </div>
        </div>
        <div className="flex items-center justify-between gap-2">
            <Input
            placeholder="البحث..."
            value={(table.getColumn('bankName')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
                table.getColumn('bankName')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            />
            <div className="flex gap-2">
                <DialogTrigger asChild>
                    <Button><PlusCircle className="ml-2 h-4 w-4"/> إضافة</Button>
                </DialogTrigger>
                <Button variant="outline"><FileDown className="ml-2 h-4 w-4"/> تصدير</Button>
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
                {table.getFilteredRowModel().rows.length} من العقود
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
       
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add Contract</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bankName" className="text-right">أختار البنك</Label>
                <Select>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Choose BankCode" /></SelectTrigger>
                    <SelectContent>
                        {banks.map(bank => (
                            <SelectItem key={bank.id} value={bank.id}>{bank.nameAr}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">تاريخ البداء</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="ml-auto h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span></span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">تاريخ الانتهاء</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="ml-auto h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span></span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="machineNumber" className="text-right">رقم المكينة</Label>
                <Input id="machineNumber" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contractValue" className="text-right">قيمة العقد</Label>
                <Input id="contractValue" type="number" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="statement" className="text-right pt-2">البيان</Label>
                <Textarea id="statement" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file" className="text-right">الملف</Label>
                <div className="col-span-3">
                    <Button asChild variant="outline"><Label htmlFor="file-upload">Choose</Label></Button>
                    <Input id="file-upload" type="file" className="hidden" />
                </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0 justify-start">
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white"><Save className="ml-2 h-4 w-4" /> إضافة</Button>
            <DialogClose asChild>
                <Button variant="ghost">إلغاء</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
