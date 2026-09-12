'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { Settings, MapPin, Edit2, Crown, CheckCircle2, ShieldCheck, Camera, Loader2, Save } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import NotificationsDropdown from '@/components/features/NotificationsDropdown';
import apiClient, { setStoredUser } from '@/lib/api/client';
import { User } from '@/lib/api/types';

const PLANS = [
  { id: 'basic', name: 'Plano Básico', price: '150 MT / ano', monthly: '20 MT / mês', color: 'border-green-400 bg-green-50 text-green-900', btn: 'bg-green-600', icon: ShieldCheck, features: ['Desbloqueia inicio de negociações', 'Acesso aos contactos telefónicos de utilizadores'] },
  { id: 'plus', name: 'Plano Plus', price: '500 MT / ano', monthly: '50 MT / mês', color: 'border-blue-400 bg-blue-50 text-blue-900', btn: 'bg-blue-600', icon: CheckCircle2, features: ['Tudo do Básico', 'Destaque Bronze nos anúncios', 'Alertas SMS sobre Preços de Mercado'] },
  { id: 'premium', name: 'Plano Premium', price: '1000 MT / ano', monthly: '100 MT / mês', color: 'border-yellow-400 bg-yellow-50 text-yellow-900', btn: 'bg-yellow-600', icon: Crown, features: ['Tudo do Plus', 'Destaque Dourado absoluto ⭐️', 'Relatórios Oficiais Agrícolas Mapeados'] },
];

export default function ProfilePage() {
  const t = useTranslations('Common');
  const { user: authUser, updateUser } = useAuthStore();
  
  const [profile, setProfile] = useState<User | null>(authUser as unknown as User);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', localization: '', photoUrl: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);

  useEffect(() => {
    // Fetch latest profile state to get subscriptions
    apiClient.get('/users/profile').then(res => {
      setProfile(res.data);
      setEditForm({ name: res.data.name || '', localization: res.data.localization || '', photoUrl: res.data.photo || '' });
    }).catch(console.error);
  }, []);

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      setEditForm(prev => ({ ...prev, photoUrl: res.data.url }));
    } catch (err) {
      alert('Erro ao carregar a foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await apiClient.put('/users/profile', {
        name: editForm.name,
        localization: editForm.localization,
        photo: editForm.photoUrl
      });
      setProfile(res.data);
      // Actualiza o store do context principal para fotos no navbar se existirem
      if (authUser) updateUser(res.data); 
      setStoredUser(res.data); // Actualiza o estado do useAuth
      setIsEditing(false);
      alert('Perfil actualizado!');
    } catch {
      alert('Erro ao actualizar os dados.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!confirm(`Desejas simular a subscrição do plano ${planId.toUpperCase()} agora?`)) return;
    setIsSubscribing(planId);
    try {
      const res = await apiClient.post('/users/subscribe', { plan: planId });
      setProfile(res.data.user);
      updateUser(res.data.user); // Actualiza o Zustand
      setStoredUser(res.data.user); // Actualiza o localStorage para useAuth
      alert(res.data.message);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao assinar.');
    } finally {
      setIsSubscribing(null);
    }
  };

  const isSubActive = profile?.subscription_status === 'active' && profile?.subscription_plan !== 'free';

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64 pb-20">
        <header className="bg-white p-4 md:p-6 flex justify-between items-center shadow-sm sticky top-0 z-10">
          <h1 className="text-2xl md:text-3xl font-black logo-wamini">Wamini</h1>
          <div className="flex gap-3">
            <NotificationsDropdown />
            <LanguageSwitcher />
            <Link href="/settings" className="p-2 rounded-full hover:bg-gray-100">
              <Settings size={24} />
            </Link>
          </div>
        </header>

        <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
          {/* Header de Perfil com Edição */}
          <div className="bg-white rounded-3xl shadow-sm p-6 relative">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)} 
                className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1 text-sm font-medium"
              >
                <Edit2 size={16} /> Editar
              </button>
            ) : (
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setIsEditing(false)} className="text-gray-500 font-bold hover:underline text-sm px-2">Cancelar</button>
                <button onClick={handleSaveProfile} disabled={isSaving} className="bg-black text-white font-bold rounded-lg px-4 py-1.5 flex items-center gap-2 text-sm hover:bg-gray-800 transition">
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
                </button>
              </div>
            )}

            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold text-black border-4 border-white shadow-sm overflow-hidden" style={{
                background: profile?.photo ? 'transparent' : 'linear-gradient(135deg, #D8FF12 0%, #FBB03B 100%)'
              }}>
                {(isEditing ? editForm.photoUrl : profile?.photo) ? (
                  <img src={isEditing ? editForm.photoUrl : profile?.photo} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0) || 'U'
                )}
                
                {isEditing && (
                  <label className="absolute inset-0 bg-black/40 cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    {isUploading ? <Loader2 className="animate-spin text-white" /> : <Camera size={28} className="text-white" />}
                    <input type="file" accept="image/*" onChange={handleUploadPhoto} className="hidden" disabled={isUploading} />
                  </label>
                )}
              </div>
              
              <div className="text-center md:text-left flex-1 w-full max-w-sm">
                {isEditing ? (
                  <div className="space-y-3">
                    <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full font-bold text-xl px-3 py-2 border rounded-lg" placeholder="Teu Nome" />
                    <input type="text" value={editForm.localization} onChange={e => setEditForm({ ...editForm, localization: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Tua Localização (ex: Nampula)" />
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2">
                      {profile?.name || 'Usuário'}
                      {isSubActive && <span title="Assinante Activo"><Crown size={18} className="text-yellow-500 fill-yellow-500" /></span>}
                    </h2>
                    <p className="text-gray-500 flex items-center justify-center md:justify-start gap-1 mt-1">
                      <MapPin size={16} /> {profile?.localization || 'Sem localização'}
                    </p>
                    <p className="text-sm font-medium mt-1 text-gray-500">{profile?.mobile_number}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* O Meu Plano */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className={isSubActive ? 'text-green-600' : 'text-gray-400'} />
              <h3 className="text-xl font-bold">A minha Assinatura</h3>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="font-semibold text-gray-800">
                  Estado Actual: <span className={isSubActive ? 'text-green-600 font-bold uppercase' : 'text-gray-500 uppercase'}>
                    {isSubActive ? `ACTIVO (${profile?.subscription_plan})` : 'INACTIVO / GRÁTIS'}
                  </span>
                </p>
                {isSubActive && profile?.subscription_expiry && (
                  <p className="text-sm text-gray-500 mt-1">
                    Válido até: {new Date(profile.subscription_expiry).toLocaleDateString('pt-PT')}
                  </p>
                )}
                {!isSubActive && (
                  <p className="text-sm text-orange-600 mt-1 font-medium">A tua conta actual impede-te de Iniciar Negociações e Ver Contactos! Assina um plano para desbloqueares.</p>
                )}
              </div>
            </div>
            
            {/* Tiers */}
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              {PLANS.map(plan => {
                const Icon = plan.icon;
                const isCurrent = profile?.subscription_plan === plan.id && profile?.subscription_status === 'active';
                
                return (
                  <div key={plan.id} className={`border-2 rounded-2xl p-5 flex flex-col relative transition-transform hover:-translate-y-1 ${plan.color} ${isCurrent ? 'ring-4 ring-black/10' : ''}`}>
                    {isCurrent && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">O Teu Plano</span>}
                    
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-black uppercase tracking-tight">{plan.name}</h4>
                      <Icon size={24} className="opacity-80" />
                    </div>
                    <div className="mb-4">
                      <p className="text-2xl font-black leading-none">{plan.price.split(' ')[0]} <span className="text-sm font-bold opacity-60">MT /ano</span></p>
                      <p className="text-sm font-bold opacity-70 mt-1">Ou {plan.monthly}</p>
                    </div>
                    
                    <ul className="text-sm space-y-2 mb-6 flex-1 text-black/80 font-medium">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex gap-2 leading-tight">
                          • {feat}
                        </li>
                      ))}
                    </ul>
                    
                    <button 
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isSubscribing === plan.id || isCurrent}
                      className={`w-full py-2.5 rounded-xl text-white font-bold text-sm flex justify-center items-center gap-2 transition-all ${isCurrent ? 'bg-black opacity-30 cursor-not-allowed' : plan.btn + ' hover:opacity-90 shadow-md'}`}
                    >
                      {isSubscribing === plan.id ? <Loader2 size={16} className="animate-spin" /> : isCurrent ? 'PLANO ACTIVO' : 'ASSINAR AGORA'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <MobileNav />
    </>
  );
}
