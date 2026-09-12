'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import Header from '@/components/layout/Header';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Users,
  CheckCircle2,
  Save,
  AlertCircle
} from 'lucide-react';

export default function OrganizationPage() {
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrg = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/organizations');
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) setOrg(data[0]);
      }
    } catch (e) {
      console.error('Erro ao buscar organização:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/v1/organizations/${org.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(org),
      });
      if (!res.ok) throw new Error('Erro ao salvar organização');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0 pb-20 md:pb-10">
        <Header />

        <main className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
              <Building2 className="text-emerald-700" size={28} />
              <span>Perfil da Organização</span>
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Dados cadastrais da cooperativa, associação ou entidade gestora.
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Carregando dados da organização...</div>
          ) : !org ? (
            <div className="bg-white p-8 rounded-2xl border text-center text-sm text-gray-500">
              Nenhuma organização associada.
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-2xs space-y-6">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200 flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>Organização atualizada com sucesso!</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nome da Entidade *</label>
                  <input
                    type="text"
                    required
                    value={org.name || ''}
                    onChange={(e) => setOrg({ ...org, name: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Tipo de Organização</label>
                    <select
                      value={org.type || 'cooperative'}
                      onChange={(e) => setOrg({ ...org, type: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 capitalize"
                    >
                      <option value="cooperative">Cooperativa</option>
                      <option value="association">Associação</option>
                      <option value="ngo">ONG</option>
                      <option value="agricultural_company">Empresa Agrícola</option>
                      <option value="development_project">Projeto de Desenvolvimento</option>
                      <option value="government_program">Programa Governamental</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">País</label>
                    <input
                      type="text"
                      disabled
                      value={org.country || 'Moçambique'}
                      className="w-full p-2.5 border border-gray-100 bg-gray-50 rounded-xl text-gray-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Província</label>
                    <input
                      type="text"
                      value={org.province || ''}
                      onChange={(e) => setOrg({ ...org, province: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Distrito Sede</label>
                    <input
                      type="text"
                      value={org.district || ''}
                      onChange={(e) => setOrg({ ...org, district: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Telefone de Contato</label>
                    <input
                      type="text"
                      value={org.phone || ''}
                      onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">E-mail Institucional</label>
                    <input
                      type="email"
                      value={org.email || ''}
                      onChange={(e) => setOrg({ ...org, email: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Endereço / Localização Sede</label>
                  <input
                    type="text"
                    value={org.address || ''}
                    onChange={(e) => setOrg({ ...org, address: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Missão e Descrição</label>
                  <textarea
                    rows={3}
                    value={org.description || ''}
                    onChange={(e) => setOrg({ ...org, description: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors disabled:opacity-50"
                  >
                    <Save size={15} />
                    <span>{saving ? 'A salvar...' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
