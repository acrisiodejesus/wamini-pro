'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Lock, MapPin, AlertCircle, Sprout, Truck, ShoppingBag, Users } from 'lucide-react';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

const ROLE_ICONS = {
  farmer:      { Icon: Sprout,      color: '#2D6A4F', bg: '#f0faf4' },
  transporter: { Icon: Truck,       color: '#FBB03B', bg: '#fffbf0' },
  seller:      { Icon: ShoppingBag, color: '#374151', bg: '#f3f4f6' },
  buyer:       { Icon: Users,       color: '#1d4ed8', bg: '#eff6ff' },
};

const DISTRICTS = [
  'Angoche',
  'Eráti',
  'Ilha de Moçambique',
  'Lalaua',
  'Larde',
  'Liúpo',
  'Malema',
  'Meconta',
  'Mecubúri',
  'Memba',
  'Mogincual',
  'Mogovolas',
  'Moma',
  'Monapo',
  'Mossuril',
  'Muecate',
  'Murrupula',
  'Nacala-Porto',
  'Nacala-a-Velha',
  'Nacarôa',
  'Nampula',
  'Rapale',
  'Ribáuè',
];

const registerSchema = z.object({
  role:            z.string().min(1),
  name:            z.string().min(2),
  phone:           z.string().min(9),
  localization:    z.string().min(1),
  password:        z.string().min(6),
  confirmPassword: z.string(),
  terms:           z.boolean().refine((v) => v === true),
}).refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'] });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const roleValue = watch('role');

  const handleRoleSelect = (value: string) => {
    setValue('role', value, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setApiError(null);
    try {
      await registerUser({
        name: data.name,
        password: data.password,
        mobile_number: data.phone,
        localization: data.localization,
      });
      router.push('/auth/login');
    } catch (error: any) {
      if (error.response?.status === 409) {
        setApiError(t('errors.phone_taken'));
      } else {
        setApiError(error.response?.data?.error || error.message || t('errors.generic'));
      }
    } finally {
      setIsLoading(false);
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
            {(Object.keys(ROLE_ICONS) as Array<keyof typeof ROLE_ICONS>).map((key) => (
              <span key={key} className="bg-black/10 text-gray-900 text-xs font-bold px-4 py-2 rounded-full">
                {t(`auth.roles.${key}`)}
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

          <h2 className="text-3xl font-black text-gray-900 mb-1">{t('auth.register_title')}</h2>
          <p className="text-gray-500 mb-8 text-sm">{t('auth.register_subtitle')}</p>

          <div className="space-y-6">
            <p className="text-gray-700 font-medium">
              Crie a sua conta de forma segura através do **Auth0**. 
              Poderá escolher entre e-mail/palavra-passe ou redes sociais.
            </p>

            <a 
              href="/api/auth/login?screen_hint=signup" 
              className="btn-gradient w-full py-4 text-base font-bold flex items-center justify-center gap-2"
            >
              <Users size={20} />
              Criar conta com Auth0
            </a>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
              <p className="text-xs text-amber-800">
                <strong>Nota:</strong> Após o registo, poderá completar o seu perfil (distrito, telefone e papel no mercado) na sua área de utilizador.
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm text-center text-gray-600">
            {t('auth.have_account')}{' '}
            <Link
              href="/auth/login"
              className="font-black"
              style={{
                background: 'linear-gradient(135deg, #D8FF12, #FBB03B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t('login')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
