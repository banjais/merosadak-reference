import React, { useState } from 'react';
import { RoadIncident, UserRoadReport, IncidentType } from '../types';
import { AlertTriangle, ShieldCheck, ThumbsUp, Radio, MapPin, Clock, Filter, CheckCircle2, ChevronRight } from 'lucide-react';

interface RoadAlertsFeedProps {
  incidents: RoadIncident[];
  userReports: UserRoadReport[];
  onOpenReportModal: () => void;
  onUpvoteReport?: (id: string) => void;
  onSelectIncident?: (incident: RoadIncident) => void;
}

export const RoadAlertsFeed: React.FC<RoadAlertsFeedProps> = ({
  incidents,
  userReports,
  onOpenReportModal,
  onUpvoteReport,
  onSelectIncident,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'dor' | 'community'>('dor');

  const filteredIncidents = incidents.filter((inc) => {
    if (filterType === 'all') return true;
    return inc.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">
              DEPARTMENT OF ROADS & TRAFFIC POLICE
            </span>
            <span className="text-xs text-slate-400">Live Obstruction Bulletin</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1 font-display">
            Live Highway Road Conditions & Incident Tracker
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time status on mountain landslides, river washouts, bridge repairs, single-lane controlled movement, and crowdsourced driver reports.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 shrink-0 active:scale-95"
        >
          <Radio className="w-4 h-4 text-amber-200 animate-pulse" />
          <span>Report Road Obstacle</span>
        </button>
      </div>

      {/* Main Tabs (DOR Verified vs Community Reports) */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('dor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'dor'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>DOR Official Bulletins ({incidents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('community')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'community'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Mero Sadak Community Reports ({userReports.length})</span>
          </button>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Incident Types</option>
            <option value="landslide">Landslides & Rockfall</option>
            <option value="construction">Road Widening & Construction</option>
            <option value="bridge_maintenance">Bridge Maintenance</option>
          </select>
        </div>
      </div>

      {/* Incidents List */}
      {activeTab === 'dor' ? (
        <div className="space-y-3">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-slate-300 text-sm font-semibold">No severe obstructions reported at this moment.</p>
              <p className="text-slate-500 text-xs mt-1">All major corridors are operating normally.</p>
            </div>
          ) : (
            filteredIncidents.map((incident) => (
              <div
                key={incident.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl shadow-lg transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        incident.severity === 'critical' || incident.severity === 'severe'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-base">{incident.title}</span>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold">
                          DOR VERIFIED
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                        <span className="text-emerald-400 font-semibold">{incident.highwayName} ({incident.highwayCode})</span>
                        <span>•</span>
                        <span>{incident.locationName}</span>
                        {incident.chainageKm && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{incident.chainageKm}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        incident.status === 'clear'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : incident.status === 'caution'
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : 'bg-red-950 text-red-300 border-red-700'
                      }`}
                    >
                      {incident.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                  {incident.description}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center space-x-4 text-[11px]">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Reported {incident.reportedAt}</span>
                    </span>
                    {incident.estimatedClearance && (
                      <span className="text-amber-400 font-medium">
                        ⏱️ Est. Clearance: <strong>{incident.estimatedClearance}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {incident.alternativeRouteAdvice && (
                      <div className="text-[11px] text-cyan-300">
                        <strong>Detour:</strong> {incident.alternativeRouteAdvice}
                      </div>
                    )}
                    {onSelectIncident && (
                      <button
                        onClick={() => onSelectIncident(incident)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold rounded-lg transition flex items-center space-x-1 shrink-0"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Locate on Map</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Community Reports Feed */
        <div className="space-y-3">
          {userReports.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <Radio className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No crowdsourced reports submitted yet.</p>
            </div>
          ) : (
            userReports.map((rep) => (
              <div
                key={rep.id}
                className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{rep.location}</span>
                    <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-semibold">
                      {rep.highwayCode}
                    </span>
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] uppercase font-bold capitalize">
                      {rep.incidentType.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">{rep.createdAt}</span>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
                  {rep.description}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span className="text-[11px]">Reported by: <strong className="text-slate-200">{rep.reporterName}</strong></span>
                  <button
                    onClick={() => onUpvoteReport && onUpvoteReport(rep.id)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
                  >
                    <ThumbsUp className="w-3 h-3 text-emerald-400" />
                    <span>Confirm / Upvote ({rep.upvotes})</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
