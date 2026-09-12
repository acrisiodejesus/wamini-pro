import { ReactNode } from 'react';
import { notFound, redirect } from 'next/navigation';
import { ensureAdmin } from '@/lib/admin';
import { getLocale } from 'next-intl/server';

interface AdminLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;
  
  // SERVER-SIDE PROTECTION (Zero-Trust Principle)
  // Even if middleware is bypassed, this check prevents rendering for non-admins
  const admin = await ensureAdmin();

  if (!admin) {
    // Hidden: Instead of showing 403, we show 404 to make the admin path "oculto"
    console.warn(`Unauthorized access attempt to admin by non-admin user.`);
    return notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:px-8">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              Painel de Compliance
            </h1>
            <p className="mt-2 text-slate-400 font-medium">
              Gestão de Auditoria e Integridade · Wamini B2B
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-xl shrink-0">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <span className="text-emerald-400 font-bold">{admin.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-semibold">{admin.name}</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest">{admin.role}</p>
            </div>
          </div>
        </header>

        <main className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </main>
      </div>

      {/* Decorative Gradients */}
      <div className="fixed top-0 left-0 -z-10 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>
    </div>
  );
}
