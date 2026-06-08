'use client';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider, ToastViewport } from '@/components/ui/Toast';
import { EditingProvider } from '@/components/EditingContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>
        <EditingProvider>
          <ToastProvider>
            {children}
            <ToastViewport />
          </ToastProvider>
        </EditingProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
