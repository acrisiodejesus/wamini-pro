import { useQuery } from '@tanstack/react-query';
import { getReviewsByUserId } from '@/lib/api/services/reviews';

/**
 * React Query hook to fetch reviews for a given target user.
 * Cached for 2 minutes to avoid abuse.
 */
export function useReviews(targetUserId: number | null) {
  return useQuery({
    queryKey: ['reviews', targetUserId],
    queryFn: () => getReviewsByUserId(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000,
  });
}
