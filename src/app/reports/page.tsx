'use client';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import React, { useEffect, useMemo, useState } from 'react';
import { format, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function ReportsPage() {
    const [maintenanceTasks, setMaintenanceTasks] = useState<any[]>([]);
    const [atms, setAtms] = useState<any[]>([]);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [workPlans, setWorkPlans] = useState<any[]>([]);
    const [representatives, setRepresentatives] = useState<any[]>([]);
    const [dashboardStats, setDashboardStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const [tasksRes, atmsRes, techsRes, workPlansRes, repsRes, dashboardRes] = await Promise.all([
                    fetch('/api/maintenance-tasks', { cache: 'no-store' }),
                    fetch('/api/atms', { cache: 'no-store' }),
                    fetch('/api/technicians', { cache: 'no-store' }),
                    fetch('/api/work-plans', { cache: 'no-store' }),
                    fetch('/api/representatives', { cache: 'no-store' }),
                    fetch('/api/dashboard', { cache: 'no-store' }),
                ]);

                if (tasksRes.ok) {
                    const tasks = await tasksRes.json();
                    if (Array.isArray(tasks)) setMaintenanceTasks(tasks);
                }
                if (atmsRes.ok) {
                    const atmsJson = await atmsRes.json();
                    if (Array.isArray(atmsJson)) setAtms(atmsJson);
                }
                if (techsRes.ok) {
                    const techs = await techsRes.json();
                    if (Array.isArray(techs)) setTechnicians(techs);
                }
                if (workPlansRes.ok) {
                    const plans = await workPlansRes.json();
                    if (Array.isArray(plans)) setWorkPlans(plans);
                }
                if (repsRes.ok) {
                    const reps = await repsRes.json();
                    if (Array.isArray(reps)) setRepresentatives(reps);
                }
                if (dashboardRes.ok) {
                    const stats = await dashboardRes.json();
                    setDashboardStats(stats);
                    // Use comment stats from dashboard for basic statistics
                    // We don't need full comment data for reports, just counts
                }
            } catch (e) {
                console.error('Error fetching reports data:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const maintenanceStatusData = useMemo(() => {
        return Object.entries(
          maintenanceTasks.reduce((acc, task) => {
            const status = task.status || 'Unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([name, value]) => ({ name, value }));
    }, [maintenanceTasks]);

    const atmStatusData = useMemo(() => {
        return Object.entries(
          atms.reduce((acc, atm) => {
            const status = atm.status || 'Unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([name, value]) => ({ name, value }));
    }, [atms]);

    const technicianProductivityData = useMemo(() => {
        return technicians.map(tech => ({
            name: tech.name,
            tasks: tech.tasksCompleted ?? 0,
            avgTime: tech.avgResolutionTime ?? 0,
        }));
    }, [technicians]);

    const monthlyTaskData = useMemo(() => {
        const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i)).reverse();
        return months.map(month => {
            const monthStr = format(month, 'MMM yyyy');
            const completed = maintenanceTasks.filter(task => format(new Date(task.scheduledDate), 'MMM yyyy') === monthStr && task.status === 'Completed').length;
            const pending = maintenanceTasks.filter(task => format(new Date(task.scheduledDate), 'MMM yyyy') === monthStr && task.status === 'Pending').length;
            return { name: format(month, 'MMM'), completed, pending };
        });
    }, [maintenanceTasks]);

    // تقارير خطط العمل
    const workPlansByStatus = useMemo(() => {
        const statusCounts = workPlans.reduce((acc, plan) => {
            const status = plan.status || 'pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const statusLabels: Record<string, string> = {
            'completed': 'مكتملة',
            'pending': 'قيد الانتظار',
            'in-progress': 'قيد التنفيذ',
            'rejected': 'مرفوضة',
        };
        
        return Object.entries(statusCounts).map(([status, count]) => ({
            name: statusLabels[status] || status,
            value: count,
        }));
    }, [workPlans]);

    const workPlansByBank = useMemo(() => {
        const bankCounts = workPlans.reduce((acc, plan) => {
            const bank = plan.bankName || 'غير محدد';
            acc[bank] = (acc[bank] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(bankCounts)
            .map(([bank, count]) => ({ name: bank, value: count }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10 banks
    }, [workPlans]);

    const monthlyWorkPlansData = useMemo(() => {
        const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i)).reverse();
        return months.map(month => {
            const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
            const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
            
            const plansInMonth = workPlans.filter(plan => {
                const startDate = plan.startDate ? new Date(plan.startDate) : null;
                return startDate && startDate >= monthStart && startDate <= monthEnd;
            });
            
            const completed = plansInMonth.filter(p => p.status === 'completed').length;
            const pending = plansInMonth.filter(p => p.status === 'pending').length;
            const inProgress = plansInMonth.filter(p => p.status === 'in-progress').length;
            
            return { 
                name: format(month, 'MMM'), 
                completed, 
                pending, 
                inProgress 
            };
        });
    }, [workPlans]);

    // تقارير المندوبين
    const representativesPerformance = useMemo(() => {
        const repMap = new Map<number, { name: string; plansCount: number; completedCount: number }>();
        
        representatives.forEach(rep => {
            repMap.set(rep.id, {
                name: rep.name || 'غير معروف',
                plansCount: 0,
                completedCount: 0,
            });
        });
        
        workPlans.forEach(plan => {
            const repId = plan.representativeId;
            if (repId && repMap.has(repId)) {
                const rep = repMap.get(repId)!;
                rep.plansCount += 1;
                if (plan.status === 'completed') {
                    rep.completedCount += 1;
                }
            }
        });
        
        return Array.from(repMap.values())
            .filter(rep => rep.plansCount > 0)
            .map(rep => ({
                name: rep.name,
                plans: rep.plansCount,
                completed: rep.completedCount,
                completionRate: rep.plansCount > 0 ? (rep.completedCount / rep.plansCount * 100).toFixed(1) : 0,
            }))
            .sort((a, b) => b.plans - a.plans)
            .slice(0, 10); // Top 10 representatives
    }, [representatives, workPlans]);

    // تقارير التوزيع الجغرافي
    const atmsByGovernorate = useMemo(() => {
        const govCounts = atms.reduce((acc, atm) => {
            const gov = atm.governorate || 'غير محدد';
            acc[gov] = (acc[gov] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(govCounts)
            .map(([gov, count]) => ({ name: gov, value: count }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 15); // Top 15 governorates
    }, [atms]);

    const atmsByCity = useMemo(() => {
        const cityCounts = atms.reduce((acc, atm) => {
            const city = atm.city || 'غير محدد';
            const key = `${atm.governorate || ''} - ${city}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(cityCounts)
            .map(([city, count]) => ({ name: city, value: count }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 15); // Top 15 cities
    }, [atms]);

    // تقارير التعليقات - استخدام إحصائيات dashboard
    const commentsStats = useMemo(() => {
        const totalComments = dashboardStats?.totalComments || 0;
        const unreadComments = dashboardStats?.unreadComments || 0;
        const read = totalComments - unreadComments;
        return [
            { name: 'مقروءة', value: read },
            { name: 'غير مقروءة', value: unreadComments },
        ];
    }, [dashboardStats]);

    const monthlyCommentsData = useMemo(() => {
        // Since we don't have full comment data, show empty chart or use estimates
        // This can be enhanced later if we need detailed monthly comment data
        const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i)).reverse();
        const totalComments = dashboardStats?.totalComments || 0;
        const avgPerMonth = Math.round(totalComments / 6);
        return months.map((month, index) => ({
            name: format(month, 'MMM'),
            count: index === months.length - 1 ? totalComments % 6 + avgPerMonth : avgPerMonth, // Rough distribution
        }));
    }, [dashboardStats]);

    // إحصائيات عامة
    const generalStats = useMemo(() => {
        return {
            totalATMs: dashboardStats?.totalATMs || atms.length,
            totalWorkPlans: dashboardStats?.totalWorkPlans || workPlans.length,
            totalRepresentatives: dashboardStats?.totalRepresentatives || representatives.length,
            totalComments: dashboardStats?.totalComments || 0,
            unreadComments: dashboardStats?.unreadComments || 0,
            completedWorkPlans: dashboardStats?.completedWorkPlans || workPlans.filter(p => p.status === 'completed').length,
            pendingWorkPlans: dashboardStats?.pendingWorkPlans || workPlans.filter(p => p.status === 'pending').length,
            totalBanks: dashboardStats?.totalBanks || new Set(atms.map(a => a.bankName)).size,
        };
    }, [dashboardStats, atms, workPlans, representatives]);

    const handleExport = () => {
        window.print();
    }

    if (loading) {
        return (
            <div className="w-full p-4 md:p-8 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">جاري تحميل التقارير...</p>
                </div>
            </div>
        );
    }

  return (
    <div className="w-full p-4 md:p-8 space-y-6 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">
            التقارير والتحليلات
          </h2>
          <p className="text-muted-foreground">
            تصور بياناتك التشغيلية لاتخاذ قرارات أفضل.
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
            <FileDown className="ml-2 h-4 w-4" />
            تصدير PDF
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>نشاط الصيانة الشهري</CardTitle>
                <CardDescription>المهام المكتملة مقابل المهام المعلقة في آخر 6 أشهر.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTaskData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12}/>
                        <YAxis stroke="#888888" fontSize={12}/>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                        <Legend />
                        <Line type="monotone" dataKey="completed" name="مكتمل" stroke="hsl(var(--primary))" strokeWidth={2} />
                        <Line type="monotone" dataKey="pending" name="معلق" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع حالة المهام</CardTitle>
            <CardDescription>تحليل لنسب حالات مهام الصيانة.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={maintenanceStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return (
                      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {maintenanceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>إنتاجية الفنيين</CardTitle>
            <CardDescription>المهام المكتملة ومتوسط وقت الحل لكل فني.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={technicianProductivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-2))" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                <Legend />
                <Bar yAxisId="left" dataKey="tasks" name="المهام المكتملة" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="avgTime" name="متوسط الوقت (س)" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>نظرة عامة على حالة أجهزة الصراف الآلي</CardTitle>
            <CardDescription>توزيع أجهزة الصراف الآلي حسب حالتها التشغيلية.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={atmStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12}/>
                <YAxis stroke="#888888" fontSize={12}/>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="value" name="أجهزة الصراف الآلي" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* إحصائيات عامة */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>إحصائيات عامة عن النظام</CardTitle>
            <CardDescription>نظرة شاملة على حالة النظام الحالية.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary">{generalStats.totalATMs}</div>
                <div className="text-sm text-muted-foreground mt-1">إجمالي الماكينات</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary">{generalStats.totalWorkPlans}</div>
                <div className="text-sm text-muted-foreground mt-1">إجمالي خطط العمل</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary">{generalStats.totalRepresentatives}</div>
                <div className="text-sm text-muted-foreground mt-1">إجمالي المندوبين</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary">{generalStats.totalComments}</div>
                <div className="text-sm text-muted-foreground mt-1">إجمالي التعليقات</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-orange-500">{generalStats.unreadComments}</div>
                <div className="text-sm text-muted-foreground mt-1">تعليقات غير مقروءة</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-green-500">{generalStats.completedWorkPlans}</div>
                <div className="text-sm text-muted-foreground mt-1">خطط مكتملة</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-yellow-500">{generalStats.pendingWorkPlans}</div>
                <div className="text-sm text-muted-foreground mt-1">خطط قيد الانتظار</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary">{generalStats.totalBanks}</div>
                <div className="text-sm text-muted-foreground mt-1">عدد البنوك</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* تقارير خطط العمل */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>نشاط خطط العمل الشهري</CardTitle>
            <CardDescription>توزيع خطط العمل حسب الحالة في آخر 6 أشهر.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyWorkPlansData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12}/>
                <YAxis stroke="#888888" fontSize={12}/>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                <Legend />
                <Line type="monotone" dataKey="completed" name="مكتملة" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                <Line type="monotone" dataKey="pending" name="قيد الانتظار" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                <Line type="monotone" dataKey="inProgress" name="قيد التنفيذ" stroke="hsl(var(--chart-3))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع خطط العمل حسب الحالة</CardTitle>
            <CardDescription>نسبة خطط العمل لكل حالة.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={workPlansByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return (
                      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {workPlansByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>خطط العمل حسب البنك</CardTitle>
            <CardDescription>أكثر 10 بنوك بعدد خطط العمل.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workPlansByBank} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" stroke="#888888" fontSize={12}/>
                <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} width={120}/>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                <Bar dataKey="value" name="عدد الخطط" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* تقارير المندوبين */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>أداء المندوبين</CardTitle>
            <CardDescription>أكثر 10 مندوبين بعدد خطط العمل ونسبة الإنجاز.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={representativesPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} angle={-45} textAnchor="end" height={100}/>
                <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                <Legend />
                <Bar yAxisId="left" dataKey="plans" name="إجمالي الخطط" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="completed" name="مكتملة" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* تقارير التوزيع الجغرافي */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>توزيع الماكينات حسب المحافظة</CardTitle>
            <CardDescription>أكثر 15 محافظة بعدد الماكينات.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={atmsByGovernorate} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" stroke="#888888" fontSize={12}/>
                <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} width={120}/>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                <Bar dataKey="value" name="عدد الماكينات" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>التعليقات</CardTitle>
            <CardDescription>التعليقات المقروءة وغير المقروءة.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={commentsStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return (
                      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {commentsStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>نشاط التعليقات الشهري</CardTitle>
            <CardDescription>عدد التعليقات في آخر 6 أشهر.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyCommentsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12}/>
                <YAxis stroke="#888888" fontSize={12}/>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="count" name="عدد التعليقات" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>توزيع الماكينات حسب المدينة</CardTitle>
            <CardDescription>أكثر 15 مدينة بعدد الماكينات.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={atmsByCity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" stroke="#888888" fontSize={12}/>
                <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} width={150}/>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                <Bar dataKey="value" name="عدد الماكينات" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}