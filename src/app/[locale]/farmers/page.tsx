'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import Header from '@/components/layout/Header';
import { syncManager } from '@/lib/offline/syncManager';
import {
  UserCheck,
  Plus,
  Search,
  MapPin,
  Phone,
  Sprout,
  X,
  ChevronRight,
  Clock,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle2,
  WifiOff
} from 'lucide-react';

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  // Detail Drawer
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  const [farmerDetails, setFarmerDetails] = useState<any>(null);
  const [farmerTimeline, setFarmerTimeline] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gender: 'M',
    birth_date: '',
    phone: '',
    group_id: '',
    province: 'Nampula',
    district: 'Rapale',
    administrative_post: '',
    locality: '',
    main_crops: '',
    agricultural_experience_years: '5',
    estimated_total_area: '2.0',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchFarmers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedGroupId) params.append('group_id', selectedGroupId);

      const res = await fetch(`/api/v1/farmers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFarmers(data);
      }

      const groupsRes = await fetch('/api/v1/groups');
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
        if (groupsData.length > 0 && !formData.group_id) {
          setFormData(prev => ({ ...prev, group_id: String(groupsData[0].id) }));
        }
      }
    } catch (e) {
      console.error('Erro ao buscar produtores:', e);
    } finally {
      setLoading(false);
    }
  }, [search, selectedGroupId]);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  const handleOpenDetails = async (farmer: any) => {
    setSelectedFarmer(farmer);
    setLoadingDetails(true);
    try {
      const [detailRes, timelineRes] = await Promise.all([
        fetch(`/api/v1/farmers/${farmer.id}`),
        fetch(`/api/v1/farmers/${farmer.id}/timeline`),
      ]);

      if (detailRes.ok) {
        const detailData = await detailRes.json();
        setFarmerDetails(detailData);
      }
      if (timelineRes.ok) {
        const timelineData = await timelineRes.json();
        setFarmerTimeline(timelineData.timeline || []);
      }
    } catch (e) {
      console.error('Erro ao buscar detalhes do produtor:', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setSuccessMessage(null);

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    try {
      if (isOffline) {
        // Enfileirar no motor Offline-First
        syncManager.enqueue('farmer', {
          ...formData,
          group_id: Number(formData.group_id),
          agricultural_experience_years: Number(formData.agricultural_experience_years),
          estimated_total_area: Number(formData.estimated_total_area),
        });

        setSuccessMessage('Salvo no dispositivo! Será sincronizado automaticamente quando houver conexão.');
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setSuccessMessage(null);
        }, 2500);
      } else {
        const res = await fetch('/api/v1/farmers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Erro ao registar produtor');
        }

        setSuccessMessage('Produtor registado com sucesso no servidor!');
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setSuccessMessage(null);
          fetchFarmers();
        }, 1200);
      }
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
          {/* Header & New Farmer Action */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                <UserCheck className="text-emerald-700" size={28} />
                <span>Produtores Agrícolas</span>
              </h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Cadastro de agricultores familiares, perfil socioprodutivo e histórico de safras.
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-colors text-xs md:text-sm font-bold shadow-sm"
            >
              <Plus size={16} />
              <span>Registar Produtor</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
              <Search size={18} className="text-gray-400 shrink-0 ml-1" />
              <input
                type="text"
                placeholder="Buscar por nome, telefone, localidade ou cultura..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm outline-none bg-transparent placeholder-gray-400"
              />
            </div>

            <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-2xs">
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full p-2 text-sm border-none bg-transparent outline-none font-medium text-gray-700"
              >
                <option value="">Todos os Grupos</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Farmers Directory List */}
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Carregando produtores agrícolas...</div>
          ) : farmers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
              <UserCheck size={36} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-800">Nenhum produtor encontrado</h3>
              <p className="text-xs text-gray-400 mt-1 mb-4">Adicione o primeiro produtor à sua organização ou altere os filtros.</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold"
              >
                Registar Produtor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {farmers.map((farmer) => (
                <div
                  key={farmer.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {farmer.group_name || 'Sem Grupo'}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin size={12} /> {farmer.locality || farmer.district}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900">{farmer.name}</h3>

                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <span className="font-medium">{farmer.gender === 'F' ? 'Mulher' : 'Homem'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Phone size={11} /> {farmer.phone || 'Sem telemóvel'}</span>
                    </div>

                    <div className="mt-3 p-3 rounded-xl bg-gray-50 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Culturas:</span>
                        <span className="font-bold text-gray-700">{farmer.main_crops || 'Diversas'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Machambas:</span>
                        <span className="font-bold text-gray-700">{farmer.total_farms || 0} ({farmer.active_cultivated_area || 0} ha)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">Exp: {farmer.agricultural_experience_years || 0} anos</span>
                    <button
                      onClick={() => handleOpenDetails(farmer)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                    >
                      Ver Perfil & Timeline <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Farmer Detail & Timeline Drawer */}
          {selectedFarmer && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
              <div className="w-full max-w-lg bg-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Ficha do Produtor</span>
                      <h2 className="text-xl font-black text-gray-900">{selectedFarmer.name}</h2>
                      <p className="text-xs text-gray-500">{selectedFarmer.group_name} • {selectedFarmer.district}</p>
                    </div>
                    <button onClick={() => setSelectedFarmer(null)} className="p-1 rounded-full text-gray-400 hover:text-gray-600">
                      <X size={20} />
                    </button>
                  </div>

                  {loadingDetails ? (
                    <div className="py-12 text-center text-xs text-gray-400">Carregando perfil e timeline...</div>
                  ) : (
                    <>
                      {/* Summary Cards */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-gray-50">
                          <span className="block text-[11px] text-gray-400 font-medium">Machambas</span>
                          <span className="text-sm font-black text-gray-900">{farmerDetails?.farms?.length ?? 0}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-gray-50">
                          <span className="block text-[11px] text-gray-400 font-medium">Cultivos</span>
                          <span className="text-sm font-black text-gray-900">{farmerDetails?.productions?.length ?? 0}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-gray-50">
                          <span className="block text-[11px] text-gray-400 font-medium">Insumos</span>
                          <span className="text-sm font-black text-emerald-700">{farmerDetails?.inputs?.length ?? 0}</span>
                        </div>
                      </div>

                      {/* Machambas do Produtor */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Machambas Cadastradas</h4>
                        <div className="space-y-2">
                          {farmerDetails?.farms?.length === 0 ? (
                            <div className="text-xs text-gray-400 p-2 text-center">Nenhuma machamba associada</div>
                          ) : (
                            farmerDetails?.farms?.map((f: any) => (
                              <div key={f.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs flex justify-between items-center">
                                <div>
                                  <div className="font-bold text-gray-800">{f.name}</div>
                                  <div className="text-gray-500">{f.locality || f.district} • Solo: {f.soil_type || 'Geral'}</div>
                                </div>
                                <div className="text-right font-black text-emerald-700">{f.cultivated_area} ha</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Histórico / Timeline */}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                          <Clock size={13} />
                          <span>Timeline de Atividades</span>
                        </h4>

                        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                          {farmerTimeline.map((item, idx) => (
                            <div key={idx} className="relative">
                              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                              <div className="text-xs font-bold text-gray-800">{item.title}</div>
                              <div className="text-[11px] text-gray-500">{item.description}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">{item.date}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedFarmer(null)}
                    className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Register Farmer Modal (Offline-Ready) */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Registar Produtor</h3>
                    <p className="text-xs text-gray-400">Funciona mesmo sem sinal de internet (Offline-First)</p>
                  </div>
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

                {successMessage && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 size={15} />
                    <span>{successMessage}</span>
                  </div>
                )}

                <form onSubmit={handleCreateFarmer} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: António Mário Sitoe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Grupo de Produtores *</label>
                      <select
                        required
                        value={formData.group_id}
                        onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Género</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Telefone</label>
                      <input
                        type="text"
                        placeholder="84 123 4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Data de Nascimento</label>
                      <input
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Distrito *</label>
                      <input
                        type="text"
                        required
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Localidade</label>
                      <input
                        type="text"
                        placeholder="Ex: Marrere"
                        value={formData.locality}
                        onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Culturas Principais</label>
                      <input
                        type="text"
                        placeholder="Ex: Milho, Mandioca"
                        value={formData.main_crops}
                        onChange={(e) => setFormData({ ...formData, main_crops: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Área Total Estimada (ha)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.estimated_total_area}
                        onChange={(e) => setFormData({ ...formData, estimated_total_area: e.target.value })}
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
                      {submitting ? 'A salvar...' : 'Registar Produtor'}
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
