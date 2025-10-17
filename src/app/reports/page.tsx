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
import { maintenanceTasks, atms, technicians } from '@/lib/data';
import React, { useMemo } from 'react';
import { format, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

const maintenanceStatusData = Object.entries(
  maintenanceTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
).map(([name, value]) => ({ name, value }));

const atmStatusData = Object.entries(
  atms.reduce((acc, atm) => {
    acc[atm.status] = (acc[atm.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
).map(([name, value]) => ({ name, value }));

const technicianProductivityData = technicians.map(tech => ({
    name: tech.name,
    tasks: tech.tasksCompleted,
    avgTime: tech.avgResolutionTime
}));

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function ReportsPage() {
    const monthlyTaskData = useMemo(() => {
        const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i)).reverse();
        return months.map(month => {
            const monthStr = format(month, 'MMM yyyy');
            const completed = maintenanceTasks.filter(task => format(new Date(task.scheduledDate), 'MMM yyyy') === monthStr && task.status === 'Completed').length;
            const pending = maintenanceTasks.filter(task => format(new Date(task.scheduledDate), 'MMM yyyy') === monthStr && task.status === 'Pending').length;
            return { name: format(month, 'MMM'), completed, pending };
        });
    }, []);

    const handleExport = () => {
        window.print();
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