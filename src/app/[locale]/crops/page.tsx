'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import Header from '@/components/layout/Header';
import {
  Leaf,
  Plus,
  Search,
  CheckCircle2,
  X,
  AlertCircle,
  Wheat,
  Layers,
} from 'lucide-react';
import clsx from 'clsx';

export default function CropsPage() {
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'cereais',
    default_unit: 'kg',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCrops = useCallback(async () => {
    setLoading(true);
    try {
      const q = selectedCategory !== 'todas' ? `?category=${selectedCategory}` : '';
      const res = await fetch(`/api/v1/crops${q}`);
      if (res.ok) {
        setCrops(await res.json());
      }
    } catch (e) {
      console.error('Erro ao buscar culturas:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  const handleCreateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/v1/crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao registar cultura');
      }

      setIsModalOpen(false);
      setFormData({ name: '', category: 'cereais', default_unit: 'kg', description: '' });
      fetchCrops();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { id: 'todas', label: 'Todas' },
    { id: 'cereais', label: 'Cereais' },
    { id: 'leguminosas', label: 'Leguminosas' },
    { id: 'hortícolas', label: 'Hortícolas' },
    { id: 'tubérculos', label: 'Tubérculos' },
    { id: 'frutas', label: 'Frutas' },
    { id: 'outras', label: 'Outras' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0 pb-20 md:pb-10">
        <Header />

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                <Leaf className="text-emerald-700" size={28} />
                <span>Catálogo de Culturas Agrícolas</span>
              </h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Classificação botânica, unidades de medida e dados acumulados de produção.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-colors text-xs md:text-sm font-bold shadow-sm"
            >
              <Plus size={16} />
              <span>Nova Cultura</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex overflow-x-auto gap-2 pb-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0',
                  selectedCategory === c.id
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Crops Grid */}
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Carregando catálogo de culturas...</div>
          ) : crops.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
              <Leaf size={36} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-800">Nenhuma cultura nesta categoria</h3>
              <p className="text-xs text-gray-400 mt-1 mb-4">Adicione uma cultura para associar a machambas e plantios.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold"
              >
                Adicionar Cultura
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {crops.map((crop) => (
                <div
                  key={crop.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-5 hover:border-gray-200 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize">
                        {crop.category}
                      </span>
                      <span className="text-xs text-gray-400">Unidade: {crop.default_unit}</span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900">{crop.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {crop.description || 'Variedade padrão recomendada para a região de Nampula.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-gray-50">
                      <span className="block text-[11px] text-gray-400 font-medium">Parcelas</span>
                      <span className="font-bold text-gray-800">{crop.total_plantings || 0}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50">
                      <span className="block text-[11px] text-emerald-800 font-medium">Colhido Acumulado</span>
                      <span className="font-black text-emerald-900">{Number(crop.total_harvested_kg || 0).toLocaleString()} kg</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal Nova Cultura */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h3 className="text-base font-black text-gray-900">Adicionar Cultura Agrícola</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400">✕</button>
                </div>

                {formError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleCreateCrop} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nome da Cultura *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Gergelim Branco"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Categoria *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="cereais">Cereais</option>
                        <option value="leguminosas">Leguminosas</option>
                        <option value="hortícolas">Hortícolas</option>
                        <option value="tubérculos">Tubérculos</option>
                        <option value="frutas">Frutas</option>
                        <option value="outras">Outras</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Unidade Padrão *</label>
                      <input
                        type="text"
                        required
                        value={formData.default_unit}
                        onChange={(e) => setFormData({ ...formData, default_unit: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Descrição</label>
                    <textarea
                      rows={2}
                      placeholder="Observações agronómicas ou ciclo vegetativo..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="w-1/2 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-1/2 py-2 rounded-xl bg-emerald-700 text-white font-bold"
                    >
                      {submitting ? 'A salvar...' : 'Salvar Cultura'}
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
