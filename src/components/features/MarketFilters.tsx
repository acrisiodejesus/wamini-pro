'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MarketFiltersProps {
  onSearch: (query: string) => void;
  onCategoryChange: (category: string) => void;
  activeCategory: string;
  onAdvertiseClick?: () => void;
}

export default function MarketFilters({ onSearch, onCategoryChange, activeCategory, onAdvertiseClick }: MarketFiltersProps) {
  const t = useTranslations('common');
  
  const categories = [
    { id: 'Tudo', label: t('categories.all') },
    { id: 'Produtos', label: t('categories.products') },
    { id: 'Transporte', label: t('categories.transport') },
    { id: 'Insumos', label: t('categories.inputs') },
  ];

  return (
    <div className="space-y-6 mb-8" role="search" aria-label="Filtrar produtos do mercado">
      <div className="flex gap-3 max-w-4xl mx-auto">
        <div className="relative flex-[60]">
          <label htmlFor="market-search" className="sr-only">{t('search')}</label>
          <input
            id="market-search"
            type="search"
            placeholder={t('search')}
            className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-900 focus:outline-none focus:border-gray-900 transition-colors"
            onChange={(e) => onSearch(e.target.value)}
            aria-label={t('search')}
          />
          <Search className="absolute  right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
        </div>
        
        {onAdvertiseClick && (
          <button 
            onClick={onAdvertiseClick}
            className="flex-[40] btn-gradient py-3 font-bold text-lg rounded-full"
            aria-label="Criar um novo anúncio no mercado"
          >
            {t('advertise')}
          </button>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Filtrar por categoria">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            aria-pressed={activeCategory === cat.id}
            aria-label={`Filtrar por: ${cat.label}${activeCategory === cat.id ? ' (ativo)' : ''}`}
            className={`px-6 py-2 rounded-full text-sm font-bold border transition-colors ${
              activeCategory === cat.id
                ? 'gradient-wamini border-transparent text-black'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
