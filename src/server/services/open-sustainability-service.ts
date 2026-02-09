/**
 * Open Sustainability Index (OSI) — ESG scores from crowd-sourced open data.
 * API: https://www.opensustainabilityindex.org/api
 * Data: CC BY-SA 4.0. API key may be required (contact OSI).
 */

const OSI_BASE_URL = process.env.OPEN_SUSTAINABILITY_INDEX_API_URL || 'https://api.opensustainabilityindex.org';
const OSI_API_KEY = process.env.OPEN_SUSTAINABILITY_INDEX_API_KEY;

export interface ESGScores {
  companyName: string;
  environmental?: number | null;
  social?: number | null;
  governance?: number | null;
  /** Overall or composite score if provided */
  overall?: number | null;
  sourceUrl: string;
  /** Raw response for debugging or extra fields */
  raw?: Record<string, unknown>;
}

/**
 * Fetch ESG scores for a company by name or identifier.
 * Returns null if API is unavailable, key missing, or company not found.
 */
export async function fetchESGScores(company: string): Promise<ESGScores | null> {
  const trimmed = (company || '').trim();
  if (!trimmed) return null;

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    if (OSI_API_KEY) {
      headers['x-api-key'] = OSI_API_KEY;
      headers['Authorization'] = `Bearer ${OSI_API_KEY}`;
    }

    // Try common API patterns: search by company name
    const searchParams = new URLSearchParams({ q: trimmed });
    const url = `${OSI_BASE_URL}/companies?${searchParams.toString()}`;
    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        console.warn('[OSI] API key invalid or missing');
        return null;
      }
      if (res.status === 404) return null;
      console.warn('[OSI] API error:', res.status, await res.text().catch(() => ''));
      return null;
    }

    const data = await res.json().catch(() => null);
    if (!data) return null;

    // Normalize: support array of companies or single company object
    const companyData = Array.isArray(data) ? data[0] : data?.data ?? data;
    if (!companyData || typeof companyData !== 'object') return null;

    const env = companyData.environmental_score ?? companyData.environmental ?? companyData.e;
    const soc = companyData.social_score ?? companyData.social ?? companyData.s;
    const gov = companyData.governance_score ?? companyData.governance ?? companyData.g;
    const overall = companyData.overall_score ?? companyData.overall ?? companyData.score;
    const name = companyData.name ?? companyData.company_name ?? trimmed;
    const sourceUrl = 'https://www.opensustainabilityindex.org/companies';

    return {
      companyName: String(name),
      environmental: typeof env === 'number' ? env : null,
      social: typeof soc === 'number' ? soc : null,
      governance: typeof gov === 'number' ? gov : null,
      overall: typeof overall === 'number' ? overall : null,
      sourceUrl,
      raw: companyData,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes('abort') && !message.includes('timeout')) {
      console.warn('[OSI] fetch failed:', message);
    }
    return null;
  }
}
