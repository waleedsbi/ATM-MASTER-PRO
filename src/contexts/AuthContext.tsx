'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CLIENT' | 'REPRESENTATIVE';
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

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    // In production, replace with actual API call
    const mockUsers: Record<string, User> = {
      'admin@atm.com': {
        id: '1',
        email: 'admin@atm.com',
        name: 'المسؤول',
        role: 'ADMIN',
        isActive: true,
      },
      'client@atm.com': {
        id: '2',
        email: 'client@atm.com',
        name: 'العميل',
        role: 'CLIENT',
        isActive: true,
      },
    };

    const mockPasswords: Record<string, string> = {
      'admin@atm.com': 'admin123',
      'client@atm.com': 'client123',
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (mockPasswords[email] === password && mockUsers[email]) {
      const user = mockUsers[email];
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

