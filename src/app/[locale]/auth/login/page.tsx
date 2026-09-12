'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Phone, Lock, AlertCircle, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

const loginSchema = z.object({
  mobile_number: z.string().min(9, 'Insira um número de telefone válido com pelo menos 9 dígitos'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setApiError(null);
    try {
      await login(data);
      router.push('/dashboard');
    } catch (error: any) {
      setApiError(error.message || 'Número de telefone ou senha incorretos.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* ── LEFT / BRAND PANEL ── */}
      <div className="gradient-wamini flex flex-col items-center justify-center p-8 md:p-12 md:w-5/12 min-h-[300px] md:min-h-screen">
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

          <div className="flex flex-wrap gap-2 justify-center mt-8">
            {(['farmer', 'transporter', 'buyer'] as const).map((role) => (
              <span key={role} className="bg-black/10 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full">
                {t(`auth.roles.${role}`)}
              </span>
            ))}
          </div>

          <div className="mt-8 p-3 rounded-2xl bg-white/40 border border-black/5 text-xs text-gray-700 text-left w-full space-y-1">
            <p className="font-bold text-gray-900">Credenciais Demo de Teste:</p>
            <p>• Admin: <span className="font-mono font-semibold">841234567</span> / <span className="font-mono">123456</span></p>
            <p>• Gestor: <span className="font-mono font-semibold">862345678</span> / <span className="font-mono">123456</span></p>
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT / FORM PANEL ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Top Bar with Language Switcher */}
          <div className="flex justify-between items-center mb-8">
            <Link href="/" className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
              ← Início
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('auth.login_title')}</h2>
            <p className="text-gray-500 mt-1 text-sm">{t('auth.login_subtitle')}</p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Mobile number */}
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50 hover:bg-white transition-all font-medium text-gray-900 placeholder:text-gray-400"
                />
              </div>
              {errors.mobile_number && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.mobile_number.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {t('auth.password_label')}
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.password_placeholder')}
                  {...register('password')}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-gray-50/50 hover:bg-white transition-all font-medium text-gray-900 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{t('auth.signing_in')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.login_title')}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              {t('auth.no_account')}{' '}
              <Link
                href="/auth/register"
                className="font-bold text-emerald-700 hover:text-emerald-800 transition-colors ml-1"
              >
                {t('register')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
