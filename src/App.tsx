import React, { useState, useEffect } from 'react';
import { RoutePlanner } from './components/RoutePlanner';
import { InteractiveMap } from './components/InteractiveMap';
import { HighwayDirectory } from './components/HighwayDirectory';
import { RoadAlertsFeed } from './components/RoadAlertsFeed';
import { RoadReportModal } from './components/RoadReportModal';
import { DistanceMatrixModal } from './components/DistanceMatrixModal';
import { WeatherPassesPanel } from './components/WeatherPassesPanel';
import { HighwayPOIsPanel } from './components/HighwayPOIsPanel';
import { TrafficCorridorPanel } from './components/TrafficCorridorPanel';
import { RegionalDialectPhrasesPanel } from './components/RegionalDialectPhrasesPanel';
import { OfflineStatusBanner } from './components/OfflineStatusBanner';
import { OfflineManagerModal } from './components/OfflineManagerModal';
import { SosEmergencyModal } from './components/SosEmergencyModal';
import { OfflineProvider, useOffline } from './context/OfflineContext';
import { getStoredOfflineBundle } from './utils/offlineSync';
import {
  RoutePlanResult,
  Highway,
  CityNode,
  RoadIncident,
  UserRoadReport,
  HighwayWeatherNode,
  HighwayPOI,
  TrafficCorridor,
  VehicleType,
  RoutePreference,
} from './types';
import {
  LIVE_ROAD_INCIDENTS,
  INITIAL_USER_REPORTS,
  HIGHWAY_WEATHER_NODES,
  HIGHWAY_POIS,
  TRAFFIC_CORRIDORS,
  NEPAL_HIGHWAYS,
  CITIES_AND_JUNCTIONS,
} from './data/nepalHighwaysData';
import { findOptimizedRoute } from './utils/routeOptimizer';
import {
  Compass,
  AlertTriangle,
  CloudFog,
  MapPin,
  Activity,
  Route,
  Navigation,
  Calculator,
  PhoneCall,
  PlusCircle,
  ShieldAlert,
  Sparkles,
  Zap,
  Layers,
  ChevronRight,
  Mountain,
  Wifi,
  WifiOff,
  CloudDownload,
  Languages,
  Menu,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

export type SubViewTab = 'route' | 'incidents' | 'weather' | 'pois' | 'traffic' | 'highways' | 'dialects';

function AppContent() {
  const [activeTab, setActiveTab] = useState<SubViewTab>('route');
  const [activeRoute, setActiveRoute] = useState<RoutePlanResult | null>(null);
  const [plannerOrigin, setPlannerOrigin] = useState<string>('ktm');
  const [plannerDest, setPlannerDest] = useState<string>('pkr');
  const [plannerVehicle, setPlannerVehicle] = useState<VehicleType>('car');
  const [plannerPref, setPlannerPref] = useState<RoutePreference>('fastest');

  // Drawer and Footer States
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isFabVisible, setIsFabVisible] = useState(true);
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDistanceModalOpen, setIsDistanceModalOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);

  // Offline context
  const { isOnline, cacheStats, setIsOfflineManagerOpen } = useOffline();

  // Data states
  const [incidents, setIncidents] = useState<RoadIncident[]>(LIVE_ROAD_INCIDENTS);
  const [userReports, setUserReports] = useState<UserRoadReport[]>(INITIAL_USER_REPORTS);
  const [weatherNodes, setWeatherNodes] = useState<HighwayWeatherNode[]>(HIGHWAY_WEATHER_NODES);
  const [pois, setPois] = useState<HighwayPOI[]>(HIGHWAY_POIS);
  const [trafficCorridors, setTrafficCorridors] = useState<TrafficCorridor[]>(TRAFFIC_CORRIDORS);

  // Focus on map target
  const [focusedTarget, setFocusedTarget] = useState<{
    lat: number;
    lng: number;
    title: string;
    zoom?: number;
  } | null>(null);

  // Selected item tracking in sidebar
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedWeatherId, setSelectedWeatherId] = useState<string | null>(null);
  const [selectedPOIId, setSelectedPOIId] = useState<string | null>(null);
  const [selectedTrafficId, setSelectedTrafficId] = useState<string | null>(null);

  // Initialize from URL search parameters or default route plan
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const urlOrigin = searchParams.get('origin');
        const urlDest = searchParams.get('dest');
        const urlVehicle = (searchParams.get('vehicle') as VehicleType) || 'car';
        const urlPref = (searchParams.get('pref') as RoutePreference) || 'fastest';
        const urlTab = searchParams.get('tab') as SubViewTab;

        const origin = urlOrigin || 'ktm';
        const dest = urlDest || 'pkr';

        if (urlOrigin) setPlannerOrigin(urlOrigin);
        if (urlDest) setPlannerDest(urlDest);
        if (urlVehicle) setPlannerVehicle(urlVehicle);
        if (urlPref) setPlannerPref(urlPref);

        if (urlTab && ['route', 'incidents', 'weather', 'pois', 'traffic', 'highways'].includes(urlTab)) {
          setActiveTab(urlTab);
        }

        const initialPlan = findOptimizedRoute(origin, dest, urlPref, urlVehicle);
        if (initialPlan) {
          setActiveRoute(initialPlan);
        }
      }
    } catch (e) {
      const initialPlan = findOptimizedRoute('ktm', 'pkr', 'fastest', 'car');
      if (initialPlan) {
        setActiveRoute(initialPlan);
      }
    }
  }, []);

  // Fetch updated data from server or local offline bundle
  const fetchLiveFeeds = async () => {
    try {
      const [alertsRes, wxRes, poiRes, trRes] = await Promise.all([
        fetch('/api/road-alerts'),
        fetch('/api/weather'),
        fetch('/api/pois'),
        fetch('/api/traffic'),
      ]);

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        if (data.incidents) setIncidents(data.incidents);
        if (data.userReports) setUserReports(data.userReports);
      }
      if (wxRes.ok) {
        const data = await wxRes.json();
        if (data.weatherNodes) setWeatherNodes(data.weatherNodes);
      }
      if (poiRes.ok) {
        const data = await poiRes.json();
        if (data.pois) setPois(data.pois);
      }
      if (trRes.ok) {
        const data = await trRes.json();
        if (data.corridors) setTrafficCorridors(data.corridors);
      }
    } catch (err) {
      console.log('[Mero Sadak] Network unreachable. Checking offline local bundle...');
      const offlineBundle = getStoredOfflineBundle();
      if (offlineBundle) {
        if (offlineBundle.incidents) setIncidents(offlineBundle.incidents);
        if (offlineBundle.userReports) setUserReports(offlineBundle.userReports);
        if (offlineBundle.weatherNodes) setWeatherNodes(offlineBundle.weatherNodes);
        if (offlineBundle.pois) setPois(offlineBundle.pois);
        if (offlineBundle.corridors) setTrafficCorridors(offlineBundle.corridors);
      }
    }
  };

  useEffect(() => {
    fetchLiveFeeds();
  }, []);

  const handleRouteCalculated = (route: RoutePlanResult) => {
    setActiveRoute(route);
  };

  const handleSelectCityOnMap = (city: CityNode, type: 'origin' | 'destination') => {
    if (type === 'origin') setPlannerOrigin(city.id);
    if (type === 'destination') setPlannerDest(city.id);
    setActiveTab('route');
  };

  const handleDistanceMatrixSelect = (originId: string, destId: string) => {
    setPlannerOrigin(originId);
    setPlannerDest(destId);
    setActiveTab('route');
  };

  const handleSelectIncident = (inc: RoadIncident | UserRoadReport) => {
    setSelectedIncidentId(inc.id);
    setActiveTab('incidents');
    const locName = 'locationName' in inc ? inc.locationName : inc.location;
    const title = 'title' in inc ? inc.title : `${inc.incidentType} at ${inc.location}`;
    const matchedCity = CITIES_AND_JUNCTIONS.find(
      (c) =>
        c.name.toLowerCase().includes(locName.toLowerCase()) ||
        locName.toLowerCase().includes(c.name.toLowerCase())
    );
    if (matchedCity) {
      setFocusedTarget({
        lat: matchedCity.lat,
        lng: matchedCity.lng,
        title: locName || title,
        zoom: 12,
      });
    } else if ('lat' in inc && 'lng' in inc && inc.lat && inc.lng) {
      setFocusedTarget({
        lat: inc.lat,
        lng: inc.lng,
        title: locName || title,
        zoom: 12,
      });
    }
  };

  const handleSelectWeatherNode = (node: HighwayWeatherNode) => {
    setSelectedWeatherId(node.id);
    setFocusedTarget({
      lat: node.lat,
      lng: node.lng,
      title: `${node.name} (${node.elevationM}m)`,
      zoom: 12,
    });
  };

  const handleFocusWeatherPassOnMap = (node: HighwayWeatherNode) => {
    setSelectedWeatherId(node.id);
    setFocusedTarget({
      lat: node.lat,
      lng: node.lng,
      title: `${node.name} (${node.elevationM}m) - Hazard Pass`,
      zoom: 13,
    });
  };

  const handleOpenWeatherTabWithNode = (nodeId?: string) => {
    if (nodeId) {
      setSelectedWeatherId(nodeId);
      const matchedNode = weatherNodes.find((n) => n.id === nodeId);
      if (matchedNode) {
        setFocusedTarget({
          lat: matchedNode.lat,
          lng: matchedNode.lng,
          title: `${matchedNode.name} (${matchedNode.elevationM}m)`,
          zoom: 12,
        });
      }
    }
    setActiveTab('weather');
  };

  const handleSelectPOI = (poi: HighwayPOI) => {
    setSelectedPOIId(poi.id);
    setFocusedTarget({
      lat: poi.lat,
      lng: poi.lng,
      title: poi.name,
      zoom: 13,
    });
  };

  const handleSelectTraffic = (corridor: TrafficCorridor) => {
    setSelectedTrafficId(corridor.id);
    if (corridor.startCoord && corridor.endCoord) {
      setFocusedTarget({
        lat: (corridor.startCoord[0] + corridor.endCoord[0]) / 2,
        lng: (corridor.startCoord[1] + corridor.endCoord[1]) / 2,
        title: corridor.name,
        zoom: 11,
      });
    }
  };

  const handleUpvote = (reportId: string) => {
    setUserReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, upvotes: r.upvotes + 1 } : r))
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Offline Status Banner */}
      <OfflineStatusBanner />

      {/* Main Unified Header */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 py-2.5">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between">
          {/* Brand & Drawer Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsLeftDrawerOpen(!isLeftDrawerOpen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition flex items-center justify-center shadow-sm"
              title="Toggle Left Menu Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('route')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
                <Navigation className="w-4 h-4 text-white transform -rotate-45" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-extrabold tracking-tight text-white font-display">Mero Sadak</span>
                  <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                    NEPAL HIGHWAYS GIS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Real-Time Road Network & Mountain Highway Intelligence
                </p>
              </div>
            </div>
          </div>

          {/* Clean Right Action: SOS Trigger */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSosModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg text-xs font-black transition flex items-center space-x-1.5 shadow-md shadow-red-600/30 border border-red-400/30 animate-pulse"
              id="btn-header-sos"
              title="Emergency Highway SOS Rescue Dispatch"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SOS 100/103</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Unified Workspace */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Dynamic Intelligence & Control Hub */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col space-y-3.5">
          {/* Clean Active Module Header */}
          <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-800 shadow-lg flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                {activeTab === 'route' && <Compass className="w-4 h-4" />}
                {activeTab === 'incidents' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                {activeTab === 'weather' && <CloudFog className="w-4 h-4 text-indigo-400" />}
                {activeTab === 'pois' && <MapPin className="w-4 h-4 text-cyan-400" />}
                {activeTab === 'traffic' && <Activity className="w-4 h-4 text-amber-400" />}
                {activeTab === 'highways' && <Route className="w-4 h-4 text-purple-400" />}
                {activeTab === 'dialects' && <Languages className="w-4 h-4 text-teal-400" />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-white capitalize font-display">
                  {activeTab === 'route' && 'Route Planner & GIS Intelligence'}
                  {activeTab === 'incidents' && `Road Alerts & Hazards (${incidents.length})`}
                  {activeTab === 'weather' && 'Mountain Passes Weather Monitor'}
                  {activeTab === 'pois' && 'Highway POIs & EV Charging'}
                  {activeTab === 'traffic' && 'Traffic Chokepoints & Corridors'}
                  {activeTab === 'highways' && 'H01-H17 Highway Directory'}
                  {activeTab === 'dialects' && 'Regional Dialect Travel Phrases'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  Use left menu drawer or bottom footer to switch modules
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsLeftDrawerOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
              title="Open Navigation Menu"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>Menu</span>
            </button>
          </div>

          {/* Active Sub-panel Content */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-170px)] pr-1">
            {activeTab === 'route' && (
              <RoutePlanner
                initialOriginId={plannerOrigin}
                initialDestId={plannerDest}
                initialVehicle={plannerVehicle}
                initialPreference={plannerPref}
                onRouteCalculated={handleRouteCalculated}
                onViewOnMap={(target) => {
                  if (target && typeof target.lat === 'number' && typeof target.lng === 'number' && !isNaN(target.lat) && !isNaN(target.lng)) {
                    setFocusedTarget(target);
                  } else if (activeRoute?.origin?.lat != null && activeRoute?.destination?.lat != null) {
                    setFocusedTarget({
                      lat: (activeRoute.origin.lat + activeRoute.destination.lat) / 2,
                      lng: (activeRoute.origin.lng + activeRoute.destination.lng) / 2,
                      title: 'Planned Route',
                      zoom: 8,
                    });
                  }
                }}
              />
            )}

            {activeTab === 'incidents' && (
              <RoadAlertsFeed
                incidents={incidents}
                userReports={userReports}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onUpvoteReport={handleUpvote}
                onSelectIncident={(inc) => {
                  handleSelectIncident(inc);
                }}
              />
            )}

            {activeTab === 'weather' && (
              <WeatherPassesPanel
                weatherNodes={weatherNodes}
                onSelectNode={handleSelectWeatherNode}
                selectedNodeId={selectedWeatherId}
              />
            )}

            {activeTab === 'pois' && (
              <HighwayPOIsPanel
                pois={pois}
                onSelectPOI={handleSelectPOI}
                selectedPOIId={selectedPOIId}
              />
            )}

            {activeTab === 'traffic' && (
              <TrafficCorridorPanel
                corridors={trafficCorridors}
                onSelectCorridor={handleSelectTraffic}
                selectedCorridorId={selectedTrafficId}
              />
            )}

            {activeTab === 'highways' && (
              <HighwayDirectory
                onSelectHighwayOnMap={(highway) => {
                  if (highway.segments && highway.segments[0]) {
                    const firstCoord = highway.segments[0].coordinates[0];
                    setFocusedTarget({
                      lat: firstCoord[0],
                      lng: firstCoord[1],
                      title: highway.name,
                      zoom: 9,
                    });
                  }
                }}
                onPlanTripForHighway={(start, end) => {
                  setPlannerOrigin('ktm');
                  setPlannerDest('pkr');
                  setActiveTab('route');
                }}
              />
            )}

            {activeTab === 'dialects' && (
              <div className="lg:col-span-12 w-full py-2">
                <RegionalDialectPhrasesPanel
                  onNavigateToRoute={() => setActiveTab('route')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Full Screen Interactive GIS Map Companion */}
        <div className="lg:col-span-7 xl:col-span-7 h-[580px] lg:h-[calc(100vh-140px)] sticky top-[72px]">
          <InteractiveMap
            activeRoute={activeRoute}
            onSelectAlternativeRoute={(altRoute) => setActiveRoute(altRoute)}
            onSelectCity={handleSelectCityOnMap}
            focusedTarget={focusedTarget}
          />
        </div>
      </main>

      {/* Distance Matrix Modal */}
      <DistanceMatrixModal
        isOpen={isDistanceModalOpen}
        onClose={() => setIsDistanceModalOpen(false)}
        onSelectRoute={handleDistanceMatrixSelect}
      />

      {/* Road Hazard Report Modal */}
      <RoadReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onReportSubmitted={fetchLiveFeeds}
      />

      {/* Mountain Offline GIS & Tile Pack Manager Modal */}
      <OfflineManagerModal />

      {/* Hover-Open Expanding Footer Bar */}
      <footer 
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl transition-all duration-300 ease-in-out"
        onMouseEnter={() => setIsFooterExpanded(true)}
        onMouseLeave={() => setIsFooterExpanded(false)}
      >
        <div className="max-w-[1720px] mx-auto px-4 py-2 flex flex-col">
          {/* Expanded Menu Drawer / Quick Action Buttons with Icons (visible on hover) */}
          {isFooterExpanded && (
            <div className="py-3 mb-2 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-10 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {[
                { id: 'route', label: 'Route', icon: Compass, color: 'text-emerald-400' },
                { id: 'incidents', label: 'Alerts', icon: AlertTriangle, color: 'text-rose-400' },
                { id: 'weather', label: 'Weather', icon: CloudFog, color: 'text-indigo-400' },
                { id: 'pois', label: 'POIs/EV', icon: MapPin, color: 'text-cyan-400' },
                { id: 'traffic', label: 'Traffic', icon: Activity, color: 'text-amber-400' },
                { id: 'highways', label: 'H01-H17', icon: Route, color: 'text-purple-400' },
                { id: 'dialects', label: 'Dialects', icon: Languages, color: 'text-teal-400' },
                { action: () => setIsDistanceModalOpen(true), label: 'Matrix', icon: Calculator, color: 'text-cyan-300' },
                { action: () => setIsOfflineManagerOpen(true), label: 'Offline', icon: CloudDownload, color: 'text-amber-300' },
                { action: () => setIsReportModalOpen(true), label: 'Report', icon: PlusCircle, color: 'text-rose-300' },
              ].map((item, idx) => {
                const Icon = item.icon;
                const isTab = 'id' in item;
                const active = isTab && activeTab === item.id;
                return (
                  <button
                    key={isTab ? item.id : `action-${idx}`}
                    onClick={() => {
                      if (isTab) setActiveTab(item.id as SubViewTab);
                      else if (item.action) item.action();
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition border ${
                      active
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow'
                        : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Compact Footer Bar (always visible) */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
              <span className="flex items-center space-x-1.5 font-bold text-emerald-400">
                <Navigation className="w-3.5 h-3.5 transform -rotate-45" />
                <span>Mero Sadak GIS</span>
              </span>
              <span className="hidden sm:inline">• Hover bottom bar for quick action buttons</span>
            </div>

            <div className="flex items-center space-x-4 text-[11px] text-slate-400">
              <span className="hidden md:flex items-center space-x-1">
                <PhoneCall className="w-3 h-3 text-emerald-400" />
                <span>Traffic: <strong className="text-emerald-400">103</strong></span>
              </span>
              <span className="hidden md:inline text-slate-700">|</span>
              <span className="flex items-center space-x-1">
                <ShieldAlert className="w-3 h-3 text-red-400" />
                <span>Rescue: <strong className="text-red-400">1114</strong></span>
              </span>
              <button
                onClick={() => setIsFabVisible(!isFabVisible)}
                className="ml-2 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] transition"
              >
                {isFabVisible ? 'Hide FAB' : 'Show FAB'}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Left Menu Drawer */}
      {isLeftDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsLeftDrawerOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="relative w-80 max-w-full bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white">
                  <Navigation className="w-4 h-4 transform -rotate-45" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">Mero Sadak Menu</h3>
                  <p className="text-[10px] text-slate-400">Nepal Highway GIS Navigational Suite</p>
                </div>
              </div>
              <button
                onClick={() => setIsLeftDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">Navigation Modules</span>
                {[
                  { id: 'route', label: 'Route Planner & GIS', icon: Compass, color: 'text-emerald-400' },
                  { id: 'incidents', label: 'Road Alerts & Hazards', icon: AlertTriangle, color: 'text-rose-400' },
                  { id: 'weather', label: 'Mountain Weather Passes', icon: CloudFog, color: 'text-indigo-400' },
                  { id: 'pois', label: 'POIs & EV Fast Chargers', icon: MapPin, color: 'text-cyan-400' },
                  { id: 'traffic', label: 'Traffic Chokepoints', icon: Activity, color: 'text-amber-400' },
                  { id: 'highways', label: 'H01-H17 Highway Directory', icon: Route, color: 'text-purple-400' },
                  { id: 'dialects', label: 'Regional Dialect Phrases', icon: Languages, color: 'text-teal-400' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as SubViewTab);
                        setIsLeftDrawerOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">Quick Tools & Utilities</span>
                <button
                  onClick={() => {
                    setIsDistanceModalOpen(true);
                    setIsLeftDrawerOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  <Calculator className="w-4 h-4 text-cyan-400" />
                  <span>Distance Matrix Calculator</span>
                </button>
                <button
                  onClick={() => {
                    setIsOfflineManagerOpen(true);
                    setIsLeftDrawerOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  <CloudDownload className="w-4 h-4 text-amber-400" />
                  <span>Mountain Offline Tile Packs</span>
                </button>
                <button
                  onClick={() => {
                    setIsReportModalOpen(true);
                    setIsLeftDrawerOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  <PlusCircle className="w-4 h-4 text-rose-400" />
                  <span>Report Road Hazard</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer Controls */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
              <span>Mero Sadak v2.6</span>
              <button
                onClick={() => setIsFabVisible(!isFabVisible)}
                className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px]"
              >
                {isFabVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{isFabVisible ? 'Hide FAB' : 'Show FAB'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Highway SOS Rescue Assistant Modal */}
      <SosEmergencyModal
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
        activeRoute={activeRoute}
        defaultVehicle={plannerVehicle}
        onFocusCoordinatesOnMap={(lat, lng, title) => {
          setFocusedTarget({
            lat,
            lng,
            title,
            zoom: 13,
          });
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <OfflineProvider>
      <AppContent />
    </OfflineProvider>
  );
}
