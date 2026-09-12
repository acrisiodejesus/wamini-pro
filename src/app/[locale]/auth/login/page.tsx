'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Phone, Lock, AlertCircle } from 'lucide-react';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

const loginSchema = z.object({
  mobile_number: z.string().min(9),
  password: z.string().min(6),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setApiError(null);
    try {
      await login(data);
      router.push('/market');
    } catch (error: any) {
      setApiError(t('errors.login_failed'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── LEFT / BRAND PANEL ── */}
      <div className="gradient-wamini flex flex-col items-center justify-center p-10 md:w-5/12 md:min-h-screen">
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center w-full"
        >
          <h1 className="text-7xl md:text-8xl font-black logo-wamini leading-none mb-3">Wamini</h1>
          <p className="text-gray-800 font-semibold text-lg max-w-xs text-center mx-auto">
            {t('landing.tagline')}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            {(['farmer', 'transporter', 'buyer'] as const).map((role) => (
              <span key={role} className="bg-black/10 text-gray-900 text-xs font-bold px-4 py-2 rounded-full">
                {t(`auth.roles.${role}`)}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT / FORM PANEL ── */}
      <div className="flex-1 flex items-start justify-center px-6 py-12 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Language switcher */}
          <div className="flex justify-end mb-6">
            <LanguageSwitcher />
          </div>

          <h2 className="text-3xl font-black text-gray-900 mb-1">{t('auth.login_title')}</h2>
          <p className="text-gray-500 mb-8 text-sm">{t('auth.login_subtitle')}</p>

          <div className="space-y-6">
            <p className="text-gray-700 font-medium">
              A Wamini utiliza agora o sistema de autenticação segura **Auth0**.
              Clique no botão abaixo para entrar com a sua conta.
            </p>

            <a 
              href="/api/auth/login" 
              className="btn-gradient w-full py-4 text-base font-bold flex items-center justify-center gap-2"
            >
              <Lock size={20} />
              {t('auth.login_title')} com Auth0
            </a>

            <div className="pt-4 border-t border-gray-100 italic text-xs text-gray-400">
              * Ao entrar, a sua conta será automaticamente vinculada ao nosso mercado.
            </div>
          </div>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-600">
              {t('auth.no_account')}{' '}
              <Link
                href="/auth/register"
                className="font-black"
                style={{
                  background: 'linear-gradient(135deg, #D8FF12, #FBB03B)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
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
