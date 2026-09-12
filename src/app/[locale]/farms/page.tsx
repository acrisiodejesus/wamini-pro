'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import Header from '@/components/layout/Header';
import {
  MapPin,
  Plus,
  Search,
  Sprout,
  X,
  Layers,
  Droplets,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function FarmsPage() {
  const [farms, setFarms] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFarmerId, setSelectedFarmerId] = useState('');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    farmer_id: '',
    name: '',
    province: 'Nampula',
    district: 'Rapale',
    locality: '',
    total_area: '2.5',
    cultivated_area: '2.0',
    soil_type: 'Franco-argiloso',
    irrigation_type: 'Sequeiro',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchFarms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedFarmerId) params.append('farmer_id', selectedFarmerId);

      const res = await fetch(`/api/v1/farms?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFarms(data);
      }

      const farmersRes = await fetch('/api/v1/farmers');
      if (farmersRes.ok) {
        const farmersData = await farmersRes.json();
        setFarmers(farmersData);
        if (farmersData.length > 0 && !formData.farmer_id) {
          setFormData(prev => ({ ...prev, farmer_id: String(farmersData[0].id) }));
        }
      }
    } catch (e) {
      console.error('Erro ao buscar machambas:', e);
    } finally {
      setLoading(false);
    }
  }, [search, selectedFarmerId]);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/v1/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao registar machamba');
      }

      setIsCreateModalOpen(false);
      fetchFarms();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
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
                <MapPin className="text-emerald-700" size={28} />
                <span>Machambas (Propriedades Agrícolas)</span>
              </h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Parcelas produtivas cadastradas por agricultor, tipologia de solo e área cultivável.
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-colors text-xs md:text-sm font-bold shadow-sm"
            >
              <Plus size={16} />
              <span>Registar Machamba</span>
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
              <Search size={18} className="text-gray-400 shrink-0 ml-1" />
              <input
                type="text"
                placeholder="Buscar por nome da machamba, localidade ou produtor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm outline-none bg-transparent placeholder-gray-400"
              />
            </div>

            <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-2xs">
              <select
                value={selectedFarmerId}
                onChange={(e) => setSelectedFarmerId(e.target.value)}
                className="w-full p-2 text-sm border-none bg-transparent outline-none font-medium text-gray-700"
              >
                <option value="">Todos os Produtores</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.group_name || 'Sem Grupo'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Farms Grid */}
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Carregando machambas...</div>
          ) : farms.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
              <MapPin size={36} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-800">Nenhuma machamba encontrada</h3>
              <p className="text-xs text-gray-400 mt-1 mb-4">Adicione a primeira machamba associada a um produtor.</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold"
              >
                Registar Machamba
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {farms.map((farm) => (
                <div
                  key={farm.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {farm.status || 'Ativa'}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin size={12} /> {farm.locality || farm.district}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900">{farm.name}</h3>
                    <div className="text-xs text-gray-500 mt-1">
                      Produtor: <span className="font-bold text-gray-800">{farm.farmer_name}</span> ({farm.group_name})
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-gray-50 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Área Cultivada:</span>
                        <span className="font-black text-emerald-700">{farm.cultivated_area} ha <span className="font-normal text-gray-400">/ {farm.total_area} ha</span></span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Tipo de Solo:</span>
                        <span className="font-medium text-gray-700">{farm.soil_type || 'Geral'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Irrigação:</span>
                        <span className="font-medium text-gray-700">{farm.irrigation_type || 'Sequeiro'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400 flex justify-between">
                    <span>Pronta para geolocalização</span>
                    <span className="text-emerald-700 font-semibold">100% Regularizada</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Farm Modal */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <h3 className="text-lg font-black text-gray-900">Registar Machamba</h3>
                  <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200 flex items-center gap-2">
                    <AlertCircle size={15} />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateFarm} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Produtor Proprietário *</label>
                    <select
                      required
                      value={formData.farmer_id}
                      onChange={(e) => setFormData({ ...formData, farmer_id: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {farmers.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.group_name || 'Sem grupo'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nome / Identificador da Machamba *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Machamba Vale Verde - Parcela 2"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Área Total (ha) *</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={formData.total_area}
                        onChange={(e) => setFormData({ ...formData, total_area: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Área Cultivada (ha)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.cultivated_area}
                        onChange={(e) => setFormData({ ...formData, cultivated_area: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Tipo de Solo</label>
                      <input
                        type="text"
                        placeholder="Ex: Franco-argiloso"
                        value={formData.soil_type}
                        onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Irrigação</label>
                      <input
                        type="text"
                        placeholder="Ex: Sequeiro, Gotejamento"
                        value={formData.irrigation_type}
                        onChange={(e) => setFormData({ ...formData, irrigation_type: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
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
                      {submitting ? 'A salvar...' : 'Registar Machamba'}
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
