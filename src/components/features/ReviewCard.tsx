'use client';

import React from 'react';
import { Review } from '@/lib/api/types';
import StarRating from '@/components/ui/StarRating';

interface ReviewCardProps {
  review: Review;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  return `há ${months} mês${months > 1 ? 'es' : ''}`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <article
      className="flex gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      aria-label={`Avaliação de ${review.reviewer_name}: ${review.rating} estrelas`}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black text-black"
        style={{ background: 'linear-gradient(135deg, #D8FF12 0%, #FBB03B 100%)' }}
        aria-hidden="true"
      >
        {getInitials(review.reviewer_name)}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-bold text-gray-900 text-sm truncate">{review.reviewer_name}</span>
          <time
            dateTime={review.created_at}
            className="text-xs text-gray-400 flex-shrink-0"
          >
            {timeAgo(review.created_at)}
          </time>
        </div>

        {/* Stars */}
        <div className="mt-1">
          <StarRating value={review.rating} readOnly size="sm" />
        </div>

        {/* Comment */}
        {review.comment && (
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
        )}
      </div>
    </article>
  );
}
