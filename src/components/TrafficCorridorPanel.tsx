import React, { useState } from 'react';
import { TrafficCorridor, TrafficLevel } from '../types';
import {
  Gauge,
  Clock,
  AlertOctagon,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  Activity,
  BarChart2,
  List,
  Sparkles,
  Layers,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { TravelTimeTrendsVisualizer } from './TravelTimeTrendsVisualizer';

interface TrafficCorridorPanelProps {
  corridors: TrafficCorridor[];
  onSelectCorridor: (corridor: TrafficCorridor) => void;
  selectedCorridorId?: string | null;
}

export const TrafficCorridorPanel: React.FC<TrafficCorridorPanelProps> = ({
  corridors,
  onSelectCorridor,
  selectedCorridorId,
}) => {
  const [viewMode, setViewMode] = useState<'trends' | 'live'>('trends');
  const [activeCorridorId, setActiveCorridorId] = useState<string>(
    selectedCorridorId || corridors[0]?.id || 'tr-daunne'
  );

  const selectedCorridor =
    corridors.find((c) => c.id === (selectedCorridorId || activeCorridorId)) ||
    corridors[0];

  const handleCorridorClick = (corridor: TrafficCorridor) => {
    setActiveCorridorId(corridor.id);
    onSelectCorridor(corridor);
  };

  const handleViewTrendsForCorridor = (e: React.MouseEvent, corridor: TrafficCorridor) => {
    e.stopPropagation();
    setActiveCorridorId(corridor.id);
    setViewMode('trends');
    onSelectCorridor(corridor);
  };

  const getTrafficBadge = (level: TrafficLevel) => {
    switch (level) {
      case 'smooth':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Smooth Flow
          </span>
        );
      case 'moderate':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Moderate Slowdown
          </span>
        );
      case 'heavy':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            Heavy Congestion
          </span>
        );
      case 'standstill':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
            Standstill / Chokepoint
          </span>
        );
      case 'alternating_1way':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Alternating 1-Way
          </span>
        );
    }
  };

  return (
    <div className="space-y-4" id="traffic-panel-root">
      {/* Header Banner with View Mode Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-3.5 rounded-xl border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Nepal Highway Traffic & Congestion Trends</h3>
              <p className="text-xs text-slate-400">Department of Roads telemetry & historical rush-hour analytics</p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('trends')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1.5 ${
                viewMode === 'trends'
                  ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
              id="tab-traffic-trends"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Travel Time Trends</span>
            </button>

            <button
              onClick={() => setViewMode('live')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center space-x-1.5 ${
                viewMode === 'live'
                  ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
              id="tab-traffic-live"
            >
              <List className="w-3.5 h-3.5" />
              <span>Live Speed Feed</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'trends' ? (
        <TravelTimeTrendsVisualizer
          selectedCorridor={selectedCorridor}
          allCorridors={corridors}
          onSelectCorridor={handleCorridorClick}
        />
      ) : (
        /* Live Corridors List */
        <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
          {corridors.map((corridor) => {
            const isSelected = (selectedCorridorId || activeCorridorId) === corridor.id;
            const isDelayed = corridor.delayMinutes > 0;

            return (
              <div
                key={corridor.id}
                onClick={() => handleCorridorClick(corridor)}
                className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/40'
                    : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                }`}
                id={`traffic-corridor-${corridor.id}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-100">{corridor.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-mono">
                        {corridor.highwayCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{corridor.section}</p>
                  </div>
                  {getTrafficBadge(corridor.level)}
                </div>

                {/* Speed & Delay Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/60">
                  <div className="flex items-center space-x-2">
                    <Gauge className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Current Avg Speed</span>
                      <div className="text-xs font-bold text-white">
                        {corridor.avgSpeedKmh} km/h
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          (normal: {corridor.normalSpeedKmh})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-rose-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Transit Delay</span>
                      <div className={`text-xs font-bold ${isDelayed ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isDelayed ? `+${corridor.delayMinutes} min delay` : 'No Delay (On Time)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cause & Reason */}
                <div className="mt-2.5 text-xs text-slate-300 bg-slate-900/50 p-2 rounded-lg border border-slate-800/40">
                  <span className="text-slate-400 font-medium mr-1.5">Traffic Cause:</span>
                  {corridor.cause}
                </div>

                {/* Footer Controls */}
                <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60">
                  <span className="text-slate-500 text-[10px]">Updated: {corridor.lastUpdated}</span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleViewTrendsForCorridor(e, corridor)}
                      className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold flex items-center space-x-1 transition"
                    >
                      <BarChart2 className="w-3 h-3" />
                      <span>24h Trends</span>
                    </button>

                    <span className="text-amber-400 font-semibold flex items-center space-x-1 text-[10px]">
                      <span>Pin Map</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

