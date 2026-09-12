'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { negotiationsService } from '@/lib/api/services/negotiations';
import type { Negotiation, Message, SendMessageData, CreateNegotiationData } from '@/lib/api/types';

export function useNegotiations() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['negotiations'],
    queryFn: () => negotiationsService.getNegotiations(),
    staleTime: 10 * 1000,
    refetchInterval: 10000, // auto poll
  });

  return {
    negotiations: data ?? [],
    isLoading,
    error: error ? (error as any).message : null,
    refetch,
  };
}

export function useMessages(negotiationId: number | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['messages', negotiationId],
    queryFn: () => {
      if (!negotiationId) return Promise.resolve([]);
      return negotiationsService.getMessages(negotiationId);
    },
    enabled: !!negotiationId,
    refetchInterval: 5000, // auto poll for new messages
  });

  return {
    messages: data ?? [],
    isLoading,
    error: error ? (error as any).message : null,
    refetch,
  };
}

export function useSendMessage(negotiationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageData) => negotiationsService.sendMessage(negotiationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', negotiationId] });
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
    },
  });
}

export function useCreateNegotiation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNegotiationData) => negotiationsService.createNegotiation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negotiations'] });
    },
  });
}
