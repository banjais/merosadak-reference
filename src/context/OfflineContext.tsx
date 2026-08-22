import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  registerServiceWorker,
  getOfflineCacheStats,
  downloadMountainOfflinePack,
  clearOfflineStorage,
  OfflineCacheStats,
  PrefetchProgress,
  getStoredOfflineBundle,
} from '../utils/offlineSync';

interface OfflineContextType {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  setSimulatedOffline: (val: boolean) => void;
  cacheStats: OfflineCacheStats;
  isSyncing: boolean;
  syncProgress: PrefetchProgress | null;
  downloadOfflinePack: () => Promise<void>;
  clearCache: () => Promise<void>;
  refreshStats: () => Promise<void>;
  isOfflineManagerOpen: boolean;
  setIsOfflineManagerOpen: (open: boolean) => void;
  cachedBundle: any | null;
}

const defaultStats: OfflineCacheStats = {
  isServiceWorkerActive: false,
  tilesCount: 0,
  dataEndpointsCount: 0,
  lastSyncTimestamp: null,
  approxStorageSizeMb: '0.00',
  isReadyForOffline: false,
};

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  isSimulatedOffline: false,
  setSimulatedOffline: () => {},
  cacheStats: defaultStats,
  isSyncing: false,
  syncProgress: null,
  downloadOfflinePack: async () => {},
  clearCache: async () => {},
  refreshStats: async () => {},
  isOfflineManagerOpen: false,
  setIsOfflineManagerOpen: () => {},
  cachedBundle: null,
});

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [realOnline, setRealOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [cacheStats, setCacheStats] = useState<OfflineCacheStats>(defaultStats);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<PrefetchProgress | null>(null);
  const [isOfflineManagerOpen, setIsOfflineManagerOpen] = useState<boolean>(false);
  const [cachedBundle, setCachedBundle] = useState<any | null>(null);

  // Computed online status considering simulation
  const effectiveOnline = isSimulatedOffline ? false : realOnline;

  const refreshStats = useCallback(async () => {
    const stats = await getOfflineCacheStats();
    setCacheStats(stats);
    const bundle = getStoredOfflineBundle();
    setCachedBundle(bundle);
  }, []);

  // Listen for online/offline events and register service worker
  useEffect(() => {
    registerServiceWorker().then(() => {
      refreshStats();
    });

    const handleOnline = () => {
      setRealOnline(true);
      refreshStats();
    };

    const handleOffline = () => {
      setRealOnline(false);
      refreshStats();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial stats check
    refreshStats();

    // Listen to Service Worker messages if SW is sending progress
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PREFETCH_PROGRESS') {
        setSyncProgress({
          processed: event.data.processed,
          total: event.data.total,
          percentage: event.data.percentage,
          currentTask: event.data.currentTask,
          stage: 'tiles',
        });
      }
      if (event.data?.type === 'PREFETCH_COMPLETE' || event.data?.type === 'CACHE_CLEARED') {
        refreshStats();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, [refreshStats]);

  const handleDownloadOfflinePack = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await downloadMountainOfflinePack((progress) => {
        setSyncProgress(progress);
      });
      await refreshStats();
    } catch (err) {
      console.error('Offline pack sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = async () => {
    await clearOfflineStorage();
    await refreshStats();
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline: effectiveOnline,
        isSimulatedOffline,
        setSimulatedOffline: setIsSimulatedOffline,
        cacheStats,
        isSyncing,
        syncProgress,
        downloadOfflinePack: handleDownloadOfflinePack,
        clearCache: handleClearCache,
        refreshStats,
        isOfflineManagerOpen,
        setIsOfflineManagerOpen,
        cachedBundle,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);
