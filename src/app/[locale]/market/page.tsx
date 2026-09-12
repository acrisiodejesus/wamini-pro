'use client';

import React, { useState, useCallback, useRef } from 'react';
import MarketFilters from '@/components/features/MarketFilters';
import ProductCard from '@/components/features/ProductCard';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import { Link, useRouter } from '@/i18n/routing';
import { Settings } from 'lucide-react';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import NotificationsDropdown from '@/components/features/NotificationsDropdown';
import { Product } from '@/types';
import { Product as ApiProduct } from '@/lib/api/types';
import { Loader2 } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useTranslations } from 'next-intl';
import AdvertiseModal from '@/components/features/AdvertiseModal';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

// Adapter function to convert API Product to UI Product
function adaptApiProduct(apiProduct: any): Product {
  const isTransport = apiProduct.item_type === 'transport';
  return {
    id: apiProduct.id.toString(),
    name: apiProduct.name,
    category: apiProduct.category || 'PRODUTOS',
    price: apiProduct.price,
    unit: isTransport ? 'kg/km' : 'kg',
    item_type: apiProduct.item_type || 'product',
    quantity: apiProduct.quantity || 0,
    location: apiProduct.location || '',
    seller: {
      id: apiProduct.user_id?.toString() || '0',
      name: apiProduct.seller_name || 'Vendedor',
    },
    image: apiProduct.photo || '',
    description: '',
  };
}



export default function MarketPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Perfil incompleto: redirecionar para onboarding
  useEffect(() => {
    if (user) {
      const isIncomplete = (user as any).mobile_number?.startsWith('auth0_') || !(user as any).localization;
      if (isIncomplete) {
        router.push('/auth/complete-profile');
      }
    }
  }, [user, router]);

  const [activeCategory, setActiveCategory] = useState('Tudo');
  const [isAdvertiseModalOpen, setIsAdvertiseModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce: evita chamar a API a cada tecla — aguarda 400ms de pausa
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(query), 400);
  }, []);

  // Fetch products from API (com cache React Query)
  const { products, isLoading, error } = useProducts(
    activeCategory !== 'Tudo' ? { category: activeCategory, search: searchQuery } : { search: searchQuery },
    { page: 1, per_page: 20 }
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
          <MarketFilters 
            onSearch={handleSearch}
            onCategoryChange={setActiveCategory}
            activeCategory={activeCategory}
            onAdvertiseClick={() => setIsAdvertiseModalOpen(true)}
          />

          {isLoading && (
            <div className="flex justify-center items-center py-12" aria-live="polite" aria-label="A carregar produtos">
              <Loader2 size={48} className="animate-spin text-yellow-500" aria-hidden="true" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mt-6" role="alert">
              <p className="font-semibold">Erro ao carregar produtos</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!isLoading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={adaptApiProduct(product)}
                    apiProductId={product.id}
                  />
                ))}
              </div>

              {products.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">{t('no_products_found')}</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {isAdvertiseModalOpen && (
        <AdvertiseModal 
          isOpen={isAdvertiseModalOpen} 
          onClose={() => setIsAdvertiseModalOpen(false)} 
        />
      )}

      <MobileNav />
    </>
  );
}
