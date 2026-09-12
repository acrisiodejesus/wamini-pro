'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';

// ─── Types and Interfaces ────────────────────────────────────────────────────
export type SpeechResultEvent = Event & {
  results: SpeechRecognitionResultList;
};

export type SpeechRecognitionConstructor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export type SpeechRecognitionInstance = InstanceType<SpeechRecognitionConstructor>;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export type CommandCallback = (transcript: string) => void;

export interface VoiceCommand {
  pattern: RegExp | string;
  action: CommandCallback;
  description?: string;
  id?: string;
}

interface VoiceContextData {
  isListening: boolean;
  voiceStatus: string;
  toggleListening: () => void;
  registerCommand: (command: VoiceCommand) => () => void;
}

const VoiceContext = createContext<VoiceContextData | undefined>(undefined);

// ─── Provider Component ──────────────────────────────────────────────────────
export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const commandsRef = useRef<VoiceCommand[]>([]);
  const isIntentionalStopRef = useRef(false);
  
  const router = useRouter();

  // Função para registar comandos dinamicamente de qualquer parte da App
  const registerCommand = useCallback((command: VoiceCommand) => {
    // Evitar duplicados se enviarmos ID (por re-render)
    if (command.id) {
        commandsRef.current = commandsRef.current.filter(c => c.id !== command.id);
    }
    commandsRef.current.push(command);
    return () => {
      commandsRef.current = commandsRef.current.filter((c) => c !== command);
    };
  }, []);

  // ── Inicialização Global de Comandos de Navegação Core ──
  useEffect(() => {
    const unregisterMarket = registerCommand({
      id: 'global-market',
      pattern: /ir para mercado|mercado|comprar/i,
      action: () => { setVoiceStatus('A navegar para mercado...'); router.push('/market'); },
      description: 'Navegar para o Mercado',
    });
    const unregisterPrices = registerCommand({
      id: 'global-prices',
      pattern: /ir para preço|preço|preços/i,
      action: () => { setVoiceStatus('A navegar para preços...'); router.push('/prices'); },
      description: 'Navegar para Preços',
    });
    const unregisterSettings = registerCommand({
      id: 'global-settings',
      pattern: /definições|configuração|configurações/i,
      action: () => { setVoiceStatus('A navegar para definições...'); router.push('/settings'); },
      description: 'Aceder Definições',
    });
    const unregisterProfile = registerCommand({
      id: 'global-profile',
      pattern: /meu perfil|ir para perfil/i,
      action: () => { setVoiceStatus('A navegar para perfil...'); router.push('/profile'); },
      description: 'Aceder ao Perfil',
    });
    
    return () => {
      unregisterMarket();
      unregisterPrices();
      unregisterSettings();
      unregisterProfile();
    };
  }, [registerCommand, router]);

  // ── Motor de SpeechRecognition ──
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setVoiceStatus('Browser não suporta voz.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'pt-PT';
    // continuous=true para continuar gravando entre pausas, e não parar.
    recognition.continuous = true; 
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus('A ouvir...');
      isIntentionalStopRef.current = false;
    };

    recognition.onresult = (event: SpeechResultEvent) => {
      // Como estamos em continuous mode, os resultados vão acumulando (0, 1, 2...)
      // Queremos processar o mais recente (o ultimo index do event.results)
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.toLowerCase().trim();
      
      setVoiceStatus(`"${transcript}"`);

      // Match com os comandos registados global e localmente
      let handled = false;
      
      // Itera do comando mais recente (local) para o mais antigo (global) se pretendido,
      // mas vamos varrer sequencialmente. O primeiro a dar match vence.
      for (const cmd of [...commandsRef.current].reverse()) {
        if (typeof cmd.pattern === 'string') {
          if (transcript.includes(cmd.pattern.toLowerCase())) {
            cmd.action(transcript);
            handled = true;
            break;
          }
        } else if (cmd.pattern instanceof RegExp) {
          if (cmd.pattern.test(transcript)) {
            cmd.action(transcript);
            handled = true;
            break;
          }
        }
      }
    };

    recognition.onerror = (event: Event & { error: string }) => {
      if (event.error === 'no-speech') return; // Ignora o erro se houve só silêncio prolongado
      console.warn('SpeechRecognition erro:', event.error);
      if (event.error !== 'aborted') {
         setVoiceStatus(`Erro: ${event.error}`);
         setIsListening(false);
         isIntentionalStopRef.current = true;
      }
    };

    recognition.onend = () => {
      // Reactiva automaticamente se não foi um "Stop" intencional
      if (!isIntentionalStopRef.current) {
        try {
          recognitionRef.current?.start();
        } catch (e) {
          setIsListening(false);
          setVoiceStatus('Parou de escutar inesperadamente.');
        }
      } else {
        setIsListening(false);
      }
    };

    return () => {
      isIntentionalStopRef.current = true;
      recognition.abort(); // cleanup limpo
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      isIntentionalStopRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
      setVoiceStatus('Voz desactivada.');
    } else {
      try {
        isIntentionalStopRef.current = false;
        recognitionRef.current.start();
        setVoiceStatus('A preparar...');
      } catch (err) {
        console.warn('Já em curso ou erro de arranque.', err);
      }
    }
  }, [isListening]);

  return (
    <VoiceContext.Provider value={{ isListening, voiceStatus, toggleListening, registerCommand }}>
      {children}
    </VoiceContext.Provider>
  );
}

// ─── Custom Hook Exposer ─────────────────────────────────────────────────────
export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice deve ser usado dentro de um VoiceProvider.');
  }
  return context;
}
