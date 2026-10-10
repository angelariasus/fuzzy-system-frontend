'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { obtenerMembresias, obtenerReglas } from '@/lib/api';
import { PUNTOS_MEMBRESIAS } from '@/lib/constants';

export function Providers({ children }: { children: ReactNode }) {
  // El cliente se crea una sola vez por sesión del navegador (no en cada render).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false } },
      }),
  );

  // Precarga de datos estáticos al montar el layout: curvas y reglas ya están en caché al abrir cualquier vista.
  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: ['membresias', PUNTOS_MEMBRESIAS],
      queryFn: ({ signal }) => obtenerMembresias(PUNTOS_MEMBRESIAS, signal),
      staleTime: Infinity,
    });
    void queryClient.prefetchQuery({
      queryKey: ['reglas'],
      queryFn: ({ signal }) => obtenerReglas(signal),
      staleTime: Infinity,
    });
  }, [queryClient]);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="bottom-right" closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
