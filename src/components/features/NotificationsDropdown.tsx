'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { Link } from '@/i18n/routing';
import clsx from 'clsx';

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const { total, notifications } = useNotificationStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-gray-100 relative transition-colors"
        aria-label="Notificações"
      >
        <Bell size={24} />
        {total > 0 && (
          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Notificações</h3>
            {total > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">
                {total} novas
              </span>
            )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                Sem mensagens por ler
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    href={`/negotiation?chat=${notif.negotiation_id}`}
                    onClick={() => setOpen(false)}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-semibold text-sm mb-0.5">{notif.sender_name}</p>
                    <p className="text-gray-600 text-sm truncate">
                      {notif.body || '📎 Ficheiro anexado'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
