import React, { useState } from 'react';
import { HighwayWeatherNode } from '../types';
import { CloudRain, Sun, CloudFog, Cloud, Zap, AlertTriangle, Wind, Eye, Compass, Droplets, ShieldCheck, Thermometer } from 'lucide-react';
import { WeatherSparklineChart } from './WeatherSparklineChart';

interface WeatherPassesPanelProps {
  weatherNodes: HighwayWeatherNode[];
  onSelectNode: (node: HighwayWeatherNode) => void;
  selectedNodeId?: string | null;
}

export const WeatherPassesPanel: React.FC<WeatherPassesPanelProps> = ({
  weatherNodes,
  onSelectNode,
  selectedNodeId,
}) => {
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getWeatherIcon = (condition: HighwayWeatherNode['condition']) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="w-5 h-5 text-amber-400" />;
      case 'rain_monsoon':
        return <CloudRain className="w-5 h-5 text-blue-400 animate-pulse" />;
      case 'dense_fog':
        return <CloudFog className="w-5 h-5 text-slate-300" />;
      case 'mountain_shower':
        return <CloudRain className="w-5 h-5 text-cyan-400" />;
      case 'thunderstorm':
        return <Zap className="w-5 h-5 text-purple-400 animate-bounce" />;
      case 'cloudy':
      default:
        return <Cloud className="w-5 h-5 text-slate-400" />;
    }
  };

  const getGripBadge = (grip: HighwayWeatherNode['roadGrip']) => {
    switch (grip) {
      case 'dry_excellent':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            High Traction • Dry
          </span>
        );
      case 'wet_caution':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Wet • Reduced Grip
          </span>
        );
      case 'mud_slippery':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Mud Slush • Very Slippery
          </span>
        );
      case 'fog_low_visibility':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Fog Hazard • Low Vis
          </span>
        );
    }
  };

  const filteredNodes = weatherNodes.filter((node) => {
    const matchesSearch =
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.highwayCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.nepaliName.includes(searchQuery);

    if (!matchesSearch) return false;
    if (filterCondition === 'all') return true;
    if (filterCondition === 'rain' && (node.condition === 'rain_monsoon' || node.condition === 'mountain_shower' || node.condition === 'thunderstorm')) return true;
    if (filterCondition === 'fog' && node.condition === 'dense_fog') return true;
    if (filterCondition === 'hazard' && (node.landslideRisk === 'high' || node.landslideRisk === 'severe')) return true;
    return true;
  });

  return (
    <div className="space-y-4" id="weather-panel-root">
      {/* Header Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-4 rounded-xl border border-slate-800/80 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <CloudFog className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Highway Passes & Micro-Weather</h3>
              <p className="text-xs text-slate-400">Live monitoring across mountain crests & river gorges</p>
            </div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
            {weatherNodes.length} Stations Active
          </span>
        </div>
      </div>

      {/* Filter Chips & Search */}
      <div className="space-y-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search mountain pass, gorge, or highway (e.g. Daunne, Nagdhunga)..."
          className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          id="weather-search-input"
        />

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            { id: 'all', label: 'All Passes' },
            { id: 'rain', label: '🌧️ Monsoon / Rain' },
            { id: 'fog', label: '🌫️ Dense Fog' },
            { id: 'hazard', label: '⚠️ Landslide Risk' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterCondition(f.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition whitespace-nowrap ${
                filterCondition === f.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
              id={`filter-weather-${f.id}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Weather Node Cards List */}
      <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
        {filteredNodes.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800/60 text-slate-500 text-xs">
            No mountain pass weather stations found matching your criteria.
          </div>
        ) : (
          filteredNodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${
                  isSelected
                    ? 'bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500/40'
                    : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                }`}
                id={`weather-card-${node.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2.5">
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 mt-0.5">
                      {getWeatherIcon(node.condition)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-sm text-slate-100">{node.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {node.highwayCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span>{node.nepaliName}</span>
                        <span>•</span>
                        <span className="text-slate-300 font-medium">Alt: {node.elevationM}m</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-extrabold text-white flex items-center justify-end">
                      <Thermometer className="w-3.5 h-3.5 text-rose-400 mr-0.5" />
                      {node.tempC}°C
                    </div>
                    <span className="text-[10px] text-slate-500 block">{node.lastUpdated}</span>
                  </div>
                </div>

                {/* Weather Metrics Strip */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800/70 text-[11px]">
                  <div className="flex items-center space-x-1 text-slate-400">
                    <Droplets className="w-3 h-3 text-blue-400 shrink-0" />
                    <span>Rain: <strong className="text-slate-200">{node.rainProbabilityPercent}%</strong></span>
                  </div>
                  <div className="flex items-center space-x-1 text-slate-400">
                    <Eye className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Vis: <strong className="text-slate-200">{node.visibilityKm} km</strong></span>
                  </div>
                  <div className="flex items-center space-x-1 text-slate-400">
                    <Wind className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>Wind: <strong className="text-slate-200">{node.windSpeedKmh} km/h</strong></span>
                  </div>
                </div>

                {/* Road Grip & Landslide Warning */}
                <div className="flex items-center justify-between mt-3">
                  {getGripBadge(node.roadGrip)}
                  {node.landslideRisk === 'high' || node.landslideRisk === 'severe' ? (
                    <span className="flex items-center space-x-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{node.landslideRisk === 'severe' ? 'Critical Slope' : 'Landslide Alert'}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium">Safe Slope Stability</span>
                  )}
                </div>

                {/* Summary Advisory */}
                <p className="mt-2.5 text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/50 leading-relaxed">
                  {node.summary}
                </p>

                {/* D3 24-Hour Sparkline Trend Chart (shown when selected) */}
                {isSelected && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <WeatherSparklineChart weatherNode={node} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
