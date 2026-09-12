'use client';

import LanguageSwitcher from "./LanguageSwitcher";
import { Link } from '@/i18n/routing';
import { Settings } from 'lucide-react';
import ConnectivityBadge from '@/components/pwa/ConnectivityBadge';

export function Header() {
  return (
    <header className="bg-white/95 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 sticky top-0 z-30" aria-label="Cabeçalho da aplicação Wamíni">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-2xl font-black logo-wamini tracking-tight" aria-label="Wamini — Painel Principal">
            Wamini
          </Link>
          <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Gestão Agrícola
          </span>
        </div>

        <div className="flex items-center gap-3" role="toolbar" aria-label="Ações do cabeçalho">
          <ConnectivityBadge />
          <LanguageSwitcher />
          <Link href="/settings" className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors" aria-label="Abrir configurações">
            <Settings size={20} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;