'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { motion } from 'framer-motion';
import {
  User,
  Phone,
  Lock,
  MapPin,
  AlertCircle,
  Sprout,
  Truck,
  ShoppingBag,
  Users,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { DISTRICTS } from '@/constants/districts';
import { authService } from '@/lib/api/services/auth';

const ROLE_CARDS = [
  {
    id: 'farmer',
    label: 'Agricultor / Produtor',
    desc: 'Registar machambas, culturas e vender no mercado',
    icon: Sprout,
    color: '#059669',
    bg: '#ecfdf5',
  },
  {
    id: 'transporter',
    label: 'Transportador',
    desc: 'Oferecer fretes e transporte de produtos agrícolas',
    icon: Truck,
    color: '#d97706',
    bg: '#fffbeb',
  },
  {
    id: 'seller',
    label: 'Vendedor de Insumos',
    desc: 'Fornecer sementes, fertilizantes e ferramentas',
    icon: ShoppingBag,
    color: '#0284c7',
    bg: '#f0f9ff',
  },
  {
    id: 'buyer',
    label: 'Comprador',
    desc: 'Comprar colheitas frescas diretamente da machamba',
    icon: Users,
    color: '#4b5563',
    bg: '#f9fafb',
  },
];

const registerSchema = z
  .object({
    role: z.string().min(1, 'Selecione o seu perfil'),
    name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
    mobile_number: z.string().min(9, 'Insira um número de telemóvel válido'),
    localization: z.string().min(1, 'Selecione o seu distrito'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v === true, {
      message: 'Deve aceitar os termos de uso para continuar',
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
        role: data.role,
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
      {/* ── PAINEL LATERAL ESQUERDO (Apresentação e Marca) ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-950 to-gray-950 text-white flex flex-col justify-between p-8 md:p-14 md:w-5/12 min-h-[300px] md:min-h-screen">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="text-3xl font-black logo-wamini text-white tracking-tight">Wamini</span>
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
            <span>Registo Simples e Gratuito</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-4">
            Junte-se à comunidade de produtores de Nampula
          </h1>

          <p className="text-sm text-gray-300 leading-relaxed max-w-md">
            Crie a sua conta para registar as suas machambas, receber sementes organizadas e colocar as suas colheitas diretamente à venda.
          </p>

          <div className="space-y-3 mt-8 max-w-sm">
            <div className="flex items-center gap-2.5 text-xs text-gray-200">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>Sem intermediários na comercialização</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-200">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>Acesso a preços de mercado atualizados</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-200">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>Funciona no terreno mesmo sem internet</span>
            </div>
          </div>
        </motion.div>

        <div className="relative z-10 pt-4 border-t border-white/10 text-xs text-emerald-200/70">
          Moçambique • Comunidade Agrícola Unida
        </div>
      </div>

      {/* ── PAINEL DIREITO (Formulário de Registo) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl"
        >
          {/* Barra superior de navegação */}
          <div className="flex justify-between items-center mb-6">
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
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Criar Conta</h2>
            <p className="text-gray-500 mt-1 text-sm">
              Preencha os dados abaixo para começar a utilizar o Wamini Pro.
            </p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
              <span className="font-medium">{apiError}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
              <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
              <span className="font-semibold">Conta criada com sucesso! A encaminhar para o login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Escolha do papel */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Qual é a sua atividade principal?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ROLE_CARDS.map((r) => {
                  const Icon = r.icon;
                  const active = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setValue('role', r.id)}
                      className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${
                        active
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: r.bg }}
                      >
                        <Icon size={18} style={{ color: r.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold ${active ? 'text-emerald-900' : 'text-gray-900'}`}>
                          {r.label}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{r.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Nome Completo
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Exemplo: João Mário Cossa"
                  {...register('name')}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm bg-gray-50/50 hover:bg-white transition-all font-medium text-gray-900 placeholder:text-gray-400"
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.name.message}</p>}
            </div>

            {/* Telemóvel e Distrito em 2 colunas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Distrito de Residência
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <MapPin size={18} />
                  </span>
                  <select
                    {...register('localization')}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm bg-gray-50/50 hover:bg-white transition-all font-medium text-gray-900"
                  >
                    <option value="">Selecione o distrito</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.localization && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.localization.message}</p>
                )}
              </div>
            </div>

            {/* Senha e Confirmação de Senha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Criar Palavra-passe
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    {...register('password')}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm bg-gray-50/50 hover:bg-white transition-all font-medium text-gray-900 placeholder:text-gray-400"
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
                  <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Confirmar Palavra-passe
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    {...register('confirmPassword')}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm bg-gray-50/50 hover:bg-white transition-all font-medium text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Termos de uso */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('terms')}
                  className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                />
                <span className="text-xs text-gray-600 font-medium leading-relaxed">
                  Concordo com os termos e regras de utilização da plataforma Wamini Pro.
                </span>
              </label>
              {errors.terms && <p className="text-red-500 text-xs mt-1 font-medium">{errors.terms.message}</p>}
            </div>

            {/* Botão de Registo */}
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>A criar conta...</span>
                </>
              ) : (
                <>
                  <span>Criar Minha Conta</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Rodapé: já tem conta */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Já tem conta registada?{' '}
              <Link
                href="/auth/login"
                className="font-bold text-emerald-700 hover:text-emerald-800 transition-colors ml-1"
              >
                Entrar na minha conta
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
