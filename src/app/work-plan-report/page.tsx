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
  Upload,
  Check,
  ThumbsDown,
  X,
  Plus,
  CalendarIcon,
  Save,
  Search,
} from 'lucide-react';
import type { WorkPlanReport, WorkPlanReportStatus, Note } from '@/lib/types';
import { banks, governorates } from '@/lib/data';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

function DatePicker() {
    const [date, setDate] = React.useState<Date>()
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
                onSelect={setDate}
                initialFocus
            />
            </PopoverContent>
        </Popover>
    )
}

const FullImageViewer = ({ src, onRemove }: { src: string; onRemove?: () => void }) => {
    const [zoom, setZoom] = React.useState(1);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
    const [open, setOpen] = React.useState(false);
    
    const handleReset = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };
    
    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.25, 5));
    };
    
    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.25, 0.5));
    };
    
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            handleZoomIn();
        } else {
            handleZoomOut();
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };
    
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    
    React.useEffect(() => {
        if (!open) {
            handleReset();
        }
    }, [open]);
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <div className="relative group cursor-pointer">
                <Image src={src} alt="Uploaded Image" width={100} height={100} className="rounded-md object-cover aspect-square" />
                 {onRemove && (
                    <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                    </button>
                 )}
            </div>
        </DialogTrigger>
            <DialogContent className="max-w-5xl h-[80vh]">
            <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>صورة بالحجم الكامل</span>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                                <span className="text-lg">-</span>
                            </Button>
                            <span className="text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
                            <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 5}>
                                <span className="text-lg">+</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleReset}>
                                إعادة تعيين
                            </Button>
                        </div>
                    </DialogTitle>
            </DialogHeader>
                <div 
                    className="flex-1 flex justify-center items-center overflow-hidden bg-gray-100 dark:bg-gray-900 rounded-md relative"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
                >
                    <div
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                        }}
                    >
                        <Image 
                            src={src} 
                            alt="Full size image" 
                            width={1200} 
                            height={900} 
                            className="rounded-md object-contain max-h-[60vh] w-auto"
                            draggable={false}
                        />
                    </div>
                </div>
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    💡 استخدم عجلة الفأرة للتكبير/التصغير، واسحب الصورة للتحريك
            </div>
        </DialogContent>
    </Dialog>
);
};


function UploadDialog({ report, onSave, onNoteAdd }: { report: WorkPlanReport; onSave: (id: string, before: string[], after: string[]) => void; onNoteAdd: (id: string, note: Note) => void; }) {
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [beforeImages, setBeforeImages] = React.useState<string[]>(report.beforeImages || []);
    const [afterImages, setAfterImages] = React.useState<string[]>(report.afterImages || []);
    const [newNote, setNewNote] = React.useState('');

    React.useEffect(() => {
        if(open) {
            setBeforeImages(report.beforeImages || []);
            setAfterImages(report.afterImages || []);
            setNewNote('');
        }
    }, [open, report]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            
            // Convert files to base64 for permanent storage
            const base64Promises = files.map(file => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });
            
            try {
                const base64Images = await Promise.all(base64Promises);
                setter(prev => [...prev, ...base64Images]);
            } catch (error) {
                console.error('Error converting images to base64:', error);
                toast({
                    variant: 'destructive',
                    title: 'خطأ',
                    description: 'فشل تحميل الصور. حاول مرة أخرى.',
                });
            }
        }
    };

    const removeImage = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleSave = () => {
        onSave(report.id, beforeImages, afterImages);

        if (newNote.trim()) {
            const note: Note = {
                id: `note-${Date.now()}`,
                text: newNote,
                date: new Date().toISOString(),
                user: 'reviewer',
            };
            onNoteAdd(report.id, note);
        }

        toast({
            title: "تم الحفظ",
            description: "تم حفظ الصور والملاحظات بنجاح.",
        });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="bg-red-500 hover:bg-red-600 text-white">
                    <Upload className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>رفع الصور وإضافة ملاحظات</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid gap-2">
                        <Label htmlFor="create-date">تاريخ الإنشاء</Label>
                        <DatePicker />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="image-before">صور قبل العمل</Label>
                        <div className="rounded-md border border-dashed p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Button variant="outline" asChild>
                                    <Label htmlFor="file-before" className="cursor-pointer">
                                        <Upload className="mr-2 h-4 w-4" />
                                        اختر صور
                                    </Label>
                                </Button>
                                <Input id="file-before" type="file" className="hidden" multiple onChange={(e) => handleFileChange(e, setBeforeImages)} />
                            </div>
                             <div className="flex flex-wrap gap-2">
                                {beforeImages.map((src, index) => (
                                    <FullImageViewer key={`before-${index}`} src={src} onRemove={() => removeImage(index, setBeforeImages)} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="image-after">صور بعد العمل</Label>
                        <div className="rounded-md border border-dashed p-4">
                           <div className="flex items-center gap-2 mb-4">
                            <Button variant="outline" asChild>
                               <Label htmlFor="file-after" className="cursor-pointer">
                                 <Upload className="mr-2 h-4 w-4" />
                                 اختر صور
                               </Label>
                            </Button>
                            <Input id="file-after" type="file" className="hidden" multiple onChange={(e) => handleFileChange(e, setAfterImages)} />
                           </div>
                            <div className="flex flex-wrap gap-2">
                                {afterImages.map((src, index) => (
                                     <FullImageViewer key={`after-${index}`} src={src} onRemove={() => removeImage(index, setAfterImages)} />
                                ))}
                            </div>
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="reviewer-notes">ملاحظات المراجع</Label>
                        <Textarea id="reviewer-notes" placeholder="اكتب ملاحظاتك هنا..." value={newNote} onChange={(e) => setNewNote(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
                        <Save className="ml-2 h-4 w-4" /> حفظ
                    </Button>
                    <DialogClose asChild>
                        <Button variant="ghost">إلغاء</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function WorkPlanReportPage() {
  const [data, setData] = React.useState<WorkPlanReport[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = React.useState<WorkPlanReport | null>(null);

  // Fetch work plans from API
  const fetchWorkPlans = React.useCallback(async () => {
    try {
      const response = await fetch('/api/work-plans');
      if (!response.ok) {
        throw new Error('Failed to fetch work plans');
      }
      const workPlans = await response.json();
      
      // Transform work plans to work plan reports format
      // Create a separate report entry for each ATM in the work plan
      const reports: WorkPlanReport[] = [];
      
      workPlans.forEach((plan: any) => {
        let atmCodes: string[] = [];
        let atmReports: any = {};
        
        try {
          atmCodes = JSON.parse(plan.atmCodes || '[]');
        } catch (e) {
          console.error('Error parsing atmCodes:', e);
        }
        
        try {
          atmReports = JSON.parse(plan.atmReports || '{}');
        } catch (e) {
          console.error('Error parsing atmReports:', e);
        }

        // If no ATM codes, create one entry with 'N/A'
        if (atmCodes.length === 0) {
          reports.push({
            id: String(plan.id),
            startDate: plan.startDate,
            endDate: plan.endDate,
            orderNumber: String(plan.id).slice(0, 8),
            executionDate: plan.startDate,
            atmCode: 'N/A',
            atmSerial: 'N/A',
            atmAddress: plan.city,
            representative: plan.representativeId?.toString() || 'N/A',
            status: (plan.status === 'completed' ? 'Accepted' : plan.status === 'pending' ? 'Pending' : 'Rejected') as WorkPlanReportStatus,
            beforeImages: [],
            afterImages: [],
            notes: [],
            bankName: plan.bankName,
            governorate: plan.governorate,
            city: plan.city,
            statement: plan.statement,
          });
        } else {
          // Create a separate report entry for each ATM code
          atmCodes.forEach((atmCode: string, index: number) => {
            // Get ATM-specific data
            const atmData = atmReports[atmCode] || {
              beforeImages: [],
              afterImages: [],
              notes: [],
              status: 'pending'
            };
            
            // Get status from ATM-specific data, fallback to plan status
            const atmStatus = atmData.status || plan.status || 'pending';
            const reportStatus = (atmStatus === 'completed' ? 'Accepted' : atmStatus === 'pending' ? 'Pending' : 'Rejected') as WorkPlanReportStatus;
            
            reports.push({
              id: `${plan.id}-${index}`, // Unique ID for each ATM entry
              startDate: plan.startDate,
              endDate: plan.endDate,
              orderNumber: String(plan.id).slice(0, 8),
              executionDate: plan.startDate,
              atmCode: atmCode,
              atmSerial: 'N/A',
              atmAddress: plan.city,
              representative: plan.representativeId?.toString() || 'N/A',
              status: reportStatus,
              beforeImages: atmData.beforeImages || [],
              afterImages: atmData.afterImages || [],
              notes: atmData.notes || [],
              bankName: plan.bankName,
              governorate: plan.governorate,
              city: plan.city,
              statement: plan.statement,
              workPlanId: plan.id, // Keep reference to original work plan
            });
          });
        }
      });
      
      setData(reports);
    } catch (error) {
      console.error('Error fetching work plans:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل خطط العمل",
        variant: "destructive",
      });
    }
  }, [toast]);

  React.useEffect(() => {
    fetchWorkPlans();
  }, [fetchWorkPlans]);

    const handleStatusChange = async (id: string, status: WorkPlanReportStatus) => {
        try {
            // Find the report to get the workPlanId and atmCode
            const report = data.find(r => r.id === id);
            if (!report) {
              throw new Error('Report not found');
            }
            
            // Use workPlanId if available, otherwise extract from id
            const workPlanId = report.workPlanId || parseInt(id.split('-')[0]);
            const atmCode = report.atmCode;
            
            // Convert WorkPlanReportStatus to database status
            const dbStatus = status === 'Accepted' ? 'completed' : status === 'Rejected' ? 'rejected' : 'pending';
            
            console.log('Updating status for ATM:', { id, workPlanId, atmCode, status, dbStatus });
            
            const response = await fetch('/api/work-plans', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: workPlanId,
                    atmCode: atmCode,
                    status: dbStatus,
                }),
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const responseText = await response.text();
                console.error('Error response text:', responseText);
                
                let errorData;
                try {
                    errorData = responseText ? JSON.parse(responseText) : {};
                } catch (e) {
                    console.error('Failed to parse error response:', e);
                    errorData = { error: `Server error: ${response.status} ${response.statusText}` };
                }
                
                console.error('Error response:', errorData);
                throw new Error(errorData.error || `Failed to update status (${response.status})`);
            }

            const resultText = await response.text();
            console.log('Response text:', resultText);
            
            const result = resultText ? JSON.parse(resultText) : {};
            console.log('Update successful:', result);

            // Update local state only for this specific ATM report
            setData(currentData => currentData.map(item => 
              item.id === id
                ? { ...item, status } 
                : item
            ));
            
        toast({
            title: `تم تحديث الحالة`,
                description: `تم تغيير حالة الماكينة ${atmCode} إلى "${status}".`,
            });
        } catch (error) {
            console.error('Error updating status:', error);
            toast({
                title: "خطأ",
                description: error instanceof Error ? error.message : "حدث خطأ أثناء تحديث الحالة",
                variant: "destructive",
            });
        }
    };

    const handleImagesSave = async (id: string, beforeImages: string[], afterImages: string[]) => {
      try {
        // Find the report to get the workPlanId and atmCode
        const report = data.find(r => r.id === id);
        if (!report) {
          throw new Error('Report not found');
        }
        
        // Use workPlanId if available, otherwise extract from id
        const workPlanId = report.workPlanId || parseInt(id.split('-')[0]);
        const atmCode = report.atmCode;
        
        console.log('Saving images for ATM:', atmCode, 'workPlanId:', workPlanId);
        
        const response = await fetch('/api/work-plans', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: workPlanId,
            atmCode: atmCode,
            beforeImages,
            afterImages,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save images');
        }

        // Update local state only for this specific ATM report
        setData(currentData => currentData.map(item => 
          item.id === id
            ? { ...item, beforeImages, afterImages } 
            : item
        ));
        
        console.log('Images saved successfully for ATM:', atmCode);
        toast({
          title: "تم الحفظ",
          description: `تم حفظ الصور للماكينة ${atmCode}`,
        });
      } catch (error) {
        console.error('Error saving images:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء حفظ الصور",
          variant: "destructive",
        });
      }
    };

     const handleNoteAdd = async (reportId: string, note: Note) => {
        try {
          // Get current report and notes
          const currentReport = data.find(r => r.id === reportId);
          if (!currentReport) {
            throw new Error('Report not found');
          }
          
          const updatedNotes = [...(currentReport.notes || []), note];
          
          // Use workPlanId if available, otherwise extract from id
          const workPlanId = currentReport.workPlanId || parseInt(reportId.split('-')[0]);
          const atmCode = currentReport.atmCode;
          
          console.log('Saving note for ATM:', atmCode, 'workPlanId:', workPlanId);
          
          const response = await fetch('/api/work-plans', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: workPlanId,
              atmCode: atmCode,
              notes: updatedNotes,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to save note');
          }

          // Update local state only for this specific ATM report
        setData(currentData =>
        currentData.map(report =>
            report.id === reportId
                ? { ...report, notes: updatedNotes }
            : report
        )
        );
          
          console.log('Note saved successfully for ATM:', atmCode);
        } catch (error) {
          console.error('Error saving note:', error);
          toast({
            title: "خطأ",
            description: "حدث خطأ أثناء حفظ الملاحظة",
            variant: "destructive",
          });
        }
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
    accessorKey: 'endDate',
    header: 'تاريخ الانتهاء',
    cell: ({ row }) => format(parseISO(row.getValue('endDate')), 'dd/MM/yyyy'),
  },
  {
    accessorKey: 'orderNumber',
    header: 'رقم الوردار',
  },
  {
    accessorKey: 'executionDate',
    header: 'تاريخ التنفيذ',
    cell: ({ row }) => format(parseISO(row.getValue('executionDate')), 'dd/MM/yyyy'),
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
    accessorKey: 'atmAddress',
    header: 'عنوان المكينة',
  },
  {
    accessorKey: 'representative',
    header: 'المندوب',
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
    header: 'صورة',
    cell: ({ row }) => (
      <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedReport(null)}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => setSelectedReport(row.original)}>
            <ImageIcon className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>عرض الصور</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="grid md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto p-2">
              <div className="space-y-4">
                <h3 className="font-semibold">صور قبل العمل</h3>
                <div className="mt-2 flex items-center gap-2 flex-wrap p-2 bg-muted rounded-md min-h-[120px]">
                  {selectedReport.beforeImages && selectedReport.beforeImages.length > 0 ? (
                      selectedReport.beforeImages.map((src, i) => <FullImageViewer key={`before-${i}`} src={src} />)
                  ) : (
                      <p className="text-sm text-muted-foreground">لا توجد صور قبل العمل.</p>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">صور بعد العمل</h3>
                <div className="mt-2 flex items-center gap-2 flex-wrap p-2 bg-muted rounded-md min-h-[120px]">
                   {selectedReport.afterImages && selectedReport.afterImages.length > 0 ? (
                      selectedReport.afterImages.map((src, i) => <FullImageViewer key={`after-${i}`} src={src} />)
                   ) : (
                      <p className="text-sm text-muted-foreground">لا توجد صور بعد العمل.</p>
                   )}
                </div>
              </div>
            </div>
           )}
        </DialogContent>
      </Dialog>
    ),
  },
  {
    id: 'upload',
    header: 'رفع',
    cell: ({ row }) => <UploadDialog report={row.original} onSave={handleImagesSave} onNoteAdd={handleNoteAdd} />,
  },
  {
    id: 'accept',
    header: 'قبول',
    cell: ({ row }) => (
      <Button variant="ghost" size="icon" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleStatusChange(row.original.id, 'Accepted')}>
        <Check className="h-4 w-4" />
      </Button>
    ),
  },
  {
    id: 'reject',
    header: 'رفض',
    cell: ({ row }) => (
      <Button variant="ghost" size="icon" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleStatusChange(row.original.id, 'Rejected')}>
        <ThumbsDown className="h-4 w-4" />
      </Button>
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
  });

  return (
    <div className="w-full p-4 md:p-8" suppressHydrationWarning>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select>
            <SelectTrigger suppressHydrationWarning>
              <SelectValue placeholder="أختار البنك" />
            </SelectTrigger>
            <SelectContent>
              {banks.map((bank) => (
                <SelectItem key={bank.id} value={bank.nameAr}>
                  {bank.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                 onChange={(event) => table.getColumn('atmCode')?.setFilterValue(event.target.value) }
                 suppressHydrationWarning
               />
             </div>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" suppressHydrationWarning>
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
                        onClick={() =>
                          header.column.toggleSorting(
                            header.column.getIsSorted() === 'asc'
                          )
                        }
                        suppressHydrationWarning
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                  لا توجد نتائج.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()} ({table.getFilteredRowModel().rows.length}{' '}
          items)
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
              {'<<'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              suppressHydrationWarning
            >
              {'<'}
            </Button>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Button
                key={i}
                variant={
                  table.getState().pagination.pageIndex === i
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                onClick={() => table.setPageIndex(i)}
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
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              suppressHydrationWarning
            >
              {'>'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              suppressHydrationWarning
            >
              {'>>'}
            </Button>
          </div>
          <Select
            onValueChange={(value) => {
              table.setPageSize(Number(value));
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
          <div className="text-sm text-muted-foreground">Items Total</div>
        </div>
      </div>
    </div>
  );
}
