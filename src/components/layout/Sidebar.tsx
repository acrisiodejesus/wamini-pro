'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  MapPin,
  TrendingUp,
  Leaf,
  Boxes,
  BarChart3,
  ShieldCheck,
  Store,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const coreNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/organization', label: 'Organização', icon: Building2 },
    { href: '/groups', label: 'Grupos', icon: Users },
    { href: '/farmers', label: 'Produtores', icon: UserCheck },
    { href: '/farms', label: 'Machambas', icon: MapPin },
    { href: '/production', label: 'Produção', icon: TrendingUp },
    { href: '/crops', label: 'Culturas', icon: Leaf },
    { href: '/inputs', label: 'Insumos', icon: Boxes },
    { href: '/reports', label: 'Relatórios', icon: BarChart3 },
    { href: '/admin', label: 'Administração', icon: ShieldCheck },
  ];

  const secondaryNavItems = [
    { href: '/market', label: 'Mercado Coletivo', icon: Store },
  ];

  const isActive = (href: string) => {
    const cleanPath = pathname.replace(/^\/(en|pt|emakua)/, '');
    if (href === '/dashboard' && (cleanPath === '' || cleanPath === '/')) return true;
    return cleanPath.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex-col z-40 shadow-sm"
        aria-label="Menu principal de gestão"
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-black logo-wamini">Wamini</span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Pro
            </span>
          </Link>
        </div>

        {/* Navigation List */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Gestão de Produtores
          </div>

          {coreNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group',
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={18} className={clsx(active ? 'text-white' : 'text-gray-500 group-hover:text-gray-800')} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight size={14} className="opacity-75" />}
              </Link>
            );
          })}

          <div className="pt-4 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Módulos Adicionais
          </div>

          {secondaryNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200',
                  active
                    ? 'bg-amber-100 text-amber-900'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                )}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/70 text-xs text-gray-500 flex items-center justify-between">
          <span className="font-medium">Moçambique</span>
          <span className="text-[10px] text-gray-400">v2.0 • Multi-tenant</span>
        </div>
      </aside>
    </>
  );
}
