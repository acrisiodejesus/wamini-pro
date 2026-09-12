'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { motion } from 'framer-motion';
import { User, Phone, MapPin, AlertCircle, Sprout, Truck, ShoppingBag, Users as UsersIcon, CheckCircle2 } from 'lucide-react';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { DISTRICTS } from '@/constants/districts';
import apiClient from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';

const ROLE_ICONS = {
  farmer:      { Icon: Sprout,      color: '#2D6A4F', bg: '#f0faf4' },
  transporter: { Icon: Truck,       color: '#FBB03B', bg: '#fffbf0' },
  seller:      { Icon: ShoppingBag, color: '#374151', bg: '#f3f4f6' },
  buyer:       { Icon: UsersIcon,   color: '#1d4ed8', bg: '#eff6ff' },
};

const completeProfileSchema = z.object({
  role:            z.string().min(1, 'Selecione um papel'),
  name:            z.string().min(2, 'Nome muito curto'),
  phone:           z.string().min(9, 'Número de telefone inválido'),
  localization:    z.string().min(1, 'Selecione o seu distrito'),
});

type CompleteProfileForm = z.infer<typeof completeProfileSchema>;

export default function CompleteProfilePage() {
  const t = useTranslations('common');
  const router = useRouter();
  const { user, login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CompleteProfileForm>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      name: user?.name || '',
      role: (user as any)?.role || 'buyer',
      localization: (user as any)?.localization || '',
      phone: (user as any)?.mobile_number?.startsWith('auth0_') ? '' : (user as any)?.mobile_number || '',
    },
  });

  const roleValue = watch('role');

  const handleRoleSelect = (value: string) => {
    setValue('role', value, { shouldValidate: true });
  };

  const onSubmit = async (data: CompleteProfileForm) => {
    setIsLoading(true);
    setApiError(null);
    try {
      // 1. Update the profile via API
      const response = await apiClient.put('/users/profile', {
        name: data.name,
        mobile_number: data.phone,
        localization: data.localization,
        role: data.role,
      });

      // 2. Update the local store with the new user data
      // We reuse the 'login' method to force-update the user object and token sync
      const token = localStorage.getItem('wamini_token') || '';
      login(response.data, token);

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/market');
      }, 1500);

    } catch (error: any) {
      if (error.response?.status === 409) {
        setApiError('Este número de telefone já está a ser utilizado por outra conta');
      } else {
        setApiError(error.response?.data?.error || error.message || 'Erro ao guardar perfil');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-3xl shadow-xl flex flex-col items-center text-center max-w-sm"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-2xl font-black mb-2">Perfil Concluído!</h2>
          <p className="text-gray-500">Bem-vindo ao mercado Wamini. A redirecionar...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAFAFA]">
      
      {/* ── LEFT PANEL / WELCOME ── */}
      <div className="gradient-wamini flex flex-col items-center justify-center p-12 md:w-5/12 md:min-h-screen">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-center md:text-left"
        >
          <h1 className="text-6xl md:text-7xl font-black logo-wamini mb-4">Quase lá!</h1>
          <p className="text-gray-800 text-xl font-medium max-w-sm">
            Para começar a negociar, precisamos de completar o seu perfil profissional.
          </p>
          <div className="mt-8 space-y-4 hidden md:block">
            <div className="flex items-center gap-3 text-gray-700">
              <div className="bg-white/40 p-2 rounded-lg"><Phone size={20} /></div>
              <span>Contacto para as suas vendas</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <div className="bg-white/40 p-2 rounded-lg"><MapPin size={20} /></div>
              <span>Seu distrito de atuação</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT PANEL / FORM ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
        >
          <div className="flex justify-end mb-8">
            <LanguageSwitcher />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* ── Role selector ── */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 text-center">Qual o seu papel principal?</label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(ROLE_ICONS) as Array<[keyof typeof ROLE_ICONS, typeof ROLE_ICONS[keyof typeof ROLE_ICONS]]>).map(([key, { Icon, color, bg }]) => {
                  const active = roleValue === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleRoleSelect(key)}
                      className="flex flex-col items-center gap-2 p-4 rounded-3xl border-2 text-sm font-bold transition-all duration-300"
                      style={{
                        background: active ? bg : '#fff',
                        borderColor: active ? color : '#F3F4F6',
                        color: active ? color : '#9CA3AF',
                        transform: active ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: active ? `0 10px 20px ${color}20` : 'none'
                      }}
                    >
                      <Icon size={24} strokeWidth={1.8} />
                      <span className="truncate w-full">{t(`auth.roles.${key}`)}</span>
                    </button>
                  );
                })}
              </div>
              {errors.role && <p className="text-red-500 text-xs mt-2 text-center">{errors.role.message}</p>}
            </div>

            <div className="h-px bg-gray-100 my-6" />

            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nome Completo</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" className="w-full input-icon-left" {...register('name')} />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Número de Telefone</label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" placeholder="Ex: 84XXXXXXX" className="w-full input-icon-left" {...register('phone')} />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Localização (Distrito)</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <select className="w-full input-icon-left appearance-none" {...register('localization')}>
                  <option value="" disabled>Selecione um distrito</option>
                  {DISTRICTS.sort().map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {errors.localization && <p className="text-red-500 text-xs mt-1">{errors.localization.message}</p>}
            </div>

            {apiError && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {apiError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading} 
              className="btn-gradient w-full py-5 text-lg font-black tracking-wide"
            >
              {isLoading ? 'A Guardar...' : 'Concluir Registo'}
            </button>

          </form>
        </motion.div>
      </div>
    </div>
  );
}
