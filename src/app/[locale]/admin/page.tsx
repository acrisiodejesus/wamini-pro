'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  History, 
  Trash2, 
  RefreshCw, 
  Clock, 
  User, 
  Database,
  ArrowRight
} from 'lucide-react';

interface AuditLog {
  id: number;
  actor_id: number | null;
  action: string;
  entity_type: string;
  method: string;
  endpoint: string;
  old_data: string | null;
  new_data: string | null;
  created_at: string;
}

interface DeletedRecord {
  type: string;
  id: number;
  name: string;
  deleted_at: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'logs' | 'deleted'>('logs');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [deleted, setDeleted] = useState<DeletedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const logsRes = await fetch('/api/v1/admin/logs?limit=50');
      const logsData = await logsRes.json();
      if (logsData.logs) setLogs(logsData.logs);

      const delRes = await fetch('/api/v1/admin/records');
      const delData = await delRes.json();
      if (Array.isArray(delData)) setDeleted(delData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRestore = async (type: string, id: number) => {
    setRestoringId(id);
    try {
      const res = await fetch('/api/v1/admin/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id })
      });
      if (res.ok) {
        // Refresh deleted list
        setDeleted(prev => prev.filter(r => !(r.type === type && r.id === id)));
      }
    } catch (err) {
      console.error('Restore error:', err);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="space-y-12">
      {/* Navigation Tabs */}
      <nav className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit backdrop-blur-2xl">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 ${
            activeTab === 'logs' 
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Logs</span>
        </button>
        <button
          onClick={() => setActiveTab('deleted')}
          className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 ${
            activeTab === 'deleted' 
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Itens Eliminados</span>
        </button>
      </nav>

      {/* Content Area */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === 'logs' ? (
            <motion.div
              key="logs"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-3xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                     <ShieldCheck className="w-24 h-24 text-emerald-400" />
                  </div>
                  <p className="text-slate-400 font-medium">Total de Acções</p>
                  <h3 className="text-4xl font-black mt-2 text-white">{logs.length}+</h3>
                  <div className="w-12 h-1 bg-emerald-500 mt-4 rounded-full" />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="px-6 py-5 text-sm uppercase tracking-widest text-slate-400 font-black">Data/Hora</th>
                        <th className="px-6 py-5 text-sm uppercase tracking-widest text-slate-400 font-black">Acção</th>
                        <th className="px-6 py-5 text-sm uppercase tracking-widest text-slate-400 font-black">Entidade</th>
                        <th className="px-6 py-5 text-sm uppercase tracking-widest text-slate-400 font-black">Endpoint</th>
                        <th className="px-6 py-5 text-sm uppercase tracking-widest text-slate-400 font-black">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-5 text-sm whitespace-nowrap text-slate-300 tabular-nums">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${
                              log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              log.action === 'DELETE' || log.action === 'SOFT_DELETE' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              log.action === 'UPDATE' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                              'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-sm font-bold text-slate-200">
                             {log.entity_type}
                             <span className="text-slate-600 ml-2 font-medium">#{log.id}</span>
                          </td>
                          <td className="px-6 py-5 text-xs font-mono text-slate-500">
                             {log.endpoint}
                          </td>
                          <td className="px-6 py-5">
                             <button className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform text-sm">
                               Explorar <ArrowRight className="w-3 h-3" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="deleted"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="flex items-center justify-between">
                 <h2 className="text-2xl font-black text-white flex items-center gap-3">
                   <Trash2 className="w-8 h-8 text-red-500" />
                   Recuperação de Registos
                 </h2>
              </header>

              <div className="grid grid-cols-1 gap-4">
                {deleted.length === 0 ? (
                  <div className="p-20 border-2 border-dashed border-white/10 rounded-3xl text-center">
                    <Database className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">Nenhum registo "apagado" encontrado.</p>
                  </div>
                ) : (
                  deleted.map((rec) => (
                    <div key={`${rec.type}-${rec.id}`} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between backdrop-blur-2xl group hover:border-emerald-500/30 transition-all">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                            rec.type === 'product' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                         }`}>
                           <Database className="w-6 h-6" />
                         </div>
                         <div>
                            <p className="text-xs uppercase tracking-widest text-slate-500 font-black">{rec.type}</p>
                            <h3 className="text-xl font-bold text-white">{rec.name}</h3>
                            <p className="text-xs text-red-400 flex items-center gap-2 mt-1">
                               <Clock className="w-3 h-3" /> 
                               Eliminado em: {new Date(rec.deleted_at).toLocaleString()}
                            </p>
                         </div>
                      </div>
                      <button
                        onClick={() => handleRestore(rec.type, rec.id)}
                        disabled={restoringId === rec.id}
                        className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-black shadow-xl shadow-emerald-500/20 flex items-center gap-2 group-hover:scale-105 transition-transform"
                      >
                         {restoringId === rec.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                         <span>Restaurar</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
           <div className="bg-[#111] border border-white/10 p-8 rounded-3xl flex flex-col items-center gap-4 text-white font-black shadow-2xl">
              <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin" />
              <span>Sincronizando Auditoria...</span>
           </div>
        </div>
      )}
    </div>
  );
}
