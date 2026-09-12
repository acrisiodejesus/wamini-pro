'use client';

export type SyncEntityType = 'farmer' | 'farm' | 'production' | 'input_distribution';
export type SyncItemStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncQueueItem {
  id: string; // client_uuid
  entityType: SyncEntityType;
  data: any;
  status: SyncItemStatus;
  attempts: number;
  lastAttemptAt?: string;
  errorMessage?: string;
  createdAt: string;
}

const STORAGE_KEY = 'wamini_offline_sync_queue_v1';

class OfflineSyncManager {
  private queue: SyncQueueItem[] = [];
  private listeners: Array<() => void> = [];
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadQueue();
      window.addEventListener('online', () => {
        console.log('[SyncManager] Conexão detectada. Tentando sincronizar fila pendente...');
        this.syncAll();
      });
    }
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (e) {
      console.error('[SyncManager] Erro ao carregar fila do localStorage:', e);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (e) {
      console.error('[SyncManager] Erro ao salvar fila no localStorage:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public getQueue(): SyncQueueItem[] {
    return [...this.queue];
  }

  public getPendingCount(): number {
    return this.queue.filter(i => i.status === 'pending' || i.status === 'failed').length;
  }

  /**
   * Adiciona um item à fila local com client_uuid gerado.
   * Se houver internet, tenta sincronizar imediatamente em segundo plano.
   */
  public enqueue(entityType: SyncEntityType, data: any): string {
    const clientUuid = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : `offline_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

    const newItem: SyncQueueItem = {
      id: clientUuid,
      entityType,
      data: { ...data, client_uuid: clientUuid },
      status: 'pending',
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    this.queue.push(newItem);
    this.saveQueue();

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.syncAll();
    }

    return clientUuid;
  }

  /**
   * Dispara a sincronização de todos os itens pendentes com o endpoint /api/v1/sync.
   */
  public async syncAll(): Promise<{ success: boolean; syncedCount: number }> {
    if (this.isSyncing) return { success: false, syncedCount: 0 };
    const pendingItems = this.queue.filter(i => i.status === 'pending' || i.status === 'failed');
    if (pendingItems.length === 0) return { success: true, syncedCount: 0 };

    this.isSyncing = true;
    for (const item of pendingItems) {
      item.status = 'syncing';
    }
    this.saveQueue();

    try {
      // Montar pacote de sincronização em lote
      const payload: {
        farmers: any[];
        farms: any[];
        production_records: any[];
        input_distributions: any[];
      } = {
        farmers: [],
        farms: [],
        production_records: [],
        input_distributions: [],
      };

      for (const item of pendingItems) {
        if (item.entityType === 'farmer') payload.farmers.push(item.data);
        if (item.entityType === 'farm') payload.farms.push(item.data);
        if (item.entityType === 'production') payload.production_records.push(item.data);
        if (item.entityType === 'input_distribution') payload.input_distributions.push(item.data);
      }

      const res = await fetch('/api/v1/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Erro do servidor HTTP ${res.status}`);
      }

      const data = await res.json();
      const results = data.results || {};

      // Atualizar itens na fila com base no retorno
      let syncedCount = 0;
      const allResults: Array<{ client_uuid: string; status: string; error?: string }> = [
        ...(results.farmers || []),
        ...(results.farms || []),
        ...(results.production_records || []),
        ...(results.input_distributions || []),
      ];

      for (const result of allResults) {
        const item = this.queue.find(i => i.id === result.client_uuid);
        if (item) {
          item.attempts += 1;
          item.lastAttemptAt = new Date().toISOString();
          if (result.status === 'synced') {
            item.status = 'synced';
            syncedCount++;
          } else {
            item.status = 'failed';
            item.errorMessage = result.error || 'Falha ao sincronizar';
          }
        }
      }

      // Remover da fila os itens que foram sincronizados com sucesso após confirmação
      this.queue = this.queue.filter(i => i.status !== 'synced');
      this.saveQueue();

      return { success: true, syncedCount };
    } catch (err: any) {
      console.error('[SyncManager] Erro durante a sincronização:', err);
      for (const item of pendingItems) {
        item.status = 'failed';
        item.attempts += 1;
        item.lastAttemptAt = new Date().toISOString();
        item.errorMessage = err.message || 'Falha de rede';
      }
      this.saveQueue();
      return { success: false, syncedCount: 0 };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  public clearQueue() {
    this.queue = [];
    this.saveQueue();
  }
}

export const syncManager = new OfflineSyncManager();
