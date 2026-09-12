'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { VoiceProvider } from '@/contexts/VoiceContext';
import dynamic from 'next/dynamic';

const NotificationSystem = dynamic(
  () => import('@/components/layout/NotificationSystem'),
  { ssr: false }
);

import AuthSync from '@/components/auth/AuthSync';

export default function Providers({ children }: { children: ReactNode }) {
  // useState garante que cada request tem o seu próprio QueryClient no SSR
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dados considerados "frescos" durante 60 segundos — evita re-fetch
            // ao navegar entre páginas dentro do mesmo minuto
            staleTime: 60 * 1000,
            // Retry automático até 2 vezes em caso de falha de rede
            retry: 2,
            // Não refetch ao focar a janela (reduz requests desnecessários)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <VoiceProvider>
        <AuthSync />
        <NotificationSystem />
        {children}
      </VoiceProvider>
    </QueryClientProvider>
  );
}
