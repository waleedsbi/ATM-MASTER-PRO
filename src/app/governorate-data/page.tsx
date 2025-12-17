'use client';
import * as React from 'react';
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
  getExpandedRowModel,
  ExpandedState,
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
import { Label } from '@/components/ui/label';
import { PlusCircle, Download, Trash2, Save, Filter, ChevronDown, ChevronRight, Search } from 'lucide-react';
import type { Governorate, City } from '@/lib/types';

const cityColumns: ColumnDef<City>[] = [
    {
        accessorKey: 'id',
        header: () => <div className="flex items-center gap-1">الكود <Filter size={14}/></div>,
    },
    {
        accessorKey: 'nameAr',
        header: () => <div className="flex items-center gap-1">الاسم العربي <Filter size={14}/></div>,
    },
    {
        accessorKey: 'nameEn',
        header: () => <div className="flex items-center gap-1">الاسم الانجليزي <Filter size={14}/></div>,
    }
];

const SubTable = ({ cities }: { cities: City[] }) => {
    const table = useReactTable({
        data: cities,
        columns: cityColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="p-4 bg-muted/50">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
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
                                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={cityColumns.length} className="h-24 text-center">
                                لا توجد مدن.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

export default function GovernorateDataPage() {
  const [data, setData] = React.useState<Governorate[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  React.useEffect(() => {
    // جلب المحافظات من قاعدة البيانات عبر API
    (async () => {
      try {
        const res = await fetch('/api/governorates', { cache: 'no-store' });
        if (res.ok) {
          const govs = await res.json();
          if (Array.isArray(govs)) {
            setData(govs);
          }
        }
      } catch (e) {
        console.error('Error fetching governorates:', e);
      }
    })();
  }, []);

  const columns: ColumnDef<Governorate>[] = [
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => {
        return row.getCanExpand() ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={row.getToggleExpandedHandler()}
          >
            {row.getIsExpanded() ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </Button>
        ) : null;
      },
    },
    {
      accessorKey: 'id',
      header: () => <div className="flex items-center gap-1">كود المحافظة <Filter size={14}/></div>,
    },
    {
      accessorKey: 'nameAr',
      header: 'الاسم العربي',
    },
    {
      accessorKey: 'nameEn',
      header: 'الاسم الانجليزي',
    },
    {
      id: 'actions',
      header: 'تعديل',
      cell: () => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700">
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
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
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: row => row.original.cities && row.original.cities.length > 0,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      expanded,
    },
  });

  return (
    <div className="w-full p-4 md:p-8">
      <Dialog>
        <div className="flex items-center justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="بحث في المحافظات..."
                value={(table.getColumn('nameAr')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                  table.getColumn('nameAr')?.setFilterValue(event.target.value)
                }
                className="w-full pr-10"
                suppressHydrationWarning
              />
            </div>
            <div className="flex gap-2">
                <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                        <PlusCircle className="ml-2 h-4 w-4" /> إضافة
                    </Button>
                </DialogTrigger>
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
                    <React.Fragment key={row.id}>
                        <TableRow>
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                        {row.getIsExpanded() && (
                            <TableRow>
                                <TableCell colSpan={columns.length}>
                                    <SubTable cities={row.original.cities} />
                                </TableCell>
                            </TableRow>
                        )}
                    </React.Fragment>
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
            <div className="text-sm text-muted-foreground">
                Items Total
            </div>
          </div>
        </div>
        
        <DialogContent>
            <DialogHeader>
                <DialogTitle>إضافة محافظة</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nameAr" className="text-right">الاسم العربي</Label>
                    <Input id="nameAr" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nameEn" className="text-right">الاسم الانجليزي</Label>
                    <Input id="nameEn" className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
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
