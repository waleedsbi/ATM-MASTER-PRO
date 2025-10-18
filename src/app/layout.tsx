import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ATM Master Pro',
  description: 'إدارة أسطول أجهزة الصراف الآلي بسهولة وذكاء.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress hydration warnings caused by browser extensions
              (function() {
                const originalError = console.error;
                console.error = function(...args) {
                  if (
                    typeof args[0] === 'string' &&
                    (args[0].includes('Hydration') || 
                     args[0].includes('hydration') ||
                     args[0].includes('did not match') ||
                     args[0].includes('fdprocessedid'))
                  ) {
                    return;
                  }
                  originalError.apply(console, args);
                };
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
         <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 1cm;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none !important;
              }
            }
          `}
        </style>
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <AuthProvider>
          <div className="printable-area">
              <AppShell>{children}</AppShell>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
