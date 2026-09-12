'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import Header from '@/components/layout/Header';
import { syncManager } from '@/lib/offline/syncManager';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Sprout,
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';

export default function ProductionPage() {
  const [productions, setProductions] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [selectedCropId, setSelectedCropId] = useState('');
  const [selectedStage, setSelectedStage] = useState('');

  // Register Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const [formData, setFormData] = useState({
    cycle_id: '',
    farmer_id: '',
    farm_id: '',
    crop_id: '',
    planted_area_ha: '1.0',
    planting_date: new Date().toISOString().split('T')[0],
    estimated_production: '2000',
    current_stage: 'planted',
    notes: '',
  });

  const [updateData, setUpdateData] = useState({
    harvested_quantity: '0',
    loss_quantity: '0',
    loss_reason: '',
    current_stage: 'harvested',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProductions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCycleId) params.append('cycle_id', selectedCycleId);
      if (selectedCropId) params.append('crop_id', selectedCropId);
      if (selectedStage) params.append('stage', selectedStage);

      const res = await fetch(`/api/v1/production?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProductions(data);
      }

      // Preload auxiliary data
      const [cyclesRes, cropsRes, farmersRes, farmsRes] = await Promise.all([
        fetch('/api/v1/production-cycles'),
        fetch('/api/v1/crops'),
        fetch('/api/v1/farmers'),
        fetch('/api/v1/farms'),
      ]);

      if (cyclesRes.ok) setCycles(await cyclesRes.json());
      if (cropsRes.ok) setCrops(await cropsRes.json());
      if (farmersRes.ok) setFarmers(await farmersRes.json());
      if (farmsRes.ok) setFarms(await farmsRes.json());
    } catch (e) {
      console.error('Erro ao buscar registos de produção:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedCycleId, selectedCropId, selectedStage]);

  useEffect(() => {
    fetchProductions();
  }, [fetchProductions]);

  // Farmer farm sub-selection
  const availableFarms = farms.filter(
    (f) => !formData.farmer_id || String(f.farmer_id) === String(formData.farmer_id)
  );

  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    try {
      if (isOffline) {
        syncManager.enqueue('production', {
          ...formData,
          cycle_id: Number(formData.cycle_id || (cycles[0]?.id ?? 1)),
          farmer_id: Number(formData.farmer_id || (farmers[0]?.id ?? 1)),
          farm_id: Number(formData.farm_id || (availableFarms[0]?.id ?? 1)),
          crop_id: Number(formData.crop_id || (crops[0]?.id ?? 1)),
          planted_area_ha: Number(formData.planted_area_ha),
          estimated_production: Number(formData.estimated_production),
        });

        setIsCreateModalOpen(false);
      } else {
        const res = await fetch('/api/v1/production', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            cycle_id: Number(formData.cycle_id || cycles[0]?.id),
            farmer_id: Number(formData.farmer_id || farmers[0]?.id),
            farm_id: Number(formData.farm_id || availableFarms[0]?.id),
            crop_id: Number(formData.crop_id || crops[0]?.id),
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Erro ao registar produção');
        }

        setIsCreateModalOpen(false);
        fetchProductions();
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenUpdate = (rec: any) => {
    setSelectedRecord(rec);
    setUpdateData({
      harvested_quantity: String(rec.harvested_quantity || rec.estimated_production || 0),
      loss_quantity: String(rec.loss_quantity || 0),
      loss_reason: rec.loss_reason || '',
      current_stage: rec.current_stage === 'harvested' ? 'harvested' : 'harvested',
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/production/${selectedRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao atualizar colheita');
      }

      setIsUpdateModalOpen(false);
      fetchProductions();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'planned':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">Planeado</span>;
      case 'planted':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Plantado</span>;
      case 'growing':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Em Crescimento</span>;
      case 'ready_for_harvest':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Pronto p/ Colheita</span>;
      case 'harvested':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Colhido</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">Concluído</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">{stage}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0 pb-20 md:pb-10">
        <Header />

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                <TrendingUp className="text-emerald-700" size={28} />
                <span>Registos de Produção Agrícola</span>
              </h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Controle de plantios, fases fenológicas, previsões de colheita e cálculo de taxas de perda.
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-colors text-xs md:text-sm font-bold shadow-sm"
            >
              <Plus size={16} />
              <span>Registar Plantio</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
            <div>
              <select
                value={selectedCycleId}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                className="w-full p-2 text-xs border border-gray-200 rounded-xl outline-none font-medium text-gray-700 bg-gray-50"
              >
                <option value="">Todas as Campanhas</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="w-full p-2 text-xs border border-gray-200 rounded-xl outline-none font-medium text-gray-700 bg-gray-50"
              >
                <option value="">Todas as Culturas</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full p-2 text-xs border border-gray-200 rounded-xl outline-none font-medium text-gray-700 bg-gray-50"
              >
                <option value="">Todas as Fases</option>
                <option value="planted">Plantado</option>
                <option value="growing">Em Crescimento</option>
                <option value="ready_for_harvest">Pronto p/ Colheita</option>
                <option value="harvested">Colhido</option>
              </select>
            </div>
          </div>

          {/* Production Records Table/Cards */}
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Carregando dados de produção...</div>
          ) : productions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
              <TrendingUp size={36} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-800">Nenhum registo de produção</h3>
              <p className="text-xs text-gray-400 mt-1 mb-4">Registe o primeiro plantio associando um produtor, cultura e machamba.</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold"
              >
                Registar Plantio
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {productions.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-4 md:p-5 hover:border-gray-200 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900">{rec.crop_name}</span>
                      <span className="text-xs text-gray-400 font-medium">({rec.crop_category})</span>
                      {getStageBadge(rec.current_stage)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Produtor: <span className="font-semibold text-gray-800">{rec.farmer_name}</span> • Machamba: <span className="font-semibold text-gray-800">{rec.farm_name}</span> ({rec.group_name})
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Campanha: {rec.cycle_name} • Data Plantio: {rec.planting_date || 'N/D'}
                    </div>
                  </div>

                  {/* Production Stats */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="text-right">
                      <span className="block text-[11px] text-gray-400">Área</span>
                      <span className="font-black text-gray-900">{rec.planted_area_ha} ha</span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[11px] text-gray-400">Estimativa</span>
                      <span className="font-bold text-gray-700">{Number(rec.estimated_production).toLocaleString()} kg</span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[11px] text-emerald-700 font-bold">Colhido</span>
                      <span className="font-black text-emerald-800">{Number(rec.harvested_quantity).toLocaleString()} kg</span>
                    </div>

                    {Number(rec.loss_quantity) > 0 && (
                      <div className="text-right text-amber-700">
                        <span className="block text-[11px]">Perdas</span>
                        <span className="font-bold">{rec.loss_quantity} kg ({rec.loss_rate_percentage}%)</span>
                      </div>
                    )}

                    <button
                      onClick={() => handleOpenUpdate(rec)}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 text-xs font-bold transition-colors"
                    >
                      {rec.current_stage === 'harvested' ? 'Atualizar Colheita' : 'Registar Colheita'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal Registar Plantio */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Registar Plantio de Cultura</h3>
                    <p className="text-xs text-gray-400">Associação da safra ao agricultor e machamba</p>
                  </div>
                  <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateProduction} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Campanha Agrícola *</label>
                    <select
                      required
                      value={formData.cycle_id}
                      onChange={(e) => setFormData({ ...formData, cycle_id: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {cycles.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Produtor *</label>
                      <select
                        required
                        value={formData.farmer_id}
                        onChange={(e) => setFormData({ ...formData, farmer_id: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {farmers.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Cultura *</label>
                      <select
                        required
                        value={formData.crop_id}
                        onChange={(e) => setFormData({ ...formData, crop_id: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {crops.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Machamba *</label>
                    <select
                      required
                      value={formData.farm_id}
                      onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {availableFarms.map((f) => (
                        <option key={f.id} value={f.id}>{f.name} ({f.cultivated_area} ha)</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Área Plantada (ha) *</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={formData.planted_area_ha}
                        onChange={(e) => setFormData({ ...formData, planted_area_ha: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Produção Estimada (kg) *</label>
                      <input
                        type="number"
                        required
                        value={formData.estimated_production}
                        onChange={(e) => setFormData({ ...formData, estimated_production: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Data de Plantio</label>
                    <input
                      type="date"
                      value={formData.planting_date}
                      onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="w-1/2 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-1/2 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold disabled:opacity-50"
                    >
                      {submitting ? 'A salvar...' : 'Salvar Plantio'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Atualizar Colheita & Perdas */}
          {isUpdateModalOpen && selectedRecord && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-black text-gray-900">Registo de Colheita e Perdas</h3>
                    <p className="text-xs text-gray-500">{selectedRecord.crop_name} • {selectedRecord.farmer_name}</p>
                  </div>
                  <button onClick={() => setIsUpdateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleUpdateProduction} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Estado da Safra</label>
                    <select
                      value={updateData.current_stage}
                      onChange={(e) => setUpdateData({ ...updateData, current_stage: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="growing">Em Crescimento</option>
                      <option value="ready_for_harvest">Pronto para Colheita</option>
                      <option value="harvested">Colhido</option>
                      <option value="completed">Concluído</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Quantidade Colhida (kg) *</label>
                      <input
                        type="number"
                        required
                        value={updateData.harvested_quantity}
                        onChange={(e) => setUpdateData({ ...updateData, harvested_quantity: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-black text-emerald-800"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Perdas (kg)</label>
                      <input
                        type="number"
                        value={updateData.loss_quantity}
                        onChange={(e) => setUpdateData({ ...updateData, loss_quantity: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-amber-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Motivo das Perdas (se houver)</label>
                    <input
                      type="text"
                      placeholder="Ex: Seca localizada, pragas, danos pós-colheita"
                      value={updateData.loss_reason}
                      onChange={(e) => setUpdateData({ ...updateData, loss_reason: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsUpdateModalOpen(false)}
                      className="w-1/2 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-1/2 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold disabled:opacity-50"
                    >
                      {submitting ? 'A salvar...' : 'Confirmar Colheita'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
