'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import apiClient from '@/lib/api/client';
import UserReviews from '@/components/features/UserReviews';

import { DISTRICTS } from '@/constants/districts';

const settingsSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  localization: z.string().min(1, 'Selecione um distrito'),
  mobile_number: z.string().min(9, 'Número inválido'),
  role: z.string().min(1),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const t = useTranslations('Common');
  const { user, login } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name || '',
      localization: (user as any)?.localization || '',
      mobile_number: (user as any)?.mobile_number || '',
      role: (user as any)?.role || 'buyer',
    },
  });

  const onSubmit = async (data: SettingsForm) => {
    setError(null);
    try {
      const response = await apiClient.put('/users/profile', data);
      
      // Actualizar a store
      const token = localStorage.getItem('wamini_token') || '';
      login(response.data, token);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao guardar alterações');
    }
  };

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64 pb-20">
        <header className="bg-white p-4 md:p-6 flex justify-between items-center shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Link href="/market" className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl md:text-3xl font-black logo-wamini">Wamini</h1>
          </div>
          <LanguageSwitcher />
        </header>

        <div className="max-w-2xl mx-auto p-4 md:p-8">
          <h2 className="text-2xl font-bold mb-6">Configurações da Conta</h2>

          <div className="bg-white rounded-2xl shadow-sm p-6 overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">Dados Pessoais</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input {...register('name')} className="w-full" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Telefone</label>
                  <input {...register('mobile_number')} className="w-full" />
                  {errors.mobile_number && <p className="text-red-500 text-xs mt-1">{errors.mobile_number.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distrito / Localização</label>
                  <select {...register('localization')} className="w-full">
                    {DISTRICTS.sort().map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.localization && <p className="text-red-500 text-xs mt-1">{errors.localization.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Papel no Mercado</label>
                  <select {...register('role')} className="w-full">
                    <option value="buyer">Comprador</option>
                    <option value="farmer">Produtor / Agricultor</option>
                    <option value="seller">Vendedor de Insumos</option>
                    <option value="transporter">Transportador</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-red-600 font-medium text-sm">{error}</p>
              )}

              {saved && (
                <p className="text-green-600 font-medium text-sm">✓ Configurações guardadas!</p>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-gradient flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> A guardar...</> : <><Save size={20} /> Guardar Alterações</>}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Zona de Perigo</h3>
            <button
              onClick={() => {
                if (confirm('Tens a certeza que queres terminar a sessão?')) {
                  useAuthStore.getState().logout();
                  window.location.href = '/';
                }
              }}
              className="text-red-500 font-medium hover:text-red-700 transition-colors"
            >
              Terminar Sessão
            </button>
          </div>

          {/* Reviews Section */}
          {user?.id && (
            <div className="mt-6">
              <UserReviews
                targetUserId={Number(user.id)}
                targetUserName={user.name}
              />
            </div>
          )}
        </div>
      </div>
      <MobileNav />
    </>
  );
}
