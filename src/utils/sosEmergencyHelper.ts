import { CITIES_AND_JUNCTIONS, NEPAL_HIGHWAYS } from '../data/nepalHighwaysData';
import { CityNode, VehicleType, RoutePlanResult, EmergencyDistressType } from '../types';
import { calculateDirectDistanceKm } from './routeOptimizer';

export interface NearestLandmarkResult {
  city: CityNode;
  distanceKm: number;
  direction: string;
  nearestHighway?: string;
  dorContact?: string;
}

export const NEPAL_EMERGENCY_HOTLINES = [
  { name: 'Nepal Police Emergency', number: '100', tel: 'tel:100', role: 'General Law & Emergency First Responders', badge: '🚔 100' },
  { name: 'Nepal Traffic Police', number: '103', tel: 'tel:103', role: 'Highway Road Rescue & Traffic Obstructions', badge: '🚦 103' },
  { name: 'Tourist Police Nepal', number: '1144', tel: 'tel:1144', role: 'Foreign Travelers & Trekking Route Assistance', badge: '🏔️ 1144' },
  { name: 'Ambulance (Red Cross)', number: '102', tel: 'tel:102', role: 'Immediate Medical & Trauma Evacuation', badge: '🚑 102' },
  { name: 'Armed Police Force (APF)', number: '1114', tel: 'tel:1114', role: 'Disaster Relief & Landslide Search-and-Rescue', badge: '🛡️ 1114' },
  { name: 'Road Department (DoR)', number: '+977-1-4262693', tel: 'tel:+97714262693', role: 'Heavy Machinery, Road Blockage & Bulldozer Dispatch', badge: '🏗️ DoR' },
];

export const DISTRESS_TYPE_CONFIG: Record<
  EmergencyDistressType,
  { label: string; nepaliLabel: string; iconEmoji: string; description: string; priority: 'Critical' | 'Urgent' | 'High' }
> = {
  accident: {
    label: 'Road Accident / Vehicle Collision',
    nepaliLabel: 'सडक दुर्घटना / गाडी ठोक्किएको',
    iconEmoji: '🚨',
    description: 'Collision, rollover, or passenger injury requiring urgent ambulance / police response',
    priority: 'Critical',
  },
  landslide_obstruction: {
    label: 'Landslide / Rockfall / Mudflow Trapped',
    nepaliLabel: 'पहिरो / ढुङ्गा खसेर थुनिएको',
    iconEmoji: '⛰️',
    description: 'Vehicle trapped between active landslide zones or washed-out road section',
    priority: 'Critical',
  },
  medical: {
    label: 'Acute Medical Emergency / Altitude Sickness',
    nepaliLabel: 'आकस्मिक स्वास्थ्य समस्या / लेक लागेको',
    iconEmoji: '🚑',
    description: 'Severe illness, trauma, breathing distress, or acute mountain sickness (AMS)',
    priority: 'Critical',
  },
  offroad_distress: {
    label: 'Vehicle Slipped Off-Road / Cliff Edge Danger',
    nepaliLabel: 'सडकबाट चिप्लिएको / भीरको जोखिम',
    iconEmoji: '🆘',
    description: 'Vehicle hanging off shoulder, deep mud ditch, or risk of rolling down ridge',
    priority: 'Critical',
  },
  vehicle_breakdown: {
    label: 'Mechanical Failure / Engine / Axle / Brake Breakdown',
    nepaliLabel: 'गाडी बिग्रिएको / इन्जिन वा ब्रेक फेल',
    iconEmoji: '🚙',
    description: 'Severe mechanical breakdown in isolated stretch without cellular workshop support',
    priority: 'Urgent',
  },
  ev_battery_or_fuel: {
    label: 'EV Battery Depleted / Out of Fuel on Remote Pass',
    nepaliLabel: 'इभी चार्ज सकिएको / इन्धन रित्तिएको',
    iconEmoji: '⚡',
    description: 'Battery 0% or zero fuel on high-altitude gradient or isolated highway section',
    priority: 'Urgent',
  },
  mountain_weather: {
    label: 'Severe Blizzard / Flash Flood / Torrential Whiteout',
    nepaliLabel: 'हिमपात / बाढी / भारी वर्षामा अलपत्र',
    iconEmoji: '🌨️',
    description: 'Severe weather whiteout, freezing conditions, zero visibility, or river overflow',
    priority: 'Urgent',
  },
  general_rescue: {
    label: 'General Rescue / Stranded Traveler Assistance',
    nepaliLabel: 'अन्य उद्धार तथा सहयोग',
    iconEmoji: '🚩',
    description: 'Lost route, night isolation, wildlife threat, or urgent traveler support',
    priority: 'High',
  },
};

const VEHICLE_LABELS: Record<VehicleType, string> = {
  car: 'Car / Hatchback / Sedan',
  suv_4wd: 'SUV / 4WD Jeep',
  motorbike: 'Motorcycle / Scooter',
  bus_truck: 'Bus / Heavy Truck',
  electric_vehicle: 'Electric Vehicle (EV)',
};

/**
 * Calculates compass direction (e.g. "North-West") from point A to point B
 */
function getCompassDirection(fromLat: number, fromLng: number, toLat: number, toLng: number): string {
  const dLat = toLat - fromLat;
  const dLng = toLng - fromLng;
  const angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  const normalized = (angle + 360) % 360;

  if (normalized >= 337.5 || normalized < 22.5) return 'North';
  if (normalized >= 22.5 && normalized < 67.5) return 'North-East';
  if (normalized >= 67.5 && normalized < 112.5) return 'East';
  if (normalized >= 112.5 && normalized < 157.5) return 'South-East';
  if (normalized >= 157.5 && normalized < 202.5) return 'South';
  if (normalized >= 202.5 && normalized < 247.5) return 'South-West';
  if (normalized >= 247.5 && normalized < 292.5) return 'West';
  return 'North-West';
}

/**
 * Finds the nearest known Nepal city or junction to the user's coordinates
 */
export function findNearestLandmark(lat: number, lng: number): NearestLandmarkResult {
  let nearestCity = CITIES_AND_JUNCTIONS[0];
  let minDistance = Infinity;

  for (const city of CITIES_AND_JUNCTIONS) {
    const dist = calculateDirectDistanceKm(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestCity = city;
    }
  }

  const direction = getCompassDirection(nearestCity.lat, nearestCity.lng, lat, lng);

  // Find nearest highway from connected highways or proximity
  let nearestHwy: string | undefined;
  if (nearestCity.connectedHighways && nearestCity.connectedHighways.length > 0) {
    const hwy = NEPAL_HIGHWAYS.find((h) => nearestCity.connectedHighways.includes(h.code));
    if (hwy) {
      nearestHwy = `${hwy.code} ${hwy.name}`;
    }
  }

  return {
    city: nearestCity,
    distanceKm: Math.round(minDistance * 10) / 10,
    direction,
    nearestHighway: nearestHwy,
    dorContact: 'Traffic Hotline: 103 / Police: 100',
  };
}

/**
 * Formats coordinates for high-clarity emergency broadcast
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latStr = Math.abs(lat).toFixed(5) + (lat >= 0 ? '°N' : '°S');
  const lngStr = Math.abs(lng).toFixed(5) + (lng >= 0 ? '°E' : '°W');
  return `${latStr}, ${lngStr}`;
}

export interface GenerateSosMessageOptions {
  lat: number;
  lng: number;
  accuracyM?: number;
  altitudeM?: number;
  distressType: EmergencyDistressType;
  customNotes?: string;
  vehicleType: VehicleType;
  vehiclePlateNumber?: string;
  passengerCount?: number;
  activeRoute?: RoutePlanResult | null;
  batteryPercent?: number | null;
}

/**
 * Generates full comprehensive Search & Rescue (SAR) message
 */
export function generateFullSosMessage(options: GenerateSosMessageOptions): string {
  const {
    lat,
    lng,
    accuracyM,
    altitudeM,
    distressType,
    customNotes,
    vehicleType,
    vehiclePlateNumber,
    passengerCount = 1,
    activeRoute,
    batteryPercent,
  } = options;

  const now = new Date();
  const timeFormatted = now.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const distress = DISTRESS_TYPE_CONFIG[distressType];
  const landmark = findNearestLandmark(lat, lng);
  const coordsFormatted = formatCoordinates(lat, lng);
  const mapLink = `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;

  let routeInfo = 'Independent / Local Highway Movement';
  if (activeRoute) {
    routeInfo = `${activeRoute.origin.name} ➔ ${activeRoute.destination.name} (${activeRoute.routeName || 'Recommended Corridor'})`;
  }

  const lines = [
    `🚨 *EMERGENCY SOS RESCUE DISPATCH - NEPAL HIGHWAY* 🚨`,
    `⚠️ PRIORITY: ${distress.priority.toUpperCase()} | TIME: ${timeFormatted} NPT`,
    ``,
    `📍 *PRECISE GPS LOCATION / COORDINATES*:`,
    `• Lat/Lng: ${lat.toFixed(5)}, ${lng.toFixed(5)} (${coordsFormatted})`,
    `• Accuracy: ±${accuracyM ? Math.round(accuracyM) : 15} meters${altitudeM ? ` | Alt: ${Math.round(altitudeM)}m ASL` : ''}`,
    `• 🗺️ Live Map Pin: ${mapLink}`,
    ``,
    `🏔️ *NEAREST HIGHWAY LANDMARK*:`,
    `• Location: ~${landmark.distanceKm} km ${landmark.direction} of ${landmark.city.name} (${landmark.city.district} District, ${landmark.city.province} Province)`,
    landmark.nearestHighway ? `• Highway Corridor: ${landmark.nearestHighway}` : '',
    ``,
    `🚙 *VEHICLE & PASSENGER INFORMATION*:`,
    `• Vehicle: ${VEHICLE_LABELS[vehicleType] || vehicleType}`,
    vehiclePlateNumber ? `• Plate/Reg No: ${vehiclePlateNumber.toUpperCase()}` : '',
    `• Persons Onboard: ${passengerCount} passenger${passengerCount > 1 ? 's' : ''}`,
    batteryPercent != null ? `• Device Battery: ${batteryPercent}%` : '',
    ``,
    `🛣️ *ACTIVE ROUTE CORRIDOR*:`,
    `• Route: ${routeInfo}`,
    ``,
    `⚠️ *DISTRESS NATURE & DETAILS*:`,
    `• Category: ${distress.iconEmoji} ${distress.label}`,
    `• Nepali: ${distress.nepaliLabel}`,
    customNotes ? `• Additional Note: ${customNotes}` : '• Additional Note: Immediate roadside assistance requested.',
    ``,
    `📞 *NEPAL HIGHWAY RESCUE HOTLINES*:`,
    `• Police: 100 | Traffic: 103 | Tourist Police: 1144 | Ambulance: 102 | APF Rescue: 1114`,
    `[Generated via Mero Sadak Nepal Highway SOS]`
  ];

  return lines.filter((l) => l !== '').join('\n');
}

/**
 * Generates compact SMS format (<160-300 chars) for weak 2G / SMS emergency transmission
 */
export function generateCompactSms(options: GenerateSosMessageOptions): string {
  const { lat, lng, distressType, customNotes, passengerCount = 1, vehicleType } = options;
  const distress = DISTRESS_TYPE_CONFIG[distressType];
  const landmark = findNearestLandmark(lat, lng);
  const mapLink = `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;

  return `SOS NEPAL RESCUE: ${distress.iconEmoji} ${distress.label}. Loc: ${lat.toFixed(5)},${lng.toFixed(5)} (~${landmark.distanceKm}km ${landmark.direction} of ${landmark.city.name}). People: ${passengerCount}. Vehicle: ${vehicleType}. ${customNotes ? `Note: ${customNotes}. ` : ''}Map: ${mapLink} Police:100/103`;
}

/**
 * Audio SOS Siren Synthesizer using Web Audio API
 */
class SosAudioBeacon {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timer: number | null = null;

  start() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.isPlaying = true;

      // Morse Code SOS: ... --- ...
      // dot = 100ms, dash = 300ms, element-gap = 100ms, letter-gap = 300ms, word-gap = 700ms
      const pattern = [
        // S (...)
        100, 100, 100, 100, 100, 300,
        // O (---)
        300, 100, 300, 100, 300, 300,
        // S (...)
        100, 100, 100, 100, 100, 700
      ];

      let step = 0;
      const playNext = () => {
        if (!this.isPlaying || !this.ctx) return;
        const isSound = step % 2 === 0;
        const duration = pattern[step];

        if (isSound && this.ctx.state === 'running') {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, this.ctx.currentTime); // High pitch 880Hz (A5) for penetration in mountain noise
          gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration / 1000);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + duration / 1000);
        }

        step = (step + 1) % pattern.length;
        this.timer = window.setTimeout(playNext, duration);
      };

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => playNext());
      } else {
        playNext();
      }
    } catch {
      // Audio not supported or blocked by user gesture
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }

  isActive() {
    return this.isPlaying;
  }
}

export const sosAudioBeacon = new SosAudioBeacon();
