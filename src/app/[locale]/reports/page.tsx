'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import Header from '@/components/layout/Header';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Boxes,
  Users,
  Printer,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

export default function ReportsPage() {
  const [orgReport, setOrgReport] = useState<any>(null);
  const [groupReports, setGroupReports] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const q = selectedCycleId ? `?cycle_id=${selectedCycleId}` : '';
      const [orgRes, grpRes, cyclesRes] = await Promise.all([
        fetch(`/api/v1/reports/organization${q}`),
        fetch(`/api/v1/reports/group${q}`),
        fetch('/api/v1/production-cycles'),
      ]);

      if (orgRes.ok) setOrgReport(await orgRes.json());
      if (grpRes.ok) setGroupReports(await grpRes.json());
      if (cyclesRes.ok) setCycles(await cyclesRes.json());
    } catch (e) {
      console.error('Erro ao gerar relatórios:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedCycleId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const org = orgReport?.organization || {};
  const prod = orgReport?.production || {};

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0 pb-20 md:pb-10">
        <Header />

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                <BarChart3 className="text-emerald-700" size={28} />
                <span>Relatórios e Indicadores de Desempenho</span>
              </h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Consolidação operacional, comparação entre grupos de produtores e auditoria de colheitas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 shadow-2xs"
              >
                <Printer size={14} />
                <span>Imprimir Relatório</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
            <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Calendar size={15} className="text-emerald-700" />
              <span>Filtrar por Campanha:</span>
            </div>

            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="w-full sm:w-64 p-2 text-xs border border-gray-200 rounded-xl bg-gray-50 outline-none"
            >
              <option value="">Todas as Campanhas Registadas</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Consolidated Executive Summary */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-2xs space-y-6">
            <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Relatório Executivo</span>
                <h2 className="text-xl font-black text-gray-900">{org.name}</h2>
                <p className="text-xs text-gray-500">{org.province} • {org.district}, Emitido automaticamente</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs">
                Certificado Auditável
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-gray-50">
                <span className="block text-xs text-gray-400 font-medium">Total Produtores</span>
                <span className="text-2xl font-black text-gray-900">{orgReport?.total_farmers ?? 0}</span>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <span className="block text-xs text-gray-400 font-medium">Machambas</span>
                <span className="text-2xl font-black text-gray-900">{orgReport?.total_farms ?? 0}</span>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <span className="block text-xs text-gray-400 font-medium">Área Cultivada (ha)</span>
                <span className="text-2xl font-black text-emerald-700">{orgReport?.total_cultivated_area_ha ?? 0}</span>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50">
                <span className="block text-xs text-gray-400 font-medium">Colheita Realizada (kg)</span>
                <span className="text-2xl font-black text-emerald-800">{(prod.harvested_kg || 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Comparativo de Grupos */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-gray-900">Desempenho por Grupo de Produtores</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-400 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-3 rounded-l-xl">Grupo</th>
                      <th className="p-3">Distrito</th>
                      <th className="p-3 text-center">Produtores</th>
                      <th className="p-3 text-center">Área (ha)</th>
                      <th className="p-3 text-right">Previsto (kg)</th>
                      <th className="p-3 text-right">Colhido (kg)</th>
                      <th className="p-3 rounded-r-xl text-center">Taxa de Perdas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {groupReports.map((g) => (
                      <tr key={g.group_id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-bold text-gray-900">{g.group_name}</td>
                        <td className="p-3 text-gray-500">{g.district}</td>
                        <td className="p-3 text-center font-semibold">{g.total_farmers}</td>
                        <td className="p-3 text-center">{g.cultivated_area_ha}</td>
                        <td className="p-3 text-right text-gray-600">{Number(g.estimated_production_kg).toLocaleString()}</td>
                        <td className="p-3 text-right font-black text-emerald-700">{Number(g.harvested_production_kg).toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className={g.loss_rate_percentage > 15 ? 'font-bold text-rose-600' : 'text-emerald-700 font-bold'}>
                            {g.loss_rate_percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
