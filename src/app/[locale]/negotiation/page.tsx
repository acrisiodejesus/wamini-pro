'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ArrowLeft, Loader2, MessageSquare, Paperclip, File, Star } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { Link } from '@/i18n/routing';
import { Settings } from 'lucide-react';
import clsx from 'clsx';
import apiClient from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import NotificationsDropdown from '@/components/features/NotificationsDropdown';
import { useSearchParams } from 'next/navigation';
import ReviewModal from '@/components/features/ReviewModal';
import { useNegotiations, useMessages, useSendMessage } from '@/hooks/useNegotiations';


import type { Negotiation, Message } from '@/lib/api/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getItemName(neg: Negotiation) {
  return neg.product_name || neg.input_name || neg.transport_name || 'Negociação';
}

function getOtherUserInitial(name: string | null | undefined) {
  return (name || '?').charAt(0).toUpperCase();
}

function formatTime(ts: string | undefined) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, currentUserId }: { msg: Message; currentUserId: number }) {
  const isMe = msg.sender_id === currentUserId;
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={clsx(
          'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
          isMe
            ? 'rounded-br-sm text-black'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        )}
        style={isMe ? { background: 'linear-gradient(135deg, #D8FF12 0%, #FBB03B 100%)' } : {}}
      >
        {!isMe && (
          <p className="text-xs font-bold mb-1 text-gray-500">{msg.sender_name}</p>
        )}
        {msg.attachment_url && (
          <div className="mb-2 mt-1">
            {msg.attachment_type === 'image' ? (
              <img src={msg.attachment_url} alt="Anexo" className="rounded-xl max-h-48 object-cover" />
            ) : msg.attachment_type === 'video' ? (
              <video src={msg.attachment_url} controls className="rounded-xl max-h-48 object-cover" />
            ) : (
              <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline text-xs">
                <File size={16} /> Ficheiro Em Anexo
              </a>
            )}
          </div>
        )}
        {msg.body && <p className="leading-relaxed">{msg.body}</p>}
        <p className={clsx('text-xs mt-1', isMe ? 'text-black/50 text-right' : 'text-gray-400 text-right')}>
          {formatTime(msg.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────
function ChatPanel({
  negotiation,
  currentUserId,
  onBack,
}: {
  negotiation: Negotiation;
  currentUserId: number;
  onBack: () => void;
}) {
  const { messages, isLoading: loadingMsgs } = useMessages(negotiation.id);
  const { mutateAsync: sendMessage } = useSendMessage(negotiation.id);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canReview = negotiation.other_user_id && negotiation.other_user_id !== currentUserId;

  useEffect(() => {
    inputRef.current?.focus();
  }, [negotiation.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const body = text.trim();
    if (!body && !sending) return;
    if (sending) return;
    setSending(true);
    setText('');

    try {
      await sendMessage({ body });
    } catch {
      setText(body);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await apiClient.post<{ url: string; type: string }>('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await sendMessage({
        body: text.trim() || undefined,
        attachment_url: uploadRes.data.url,
        attachment_type: uploadRes.data.type
      });
      
      setText('');
    } catch (err) {
      alert('Erro ao enviar ficheiro. Pode exceder o tamanho máximo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherName = negotiation.other_user_name || 'Utilizador';
  const itemName = getItemName(negotiation);

  return (
    <>
    <div className="md:col-span-2 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden h-[calc(100vh-140px)] md:h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Voltar à lista"
        >
          <ArrowLeft size={20} />
        </button>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #D8FF12 0%, #FBB03B 100%)' }}
        >
          {getOtherUserInitial(negotiation.other_user_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-900 truncate">{otherName}</p>
          <p className="text-xs text-gray-500 truncate">{itemName}</p>
        </div>
        {canReview && (
          <button
            onClick={() => setShowReviewModal(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-black hover:scale-105 transition-transform"
            style={{ background: 'linear-gradient(135deg, #D8FF12 0%, #FBB03B 100%)' }}
            aria-label={`Avaliar ${otherName}`}
          >
            <Star size={13} />
            Avaliar
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loadingMsgs ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 size={32} className="animate-spin text-yellow-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare size={40} className="mb-2 opacity-40" />
            <p className="text-sm">Nenhuma mensagem ainda</p>
            <p className="text-xs mt-1">Envia a primeira mensagem!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} currentUserId={currentUserId} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-2 items-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload}
            accept="image/*,video/*"
          />
          <button 
            type="button"
            className="p-3 text-gray-400 hover:text-gray-700 bg-gray-50 rounded-full transition-colors flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>

          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreve uma mensagem…"
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-yellow-400 focus:bg-white transition-all"
            disabled={sending || uploading}
          />
          <button
            onClick={handleSend}
            disabled={(!text.trim() && !uploading) || sending}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #D8FF12 0%, #FBB03B 100%)' }}
            aria-label="Enviar mensagem"
          >
            {sending ? (
              <Loader2 size={18} className="animate-spin text-black" />
            ) : (
              <Send size={18} className="text-black" />
            )}
          </button>
        </div>
      </div>
    </div>

    {canReview && negotiation.other_user_id && (
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        targetUser={{ id: negotiation.other_user_id, name: otherName }}
        negotiationId={negotiation.id}
      />
    )}
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyChat() {
  return (
    <div className="md:col-span-2 bg-white rounded-2xl shadow-sm flex-col items-center justify-center hidden md:flex h-[600px]">
      <MessageSquare size={48} className="text-gray-200 mb-4" />
      <p className="text-gray-400 font-medium">Selecciona uma conversa</p>
      <p className="text-gray-300 text-sm mt-1">Escolhe à esquerda para ver as mensagens</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export const dynamic = 'force-dynamic';

export default function NegotiationPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chat');

  const { negotiations, isLoading: loading } = useNegotiations();
  const [selected, setSelected] = useState<Negotiation | null>(null);
  const [search, setSearch] = useState('');

  // Select logic on load
  useEffect(() => {
    if (loading || negotiations.length === 0) return;

    if (!selected) {
      if (chatId) {
        const target = negotiations.find(n => n.id.toString() === chatId);
        if (target) {
          setSelected(target);
          return;
        }
      }

      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setSelected(negotiations[0]);
      }
    }
  }, [loading, negotiations, chatId, selected]);

  const filtered = negotiations.filter((n) => {
    const name = (n.other_user_name || '').toLowerCase();
    const item = getItemName(n).toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || item.includes(q);
  });

  // Use o ID gerido pelo authStore (que é persistido em client)
  const currentUserId: number = user?.id ? Number(user.id) : 0;

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64 pb-20">
        <header className="bg-white p-4 md:p-6 flex justify-between items-center md:shadow-sm sticky top-0 z-10">
          <h1 className="text-2xl md:text-3xl font-black logo-wamini">Wamini</h1>
          <div className="flex gap-3">
            <NotificationsDropdown />
            <LanguageSwitcher />
            <Link href="/settings" className="p-2 rounded-full hover:bg-gray-100">
              <Settings size={24} />
            </Link>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <div className="grid md:grid-cols-3 gap-6">

            {/* ── Conversation list ── */}
            <div
              className={clsx(
                'md:col-span-1 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] md:h-[600px]',
                selected ? 'hidden md:flex' : 'flex'
              )}
            >
              {/* Search */}
              <div className="p-3 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="Procurar negociações…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-yellow-400"
                />
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 size={28} className="animate-spin text-yellow-500" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma negociação ainda</p>
                    <p className="text-xs mt-1">Contacta um vendedor no mercado!</p>
                  </div>
                ) : (
                  filtered.map((neg) => (
                    <button
                      key={neg.id}
                      onClick={() => setSelected(neg)}
                      className={clsx(
                        'w-full p-4 text-left hover:bg-gray-50 transition-colors',
                        selected?.id === neg.id && 'bg-yellow-50 border-l-4 border-yellow-400'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #D8FF12 0%, #FBB03B 100%)' }}
                        >
                          {getOtherUserInitial(neg.other_user_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {neg.other_user_name || 'Utilizador'}
                          </p>
                          <p className="text-xs text-yellow-600 font-medium truncate mb-0.5">
                            {getItemName(neg)}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {neg.last_message || 'Iniciar conversa…'}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                          {formatTime(neg.last_timestamp)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ── Chat panel ── */}
            {selected ? (
              <ChatPanel
                key={selected.id}
                negotiation={selected}
                currentUserId={currentUserId}
                onBack={() => setSelected(null)}
              />
            ) : (
              <EmptyChat />
            )}

          </div>
        </main>
      </div>
      <MobileNav />
    </>
  );
}
