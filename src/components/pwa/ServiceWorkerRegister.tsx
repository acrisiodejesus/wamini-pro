'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
      const pwaFile = '/sw.js';
      navigator.serviceWorker.register(pwaFile)
        .then((reg) => {
          console.log('Service worker registered.', reg);
        })
        .catch((err) => {
          console.error('Service worker registration failed.', err);
        });
    }
  }, []);

  return null;
}
