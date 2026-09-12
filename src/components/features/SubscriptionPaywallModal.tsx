'use client';

import React from 'react';
import { X, Gem, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/routing';

interface SubscriptionPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionPaywallModal({ isOpen, onClose }: SubscriptionPaywallModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
          >
            <X size={20} className="text-gray-400" />
          </button>

          {/* Header with Gradient */}
          <div className="h-32 bg-gradient-to-br from-[#D8FF12] to-[#FBB03B] flex items-center justify-center relative border-b border-gray-100">
             <div className="bg-white p-4 rounded-3xl shadow-xl">
               <Gem size={40} className="text-black" />
             </div>
          </div>

          <div className="p-8 pt-6 text-center">
            <h2 className="text-2xl font-black text-gray-900 leading-tight">
              Desbloqueie o Wamini VIP
            </h2>
            <p className="mt-3 text-gray-600 font-medium leading-relaxed">
              Para iniciares negociações e veres os contactos telefónicos, precisas de uma Assinatura Activa (Plano Básico ou superior).
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 text-left bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                <span className="text-sm font-bold text-gray-700">Conversas ilimitadas no Chat</span>
              </div>
              <div className="flex items-center gap-3 text-left bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                <span className="text-sm font-bold text-gray-700">Acesso a todos os contactos directos</span>
              </div>
              <div className="flex items-center gap-3 text-left bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                <span className="text-sm font-bold text-gray-700">Novas oportunidades de mercado</span>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3">
              <Link
                href="/profile"
                className="btn-gradient w-full py-4 rounded-2xl font-black text-black flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-yellow-200"
                onClick={onClose}
              >
                Ver Planos e Assinar <ArrowRight size={18} />
              </Link>
              <button
                onClick={onClose}
                className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Talvez mais tarde
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
