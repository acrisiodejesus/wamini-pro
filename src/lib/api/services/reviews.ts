import apiClient from '@/lib/api/client';
import { Review, CreateReviewData, ReviewsResponse } from '@/lib/api/types';

/**
 * Fetch all reviews targeting a specific user.
 */
export async function getReviewsByUserId(targetUserId: number): Promise<ReviewsResponse> {
  const res = await apiClient.get<ReviewsResponse>(`/reviews?target_id=${targetUserId}`);
  return res.data;
}

/**
 * Submit a new review.
 * Client-side hard limit: comment max 300 chars (mirrors the server Zod + SQLite CHECK).
 */
export async function createReview(data: CreateReviewData): Promise<Review> {
  if (data.comment && data.comment.length > 300) {
    throw new Error('O comentário não pode exceder 300 caracteres.');
  }
  const res = await apiClient.post<{ id: number; comment: string | null }>('/reviews', data);
  return res.data as unknown as Review;
}

/**
 * Update an existing review (only if you own it).
 */
export async function updateReview(reviewId: number, data: { rating: number; comment?: string }): Promise<void> {
  await apiClient.put(`/reviews/${reviewId}`, data);
}
