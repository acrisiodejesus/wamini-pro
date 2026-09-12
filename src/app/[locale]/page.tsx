'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  Sprout,
  TrendingUp,
  Boxes,
  WifiOff,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Store,
  Compass,
  HeartHandshake,
  CalendarCheck
} from 'lucide-react';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { useAuthStore } from '@/stores/authStore';

const communityRoles = [
  {
    icon: Building2,
    title: 'Cooperativas e Associações',
    desc: 'Visão geral de todos os membros, machambas ativas e quantidade colhida, com relatórios claros e fáceis de partilhar com parceiros.',
    color: '#047857',
    bg: '#ecfdf5',
  },
  {
    icon: Users,
    title: 'Líderes de Grupo e Pólos',
    desc: 'Acompanhamento dos agricultores da sua localidade, organização das entregas de sementes e apoio mútuo nas épocas de sementeira.',
    color: '#0284c7',
    bg: '#f0f9ff',
  },
  {
    icon: WifiOff,
    title: 'Técnicos e Extensionistas',
    desc: 'Registo de visitas diretamente no terreno sem precisar de internet. Quando regressam à vila com rede, tudo sincroniza sozinho.',
    color: '#d97706',
    bg: '#fffbeb',
  },
  {
    icon: Sprout,
    title: 'Agricultores e Famílias',
    desc: 'Registo claro da machamba, histórico das colheitas e acesso direto ao mercado para negociar os produtos a preços justos.',
    color: '#059669',
    bg: '#f0fdf4',
  },
];

const organizationSteps = [
  { step: '01', title: 'Cooperativa ou Associação', desc: 'A entidade que coordena o apoio e apoia as famílias' },
  { step: '02', title: 'Grupos Comunitários', desc: 'Pólos de produtores organizados por localidade' },
  { step: '03', title: 'Famílias Produtoras', desc: 'Registo de quem produz, contacto e experiência' },
  { step: '04', title: 'Machambas', desc: 'Tamanho das parcelas de terra e tipo de solo' },
  { step: '05', title: 'Campanhas e Culturas', desc: 'O que está a ser plantado em cada época do ano' },
  { step: '06', title: 'Sementes e Colheitas', desc: 'Controlo de insumos entregues e sacos colhidos' },
];

export default function HomePage() {
  const t = useTranslations('common');
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-white flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* ── TOP NAV BAR ── */}
      <nav
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-3.5 flex items-center justify-between"
        aria-label="Navegação principal"
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black logo-wamini text-gray-900 tracking-tight">Wamini</span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Pro
            </span>
          </Link>
          <span className="hidden lg:inline-block text-[11px] font-semibold text-gray-500 border-l border-gray-200 pl-3">
            Gestão Agrícola Comunitária
          </span>
        </div>

        {/* Navigation links (desktop) */}
        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-gray-600">
          <a href="#como-organiza" className="hover:text-emerald-800 transition-colors">
            Como Organiza
          </a>
          <a href="#quem-utiliza" className="hover:text-emerald-800 transition-colors">
            Quem Utiliza
          </a>
          <a href="#vantagens" className="hover:text-emerald-800 transition-colors">
            Vantagens no Campo
          </a>
          <Link href="/market" className="flex items-center gap-1.5 hover:text-emerald-800 transition-colors text-emerald-700 font-bold">
            <Store size={14} />
            <span>Mercado Coletivo</span>
          </Link>
        </div>

        {/* Action buttons (Clean and coherent) */}
        <div className="flex items-center gap-3" role="toolbar" aria-label="Ações de acesso">
          <LanguageSwitcher />

          {mounted && isAuthenticated ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Meu Painel</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="text-xs font-bold text-gray-700 hover:text-emerald-800 transition-colors px-3 py-2 rounded-xl hover:bg-gray-50"
              >
                {t('login')}
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Criar Conta</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-teal-950 to-gray-950 text-white px-6 py-20 md:py-28 flex flex-col items-center text-center">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-emerald-200 mb-6">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Apoio direto à agricultura familiar e cooperativas</span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight max-w-4xl leading-[1.15] mb-6"
        >
          Organize a sua cooperativa e apoie cada produtor,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-amber-200">
            da semente à colheita
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-sm sm:text-lg text-gray-300 max-w-2xl font-normal mb-8 leading-relaxed"
        >
          Um sistema simples para cooperativas e associações agrícolas acompanharem produtores, machambas, entregas de sementes e colheitas, com funcionamento garantido mesmo em zonas rurais sem rede de telemóvel.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
        >
          {mounted && isAuthenticated ? (
            <Link
              href="/dashboard"
              className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span>Aceder ao Painel de Gestão</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <Link
              href="/auth/register"
              className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span>Começar Gratuitamente</span>
              <ArrowRight size={16} />
            </Link>
          )}

          <Link
            href="/market"
            className="px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Store size={16} className="text-emerald-300" />
            <span>Ver Mercado Coletivo</span>
          </Link>
        </motion.div>

        {/* 3 Value Pillars */}
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 mt-12 pt-8 border-t border-white/10 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Sem papelada perdida</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Funciona no campo sem internet</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Feito para a realidade de Moçambique</span>
          </div>
        </div>
      </section>

      {/* ── COMO ORGANIZA (Estrutura Simples) ── */}
      <section id="como-organiza" className="px-6 py-20 max-w-6xl mx-auto w-full scroll-mt-16">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full">
            Tudo Conectado
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-3 tracking-tight">
            Da associação até à machamba de cada família
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Uma organização prática para saber quem produz, onde cultiva e quanto colheu em cada época.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {organizationSteps.map((item, i) => (
            <div
              key={i}
              className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group"
            >
              <div className="text-xs font-black text-emerald-700 mb-3 group-hover:scale-105 transition-transform">
                {item.step}
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 leading-snug">{item.title}</h3>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUEM UTILIZA (Comunidade Agrícola) ── */}
      <section id="quem-utiliza" className="bg-gray-50 px-6 py-20 border-y border-gray-100 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-700 bg-emerald-100 px-3.5 py-1.5 rounded-full">
              Para Todos os Atores
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-3 tracking-tight">
              Feito para quem trabalha e gere a terra
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Cada pessoa encontra o seu espaço com a informação que precisa para tomar boas decisões.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {communityRoles.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: card.bg }}
                    >
                      <Icon size={24} style={{ color: card.color }} />
                    </div>
                    <h3 className="font-bold text-base text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── VANTAGENS NO CAMPO ── */}
      <section id="vantagens" className="px-6 py-20 max-w-6xl mx-auto w-full scroll-mt-16">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full">
            Facilidade no Terreno
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-3 tracking-tight">
            Respostas práticas para os desafios do dia a dia
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Tecnologia sem complicações para que o foco continue a ser a produção e o rendimento das famílias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-3xl bg-emerald-50/70 border border-emerald-100 space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-xs">
              <WifiOff size={22} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Funciona Mesmo Sem Internet</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              No campo nem sempre há rede. O Wamini guarda as fichas dos agricultores e das machambas no próprio telemóvel ou tablet. Assim que encontrar sinal, tudo é enviado automaticamente.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-teal-50/70 border border-teal-100 space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-700 text-white flex items-center justify-center mb-4 shadow-xs">
              <TrendingUp size={22} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Acompanhamento das Colheitas</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Compare quanto esperava colher com o que realmente foi colhido. Saiba onde houve perdas e descubra o que correu bem para melhorar a produção na época seguinte.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-amber-50/70 border border-amber-100 space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center mb-4 shadow-xs">
              <Boxes size={22} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Distribuição Justa de Insumos</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Registe cada saco de semente ou fertilizante entregue a cada membro da cooperativa. Mais transparência, menos desperdício e confiança entre todos.
            </p>
          </div>
        </div>
      </section>

      {/* ── CONVITE AO MERCADO COLETIVO ── */}
      <section className="px-6 py-12 max-w-6xl mx-auto w-full">
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="max-w-xl space-y-3 text-center md:text-left">
            <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-white/20 text-emerald-100">
              Mercado Coletivo Integrado
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Consulte preços locais e venda com mais força
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Além de gerir os produtores, consulte as cotações praticadas nos mercados de Nampula e conecte-se com compradores e transportadores verificados.
            </p>
          </div>
          <Link
            href="/market"
            className="shrink-0 px-7 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-sm shadow-md transition-all flex items-center gap-2"
          >
            <Store size={18} />
            <span>Explorar Mercado Coletivo</span>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-gray-400 border-t border-gray-900 px-6 py-10 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-black text-lg text-white !text-white logo-wamini" style={{ color: '#ffffff' }}>Wamini</span>
            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900">
              Pro
            </span>
          </div>
          <p className="text-center text-gray-500">
            © 2026 Wamíni. Apoio à agricultura familiar em Nampula e Moçambique.
          </p>
          <div className="flex gap-4 text-xs font-medium">
            <Link href="/market" className="text-gray-400 hover:text-white transition-colors">Mercado</Link>
            <Link href="/prices" className="text-gray-400 hover:text-white transition-colors">Preços</Link>
            <Link href="/auth/login" className="text-gray-400 hover:text-white transition-colors">Entrar</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
