'use client';

import React from 'react';
import clsx from 'clsx';

interface StarRatingProps {
  value: number;           // 0..5
  onChange?: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
}

const SIZE_MAP = { sm: 14, md: 20, lg: 28 };

export default function StarRating({ value, onChange, size = 'md', readOnly = false }: StarRatingProps) {
  const px = SIZE_MAP[size];
  const [hovered, setHovered] = React.useState(0);

  const display = hovered || value;

  return (
    <div
      className="flex items-center gap-0.5"
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`Classificação: ${value} de 5 estrelas`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
          className={clsx(
            'transition-all duration-100',
            readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 rounded'
          )}
          style={{ background: 'none', border: 'none', padding: 2 }}
        >
          <svg
            width={px}
            height={px}
            viewBox="0 0 24 24"
            fill={display >= star ? '#FBB03B' : 'none'}
            stroke={display >= star ? '#FBB03B' : '#D1D5DB'}
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.518-4.673z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
