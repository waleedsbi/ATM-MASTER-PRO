'use client';
import * as React from 'react';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AtmProLogo } from "@/components/icons"
import Link from "next/link"
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  // إعادة التوجيه إلى الصفحة الرئيسية إذا كان المستخدم مسجل دخول بالفعل
  React.useEffect(() => {
    if (!authLoading && user) {
      console.log('User already logged in, redirecting to home');
      router.replace('/');
    }
  }, [user, authLoading, router]);

  // عرض loading أثناء التحقق من حالة المصادقة
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // إذا كان المستخدم مسجل دخول، لا نعرض صفحة تسجيل الدخول (سيتم إعادة التوجيه)
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
      });
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'مرحباً بك في النظام',
      });
      // إعادة التوجيه إلى الصفحة الرئيسية بعد تسجيل الدخول
      router.push('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'فشل تسجيل الدخول',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الدخول',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <AtmProLogo className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">ATM Master Pro</CardTitle>
          <CardDescription>
            أدخل بريدك الإلكتروني أدناه لتسجيل الدخول إلى حسابك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">كلمة المرور</Label>
                <Link
                  href="#"
                  className="mr-auto inline-block text-sm underline"
                >
                  هل نسيت كلمة المرور؟
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
            <Button variant="outline" className="w-full" type="button" disabled>
              تسجيل الدخول باستخدام جوجل
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            ليس لديك حساب؟{" "}
            <Link href="#" className="underline">
              إنشاء حساب
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
