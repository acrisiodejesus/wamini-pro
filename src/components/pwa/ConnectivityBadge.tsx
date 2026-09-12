'use client';

import { useState, useEffect } from 'react';
import { syncManager } from '@/lib/offline/syncManager';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConnectivityBadge() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updateCount = () => {
      setPendingCount(syncManager.getPendingCount());
    };

    updateCount();
    const unsubscribe = syncManager.subscribe(updateCount);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncManager.syncAll();
      if (res.success && res.syncedCount > 0) {
        setSyncFeedback(`${res.syncedCount} item(s) sincronizado(s)!`);
      } else if (res.success && res.syncedCount === 0) {
        setSyncFeedback('Tudo atualizado.');
      } else {
        setSyncFeedback('Falha na sincronização.');
      }
    } catch {
      setSyncFeedback('Erro ao conectar.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 3500);
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-medium"
            title="Você está trabalhando offline. Os dados serão salvos localmente e sincronizados quando houver conexão."
          >
            <WifiOff size={13} className="text-amber-700" />
            <span>Modo Offline (Campo)</span>
          </motion.div>
        )}
      </AnimatePresence>

      {pendingCount > 0 && (
        <button
          onClick={handleManualSync}
          disabled={!isOnline || isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          title={isOnline ? 'Clique para sincronizar agora' : 'Aguardando conexão com a internet'}
        >
          <RefreshCw size={12} className={isSyncing ? 'animate-spin text-blue-600' : 'text-blue-600'} />
          <span>{pendingCount} pendente{pendingCount > 1 ? 's' : ''}</span>
        </button>
      )}

      {syncFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold text-[11px]"
        >
          <CheckCircle2 size={12} />
          <span>{syncFeedback}</span>
        </motion.div>
      )}
    </div>
  );
}
