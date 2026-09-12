'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';

export default function CookieConsent() {
  const t = useTranslations('common.cookies');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar se o utilizador já aceitou os cookies
    const consent = localStorage.getItem('wamini_cookie_consent');
    if (!consent) {
      // Pequeno delay para não assustar o utilizador no primeiro segundo
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('wamini_cookie_consent', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-6 right-6 z-50 flex justify-center pointer-events-none"
        >
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-6 md:p-8 max-w-2xl w-full pointer-events-auto flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-yellow-400/20 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Cookie className="text-yellow-600" size={32} />
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <h3 className="text-lg font-black text-gray-900 mb-1">
                Cookies & Privacidade
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('message')}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleAccept}
                className="btn-gradient w-full md:w-auto px-8 py-3 rounded-2xl font-black text-sm shadow-lg hover:scale-105 transition-transform"
              >
                {t('accept')}
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="p-3 text-gray-400 hover:text-gray-600 transition-colors hidden md:block"
                aria-label="Fezchar"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
