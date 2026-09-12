'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import Header from '@/components/layout/Header';
import { Link } from '@/i18n/routing';
import {
  Users,
  Sprout,
  MapPin,
  TrendingUp,
  Boxes,
  AlertTriangle,
  PlusCircle,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [report, setReport] = useState<any>(null);
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Carregar ciclos para filtro
      const cyclesRes = await fetch('/api/v1/production-cycles');
      if (cyclesRes.ok) {
        const cyclesData = await cyclesRes.json();
        setCycles(cyclesData);
        if (cyclesData.length > 0 && !selectedCycleId) {
          setSelectedCycleId(String(cyclesData[0].id));
        }
      }

      // 2. Carregar dados analíticos da organização
      const query = selectedCycleId ? `?cycle_id=${selectedCycleId}` : '';
      const repRes = await fetch(`/api/v1/reports/organization${query}`);
      if (repRes.ok) {
        const repData = await repRes.json();
        setReport(repData);
      }
    } catch (e) {
      console.error('Erro ao carregar dados do dashboard:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedCycleId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const org = report?.organization || {};
  const prod = report?.production || {};
  const cropsSummary = report?.crops_summary || [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0 pb-20 md:pb-10">
        <Header />

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Banner & Quick Actions */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 md:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-white/20 text-emerald-100">
                  {org.type ? org.type.toUpperCase() : 'ORGANIZAÇÃO'}
                </span>
                <span className="text-xs text-emerald-200">
                  {org.province} • {org.district}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                {org.name || 'Cooperativa Agrícola'}
              </h1>
              <p className="text-emerald-100 text-sm mt-1 max-w-xl">
                Plataforma de gestão de grupos de produtores, machambas, monitoramento de safras e controle de insumos.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/farmers"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 transition-colors text-xs font-bold shadow-sm"
              >
                <PlusCircle size={15} />
                <span>Novo Produtor</span>
              </Link>
              <Link
                href="/production"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-white border border-emerald-500/30 transition-colors text-xs font-bold"
              >
                <TrendingUp size={15} />
                <span>Registar Cultivo</span>
              </Link>
              <Link
                href="/inputs"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-white border border-emerald-500/30 transition-colors text-xs font-bold"
              >
                <Boxes size={15} />
                <span>Distribuir Insumos</span>
              </Link>
            </div>
          </div>

          {/* Filter Bar: Production Cycle */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Calendar size={18} className="text-emerald-700" />
              <span>Campanha Agrícola Ativa:</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedCycleId}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                className="w-full sm:w-64 px-3.5 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Todas as Campanhas</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.season || 'Geral'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Produtores */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Produtores</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Users size={18} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-black text-gray-900">
                  {report?.total_farmers ?? 0}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                  <span>H: {report?.farmers_gender?.male ?? 0}</span>
                  <span>•</span>
                  <span>M: {report?.farmers_gender?.female ?? 0}</span>
                </div>
              </div>
            </motion.div>

            {/* Grupos de Produtores */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Grupos / Polos</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Sprout size={18} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-black text-gray-900">
                  {report?.total_groups ?? 0}
                </div>
                <div className="text-xs text-emerald-700 font-medium mt-1">
                  100% ativos em Nampula
                </div>
              </div>
            </motion.div>

            {/* Machambas & Área */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Área Cultivada</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <MapPin size={18} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-black text-gray-900">
                  {report?.total_cultivated_area_ha ?? 0} <span className="text-sm font-semibold text-gray-500">ha</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  de {report?.total_area_ha ?? 0} ha totais cadastrados
                </div>
              </div>
            </motion.div>

            {/* Insumos Entregues */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Insumos Entregues</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Boxes size={18} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-black text-gray-900">
                  {report?.inputs_distribution?.distributions_count ?? 0}
                </div>
                <div className="text-xs text-purple-700 font-medium mt-1">
                  {report?.inputs_distribution?.farmers_reached ?? 0} produtores beneficiados
                </div>
              </div>
            </motion.div>
          </div>

          {/* Production Realized vs Estimated & Loss Indicators */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Produção Real vs Estimada */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Produção Agrícola: Colheitas vs Previsão</h2>
                  <p className="text-xs text-gray-500">Resultados consolidados da campanha</p>
                </div>
                <Link href="/production" className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1">
                  Ver detalhes <ArrowUpRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">Previsão Estimada</span>
                  <div className="text-xl font-black text-gray-900 mt-1">
                    {(prod.estimated_kg || 0).toLocaleString()} <span className="text-xs font-normal">kg</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <span className="text-xs text-emerald-800 font-medium">Colheita Realizada</span>
                  <div className="text-xl font-black text-emerald-900 mt-1">
                    {(prod.harvested_kg || 0).toLocaleString()} <span className="text-xs font-normal">kg</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                  <span className="text-xs text-amber-800 font-medium">Perdas Registadas</span>
                  <div className="text-xl font-black text-amber-900 mt-1">
                    {(prod.losses_kg || 0).toLocaleString()} <span className="text-xs font-normal">kg</span>
                  </div>
                </div>
              </div>

              {/* Barra de Rendimento */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-medium text-gray-600">
                  <span>Taxa de Perdas da Produção</span>
                  <span className={prod.loss_rate_percentage > 15 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                    {prod.loss_rate_percentage ?? 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-600 h-full"
                    style={{ width: `${Math.max(0, 100 - (prod.loss_rate_percentage || 0))}%` }}
                    title="Aproveitamento"
                  />
                  <div
                    className="bg-amber-500 h-full"
                    style={{ width: `${Math.min(100, prod.loss_rate_percentage || 0)}%` }}
                    title="Perdas"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Produtividade Média: {prod.average_productivity_kg_ha ?? 0} kg/ha</span>
                  <span>Meta de perda tolerável: &lt; 10%</span>
                </div>
              </div>
            </div>

            {/* Resumo de Culturas */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">Culturas Ativas</h2>
                  <Link href="/crops" className="text-xs font-semibold text-emerald-700 hover:underline">
                    Ver todas
                  </Link>
                </div>

                <div className="space-y-3">
                  {cropsSummary.length === 0 ? (
                    <div className="text-xs text-gray-400 py-6 text-center">Nenhum registo de cultura nesta campanha</div>
                  ) : (
                    cropsSummary.slice(0, 4).map((crop: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 text-xs">
                        <div>
                          <div className="font-bold text-gray-900">{crop.crop_name}</div>
                          <div className="text-[11px] text-gray-500 capitalize">{crop.category} • {crop.planted_ha} ha</div>
                        </div>
                        <div className="text-right font-black text-emerald-700">
                          {Number(crop.harvested_kg).toLocaleString()} kg
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Dados auditados e protegidos por organização</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
