'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import Header from '@/components/layout/Header';
import { syncManager } from '@/lib/offline/syncManager';
import {
  Boxes,
  Plus,
  Search,
  Package,
  ArrowDownRight,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Calendar
} from 'lucide-react';
import clsx from 'clsx';

export default function InputsPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'distributions'>('catalog');
  const [catalog, setCatalog] = useState<any[]>([]);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);

  // Forms State
  const [catalogForm, setCatalogForm] = useState({
    name: '',
    category: 'sementes',
    unit: 'kg',
    description: '',
  });

  const [stockForm, setStockForm] = useState({
    input_id: '',
    batch_number: '',
    quantity_received: '100',
    unit_cost: '50',
    supplier: '',
  });

  const [distributeForm, setDistributeForm] = useState({
    input_id: '',
    inventory_id: '',
    farmer_id: '',
    quantity: '25',
    unit: 'kg',
    purpose: 'Campanha Principal',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchInputsData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, distRes, invRes, farmersRes] = await Promise.all([
        fetch('/api/v1/inputs/catalog'),
        fetch('/api/v1/inputs/distributions'),
        fetch('/api/v1/inputs/inventory'),
        fetch('/api/v1/farmers'),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCatalog(catData);
        if (catData.length > 0) {
          setStockForm(prev => ({ ...prev, input_id: String(catData[0].id) }));
          setDistributeForm(prev => ({ ...prev, input_id: String(catData[0].id) }));
        }
      }
      if (distRes.ok) setDistributions(await distRes.json());
      if (invRes.ok) {
        const invData = await invRes.json();
        setInventory(invData);
        if (invData.length > 0) {
          setDistributeForm(prev => ({ ...prev, inventory_id: String(invData[0].id) }));
        }
      }
      if (farmersRes.ok) {
        const fData = await farmersRes.json();
        setFarmers(fData);
        if (fData.length > 0) {
          setDistributeForm(prev => ({ ...prev, farmer_id: String(fData[0].id) }));
        }
      }
    } catch (e) {
      console.error('Erro ao buscar insumos:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInputsData();
  }, [fetchInputsData]);

  // Handlers
  const handleCreateCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/inputs/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catalogForm),
      });
      if (!res.ok) throw new Error('Erro ao registar item');
      setIsCatalogModalOpen(false);
      fetchInputsData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStockEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/inputs/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...stockForm,
          input_id: Number(stockForm.input_id),
          quantity_received: Number(stockForm.quantity_received),
          unit_cost: Number(stockForm.unit_cost),
        }),
      });
      if (!res.ok) throw new Error('Erro ao registar lote');
      setIsStockModalOpen(false);
      fetchInputsData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    try {
      if (isOffline) {
        syncManager.enqueue('input_distribution', {
          ...distributeForm,
          input_id: Number(distributeForm.input_id),
          farmer_id: Number(distributeForm.farmer_id),
          quantity: Number(distributeForm.quantity),
        });
        setIsDistributeModalOpen(false);
      } else {
        const res = await fetch('/api/v1/inputs/distributions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...distributeForm,
            input_id: Number(distributeForm.input_id),
            inventory_id: distributeForm.inventory_id ? Number(distributeForm.inventory_id) : null,
            farmer_id: Number(distributeForm.farmer_id),
            quantity: Number(distributeForm.quantity),
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Erro ao distribuir insumo');
        }
        setIsDistributeModalOpen(false);
        fetchInputsData();
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                <Boxes className="text-emerald-700" size={28} />
                <span>Gestão de Insumos Agrícolas</span>
              </h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Controle de estoque de sementes, fertilizantes, defensivos e entregas rastreadas aos produtores.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsStockModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
              >
                <Plus size={14} />
                <span>Entrada de Estoque</span>
              </button>
              <button
                onClick={() => setIsDistributeModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold shadow-sm transition-colors"
              >
                <ArrowDownRight size={15} />
                <span>Distribuir a Produtor</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 gap-6 text-sm font-bold">
            <button
              onClick={() => setActiveTab('catalog')}
              className={clsx(
                'pb-3 relative transition-colors',
                activeTab === 'catalog' ? 'text-emerald-700 border-b-2 border-emerald-700' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              Catálogo & Estoque Disponível ({catalog.length})
            </button>
            <button
              onClick={() => setActiveTab('distributions')}
              className={clsx(
                'pb-3 relative transition-colors',
                activeTab === 'distributions' ? 'text-emerald-700 border-b-2 border-emerald-700' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              Histórico de Entregas ({distributions.length})
            </button>
          </div>

          {/* TAB 1: Catálogo & Estoque */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Produtos cadastrados para a organização</span>
                <button
                  onClick={() => setIsCatalogModalOpen(true)}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <Plus size={13} /> Novo Item no Catálogo
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catalog.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-5 hover:border-gray-200 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {item.category}
                        </span>
                        <span className="text-xs text-gray-400">Unidade: {item.unit}</span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900">{item.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {item.description || 'Sem descrição cadastrada.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-emerald-50">
                        <span className="block text-[11px] text-emerald-800 font-medium">Disponível</span>
                        <span className="text-base font-black text-emerald-900">
                          {item.total_stock_available} <span className="text-[10px] font-normal">{item.unit}</span>
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-gray-50">
                        <span className="block text-[11px] text-gray-500 font-medium">Distribuído</span>
                        <span className="text-base font-black text-gray-800">
                          {item.total_distributed} <span className="text-[10px] font-normal">{item.unit}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Distribuições */}
          {activeTab === 'distributions' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
              {distributions.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-400">Nenhuma distribuição registrada até ao momento.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {distributions.map((d) => (
                    <div key={d.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{d.farmer_name}</span>
                          <span className="text-xs text-gray-400">({d.group_name || 'Sem grupo'})</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Insumo: <span className="font-semibold text-gray-800">{d.input_name}</span> • Finalidade: {d.purpose || 'Campanha agrícola'}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Entregue por: {d.distributed_by_name || 'Técnico'} em {d.distribution_date}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-block px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-black text-sm">
                          {d.quantity} {d.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal Novo Item Catálogo */}
          {isCatalogModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h3 className="text-base font-black text-gray-900">Novo Insumo no Catálogo</h3>
                  <button onClick={() => setIsCatalogModalOpen(false)} className="text-gray-400">✕</button>
                </div>

                <form onSubmit={handleCreateCatalogItem} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nome do Insumo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Sementes de Feijão Bóer"
                      value={catalogForm.name}
                      onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Categoria *</label>
                      <select
                        value={catalogForm.category}
                        onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="sementes">Sementes</option>
                        <option value="fertilizantes">Fertilizantes</option>
                        <option value="pesticidas">Pesticidas</option>
                        <option value="ferramentas">Ferramentas</option>
                        <option value="equipamentos">Equipamentos</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Unidade Padrão *</label>
                      <input
                        type="text"
                        required
                        placeholder="kg, litro, saco, un"
                        value={catalogForm.unit}
                        onChange={(e) => setCatalogForm({ ...catalogForm, unit: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Descrição</label>
                    <textarea
                      rows={2}
                      value={catalogForm.description}
                      onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCatalogModalOpen(false)}
                      className="w-1/2 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-1/2 py-2 rounded-xl bg-emerald-700 text-white font-bold"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Entrada de Estoque */}
          {isStockModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h3 className="text-base font-black text-gray-900">Entrada de Estoque / Novo Lote</h3>
                  <button onClick={() => setIsStockModalOpen(false)} className="text-gray-400">✕</button>
                </div>

                <form onSubmit={handleCreateStockEntry} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Item de Insumo *</label>
                    <select
                      required
                      value={stockForm.input_id}
                      onChange={(e) => setStockForm({ ...stockForm, input_id: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {catalog.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Nº do Lote</label>
                      <input
                        type="text"
                        placeholder="Ex: LOTE-2026-01"
                        value={stockForm.batch_number}
                        onChange={(e) => setStockForm({ ...stockForm, batch_number: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Quantidade Recebida *</label>
                      <input
                        type="number"
                        required
                        value={stockForm.quantity_received}
                        onChange={(e) => setStockForm({ ...stockForm, quantity_received: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Custo Unitário (MT)</label>
                      <input
                        type="number"
                        value={stockForm.unit_cost}
                        onChange={(e) => setStockForm({ ...stockForm, unit_cost: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Fornecedor</label>
                      <input
                        type="text"
                        placeholder="Ex: MozAgro"
                        value={stockForm.supplier}
                        onChange={(e) => setStockForm({ ...stockForm, supplier: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsStockModalOpen(false)}
                      className="w-1/2 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-1/2 py-2 rounded-xl bg-emerald-700 text-white font-bold"
                    >
                      Registar Entrada
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Distribuir Insumo a Produtor */}
          {isDistributeModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h3 className="text-base font-black text-gray-900">Distribuir Insumo a Produtor</h3>
                  <button onClick={() => setIsDistributeModalOpen(false)} className="text-gray-400">✕</button>
                </div>

                {formError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleCreateDistribution} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Produtor Beneficiário *</label>
                    <select
                      required
                      value={distributeForm.farmer_id}
                      onChange={(e) => setDistributeForm({ ...distributeForm, farmer_id: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {farmers.map((f) => (
                        <option key={f.id} value={f.id}>{f.name} ({f.group_name})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Insumo *</label>
                    <select
                      required
                      value={distributeForm.input_id}
                      onChange={(e) => setDistributeForm({ ...distributeForm, input_id: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {catalog.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Disponível: {c.total_stock_available} {c.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Quantidade a Entregar *</label>
                      <input
                        type="number"
                        required
                        value={distributeForm.quantity}
                        onChange={(e) => setDistributeForm({ ...distributeForm, quantity: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-800"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Finalidade</label>
                      <input
                        type="text"
                        placeholder="Ex: Campanha Milho"
                        value={distributeForm.purpose}
                        onChange={(e) => setDistributeForm({ ...distributeForm, purpose: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDistributeModalOpen(false)}
                      className="w-1/2 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-1/2 py-2 rounded-xl bg-emerald-700 text-white font-bold"
                    >
                      {submitting ? 'A salvar...' : 'Registar Entrega'}
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
