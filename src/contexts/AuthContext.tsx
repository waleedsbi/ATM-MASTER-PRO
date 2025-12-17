'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

import type { UserRole } from '@/lib/permissions';

export interface User {
  id: string | number;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Track if component is mounted to handle SSR safely
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Check if user is logged in from localStorage
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('Loading user from localStorage:', parsedUser);
          setUser(parsedUser);
          
          // إنشاء cookie من localStorage لضمان عمل middleware
          // تحقق أولاً إذا كان cookie موجوداً وصحيحاً
          const cookies = document.cookie.split(';');
          const userCookie = cookies.find(c => c.trim().startsWith('user='));
          
          // التحقق من أن cookie موجود وصحيح
          let cookieValid = false;
          if (userCookie) {
            try {
              const cookieValue = decodeURIComponent(userCookie.split('=')[1]);
              const cookieUser = JSON.parse(cookieValue);
              cookieValid = !!(cookieUser && cookieUser.email && cookieUser.id);
            } catch (e) {
              cookieValid = false;
            }
          }
          
          if (!cookieValid) {
            // استخدام API endpoint لإنشاء cookie بشكل صحيح
            // استخدام await لضمان اكتمال العملية قبل المتابعة
            (async () => {
              try {
                await fetch('/api/auth/sync-cookie', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ user: parsedUser }),
                  credentials: 'include', // مهم لضمان حفظ cookie
                });
                console.log('Cookie synced from localStorage');
              } catch (error) {
                console.error('Error syncing cookie:', error);
                // Fallback: إنشاء cookie مباشرة
                document.cookie = `user=${encodeURIComponent(storedUser)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
              }
            })();
          }
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('user');
          // حذف cookie إذا كان موجوداً
          document.cookie = 'user=; path=/; max-age=0';
        }
      } else {
        console.log('No user found in localStorage');
        // لا نحذف cookie تلقائياً هنا - قد يكون المستخدم في جلسة أخرى
        // فقط نتحقق من أن localStorage و cookie متطابقان
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // محاولة قراءة النص أولاً للتحقق من نوع الاستجابة
      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // إذا فشل parsing، استخدم النص الخام
          console.error('Error parsing error response:', parseError);
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // محاولة parsing البيانات
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing login response:', parseError);
        throw new Error('حدث خطأ أثناء معالجة استجابة الخادم');
      }

      // التحقق من وجود بيانات المستخدم
      if (!data || !data.user) {
        console.error('Invalid login response:', data);
        throw new Error('استجابة غير صحيحة من الخادم');
      }

      console.log('Login response:', data);
      const user: User = {
        id: String(data.user.id), // Ensure ID is string
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        isActive: data.user.isActive,
      };

      // التحقق من صحة بيانات المستخدم
      if (!user.email || !user.name || !user.role) {
        console.error('Invalid user data:', user);
        throw new Error('بيانات المستخدم غير مكتملة');
      }

      console.log('Setting user:', user);
      setUser(user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
        console.log('User saved to localStorage');
      }
    } catch (error) {
      console.error('Login error:', error);
      // إعادة رمي الخطأ مع رسالة واضحة
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('حدث خطأ أثناء تسجيل الدخول');
    }
  };

  const logout = async () => {
    try {
      // حذف cookie من الخادم
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // حذف بيانات المستخدم من الحالة المحلية
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        // حذف cookie أيضاً
        document.cookie = 'user=; path=/; max-age=0';
      }
    }
  };

  // معالجة تسجيل الخروج عند إغلاق التبويب/المتصفح
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;

    const handleBeforeUnload = () => {
      // استخدام sendBeacon لإرسال طلب تسجيل الخروج حتى عند إغلاق التبويب
      // هذا يعمل بشكل أفضل من fetch في حالة إغلاق التبويب
      if (navigator.sendBeacon) {
        try {
          // sendBeacon يحتاج إلى Blob أو FormData أو string
          const blob = new Blob([JSON.stringify({})], { type: 'application/json' });
          navigator.sendBeacon('/api/auth/logout', blob);
        } catch (error) {
          console.error('Error sending beacon:', error);
        }
      }
      
      // حذف البيانات المحلية
      localStorage.removeItem('user');
      document.cookie = 'user=; path=/; max-age=0';
    };

    // إضافة event listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // تنظيف عند unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  // Provide safe values during SSR to avoid context errors
  const contextValue = {
    user: isMounted ? user : null,
    isLoading: isMounted ? isLoading : true,
    login,
    logout,
    isAuthenticated: isMounted ? !!user : false,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During SSR/prerendering, return a default context to avoid errors
    if (typeof window === 'undefined') {
      return {
        user: null,
        isLoading: true,
        login: async () => {},
        logout: () => {},
        isAuthenticated: false,
      };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

