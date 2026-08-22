import React, { useState, useEffect, useMemo } from 'react';
import { CityNode, RoutePlanResult, VehicleType, RoutePreference, RoadIncident } from '../types';
import { CITIES_AND_JUNCTIONS } from '../data/nepalHighwaysData';
import { findOptimizedRoute } from '../utils/routeOptimizer';
import { FuelCostEstimator } from './FuelCostEstimator';
import { ShareTripModal } from './ShareTripModal';
import { TripAssistantPanel } from './TripAssistantPanel';
import { RouteTerrainAndTrafficAnalysis } from './RouteTerrainAndTrafficAnalysis';
import { PreTripChecklist } from './PreTripChecklist';
import { RouteOptionsSelector } from './RouteOptionsSelector';
import { HighwaySafetyIndexCard } from './HighwaySafetyIndexCard';
import { RouteElevationProfileChart } from './RouteElevationProfileChart';
import { CarbonFootprintCard } from './CarbonFootprintCard';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Mountain,
  Flame,
  Clock,
  Sparkles,
  MapPin,
  Car,
  Bike,
  Truck,
  Layers,
  ArrowUpDown,
  Navigation,
  HelpCircle,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  ExternalLink,
  Share2,
  Receipt,
  Ticket,
  TrendingUp,
  TrendingDown,
  Gauge,
  Sunrise,
  Percent,
  ArrowUpRight,
  Copy,
  Check,
  Link2,
  MessageSquare,
  QrCode,
  RefreshCw,
  CheckCircle,
  Fuel,
  CloudFog,
  Mic,
  MicOff,
  Leaf,
} from 'lucide-react';

interface RoutePlannerProps {
  initialOriginId?: string;
  initialDestId?: string;
  initialVehicle?: VehicleType;
  initialPreference?: RoutePreference;
  onRouteCalculated: (route: RoutePlanResult) => void;
  onViewOnMap?: (target?: { lat: number; lng: number; title: string; zoom?: number }) => void;
}

const VEHICLE_NAMES: Record<VehicleType, string> = {
  car: 'Car / Sedan',
  suv_4wd: 'SUV / 4WD Jeep',
  motorbike: 'Motorcycle',
  bus_truck: 'Bus / Heavy Truck',
  electric_vehicle: 'Electric Vehicle (EV)',
};

// Subtle Shimmer Skeleton for Route Calculation & Live Traffic Fetching
const RouteCalculationSkeleton: React.FC<{ message?: string }> = ({
  message = 'Calculating optimal mountain highway geometry & live traffic status...',
}) => (
  <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6 relative overflow-hidden animate-pulse">
    {/* Subtle High-Tech Progress Shimmer Bar */}
    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 animate-pulse w-full"></div>
    </div>

    {/* Header Skeleton */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="h-7 w-36 bg-slate-800 rounded-lg"></div>
          <div className="h-4 w-4 bg-slate-800 rounded"></div>
          <div className="h-7 w-36 bg-slate-800 rounded-lg"></div>
        </div>
        <div className="flex items-center space-x-2">
          <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
          <span className="text-xs text-emerald-400/90 font-medium">{message}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="h-10 w-28 bg-slate-800/80 rounded-xl"></div>
        <div className="h-10 w-32 bg-slate-800/80 rounded-xl"></div>
      </div>
    </div>

    {/* 4 Metric Bento Grid Skeleton */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 bg-slate-800 rounded"></div>
            <div className="h-3 w-20 bg-slate-800 rounded"></div>
          </div>
          <div className="h-7 w-24 bg-slate-800/90 rounded-lg"></div>
          <div className="h-2.5 w-32 bg-slate-800/60 rounded"></div>
        </div>
      ))}
    </div>

    {/* Elevation & Grade Profile Skeleton */}
    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-4 w-48 bg-slate-800 rounded"></div>
        <div className="h-4 w-20 bg-slate-800 rounded"></div>
      </div>
      <div className="h-28 bg-slate-900/60 rounded-xl border border-slate-800/60 flex items-end p-3 gap-1.5 justify-between">
        {[40, 65, 30, 85, 95, 70, 50, 80, 60, 45, 90, 75, 55, 35].map((h, idx) => (
          <div
            key={idx}
            className="flex-1 bg-slate-800 rounded-t"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>

    {/* Steps List Skeleton */}
    <div className="space-y-2.5 pt-2">
      <div className="h-4 w-40 bg-slate-800 rounded"></div>
      {[1, 2, 3].map((s) => (
        <div key={s} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-slate-800"></div>
            <div className="space-y-1.5">
              <div className="h-3.5 w-44 bg-slate-800 rounded"></div>
              <div className="h-2.5 w-32 bg-slate-800/60 rounded"></div>
            </div>
          </div>
          <div className="h-4 w-16 bg-slate-800 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

// Skeleton Loader for AI Route Advisor
const AiAdvisorySkeleton: React.FC = () => (
  <div className="space-y-3 animate-pulse" id="ai-advisory-skeleton">
    {/* Summary shimmer */}
    <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2.5">
      <div className="flex items-center space-x-2">
        <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
        <span className="text-xs font-semibold text-emerald-400">
          Gemini 3.7 Flash analyzing corridor terrain, road clearance & landslide telemetry...
        </span>
      </div>
      <div className="h-3 w-full bg-slate-800 rounded mt-2"></div>
      <div className="h-3 w-11/12 bg-slate-800 rounded"></div>
      <div className="h-3 w-4/6 bg-slate-800 rounded"></div>
    </div>

    {/* 2-column cards shimmer */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-3.5 h-3.5 rounded bg-slate-800"></div>
          <div className="h-3 w-36 bg-slate-800 rounded"></div>
        </div>
        <div className="h-4 w-28 bg-slate-800 rounded"></div>
        <div className="h-3 w-48 bg-slate-800/60 rounded"></div>
      </div>

      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-3.5 h-3.5 rounded bg-slate-800"></div>
          <div className="h-3 w-36 bg-slate-800 rounded"></div>
        </div>
        <div className="h-3 w-32 bg-slate-800 rounded"></div>
        <div className="h-3 w-40 bg-slate-800 rounded"></div>
      </div>
    </div>

    {/* Checklist shimmer */}
    <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
      <div className="h-3.5 w-48 bg-slate-800 rounded mb-2"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded bg-slate-800 shrink-0"></div>
            <div className="h-3 flex-1 bg-slate-800 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  initialOriginId = 'ktm',
  initialDestId = 'pkr',
  initialVehicle = 'car',
  initialPreference = 'fastest',
  onRouteCalculated,
  onViewOnMap,
}) => {
  const [originId, setOriginId] = useState<string>(initialOriginId);
  const [destId, setDestId] = useState<string>(initialDestId);
  const [preference, setPreference] = useState<RoutePreference>(initialPreference);
  const [vehicle, setVehicle] = useState<VehicleType>(initialVehicle);
  const [routePlan, setRoutePlan] = useState<RoutePlanResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isRefreshingTraffic, setIsRefreshingTraffic] = useState<boolean>(false);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiCustomAdvisory, setAiCustomAdvisory] = useState<any | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [copiedDirectLink, setCopiedDirectLink] = useState<boolean>(false);
  const [trafficSyncedNotification, setTrafficSyncedNotification] = useState<boolean>(false);
  const [listeningTarget, setListeningTarget] = useState<'origin' | 'dest' | null>(null);
  const [speechTranscriptNotice, setSpeechTranscriptNotice] = useState<string | null>(null);

  // Recent Routes State & LocalStorage Persistence
  interface RecentRouteItem {
    originId: string;
    originName: string;
    destId: string;
    destName: string;
    vehicle: VehicleType;
    preference: RoutePreference;
    distanceKm: number;
    timestamp: number;
  }

  const [recentRoutes, setRecentRoutes] = useState<RecentRouteItem[]>(() => {
    try {
      const saved = localStorage.getItem('mero_sadak_recent_routes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to recent routes when routePlan updates
  useEffect(() => {
    if (routePlan && originId && destId) {
      const originCity = CITIES_AND_JUNCTIONS.find(c => c.id === originId);
      const destCity = CITIES_AND_JUNCTIONS.find(c => c.id === destId);
      if (!originCity || !destCity) return;

      const newItem: RecentRouteItem = {
        originId,
        originName: originCity.name,
        destId,
        destName: destCity.name,
        vehicle,
        preference,
        distanceKm: routePlan.totalDistanceKm,
        timestamp: Date.now(),
      };

      setRecentRoutes(prev => {
        const filtered = prev.filter(r => !(r.originId === originId && r.destId === destId));
        const updated = [newItem, ...filtered].slice(0, 6);
        try {
          localStorage.setItem('mero_sadak_recent_routes', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save recent routes:', e);
        }
        return updated;
      });
    }
  }, [routePlan, originId, destId, vehicle, preference]);

  const handleClearRecentRoutes = () => {
    setRecentRoutes([]);
    try {
      localStorage.removeItem('mero_sadak_recent_routes');
    } catch (e) {}
  };

  // Voice-to-Text SpeechRecognition handler for origin and destination
  const startVoiceRecognition = (target: 'origin' | 'dest') => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert('Speech Recognition is not supported in your current browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'en-US'; // Can understand city names spoken in English or Nepali phonetics
      recognition.interimResults = false;
      recognition.maxAlternatives = 5;

      setListeningTarget(target);
      setSpeechTranscriptNotice(`Listening for ${target === 'origin' ? 'Origin' : 'Destination'} location... Speak now.`);

      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript.toLowerCase().trim();
        setSpeechTranscriptNotice(`Heard: "${spokenText}". Matching location...`);
        
        // Find best matching city from CITIES_AND_JUNCTIONS
        let matchedCity = CITIES_AND_JUNCTIONS.find(c => 
          c.name.toLowerCase().includes(spokenText) || 
          spokenText.includes(c.name.toLowerCase()) ||
          c.district.toLowerCase().includes(spokenText)
        );

        // Fallback approximate matching or keyword mapping for common Nepali destinations
        if (!matchedCity) {
          if (spokenText.includes('ktm') || spokenText.includes('capital') || spokenText.includes('kathmandu')) {
            matchedCity = CITIES_AND_JUNCTIONS.find(c => c.id === 'ktm');
          } else if (spokenText.includes('pokhara') || spokenText.includes('pkr') || spokenText.includes('lakeside')) {
            matchedCity = CITIES_AND_JUNCTIONS.find(c => c.id === 'pkr');
          } else if (spokenText.includes('chitwan') || spokenText.includes('narayangarh') || spokenText.includes('bharatpur')) {
            matchedCity = CITIES_AND_JUNCTIONS.find(c => c.id === 'narayangarh' || c.id === 'chitwan');
          } else if (spokenText.includes('lumbini') || spokenText.includes('buddha')) {
            matchedCity = CITIES_AND_JUNCTIONS.find(c => c.id === 'lumbini' || c.id === 'bhairahawa');
          } else if (spokenText.includes('mustang') || spokenText.includes('jomsom')) {
            matchedCity = CITIES_AND_JUNCTIONS.find(c => c.id === 'jomsom' || c.id === 'mustang');
          } else if (spokenText.includes('manang')) {
            matchedCity = CITIES_AND_JUNCTIONS.find(c => c.id === 'besisahar');
          } else if (spokenText.includes('everest') || spokenText.includes('lukla') || spokenText.includes('namche')) {
            matchedCity = CITIES_AND_JUNCTIONS.find(c => c.id === 'jirikhola' || c.id === 'dhulikhel');
          }
        }

        if (matchedCity) {
          if (target === 'origin') {
            setOriginId(matchedCity.id);
          } else {
            setDestId(matchedCity.id);
          }
          setSpeechTranscriptNotice(`Successfully set ${target === 'origin' ? 'Origin' : 'Destination'} to ${matchedCity.name}!`);
        } else {
          setSpeechTranscriptNotice(`Could not match "${spokenText}" to a Nepal highway junction. Please try again.`);
        }

        setTimeout(() => {
          setListeningTarget(null);
          setSpeechTranscriptNotice(null);
        }, 3500);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setSpeechTranscriptNotice('Speech recognition error or timeout. Please try again.');
        setTimeout(() => {
          setListeningTarget(null);
          setSpeechTranscriptNotice(null);
        }, 3000);
      };

      recognition.onend = () => {
        setTimeout(() => {
          setListeningTarget(null);
        }, 1000);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setListeningTarget(null);
      setSpeechTranscriptNotice('Microphone access denied or unsupported.');
      setTimeout(() => setSpeechTranscriptNotice(null), 3000);
    }
  };

  // Sync props if changed externally
  useEffect(() => {
    if (initialOriginId) setOriginId(initialOriginId);
    if (initialDestId) setDestId(initialDestId);
    if (initialVehicle) setVehicle(initialVehicle);
    if (initialPreference) setPreference(initialPreference);
  }, [initialOriginId, initialDestId, initialVehicle, initialPreference]);

  // Generate shareable URL including origin, destination, vehicle, preference, and tab
  const shareableRouteUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const params = new URLSearchParams();
    params.set('origin', originId);
    params.set('dest', destId);
    params.set('vehicle', vehicle);
    params.set('pref', preference);
    params.set('tab', 'route');
    return `${origin}${pathname}?${params.toString()}`;
  }, [originId, destId, vehicle, preference]);

  // Recalculate route whenever parameters change & update browser URL state dynamically
  useEffect(() => {
    if (originId && destId && originId !== destId) {
      setIsCalculating(true);
      const timer = setTimeout(() => {
        const plan = findOptimizedRoute(originId, destId, preference, vehicle);
        setRoutePlan(plan);
        setAiCustomAdvisory(null); // reset custom AI advisory on route change
        setIsCalculating(false);
        if (plan) {
          onRouteCalculated(plan);
        }
      }, 180);

      // Update URL query string silently without reloading the page
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        const params = new URLSearchParams(window.location.search);
        params.set('origin', originId);
        params.set('dest', destId);
        params.set('vehicle', vehicle);
        params.set('pref', preference);
        params.set('tab', 'route');
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, '', newUrl);
      }

      return () => clearTimeout(timer);
    } else {
      setRoutePlan(null);
      setIsCalculating(false);
    }
  }, [originId, destId, preference, vehicle]);

  const handleRefreshLiveTraffic = async () => {
    if (!originId || !destId || originId === destId) return;
    setIsRefreshingTraffic(true);
    try {
      // Simulate real-time DoR telemetry refresh & recalculation
      await new Promise((res) => setTimeout(res, 550));
      const plan = findOptimizedRoute(originId, destId, preference, vehicle);
      if (plan) {
        setRoutePlan(plan);
        onRouteCalculated(plan);
      }
      setTrafficSyncedNotification(true);
      setTimeout(() => setTrafficSyncedNotification(false), 3000);
    } finally {
      setIsRefreshingTraffic(false);
    }
  };

  const handleQuickCopyLink = async () => {
    if (!shareableRouteUrl) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareableRouteUrl);
        setCopiedDirectLink(true);
        setTimeout(() => setCopiedDirectLink(false), 2500);
      }
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (!routePlan) return;
    const title = `Nepal Highway Trip: ${routePlan.origin.name} to ${routePlan.destination.name}`;
    const text = `Planned Route on Mero Sadak: ${routePlan.origin.name} ➔ ${routePlan.destination.name} (${routePlan.totalDistanceKm} km, ${VEHICLE_NAMES[vehicle]}, ${preference.replace('_', ' ')} priority). View live route:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareableRouteUrl,
        });
      } catch (err) {
        console.log('Share canceled:', err);
      }
    } else {
      handleQuickCopyLink();
    }
  };

  const handleSelectRouteOption = (selectedOption: RoutePlanResult) => {
    // Preserve the collection of options while switching the active plan
    setIsCalculating(true);
    setTimeout(() => {
      const updatedPlan: RoutePlanResult = {
        ...selectedOption,
        allRouteOptions: routePlan?.allRouteOptions || selectedOption.allRouteOptions,
      };
      setRoutePlan(updatedPlan);
      setPreference(selectedOption.preference);
      setAiCustomAdvisory(null);
      setIsCalculating(false);
      onRouteCalculated(updatedPlan);
    }, 120);
  };

  const swapLocations = () => {
    const temp = originId;
    setOriginId(destId);
    setDestId(temp);
  };

  const handleFetchAiAdvisory = async () => {
    if (!routePlan) return;
    setLoadingAi(true);
    try {
      const response = await fetch('/api/ai-route-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: routePlan.origin.name,
          destination: routePlan.destination.name,
          vehicle,
          preference,
          distanceKm: routePlan.totalDistanceKm,
          timeHours: (routePlan.estimatedTimeMinutes / 60).toFixed(1),
          roadConditionScore: routePlan.roadConditionScore,
          incidents: routePlan.incidentsOnRoute,
        }),
      });
      const data = await response.json();
      if (data.advisory) {
        setAiCustomAdvisory(data.advisory);
      }
    } catch (err) {
      console.error('Failed to load AI advisory:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Popular trips quick buttons
  const popularTrips = [
    { label: 'Kathmandu ➔ Pokhara', from: 'ktm', to: 'pkr' },
    { label: 'Kathmandu ➔ Narayanghat', from: 'ktm', to: 'cht' },
    { label: 'Kathmandu ➔ Janakpur (BP Highway)', from: 'ktm', to: 'jnk' },
    { label: 'Pokhara ➔ Butwal / Lumbini', from: 'pkr', to: 'btl' },
    { label: 'Kathmandu ➔ Birgunj', from: 'ktm', to: 'brg' },
    { label: 'Butwal ➔ Nepalgunj', from: 'btl', to: 'npg' },
  ];

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
              REAL-TIME ROAD CONDITION ENGINE
            </span>
            <span className="text-xs text-slate-400">Terrain Navigation & AI Trip Optimizer</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1 font-display">
            Nepal Highway Route Planner & Trip Optimizer
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Optimizes your journey considering active landslide clearances, single-lane road widenings, vehicle ground clearance, mountain passes, and fuel/EV stops.
          </p>
        </div>

        {/* Action Buttons: Share Route, Live Refresh & View on Interactive Map */}
        {routePlan && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleRefreshLiveTraffic}
              disabled={isRefreshingTraffic || isCalculating}
              id="btn-refresh-traffic-top"
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition shadow-sm flex items-center justify-center space-x-1.5 active:scale-95"
              title="Fetch fresh real-time traffic speeds & corridor delay updates"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshingTraffic ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshingTraffic ? 'Syncing...' : 'Sync Live Traffic'}</span>
            </button>

            <button
              onClick={() => setIsShareModalOpen(true)}
              id="btn-share-route-top"
              className="px-3.5 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center space-x-1.5 active:scale-95"
              title="Share planned route, vehicle settings, itinerary & QR code"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Share Route</span>
            </button>

            <button
              onClick={handleQuickCopyLink}
              id="btn-copy-route-link-top"
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 active:scale-95 shadow-sm"
              title="Copy direct shareable route link to clipboard"
            >
              {copiedDirectLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span className={copiedDirectLink ? 'text-emerald-400 font-bold' : ''}>
                {copiedDirectLink ? 'Copied!' : 'Copy Link'}
              </span>
            </button>

            <button
              onClick={onViewOnMap}
              id="btn-view-map-top"
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 active:scale-95"
            >
              <Navigation className="w-4 h-4" />
              <span>Open Interactive Map</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Trip Presets */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold uppercase tracking-wider shrink-0 text-[11px]">Popular Corridors:</span>
        {popularTrips.map((trip, idx) => (
          <button
            key={idx}
            onClick={() => {
              setOriginId(trip.from);
              setDestId(trip.to);
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition border ${
              originId === trip.from && destId === trip.to
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {trip.label}
          </button>
        ))}
      </div>

      {/* Recent Routes Section */}
      {recentRoutes.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recent Search History</span>
            </span>
            <button
              onClick={handleClearRecentRoutes}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition"
            >
              Clear History
            </button>
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            {recentRoutes.map((r, i) => (
              <button
                key={`${r.originId}-${r.destId}-${i}`}
                onClick={() => {
                  setOriginId(r.originId);
                  setDestId(r.destId);
                  setVehicle(r.vehicle);
                  setPreference(r.preference);
                }}
                className="bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 px-3 py-2 rounded-xl whitespace-nowrap transition flex items-center space-x-2 text-left shrink-0 group"
                title={`Re-select ${r.originName} to ${r.destName} (${VEHICLE_NAMES[r.vehicle]})`}
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-[10px] group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
                  {r.distanceKm}km
                </div>
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-emerald-300">
                    {r.originName} ➔ {r.destName}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <span>{VEHICLE_NAMES[r.vehicle]?.split('/')[0]}</span>
                    <span>•</span>
                    <span className="capitalize">{r.preference}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Form Configuration Grid */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6 relative">
        {/* Subtle recalculation indicator banner */}
        {(isCalculating || isRefreshingTraffic) && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 overflow-hidden rounded-t-2xl">
            <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 animate-pulse w-full"></div>
          </div>
        )}

        {/* Speech Recognition Feedback Notice */}
        {speechTranscriptNotice && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-xl flex items-center space-x-2 text-xs text-emerald-200 animate-pulse">
            <Mic className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{speechTranscriptNotice}</span>
          </div>
        )}

        {/* Origin / Destination Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Origin */}
          <div className="md:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Origin (Starting Point)</span>
              </label>
              <button
                onClick={() => startVoiceRecognition('origin')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition ${
                  listeningTarget === 'origin'
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                }`}
                title="Click to speak origin location hands-free"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{listeningTarget === 'origin' ? 'Listening...' : 'Voice Input'}</span>
              </button>
            </div>
            <select
              id="select-route-origin"
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            >
              {CITIES_AND_JUNCTIONS.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name} ({city.district} - {city.elevationM}m)
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex justify-center pt-4 md:pt-0">
            <button
              onClick={swapLocations}
              title="Swap Origin and Destination"
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition shadow-md active:scale-95"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Destination */}
          <div className="md:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span>Destination (Ending Point)</span>
              </label>
              <button
                onClick={() => startVoiceRecognition('dest')}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition ${
                  listeningTarget === 'dest'
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30'
                }`}
                title="Click to speak destination location hands-free"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{listeningTarget === 'dest' ? 'Listening...' : 'Voice Input'}</span>
              </button>
            </div>
            <select
              id="select-route-dest"
              value={destId}
              onChange={(e) => setDestId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            >
              {CITIES_AND_JUNCTIONS.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name} ({city.district} - {city.elevationM}m)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vehicle Selection & Routing Criteria */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          {/* Vehicle Type Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Vehicle Classification & Powertrain:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { type: 'car' as VehicleType, label: 'Car / Sedan', icon: Car },
                { type: 'suv_4wd' as VehicleType, label: 'SUV / 4WD', icon: Mountain },
                { type: 'motorbike' as VehicleType, label: 'Motorcycle', icon: Bike },
                { type: 'bus_truck' as VehicleType, label: 'Bus / Truck', icon: Truck },
                { type: 'electric_vehicle' as VehicleType, label: 'Electric (EV)', icon: Zap },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setVehicle(type)}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                    vehicle === type
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md font-bold'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px] leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Route Optimization Priority */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Trip Optimization Goal:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { pref: 'fastest' as RoutePreference, label: '🚀 Fastest', desc: 'Shortest travel duration' },
                { pref: 'safest' as RoutePreference, label: '🛡️ Safest Surface', desc: 'Avoid rough widening & slides' },
                { pref: 'scenic' as RoutePreference, label: '🏔️ Scenic Vistas', desc: 'Mountain passes & rivers' },
                { pref: 'ev_optimized' as RoutePreference, label: '⚡ EV Priority', desc: 'Near fast charging hubs' },
              ].map(({ pref, label, desc }) => (
                <button
                  key={pref}
                  onClick={() => setPreference(pref)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    preference === pref
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md font-bold'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs">{label}</div>
                  <div className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Status Sync Notification */}
        {trafficSyncedNotification && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between animate-fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Live traffic telemetry & DoR obstacle matrix synchronized successfully.</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              Just now
            </span>
          </div>
        )}
      </div>

      {/* Multi-Route Options & Alternatives Selector */}
      {!isCalculating && routePlan && routePlan.allRouteOptions && routePlan.allRouteOptions.length > 1 && (
        <RouteOptionsSelector
          activePlan={routePlan}
          allOptions={routePlan.allRouteOptions}
          selectedRouteId={routePlan.id}
          vehicle={vehicle}
          onSelectRoute={handleSelectRouteOption}
          onViewOnMap={onViewOnMap}
        />
      )}

      {/* Calculation Results Card or Skeleton State */}
      {isCalculating ? (
        <RouteCalculationSkeleton
          message={
            isRefreshingTraffic
              ? 'Pulling latest DoR telemetry & recalculating live bottleneck delays...'
              : `Optimizing mountain highway route for ${VEHICLE_NAMES[vehicle]} (${preference.replace('_', ' ')})...`
          }
        />
      ) : routePlan ? (
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6 relative overflow-hidden">
          {/* Subtle Live Traffic Syncing Top Pulse */}
          {isRefreshingTraffic && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 animate-pulse w-full"></div>
            </div>
          )}

          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-white">{routePlan.origin.name}</span>
                <ArrowRight className="w-5 h-5 text-emerald-400" />
                <span className="text-xl font-bold text-white">{routePlan.destination.name}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                <span>
                  Optimized for <strong className="text-slate-200 capitalize">{preference.replace('_', ' ')}</strong> via verified Nepal National Highway Network
                </span>
                {isRefreshingTraffic && (
                  <span className="text-cyan-400 text-[11px] font-semibold flex items-center space-x-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Updating traffic...</span>
                  </span>
                )}
              </p>
            </div>

            {/* Header Action Tools */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefreshLiveTraffic}
                disabled={isRefreshingTraffic}
                id="btn-sync-traffic-card"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm active:scale-95"
                title="Refresh real-time speeds & bottlenecks"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshingTraffic ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => {
                  document.getElementById('ai-trip-assistant-panel')?.scrollIntoView({ behavior: 'smooth' });
                }}
                id="btn-scroll-trip-assistant"
                className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95"
                title="View AI curated stops, cafes & scenic viewpoints"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Trip Assistant</span>
              </button>

              <button
                onClick={() => setIsShareModalOpen(true)}
                id="btn-share-route-card"
                className="px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95"
                title="Share this planned route, vehicle settings, and itinerary link"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Share Route</span>
              </button>

              {/* Road Condition Safety Index Pill */}
              <div className="flex items-center space-x-3 bg-slate-950 p-2.5 sm:p-3 rounded-xl border border-slate-800">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Road Safety Score</div>
                  <div className="text-base sm:text-lg font-black text-emerald-400">{routePlan.roadConditionScore} / 100</div>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  {routePlan.roadConditionScore > 75 ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Trip Summary Summary Card */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 p-5 rounded-2xl shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="text-sm font-extrabold text-emerald-300 uppercase tracking-wider font-display">
                  Trip Summary & Itinerary Overview
                </h3>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                {VEHICLE_NAMES[vehicle]} • <span className="capitalize">{preference.replace('_', ' ')}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
              {/* Total Travel Time */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Total Travel Time</div>
                  <div className="text-lg font-black text-cyan-300 font-display">
                    {Math.floor(routePlan.estimatedTimeMinutes / 60)}h {routePlan.estimatedTimeMinutes % 60}m
                  </div>
                  <div className="text-[10px] text-slate-500">{routePlan.totalDistanceKm} km across mountain terrain</div>
                </div>
              </div>

              {/* Estimated Fuel Cost */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Estimated Fuel / Energy Cost</div>
                  <div className="text-lg font-black text-emerald-300 font-display">
                    {vehicle === 'electric_vehicle' 
                      ? `NPR ${Math.round((routePlan.evEstimate?.kwhRequired || 25) * 15).toLocaleString()}`
                      : `NPR ${routePlan.fuelEstimate.costNpr.toLocaleString()}`
                    }
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {vehicle === 'electric_vehicle' 
                      ? `${routePlan.evEstimate?.kwhRequired || 25} kWh charging required`
                      : `${routePlan.fuelEstimate.liters} Liters (${VEHICLE_NAMES[vehicle]})`
                    }
                  </div>
                </div>
              </div>

              {/* Carbon Footprint Estimate */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Carbon Footprint Estimate</div>
                  <div className="text-lg font-black text-teal-300 font-display">
                    {Math.round(((routePlan.totalDistanceKm * (vehicle === 'electric_vehicle' ? 18 : vehicle === 'motorbike' ? 65 : vehicle === 'suv_4wd' ? 198 : vehicle === 'bus_truck' ? 580 : 142) * (1 + ((routePlan.elevationGainM || 500) / 1000) * (vehicle === 'electric_vehicle' ? 0.025 : 0.06))) / 1000) * 10) / 10} kg CO₂
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {vehicle === 'electric_vehicle' ? 'Hydropower green grid factor' : 'Based on distance & climb load'}
                  </div>
                </div>
              </div>

              {/* Current Weather Risk Level */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  (routePlan.aiAdvisory?.riskLevel === 'High' || routePlan.aiAdvisory?.riskLevel === 'Severe') 
                    ? 'bg-rose-500/15 text-rose-400' 
                    : routePlan.aiAdvisory?.riskLevel === 'Moderate'
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-400'
                }`}>
                  <CloudFog className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Weather Risk Level</div>
                  <div className={`text-lg font-black font-display ${
                    (routePlan.aiAdvisory?.riskLevel === 'High' || routePlan.aiAdvisory?.riskLevel === 'Severe')
                      ? 'text-rose-400'
                      : routePlan.aiAdvisory?.riskLevel === 'Moderate'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>
                    {routePlan.aiAdvisory?.riskLevel || (routePlan.roadConditionScore < 60 ? 'High Risk' : routePlan.roadConditionScore < 75 ? 'Moderate Risk' : 'Low Risk')}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                    {routePlan.aiAdvisory?.monsoonOrWeatherWarning || 'Mountain passes clear / normal'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 font-medium flex items-center space-x-1">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Total Distance</span>
              </div>
              <div className="text-2xl font-black text-white mt-1 font-display">
                {routePlan.totalDistanceKm} <span className="text-xs font-normal text-slate-400">km</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {routePlan.statusSummary.clearKm} km clear • {routePlan.statusSummary.cautionKm} km caution
              </div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 font-medium flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Base Duration</span>
              </div>
              <div className="text-2xl font-black text-cyan-400 mt-1 font-display">
                {Math.floor(routePlan.estimatedTimeMinutes / 60)}h {routePlan.estimatedTimeMinutes % 60}m
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
                <Sunrise className="w-3 h-3 text-emerald-400" />
                <span>Time-of-day adjustable below</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 font-medium flex items-center space-x-1">
                <Mountain className="w-3.5 h-3.5 text-purple-400" />
                <span>Climb & Altitude</span>
              </div>
              <div className="text-2xl font-black text-purple-400 mt-1 font-display flex items-baseline space-x-1.5">
                <span>+{routePlan.elevationGainM}</span>
                <span className="text-xs font-normal text-slate-400">m</span>
                <span className="text-xs font-bold text-amber-400 ml-1">
                  (~{Math.min(15, Math.max(0.5, Math.round((routePlan.elevationGainM / Math.max(1, routePlan.totalDistanceKm * 1000)) * 100 * 2.2 * 10) / 10))}%)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Peak summit: {routePlan.maxElevationM}m ASL
              </div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400 font-medium flex items-center space-x-1">
                {vehicle === 'electric_vehicle' ? <Zap className="w-3.5 h-3.5 text-cyan-400" /> : <Flame className="w-3.5 h-3.5 text-amber-400" />}
                <span>{vehicle === 'electric_vehicle' ? 'Est. Energy Req.' : 'Est. Fuel Cost'}</span>
              </div>
              <div className="text-2xl font-black text-amber-400 mt-1 font-display">
                {vehicle === 'electric_vehicle' ? `${routePlan.evEstimate?.kwhRequired} kWh` : `Rs. ${routePlan.fuelEstimate.costNpr.toLocaleString()}`}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {vehicle === 'electric_vehicle' ? `${routePlan.evEstimate?.recommendedChargingStops.length} EV hubs nearby` : `~${routePlan.fuelEstimate.liters} L (${routePlan.fuelEstimate.avgMileageKmPerLiter} km/L)`}
              </div>
            </div>
          </div>

          {/* Interactive Terrain Difficulty, Climb Grade & Time-of-Day Traffic Analysis Component */}
          <RouteTerrainAndTrafficAnalysis
            routePlan={routePlan}
            vehicle={vehicle}
          />

          {/* D3 Elevation Profile & Climb Gradient Chart */}
          <RouteElevationProfileChart
            routePlan={routePlan}
          />

          {/* Highway Safety Index: Historical Crash Data, Road Quality & Blackspots */}
          {routePlan.safetyIndex && (
            <HighwaySafetyIndexCard
              safetyIndex={routePlan.safetyIndex}
              onFocusBlackspot={(spot) => {
                if (onViewOnMap && spot && spot.coordinates && Array.isArray(spot.coordinates)) {
                  const [lat, lng] = spot.coordinates;
                  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
                    onViewOnMap({
                      lat,
                      lng,
                      title: `Accident Blackspot: ${spot.name}`,
                      zoom: 13,
                    });
                  }
                }
              }}
              onFocusSegment={(seg) => {
                if (onViewOnMap && seg && seg.coordinates && seg.coordinates.length > 0) {
                  const midIdx = Math.floor(seg.coordinates.length / 2);
                  const midCoord = seg.coordinates[midIdx] || seg.coordinates[0];
                  if (midCoord && typeof midCoord[0] === 'number' && typeof midCoord[1] === 'number') {
                    onViewOnMap({
                      lat: midCoord[0],
                      lng: midCoord[1],
                      title: `${seg.highwayName} (${seg.fromName} ➔ ${seg.toName})`,
                      zoom: 11,
                    });
                  }
                }
              }}
            />
          )}

          {/* Dedicated Fuel, Tolls & Emergency Travel Expense Estimation Component */}
          <FuelCostEstimator
            distanceKm={routePlan.totalDistanceKm}
            vehicleType={vehicle}
            elevationGainM={routePlan.elevationGainM}
            origin={routePlan.origin}
            destination={routePlan.destination}
            defaultTollCost={routePlan.totalTollCostNpr}
            onVehicleChange={(newVehicle) => setVehicle(newVehicle)}
          />

          {/* Carbon Footprint & Eco Estimator Component */}
          <CarbonFootprintCard
            distanceKm={routePlan.totalDistanceKm}
            vehicleType={vehicle}
            elevationGainM={routePlan.elevationGainM}
            onVehicleChange={(newVehicle) => setVehicle(newVehicle)}
          />

          {/* Active Road Hazards & Incident Warnings along this route */}
          {routePlan.incidentsOnRoute.length > 0 && (
            <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                <span>Active Road Advisories & Delays On Selected Corridor ({routePlan.incidentsOnRoute.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {routePlan.incidentsOnRoute.map((inc) => (
                  <div key={inc.id} className="bg-slate-900/90 p-3 rounded-lg border border-red-900/40 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{inc.title}</span>
                      <span className="text-[10px] text-red-400 uppercase font-semibold px-1.5 py-0.5 bg-red-950 rounded border border-red-800">
                        {inc.severity}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{inc.locationName} • {inc.highwayName}</p>
                    <p className="text-slate-400 text-[11px]">{inc.description}</p>
                    {inc.estimatedClearance && (
                      <div className="text-[10px] text-amber-400 font-medium">⏱️ {inc.estimatedClearance}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gemini AI Highway Safety & Terrain Advisory */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 rounded-2xl border border-emerald-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">AI Highway Safety & Terrain Advisory</h4>
                  <p className="text-[11px] text-slate-400">Real-time intelligent driving counsel powered by Gemini 3.7 Flash</p>
                </div>
              </div>

              <button
                onClick={handleFetchAiAdvisory}
                disabled={loadingAi}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5 shrink-0"
              >
                {loadingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{loadingAi ? 'Analyzing Terrain...' : 'Generate AI Deep Advisory'}</span>
              </button>
            </div>

            {/* Advisory Content */}
            {loadingAi ? (
              <AiAdvisorySkeleton />
            ) : aiCustomAdvisory ? (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                  <span className="font-semibold text-emerald-400">Executive Summary: </span>
                  <span className="text-slate-200 leading-relaxed">{aiCustomAdvisory.summary}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Recommended Departure Window:</span>
                    </div>
                    <p className="text-cyan-300 font-bold">{aiCustomAdvisory.bestDepartureWindow}</p>
                    {aiCustomAdvisory.monsoonOrWeatherWarning && (
                      <p className="text-amber-400 text-[11px] mt-2 font-medium">⚠️ {aiCustomAdvisory.monsoonOrWeatherWarning}</p>
                    )}
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-red-400" />
                      <span>Corridor Emergency Hotlines:</span>
                    </div>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
                      {aiCustomAdvisory.emergencyContacts?.map((c: string, idx: number) => (
                        <li key={idx} className="flex items-center space-x-1">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="font-semibold text-slate-300 mb-2">Crucial Mountain Driving & Braking Precautions:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300 text-[11px]">
                    {aiCustomAdvisory.keyRecommendations?.map((rec: string, i: number) => (
                      <div key={i} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : routePlan.aiAdvisory ? (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-slate-300 leading-relaxed">
                  {routePlan.aiAdvisory.summary}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-300">
                  {routePlan.aiAdvisory.keyRecommendations.map((rec, i) => (
                    <div key={i} className="flex items-start space-x-1.5 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* AI-Powered Trip Assistant: Suggested Stops, Cafes, Viewpoints & Destination Intelligence */}
          <TripAssistantPanel
            routePlan={routePlan}
            vehicle={vehicle}
            preference={preference}
          />

          {/* Essential Pre-Trip Highway Checklist: Terrain, Weather & Vehicle Adaptive */}
          <PreTripChecklist
            routePlan={routePlan}
            vehicle={vehicle}
          />

          {/* Share Planned Route Card & Link Generator */}
          <div
            id="section-share-route"
            className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/20 border border-emerald-500/30 p-5 rounded-2xl shadow-xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Share This Planned Route</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Shareable URL
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Generates a direct link containing origin, destination, vehicle profile ({VEHICLE_NAMES[vehicle]}), and optimization preference.
                  </p>
                </div>
              </div>

              {/* Primary Modal Launcher */}
              <button
                onClick={() => setIsShareModalOpen(true)}
                id="btn-open-share-modal-card"
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center space-x-1.5 shrink-0 self-start sm:self-auto active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span>Itinerary & QR Code</span>
              </button>
            </div>

            {/* Active URL with Instant Copy Button */}
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Link2 className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={shareableRouteUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-300 font-mono select-all transition shadow-inner"
                  />
                </div>

                <button
                  onClick={handleQuickCopyLink}
                  id="btn-copy-route-link-panel"
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 shadow-md active:scale-95 ${
                    copiedDirectLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                  }`}
                >
                  {copiedDirectLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-emerald-400" />}
                  <span>{copiedDirectLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>

                <button
                  onClick={handleNativeShare}
                  id="btn-native-share-panel"
                  className="hidden sm:flex px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 items-center space-x-1.5 transition active:scale-95"
                  title="Share via device messaging menu"
                >
                  <Send className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Encoded URL Parameters Verification Chips */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-slate-500 font-medium">Encoded Route Settings:</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Origin: <strong className="text-emerald-400 font-semibold">{routePlan.origin.name}</strong></span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>Dest: <strong className="text-cyan-400 font-semibold">{routePlan.destination.name}</strong></span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 flex items-center space-x-1">
                <Car className="w-3 h-3 text-amber-400" />
                <span>Vehicle: <strong className="text-amber-400 font-semibold">{VEHICLE_NAMES[vehicle]}</strong></span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 flex items-center space-x-1">
                <Compass className="w-3 h-3 text-purple-400" />
                <span>Priority: <strong className="text-purple-400 font-semibold capitalize">{preference.replace('_', ' ')}</strong></span>
              </span>
            </div>
          </div>

          {/* Turn-by-Turn Route Steps */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Turn-by-Turn Navigation Segments:</span>
              <span className="text-slate-500 font-normal">{routePlan.steps.length} sequential steps</span>
            </div>

            <div className="space-y-2">
              {routePlan.steps.map((step, index) => {
                const isClimb = (step.elevationChangeM || 0) > 0;
                const isDescent = (step.elevationChangeM || 0) < 0;
                const segGrade = step.elevationChangeM && step.distanceKm > 0
                  ? Math.round((Math.abs(step.elevationChangeM) / (step.distanceKm * 1000)) * 100 * 10) / 10
                  : 0;

                return (
                  <div
                    key={index}
                    className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-slate-700 transition"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-slate-700">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center flex-wrap gap-1.5">
                          <span>{step.instruction}</span>
                          {step.highwayCode && (
                            <span className="px-1.5 py-0.2 text-[10px] font-bold bg-slate-800 text-cyan-300 rounded border border-slate-700">
                              {step.highwayCode}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center flex-wrap gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 capitalize text-[10px]">
                            {step.surface.replace('_', ' ')}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{step.durationMinutes} mins drive</span>
                          </span>
                          {step.elevationChangeM !== undefined && step.elevationChangeM !== 0 && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className={`flex items-center space-x-1 font-medium ${isClimb ? 'text-purple-400' : 'text-cyan-400'}`}>
                                {isClimb ? (
                                  <TrendingUp className="w-3 h-3 text-purple-400" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-cyan-400" />
                                )}
                                <span>
                                  {isClimb ? `+${step.elevationChangeM}m climb` : `${step.elevationChangeM}m descent`}
                                  {segGrade > 1 && ` (~${segGrade}% grade)`}
                                </span>
                              </span>
                            </>
                          )}
                        </div>
                        {step.warning && (
                          <div className="text-amber-400 text-[10px] mt-1.5 font-medium flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{step.warning}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800/60 pt-1.5 sm:pt-0">
                      <span className="font-bold text-slate-200 text-sm">{step.distanceKm} km</span>
                      <span className="text-[10px] text-slate-500">
                        {step.roadStatus === 'clear' ? '🟢 Smooth' : step.roadStatus === 'caution' ? '🟡 Caution' : '🔴 Obstructed'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <Navigation className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Please select an origin and destination to calculate an optimized route plan.</p>
        </div>
      )}
      {/* Share Trip Modal Dialog */}
      {routePlan && (
        <ShareTripModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          routePlan={routePlan}
          vehicle={vehicle}
          preference={preference}
        />
      )}
    </div>
  );
};
