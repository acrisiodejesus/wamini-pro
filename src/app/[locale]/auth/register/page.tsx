'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Lock, MapPin, AlertCircle, Sprout, Truck, ShoppingBag, Users, CheckCircle2, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { DISTRICTS } from '@/constants/districts';
import { authService } from '@/lib/api/services/auth';

const ROLE_ICONS = {
  farmer:      { Icon: Sprout,      color: '#2D6A4F', bg: '#f0faf4' },
  transporter: { Icon: Truck,       color: '#FBB03B', bg: '#fffbf0' },
  seller:      { Icon: ShoppingBag, color: '#374151', bg: '#f3f4f6' },
  buyer:       { Icon: Users,       color: '#1d4ed8', bg: '#eff6ff' },
};

const registerSchema = z
  .object({
    role: z.string().min(1, 'Selecione o seu perfil'),
    name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
    mobile_number: z.string().min(9, 'Insira um número de telemóvel válido'),
    localization: z.string().min(1, 'Selecione o seu distrito'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v === true, {
      message: 'Deve aceitar os termos e condições para continuar',
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type RegisterFormInputs = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'farmer',
      terms: false,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormInputs) => {
    setApiError(null);
    try {
      await authService.register({
        name: data.name,
        mobile_number: data.mobile_number,
        password: data.password,
        localization: data.localization,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Erro ao criar conta. Tente novamente.';
      setApiError(msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* ── LEFT / BRAND PANEL ── */}
      <div className="gradient-wamini flex flex-col items-center justify-center p-8 md:p-12 md:w-5/12 min-h-[250px] md:min-h-screen">
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center w-full max-w-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-6xl md:text-7xl font-black logo-wamini leading-none">Wamini</h1>
            <span className="text-xs uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 self-start mt-2">
              Pro
            </span>
          </div>
          <p className="text-gray-800 font-semibold text-base md:text-lg text-center mx-auto mt-2">
            {t('landing.tagline')}
          </p>

          <div className="mt-8 p-4 rounded-2xl bg-white/40 border border-black/5 text-xs text-gray-700 text-left w-full space-y-2">
            <p className="font-bold text-gray-900">Vantagens Wamini Pro:</p>
            <p>✓ Acesso direto a machambas, cotações e grupos</p>
            <p>✓ Sem intermediários na comercialização</p>
            <p>✓ Suporte offline para o campo</p>
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT / FORM PANEL ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-lg"
        >
          {/* Top Bar with Language Switcher */}
          <div className="flex justify-between items-center mb-6">
            <Link href="/" className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
              ← Início
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('auth.register_title')}</h2>
            <p className="text-gray-500 mt-1 text-sm">{t('auth.register_subtitle')}</p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
              <span>{apiError}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
              <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
              <span className="font-semibold">Conta criada com sucesso! A redirecionar para o login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                {t('auth.role_prompt')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(ROLE_ICONS) as Array<keyof typeof ROLE_ICONS>).map((roleKey) => {
                  const { Icon, color } = ROLE_ICONS[roleKey];
                  const active = selectedRole === roleKey;
                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => setValue('role', roleKey)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                        active
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <Icon size={20} style={{ color }} />
                      <span className={`text-xs mt-1.5 font-bold ${active ? 'text-emerald-900' : 'text-gray-600'}`}>
                        {t(`auth.roles.${roleKey}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                {t('auth.name_label')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  placeholder={t('auth.name_placeholder')}
                  {...register('name')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50 hover:bg-white transition-all font-medium text-gray-900 placeholder:text-gray-400"
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name.message}</p>}
            </div>

            {/* Mobile number & District in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('auth.phone_label')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone size={18} />
                  </span>
                  <input
                    type="tel"
                    placeholder={t('auth.phone_placeholder')}
                    {...register('mobile_number')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50 hover:bg-white transition-all font-medium text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                {errors.mobile_number && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.mobile_number.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('auth.district_label')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <MapPin size={18} />
                  </span>
                  <select
                    {...register('localization')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50 hover:bg-white transition-all font-medium text-gray-900"
                  >
                    <option value="">{t('auth.district_placeholder')}</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.localization && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.localization.message}</p>
                )}
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('auth.password_label')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.password_placeholder')}
                    {...register('password')}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50 hover:bg-white transition-all font-medium text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {t('auth.confirm_password_label')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.confirm_password_placeholder')}
                    {...register('confirmPassword')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50 hover:bg-white transition-all font-medium text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('terms')}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                />
                <span className="text-xs text-gray-600 font-medium leading-relaxed">
                  {t('auth.terms_label')}
                </span>
              </label>
              {errors.terms && <p className="text-red-500 text-xs mt-1 font-medium">{errors.terms.message}</p>}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{t('auth.creating')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.register_title')}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              {t('auth.have_account')}{' '}
              <Link
                href="/auth/login"
                className="font-bold text-emerald-700 hover:text-emerald-800 transition-colors ml-1"
              >
                {t('login')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
