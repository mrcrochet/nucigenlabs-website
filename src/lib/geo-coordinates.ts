/**
 * Country / region name → approximate [lat, lon] for globe markers.
 * Used when events have location text but no coordinates.
 */

const COUNTRY_COORDS: Record<string, [number, number]> = {
  // Countries (French + English where useful)
  'France': [46.2, 2.2],
  'Germany': [51.2, 10.5],
  'United Kingdom': [54.0, -2.0],
  'UK': [54.0, -2.0],
  'Spain': [40.4, -3.7],
  'Italy': [41.9, 12.6],
  'USA': [38.0, -97.0],
  'United States': [38.0, -97.0],
  'US': [38.0, -97.0],
  'China': [35.9, 104.2],
  'Japan': [36.2, 138.3],
  'India': [20.6, 78.9],
  'Russia': [61.5, 105.3],
  'Brazil': [-14.2, -51.9],
  'Canada': [56.1, -106.3],
  'Australia': [-25.3, 133.8],
  'South Korea': [35.9, 127.8],
  'Mexico': [23.6, -102.5],
  'Indonesia': [-0.8, 113.9],
  'Netherlands': [52.1, 5.3],
  'Saudi Arabia': [24.0, 45.0],
  'Turkey': [39.0, 35.0],
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
  'DRC': [-2.9, 23.4],
  'Congo': [-2.9, 23.4],
  'Kenya': [-0.0, 37.9],
  'Ethiopia': [9.1, 40.5],
  'Nigeria': [9.1, 8.7],
  'Morocco': [31.8, -7.1],
  'Algeria': [28.0, 3.0],
  'Tunisia': [34.0, 9.5],
  'Libya': [27.0, 17.0],
  'Qatar': [25.3, 51.2],
  'Kuwait': [29.3, 47.5],
  'Oman': [21.5, 55.9],
  'Bahrain': [26.1, 50.6],
  'Lebanon': [33.9, 35.9],
  'Jordan': [31.9, 36.3],
  'Syria': [35.0, 38.5],
  'Yemen': [15.6, 48.5],
  'Greece': [39.1, 21.8],
  'Portugal': [39.4, -8.2],
  'Ireland': [53.1, -8.0],
  'Sweden': [62.2, 17.6],
  'Norway': [60.5, 8.5],
  'Denmark': [56.3, 9.5],
  'Finland': [64.0, 26.0],
  'Austria': [47.5, 14.6],
  'Czech Republic': [49.8, 15.5],
  'Romania': [46.0, 25.0],
  'Hungary': [47.2, 19.5],
  'London': [51.5, -0.1],
  'Paris': [48.9, 2.4],
  'Berlin': [52.5, 13.4],
  'Brussels': [50.8, 4.4],
  'Moscow': [55.8, 37.6],
  'Beijing': [39.9, 116.4],
  'Tokyo': [35.7, 139.7],
  'New York': [40.7, -74.0],
  'Washington': [38.9, -77.0],
  'Dubai': [25.2, 55.3],
  'North Kivu': [-1.5, 29.2],
};

const REGION_COORDS: Record<string, [number, number]> = {
  'Global': [20.0, 0.0],
  'Europe': [50.0, 10.0],
  'European Union': [50.0, 10.0],
  'EU': [50.0, 10.0],
  'Middle East': [31.0, 44.0],
  'Moyen-Orient': [31.0, 44.0],
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
  'Latin America': [-15.0, -60.0],
  'Asia-Pacific': [10.0, 115.0],
  'APAC': [10.0, 115.0],
  'Oceania': [-25.0, 133.0],
  'Central Asia': [45.0, 70.0],
  'Southeast Asia': [5.0, 105.0],
  'Eastern Europe': [50.0, 25.0],
  'Western Europe': [49.0, 5.0],
  'Gulf': [26.0, 51.0],
  'Persian Gulf': [27.0, 51.0],
  'Red Sea': [20.0, 39.0],
};

function normalizeKey(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}

export interface GeoPoint {
  lat: number;
  lon: number;
  label?: string;
}

/**
 * Resolve event location (country, region, location text) to approximate coordinates.
 * Returns null if no match (event will be skipped on globe).
 */
export function eventToGeoPoint(event: {
  country?: string | null;
  region?: string | null;
  location?: string | null;
}): GeoPoint | null {
  const tryCoords = (key: string): [number, number] | undefined => {
    const n = normalizeKey(key);
    if (!n) return undefined;
    return COUNTRY_COORDS[n] ?? REGION_COORDS[n]
      ?? COUNTRY_COORDS[n.replace(/\s*\(.*\)\s*$/, '').trim()]
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

  // Try splitting location (e.g. "London, UK")
  if (event.location) {
    const parts = event.location.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      const coords = tryCoords(part);
      if (coords) return { lat: coords[0], lon: coords[1], label: event.location };
    }
  }

  return null;
}
