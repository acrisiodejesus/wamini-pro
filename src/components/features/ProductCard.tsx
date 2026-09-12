'use client';

import React, { useState } from 'react';
import { MapPin, User, MessageCircle, Loader2 } from 'lucide-react';
import { Product } from '@/types';
import apiClient, { getToken } from '@/lib/api/client';
import clsx from 'clsx';
import { useAuthStore } from '@/stores/authStore';
import SubscriptionPaywallModal from '@/components/features/SubscriptionPaywallModal';
import { useCreateNegotiation } from '@/hooks/useNegotiations';

interface ProductCardProps {
  product: Product;
  apiProductId?: number;
}

export default function ProductCard({ product, apiProductId }: ProductCardProps) {
  const [contacting, setContacting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { user } = useAuthStore();
  const { mutateAsync: createNegotiation } = useCreateNegotiation();

  const isMyProduct = user?.id?.toString() === product.seller.id.toString();

  const handleContact = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isMyProduct) return;

    if (!user) {
      window.location.href = '/pt/auth/login';
      return;
    }

    const isSubscribed = user.subscription_status === 'active' && user.subscription_plan && user.subscription_plan !== 'free';
    if (!isSubscribed) {
      setShowPaywall(true);
      return;
    }

    const rawId = apiProductId || product.id;
    const cleanId = typeof rawId === 'string' ? Number(rawId.replace(/^(product_|input_|transport_)/, '')) : Number(rawId);
    
    if (!cleanId || isNaN(cleanId)) return;

    setContacting(true);
    try {
      const payload: any = {
        messages: [{ body: `Olá! Tenho interesse em "${product.name}". Ainda está disponível?` }],
      };

      if (product.item_type === 'input') {
        payload.input_id = cleanId;
      } else if (product.item_type === 'transport') {
        payload.transport_id = cleanId;
      } else {
        payload.product_id = cleanId;
      }

      await createNegotiation(payload);
      window.location.href = '/pt/negotiation';
    } catch (err: any) {
      if (err?.response?.status === 401) {
        window.location.href = '/pt/auth/login';
      } else {
        alert('Erro ao iniciar negociação. Tenta de novo.');
      }
    } finally {
      setContacting(false);
    }
  };

  return (
    <div
      className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden"
      aria-label={`${product.name} — ${product.price} meticais por ${product.unit}`}
    >
      {/* Image */}
      <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={`Imagem de ${product.name}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
            🌾
          </div>
        )}
        {/* Category badge */}
        <span className="absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full bg-white/90 text-gray-700 shadow-sm">
          {product.category}
        </span>
      </div>

      <div className="p-4">
        <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-2">
          {product.name}
        </h3>

        <div className="mt-3 flex items-center justify-between">
          <div className="font-black text-xl text-gray-900">
            {product.price}{' '}
            <span className="text-sm font-normal text-gray-400">MTs / {product.unit}</span>
          </div>
          {product.quantity > 0 && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
              {product.quantity} disponível
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <User size={12} aria-hidden="true" />
            <span>{product.seller.name}</span>
          </div>
          {product.location && (
            <div className="flex items-center gap-1">
              <MapPin size={12} aria-hidden="true" />
              <span>{product.location}</span>
            </div>
          )}
        </div>

        {/* Contact button */}
        <button
          onClick={handleContact}
          disabled={contacting || isMyProduct}
          className={clsx(
            "mt-4 w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60",
            isMyProduct ? "bg-gray-100 text-gray-500 border border-gray-200" : "text-black"
          )}
          style={isMyProduct ? {} : { background: 'linear-gradient(135deg, #D8FF12 0%, #FBB03B 100%)' }}
          aria-label={isMyProduct ? "Este é o teu anúncio" : `Contactar vendedor sobre ${product.name}`}
        >
          {isMyProduct ? (
            <>O teu anúncio</>
          ) : contacting ? (
            <><Loader2 size={16} className="animate-spin" /> A contactar…</>
          ) : (
            <><MessageCircle size={16} /> Contactar</>
          )}
        </button>
      </div>

      <SubscriptionPaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
      />
    </div>
  );
}
