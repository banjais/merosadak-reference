import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Highway,
  CityNode,
  RoadIncident,
  RoutePlanResult,
  HighwayWeatherNode,
  HighwayPOI,
  TrafficCorridor,
  KnownBlackspot,
  SegmentSafetyData,
} from '../types';
import {
  NEPAL_HIGHWAYS,
  CITIES_AND_JUNCTIONS,
  LIVE_ROAD_INCIDENTS,
  HIGHWAY_WEATHER_NODES,
  HIGHWAY_POIS,
  TRAFFIC_CORRIDORS,
} from '../data/nepalHighwaysData';
import { NEPAL_HIGHWAY_BLACKSPOTS } from '../data/accidentBlackspotsData';
import {
  Zap,
  AlertTriangle,
  Layers,
  Navigation,
  ShieldCheck,
  MapPin,
  ZoomIn,
  RefreshCw,
  CloudRain,
  Activity,
  Eye,
  Compass,
  Fuel,
  Utensils,
  Mountain,
  Ticket,
  ShieldAlert,
  Gauge,
  Map,
  Globe,
} from 'lucide-react';

interface InteractiveMapProps {
  activeRoute: RoutePlanResult | null;
  onSelectAlternativeRoute?: (route: RoutePlanResult) => void;
  onSelectCity?: (city: CityNode, type: 'origin' | 'destination') => void;
  onSelectHighway?: (highway: Highway) => void;
  onSelectBlackspot?: (blackspot: KnownBlackspot) => void;
  focusedTarget?: { lat: number; lng: number; title: string; zoom?: number } | null;
  colorMode?: 'safety' | 'preference';
  onToggleColorMode?: (mode: 'safety' | 'preference') => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  activeRoute,
  onSelectAlternativeRoute,
  onSelectCity,
  onSelectHighway,
  onSelectBlackspot,
  focusedTarget,
  colorMode: externalColorMode,
  onToggleColorMode: externalToggleColorMode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    highways: L.LayerGroup;
    cities: L.LayerGroup;
    incidents: L.LayerGroup;
    weather: L.LayerGroup;
    pois: L.LayerGroup;
    traffic: L.LayerGroup;
    blackspots: L.LayerGroup;
    route: L.LayerGroup;
    alternatives: L.LayerGroup;
    offlineOverlay: L.LayerGroup;
  }>({
    highways: L.layerGroup(),
    cities: L.layerGroup(),
    incidents: L.layerGroup(),
    weather: L.layerGroup(),
    pois: L.layerGroup(),
    traffic: L.layerGroup(),
    blackspots: L.layerGroup(),
    route: L.layerGroup(),
    alternatives: L.layerGroup(),
    offlineOverlay: L.layerGroup(),
  });

  // Layer Toggles
  const [showHighways, setShowHighways] = useState(true);
  const [showAlternatives, setShowAlternatives] = useState(true);
  const [isToolbarOpen, setIsToolbarOpen] = useState(true);

  // Hidden/disabled layer stubs
  const showTraffic = false;
  const showIncidents = false;
  const showWeather = false;
  const showPOIs = false;
  const showCities = false;
  const showBlackspots = false;
  const routeColorMode = 'safety' as const;

  // Active highway card
  const [activeHighwayInfo, setActiveHighwayInfo] = useState<Highway | null>(null);

  // Map Style: Standard, Satellite, Terrain
  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite' | 'terrain'>('standard');
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [27.95, 84.6],
      zoom: 7,
      minZoom: 6,
      maxZoom: 17,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    layersRef.current.highways.addTo(map);
    layersRef.current.alternatives.addTo(map);
    layersRef.current.route.addTo(map);
    layersRef.current.offlineOverlay.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer based on mapStyle
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; <a href="https://carto.com/">CARTO</a> | DOR Nepal Highway GIS';
    let maxZoom = 19;

    if (mapStyle === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    } else if (mapStyle === 'terrain') {
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attribution = 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)';
      maxZoom = 17;
    }

    const newLayer = L.tileLayer(url, {
      attribution,
      subdomains: mapStyle === 'standard' ? 'abcd' : 'abc',
      maxZoom,
    });

    newLayer.addTo(map);
    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Handle focused target flight
  useEffect(() => {
    if (!mapInstanceRef.current || !focusedTarget) return;
    if (
      typeof focusedTarget.lat !== 'number' ||
      typeof focusedTarget.lng !== 'number' ||
      isNaN(focusedTarget.lat) ||
      isNaN(focusedTarget.lng)
    ) {
      return;
    }
    mapInstanceRef.current.flyTo([focusedTarget.lat, focusedTarget.lng], focusedTarget.zoom || 11, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [focusedTarget]);

  // Render Highways Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const highwaysGroup = layersRef.current.highways;
    highwaysGroup.clearLayers();

    if (!showHighways) return;

    NEPAL_HIGHWAYS.forEach((highway) => {
      highway.segments.forEach((seg) => {
        const color = seg.status === 'clear' ? '#10b981' : seg.status === 'caution' ? '#f59e0b' : '#ef4444';
        const weight = seg.lanes >= 4 ? 6 : 4;
        const opacity = 0.85;

        const polyline = L.polyline(seg.coordinates, {
          color,
          weight,
          opacity,
          lineJoin: 'round',
          lineCap: 'round',
        });

        polyline.on('mouseover', function () {
          this.setStyle({ weight: weight + 3, opacity: 1.0 });
        });
        polyline.on('mouseout', function () {
          this.setStyle({ weight, opacity });
        });

        polyline.on('click', () => {
          setActiveHighwayInfo(highway);
          if (onSelectHighway) onSelectHighway(highway);
        });

        highwaysGroup.addLayer(polyline);
      });
    });
  }, [showHighways, onSelectHighway]);

  // Render Cached Offline Geographical Bounds Overlay
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const offlineGroup = layersRef.current.offlineOverlay;
    offlineGroup.clearLayers();

    // Nepal Bounding Box covered by cached offline pack (Lat: 26.3 to 30.5, Lng: 80.0 to 88.3)
    // Plus key mountain corridor buffers
    const nepalOfflineBounds: [number, number][] = [
      [26.3, 80.0],
      [26.3, 88.3],
      [30.5, 88.3],
      [30.5, 80.0],
    ];

    // Semi-transparent emerald offline availability polygon
    const offlinePolygon = L.polygon(nepalOfflineBounds, {
      color: '#10b981',
      weight: 2,
      opacity: 0.6,
      fillColor: '#10b981',
      fillOpacity: 0.12,
      dashArray: '6, 6',
    });

    offlineGroup.addLayer(offlinePolygon);
  }, []);

  // Render Live Traffic Corridors Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const trafficGroup = layersRef.current.traffic;
    trafficGroup.clearLayers();

    if (!showTraffic) return;

    TRAFFIC_CORRIDORS.forEach((corridor) => {
      const color =
        corridor.level === 'smooth'
          ? '#10b981'
          : corridor.level === 'moderate'
          ? '#f59e0b'
          : corridor.level === 'heavy'
          ? '#f97316'
          : '#ef4444';

      const polyline = L.polyline([corridor.startCoord, corridor.endCoord], {
        color,
        weight: 8,
        opacity: 0.6,
        dashArray: corridor.level === 'standstill' ? '5, 10' : undefined,
      });

      polyline.bindPopup(`
        <div class="space-y-1.5 text-xs font-sans">
          <div class="flex items-center justify-between font-bold border-b border-slate-700 pb-1">
            <span class="text-amber-400 font-bold">${corridor.name}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-white font-mono">${corridor.highwayCode}</span>
          </div>
          <div class="text-slate-300 font-medium">${corridor.section}</div>
          <div class="grid grid-cols-2 gap-2 text-[11px] bg-slate-900 p-2 rounded mt-1 border border-slate-800">
            <div>Avg Speed: <strong class="text-cyan-400">${corridor.avgSpeedKmh} km/h</strong></div>
            <div>Delay: <strong class="text-rose-400">+${corridor.delayMinutes} mins</strong></div>
          </div>
          <p class="text-slate-400 text-[11px] mt-1">${corridor.cause}</p>
        </div>
      `);

      trafficGroup.addLayer(polyline);
    });
  }, [showTraffic]);

  // Render Incidents & Road Hazards Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const incidentsGroup = layersRef.current.incidents;
    incidentsGroup.clearLayers();

    if (!showIncidents) return;

    LIVE_ROAD_INCIDENTS.forEach((inc) => {
      const isCritical = inc.severity === 'critical' || inc.severity === 'severe';
      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="absolute w-10 h-10 ${
            isCritical ? 'bg-rose-500/50 animate-ping' : 'bg-amber-500/40 animate-pulse'
          } rounded-full duration-1000"></div>
          <div class="absolute w-14 h-14 ${
            isCritical ? 'bg-rose-600/25' : 'bg-amber-600/25'
          } rounded-full animate-pulse"></div>
          <div class="relative w-8 h-8 ${
            isCritical ? 'bg-rose-600 border-rose-200 text-white shadow-rose-500/60' : 'bg-amber-600 border-amber-200 text-white shadow-amber-500/60'
          } rounded-full flex items-center justify-center shadow-xl border-2 text-[14px] font-bold">
            ${isCritical ? '🚨' : '⚠️'}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-incident-marker',
        html: markerHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([inc.lat, inc.lng], { icon });

      incidentsGroup.addLayer(marker);
    });
  }, [showIncidents]);

  // Render Highway Weather Nodes Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const weatherGroup = layersRef.current.weather;
    weatherGroup.clearLayers();

    if (!showWeather) return;

    HIGHWAY_WEATHER_NODES.forEach((wx) => {
      const isHighRisk = wx.landslideRisk === 'high' || wx.landslideRisk === 'severe' || wx.visibilityKm < 3 || wx.rainProbabilityPercent > 70 || wx.condition === 'thunderstorm' || wx.condition === 'rain_monsoon' || wx.condition === 'dense_fog';
      const isRain = wx.condition === 'rain_monsoon' || wx.condition === 'thunderstorm' || wx.condition === 'mountain_shower';
      const isFog = wx.condition === 'dense_fog';

      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${isHighRisk ? `
            <div class="absolute w-14 h-14 ${
              wx.landslideRisk === 'severe' || wx.condition === 'thunderstorm' ? 'bg-rose-500/40 animate-ping' : 'bg-blue-500/40 animate-pulse'
            } rounded-full duration-1000"></div>
            <div class="absolute w-16 h-16 bg-amber-500/20 rounded-full animate-pulse"></div>
          ` : ''}
          <div class="relative px-2.5 py-1.5 rounded-full ${
            isHighRisk
              ? (wx.landslideRisk === 'severe' || wx.condition === 'thunderstorm' ? 'bg-rose-950/95 border-rose-500 text-rose-200 shadow-rose-500/40' : 'bg-blue-950/95 border-blue-400 text-blue-200 shadow-blue-500/40')
              : isRain
              ? 'bg-blue-900/90 border-blue-400 text-blue-200'
              : isFog
              ? 'bg-slate-800/90 border-slate-400 text-slate-200'
              : 'bg-amber-900/90 border-amber-400 text-amber-200'
          } border-2 shadow-xl flex items-center space-x-1.5 text-[11px] font-bold whitespace-nowrap">
            <span>${isHighRisk ? '⚡' : ''}${isRain ? '🌧️' : isFog ? '🌫️' : '☀️'}</span>
            <span>${wx.tempC}°C</span>
            ${isHighRisk ? `<span class="text-[9px] px-1 rounded bg-rose-500/30 text-rose-200 font-extrabold uppercase">${wx.landslideRisk || 'Risk'}</span>` : ''}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-weather-marker',
        html: markerHtml,
        iconSize: [isHighRisk ? 90 : 54, 30],
        iconAnchor: [isHighRisk ? 45 : 27, 15],
      });

      const marker = L.marker([wx.lat, wx.lng], { icon });

      weatherGroup.addLayer(marker);
    });
  }, [showWeather]);

  // Render POIs Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const poisGroup = layersRef.current.pois;
    poisGroup.clearLayers();

    if (!showPOIs) return;

    HIGHWAY_POIS.forEach((poi) => {
      let iconEmoji = '📍';
      let bgColor = 'bg-cyan-600 border-cyan-300';
      if (poi.category === 'ev_charger') {
        iconEmoji = '⚡';
        bgColor = 'bg-cyan-600 border-cyan-300';
      } else if (poi.category === 'food_rest') {
        iconEmoji = '🍲';
        bgColor = 'bg-amber-600 border-amber-300';
      } else if (poi.category === 'fuel_station') {
        iconEmoji = '⛽';
        bgColor = 'bg-emerald-600 border-emerald-300';
      } else if (poi.category === 'scenic_pass') {
        iconEmoji = '🏔️';
        bgColor = 'bg-purple-600 border-purple-300';
      } else if (poi.category === 'emergency_dor') {
        iconEmoji = '🚨';
        bgColor = 'bg-rose-600 border-rose-300';
      } else if (poi.category === 'toll_plaza') {
        iconEmoji = '🎟️';
        bgColor = 'bg-blue-600 border-blue-300';
      }

      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer">
          <div class="w-6 h-6 ${bgColor} rounded-full flex items-center justify-center shadow-md border text-[11px]">
            ${iconEmoji}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-poi-marker',
        html: markerHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([poi.lat, poi.lng], { icon });

      poisGroup.addLayer(marker);
    });
  }, [showPOIs]);

  // Render Cities Layer (Only cities lying on Nepal highways or chosen route)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const citiesGroup = layersRef.current.cities;
    citiesGroup.clearLayers();

    if (!showCities) return;

    CITIES_AND_JUNCTIONS.forEach((city) => {
      // Check if city lies on any highway segment or has connected highways
      const liesOnHighway = NEPAL_HIGHWAYS.some((highway) =>
        highway.segments.some(
          (seg) =>
            seg.from.toLowerCase().includes(city.name.toLowerCase()) ||
            seg.to.toLowerCase().includes(city.name.toLowerCase()) ||
            city.name.toLowerCase().includes(seg.from.toLowerCase()) ||
            city.name.toLowerCase().includes(seg.to.toLowerCase())
        ) ||
        (city.connectedHighways && city.connectedHighways.length > 0)
      );

      const isInRoute = activeRoute && (
        activeRoute.originCityId === city.id ||
        activeRoute.destCityId === city.id ||
        (activeRoute.routePath && activeRoute.routePath.some(pt => Math.abs(pt.lat - city.lat) < 0.12 && Math.abs(pt.lng - city.lng) < 0.12)) ||
        (activeRoute.pathCoordinates && activeRoute.pathCoordinates.some(coord => Math.abs(coord[0] - city.lat) < 0.15 && Math.abs(coord[1] - city.lng) < 0.15)) ||
        (activeRoute.steps && activeRoute.steps.some(step => 
          (step.from && step.from.id === city.id) ||
          (step.to && step.to.id === city.id) ||
          (step.from && Math.abs(step.from.lat - city.lat) < 0.15 && Math.abs(step.from.lng - city.lng) < 0.15) ||
          (step.to && Math.abs(step.to.lat - city.lat) < 0.15 && Math.abs(step.to.lng - city.lng) < 0.15)
        ))
      );

      // Only display city if it lies on a highway network or is part of the user's chosen route
      if (activeRoute) {
        if (!isInRoute) return;
      } else {
        if (!liesOnHighway) return;
      }

      const isHub = city.isMajorHub;
      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="${
            isHub ? 'w-3.5 h-3.5 bg-emerald-500 ring-4 ring-emerald-500/20' : 'w-2.5 h-2.5 bg-slate-400 ring-2 ring-slate-600'
          } rounded-full shadow-md"></div>
          <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-950/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow border border-slate-800 whitespace-nowrap pointer-events-none">
            ${city.name}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-city-marker',
        html: markerHtml,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([city.lat, city.lng], { icon });

      marker.on('click', () => {
        if (onSelectCity) onSelectCity(city, 'origin');
      });

      citiesGroup.addLayer(marker);
    });
  }, [showCities, activeRoute, onSelectCity]);

  // Render Blackspots Layer (Global Nepal Accident Blackspots)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const blackspotsGroup = layersRef.current.blackspots;
    blackspotsGroup.clearLayers();

    if (!showBlackspots) return;

    NEPAL_HIGHWAY_BLACKSPOTS.forEach((spot) => {
      const isExtreme = spot.riskLevel === 'critical';
      const markerColor = isExtreme ? '#ef4444' : spot.riskLevel === 'high' ? '#f97316' : '#f59e0b';

      const customIcon = L.divIcon({
        className: 'blackspot-marker',
        html: `
          <div style="
            background: ${markerColor};
            border: 2px solid #ffffff;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 11px;
            box-shadow: 0 0 10px ${markerColor}90;
            cursor: pointer;
            animation: ${isExtreme ? 'pulse 1.8s infinite' : 'none'};
          ">
            ⚠️
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([spot.coordinates[0], spot.coordinates[1]], { icon: customIcon });

      marker.on('click', () => {
        if (onSelectBlackspot) onSelectBlackspot(spot);
      });

      blackspotsGroup.addLayer(marker);
    });
  }, [showBlackspots, onSelectBlackspot]);

  // Render Active and Alternative Routes (With Highway Safety Index Multi-Segment Color Coding)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const routeGroup = layersRef.current.route;
    const altGroup = layersRef.current.alternatives;
    routeGroup.clearLayers();
    altGroup.clearLayers();

    if (!activeRoute || !activeRoute.pathCoordinates || activeRoute.pathCoordinates.length === 0) {
      return;
    }

    const bounds = L.latLngBounds([]);

    // 1. Render Alternative Routes (if enabled and present)
    if (showAlternatives && activeRoute.allRouteOptions && activeRoute.allRouteOptions.length > 1) {
      const altOptions = activeRoute.allRouteOptions.filter((opt) => opt.id !== activeRoute.id);

      altOptions.forEach((altOpt) => {
        if (!altOpt.pathCoordinates || altOpt.pathCoordinates.length === 0) return;

        const color = altOpt.routeColor || '#a855f7';
        altOpt.pathCoordinates.forEach((c) => bounds.extend(c));

        // Soft ambient glow
        const altGlow = L.polyline(altOpt.pathCoordinates, {
          color,
          weight: 8,
          opacity: 0.25,
        });

        // Dashed alternative polyline
        const altLine = L.polyline(altOpt.pathCoordinates, {
          color,
          weight: 5,
          opacity: 0.75,
          dashArray: '8, 8',
          lineCap: 'round',
          lineJoin: 'round',
        });

        // Hover & Click interaction
        altLine.on('mouseover', () => {
          altLine.setStyle({ weight: 7, opacity: 1 });
        });
        altLine.on('mouseout', () => {
          altLine.setStyle({ weight: 5, opacity: 0.75 });
        });
        altLine.on('click', () => {
          if (onSelectAlternativeRoute) {
            onSelectAlternativeRoute(altOpt);
          }
        });

        altGroup.addLayer(altGlow);
        altGroup.addLayer(altLine);

        // Place on-canvas midpoint badge marker
        if (altOpt.pathCoordinates.length > 4) {
          const midIdx = Math.floor(altOpt.pathCoordinates.length / 2);
          const midCoord = altOpt.pathCoordinates[midIdx];

          const badgeIcon = L.divIcon({
            className: 'route-badge-marker',
            html: `
              <div style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid ${color}; color: #ffffff; padding: 2px 7px; border-radius: 8px; font-size: 10px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.5); cursor: pointer; display: flex; items-center; gap: 4px;">
                <span>${altOpt.routeBadge || 'Alt'}</span>
                <span style="color: #94a3b8; font-weight: 600;">•</span>
                <span style="color: ${color};">${altOpt.totalDistanceKm} km</span>
              </div>
            `,
            iconSize: [110, 24],
            iconAnchor: [55, 12],
          });

          const badgeMarker = L.marker(midCoord, { icon: badgeIcon });
          badgeMarker.on('click', () => {
            if (onSelectAlternativeRoute) {
              onSelectAlternativeRoute(altOpt);
            }
          });
          altGroup.addLayer(badgeMarker);
        }
      });
    }

    // 2. Render Main Active Route (Multi-Segment Safety Color-Coded or Single Preference)
    activeRoute.pathCoordinates.forEach((c) => bounds.extend(c));

    const isSafetyMode = routeColorMode === 'safety';
    const hasStepsSafety = activeRoute.steps && activeRoute.steps.length > 0;

    if (isSafetyMode && hasStepsSafety) {
      // Multi-segment Highway Safety Index Color-Coding
      activeRoute.steps.forEach((step, idx) => {
        const stepCoords: [number, number][] = step.coordinates && step.coordinates.length > 1
          ? step.coordinates
          : (step.from && step.to && typeof step.from.lat === 'number' && typeof step.to.lat === 'number')
          ? [
              [step.from.lat, step.from.lng] as [number, number],
              [step.to.lat, step.to.lng] as [number, number],
            ]
          : [];

        if (stepCoords.length < 2) return;

        const safetyData = step.safetyData;
        const segmentColor = safetyData?.color || (step.roadConditionScore >= 80 ? '#10b981' : step.roadConditionScore >= 60 ? '#f59e0b' : '#ef4444');
        const safetyScore = safetyData?.safetyScore ?? step.roadConditionScore;
        const safetyTier = safetyData?.safetyTier ?? (safetyScore >= 80 ? 'high_safety' : safetyScore >= 60 ? 'moderate_caution' : 'elevated_risk');

        // Segment glow
        const segGlow = L.polyline(stepCoords, {
          color: segmentColor,
          weight: 14,
          opacity: 0.35,
          lineJoin: 'round',
          lineCap: 'round',
        });

        // Core polyline
        const segLine = L.polyline(stepCoords, {
          color: segmentColor,
          weight: 7,
          opacity: 0.95,
          lineJoin: 'round',
          lineCap: 'round',
        });

        // Interactive Segment Tooltip
        segLine.bindTooltip(
          `<strong>${step.from.name} ➔ ${step.to.name}</strong><br/><span style="color:${segmentColor}">Safety Index: ${safetyScore}/100 (${safetyTier.replace('_', ' ')})</span>`,
          { className: 'custom-dark-tooltip', sticky: true }
        );

        // Detailed Segment Popup
        const segPopupContent = `
          <div style="font-family: system-ui, sans-serif; color: #f8fafc; padding: 2px; min-width: 220px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; background: ${segmentColor}25; color: ${segmentColor}; padding: 2px 6px; border-radius: 4px; border: 1px solid ${segmentColor}60; text-transform: uppercase;">
                ${safetyTier.replace('_', ' ')}
              </span>
              <span style="font-size: 12px; font-weight: 900; color: ${segmentColor};">
                Safety Score: ${safetyScore}/100
              </span>
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #ffffff;">
              ${step.from.name} ➔ ${step.to.name}
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 1px;">
              ${step.highway.name} (${step.highway.code}) • ${step.distanceKm} km • ~${step.estimatedMinutes} mins
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; font-size: 11px; background: rgba(15,23,42,0.85); padding: 6px 8px; border-radius: 6px; border: 1px solid #334155;">
              <div>
                <div style="color: #64748b; font-size: 9px; font-weight: 700;">ROAD QUALITY</div>
                <strong style="color: #38bdf8;">${safetyData?.roadQualityScore ?? step.roadConditionScore}/100</strong>
              </div>
              <div>
                <div style="color: #64748b; font-size: 9px; font-weight: 700;">ACCIDENT CRASH RATE</div>
                <strong style="color: #f59e0b;">~${safetyData?.annualAccidentIncidents ?? 25}/yr</strong>
              </div>
              <div>
                <div style="color: #64748b; font-size: 9px; font-weight: 700;">SAFE ADVISORY SPEED</div>
                <strong style="color: #10b981;">${safetyData?.recommendedSpeedKmh ?? 50} km/h</strong>
              </div>
              <div>
                <div style="color: #64748b; font-size: 9px; font-weight: 700;">RISK LEVEL</div>
                <strong style="color: ${segmentColor}; text-transform: uppercase;">${safetyData?.accidentRiskLevel ?? 'moderate'}</strong>
              </div>
            </div>

            ${safetyData?.hazardFactors && safetyData.hazardFactors.length > 0 ? `
              <div style="margin-top: 6px; font-size: 10px; color: #cbd5e1; background: rgba(30,41,59,0.7); padding: 5px 7px; border-radius: 6px;">
                <strong style="color: #fbbf24;">Hazard Factors:</strong> ${safetyData.hazardFactors.join('; ')}
              </div>
            ` : ''}
          </div>
        `;

        segLine.bindPopup(segPopupContent, { className: 'custom-dark-popup', closeButton: false });

        segLine.on('mouseover', () => {
          segLine.setStyle({ weight: 9, opacity: 1 });
        });
        segLine.on('mouseout', () => {
          segLine.setStyle({ weight: 7, opacity: 0.95 });
        });

        routeGroup.addLayer(segGlow);
        routeGroup.addLayer(segLine);
      });
    } else {
      // Single unified route polyline
      const activeColor = activeRoute.routeColor || '#38bdf8';

      const routeGlow = L.polyline(activeRoute.pathCoordinates, {
        color: activeColor,
        weight: 14,
        opacity: 0.35,
        lineJoin: 'round',
        lineCap: 'round',
      });

      const routePolyline = L.polyline(activeRoute.pathCoordinates, {
        color: activeColor,
        weight: 7,
        opacity: 0.95,
        lineJoin: 'round',
        lineCap: 'round',
      });

      routeGroup.addLayer(routeGlow);
      routeGroup.addLayer(routePolyline);
    }

    // 3. Render Active Route Blackspot Danger Badges along the corridor
    if (activeRoute.safetyIndex?.activeBlackspots) {
      activeRoute.safetyIndex.activeBlackspots.forEach((spot) => {
        const isHazard = spot.riskLevel === 'critical';
        const spotColor = isHazard ? '#ef4444' : '#f97316';

        const spotIcon = L.divIcon({
          className: 'active-route-blackspot-marker',
          html: `
            <div style="
              background: ${spotColor};
              border: 2px solid #ffffff;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              box-shadow: 0 0 12px ${spotColor};
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: 12px;
              cursor: pointer;
              animation: pulse 1.5s infinite;
            ">
              ⚠️
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const spotMarker = L.marker([spot.coordinates[0], spot.coordinates[1]], { icon: spotIcon });
        spotMarker.bindTooltip(
          `<strong>BLACKSPOT HAZARD: ${spot.name}</strong><br/><span style="color:#ef4444;">${spot.annualAccidentStats} • ${spot.highwayCode}</span>`,
          { className: 'custom-dark-tooltip' }
        );

        routeGroup.addLayer(spotMarker);
      });
    }

    // Start Origin Marker
    const startCoord = activeRoute.pathCoordinates[0];
    const startIcon = L.divIcon({
      className: 'route-start-marker',
      html: `
        <div style="background: #10b981; border: 2px solid #ffffff; width: 20px; height: 20px; border-radius: 50%; box-shadow: 0 0 14px #10b981; display: flex; align-items: center; justify-content: center; color: #020617; font-size: 11px; font-weight: 900;">
          A
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    const startMarker = L.marker(startCoord, { icon: startIcon }).bindTooltip(
      `<strong>Start:</strong> ${activeRoute.origin.name}`,
      { direction: 'top', className: 'custom-dark-tooltip' }
    );

    // End Destination Marker
    const endCoord = activeRoute.pathCoordinates[activeRoute.pathCoordinates.length - 1];
    const endIcon = L.divIcon({
      className: 'route-end-marker',
      html: `
        <div style="background: #f43f5e; border: 2px solid #ffffff; width: 20px; height: 20px; border-radius: 50%; box-shadow: 0 0 14px #f43f5e; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 11px; font-weight: 900;">
          B
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    const endMarker = L.marker(endCoord, { icon: endIcon }).bindTooltip(
      `<strong>Destination:</strong> ${activeRoute.destination.name}`,
      { direction: 'top', className: 'custom-dark-tooltip' }
    );

    routeGroup.addLayer(startMarker);
    routeGroup.addLayer(endMarker);

    // Fit map smoothly to encompass active and alternative route paths
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 11.5,
        animate: true,
        duration: 1.2,
      });
    }
  }, [activeRoute, showAlternatives, routeColorMode, onSelectAlternativeRoute, onSelectBlackspot]);

  const hasAlternatives = activeRoute?.allRouteOptions && activeRoute.allRouteOptions.length > 1;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800/90 shadow-2xl bg-slate-950">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" id="nepal-gis-canvas" />

      {/* Professional Right-Aligned Vertical Icon Layer Toolbar */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end space-y-2">
        <button
          onClick={() => setIsToolbarOpen(!isToolbarOpen)}
          className="w-10 h-10 bg-slate-950/90 backdrop-blur-md text-slate-200 border border-slate-800 rounded-xl shadow-2xl flex items-center justify-center hover:bg-slate-900 transition"
          title={isToolbarOpen ? "Hide Map Layers Toolbar" : "Show Map Layers Toolbar"}
          id="toggle-toolbar-collapse"
        >
          <Layers className={`w-5 h-5 text-emerald-400 ${isToolbarOpen ? 'rotate-90' : ''} transition-transform`} />
        </button>

        {isToolbarOpen && (
          <div className="bg-slate-950/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-2xl flex flex-col space-y-1.5 animate-fadeIn">
            {/* Highways Toggle */}
            <button
              onClick={() => setShowHighways(!showHighways)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                showHighways
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
              id="toggle-layer-highways"
              title="Toggle Highways Network"
            >
              🛣️
            </button>

            {/* Alternatives Toggle */}
            {hasAlternatives && (
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                  showAlternatives
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
                id="toggle-layer-alternatives"
                title="Toggle Alternative Route Options"
              >
                🔄
              </button>
            )}

            {/* Map Style Selector: Standard, Satellite, Terrain */}
            <div className="pt-2 pb-1 border-t border-slate-800 flex flex-col space-y-1.5">
              <button
                onClick={() => setMapStyle('standard')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                  mapStyle === 'standard'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
                title="Standard Map View"
                id="btn-map-style-standard"
              >
                <Map className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMapStyle('satellite')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                  mapStyle === 'satellite'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
                title="Satellite Map View"
                id="btn-map-style-satellite"
              >
                <Globe className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMapStyle('terrain')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                  mapStyle === 'terrain'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
                title="Terrain Topo Map View"
                id="btn-map-style-terrain"
              >
                <Mountain className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
