'use client';

import { useState, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { LoadingProvider } from '@/components/loading-provider';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <LoadingProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </LoadingProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
