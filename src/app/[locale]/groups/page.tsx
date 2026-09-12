'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import Header from '@/components/layout/Header';
import {
  Users,
  Plus,
  Search,
  MapPin,
  TrendingUp,
  Boxes,
  X,
  CheckCircle2,
  ChevronRight,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupStats, setGroupStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [province, setProvince] = useState('Nampula');
  const [district, setDistrict] = useState('Rapale');
  const [locality, setLocality] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/v1/groups${q}`);
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (e) {
      console.error('Erro ao buscar grupos:', e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleOpenStats = async (group: any) => {
    setSelectedGroup(group);
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/v1/groups/${group.id}/stats`);
      if (res.ok) {
        const data = await res.json();
        setGroupStats(data);
      }
    } catch (e) {
      console.error('Erro ao buscar estatísticas do grupo:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/v1/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          province,
          district,
          locality,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao criar grupo');
      }

      setName('');
      setDescription('');
      setLocality('');
      setIsCreateModalOpen(false);
      fetchGroups();
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
          {/* Header & Create Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                <Users className="text-emerald-700" size={28} />
                <span>Grupos de Produtores</span>
              </h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Organização por núcleos rurais, associações de base e áreas geográficas.
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-colors text-xs md:text-sm font-bold shadow-sm"
            >
              <Plus size={16} />
              <span>Novo Grupo</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-3">
            <Search size={18} className="text-gray-400 shrink-0 ml-1" />
            <input
              type="text"
              placeholder="Procurar por nome do grupo, distrito ou localidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm outline-none bg-transparent placeholder-gray-400"
            />
          </div>

          {/* Groups Grid */}
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Carregando grupos de produtores...</div>
          ) : groups.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
              <Users size={36} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-800">Nenhum grupo cadastrado</h3>
              <p className="text-xs text-gray-400 mt-1 mb-4">Cadastre o primeiro grupo para começar a organizar os agricultores.</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold"
              >
                Criar Grupo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {group.status || 'Ativo'}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin size={12} /> {group.district}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900">{group.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {group.description || 'Sem descrição cadastrada.'}
                    </p>

                    <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-gray-50">
                        <span className="block text-xs text-gray-400 font-medium">Produtores</span>
                        <span className="text-base font-black text-gray-800">{group.total_farmers || 0}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-gray-50">
                        <span className="block text-xs text-gray-400 font-medium">Machambas</span>
                        <span className="text-base font-black text-gray-800">{group.total_farms || 0}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-gray-50">
                        <span className="block text-xs text-gray-400 font-medium">Área (ha)</span>
                        <span className="text-base font-black text-emerald-700">{group.total_cultivated_area || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-[11px] text-gray-400 flex items-center gap-1">
                      <User size={12} /> {group.manager_name || 'Gestor não atribuído'}
                    </div>
                    <button
                      onClick={() => handleOpenStats(group)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                    >
                      Indicadores <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Group Stats Drawer / Modal */}
          {selectedGroup && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
              <div className="w-full max-w-md bg-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Dashboard do Grupo</span>
                      <h2 className="text-lg font-black text-gray-900">{selectedGroup.name}</h2>
                    </div>
                    <button onClick={() => setSelectedGroup(null)} className="p-1 rounded-full text-gray-400 hover:text-gray-600">
                      <X size={20} />
                    </button>
                  </div>

                  {loadingStats ? (
                    <div className="py-12 text-center text-xs text-gray-400">Carregando indicadores do grupo...</div>
                  ) : groupStats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                          <span className="text-xs text-gray-500">Produtores Membros</span>
                          <div className="text-xl font-black text-gray-900 mt-0.5">{groupStats.total_farmers}</div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                          <span className="text-xs text-gray-500">Machambas Ativas</span>
                          <div className="text-xl font-black text-gray-900 mt-0.5">{groupStats.total_farms}</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-emerald-900 font-bold">Produção Realizada</span>
                          <span className="font-black text-emerald-800">{groupStats.harvested_production_kg?.toLocaleString()} kg</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Produção Estimada</span>
                          <span>{groupStats.estimated_production_kg?.toLocaleString()} kg</span>
                        </div>
                        <div className="flex justify-between text-xs text-amber-700">
                          <span>Perdas Registadas</span>
                          <span>{groupStats.total_losses_kg?.toLocaleString()} kg ({groupStats.loss_rate_percentage}%)</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Culturas no Grupo</h4>
                        <div className="space-y-2">
                          {groupStats.active_crops?.map((c: any, idx: number) => (
                            <div key={idx} className="flex justify-between p-2.5 rounded-xl bg-gray-50 text-xs">
                              <span className="font-bold text-gray-800">{c.name} ({c.category})</span>
                              <span className="text-gray-500">{c.plantings_count} parcelas</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Group Modal */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <h3 className="text-lg font-black text-gray-900">Novo Grupo de Produtores</h3>
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

                <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nome do Grupo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Pólo Rapale - Zona Norte"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Descrição</label>
                    <textarea
                      rows={2}
                      placeholder="Objetivo do grupo, cultura principal ou características..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Província *</label>
                      <input
                        type="text"
                        required
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Distrito *</label>
                      <input
                        type="text"
                        required
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Localidade / Aldeia</label>
                    <input
                      type="text"
                      placeholder="Ex: Namaita Sede"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
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
                      {submitting ? 'A salvar...' : 'Criar Grupo'}
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
