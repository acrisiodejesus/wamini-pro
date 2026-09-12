'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Type, Eye, Volume2, Mic, X, MicOff } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';

// ─── Constants ───────────────────────────────────────────────────────────────
const FONT_MIN = 12;
const FONT_MAX = 26;
const FONT_STEP = 2;
const FONT_DEFAULT = 16;
const LS_FONT_KEY = 'wamini-font-size';
const LS_CONTRAST_KEY = 'wamini-high-contrast';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitialFontSize(): number {
  if (typeof window === 'undefined') return FONT_DEFAULT;
  const saved = localStorage.getItem(LS_FONT_KEY);
  return saved ? parseInt(saved, 10) : FONT_DEFAULT;
}

function getInitialContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(LS_CONTRAST_KEY) === 'true';
}

function applyFontSize(size: number) {
  document.documentElement.style.fontSize = `${size}px`;
  localStorage.setItem(LS_FONT_KEY, String(size));
}

function applyContrast(on: boolean) {
  document.documentElement.classList.toggle('high-contrast', on);
  localStorage.setItem(LS_CONTRAST_KEY, String(on));
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AccessibilityPanel() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(FONT_DEFAULT);
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  
  const { isListening, voiceStatus, toggleListening } = useVoice();

  // ── Restore persisted settings on mount ──────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const savedSize = getInitialFontSize();
    const savedContrast = getInitialContrast();
    setFontSize(savedSize);
    applyFontSize(savedSize);
    setHighContrast(savedContrast);
    applyContrast(savedContrast);
  }, []);

  // ── High Contrast ────────────────────────────────────────────────────────
  const toggleHighContrast = useCallback(() => {
    setHighContrast((prev) => {
      const next = !prev;
      applyContrast(next);
      return next;
    });
  }, []);

  // ── Font Size ────────────────────────────────────────────────────────────
  const changeFont = useCallback((delta: number) => {
    setFontSize((prev) => {
      const next = Math.min(FONT_MAX, Math.max(FONT_MIN, prev + delta));
      applyFontSize(next);
      return next;
    });
  }, []);

  const resetFont = useCallback(() => {
    setFontSize(FONT_DEFAULT);
    applyFontSize(FONT_DEFAULT);
  }, []);

  // ── Screen Reader ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isScreenReaderActive) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const speakText = (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = 'pt-PT';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    };

    const getElementText = (target: HTMLElement): string => {
      const ariaLabel = target.getAttribute('aria-label');
      if (ariaLabel) return ariaLabel;

      const labelledBy = target.getAttribute('aria-labelledby');
      if (labelledBy) {
        const labelEl = document.getElementById(labelledBy);
        if (labelEl?.textContent) return labelEl.textContent;
      }

      if (target.id) {
        const label = document.querySelector(`label[for="${target.id}"]`);
        if (label?.textContent) return label.textContent;
      }

      if (target instanceof HTMLInputElement && target.placeholder)
        return target.placeholder;

      if (target instanceof HTMLSelectElement)
        return target.options[target.selectedIndex]?.text || '';

      if (target instanceof HTMLImageElement && target.alt)
        return target.alt;

      const clone = target.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('button, a, input, select, textarea').forEach(el => el.remove());
      return clone.textContent || '';
    };

    const isAriaHidden = (el: HTMLElement): boolean => {
      let node: HTMLElement | null = el;
      while (node) {
        if (node.getAttribute('aria-hidden') === 'true') return true;
        node = node.parentElement;
      }
      return false;
    };

    const isReadable = (target: HTMLElement): boolean => {
      if (isAriaHidden(target)) return false;
      const role = target.getAttribute('role');
      if (role === 'presentation' || role === 'none') return false;
      return true;
    };

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target || !isReadable(target)) return;
      const text = getElementText(target);
      if (text.trim()) speakText(text);
    };

    const handleClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      while (target && target !== document.body) {
        if (!isAriaHidden(target)) {
          const text = getElementText(target);
          if (text.trim()) {
            speakText(text);
            return;
          }
        }
        target = target.parentElement;
      }
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('click', handleClick);
      window.speechSynthesis.cancel();
    };
  }, [isScreenReaderActive]);

  const toggleScreenReader = useCallback(() => {
    setIsScreenReaderActive((prev) => {
      const next = !prev;
      if (!next && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  }, []);

  // ── Voice Commands (SpeechRecognition) Registados ────────────────────────
  useVoiceCommand({
    pattern: /contraste/i,
    action: () => toggleHighContrast(),
    description: 'Alternar alto contraste',
  });
  useVoiceCommand({
    pattern: /fonte maior|aumentar fonte/i,
    action: () => changeFont(FONT_STEP),
    description: 'Aumentar a fonte',
  });
  useVoiceCommand({
    pattern: /fonte menor|diminuir fonte/i,
    action: () => changeFont(-FONT_STEP),
    description: 'Diminuir a fonte',
  });
  useVoiceCommand({
    pattern: /leitor de ecrã|leitor/i,
    action: () => toggleScreenReader(),
    description: 'Alternar leitor de ecrã',
  });
  useVoiceCommand({
    pattern: /fechar painel|fechar/i,
    action: () => setIsOpen(false),
    description: 'Fechar Acessibilidade',
  });

  if (!mounted) return null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="gradient-wamini text-black p-4 rounded-full shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 animate-pulse-wamini"
        aria-label="Opções de acessibilidade"
        aria-expanded={isOpen}
      >
        <Eye size={26} />
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Painel de acessibilidade"
          className="absolute bottom-20 right-0 bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 w-80 space-y-5 animate-fade-in-up"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xl text-gray-900">Acessibilidade</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Fechar painel"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* ── High Contrast ── */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3 font-medium text-gray-700">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Eye size={20} className="text-gray-600" />
              </div>
              Alto Contraste
            </span>
            <button
              onClick={toggleHighContrast}
              aria-pressed={highContrast}
              aria-label="Alternar alto contraste"
              className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-yellow-400 ${
                highContrast ? 'gradient-wamini' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  highContrast ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* ── Font Size ── */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3 font-medium text-gray-700">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Type size={20} className="text-gray-600" />
              </div>
              <span>
                Fonte
                <span className="ml-1 text-xs text-gray-400 font-normal">({fontSize}px)</span>
              </span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => changeFont(-FONT_STEP)}
                disabled={fontSize <= FONT_MIN}
                aria-label="Diminuir tamanho da fonte"
                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-40 transition-colors text-sm"
              >
                A−
              </button>
              <button
                onClick={resetFont}
                aria-label="Repor tamanho da fonte"
                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-xs font-bold"
                title="Repor"
              >
                ↺
              </button>
              <button
                onClick={() => changeFont(FONT_STEP)}
                disabled={fontSize >= FONT_MAX}
                aria-label="Aumentar tamanho da fonte"
                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-40 transition-colors text-sm"
              >
                A+
              </button>
            </div>
          </div>

          {/* ── Screen Reader ── */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3 font-medium text-gray-700">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Volume2 size={20} className="text-gray-600" />
              </div>
              Leitor de Tela
            </span>
            <button
              onClick={toggleScreenReader}
              aria-pressed={isScreenReaderActive}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                isScreenReaderActive
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {isScreenReaderActive ? 'Desativar' : 'Ativar'}
            </button>
          </div>

          {/* ── Voice Command ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-3 font-medium text-gray-700">
                <div className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-100' : 'bg-gray-100'}`}>
                  {isListening
                    ? <MicOff size={20} className="text-red-500" />
                    : <Mic size={20} className="text-gray-600" />
                  }
                </div>
                Comando
              </span>
              <button
                onClick={toggleListening}
                aria-pressed={isListening}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                  isListening
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                {isListening ? 'Parar' : 'Ativar'}
              </button>
            </div>

            {/* Voice feedback */}
            {voiceStatus && (
              <p className="text-xs text-center text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 animate-pulse">
                {voiceStatus}
              </p>
            )}

            {/* Voice commands hint */}
            {isListening && (
              <div className="text-xs text-gray-400 space-y-0.5 px-1 pt-1">
                <p>Navegue dizendo: <strong className="text-gray-600">"ir para mercado"</strong>, <strong className="text-gray-600">"definições"</strong>, <strong className="text-gray-600">"meu perfil"</strong>...</p>
                <p>Ou comandos locais: <strong className="text-gray-600">"contraste"</strong>, <strong className="text-gray-600">"fonte maior"</strong>...</p>
              </div>
            )}
          </div>

          {/* Divider + screen reader note */}
          {isScreenReaderActive && (
            <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 border border-green-100">
              ✓ Leitor activo — foque num elemento para ouvir.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
