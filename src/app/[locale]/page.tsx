'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  Sprout,
  MapPin,
  TrendingUp,
  Boxes,
  BarChart3,
  WifiOff,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

const roleCards = [
  {
    icon: Building2,
    title: 'Organizações & Cooperativas',
    desc: 'Visão agregada de grupos, machambas cadastradas, safras ativas e relatórios executivos auditáveis.',
    color: '#047857',
    bg: '#ecfdf5',
  },
  {
    icon: Users,
    title: 'Gestores de Grupos / Polos',
    desc: 'Administração de núcleos territoriais, distribuição comunitária e acompanhamento próximo dos agricultores.',
    color: '#0284c7',
    bg: '#f0f9ff',
  },
  {
    icon: WifiOff,
    title: 'Técnicos de Campo (Extensionistas)',
    desc: 'Registo offline de produtores, machambas, sementes e colheitas sem depender de sinal de internet.',
    color: '#d97706',
    bg: '#fffbeb',
  },
  {
    icon: Sprout,
    title: 'Produtores Agrícolas',
    desc: 'Ficha socioprodutiva estruturada, histórico de safras, insumos recebidos e valorização do trabalho no campo.',
    color: '#4b5563',
    bg: '#f9fafb',
  },
];

const hierarchySteps = [
  { step: '01', title: 'Organização', desc: 'Cooperativa, Associação ou ONG gestora' },
  { step: '02', title: 'Grupos de Produtores', desc: 'Núcleos territoriais por localidade' },
  { step: '03', title: 'Produtores', desc: 'Perfil individual e experiência' },
  { step: '04', title: 'Machambas', desc: 'Parcelas cultivadas e tipo de solo' },
  { step: '05', title: 'Ciclos & Culturas', desc: 'Campanhas sazonais e variedades' },
  { step: '06', title: 'Produção & Insumos', desc: 'Previsões, colheitas e adubação' },
];

export default function HomePage() {
  const t = useTranslations('common');

  return (
    <main className="min-h-screen bg-white flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* ── TOP NAV ── */}
      <nav
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-3.5 flex items-center justify-between"
        aria-label="Navegação da página inicial"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black logo-wamini tracking-tight">Wamini</span>
          <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Gestão Agrícola
          </span>
        </div>

        <div className="flex items-center gap-3" role="toolbar" aria-label="Ações de acesso">
          <LanguageSwitcher />
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-emerald-800 transition-colors px-3 py-1.5"
          >
            Aceder ao Painel
          </Link>
          <Link
            href="/auth/login"
            className="text-xs font-bold text-gray-700 hover:text-black transition-colors px-3 py-1.5"
          >
            {t('login')}
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors"
          >
            Entrar na Plataforma
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-teal-950 to-gray-950 text-white px-6 py-20 md:py-32 flex flex-col items-center text-center">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-emerald-200 mb-6">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Plataforma Digital Multi-Tenant para o Agronegócio Familiar</span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight max-w-4xl leading-[1.1] mb-6"
        >
          Gestão e Organização de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-amber-200">Grupos de Produtores</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-base sm:text-xl text-gray-300 max-w-2xl font-medium mb-10 leading-relaxed"
        >
          Capacite cooperativas, associações agrícolas e projetos de desenvolvimento com controle de produtores, machambas, safras e insumos — com suporte nativo para técnicos de campo sem sinal de internet.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
        >
          <Link
            href="/dashboard"
            className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span>Aceder ao Painel de Gestão</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/groups"
            className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Ver Grupos & Produtores</span>
          </Link>
        </motion.div>
      </section>

      {/* ── HIERARQUIA DO DOMÍNIO ── */}
      <section className="px-6 py-20 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Estrutura Integrada
          </span>
          <h2 className="text-3xl font-black text-gray-900 mt-3">Hierarquia Operacional de Campo</h2>
          <p className="text-sm text-gray-500 mt-2">
            Rastreabilidade completa de ponta a ponta: da entidade gestora até à parcela agrícola.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {hierarchySteps.map((h, i) => (
            <div
              key={i}
              className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-300 transition-colors"
            >
              <div className="text-xs font-black text-emerald-700 mb-2">{h.step}</div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 leading-tight">{h.title}</h3>
                <p className="text-[11px] text-gray-500 mt-1">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAPÉIS & ATORES ── */}
      <section className="bg-gray-50 px-6 py-20 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              Perfis de Acesso (RBAC)
            </span>
            <h2 className="text-3xl font-black text-gray-900 mt-3">Desenvolvido para Toda a Cadeia</h2>
            <p className="text-sm text-gray-500 mt-2">
              Segurança estrita com isolamento lógico multi-tenant e permissões dedicadas por perfil.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {roleCards.map((card, i) => {
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
                    <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── RECURSOS ESSENCIAIS ── */}
      <section className="px-6 py-20 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3">
              <WifiOff size={20} />
            </div>
            <h3 className="font-bold text-gray-900 text-base">Modo Campo (Offline-First)</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Técnicos registam dados de produtores, machambas e insumos em zonas sem rede. A fila local sincroniza assim que o sinal for restabelecido.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-teal-50 border border-teal-100 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center mb-3">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-bold text-gray-900 text-base">Monitorização de Safras</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Comparação automática entre estimativas e colheitas realizadas, cálculo de taxa de perdas e produtividade média em kg/hectare.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-3">
              <Boxes size={20} />
            </div>
            <h3 className="font-bold text-gray-900 text-base">Rastreio de Insumos</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Controle de inventário de sementes e fertilizantes por lote com histórico imutável de entregas para cada agricultor membro.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-gray-400 border-t border-gray-900 px-6 py-10 text-center text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-lg text-white logo-wamini">Wamini</span>
            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900">
              Gestão Agrícola
            </span>
          </div>
          <p>© 2026 Wamíni — Nampula, Moçambique. Plataforma digital para organizações agrícolas.</p>
          <div className="flex gap-4 text-xs font-semibold">
            <Link href="/dashboard" className="text-gray-300 hover:text-white">Painel</Link>
            <Link href="/groups" className="text-gray-300 hover:text-white">Grupos</Link>
            <Link href="/reports" className="text-gray-300 hover:text-white">Relatórios</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
