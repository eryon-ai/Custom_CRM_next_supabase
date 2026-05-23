import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { ReactQueryProvider } from '@/lib/react-query/provider';
import { WebVitals } from '@/components/WebVitals';
import './globals.css';

export const metadata: Metadata = {
  title: 'Marble Mart CRM',
  description: 'Enterprise CRM & Field Operations Platform',
  keywords: ['crm', 'marble', 'construction', 'field operations', 'sales'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MarbleMart" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <WebVitals />
            <Toaster
              position="top-right"
              richColors
              closeButton
              expand
            />
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
