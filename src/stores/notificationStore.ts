'use client';

import { create } from 'zustand';

interface AppNotification {
  id: number;
  negotiation_id: number;
  sender_id: number;
  sender_name: string;
  body: string;
  timestamp: string;
}

interface NotificationState {
  total: number;
  notifications: AppNotification[];
  setNotifications: (total: number, notifications: AppNotification[]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  total: 0,
  notifications: [],
  setNotifications: (total, notifications) => set({ total, notifications }),
}));
