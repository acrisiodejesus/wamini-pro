/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;


// Filtrar manifest para evitar precaching de ficheiros voláteis (.js/.css c/ hashes)
// Isto resolve os erros 404 "bad-precaching-response" em novos deploys
const filteredManifest = self.__SW_MANIFEST?.filter((entry: any) => {
  const url = typeof entry === 'string' ? entry : entry.url;
  // Não fazer precache de chunks CSS ou JS que mudam a cada build
  return !url.includes('/static/chunks/') && 
         !url.includes('/static/css/') && 
         !url.endsWith('.map');
});

const serwist = new Serwist({
  precacheEntries: filteredManifest,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false, // Desactivado para evitar conflitos com erros 500
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
