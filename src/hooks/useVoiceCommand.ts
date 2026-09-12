'use client';

import { useEffect, useId } from 'react';
import { useVoice, type VoiceCommand } from '@/contexts/VoiceContext';

/**
 * Hook para registar comandos de voz locais dentro de componentes.
 * Quando o componente desmonta, o comando é limpo automaticamente.
 * 
 * Exemplo:
 * ```tsx
 * useVoiceCommand({
 *   pattern: /comprar tomate/i,
 *   action: () => addItemToCart('tomate'),
 *   description: 'Adicionar tomate ao carrinho',
 * });
 * ```
 */
export function useVoiceCommand(command: Omit<VoiceCommand, 'id'>) {
  const { registerCommand } = useVoice();
  // Gera um ID único para este registo de forma a não acumular hooks por hot-reload.
  const id = useId();

  useEffect(() => {
    const unregister = registerCommand({ ...command, id });
    return () => {
      unregister();
    };
  }, [registerCommand, command.pattern, command.action, id]); // Depende da mudança de action/pattern
}
