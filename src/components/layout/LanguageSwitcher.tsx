'use client';

import { useState, useTransition } from 'react';
import { Globe, X, Check } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import clsx from 'clsx';

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const languages = [
    { code: 'pt', label: 'Português' },
    { code: 'en', label: 'English' },
    { code: 'emakua', label: 'Emakhuwa' },
  ];

  const switchLanguage = (newLocale: string) => {
    setIsOpen(false);
    const currentSearchParams = searchParams.toString();
    const queryString = currentSearchParams ? `?${currentSearchParams}` : '';
    
    startTransition(() => {
      router.push(`${pathname}${queryString}`, { locale: newLocale as any });
    });
  };

  const currentLanguage = languages.find((l) => l.code === locale);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-full border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition-all text-sm font-bold text-gray-700"
        aria-label={`Idioma atual: ${currentLanguage?.label ?? 'Idioma'}. Clique para trocar`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        disabled={isPending}
      >
        <Globe size={18} className="text-gray-500 flex-shrink-0" aria-hidden="true" />
        <span>{currentLanguage?.label ?? 'Idioma'}</span>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lang-dialog-title"
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 id="lang-dialog-title" className="font-semibold text-lg">Selecionar Idioma</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="Fechar seleção de idioma"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            
            <div className="p-2" role="listbox" aria-label="Idiomas disponíveis">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => switchLanguage(lang.code)}
                  disabled={isPending}
                  role="option"
                  aria-selected={locale === lang.code}
                  aria-label={`${lang.label}${locale === lang.code ? ' — selecionado atualmente' : ''}`}
                  className={clsx(
                    "w-full flex items-center justify-between p-4 rounded-xl transition-colors",
                    locale === lang.code 
                      ? "bg-yellow-50 text-yellow-900" 
                      : "hover:bg-gray-50 text-gray-700",
                    isPending && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="font-medium">{lang.label}</span>
                  {locale === lang.code && <Check size={20} className="text-yellow-500" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
