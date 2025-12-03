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
  DialogDescription,
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
import { PlusCircle, Download, Trash2, Save, ChevronDown, CalendarIcon, Filter, Edit, Search, X } from 'lucide-react';
import type { WorkPlan, ATMData, Governorate } from '@/lib/types';
import { banks, governorates } from '@/lib/data';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
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
  {
    accessorKey: 'bankName',
    header: () => <div className="flex items-center gap-1">اسم البنك <Filter size={14}/></div>,
  },
  {
    accessorKey: 'startDate',
    header: () => <div className="flex items-center gap-1">تاريخ البداء <Filter size={14}/></div>,
    cell: ({ row }) => {
      const dateValue = row.getValue('startDate') as string;
      if (!dateValue) return '';
      try {
        const parsedDate = parseISO(dateValue);
        return isValid(parsedDate) ? format(parsedDate, 'dd/MM/yyyy') : dateValue;
      } catch {
        return dateValue;
      }
    },
  },
  {
    accessorKey: 'governorate',
    header: () => <div className="flex items-center gap-1">اسم المحافظة <Filter size={14}/></div>,
  },
  {
    accessorKey: 'city',
    header: () => <div className="flex items-center gap-1">اسم المدينة <Filter size={14}/></div>,
  },
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
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  
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

  const selectedDatesAsDate = React.useMemo(() => {
    return value.map(dateStr => parseISO(dateStr)).filter(d => isValid(d));
  }, [value]);

  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    return dateOnly >= startOnly && dateOnly <= endOnly;
  };

  const handleCalendarSelect = (dates: Date | Date[] | undefined) => {
    // react-day-picker in multiple mode returns Date[] or undefined
    let selectedDatesArray: Date[] = [];
    
    if (!dates) {
      // If dates is undefined, it means user clicked on a selected date to deselect it
      // We need to handle this differently - we'll keep current selection
      return;
    }
    
    if (Array.isArray(dates)) {
      selectedDatesArray = dates;
    } else if (dates instanceof Date) {
      // Single date clicked - toggle it
      const dateStr = format(dates, 'yyyy-MM-dd');
      if (value.includes(dateStr)) {
        // Remove if already selected
        onChange(value.filter(d => d !== dateStr));
      } else {
        // Add if not selected
        onChange([...value, dateStr].sort());
      }
      return;
    }

    // Filter dates to only include those within the allowed range
    const validDates = selectedDatesArray
      .filter(date => {
        if (!startDate || !endDate) return true;
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        return dateOnly >= startOnly && dateOnly <= endOnly;
      })
      .map(date => format(date, 'yyyy-MM-dd'))
      .sort();

    onChange(validDates);
  };

  const clearAll = () => {
    onChange([]);
  };
  
  return (
    <div className="space-y-2">
      {/* Primary method: Dropdown with checkboxes - more reliable */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span>
              {value.length > 0 
                ? `${value.length} تاريخ محدد` 
                : "اختر التواريخ"}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-1.5">
            <DropdownMenuLabel>التواريخ المتاحة</DropdownMenuLabel>
            {value.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="h-6 px-2 text-xs"
              >
                <X className="h-3 w-3 ml-1" />
                مسح الكل
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
          {dates.length > 0 ? (
            dates.map(date => (
              <DropdownMenuCheckboxItem
                key={date}
                checked={value.includes(date)}
                onCheckedChange={(checked) => {
                  return checked
                    ? onChange([...value, date].sort())
                    : onChange(value.filter(d => d !== date))
                }}
                className="cursor-pointer"
              >
                {format(parseISO(date), 'dd/MM/yyyy')}
              </DropdownMenuCheckboxItem>
            ))
          ) : (
            <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
              يرجى تحديد تاريخ البداية والانتهاء أولاً
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Show selected dates as badges */}
      {value.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">التواريخ المحددة:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 ml-1" />
              مسح الكل
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 border rounded-md bg-muted/30">
            {value.sort().map(dateStr => {
              const date = parseISO(dateStr);
              return (
                <Badge
                  key={dateStr}
                  variant="secondary"
                  className="cursor-pointer text-xs hover:bg-destructive/20"
                  onClick={() => onChange(value.filter(d => d !== dateStr))}
                >
                  {format(date, 'dd/MM/yyyy')}
                  <X className="h-3 w-3 mr-1" />
                </Badge>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Optional: Calendar view for visual selection */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between text-xs">
            <span>أو استخدم التقويم</span>
            <CalendarIcon className="ml-2 h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <Calendar
              mode="multiple"
              selected={selectedDatesAsDate}
              onSelect={(dates) => {
                // react-day-picker in multiple mode passes Date[] or undefined
                if (dates && Array.isArray(dates)) {
                  const validDates = dates
                    .filter(date => {
                      if (!startDate || !endDate) return true;
                      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                      const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                      const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                      return dateOnly >= startOnly && dateOnly <= endOnly;
                    })
                    .map(date => format(date, 'yyyy-MM-dd'))
                    .sort();
                  onChange(validDates);
                } else if (!dates) {
                  // Empty selection
                  onChange([]);
                }
              }}
              disabled={(date) => !isDateInRange(date)}
              initialFocus
              className="rounded-md border-0"
              modifiersClassNames={{
                selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              }}
            />
            <div className="mt-2 text-xs text-muted-foreground text-center">
              💡 انقر على التواريخ لتحديدها أو إلغاء تحديدها
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default function WorkPlanPage() {
  const { toast } = useToast();
  
  const [selectedBank, setSelectedBank] = React.useState('');
  const [startDate, setStartDate] = React.useState<Date>();
  const [endDate, setEndDate] = React.useState<Date>();
  const [selectedGovernorate, setSelectedGovernorate] = React.useState<string>('');
  const [selectedCityName, setSelectedCityName] = React.useState<string>('');
  const [selectedRepresentative, setSelectedRepresentative] = React.useState('');
  const [statement, setStatement] = React.useState('');
  const [selectedDates, setSelectedDates] = React.useState<string[]>([]);
  const [repeatPlan, setRepeatPlan] = React.useState(false);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [planToDelete, setPlanToDelete] = React.useState<WorkPlan | null>(null);
  const [planToEdit, setPlanToEdit] = React.useState<WorkPlan | null>(null);
  
  const [data, setData] = React.useState<WorkPlan[]>([]);
  const [representatives, setRepresentatives] = React.useState<Representative[]>([]);
  const [atms, setAtms] = React.useState<ATMData[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});

  const filteredAtms = React.useMemo(() => {
    if (!selectedCityName) return [];
    
    const selectedBankName = selectedBank 
      ? banks.find(b => b.id === selectedBank)?.nameAr?.trim() 
      : '';
    
    // Helper function to normalize Arabic text (handle ي/ى and other variations)
    const normalizeArabicText = (text: string): string => {
      if (!text) return '';
      let normalized = text
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
      
      // Normalize Arabic characters: convert ي to ى at end of words
      // This handles "البنك العربي" vs "البنك العربى"
      // Match ي at end of word or end of string
      normalized = normalized.replace(/ي(\s|$)/g, 'ى$1');
      
      // Also handle other common variations
      normalized = normalized
        .replace(/أ/g, 'ا')
        .replace(/إ/g, 'ا')
        .replace(/آ/g, 'ا');
      
      return normalized;
    };
    
    // Helper function to normalize bank names for comparison
    const normalizeBankName = (name: string) => {
      return normalizeArabicText(name);
    };
    
    // Helper function to check if bank names match (flexible comparison)
    const bankNamesMatch = (name1: string, name2: string) => {
      const normalized1 = normalizeBankName(name1);
      const normalized2 = normalizeBankName(name2);
      
      // Exact match after normalization
      if (normalized1 === normalized2) return true;
      
      // Check if one contains the other (for partial matches)
      // This handles cases like "البنك العربي" vs "البنك العربي الإفريقي"
      if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        // But only if the shorter name is at least 5 characters (to avoid false matches)
        const shorter = normalized1.length < normalized2.length ? normalized1 : normalized2;
        if (shorter.length >= 5) {
          return true;
        }
      }
      
      return false;
    };
    
    // City name mapping (English to Arabic and vice versa)
    const cityNameMap: Record<string, string[]> = {
      'القاهرة الجديدة': ['new cairo', 'newcairo', 'القاهرة الجديده', 'القاهره الجديدة'],
      'new cairo': ['القاهرة الجديدة', 'القاهرة الجديده', 'القاهره الجديدة'],
      'zamalek': ['الزمالك'],
      'الزمالك': ['zamalek'],
      'nasr city': ['مدينة نصر', 'مدينه نصر'],
      'مدينة نصر': ['nasr city', 'nasrcity'],
      'heliopolis': ['هليوبوليس', 'مصر الجديدة'],
      'مصر الجديدة': ['heliopolis'],
      'dokki': ['الدقي'],
      'الدقي': ['dokki'],
      'maadi': ['المعادي'],
      'المعادي': ['maadi'],
      '6th of october': ['السادس من اكتوبر', 'السادس من أكتوبر', 'حدائق اكتوبر'],
      'السادس من اكتوبر': ['6th of october', '6th october', 'october 6'],
      'sheikh zayed': ['الشيخ زايد'],
      'الشيخ زايد': ['sheikh zayed'],
    };
    
    // Helper function to normalize and match city names
    const cityNamesMatch = (city1: string, city2: string): boolean => {
      if (!city1 || !city2) return false;
      
      const normalized1 = city1.trim().toLowerCase();
      const normalized2 = city2.trim().toLowerCase();
      
      // Exact match
      if (normalized1 === normalized2) return true;
      
      // Check mapping
      const variants1 = cityNameMap[normalized1] || [];
      const variants2 = cityNameMap[normalized2] || [];
      
      // Check if one is a variant of the other
      if (variants1.includes(normalized2) || variants2.includes(normalized1)) {
        return true;
      }
      
      // Check if normalized2 is in variants1 or vice versa
      if (variants1.some(v => v.toLowerCase() === normalized2)) return true;
      if (variants2.some(v => v.toLowerCase() === normalized1)) return true;
      
      return false;
    };
    
    console.log('🔍 Filtering ATMs:', {
      selectedCityName,
      selectedBankName,
      totalAtms: atms.length,
      bankSelected: !!selectedBank,
      uniqueBankNames: Array.from(new Set(atms.map(a => a.bankName))).slice(0, 10)
    });
    
    if (!selectedBankName) {
      const cityAtms = atms.filter(atm => cityNamesMatch(atm.city || '', selectedCityName));
      console.log('📍 ATMs for city (no bank filter):', cityAtms.length);
      return cityAtms;
    }
    
    // Count matches for debugging
    let cityMatchCount = 0;
    let bankMatchCount = 0;
    let bothMatchCount = 0;
    
    const filtered = atms.filter(atm => {
      const matchesCity = cityNamesMatch(atm.city || '', selectedCityName);
      const matchesBank = bankNamesMatch(atm.bankName || '', selectedBankName);
      
      if (matchesCity) cityMatchCount++;
      if (matchesBank) bankMatchCount++;
      if (matchesCity && matchesBank) bothMatchCount++;
      
      if (matchesCity && !matchesBank) {
        console.log('⚠️ Bank name mismatch:', {
          expected: selectedBankName,
          actual: atm.bankName,
          atmCode: atm.atmCode,
          city: atm.city,
          selectedCity: selectedCityName
        });
      }
      
      if (!matchesCity && matchesBank) {
        console.log('⚠️ City name mismatch:', {
          expected: selectedCityName,
          actual: atm.city,
          atmCode: atm.atmCode,
          bank: atm.bankName
        });
      }
      
      return matchesCity && matchesBank;
    });
    
    console.log('✅ Filtered ATMs (with bank):', {
      totalAtmsInDB: atms.length,
      cityMatches: cityMatchCount,
      bankMatches: bankMatchCount,
      bothMatches: bothMatchCount,
      finalFilteredCount: filtered.length,
      bankName: selectedBankName,
      city: selectedCityName,
      allFilteredCodes: filtered.map(a => a.atmCode),
      sampleAtms: filtered.slice(0, 10).map(a => ({ 
        code: a.atmCode, 
        bank: a.bankName,
        city: a.city 
      }))
    });
    
    // If no results, show all ATMs in the city for debugging
    if (filtered.length === 0 && selectedCityName) {
      const cityAtms = atms.filter(atm => cityNamesMatch(atm.city || '', selectedCityName));
      const allCityAtms = atms.filter(atm => atm.city);
      const uniqueCities = Array.from(new Set(allCityAtms.map(a => a.city)));
      
      console.log('🔍 Debug: All ATMs in city (for comparison):', {
        selectedCity: selectedCityName,
        matchedCount: cityAtms.length,
        banks: Array.from(new Set(cityAtms.map(a => a.bankName))),
        allUniqueCities: uniqueCities.slice(0, 10),
        sampleCityNames: allCityAtms.slice(0, 5).map(a => ({ code: a.atmCode, city: a.city }))
      });
    }
    
    return filtered;
  }, [selectedCityName, selectedBank, atms, banks]);

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
        pageSize: 50, // Increased from 5 to 50 to show more ATMs per page
      }
    }
  });

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
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setRepresentatives(data);
      } else {
        console.error('Representatives API returned non-array:', data);
        setRepresentatives([]);
        toast({
          title: "تحذير",
          description: "بيانات المندوبين غير صحيحة",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching representatives:', error);
      setRepresentatives([]); // Set to empty array on error
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل بيانات المندوبين",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchAtms = React.useCallback(async () => {
    try {
      console.log('Starting to fetch ATMs...');
      const response = await fetch('/api/atms');
      const data = await response.json();
      console.log('ATMs fetched successfully:', {
        count: data.length,
        firstAtm: data[0],
        cities: Array.from(new Set(data.map((a: any) => a.city)))
      });
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

  React.useEffect(() => {
    fetchWorkPlans();
    fetchRepresentatives();
    fetchAtms();
  }, [fetchWorkPlans, fetchRepresentatives, fetchAtms]);

  const handleSubmit = React.useCallback(async () => {
    try {
      const requiredFields = [];
      if (!selectedBank) requiredFields.push('البنك');
      if (!startDate) requiredFields.push('تاريخ البداية');
      if (!endDate) requiredFields.push('تاريخ الانتهاء');
      if (!selectedGovernorate || selectedGovernorate.trim() === '') requiredFields.push('المحافظة');
      if (!selectedCityName) requiredFields.push('المدينة');
      if (!statement) requiredFields.push('البيان');
      if (!selectedRepresentative) requiredFields.push('المندوب');

      if (requiredFields.length > 0) {
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

      const selectedAtms = Object.keys(rowSelection)
        .map(index => filteredAtms[parseInt(index)])
        .filter(Boolean);

      if (selectedAtms.length === 0) {
        toast({
          title: 'خطأ',
          description: 'يرجى اختيار ماكينة واحدة على الأقل',
          variant: 'destructive',
        });
        return;
      }

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

      try {
        const isEditing = !!planToEdit;
        
        // If editing, don't allow repeat
        if (isEditing) {
          const workPlanData: WorkPlanFormData = {
            bankName: bankDetails.nameAr,
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            governorate: selectedGovernorate || '',
            city: selectedCityName || '',
            statement: statement.trim(),
            representativeId: parseInt(selectedRepresentative),
            atmCodes: selectedAtms.map(atm => atm.atmCode),
            dates: selectedDates,
            status: 'pending'
          };

          const method = 'PUT';
          const dataToSend = { ...workPlanData, id: planToEdit.id };
          
          const response = await fetch('/api/work-plans', {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
          });

          let responseData;
          const text = await response.text();
          
          try {
            responseData = text ? JSON.parse(text) : null;
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
            const errorMessage = responseData?.error || responseData?.message || 'حدث خطأ أثناء تحديث خطة العمل';
            toast({
              title: `خطأ ${response.status}`,
              description: errorMessage,
              variant: 'destructive',
            });
            return;
          }

          if (!responseData?.id) {
            toast({
              title: 'خطأ في البيانات',
              description: 'البيانات المستلمة من الخادم غير صالحة',
              variant: 'destructive',
            });
            return;
          }

          await fetchWorkPlans();
          toast({
            title: 'تم التحديث',
            description: 'تم تحديث خطة العمل بنجاح',
          });

          setIsDialogOpen(false);
          setPlanToEdit(null);
          setSelectedBank('');
          setStartDate(undefined);
          setEndDate(undefined);
          setSelectedGovernorate('');
          setSelectedCityName('');
          setStatement('');
          setSelectedRepresentative('');
          setSelectedDates([]);
          setRepeatPlan(false);
          atmTable.toggleAllRowsSelected(false);
          return;
        }

        // If repeat is enabled, create a separate plan for each selected date
        if (repeatPlan && selectedDates.length > 0) {
          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];

          // Create a plan for each date
          for (const dateStr of selectedDates) {
            const selectedDate = parseISO(dateStr);
            
            const workPlanData: WorkPlanFormData = {
              bankName: bankDetails.nameAr,
              startDate: format(selectedDate, 'yyyy-MM-dd'),
              endDate: format(selectedDate, 'yyyy-MM-dd'),
              governorate: selectedGovernorate || '',
              city: selectedCityName || '',
              statement: statement.trim(),
              representativeId: parseInt(selectedRepresentative),
              atmCodes: selectedAtms.map(atm => atm.atmCode),
              dates: [dateStr], // Single date for each repeated plan
              status: 'pending'
            };

            try {
              const response = await fetch('/api/work-plans', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(workPlanData),
              });

              let responseData;
              const text = await response.text();
              
              try {
                responseData = text ? JSON.parse(text) : null;
              } catch (e) {
                console.error('Failed to parse server response:', { error: e, text });
                errorCount++;
                errors.push(`خطأ في تاريخ ${format(selectedDate, 'dd/MM/yyyy')}: فشل في تحليل الاستجابة`);
                continue;
              }

              if (!response.ok) {
                errorCount++;
                const errorMessage = responseData?.error || responseData?.message || 'حدث خطأ';
                errors.push(`خطأ في تاريخ ${format(selectedDate, 'dd/MM/yyyy')}: ${errorMessage}`);
                continue;
              }

              if (!responseData?.id) {
                errorCount++;
                errors.push(`خطأ في تاريخ ${format(selectedDate, 'dd/MM/yyyy')}: البيانات غير صالحة`);
                continue;
              }

              successCount++;
            } catch (error) {
              errorCount++;
              errors.push(`خطأ في تاريخ ${format(selectedDate, 'dd/MM/yyyy')}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            }
          }

          await fetchWorkPlans();

          if (successCount > 0 && errorCount === 0) {
            toast({
              title: 'تم الإضافة بنجاح',
              description: `تم إنشاء ${successCount} خطة عمل بنجاح`,
            });
          } else if (successCount > 0 && errorCount > 0) {
            toast({
              title: 'تم الإضافة جزئياً',
              description: `تم إنشاء ${successCount} خطة، فشل ${errorCount} خطة. ${errors.slice(0, 3).join('; ')}`,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'فشل الإضافة',
              description: `فشل إنشاء جميع الخطط. ${errors.slice(0, 3).join('; ')}`,
              variant: 'destructive',
            });
            return;
          }

          setIsDialogOpen(false);
          setPlanToEdit(null);
          setSelectedBank('');
          setStartDate(undefined);
          setEndDate(undefined);
          setSelectedGovernorate('');
          setSelectedCityName('');
          setStatement('');
          setSelectedRepresentative('');
          setSelectedDates([]);
          setRepeatPlan(false);
          atmTable.toggleAllRowsSelected(false);
          return;
        }

        // Normal single plan creation (without repeat)
        const workPlanData: WorkPlanFormData = {
          bankName: bankDetails.nameAr,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          governorate: selectedGovernorate || '',
          city: selectedCityName || '',
          statement: statement.trim(),
          representativeId: parseInt(selectedRepresentative),
          atmCodes: selectedAtms.map(atm => atm.atmCode),
          dates: selectedDates,
          status: 'pending'
        };

        const response = await fetch('/api/work-plans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workPlanData),
        });

        let responseData;
        const text = await response.text();
        
        try {
          responseData = text ? JSON.parse(text) : null;
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
          const errorMessage = responseData?.error || responseData?.message || 'حدث خطأ أثناء إنشاء خطة العمل';
          toast({
            title: `خطأ ${response.status}`,
            description: errorMessage,
            variant: 'destructive',
          });
          return;
        }

        if (!responseData?.id) {
          toast({
            title: 'خطأ في البيانات',
            description: 'البيانات المستلمة من الخادم غير صالحة',
            variant: 'destructive',
          });
          return;
        }

        await fetchWorkPlans();
        toast({
          title: 'تم الإضافة',
          description: 'تم إضافة خطة العمل بنجاح',
        });

        setIsDialogOpen(false);
        setPlanToEdit(null);
        setSelectedBank('');
        setStartDate(undefined);
        setEndDate(undefined);
        setSelectedGovernorate('');
        setSelectedCityName('');
        setStatement('');
        setSelectedRepresentative('');
        setSelectedDates([]);
        setRepeatPlan(false);
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
    planToEdit,
    repeatPlan
  ]);

  const openEditDialog = React.useCallback((plan: WorkPlan) => {
    setPlanToEdit(plan);
    setRepeatPlan(false); // Disable repeat when editing
    
    const bankId = banks.find(b => b.nameAr === plan.bankName)?.id || '';
    
    setSelectedBank(bankId);
    setStartDate(parseISO(plan.startDate));
    setEndDate(parseISO(plan.endDate));
    setSelectedGovernorate(plan.governorate || '');
    setSelectedCityName(plan.city);
    setStatement(plan.statement);
    setSelectedRepresentative(plan.representativeId.toString());
    
    try {
      const dates = JSON.parse(plan.dates);
      const atmCodes = JSON.parse(plan.atmCodes);
      setSelectedDates(Array.isArray(dates) ? dates : []);
      
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
  }, [banks, filteredAtms]);

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
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive hover:text-destructive/80"
            onClick={() => openDeleteDialog(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [openEditDialog, openDeleteDialog]);

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

  // Get all governorates that have ATMs in the database
  const availableGovernorates = React.useMemo(() => {
    const uniqueGovernorates = new Set(
      atms
        .map(atm => atm.governorate)
        .filter((gov): gov is string => !!gov && gov.trim() !== '')
    );
    return Array.from(uniqueGovernorates).sort();
  }, [atms]);

  const handleGovernorateChange = React.useCallback((govName: string) => {
    setSelectedGovernorate(govName);
    setSelectedCityName('');
  }, []);
  
  const availableCities = React.useMemo(() => {
    if (!selectedGovernorate || selectedGovernorate.trim() === '') return [];
    
    console.log('🏙️ Getting cities for governorate:', {
      selectedGovernorate,
      totalAtms: atms.length,
      governoratesInDB: Array.from(new Set(atms.map(a => a.governorate))).slice(0, 10)
    });
    
    // Get all cities that have ATMs in the selected governorate, regardless of bank
    // This ensures all cities with ATMs appear in the dropdown
    const atmCities = atms
      .filter(atm => {
        // Match governorate name exactly
        const matchesGovernorate = atm.governorate === selectedGovernorate;
        if (matchesGovernorate) {
          console.log('✅ Found ATM in governorate:', {
            governorate: atm.governorate,
            city: atm.city,
            atmCode: atm.atmCode
          });
        }
        return matchesGovernorate && atm.city && atm.city.trim() !== ''; // Only include ATMs with a valid city name
      })
      .map(atm => atm.city)
      .filter((city): city is string => !!city && city.trim() !== ''); // Filter out null/undefined/empty cities
    
    // Remove duplicates and sort
    const uniqueCities = Array.from(new Set(atmCities))
      .filter((city): city is string => !!city && city.trim() !== '') // Final filter to ensure no empty strings
      .sort();
    
    console.log('📍 Available cities:', {
      governorate: selectedGovernorate,
      cities: uniqueCities,
      count: uniqueCities.length
    });
    
    return uniqueCities;
  }, [selectedGovernorate, atms]);
  
  const handleCityChange = React.useCallback((cityName: string) => {
    console.log('City changed to:', cityName);
    setSelectedCityName(cityName);
  }, []);

  return (
    <div className="w-full p-4 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="بحث في خطط العمل..."
            onChange={(event) =>
              workPlansTable.getColumn('bankName')?.setFilterValue(event.target.value)
            }
            className="w-full pr-10"
          />
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="ml-2 h-4 w-4" /> إضافة
          </Button>
          <Button variant="outline" className="bg-orange-500 hover:bg-orange-600 text-white">
            <Download className="ml-2 h-4 w-4" /> تصدير
          </Button>
          <Button 
            variant="outline" 
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => window.open('/system-status', '_blank')}
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
          صفحة {atmTable.getState().pagination.pageIndex + 1}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setPlanToEdit(null);
          setSelectedBank('');
          setStartDate(undefined);
          setEndDate(undefined);
          setSelectedGovernorate('');
          setSelectedCityName('');
          setStatement('');
          setSelectedRepresentative('');
          setSelectedDates([]);
          setRepeatPlan(false);
          atmTable.toggleAllRowsSelected(false);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{planToEdit ? 'تعديل خطة' : 'إضافة خطة'}</DialogTitle>
            <DialogDescription>
              {planToEdit ? 'قم بتعديل تفاصيل الخطة أدناه' : 'املأ النموذج أدناه لإضافة خطة عمل جديدة'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                <Select 
                  value={selectedGovernorate || ''} 
                  onValueChange={handleGovernorateChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="أختار المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGovernorates
                      .filter(gov => gov && gov.trim() !== '')
                      .map((gov) => (
                        <SelectItem key={gov} value={gov}>
                          {gov}
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
                  disabled={!selectedGovernorate || selectedGovernorate.trim() === ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="أختار المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities
                      .filter(city => city && city.trim() !== '') // Additional safety filter
                      .map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
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
                    {Array.isArray(representatives) && representatives.length > 0 ? (
                      representatives.map((rep) => (
                        <SelectItem key={rep.id} value={rep.id.toString()}>
                          {rep.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                        لا توجد مندوبين متاحين
                      </div>
                    )}
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

            {!planToEdit && (
              <div className="flex items-center space-x-2 space-x-reverse p-4 border rounded-md bg-muted/50">
                <Checkbox
                  id="repeat-plan"
                  checked={repeatPlan}
                  onCheckedChange={(checked) => setRepeatPlan(checked === true)}
                />
                <Label
                  htmlFor="repeat-plan"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  تكرار الخطة - إنشاء خطة منفصلة لكل تاريخ محدد
                </Label>
              </div>
            )}

            {repeatPlan && !planToEdit && selectedDates.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 سيتم إنشاء {selectedDates.length} خطة عمل منفصلة - واحدة لكل تاريخ محدد
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label>البيان</Label>
              <Textarea
                placeholder="أدخل البيان"
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid gap-2">
              <Label>اختيار الماكينات</Label>
              <div className="border rounded-md">
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
                          <div className="space-y-2">
                            <p className="text-muted-foreground">
                              {!selectedCityName 
                                ? 'الرجاء اختيار مدينة لعرض الماكينات' 
                                : atms.length === 0
                                ? 'لا توجد بيانات ماكينات محملة. يرجى التحقق من قاعدة البيانات.'
                                : `لا توجد ماكينات للبنك "${banks.find(b => b.id === selectedBank)?.nameAr || 'غير محدد'}" في مدينة "${selectedCityName}"`}
                            </p>
                            {atms.length > 0 && selectedCityName && (
                              <p className="text-xs text-gray-500">
                                إجمالي الماكينات المتاحة: {atms.length}
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
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
