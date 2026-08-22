import React from 'react';
import { useOffline } from '../context/OfflineContext';
import {
  Wifi,
  WifiOff,
  CloudDownload,
  Database,
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  X,
  Compass,
  Zap,
  ShieldCheck,
  HardDrive,
  Clock,
  Sparkles,
  Mountain,
} from 'lucide-react';

export const OfflineManagerModal: React.FC = () => {
  const {
    isOnline,
    isSimulatedOffline,
    setSimulatedOffline,
    cacheStats,
    isSyncing,
    syncProgress,
    downloadOfflinePack,
    clearCache,
    refreshStats,
    isOfflineManagerOpen,
    setIsOfflineManagerOpen,
  } = useOffline();

  if (!isOfflineManagerOpen) return null;

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Never downloaded';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      id="offline-manager-modal"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Mountain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white font-display">
                  Mountain Offline GIS & Tile Pack
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v1.2 Service Worker
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cache map tiles, road incidents, and topological routing for remote mountain gorges
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOfflineManagerOpen(false)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Network & Service Worker Status Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className={`p-4 rounded-2xl border transition ${
              isOnline
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-400" />}
              <span className="text-xs font-bold uppercase tracking-wider">
                {isOnline ? 'Online (Connected)' : 'Offline / Mountain Mode'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              {isOnline
                ? 'Live DOR telemetry and background tile prefetching active.'
                : 'Operating in disconnected mountain mode with local storage.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-200">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Service Worker Engine</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  cacheStats.isServiceWorkerActive ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
                }`}
              />
              <span className="text-[11px] text-slate-300">
                {cacheStats.isServiceWorkerActive ? 'Active & Intercepting Tiles' : 'Ready (CacheStorage Active)'}
              </span>
            </div>
          </div>
        </div>

        {/* Cache Storage Stats Grid */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
            <span>Offline Pack Footprint</span>
            <button
              onClick={refreshStats}
              className="text-slate-400 hover:text-emerald-400 flex items-center space-x-1 text-[11px]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Stats</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Map Tiles</span>
              <strong className="text-base text-emerald-400 font-mono font-bold">
                {cacheStats.tilesCount}
              </strong>
              <span className="text-[10px] text-slate-500 block">Zoom 6-10</span>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">GIS Datasets</span>
              <strong className="text-base text-cyan-400 font-mono font-bold">
                {cacheStats.dataEndpointsCount || 7}
              </strong>
              <span className="text-[10px] text-slate-500 block">Endpoints</span>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Storage</span>
              <strong className="text-base text-purple-400 font-mono font-bold">
                {cacheStats.approxStorageSizeMb} MB
              </strong>
              <span className="text-[10px] text-slate-500 block">In Cache</span>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Synced</span>
              <strong className="text-xs text-amber-300 font-semibold block truncate mt-1">
                {formatDate(cacheStats.lastSyncTimestamp)}
              </strong>
            </div>
          </div>
        </div>

        {/* Progress Bar (When Syncing) */}
        {isSyncing && syncProgress && (
          <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 space-y-2 animate-pulse">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-300 flex items-center space-x-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Downloading Mountain Pack...</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">{syncProgress.percentage}%</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${syncProgress.percentage}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 truncate">{syncProgress.currentTask}</p>
          </div>
        )}

        {/* Download Action Strip */}
        <div className="space-y-3">
          <button
            onClick={downloadOfflinePack}
            disabled={isSyncing}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-2xl transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
          >
            <CloudDownload className="w-4 h-4" />
            <span>{isSyncing ? 'Synchronizing Highway Tiles...' : 'Pre-Download Nepal Mountain Offline Pack'}</span>
          </button>

          <div className="flex items-center justify-between gap-3">
            {/* Simulation Toggle Switch */}
            <label className="flex items-center space-x-2.5 cursor-pointer bg-slate-950/60 hover:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 transition">
              <input
                type="checkbox"
                checked={isSimulatedOffline}
                onChange={(e) => setSimulatedOffline(e.target.checked)}
                className="w-4 h-4 text-emerald-500 bg-slate-900 border-slate-700 rounded focus:ring-emerald-500 focus:ring-1"
              />
              <span className="text-xs font-semibold text-slate-300">
                Simulate Remote Mountain Mode (Offline Test)
              </span>
            </label>

            {/* Clear Cache */}
            <button
              onClick={clearCache}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-xl text-xs font-semibold border border-slate-800 hover:border-red-800/40 transition flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cache</span>
            </button>
          </div>
        </div>

        {/* Mountain Travel Tips Info */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1.5 text-xs text-slate-400">
          <div className="font-bold text-slate-300 flex items-center space-x-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>How Offline Mode Works in Nepal's Mountain Corridors:</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            1. <strong>Topological Routing</strong>: Route calculation runs completely client-side in browser memory via Dijkstra optimization, needing zero internet connection.
          </p>
          <p className="leading-relaxed text-[11px]">
            2. <strong>Map Tile Caching</strong>: Service Worker intercepts tile requests and delivers pre-cached cartographic layers even when cellular data is completely unavailable in river canyons (e.g., Trishuli, Sun Koshi, Daunne).
          </p>
        </div>
      </div>
    </div>
  );
};
