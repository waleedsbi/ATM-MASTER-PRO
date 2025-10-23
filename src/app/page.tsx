'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DollarSign,
  Users,
  Briefcase,
  Landmark,
  FileText,
  Calendar as CalendarIconLucide,
  MessageCircle,
  CheckCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { format, subMonths, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

interface DashboardStats {
  totalATMs: number;
  totalWorkPlans: number;
  totalRepresentatives: number;
  totalComments: number;
  unreadComments: number;
  completedWorkPlans: number;
  pendingWorkPlans: number;
  inProgressWorkPlans: number;
  totalBanks: number;
  atmsByBank: { bankName: string; count: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardStats(false); // false = don't show loading skeleton
    }, 30000);

    // Refresh when window gains focus
    const handleFocus = () => {
      fetchDashboardStats(false);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, []);

  const fetchDashboardStats = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      // Use the dashboard API for better performance
      const response = await fetch('/api/dashboard', {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback: fetch individually if dashboard API fails
      try {
        const atmsRes = await fetch('/api/atms');
        const atms = atmsRes.ok ? await atmsRes.json() : [];
        
        const workPlansRes = await fetch('/api/work-plans');
        const workPlans = workPlansRes.ok ? await workPlansRes.json() : [];
        
        const repsRes = await fetch('/api/representatives');
        const representatives = repsRes.ok ? await repsRes.json() : [];
        
        const commentsRes = await fetch('/api/client-comments');
        const comments = commentsRes.ok ? await commentsRes.json() : [];

        const completedWorkPlans = workPlans.filter((wp: any) => wp.status === 'completed').length;
        const pendingWorkPlans = workPlans.filter((wp: any) => wp.status === 'pending').length;
        const inProgressWorkPlans = workPlans.filter((wp: any) => wp.status === 'in-progress').length;
        const unreadComments = comments.filter((c: any) => !c.isRead).length;

        // Calculate banks and ATMs by bank
        const bankNames = new Set(atms.map((atm: any) => atm.bankName));
        const atmsByBank = Array.from(bankNames).map(bankName => ({
          bankName,
          count: atms.filter((atm: any) => atm.bankName === bankName).length
        })).sort((a, b) => b.count - a.count);

        setStats({
          totalATMs: atms.length,
          totalWorkPlans: workPlans.length,
          totalRepresentatives: representatives.length,
          totalComments: comments.length,
          unreadComments,
          completedWorkPlans,
          pendingWorkPlans,
          inProgressWorkPlans,
          totalBanks: bankNames.size,
          atmsByBank,
        });
        setLastUpdated(new Date());
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  const workPlanStatusData = stats ? [
    { name: 'مكتمل', value: stats.completedWorkPlans },
    { name: 'قيد التنفيذ', value: stats.inProgressWorkPlans },
    { name: 'معلق', value: stats.pendingWorkPlans },
  ].filter(item => item.value > 0) : [];

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            لوحة التحكم
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center">
          <p className="text-muted-foreground">فشل في تحميل البيانات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            لوحة التحكم
          </h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-1">
              آخر تحديث: {typeof window !== 'undefined' ? formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ar }) : '--'}
            </p>
          )}
        </div>
        <Button
          onClick={() => fetchDashboardStats(false)}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'جاري التحديث...' : 'تحديث'}
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={isRefreshing ? 'opacity-70 transition-opacity' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي أجهزة الصراف الآلي
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalATMs}</div>
            <p className="text-xs text-muted-foreground">عدد الماكينات المسجلة</p>
          </CardContent>
        </Card>

        <Card className={isRefreshing ? 'opacity-70 transition-opacity' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">خطط العمل</CardTitle>
            <CalendarIconLucide className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkPlans}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedWorkPlans} مكتمل • {stats.pendingWorkPlans} معلق
            </p>
          </CardContent>
        </Card>

        <Card className={isRefreshing ? 'opacity-70 transition-opacity' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المندوبون</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRepresentatives}</div>
            <p className="text-xs text-muted-foreground">عدد المندوبين النشطين</p>
          </CardContent>
        </Card>

        <Card className={isRefreshing ? 'opacity-70 transition-opacity' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التعليقات</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.unreadComments} غير مقروء
            </p>
          </CardContent>
        </Card>

        <Card className={`border-green-200 bg-green-50 dark:bg-green-950 ${isRefreshing ? 'opacity-70 transition-opacity' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">
              البنوك المتعاقدة
            </CardTitle>
            <Landmark className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">
              {stats.totalBanks}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              {stats.totalATMs} ماكينة موزعة
            </p>
          </CardContent>
        </Card>

        <Card className={`border-orange-200 bg-orange-50 dark:bg-orange-950 ${isRefreshing ? 'opacity-70 transition-opacity' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">
              خطط مكتملة
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">
              {stats.completedWorkPlans}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              {stats.totalWorkPlans > 0 
                ? `${Math.round((stats.completedWorkPlans / stats.totalWorkPlans) * 100)}% من الإجمالي`
                : 'لا توجد خطط'}
            </p>
          </CardContent>
        </Card>

        <Card className={`border-blue-200 bg-blue-50 dark:bg-blue-950 ${isRefreshing ? 'opacity-70 transition-opacity' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
              قيد التنفيذ
            </CardTitle>
            <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {stats.inProgressWorkPlans}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              خطط جارية
            </p>
          </CardContent>
        </Card>

        <Card className={`border-yellow-200 bg-yellow-50 dark:bg-yellow-950 ${isRefreshing ? 'opacity-70 transition-opacity' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              خطط معلقة
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
              {stats.pendingWorkPlans}
            </div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              بانتظار التنفيذ
            </p>
          </CardContent>
        </Card>

        <Card className={`border-purple-200 bg-purple-50 dark:bg-purple-950 ${isRefreshing ? 'opacity-70 transition-opacity' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">
              تعليقات غير مقروءة
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
              {stats.unreadComments}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              تحتاج مراجعة
            </p>
          </CardContent>
        </Card>
      </div>

      {workPlanStatusData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>حالة خطط العمل</CardTitle>
              <CardDescription>
                نظرة عامة على حالة جميع خطط العمل في النظام
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={workPlanStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                      const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                      return (
                        <text 
                          x={x} 
                          y={y} 
                          fill="white" 
                          textAnchor={x > cx ? 'start' : 'end'} 
                          dominantBaseline="central" 
                          className="text-xs font-bold"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {workPlanStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: 'var(--radius)' 
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>ملخص النظام</CardTitle>
              <CardDescription>
                نظرة سريعة على البيانات الرئيسية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">أجهزة الصراف</span>
                </div>
                <span className="text-lg font-bold">{stats.totalATMs}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIconLucide className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">خطط العمل</span>
                </div>
                <span className="text-lg font-bold">{stats.totalWorkPlans}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">المندوبون</span>
                </div>
                <span className="text-lg font-bold">{stats.totalRepresentatives}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">خطط مكتملة</span>
                </div>
                <span className="text-lg font-bold text-green-600">{stats.completedWorkPlans}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm">خطط معلقة</span>
                </div>
                <span className="text-lg font-bold text-yellow-600">{stats.pendingWorkPlans}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <span className="text-sm">تعليقات جديدة</span>
                </div>
                <span className="text-lg font-bold text-purple-600">{stats.unreadComments}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <div className="flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-semibold">البنوك المتعاقدة</span>
                </div>
                <span className="text-lg font-bold text-green-600">{stats.totalBanks}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* توزيع الماكينات على البنوك */}
      {stats && stats.atmsByBank.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>توزيع الماكينات على البنوك</CardTitle>
            <CardDescription>
              عدد أجهزة الصراف الآلي لكل بنك ({stats.totalATMs} ماكينة • {stats.totalBanks} بنك)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {stats.atmsByBank.map((bank, index) => (
                <div
                  key={bank.bankName}
                  className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    index === 0 
                      ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/30' 
                      : index === 1
                      ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/30'
                      : index === 2
                      ? 'border-green-200 bg-green-50 dark:bg-green-950/30'
                      : 'border-gray-200 bg-gray-50 dark:bg-gray-950/30'
                  } ${isRefreshing ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Landmark className={`h-4 w-4 ${
                          index === 0 ? 'text-orange-600' :
                          index === 1 ? 'text-blue-600' :
                          index === 2 ? 'text-green-600' :
                          'text-gray-600'
                        }`} />
                        <span className="text-sm font-medium text-muted-foreground">
                          {index === 0 && '🥇 '}
                          {index === 1 && '🥈 '}
                          {index === 2 && '🥉 '}
                          {bank.bankName}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-bold ${
                          index === 0 ? 'text-orange-800 dark:text-orange-200' :
                          index === 1 ? 'text-blue-800 dark:text-blue-200' :
                          index === 2 ? 'text-green-800 dark:text-green-200' :
                          'text-foreground'
                        }`}>
                          {bank.count}
                        </span>
                        <span className="text-xs text-muted-foreground">ماكينة</span>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              index === 0 ? 'bg-orange-600' :
                              index === 1 ? 'bg-blue-600' :
                              index === 2 ? 'bg-green-600' :
                              'bg-gray-600'
                            }`}
                            style={{ width: `${(bank.count / stats.totalATMs) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {((bank.count / stats.totalATMs) * 100).toFixed(1)}% من الإجمالي
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
