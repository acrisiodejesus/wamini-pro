'use client';

import React, { useState } from 'react';
import { Phone, Delete, Send, RotateCcw, Smartphone } from 'lucide-react';
import apiClient from '@/lib/api/client';

export default function USSDSimPage() {
  const [displayText, setDisplayText] = useState('Insira o código\ne clique em Ligar\n(Ex: *123#)');
  const [inputBuffer, setInputBuffer] = useState('');
  const [sessionTrail, setSessionTrail] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('841234567');
  const [loading, setLoading] = useState(false);

  const handleKeyClick = (key: string) => {
    if (loading) return;
    setInputBuffer(prev => prev + key);
  };

  const handleClear = () => {
    setInputBuffer('');
  };

  const handleAction = async () => {
    if (loading) return;

    // Start session if not active and input is *123#
    if (!isSessionActive) {
      if (inputBuffer === '*123#') {
        await sendUSSD('');
      } else {
        setDisplayText('Código inválido.\nTente *123#');
        setInputBuffer('');
      }
      return;
    }

    // Continue session
    if (inputBuffer.trim()) {
      const nextTrail = sessionTrail ? `${sessionTrail}*${inputBuffer}` : inputBuffer;
      await sendUSSD(nextTrail);
    }
  };

  const sendUSSD = async (text: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/ussd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'sim-' + Date.now(),
          phoneNumber: phoneNumber,
          text: text
        })
      });

      const result = await response.text();

      if (result.startsWith('END')) {
        setDisplayText(result.replace('END ', ''));
        setIsSessionActive(false);
        setSessionTrail('');
      } else {
        setDisplayText(result.replace('CON ', ''));
        setIsSessionActive(true);
        setSessionTrail(text);
      }
      setInputBuffer('');
    } catch (err) {
      setDisplayText('Erro de conexão.\nTente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setIsSessionActive(false);
    setSessionTrail('');
    setDisplayText('Insira o código\ne clique em Ligar\n(Ex: *123#)');
    setInputBuffer('');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-white mb-2">Simulador USSD</h1>
        <p className="text-gray-400">Teste o acesso de baixa largura de banda do Wamini</p>
      </div>

      {/* Retro Phone Frame */}
      <div className="relative bg-gray-800 p-6 rounded-[3rem] border-8 border-gray-700 shadow-2xl w-full max-w-[320px]">
        {/* Speaker */}
        <div className="w-12 h-1 bg-gray-700 mx-auto mb-6 rounded-full"></div>

        {/* Screen */}
        <div className="bg-[#9db08c] aspect-[4/3] rounded-lg border-4 border-gray-900 p-4 mb-6 shadow-inner font-mono text-gray-900 flex flex-col justify-between overflow-hidden">
          <div className="whitespace-pre-wrap text-sm leading-tight uppercase font-bold">
            {displayText}
          </div>
          <div className="text-right border-t border-gray-800 pt-2 h-6 overflow-hidden">
            {inputBuffer}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(key => (
            <button
              key={key}
              onClick={() => handleKeyClick(key)}
              className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
            >
              {key}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={reset}
            className="bg-red-900/50 hover:bg-red-800 text-red-100 p-3 rounded-xl flex items-center justify-center shadow-lg"
            title="Reset"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={handleAction}
            disabled={loading}
            className={`col-span-1 bg-green-600 hover:bg-green-500 text-white p-3 rounded-xl flex items-center justify-center shadow-lg ${loading ? 'opacity-50 animate-pulse' : ''}`}
          >
            <Phone size={20} />
          </button>
          <button
            onClick={handleClear}
            className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-xl flex items-center justify-center shadow-lg"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>

    </div>
  );
}
