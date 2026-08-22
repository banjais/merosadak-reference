import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { NEPAL_HIGHWAYS, LIVE_ROAD_INCIDENTS, CITIES_AND_JUNCTIONS, INITIAL_USER_REPORTS, HIGHWAY_WEATHER_NODES, HIGHWAY_POIS, TRAFFIC_CORRIDORS } from './src/data/nepalHighwaysData';
import { findOptimizedRoute } from './src/utils/routeOptimizer';
import { UserRoadReport, TripAssistantStop } from './src/types';

dotenv.config();

let userReports: UserRoadReport[] = [...INITIAL_USER_REPORTS];

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Resilient Gemini caller with automatic model fallback for 503 high-demand spikes
 */
async function generateJsonWithModelFallback(
  ai: GoogleGenAI,
  prompt: string,
  candidateModels: string[] = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-3.7-flash', 'gemini-flash-latest']
): Promise<any | null> {
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text?.trim();
      if (responseText) {
        // Strip markdown fences if present
        const jsonStr = responseText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/, '')
          .replace(/\s*```$/, '')
          .trim();
        const parsed = JSON.parse(jsonStr);
        return parsed;
      }
    } catch (err: any) {
      console.warn(
        `[Gemini AI] Model '${model}' returned temporary issue (${err?.status || err?.message || '503/unavailable'}). Trying next model candidate...`
      );
      // Brief jitter before next attempt if 503
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Mero Sadak Highway & Route Optimization Engine' });
  });

  // Highways directory endpoint
  app.get('/api/highways', (req, res) => {
    res.json({ highways: NEPAL_HIGHWAYS });
  });

  // Cities & Junctions list endpoint
  app.get('/api/cities', (req, res) => {
    res.json({ cities: CITIES_AND_JUNCTIONS });
  });

  // Live road incidents endpoint
  app.get('/api/road-alerts', (req, res) => {
    res.json({ incidents: LIVE_ROAD_INCIDENTS, userReports });
  });

  // Highway weather & mountain pass conditions
  app.get('/api/weather', (req, res) => {
    res.json({ weatherNodes: HIGHWAY_WEATHER_NODES });
  });

  // Highway POIs, EV chargers, fuel stations, rest stops
  app.get('/api/pois', (req, res) => {
    res.json({ pois: HIGHWAY_POIS });
  });

  // Live traffic & corridor bottlenecks
  app.get('/api/traffic', (req, res) => {
    res.json({ corridors: TRAFFIC_CORRIDORS });
  });

  // Consolidated Mountain Offline Pack Bundle (All GIS data in one offline payload)
  app.get('/api/offline-bundle', (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json({
      version: '1.2.0',
      syncedAt: new Date().toISOString(),
      highways: NEPAL_HIGHWAYS,
      cities: CITIES_AND_JUNCTIONS,
      incidents: LIVE_ROAD_INCIDENTS,
      userReports,
      weatherNodes: HIGHWAY_WEATHER_NODES,
      pois: HIGHWAY_POIS,
      corridors: TRAFFIC_CORRIDORS,
      offlineSupport: {
        routingEngine: 'Client-side topological Dijkstra running locally in memory',
        tileStrategy: 'Service Worker Cache-First with Stale-While-Revalidate',
        cachedCorridors: ['H01', 'H02', 'H03', 'H04', 'H05', 'H06', 'H07', 'H08', 'H09', 'H10', 'H11', 'H12', 'H13', 'H14', 'H15', 'H16', 'H17', 'H18', 'H19', 'H20', 'H21', 'H22'],
      },
    });
  });

  // Direct service worker serving
  app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(process.cwd(), 'public', 'sw.js'));
  });

  // Submit crowdsourced Mero Sadak report
  app.post('/api/submit-report', (req, res) => {
    const { highwayCode, location, incidentType, severity, description, reporterName, contactNumber } = req.body;
    if (!location || !description) {
      return res.status(400).json({ error: 'Location and description are required' });
    }

    const newReport: UserRoadReport = {
      id: `usr-rep-${Date.now()}`,
      highwayCode: highwayCode || 'H04',
      location,
      incidentType: incidentType || 'pothole',
      severity: severity || 'minor',
      description,
      reporterName: reporterName || 'Anonymous Traveler',
      contactNumber,
      createdAt: 'Just now',
      upvotes: 1,
      verified: false,
    };

    userReports.unshift(newReport);
    res.json({ success: true, report: newReport });
  });

  // Upvote report
  app.post('/api/upvote-report/:id', (req, res) => {
    const { id } = req.params;
    const report = userReports.find((r) => r.id === id);
    if (report) {
      report.upvotes += 1;
      return res.json({ success: true, upvotes: report.upvotes });
    }
    res.status(404).json({ error: 'Report not found' });
  });

  // Calculate route plan
  app.post('/api/calculate-route', (req, res) => {
    const { originId, destinationId, preference, vehicle } = req.body;
    if (!originId || !destinationId) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const result = findOptimizedRoute(originId, destinationId, preference || 'fastest', vehicle || 'car');
    if (!result) {
      return res.status(404).json({ error: 'No reachable route found between selected points.' });
    }

    res.json({ routePlan: result });
  });

  // Gemini AI Route Advisor & Dynamic Trip Optimizer
  app.post('/api/ai-route-advisor', async (req, res) => {
    const { origin, destination, vehicle, preference, distanceKm, timeHours, roadConditionScore, incidents } = req.body;

    try {
      const ai = getGeminiClient();
      if (!ai) {
        // Fallback realistic advisory if key is pending configuration
        return res.json({
          advisory: {
            summary: `Travel between ${origin} and ${destination} covers ${distanceKm} km with a road condition rating of ${roadConditionScore}/100. Terrain contains river canyons, narrow hairpin bends, and periodic construction zones.`,
            riskLevel: roadConditionScore < 60 ? 'Moderate' : 'Low',
            keyRecommendations: [
              'Start early morning (before 6:30 AM) to minimize encountering slow-moving heavy freight convoys.',
              'Use engine braking on steep downhill slopes; avoid excessive foot braking to prevent vapor lock.',
              'Watch for sudden gravel patches and flagmen near ongoing road widening sections.',
              'Carry sufficient potable water, emergency torch, and first-aid essentials.',
            ],
            monsoonOrWeatherWarning: 'During active rainfall, reduce speed near active river gorges and check live DOR updates for temporary clearing pauses.',
            bestDepartureWindow: '5:00 AM - 6:30 AM',
            emergencyContacts: ['Nepal Traffic Police: 103', 'Emergency Hotline: 100', 'Armed Police Force Highway Rescue: 1114'],
          },
        });
      }

      const prompt = `You are the chief highway safety and terrain navigation advisor for the Department of Roads, Nepal and Mero Sadak.
Analyze this planned trip in Nepal:
- Origin: ${origin}
- Destination: ${destination}
- Vehicle Type: ${vehicle}
- Routing Preference: ${preference}
- Total Distance: ${distanceKm} km
- Estimated Travel Time: ${timeHours} hours
- Road Condition Safety Score: ${roadConditionScore}/100
- Active Incidents on Corridors: ${JSON.stringify(incidents || [])}

Provide an authoritative, hyper-practical navigation advisory tailored to Nepal's unique Himalayan and Terai highway conditions.
Return a valid JSON object with the following fields:
{
  "summary": "2-3 concise, realistic sentences describing terrain dynamics, road conditions, and critical choke points (e.g. Nagdhunga, Daunne, Mugling, Siddhababa, or Roshi)",
  "riskLevel": "Low" | "Moderate" | "High" | "Severe",
  "keyRecommendations": ["4 practical actionable points for the driver/rider concerning road geometry, braking, overtaking etiquette, rest stops, or EV charging"],
  "monsoonOrWeatherWarning": "Specific advice regarding mountain fog, rockfall zones, landslide sensitivity, or river crossings",
  "bestDepartureWindow": "Specific optimal departure time window (e.g. 5:30 AM - 6:30 AM) with brief reason",
  "emergencyContacts": ["Key Nepal emergency hotline phone numbers relevant to this highway corridor"]
}`;

      const parsedAdvisory = await generateJsonWithModelFallback(ai, prompt);
      if (parsedAdvisory) {
        return res.json({ advisory: parsedAdvisory });
      }
      throw new Error('Gemini models temporarily unavailable');
    } catch (error) {
      console.warn('Using authentic domain advisory fallback:', error);
      return res.json({
        advisory: {
          summary: `Travel between ${origin} and ${destination} covers ${distanceKm} km. Ensure safe speeds across hilly curves and watch for ongoing road expansion diversions.`,
          riskLevel: 'Moderate',
          keyRecommendations: [
            'Maintain safe following distance behind heavy buses and freight trucks.',
            'Check tire pressure and cooling system before tackling high-elevation mountain climbs.',
            'Keep headlights on during winding gorge sections and early morning mist.',
          ],
          monsoonOrWeatherWarning: 'Check DOR alerts before entering Trishuli or Karnali river corridors during rain.',
          bestDepartureWindow: '6:00 AM - 7:30 AM',
          emergencyContacts: ['Nepal Traffic Police: 103', 'Armed Police Force Highway Rescue: 1114'],
        },
      });
    }
  });

  // Gemini AI Trip Assistant (Scenic stops, cafes, viewpoints & destination intelligence)
  app.post('/api/ai-trip-assistant', async (req, res) => {
    const {
      origin,
      destination,
      originDistrict,
      destinationDistrict,
      vehicle,
      preference,
      distanceKm,
      timeHours,
      elevationGainM,
      highwaysTraversed,
      focusFilter,
      customQuestion,
    } = req.body;

    // Helper fallback for offline / mock-free reliable recommendations
    const generateFallbackTripPlan = () => {
      const isPokhara = destination?.toLowerCase().includes('pokhara');
      const isChitwan = destination?.toLowerCase().includes('chitwan') || destination?.toLowerCase().includes('narayanghat');
      const isKathmandu = destination?.toLowerCase().includes('kathmandu');
      const isSindhuliOrBardibas = destination?.toLowerCase().includes('sindhuli') || destination?.toLowerCase().includes('bardibas') || destination?.toLowerCase().includes('janakpur');
      const isHetaudaOrButwal = destination?.toLowerCase().includes('hetauda') || destination?.toLowerCase().includes('butwal');

      let suggestedStops: TripAssistantStop[] = [
        {
          id: 'stop-1',
          name: 'Malekhu Riverfront Fresh Fish & Local Dhaba Strip',
          category: 'cafe_dining' as const,
          approxKmFromOrigin: Math.round(distanceKm * 0.35),
          approxTravelTime: '1 hr 45 min mark',
          locationName: 'Malekhu, Dhading (Prithvi Highway H04)',
          highwayCode: 'H04',
          highlights: 'Famous crisp golden fried river fish, home-ground yellow mustard pickle (raayo ko achar), and fresh lemon masala tea with outdoor river view.',
          proTip: 'Stop at the quieter riverside family restaurants on the western exit side for cleaner restrooms and less bus congestion.',
          bestFor: 'Breakfast & Local Culinary Specialty',
          rating: 4.8,
          lat: 27.8228,
          lng: 84.8155,
        },
        {
          id: 'stop-2',
          name: 'Kurintar Trishuli River Gorge Overlook & Riverside Cafe',
          category: 'scenic_viewpoint' as const,
          approxKmFromOrigin: Math.round(distanceKm * 0.52),
          approxTravelTime: '2 hr 40 min mark',
          locationName: 'Kurintar, Chitwan / Gorkha border',
          highwayCode: 'H04',
          highlights: 'Breathtaking canyon panorama of turquoise Trishuli river rafters, Manakamana Cable Car terminal view, and cold brew coffee & bakery.',
          proTip: 'Great spot to let vehicle brakes and engine cool down before continuing towards Mugling junction.',
          bestFor: 'Scenic Photography & Espresso Coffee',
          rating: 4.9,
          lat: 27.8732,
          lng: 84.6054,
        },
        {
          id: 'stop-3',
          name: 'Mugling Junction 60kW DC Fast Charger & Rest Hub',
          category: 'rest_stop' as const,
          approxKmFromOrigin: Math.round(distanceKm * 0.58),
          approxTravelTime: '3 hr 10 min mark',
          locationName: 'Mugling Bazar, Highway Convergence H04/H05',
          highwayCode: 'H04',
          highlights: 'Major highway intersection with NEA EV Fast Charging station, 24-hour mechanic workshops, clean tea lounges, and ATM services.',
          proTip: 'Top up tire pressure here and grab fresh bottled mineral water before the winding climb or Narayanghat descent.',
          bestFor: 'EV Quick Top-up & Vehicle Health Check',
          rating: 4.6,
          lat: 27.8617,
          lng: 84.5542,
        },
        {
          id: 'stop-4',
          name: 'Bandipur Dumre Ridge Cultural Viewpoint',
          category: 'cultural_heritage' as const,
          approxKmFromOrigin: Math.round(distanceKm * 0.72),
          approxTravelTime: '3 hr 55 min mark',
          locationName: 'Dumre, Tanahun',
          highwayCode: 'H04',
          highlights: 'Panoramic vista of Marshyangdi River valley, traditional Newari stone gateway, and freshly made organic curd (Dahi) from local buffalo dairies.',
          proTip: 'If you have an extra 45 minutes, drive up the 8km spur road to Bandipur hilltop village for a world-class Annapurna mountain panorama.',
          bestFor: 'Himalayan Ridge Views & Authentic Dahi',
          rating: 4.9,
          lat: 27.9622,
          lng: 84.4125,
        },
      ];

      if (isSindhuliOrBardibas) {
        suggestedStops = [
          {
            id: 'stop-sdh-1',
            name: 'Dhulikhel Himalayan Sunrise Ridge Cafe',
            category: 'cafe_dining' as const,
            approxKmFromOrigin: 30,
            approxTravelTime: '55 min mark',
            locationName: 'Dhulikhel, Kavrepalanchok',
            highwayCode: 'H03',
            highlights: 'Artisan bakery and hillside coffee terrace overlooking the eastern Langtang to Gaurishankar Himalayan range.',
            proTip: 'Order fresh masala tea and local sel roti; avoid heavy breakfast as BP Highway has tight twisting curves ahead.',
            bestFor: 'Mountain View Coffee & Light Breakfast',
            rating: 4.8,
          },
          {
            id: 'stop-sdh-2',
            name: 'Khurkot Sun Koshi River Suspension Bridge & Fish Stop',
            category: 'scenic_viewpoint' as const,
            approxKmFromOrigin: 85,
            approxTravelTime: '2 hr 30 min mark',
            locationName: 'Khurkot, Sindhuli (BP Highway H13)',
            highwayCode: 'H13',
            highlights: 'Spectacular golden sands along Sun Koshi river, pedestrian suspension bridge stroll, and sweet river water breeze.',
            proTip: 'Use lower gears descending the Nepalthok-Khurkot mountain switchbacks to save your brake pads.',
            bestFor: 'River Walking & Stunning Photo Op',
            rating: 4.9,
          },
          {
            id: 'stop-sdh-3',
            name: 'Historic Sindhuli Gadhi Fort & Junar Orange Groves',
            category: 'cultural_heritage' as const,
            approxKmFromOrigin: 130,
            approxTravelTime: '3 hr 45 min mark',
            locationName: 'Sindhuli Gadhi Ridge',
            highwayCode: 'H13',
            highlights: '18th-century stone battlefield fortress where Gorkhali troops defeated Captain Kinloch, flanked by juicy organic Junar (sweet orange) orchards.',
            proTip: 'Buy fresh Junar juice concentrate from local village co-ops along the roadside.',
            bestFor: 'Historic Exploration & Mountain Breeze',
            rating: 4.9,
          },
        ];
      }

      return {
        tripTitle: `Highway Journey from ${origin || 'Origin'} to ${destination || 'Destination'}`,
        overallVibe: `Scenic mountain journey passing through river gorges, scenic terrace valleys, and vibrant highway settlements.`,
        destinationOverview: {
          tagline: isPokhara
            ? 'Nepal’s premier adventure and tranquil lake paradise nestled under the Annapurnas'
            : isChitwan
            ? 'Subtropical wildlife haven famous for rhinos, tigers, and Rapti river sunsets'
            : isKathmandu
            ? 'Historic capital of ancient pagoda temples, vibrant culinary scene, and culture'
            : `Fascinating destination in ${destinationDistrict || 'Nepal'} with rich local culture and geography`,
          mustDoUponArrival: isPokhara
            ? 'Head directly to Phewa Lakeside for evening reflection boating or walk along the pedestrian promenade.'
            : isChitwan
            ? 'Catch the sunset at Sauraha Rapti riverbank with a cool drink while watching wildlife on the far shore.'
            : isKathmandu
            ? 'Unwind from the highway with a warm dinner in Thamel or Patan Durbar Square courtyard.'
            : `Explore the central chowk and sample the famous local market delicacies.`,
          localSpecialty: isPokhara
            ? 'Authentic Thakali Thali with Mustang Jimbu ghee, fresh trout, and artisanal lake-view coffee'
            : isChitwan
            ? 'Chitwan Taas (spiced pan-fried mutton with beaten rice & radish pickle) and fresh coconut water'
            : isKathmandu
            ? 'Newari Choila, Samay Baji platter, Momos with sesame-tomato jhol, and King Curd (Juju Dhau)'
            : 'Traditional Dal Bhat with organic regional seasonal greens and fresh highway tea',
          parkingTip: isPokhara
            ? 'Park at designated lakeside municipal pay lots; central Lakeside street has evening vehicle restrictions on weekends.'
            : isChitwan
            ? 'Most safari resorts have spacious private parking; keep windows rolled up at night near forested buffer zones.'
            : 'Seek secure basement hotel parking in city center hubs to avoid narrow lane congestion.',
        },
        suggestedStops,
        travelerTips: [
          'Sound your horn gently before blind hairpin turns on narrow gorge highways.',
          'Always carry local cash (NPR) as several scenic rural fruit stalls and roadside tea dhabas have limited cellular data for QR payments.',
          'Keep vehicle headlights on low beam when driving through river mist or shaded mountain corridors.',
          'Hydrate well and take a 10-15 minute break every 2 hours to avoid driver fatigue on winding routes.',
        ],
        customAnswer: customQuestion
          ? `For your request regarding "${customQuestion}": Along the ${origin} to ${destination} corridor, we recommend planning your main refreshment break around the river valley sections where parking is widest and food is freshly cooked.`
          : undefined,
      };
    };

    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.json({ tripPlan: generateFallbackTripPlan() });
      }

      const prompt = `You are the ultimate AI Highway Trip Assistant & Travel Concierge for Nepal highways (Mero Sadak).
A traveler is taking a trip with the following route parameters:
- Origin: ${origin} (District: ${originDistrict || 'Unknown'})
- Destination: ${destination} (District: ${destinationDistrict || 'Unknown'})
- Vehicle Type: ${vehicle || 'car'}
- Routing Preference: ${preference || 'fastest'}
- Total Route Distance: ${distanceKm} km
- Estimated Travel Time: ${timeHours} hours
- Elevation Climb: +${elevationGainM || 0}m
- Highway Corridors Traversed: ${JSON.stringify(highwaysTraversed || ['Prithvi Highway H04'])}
- Traveler Focus / Filter Preference: ${focusFilter || 'all'}
${customQuestion ? `- Specific Traveler Question / Request: "${customQuestion}"` : ''}

Provide intelligent, highly accurate, authentic recommendations for scenic stops, cafes/eateries, rest areas, cultural spots, and destination intelligence along this specific highway path in Nepal.

Return a valid JSON object matching this exact schema:
{
  "tripTitle": "Short evocative title for this road trip (e.g. 'Himalayan Foothills & Trishuli Canyon Highway Cruise to Pokhara')",
  "overallVibe": "1-2 sentence captivating summary of the scenery, terrain, and traveler ambiance",
  "destinationOverview": {
    "tagline": "Inspiring 1-sentence description of the destination",
    "mustDoUponArrival": "Specific activity to do immediately after reaching the destination to unwind",
    "localSpecialty": "Authentic must-try food, dish, or beverage unique to this destination",
    "parkingTip": "Practical advice regarding city traffic, parking, or vehicle access at destination"
  },
  "suggestedStops": [
    {
      "id": "stop-1",
      "name": "Name of the stop, cafe, viewpoint, or dhaba (e.g. 'Malekhu Riverfront Fish & Refreshment Stop')",
      "category": "scenic_viewpoint" | "cafe_dining" | "rest_stop" | "cultural_heritage" | "ev_charging",
      "approxKmFromOrigin": 65,
      "approxTravelTime": "1 hr 45 min mark",
      "locationName": "Precise town/milepost and highway name (e.g. 'Malekhu, Dhading • Prithvi Hwy H04')",
      "highwayCode": "H04",
      "highlights": "Specific highlights (e.g. Freshly caught fried river fish with yellow mustard chutney, river gorge breeze)",
      "proTip": "Insider local tip (e.g. 'Sit at the open terrace behind the main counter for panoramic river views')",
      "bestFor": "e.g. 'Scenic Photo & Snack' or 'Clean Restroom & Espresso' or 'EV Top-up & Lunch'",
      "rating": 4.8
    }
  ],
  "travelerTips": [
    "3-4 bullet-point practical tips specific to driving this corridor (mountain switchbacks, river gorges, fuel/rest intervals, payment tips)"
  ],
  ${customQuestion ? '"customAnswer": "Thorough, helpful direct answer to the user question with specific highway landmarks",' : ''}
}

Generate between 3 to 5 realistic, high-quality, geographically authentic stops along the route ordered sequentially from origin to destination. Ensure realistic kilometer milestones and travel times based on ${distanceKm} km total.`;

      const parsedPlan = await generateJsonWithModelFallback(ai, prompt);
      if (parsedPlan) {
        return res.json({ tripPlan: parsedPlan });
      }
      return res.json({ tripPlan: generateFallbackTripPlan() });
    } catch (error) {
      return res.json({ tripPlan: generateFallbackTripPlan() });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mero Sadak Highway Server running on http://localhost:${PORT}`);
  });
}

startServer();
