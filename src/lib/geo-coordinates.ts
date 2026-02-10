/**
 * Country / region name → approximate [lat, lon] for globe markers.
 * Used when events have location text but no coordinates.
 *
 * All lookups are case-insensitive. Includes English, French,
 * abbreviations, and major financial/geopolitical cities.
 */

const COUNTRY_COORDS: Record<string, [number, number]> = {
  // ---- Countries (English) ----
  'France': [46.2, 2.2],
  'Germany': [51.2, 10.5],
  'United Kingdom': [54.0, -2.0],
  'UK': [54.0, -2.0],
  'U.K.': [54.0, -2.0],
  'Great Britain': [54.0, -2.0],
  'Spain': [40.4, -3.7],
  'Italy': [41.9, 12.6],
  'USA': [38.0, -97.0],
  'U.S.': [38.0, -97.0],
  'U.S.A.': [38.0, -97.0],
  'United States': [38.0, -97.0],
  'United States of America': [38.0, -97.0],
  'US': [38.0, -97.0],
  'China': [35.9, 104.2],
  "People's Republic of China": [35.9, 104.2],
  'PRC': [35.9, 104.2],
  'Japan': [36.2, 138.3],
  'India': [20.6, 78.9],
  'Russia': [61.5, 105.3],
  'Russian Federation': [61.5, 105.3],
  'Brazil': [-14.2, -51.9],
  'Canada': [56.1, -106.3],
  'Australia': [-25.3, 133.8],
  'South Korea': [35.9, 127.8],
  'Republic of Korea': [35.9, 127.8],
  'ROK': [35.9, 127.8],
  'North Korea': [40.0, 127.0],
  'DPRK': [40.0, 127.0],
  'Mexico': [23.6, -102.5],
  'Indonesia': [-0.8, 113.9],
  'Netherlands': [52.1, 5.3],
  'The Netherlands': [52.1, 5.3],
  'Saudi Arabia': [24.0, 45.0],
  'KSA': [24.0, 45.0],
  'Turkey': [39.0, 35.0],
  'Turkiye': [39.0, 35.0],
  'UAE': [24.0, 54.0],
  'United Arab Emirates': [24.0, 54.0],
  'South Africa': [-30.6, 22.9],
  'Egypt': [26.8, 30.8],
  'Israel': [31.0, 34.8],
  'Iran': [32.4, 53.7],
  'Iraq': [33.0, 44.0],
  'Ukraine': [48.4, 31.2],
  'Poland': [52.0, 20.0],
  'Switzerland': [46.8, 8.2],
  'Belgium': [50.5, 4.5],
  'Singapore': [1.35, 103.8],
  'Hong Kong': [22.3, 114.2],
  'Taiwan': [23.7, 121.0],
  'Vietnam': [14.1, 108.3],
  'Thailand': [15.9, 100.9],
  'Malaysia': [4.2, 101.9],
  'Philippines': [12.9, 121.8],
  'Pakistan': [30.4, 69.3],
  'Bangladesh': [23.7, 90.4],
  'Argentina': [-38.4, -63.6],
  'Chile': [-35.7, -71.5],
  'Colombia': [4.6, -74.1],
  'Venezuela': [6.4, -66.6],
  'Peru': [-9.2, -75.0],
  'Ecuador': [-1.8, -78.2],
  'Bolivia': [-16.3, -63.6],
  'Uruguay': [-32.5, -55.8],
  'Paraguay': [-23.4, -58.4],
  'Cuba': [21.5, -80.0],
  'DRC': [-2.9, 23.4],
  'Congo': [-2.9, 23.4],
  'Democratic Republic of the Congo': [-2.9, 23.4],
  'Republic of the Congo': [-4.3, 15.3],
  'Kenya': [-0.0, 37.9],
  'Ethiopia': [9.1, 40.5],
  'Nigeria': [9.1, 8.7],
  'Morocco': [31.8, -7.1],
  'Algeria': [28.0, 3.0],
  'Tunisia': [34.0, 9.5],
  'Libya': [27.0, 17.0],
  'Sudan': [12.9, 30.2],
  'South Sudan': [6.9, 31.3],
  'Somalia': [5.2, 46.2],
  'Tanzania': [-6.4, 34.9],
  'Uganda': [1.4, 32.3],
  'Ghana': [7.9, -1.0],
  'Cameroon': [7.4, 12.4],
  'Mozambique': [-18.7, 35.5],
  'Madagascar': [-18.8, 47.5],
  'Angola': [-11.2, 17.9],
  'Zambia': [-13.1, 27.8],
  'Zimbabwe': [-19.0, 29.2],
  'Senegal': [14.5, -14.5],
  'Mali': [17.6, -4.0],
  'Niger': [17.6, 8.1],
  'Burkina Faso': [12.4, -1.6],
  'Chad': [15.5, 18.7],
  'Qatar': [25.3, 51.2],
  'Kuwait': [29.3, 47.5],
  'Oman': [21.5, 55.9],
  'Bahrain': [26.1, 50.6],
  'Lebanon': [33.9, 35.9],
  'Jordan': [31.9, 36.3],
  'Syria': [35.0, 38.5],
  'Yemen': [15.6, 48.5],
  'Afghanistan': [33.9, 67.7],
  'Myanmar': [19.8, 96.0],
  'Burma': [19.8, 96.0],
  'Cambodia': [12.6, 105.0],
  'Laos': [19.9, 102.5],
  'Sri Lanka': [7.9, 80.8],
  'Nepal': [28.4, 84.1],
  'Greece': [39.1, 21.8],
  'Portugal': [39.4, -8.2],
  'Ireland': [53.1, -8.0],
  'Sweden': [62.2, 17.6],
  'Norway': [60.5, 8.5],
  'Denmark': [56.3, 9.5],
  'Finland': [64.0, 26.0],
  'Austria': [47.5, 14.6],
  'Czech Republic': [49.8, 15.5],
  'Czechia': [49.8, 15.5],
  'Romania': [46.0, 25.0],
  'Hungary': [47.2, 19.5],
  'Slovakia': [48.7, 19.7],
  'Bulgaria': [42.7, 25.5],
  'Croatia': [45.1, 15.2],
  'Serbia': [44.0, 21.0],
  'Lithuania': [55.2, 23.9],
  'Latvia': [56.9, 24.1],
  'Estonia': [58.6, 25.0],
  'Slovenia': [46.2, 14.8],
  'Luxembourg': [49.8, 6.1],
  'Iceland': [65.0, -18.0],
  'Georgia': [42.3, 43.4],
  'Armenia': [40.1, 45.0],
  'Azerbaijan': [40.1, 47.6],
  'Kazakhstan': [48.0, 68.0],
  'Uzbekistan': [41.4, 64.6],
  'Turkmenistan': [39.0, 59.6],
  'Mongolia': [46.9, 103.8],
  'New Zealand': [-40.9, 174.9],

  // ---- French country names ----
  'Etats-Unis': [38.0, -97.0],
  'États-Unis': [38.0, -97.0],
  'Royaume-Uni': [54.0, -2.0],
  'Allemagne': [51.2, 10.5],
  'Espagne': [40.4, -3.7],
  'Italie': [41.9, 12.6],
  'Chine': [35.9, 104.2],
  'Japon': [36.2, 138.3],
  'Inde': [20.6, 78.9],
  'Russie': [61.5, 105.3],
  'Bresil': [-14.2, -51.9],
  'Brésil': [-14.2, -51.9],
  'Afrique du Sud': [-30.6, 22.9],
  'Arabie Saoudite': [24.0, 45.0],
  'Coree du Sud': [35.9, 127.8],
  'Corée du Sud': [35.9, 127.8],
  'Turquie': [39.0, 35.0],
  'Suisse': [46.8, 8.2],
  'Belgique': [50.5, 4.5],
  'Pays-Bas': [52.1, 5.3],
  'Mexique': [23.6, -102.5],
  'Indonesie': [-0.8, 113.9],
  'Indonésie': [-0.8, 113.9],
  'Egypte': [26.8, 30.8],
  'Égypte': [26.8, 30.8],
  'Grece': [39.1, 21.8],
  'Grèce': [39.1, 21.8],
  'Autriche': [47.5, 14.6],
  'Pologne': [52.0, 20.0],
  'Roumanie': [46.0, 25.0],
  'Suede': [62.2, 17.6],
  'Suède': [62.2, 17.6],
  'Norvege': [60.5, 8.5],
  'Norvège': [60.5, 8.5],
  'Danemark': [56.3, 9.5],
  'Finlande': [64.0, 26.0],
  'Irlande': [53.1, -8.0],
  'Maroc': [31.8, -7.1],
  'Algerie': [28.0, 3.0],
  'Algérie': [28.0, 3.0],
  'Tunisie': [34.0, 9.5],
  'Libye': [27.0, 17.0],
  'Liban': [33.9, 35.9],
  'Jordanie': [31.9, 36.3],
  'Syrie': [35.0, 38.5],

  // ---- Cities ----
  'London': [51.5, -0.1],
  'Paris': [48.9, 2.4],
  'Berlin': [52.5, 13.4],
  'Brussels': [50.8, 4.4],
  'Moscow': [55.8, 37.6],
  'Beijing': [39.9, 116.4],
  'Tokyo': [35.7, 139.7],
  'New York': [40.7, -74.0],
  'Washington': [38.9, -77.0],
  'Washington D.C.': [38.9, -77.0],
  'Washington DC': [38.9, -77.0],
  'Dubai': [25.2, 55.3],
  'North Kivu': [-1.5, 29.2],
  'Shanghai': [31.2, 121.5],
  'Mumbai': [19.1, 72.9],
  'Delhi': [28.6, 77.2],
  'New Delhi': [28.6, 77.2],
  'Sao Paulo': [-23.6, -46.6],
  'São Paulo': [-23.6, -46.6],
  'Jakarta': [-6.2, 106.8],
  'Seoul': [37.6, 127.0],
  'Sydney': [-33.9, 151.2],
  'Istanbul': [41.0, 29.0],
  'Riyadh': [24.7, 46.7],
  'Doha': [25.3, 51.5],
  'Geneva': [46.2, 6.1],
  'Zurich': [47.4, 8.5],
  'Frankfurt': [50.1, 8.7],
  'Amsterdam': [52.4, 4.9],
  'Tel Aviv': [32.1, 34.8],
  'Taipei': [25.0, 121.5],
  'Cairo': [30.0, 31.2],
  'Lagos': [6.5, 3.4],
  'Nairobi': [-1.3, 36.8],
  'Johannesburg': [-26.2, 28.0],
  'Cape Town': [-33.9, 18.4],
  'Abuja': [9.1, 7.5],
  'Addis Ababa': [9.0, 38.7],
  'Kinshasa': [-4.3, 15.3],
  'Beirut': [33.9, 35.5],
  'Baghdad': [33.3, 44.4],
  'Tehran': [35.7, 51.4],
  'Islamabad': [33.7, 73.1],
  'Karachi': [24.9, 67.0],
  'Dhaka': [23.8, 90.4],
  'Bangkok': [13.8, 100.5],
  'Hanoi': [21.0, 105.8],
  'Ho Chi Minh City': [10.8, 106.6],
  'Kuala Lumpur': [3.1, 101.7],
  'Manila': [14.6, 121.0],
  'Ankara': [39.9, 32.9],
  'Kyiv': [50.5, 30.5],
  'Kiev': [50.5, 30.5],
  'Warsaw': [52.2, 21.0],
  'Bucharest': [44.4, 26.1],
  'Budapest': [47.5, 19.0],
  'Prague': [50.1, 14.4],
  'Vienna': [48.2, 16.4],
  'Stockholm': [59.3, 18.1],
  'Oslo': [59.9, 10.8],
  'Copenhagen': [55.7, 12.6],
  'Helsinki': [60.2, 24.9],
  'Dublin': [53.3, -6.3],
  'Lisbon': [38.7, -9.1],
  'Madrid': [40.4, -3.7],
  'Rome': [41.9, 12.5],
  'Milan': [45.5, 9.2],
  'Munich': [48.1, 11.6],
  'Athens': [37.9, 23.7],
  'Lima': [-12.0, -77.0],
  'Bogota': [4.7, -74.1],
  'Buenos Aires': [-34.6, -58.4],
  'Santiago': [-33.4, -70.7],
  'Mexico City': [19.4, -99.1],
  'Havana': [23.1, -82.4],
  'Panama City': [9.0, -79.5],
  'Brasilia': [-15.8, -47.9],
  'Rio de Janeiro': [-22.9, -43.2],
};

const REGION_COORDS: Record<string, [number, number]> = {
  'Europe': [50.0, 10.0],
  'European Union': [50.0, 10.0],
  'EU': [50.0, 10.0],
  'E.U.': [50.0, 10.0],
  'Middle East': [31.0, 44.0],
  'Moyen-Orient': [31.0, 44.0],
  'MENA': [30.0, 30.0],
  'Asia': [34.0, 105.0],
  'Asie': [34.0, 105.0],
  'North America': [48.0, -100.0],
  'Amérique du Nord': [48.0, -100.0],
  'South America': [-15.0, -60.0],
  'Amérique du Sud': [-15.0, -60.0],
  'Africa': [0.0, 22.0],
  'Afrique': [0.0, 22.0],
  'Sub-Saharan Africa': [-5.0, 25.0],
  'West Africa': [10.0, -5.0],
  'East Africa': [2.0, 38.0],
  'North Africa': [30.0, 10.0],
  'Southern Africa': [-25.0, 25.0],
  'Central Africa': [2.0, 20.0],
  'Horn of Africa': [8.0, 45.0],
  'Sahel': [15.0, 0.0],
  'Latin America': [-15.0, -60.0],
  'Central America': [15.0, -87.0],
  'Caribbean': [18.0, -72.0],
  'Asia-Pacific': [10.0, 115.0],
  'APAC': [10.0, 115.0],
  'Oceania': [-25.0, 133.0],
  'Central Asia': [45.0, 70.0],
  'Southeast Asia': [5.0, 105.0],
  'South Asia': [22.0, 78.0],
  'East Asia': [35.0, 120.0],
  'Eastern Europe': [50.0, 25.0],
  'Western Europe': [49.0, 5.0],
  'Nordic': [62.0, 15.0],
  'Scandinavia': [62.0, 15.0],
  'Balkans': [42.0, 21.0],
  'Baltic': [57.0, 24.0],
  'Gulf': [26.0, 51.0],
  'Persian Gulf': [27.0, 51.0],
  'Gulf States': [26.0, 51.0],
  'GCC': [24.0, 50.0],
  'Red Sea': [20.0, 39.0],
  'Strait of Hormuz': [26.6, 56.3],
  'Strait of Malacca': [2.5, 101.5],
  'South China Sea': [12.0, 115.0],
  'Taiwan Strait': [24.0, 119.5],
  'Black Sea': [43.0, 34.0],
  'Mediterranean': [36.0, 18.0],
  'Arctic': [75.0, 0.0],
  'Antarctic': [-75.0, 0.0],
  'Pacific': [0.0, -150.0],
  'Atlantic': [30.0, -40.0],
  'Indian Ocean': [-10.0, 70.0],
  'Global': [20.0, 0.0],
};

/**
 * Build case-insensitive lookup maps at module load.
 * Keys are lowercased; values are [lat, lon].
 */
const NORMALIZED_COUNTRY: Record<string, [number, number]> = {};
for (const [key, val] of Object.entries(COUNTRY_COORDS)) {
  NORMALIZED_COUNTRY[key.toLowerCase()] = val;
}

const NORMALIZED_REGION: Record<string, [number, number]> = {};
for (const [key, val] of Object.entries(REGION_COORDS)) {
  NORMALIZED_REGION[key.toLowerCase()] = val;
}

export interface GeoPoint {
  lat: number;
  lon: number;
  label?: string;
}

/**
 * Resolve event location (country, region, location text) to approximate coordinates.
 * Case-insensitive. Returns null if no match (event will be skipped on globe).
 */
export function eventToGeoPoint(event: {
  country?: string | null;
  region?: string | null;
  location?: string | null;
}): GeoPoint | null {
  const tryCoords = (key: string): [number, number] | undefined => {
    const n = key.trim().replace(/\s+/g, ' ');
    if (!n) return undefined;
    const lower = n.toLowerCase();
    return NORMALIZED_COUNTRY[lower]
      ?? NORMALIZED_REGION[lower]
      // Try stripping parenthetical suffixes: "China (mainland)" → "china"
      ?? NORMALIZED_COUNTRY[lower.replace(/\s*\(.*\)\s*$/, '').trim()]
      // Try stripping "the " prefix: "the netherlands" → "netherlands"
      ?? NORMALIZED_COUNTRY[lower.replace(/^the\s+/, '')]
      ?? undefined;
  };

  const sources = [
    event.country,
    event.region,
    event.location,
  ].filter(Boolean) as string[];

  for (const src of sources) {
    const coords = tryCoords(src);
    if (coords) {
      return { lat: coords[0], lon: coords[1], label: src };
    }
  }

  // Try splitting composite locations (e.g. "London, UK" or "Beijing; China")
  for (const src of sources) {
    const parts = src.split(/[,;/]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      for (const part of parts) {
        const coords = tryCoords(part);
        if (coords) return { lat: coords[0], lon: coords[1], label: src };
      }
    }
  }

  return null;
}
