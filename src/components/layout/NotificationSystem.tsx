'use client';

import { useEffect, useRef, useCallback } from 'react';
import apiClient from '@/lib/api/client';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuth } from '@/hooks/useAuth';

function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // Up to A6

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.error('Audio falhou', e);
  }
}

export default function NotificationSystem() {
  const { user } = useAuth();
  const { total, setNotifications } = useNotificationStore();
  const prevTotalRef = useRef(total);
  const audioEnabledRef = useRef(false);

  // Pedir permissão push no 1º scroll ou click
  useEffect(() => {
    const handleInteraction = () => {
      audioEnabledRef.current = true;
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const checkNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiClient.get<any>('/notifications');
      if (res.data) {
        const newTotal = res.data.total;
        setNotifications(newTotal, res.data.notifications);

        // Se há mensagens novas e aumentou o total
        if (newTotal > prevTotalRef.current) {
          const newest = res.data.notifications[0];
          
          if (audioEnabledRef.current) {
            playNotificationSound();
          }

          if (Notification.permission === 'granted' && newest) {
            const notif = new Notification(`Wamini: Nova mensagem de ${newest.sender_name}`, {
              body: newest.body || 'Ficheiro recebido',
              icon: '/icons/icon-192x192.png'
            });
            notif.onclick = () => {
              window.focus();
              window.location.href = `/negotiation?chat=${newest.negotiation_id}`;
            };
          }
        }
        prevTotalRef.current = newTotal;
      }
    } catch (e) {
      // silencioso
    }
  }, [user, setNotifications]);

  useEffect(() => {
    checkNotifications();
    const interval = setInterval(checkNotifications, 10000); // 10s
    return () => clearInterval(interval);
  }, [checkNotifications]);

  return null;
}
