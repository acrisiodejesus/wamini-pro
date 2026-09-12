'use client';

import { useQuery } from '@tanstack/react-query';
import { productsService } from '@/lib/api/services/products';
import type { Product } from '@/lib/api/types';

interface UseProductsReturn {
  products: Product[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProducts(
  filters?: { category?: string; search?: string },
  pagination?: { page?: number; per_page?: number }
): UseProductsReturn {
  const { data, isLoading, error, refetch } = useQuery({
    // A query key inclui os filtros — React Query re-busca automaticamente
    // quando a categoria ou pesquisa mudam, e usa cache quando são iguais
    queryKey: ['products', filters?.category, filters?.search, pagination?.page, pagination?.per_page],
    queryFn: () => productsService.getProducts(filters),
    // Dados considerados "frescos" durante 60 segundos
    staleTime: 60 * 1000,
    // Manter dados anteriores enquanto carrega novos (evita flash de loading)
    placeholderData: (prev) => prev,
  });

  return {
    products: data ?? [],
    total: data?.length ?? 0,
    isLoading,
    error: error ? (error as any).response?.data?.message ?? error.message : null,
    refetch,
  };
}
