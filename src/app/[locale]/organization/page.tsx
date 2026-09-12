'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import Header from '@/components/layout/Header';
import apiClient from '@/lib/api/client';
import { DISTRICTS } from '@/constants/districts';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Save,
  AlertCircle,
  Plus,
  Loader2,
  X,
  Sparkles
} from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  description?: string;
  type: string;
  province: string;
  district: string;
  address?: string;
  phone?: string;
  email?: string;
  status: string;
  created_at?: string;
}

const ORG_TYPES = [
  { value: 'cooperative', label: 'Cooperativa Agrícola' },
  { value: 'association', label: 'Associação de Produtores' },
  { value: 'agricultural_company', label: 'Empresa Agrícola' },
  { value: 'ngo', label: 'ONG / Organização de Apoio' },
  { value: 'development_project', label: 'Projeto de Desenvolvimento' },
  { value: 'government_program', label: 'Programa Governamental' },
];

export default function OrganizationPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Formulário de nova organização
  const [newOrg, setNewOrg] = useState({
    name: '',
    type: 'cooperative',
    province: 'Nampula',
    district: 'Monapo',
    address: '',
    phone: '',
    email: '',
    description: '',
  });

  // Formulário de edição da organização selecionada
  const [editForm, setEditForm] = useState<Partial<Organization>>({});

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await apiClient.get<Organization[]>('/organizations');
      const data = response.data || [];
      setOrganizations(data);

      if (data.length > 0) {
        // Se ainda não selecionou ou o selecionado não existe na lista, seleciona o primeiro
        const exists = data.find((o) => o.id === selectedOrgId);
        const active = exists || data[0];
        setSelectedOrgId(active.id);
        setEditForm(active);
      } else {
        setSelectedOrgId(null);
        setEditForm({});
      }
    } catch (err: any) {
      console.error('Erro ao buscar organizações:', err);
      const msg = err.response?.data?.error || err.message || 'Não foi possível carregar as organizações.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleSelectOrg = (orgId: number) => {
    setSelectedOrgId(orgId);
    const found = organizations.find((o) => o.id === orgId);
    if (found) {
      setEditForm(found);
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await apiClient.put(`/organizations/${selectedOrgId}`, editForm);
      setSuccessMsg('Dados da organização guardados com sucesso!');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchOrganizations();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Erro ao guardar dados da organização.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setModalError(null);

    try {
      const response = await apiClient.post<{ message: string; organization_id: number; organization: Organization }>(
        '/organizations',
        newOrg
      );

      const createdOrg = response.data.organization;
      setShowModal(false);
      setNewOrg({
        name: '',
        type: 'cooperative',
        province: 'Nampula',
        district: 'Monapo',
        address: '',
        phone: '',
        email: '',
        description: '',
      });

      setSuccessMsg('Nova organização adicionada com sucesso!');
      setTimeout(() => setSuccessMsg(null), 4000);

      // Recarrega e seleciona a nova organização
      if (createdOrg?.id) {
        setSelectedOrgId(createdOrg.id);
        setEditForm(createdOrg);
      }
      fetchOrganizations();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Erro ao criar organização. Verifique os dados.';
      setModalError(msg);
    } finally {
      setCreating(false);
    }
  };

  const currentOrg = organizations.find((o) => o.id === selectedOrgId);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0 pb-20 md:pb-10">
        <Header />

        <main className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
          {/* Cabeçalho superior com botão de ação */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                <Building2 className="text-emerald-700" size={28} />
                <span>Gestão da Organização</span>
              </h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Registo e configuração de cooperativas, associações e entidades agrícolas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setModalError(null);
                setShowModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs shadow-sm transition-all shrink-0"
            >
              <Plus size={16} />
              <span>Adicionar Organização</span>
            </button>
          </div>

          {/* Notificações no ecrã principal */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-800 text-xs border border-rose-200 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="p-16 text-center text-gray-400 text-sm flex flex-col items-center justify-center gap-3">
              <Loader2 size={24} className="animate-spin text-emerald-600" />
              <span>A carregar organizações...</span>
            </div>
          ) : organizations.length === 0 ? (
            /* Estado quando não há nenhuma organização registada */
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-xs text-center space-y-4 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <Sparkles size={28} />
              </div>
              <h2 className="text-xl font-black text-gray-900">Ainda não tem uma organização registada</h2>
              <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
                Adicione a sua cooperativa ou associação de produtores para começar a registar grupos de agricultores,
                machambas, campanhas de sementeira e distribuição de insumos.
              </p>
              <button
                type="button"
                onClick={() => {
                  setModalError(null);
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Plus size={16} />
                <span>Adicionar Primeira Organização</span>
              </button>
            </div>
          ) : (
            /* Formulário da Organização Selecionada */
            <div className="space-y-4">
              {/* Seletor de organização se houver mais de uma */}
              {organizations.length > 1 && (
                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                  <label className="text-xs font-bold text-gray-700 shrink-0">Organização Ativa:</label>
                  <select
                    value={selectedOrgId || ''}
                    onChange={(e) => handleSelectOrg(Number(e.target.value))}
                    className="flex-1 p-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {organizations.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.district}, {o.province})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-lg font-black text-gray-900">{currentOrg?.name}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {currentOrg?.province}, {currentOrg?.district}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs capitalize border border-emerald-200">
                    {ORG_TYPES.find((t) => t.value === currentOrg?.type)?.label || currentOrg?.type}
                  </span>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nome da Entidade *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Tipo de Organização</label>
                      <select
                        value={editForm.type || 'cooperative'}
                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                        className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900"
                      >
                        {ORG_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">País</label>
                      <input
                        type="text"
                        disabled
                        value="Moçambique"
                        className="w-full p-3 border border-gray-100 bg-gray-50 rounded-xl text-gray-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Província</label>
                      <input
                        type="text"
                        value={editForm.province || ''}
                        onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                        className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Distrito Sede</label>
                      <select
                        value={editForm.district || ''}
                        onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                        className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900"
                      >
                        <option value="">Selecione o distrito</option>
                        {DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Telefone de Contacto</label>
                      <input
                        type="tel"
                        value={editForm.phone || ''}
                        placeholder="Ex: 84 123 4567"
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">E-mail Institucional</label>
                      <input
                        type="email"
                        value={editForm.email || ''}
                        placeholder="contacto@cooperativa.co.mz"
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Endereço da Sede</label>
                    <input
                      type="text"
                      value={editForm.address || ''}
                      placeholder="Ex: Estrada Principal, Localidade de Netia"
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Missão e Descrição da Entidade</label>
                    <textarea
                      rows={3}
                      value={editForm.description || ''}
                      placeholder="Descreva as principais culturas apoiadas, objetivos e número estimado de membros."
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900 leading-relaxed"
                    />
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold transition-colors disabled:opacity-50 text-xs shadow-xs"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>A guardar...</span>
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          <span>Guardar Alterações</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── MODAL: ADICIONAR NOVA ORGANIZAÇÃO ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative my-8 border border-gray-100">
            {/* Fechar modal */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                <Building2 size={22} />
              </div>
              <h3 className="text-xl font-black text-gray-900">Adicionar Nova Organização</h3>
              <p className="text-xs text-gray-500 mt-1">
                Preencha os dados da cooperativa ou associação para começar a gestão comunitária.
              </p>
            </div>

            {modalError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200 flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <span className="font-medium">{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Nome da Organização *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cooperativa dos Agricultores de Monapo"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tipo de Organização *</label>
                  <select
                    value={newOrg.type}
                    onChange={(e) => setNewOrg({ ...newOrg, type: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900"
                  >
                    {ORG_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Província *</label>
                  <input
                    type="text"
                    required
                    value={newOrg.province}
                    onChange={(e) => setNewOrg({ ...newOrg, province: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Distrito Sede *</label>
                  <select
                    required
                    value={newOrg.district}
                    onChange={(e) => setNewOrg({ ...newOrg, district: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Telefone de Contacto</label>
                  <input
                    type="tel"
                    placeholder="Ex: 84 123 4567"
                    value={newOrg.phone}
                    onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Endereço da Sede</label>
                <input
                  type="text"
                  placeholder="Ex: Rua do Comércio, Sede do Distrito"
                  value={newOrg.address}
                  onChange={(e) => setNewOrg({ ...newOrg, address: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Descrição e Missão</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Apoio a 150 famílias produtoras de milho, feijão e gergelim."
                  value={newOrg.description}
                  onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors disabled:opacity-50 shadow-xs"
                >
                  {creating ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>A criar organização...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Confirmar e Criar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MobileNav />
    </div>
  );
}
