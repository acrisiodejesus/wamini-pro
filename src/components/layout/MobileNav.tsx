'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { LayoutDashboard, Users, UserCheck, TrendingUp, Boxes, Menu } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

const mobileMainItems = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/groups', label: 'Grupos', icon: Users },
  { href: '/farmers', label: 'Produtores', icon: UserCheck },
  { href: '/production', label: 'Produção', icon: TrendingUp },
  { href: '/inputs', label: 'Insumos', icon: Boxes },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) => {
    const cleanPath = pathname.replace(/^\/(en|pt|emakua)/, '');
    if (href === '/dashboard' && (cleanPath === '' || cleanPath === '/')) return true;
    return cleanPath.startsWith(href);
  };

  const moreItems = [
    { href: '/organization', label: 'Organização' },
    { href: '/farms', label: 'Machambas' },
    { href: '/crops', label: 'Culturas' },
    { href: '/reports', label: 'Relatórios' },
    { href: '/admin', label: 'Administração' },
    { href: '/market', label: 'Mercado Coletivo' },
  ];

  return (
    <>
      {/* Bottom Floating/Fixed Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40 pb-safe">
        <div className="flex justify-around items-center px-1 py-1.5">
          {mobileMainItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center py-1 px-2 rounded-lg transition-colors',
                  active ? 'text-emerald-700 font-bold' : 'text-gray-500 hover:text-gray-800'
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="flex flex-col items-center py-1 px-2 rounded-lg text-gray-500 hover:text-gray-800"
            aria-label="Abrir mais opções"
          >
            <Menu size={20} />
            <span className="text-[10px] mt-0.5 tracking-tight">Mais</span>
          </button>
        </div>
      </nav>

      {/* Drawer menu for additional links on mobile */}
      {drawerOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end"
          onClick={() => setDrawerOpen(false)}
        >
          <div 
            className="w-64 bg-white h-full p-5 shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <span className="font-bold text-gray-900">Mais Módulos</span>
                <button onClick={() => setDrawerOpen(false)} className="text-gray-400 p-1">✕</button>
              </div>
              <div className="py-3 space-y-1">
                {moreItems.map((m) => (
                  <Link
                    key={m.href}
                    href={m.href}
                    onClick={() => setDrawerOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium"
                  >
                    {m.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 text-xs text-gray-400">
              Wamíni v2.0 • Modo Rural
            </div>
          </div>
        </div>
      )}
    </>
  );
}
