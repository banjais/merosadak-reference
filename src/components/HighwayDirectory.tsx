import React, { useState } from 'react';
import { Highway } from '../types';
import { NEPAL_HIGHWAYS } from '../data/nepalHighwaysData';
import { Search, Route, ShieldAlert, Zap, PhoneCall, ChevronDown, ChevronUp, MapPin, Gauge, Mountain, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';

interface HighwayDirectoryProps {
  onSelectHighwayOnMap?: (highway: Highway) => void;
  onPlanTripForHighway?: (startPoint: string, endPoint: string) => void;
}

export const HighwayDirectory: React.FC<HighwayDirectoryProps> = ({
  onSelectHighwayOnMap,
  onPlanTripForHighway,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'clear' | 'caution' | 'obstructed'>('all');
  const [terrainFilter, setTerrainFilter] = useState<'all' | 'Hilly' | 'High Mountain' | 'Plains'>('all');
  const [expandedHighwayId, setExpandedHighwayId] = useState<string | null>('h04'); // default open Prithvi

  const filteredHighways = NEPAL_HIGHWAYS.filter((hw) => {
    const matchesSearch =
      hw.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hw.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hw.nepaliName.includes(searchQuery) ||
      hw.startPoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hw.endPoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hw.provinces.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || hw.overallStatus === statusFilter;
    const matchesTerrain = terrainFilter === 'all' || hw.terrainType === terrainFilter;

    return matchesSearch && matchesStatus && matchesTerrain;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
              DEPARTMENT OF ROADS (DOR)
            </span>
            <span className="text-xs text-slate-400">Road Network System</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1 font-display">
            Nepal National Highways Information Directory
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time status, segment-by-segment surface analysis, key mountain passes, live alerts, and maintenance contact numbers across Nepal's arterial highway network.
          </p>
        </div>

        {/* Quick Highway Stats */}
        <div className="flex items-center space-x-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800 shrink-0">
          <div className="text-center px-2">
            <div className="text-lg font-bold text-emerald-400">{NEPAL_HIGHWAYS.length}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Highways</div>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-center px-2">
            <div className="text-lg font-bold text-cyan-400">
              {NEPAL_HIGHWAYS.reduce((acc, h) => acc + h.totalLengthKm, 0).toLocaleString()} km
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Span</div>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-center px-2">
            <div className="text-lg font-bold text-amber-400">
              {NEPAL_HIGHWAYS.reduce((acc, h) => acc + h.activeAlertCount, 0)}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Live Advisories</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-highway-search"
            type="text"
            placeholder="Search by highway name (e.g. Prithvi, Mahendra, H04, BP Highway)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Status
          </button>
          <button
            onClick={() => setStatusFilter('clear')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'clear' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Clear
          </button>
          <button
            onClick={() => setStatusFilter('caution')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'caution' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Caution / Widening
          </button>
        </div>

        {/* Terrain Filter */}
        <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setTerrainFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              terrainFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Terrains
          </button>
          <button
            onClick={() => setTerrainFilter('Hilly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              terrainFilter === 'Hilly' ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hilly
          </button>
          <button
            onClick={() => setTerrainFilter('High Mountain')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              terrainFilter === 'High Mountain' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            High Mountain
          </button>
          <button
            onClick={() => setTerrainFilter('Plains')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              terrainFilter === 'Plains' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Terai Plains
          </button>
        </div>
      </div>

      {/* Highway Cards List */}
      <div className="space-y-4">
        {filteredHighways.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <Route className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No highways found matching your filters.</p>
          </div>
        ) : (
          filteredHighways.map((highway) => {
            const isExpanded = expandedHighwayId === highway.id;
            return (
              <div
                key={highway.id}
                id={`highway-card-${highway.id}`}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden transition shadow-lg"
              >
                {/* Header Summary */}
                <div
                  onClick={() => setExpandedHighwayId(isExpanded ? null : highway.id)}
                  className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-850/50 transition"
                >
                  <div className="flex items-start space-x-4">
                    {/* Highway Badge */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 flex flex-col items-center justify-center shrink-0 shadow-md">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">NEPAL</span>
                      <span className="text-lg font-black text-emerald-400 font-display">{highway.code}</span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-bold text-white">{highway.name}</h3>
                        <span className="text-xs text-slate-400 font-medium">({highway.nepaliName})</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                            highway.overallStatus === 'clear'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : 'bg-amber-950 text-amber-300 border-amber-700'
                          }`}
                        >
                          {highway.overallStatus === 'clear' ? '✓ Two-Way Open' : '⚠️ Caution / Ongoing Work'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400 mt-1.5">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{highway.startPoint} ➔ {highway.endPoint}</span>
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="font-semibold text-slate-300">{highway.totalLengthKm} km</span>
                        <span className="text-slate-600">•</span>
                        <span className="flex items-center space-x-1">
                          <Mountain className="w-3.5 h-3.5 text-purple-400" />
                          <span>{highway.terrainType}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Rating */}
                  <div className="flex items-center space-x-4 shrink-0 self-end md:self-center">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-slate-400">Condition Score</div>
                      <div className="text-sm font-bold text-emerald-400">
                        {highway.conditionRating} / 5.0 <span className="text-xs text-slate-500">★</span>
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/40 space-y-5">
                    {/* Description */}
                    <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                      {highway.description}
                    </p>

                    {/* Key Passes & Junctions Pills */}
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Major Junctions & High Passes:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {highway.keyPassesAndJunctions.map((junction, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-slate-200"
                          >
                            {junction}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Segments Breakdown Table */}
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Road Segments & Surface Condition:</span>
                        <span className="text-[11px] text-slate-500 font-normal">{highway.segments.length} measured segments</span>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3">Segment</th>
                              <th className="py-2.5 px-3">Distance</th>
                              <th className="py-2.5 px-3">Surface</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Speed / Lanes</th>
                              <th className="py-2.5 px-3">Live Condition Notice</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {highway.segments.map((seg) => (
                              <tr key={seg.id} className="hover:bg-slate-850/40 transition">
                                <td className="py-2.5 px-3 font-medium text-white">
                                  {seg.from} ➔ {seg.to}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-200">{seg.distanceKm} km</td>
                                <td className="py-2.5 px-3 capitalize">
                                  <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-300">
                                    {seg.surface.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      seg.status === 'clear'
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                        : 'bg-amber-950 text-amber-300 border border-amber-700'
                                    }`}
                                  >
                                    {seg.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-300">
                                  {seg.avgSpeedKmh} km/h • <span className="text-slate-400">{seg.lanes} lanes</span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                                  {seg.currentIssue ? (
                                    <span className="text-amber-400 flex items-center space-x-1">
                                      <span>⚠️</span>
                                      <span className="truncate">{seg.currentIssue}</span>
                                    </span>
                                  ) : (
                                    <span className="text-emerald-400">Smooth traffic flow</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Toll & EV Amenities */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {/* EV Chargers */}
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <div className="flex items-center space-x-1.5 text-xs font-semibold text-cyan-400 mb-2">
                          <Zap className="w-3.5 h-3.5" />
                          <span>EV Fast Charging Stations along this highway ({highway.evChargers.length})</span>
                        </div>
                        {highway.evChargers.length > 0 ? (
                          <div className="space-y-1.5">
                            {highway.evChargers.map((ch) => (
                              <div key={ch.id} className="text-xs text-slate-300 flex items-center justify-between bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                                <div>
                                  <div className="font-semibold text-white">{ch.name}</div>
                                  <div className="text-[11px] text-slate-400">{ch.location}</div>
                                </div>
                                <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 text-[10px] rounded font-bold border border-cyan-800">
                                  {ch.powerKw} kW DC
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No dedicated NEA fast hubs recorded on this segment.</p>
                        )}
                      </div>

                      {/* DOR Maintenance & Help */}
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 mb-1.5">
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>DOR Maintenance Division & Emergency Control</span>
                          </div>
                          <p className="text-xs text-slate-300 font-medium">{highway.dorDivision}</p>
                          <p className="text-xs text-slate-400 mt-1">Helpline: <strong className="text-white">{highway.emergencyContact}</strong></p>
                        </div>

                        {/* Plan Trip Button */}
                        <div className="pt-3">
                          <button
                            onClick={() => onPlanTripForHighway && onPlanTripForHighway(highway.startPoint, highway.endPoint)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center space-x-1.5"
                          >
                            <Route className="w-3.5 h-3.5" />
                            <span>Plan Route on {highway.code}</span>
                          </button>
                        </div>
                      </div>
                    </div>
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
