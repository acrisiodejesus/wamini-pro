'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Camera, UploadCloud } from 'lucide-react';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
import apiClient from '@/lib/api/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';

interface AdvertiseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories = ['PRODUTOS', 'TRANSPORTE', 'INSUMOS'] as const;
type Category = typeof categories[number];

interface PriceData {
  product: string;
  price: string;
  unit: string;
}

export default function AdvertiseModal({ isOpen, onClose }: AdvertiseModalProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('PRODUTOS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [suggestedPriceMsg, setSuggestedPriceMsg] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const queryClient = useQueryClient();
  
  const nameValue = watch('name');

  // Fetch prices for suggestions
  const { data: prices = [] } = useQuery<PriceData[]>({
    queryKey: ['prices'],
    queryFn: async () => {
      const res = await apiClient.get<PriceData[]>('/prices');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: isOpen,
  });

  // Auto-suggest logic
  useEffect(() => {
    if (activeCategory === 'PRODUTOS' && nameValue) {
      const exactMatch = prices.find((p) => p.product.toLowerCase() === nameValue.toLowerCase());
      if (exactMatch) {
        setValue('price', exactMatch.price);
        setSuggestedPriceMsg(`Encontrámos no mercado a ${exactMatch.price} ${exactMatch.unit}`);
      } else {
        const partialMatch = prices.find((p) => p.product.toLowerCase().includes(nameValue.toLowerCase()));
        if (partialMatch) {
          setSuggestedPriceMsg(`Pode ser: ${partialMatch.product} a ${partialMatch.price} ${partialMatch.unit}`);
        } else {
          setSuggestedPriceMsg(null);
        }
      }
    } else {
      setSuggestedPriceMsg(null);
    }
  }, [nameValue, prices, activeCategory, setValue]);

  if (!isOpen) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPhotoUrl(res.data.url);
    } catch (err: any) {
      console.error('File upload error:', err);
      alert('Aviso: Não foi possível carregar a imagem da tua câmara/galeria. Verifica o limite de tamanho.');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        quantity: Number(data.quantity) || 0,
        price: Number(data.price) || 0,
        location: data.location,
        photo: photoUrl || null,
      };

      if (activeCategory === 'PRODUTOS') {
        await apiClient.post('/products', { ...payload, category: 'PRODUTOS' });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      } else if (activeCategory === 'INSUMOS') {
        await apiClient.post('/inputs', payload);
        queryClient.invalidateQueries({ queryKey: ['inputs'] });
      } else if (activeCategory === 'TRANSPORTE') {
        await apiClient.post('/transports', {
          transport_type: data.productType || 'Pick-up',
          name: data.name,
          price_per_km: Number(data.price) || 0,
          location: data.location,
          photo: photoUrl || null,
        });
        queryClient.invalidateQueries({ queryKey: ['transports'] });
      }

      reset();
      setPhotoUrl('');
      onClose();
      alert('Anúncio publicado com sucesso!');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao publicar anúncio. Verifica se estás autenticado.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="advertise-modal-title"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 id="advertise-modal-title" className="text-2xl font-bold">CRIAR ANÚNCIO</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 p-4 border-b border-gray-200 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setPhotoUrl(''); 
                reset();
              }}
              className={clsx(
                'px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2',
                activeCategory === cat
                  ? 'gradient-wamini text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5" noValidate>
          
          {/* Upload de Foto */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Fotografia (Opcional)</label>
            <div className="flex items-center gap-4">
              {photoUrl ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <img src={photoUrl} alt="Preview" className="object-cover w-full h-full" />
                  <button type="button" onClick={() => setPhotoUrl('')} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><X size={14} /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  {isUploading ? <Loader2 size={24} className="animate-spin text-gray-400" /> : <Camera size={24} className="text-gray-400 mb-1" />}
                  <span className="text-xs text-gray-500 font-medium">{isUploading ? 'A enviar' : 'Capturar'}</span>
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={isUploading} />
                </label>
              )}
              {activeCategory === 'PRODUTOS' && !photoUrl && (
                <p className="text-xs text-gray-500 flex-1 leading-tight">
                  Caso não tenhas fotografia, o Wamini tentará adicionar automaticamente a melhor foto com base no nome de origem de Moçambique inserido.
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="adv-name" className="block text-sm font-bold text-gray-700 mb-1">Nome do {activeCategory.toLowerCase()}</label>
            <input 
              id="adv-name"
              {...register('name', { required: true })} 
              type="text" 
              list="crop-suggestions"
              placeholder="Ex: Milho Branco"
              className="w-full"
              autoComplete="off"
            />
            {/* Datalist for Auto-suggest */}
            {activeCategory === 'PRODUTOS' && (
              <datalist id="crop-suggestions">
                {prices.map(p => <option key={p.product} value={p.product} />)}
              </datalist>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="adv-quantity" className="block text-sm font-bold text-gray-700 mb-1">Quantidade</label>
              <input 
                id="adv-quantity"
                {...register('quantity', { required: true })} 
                type="text" 
                placeholder="Ex: 50 kg"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="adv-price" className="block text-sm font-bold text-gray-700 mb-1">Preço</label>
              <input 
                id="adv-price"
                {...register('price', { required: true })} 
                type="number" 
                placeholder="Meticais"
                className="w-full"
              />
              {suggestedPriceMsg && (
                <p className="text-xs font-semibold text-green-600 mt-1" aria-live="polite">{suggestedPriceMsg}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="adv-location" className="block text-sm font-bold text-gray-700 mb-1">Localização</label>
            <input 
              id="adv-location"
              {...register('location', { required: true })} 
              type="text" 
              placeholder="Ex: Nametil"
              className="w-full"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full btn-gradient font-bold py-3 text-lg flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> A publicar...</> : (
              <><UploadCloud size={20} /> PUBLICAR ANÚNCIO</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
