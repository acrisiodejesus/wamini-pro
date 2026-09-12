'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Phone, Lock, AlertCircle, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, Sprout, ShieldCheck, CheckCircle2 } from 'lucide-react';
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
    setValue,
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

  const handleQuickFill = (phone: string, pass: string) => {
    setValue('mobile_number', phone, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    setApiError(null);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* ── PAINEL LATERAL ESQUERDO (Apresentação e Marca) ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-950 to-gray-950 text-white flex flex-col justify-between p-8 md:p-14 md:w-5/12 min-h-[320px] md:min-h-screen">
        {/* Efeitos de luz de fundo */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="text-3xl font-black logo-wamini logo-white text-white !text-white tracking-tight" style={{ color: '#ffffff' }}>
              Wamini
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              Pro
            </span>
          </Link>
          <p className="text-xs text-emerald-200/80 mt-1">Gestão Agrícola Comunitária</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 my-auto py-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-300 mb-4">
            <Sprout size={14} />
            <span>Agricultura Familiar e Cooperativas</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-4">
            Apoio direto à terra e aos produtores
          </h1>

          <p className="text-sm text-gray-300 leading-relaxed max-w-md">
            Aceda à sua conta para consultar machambas, acompanhar as colheitas da sua cooperativa e aceder ao mercado coletivo.
          </p>

          <div className="grid grid-cols-2 gap-2.5 mt-8 max-w-sm">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-200">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>Sem papéis perdidos</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-200">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>Funciona sem rede</span>
            </div>
          </div>
        </motion.div>

        {/* Caixa de teste rápido (Demo) */}
        <div className="relative z-10 pt-4 border-t border-white/10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-2">
            Acesso Rápido para Demonstração:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('841234567', '123456')}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 transition-colors flex items-center gap-1.5 border border-white/10"
            >
              <span>Preencher Administrador</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('862345678', '123456')}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 transition-colors flex items-center gap-1.5 border border-white/10"
            >
              <span>Preencher Gestor</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── PAINEL DIREITO (Formulário de Entrada) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Barra superior de navegação */}
          <div className="flex justify-between items-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-800 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Voltar ao início</span>
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Entrar na Conta</h2>
            <p className="text-gray-500 mt-1.5 text-sm">
              Insira o seu número de telemóvel e senha para continuar.
            </p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
              <span className="font-medium">{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo: Número de Telemóvel */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Número de Telemóvel
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Phone size={18} />
                </span>
                <input
                  type="tel"
                  placeholder="84 123 4567"
                  {...register('mobile_number')}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm bg-gray-50/50 hover:bg-white transition-all font-medium text-gray-900 placeholder:text-gray-400"
                />
              </div>
              {errors.mobile_number && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.mobile_number.message}</p>
              )}
            </div>

            {/* Campo: Senha */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Palavra-passe
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite a sua senha"
                  {...register('password')}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm bg-gray-50/50 hover:bg-white transition-all font-medium text-gray-900 placeholder:text-gray-400"
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

            {/* Botão de Submissão */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>A verificar credenciais...</span>
                </>
              ) : (
                <>
                  <span>Entrar na Conta</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Rodapé do formulário: criar conta */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Ainda não tem conta?{' '}
              <Link
                href="/auth/register"
                className="font-bold text-emerald-700 hover:text-emerald-800 transition-colors ml-1"
              >
                Registar nova conta
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
