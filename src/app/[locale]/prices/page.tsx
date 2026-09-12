'use client';

import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { Link } from '@/i18n/routing';
import { Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import NotificationsDropdown from '@/components/features/NotificationsDropdown';

interface Price {
  id: number;
  product: string;
  price: string;
  unit: string;
  location: string;
  date: string;
  trend: 'up' | 'down' | 'stable';
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp size={16} className="text-green-500" />;
  if (trend === 'down') return <TrendingDown size={16} className="text-red-500" />;
  return <Minus size={16} className="text-gray-400" />;
}

export default function PricesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: prices = [], isLoading } = useQuery<Price[]>({
    queryKey: ['prices'],
    queryFn: async () => {
      const res = await apiClient.get<Price[]>('/prices');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = prices.filter((p) =>
    p.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64 pb-20">
        <header className="bg-white p-4 md:p-6 flex justify-between items-center md:shadow-sm sticky top-0 z-10">
          <h1 className="text-2xl md:text-3xl font-black logo-wamini">Wamini</h1>
          <div className="flex gap-3">
            <NotificationsDropdown />
            <LanguageSwitcher />
            <Link href="/settings" className="p-2 rounded-full hover:bg-gray-100">
              <Settings size={24} />
            </Link>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <h2 className="text-2xl font-bold mb-6">Preços de Mercado</h2>

          <div className="mb-6 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Procurar produto ou localização..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[600px]">
                  <thead className="gradient-wamini">
                    <tr>
                      <th className="text-left p-4 font-bold">Produto</th>
                      <th className="text-left p-4 font-bold">Preço</th>
                      <th className="text-left p-4 font-bold hidden md:table-cell">Data</th>
                      <th className="text-left p-4 font-bold">Tendência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((price) => (
                      <tr key={price.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-4 font-semibold whitespace-nowrap">{price.product}</td>
                        <td className="p-4 text-green-600 font-bold whitespace-nowrap">{price.price} {price.unit}</td>
                        <td className="p-4 text-gray-500 text-sm hidden md:table-cell whitespace-nowrap">{price.date}</td>
                        <td className="p-4"><TrendIcon trend={price.trend} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Nenhum preço encontrado</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      <MobileNav />
    </>
  );
}
