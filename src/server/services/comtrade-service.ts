/**
 * UN Comtrade API Service
 * 
 * Wrapper for UN Comtrade API to fetch international trade data
 * Used for validating and quantifying trade impacts of geopolitical events
 * 
 * API Documentation: https://unstats.un.org/wiki/display/comtrade/
 * 
 * Primary key: 4845fb8db76c4506b957dacb20ff5ed4
 * Secondary key: b11e0865d9db4dfb8312ac2e18af2351
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });
dotenv.config();

// UN Comtrade API configuration
const COMTRADE_BASE_URL = 'https://comtradeapi.un.org/data/v1/get';
const COMTRADE_PRIMARY_KEY = process.env.COMTRADE_PRIMARY_KEY || '4845fb8db76c4506b957dacb20ff5ed4';
const COMTRADE_SECONDARY_KEY = process.env.COMTRADE_SECONDARY_KEY || 'b11e0865d9db4dfb8312ac2e18af2351';

export interface ComtradeQuery {
  reporterCode?: string; // ISO country code (e.g., "643" for Russia, "276" for Germany)
  partnerCode?: string; // ISO country code
  tradeFlow?: 'X' | 'M'; // X = Export, M = Import
  period: string; // YYYYMM format (e.g., "202401")
  cmdCode?: string; // HS code (e.g., "2709" for crude oil)
  freq?: 'A' | 'M'; // A = Annual, M = Monthly
  max?: number; // Max results (default: 1000)
}

export interface ComtradeResponse {
  validation: {
    status: {
      name: string;
      value: number;
    };
  };
  dataset: Array<{
    refPeriodId: string; // Period (YYYYMM)
    refPeriod: string; // Period description
    flowCode: string; // Trade flow code
    flowDesc: string; // Trade flow description
    reporterCode: string; // Reporter country code
    reporterDesc: string; // Reporter country name
    partnerCode: string; // Partner country code
    partnerDesc: string; // Partner country name
    cmdCode: string; // HS code
    cmdDesc: string; // Product description
    primaryValue: number; // Trade value in USD
    netWgt: number; // Net weight in kg
    grossWgt: number; // Gross weight in kg
  }>;
}

/**
 * Get trade data from UN Comtrade API
 */
export async function getComtradeData(query: ComtradeQuery): Promise<ComtradeResponse | null> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (query.reporterCode) {
      params.append('reporterCode', query.reporterCode);
    }
    if (query.partnerCode) {
      params.append('partnerCode', query.partnerCode);
    }
    if (query.tradeFlow) {
      params.append('flowCode', query.tradeFlow);
    }
    params.append('period', query.period);
    if (query.cmdCode) {
      params.append('cmdCode', query.cmdCode);
    }
    params.append('freq', query.freq || 'M');
    params.append('max', String(query.max || 1000));
    params.append('format', 'json');
    params.append('type', 'C'); // C = Commodities

    const url = `${COMTRADE_BASE_URL}?${params.toString()}`;

    console.log(`[Comtrade] Fetching data: ${url.substring(0, 100)}...`);

    // Try primary key first, fallback to secondary
    let response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': COMTRADE_PRIMARY_KEY,
      },
    });

    if (!response.ok && response.status === 401) {
      // Try secondary key
      console.log('[Comtrade] Primary key failed, trying secondary key...');
      response = await fetch(url, {
        headers: {
          'Ocp-Apim-Subscription-Key': COMTRADE_SECONDARY_KEY,
        },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Comtrade] API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Comtrade API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check validation status
    if (data.validation?.status?.value !== 0) {
      console.warn(`[Comtrade] Validation warning: ${data.validation?.status?.name}`);
    }

    return data as ComtradeResponse;
  } catch (error: any) {
    console.error('[Comtrade] Error fetching data:', error.message);
    return null;
  }
}

/**
 * Get country code from country name
 * Common country codes for major players
 */
export function getCountryCode(countryName: string): string | null {
  const countryMap: Record<string, string> = {
    'russia': '643',
    'russian federation': '643',
    'germany': '276',
    'france': '250',
    'united states': '842',
    'usa': '842',
    'us': '842',
    'china': '156',
    'united kingdom': '826',
    'uk': '826',
    'italy': '380',
    'spain': '724',
    'netherlands': '528',
    'poland': '616',
    'belgium': '056',
    'greece': '300',
    'portugal': '620',
    'austria': '040',
    'sweden': '752',
    'denmark': '208',
    'finland': '246',
    'norway': '234',
    'ireland': '372',
    'czech republic': '203',
    'romania': '642',
    'hungary': '348',
    'slovakia': '703',
    'bulgaria': '100',
    'croatia': '191',
    'slovenia': '705',
    'estonia': '233',
    'latvia': '233',
    'lithuania': '440',
    'japan': '392',
    'south korea': '410',
    'india': '699',
    'brazil': '076',
    'canada': '124',
    'australia': '036',
    'mexico': '484',
    'turkey': '792',
    'saudi arabia': '682',
    'uae': '784',
    'united arab emirates': '784',
    'south africa': '710',
    'argentina': '032',
    'chile': '152',
    'indonesia': '360',
    'malaysia': '458',
    'thailand': '764',
    'vietnam': '704',
    'philippines': '608',
    'singapore': '702',
    'taiwan': '158',
    'hong kong': '344',
    'israel': '376',
    'egypt': '818',
    'nigeria': '566',
    'kenya': '404',
    'ukraine': '804',
    'belarus': '112',
    'kazakhstan': '398',
    'iran': '364',
    'iraq': '368',
    'qatar': '634',
    'kuwait': '414',
    'oman': '512',
    'bangladesh': '050',
    'pakistan': '586',
    'sri lanka': '144',
  };

  const normalized = countryName.toLowerCase().trim();
  return countryMap[normalized] || null;
}

/**
 * Get HS code from product/sector name
 * Common HS codes for key sectors
 */
export function getHSCode(productName: string, sector?: string): string[] {
  const productMap: Record<string, string[]> = {
    // Energy
    'crude oil': ['2709'],
    'petroleum': ['2709', '2710'],
    'natural gas': ['2711'],
    'coal': ['2701'],
    'lng': ['2711'],
    'refined oil': ['2710'],
    // Technology
    'semiconductors': ['8541'],
    'chips': ['8541'],
    'integrated circuits': ['8541'],
    'computers': ['8471'],
    'telecommunications': ['8517'],
    // Materials
    'rare earth': ['2805'],
    'lithium': ['2805'],
    'copper': ['7403'],
    'aluminum': ['7601'],
    'steel': ['7207'],
    'iron ore': ['2601'],
    // Agriculture
    'wheat': ['1001'],
    'corn': ['1005'],
    'soybeans': ['1201'],
    'rice': ['1006'],
    // Manufacturing
    'machinery': ['8479'],
    'vehicles': ['8703'],
    'pharmaceuticals': ['3004'],
  };

  const normalized = productName.toLowerCase().trim();
  
  // Try direct match
  if (productMap[normalized]) {
    return productMap[normalized];
  }

  // Try sector-based mapping
  if (sector) {
    const sectorNormalized = sector.toLowerCase();
    if (sectorNormalized.includes('energy') || sectorNormalized.includes('oil') || sectorNormalized.includes('gas')) {
      return ['2709', '2710', '2711'];
    }
    if (sectorNormalized.includes('technology') || sectorNormalized.includes('semiconductor')) {
      return ['8541'];
    }
    if (sectorNormalized.includes('material') || sectorNormalized.includes('mining')) {
      return ['2805', '7403', '7601'];
    }
  }

  // Default: return empty array (will search broadly)
  return [];
}

/**
 * Check if Comtrade service is available
 */
export function isComtradeAvailable(): boolean {
  return !!(COMTRADE_PRIMARY_KEY && COMTRADE_SECONDARY_KEY);
}
