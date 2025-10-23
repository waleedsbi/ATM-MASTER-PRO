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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  Image as ImageIcon,
  Check,
  ThumbsDown,
  Search,
} from 'lucide-react';
import type { WorkPlanReport, WorkPlanReportStatus } from '@/lib/types';
import { workPlanReports, governorates } from '@/lib/data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function BankPlanReportPage() {
  const [data, setData] = React.useState<WorkPlanReport[]>(workPlanReports);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const { toast } = useToast();

  const handleStatusChange = (id: string, status: WorkPlanReportStatus) => {
    setData(currentData => currentData.map(item => item.id === id ? { ...item, status } : item));
    toast({
        title: `تم تحديث الحالة`,
        description: `تم تغيير حالة التقرير إلى "${status}".`,
    })
  };

  const statusVariant: { [key in WorkPlanReportStatus]: 'default' | 'secondary' | 'destructive' } = {
      Accepted: 'default',
      Pending: 'secondary',
      Rejected: 'destructive',
  };

  const columns: ColumnDef<WorkPlanReport>[] = [
    {
      accessorKey: 'startDate',
      header: 'تاريخ البداء',
      cell: ({ row }) => format(parseISO(row.getValue('startDate')), 'dd/MM/yyyy'),
    },
    {
      accessorKey: 'orderNumber',
      header: 'ORDER NUMBER',
    },
    {
      accessorKey: 'atmModel',
      header: 'موديل المكينة',
      cell: ({row}) => {
          // Mocking ATM model from serial
          const serial = row.original.atmSerial as string;
          if (serial.includes('Branch')) return 'Branch ATM';
          return 'Standalone';
      }
    },
    {
      accessorKey: 'atmCode',
      header: 'كود المكينة',
    },
    {
      accessorKey: 'atmSerial',
      header: 'سريل المكينة',
    },
    {
        accessorKey: 'status',
        header: 'الحالة',
        cell: ({ row }) => {
            const status = row.getValue('status') as WorkPlanReportStatus;
            return <Badge variant={statusVariant[status]}>{status}</Badge>;
        }
    },
    {
      id: 'image',
      header: 'الصورة',
      cell: () => (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="bg-blue-500 hover:bg-blue-600 text-white" suppressHydrationWarning>
              <ImageIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
              <DialogHeader>
                  <DialogTitle>Image Preview</DialogTitle>
              </DialogHeader>
               <div className="flex justify-center items-center">
                  <Image src="https://picsum.photos/seed/1/400/300" alt="Report Image" width={400} height={300} className="rounded-md" />
              </div>
          </DialogContent>
        </Dialog>
      ),
    },
    {
      id: 'accept',
      header: 'قبول',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleStatusChange(row.original.id, 'Accepted')} suppressHydrationWarning>
          <Check className="h-4 w-4" />
        </Button>
      ),
    },
    {
      id: 'reject',
      header: 'رفض',
      cell: ({ row }) => (
        <Dialog>
          <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-red-500 hover:bg-red-600 text-white" onClick={() => handleStatusChange(row.original.id, 'Rejected')} suppressHydrationWarning>
                  <ThumbsDown className="h-4 w-4" />
              </Button>
          </DialogTrigger>
          <DialogContent>
              <DialogHeader><DialogTitle>سبب الرفض</DialogTitle></DialogHeader>
              <Input placeholder="اكتب سبب الرفض هنا..." suppressHydrationWarning />
              <Button suppressHydrationWarning>إرسال</Button>
          </DialogContent>
        </Dialog>
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
    state: {
      sorting,
      columnFilters,
    },
     initialState: {
        pagination: {
            pageSize: 5,
        },
    }
  });

  const getAtmModel = (serial: string) => {
    if (serial.includes('Branch')) return 'Branch ATM';
    return 'Standalone';
  };
  
  const exportToCsv = () => {
    const headers = ['تاريخ البداء', 'ORDER NUMBER', 'موديل المكينة', 'كود المكينة', 'سريل المكينة'];
    const visibleRows = table.getFilteredRowModel().rows;
    const csvContent = [
      headers.join(','),
      ...visibleRows.map(row => {
        const { startDate, orderNumber, atmSerial, atmCode } = row.original;
        const atmModel = getAtmModel(atmSerial);
        const formattedDate = format(parseISO(startDate), 'yyyy-MM-dd');
        return [formattedDate, orderNumber, atmModel, atmCode, atmSerial].join(',');
      })
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
        URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = `bank_plan_reports_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="w-full p-4 md:p-8">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select>
            <SelectTrigger suppressHydrationWarning>
              <SelectValue placeholder="أختار المحافظة" />
            </SelectTrigger>
            <SelectContent>
              {governorates.map((gov) => (
                <SelectItem key={gov.id} value={gov.nameAr}>
                  {gov.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger suppressHydrationWarning>
              <SelectValue placeholder="أختار المدينة" />
            </SelectTrigger>
            <SelectContent>
              {governorates
                .flatMap((g) => g.cities)
                .map((city) => (
                  <SelectItem key={city.id} value={city.nameAr}>
                    {city.nameAr}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)}>
            <SelectTrigger suppressHydrationWarning>
              <SelectValue placeholder="أختار الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="Accepted">مقبول</SelectItem>
              <SelectItem value="Rejected">مرفوض</SelectItem>
              <SelectItem value="Pending">قيد الانتظار</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">ATMCode - ATMSerial - ATMAddress - ATMModel</p>
          <div className="flex items-center gap-2">
             <div className="relative">
               <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
               <Input
                 placeholder="بحث في التقارير..."
                 className="w-full pr-10 max-w-sm"
                 value={(table.getColumn('atmCode')?.getFilterValue() as string) ?? ''}
                 onChange={(event) => table.getColumn('atmCode')?.setFilterValue(event.target.value)}
                 suppressHydrationWarning
               />
             </div>
            <Button onClick={exportToCsv} className="bg-orange-500 hover:bg-orange-600 text-white" suppressHydrationWarning>
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
                  No records to display.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
       <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredRowModel().rows.length} of items
            </div>
            <div className="space-x-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                suppressHydrationWarning
            >
                السابق
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                suppressHydrationWarning
            >
                التالي
            </Button>
            </div>
        </div>
    </div>
  );
}
