'use client';

import React from 'react';
import { Star, Loader2, MessageSquareOff } from 'lucide-react';
import ReviewCard from '@/components/features/ReviewCard';
import StarRating from '@/components/ui/StarRating';
import { useReviews } from '@/hooks/useReviews';

interface UserReviewsProps {
  targetUserId: number;
  targetUserName?: string;
}

export default function UserReviews({ targetUserId, targetUserName }: UserReviewsProps) {
  const { data, isLoading, isError } = useReviews(targetUserId);

  return (
    <section
      className="bg-white rounded-2xl shadow-sm p-6"
      aria-label={`Avaliações de ${targetUserName ?? 'utilizador'}`}
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-5">
        <Star size={20} className="text-yellow-500 fill-yellow-400" aria-hidden="true" />
        <h3 className="text-lg font-bold text-gray-900">Avaliações</h3>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 size={28} className="animate-spin text-yellow-500" />
        </div>
      )}

      {isError && (
        <p className="text-red-500 text-sm">Erro ao carregar avaliações.</p>
      )}

      {data && !isLoading && (
        <>
          {/* Summary strip */}
          {data.total_count > 0 && (
            <div className="flex items-center gap-4 mb-5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="text-center">
                <p className="text-4xl font-black text-gray-900 leading-none">
                  {data.average_rating.toFixed(1)}
                </p>
                <p className="text-xs text-gray-400 mt-1">de 5</p>
              </div>
              <div className="flex-1">
                <StarRating value={Math.round(data.average_rating)} readOnly size="md" />
                <p className="text-sm text-gray-500 mt-1">
                  {data.total_count} avaliação{data.total_count !== 1 ? 'ões' : ''}
                </p>
              </div>
            </div>
          )}

          {/* List */}
          {data.reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
              <MessageSquareOff size={36} className="opacity-40" aria-hidden="true" />
              <p className="text-sm font-medium">Sem avaliações ainda</p>
              <p className="text-xs">Este utilizador ainda não foi avaliado.</p>
            </div>
          ) : (
            <ul className="space-y-3" role="list">
              {data.reviews.map((review) => (
                <li key={review.id}>
                  <ReviewCard review={review} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
