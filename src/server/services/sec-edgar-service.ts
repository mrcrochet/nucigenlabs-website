/**
 * SEC EDGAR Service
 * 
 * Fetches and extracts data from SEC EDGAR filings (10-K, 10-Q, 8-K, etc.).
 * Phase A.1: SEC/EDGAR Integration (PRIORITY HIGH)
 * 
 * Uses SEC EDGAR API (public, no API key required).
 * Files are parsed using OpenAI for structured extraction.
 */

import { createClient } from '@supabase/supabase-js';
import { callOpenAI } from './openai-optimizer';
import { logApiCall } from './api-metrics';
import { withCache, CacheOptions } from './cache-service';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SEC EDGAR API base URL (public API, no authentication required)
const SEC_EDGAR_API_BASE = 'https://data.sec.gov/api/xbrl';
const SEC_EDGAR_SUBMISSIONS = 'https://data.sec.gov/submissions';

// User agent required by SEC (must identify your app)
const SEC_USER_AGENT = 'Nucigen Labs (contact@nucigenlabs.com)';

export interface FilingMetadata {
  ticker: string;
  companyName: string;
  cik?: string;
  filingType: '10-K' | '10-Q' | '8-K' | 'DEF 14A' | 'S-1' | 'OTHER';
  filingDate: string; // YYYY-MM-DD
  periodEndDate?: string; // YYYY-MM-DD
  fiscalYear?: number;
  fiscalQuarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  accessionNumber: string;
  formType: string;
  filingUrl: string;
}

export interface ExtractedFinancialData {
  revenue?: number;
  revenueGrowth?: number;
  eps?: number;
  epsGrowth?: number;
  operatingMargin?: number;
  netMargin?: number;
  guidance?: {
    revenueLow?: number;
    revenueHigh?: number;
    epsLow?: number;
    epsHigh?: number;
  };
  keyHighlights?: string[];
  risks?: string[];
  outlook?: string;
}

export interface FilingResult {
  metadata: FilingMetadata;
  extractedData?: ExtractedFinancialData;
  rawContent?: string; // Full filing text (if requested)
  linkedEvents?: string[]; // Array of nucigen_events.id
}

/**
 * Fetch filing metadata from SEC EDGAR API
 */
async function fetchFilingMetadata(ticker: string, filingType: string, limit: number = 10): Promise<FilingMetadata[]> {
  try {
    // First, get company CIK from ticker
    // Note: SEC doesn't have a direct ticker->CIK endpoint, so we'll use a search approach
    // For production, consider maintaining a ticker->CIK mapping table
    const cik = await getCIKFromTicker(ticker);
    if (!cik) {
      throw new Error(`CIK not found for ticker: ${ticker}`);
    }

    // Fetch company submissions (contains all filings)
    const submissionsUrl = `${SEC_EDGAR_SUBMISSIONS}/CIK${cik.padStart(10, '0')}.json`;
    
    const response = await fetch(submissionsUrl, {
      headers: {
        'User-Agent': SEC_USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SEC API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter by filing type and format
    const filings: FilingMetadata[] = [];
    const recentFilings = data.filings?.recent || [];
    const formTypes = recentFilings.form || [];
    const filingDates = recentFilings.filingDate || [];
    const accessionNumbers = recentFilings.accessionNumber || [];
    const reportDates = recentFilings.reportDate || [];

    for (let i = 0; i < Math.min(formTypes.length, limit); i++) {
      const formType = formTypes[i];
      if (formType.toLowerCase().includes(filingType.toLowerCase()) || filingType === 'ALL') {
        filings.push({
          ticker,
          companyName: data.name || '',
          cik: cik,
          filingType: normalizeFilingType(formType),
          filingDate: filingDates[i] || '',
          periodEndDate: reportDates[i] || undefined,
          accessionNumber: accessionNumbers[i] || '',
          formType: formType,
          filingUrl: generateFilingUrl(cik, accessionNumbers[i], formType),
          fiscalYear: extractFiscalYear(reportDates[i]),
          fiscalQuarter: extractFiscalQuarter(formType, reportDates[i]),
        });
      }
    }

    return filings;
  } catch (error: any) {
    console.error(`[SEC EDGAR] Error fetching filing metadata for ${ticker}:`, error.message);
    throw error;
  }
}

/**
 * Get CIK (Central Index Key) from ticker symbol
 * Note: This is a simplified approach. For production, maintain a ticker->CIK mapping table.
 */
async function getCIKFromTicker(ticker: string): Promise<string | null> {
  // TODO: Implement proper ticker->CIK lookup
  // Option 1: Maintain a mapping table in Supabase
  // Option 2: Use a third-party API (e.g., Alpha Vantage, Yahoo Finance)
  // Option 3: Download and cache SEC company tickers JSON file
  
  // For now, return null and let the caller handle it
  // In production, implement one of the above options
  console.warn(`[SEC EDGAR] Ticker->CIK lookup not implemented for ${ticker}. Using placeholder.`);
  return null;
}

/**
 * Generate SEC EDGAR filing URL
 */
function generateFilingUrl(cik: string, accessionNumber: string, formType: string): string {
  // Remove dashes from accession number for URL
  const accessionNoDashes = accessionNumber.replace(/-/g, '');
  return `https://www.sec.gov/cgi-bin/viewer?action=view&cik=${cik}&accession_number=${accessionNumber}&xbrl_type=v`;
}

/**
 * Normalize filing type
 */
function normalizeFilingType(formType: string): FilingMetadata['filingType'] {
  const upper = formType.toUpperCase();
  if (upper.includes('10-K')) return '10-K';
  if (upper.includes('10-Q')) return '10-Q';
  if (upper.includes('8-K')) return '8-K';
  if (upper.includes('DEF 14A') || upper.includes('DEF14A')) return 'DEF 14A';
  if (upper.includes('S-1')) return 'S-1';
  return 'OTHER';
}

/**
 * Extract fiscal year from date string
 */
function extractFiscalYear(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  return date.getFullYear();
}

/**
 * Extract fiscal quarter from form type and date
 */
function extractFiscalQuarter(formType: string, dateStr?: string): 'Q1' | 'Q2' | 'Q3' | 'Q4' | undefined {
  if (formType.toUpperCase().includes('10-K')) return undefined; // Annual filing
  if (formType.toUpperCase().includes('10-Q')) {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    const month = date.getMonth() + 1; // 1-12
    if (month >= 1 && month <= 3) return 'Q1';
    if (month >= 4 && month <= 6) return 'Q2';
    if (month >= 7 && month <= 9) return 'Q3';
    if (month >= 10 && month <= 12) return 'Q4';
  }
  return undefined;
}

/**
 * Fetch filing content from SEC EDGAR (full text)
 */
async function fetchFilingContent(filingUrl: string): Promise<string> {
  try {
    const response = await fetch(filingUrl, {
      headers: {
        'User-Agent': SEC_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch filing content: ${response.status}`);
    }

    return await response.text();
  } catch (error: any) {
    console.error(`[SEC EDGAR] Error fetching filing content:`, error.message);
    throw error;
  }
}

/**
 * Extract financial data from filing content using OpenAI
 */
async function extractFinancialData(content: string, filingType: string): Promise<ExtractedFinancialData> {
  const systemPrompt = `You are a financial analyst expert at extracting structured financial data from SEC filings.
Extract key financial metrics from the filing content and return them in a structured JSON format.
Focus on: revenue, EPS, margins, guidance, key highlights, risks, and outlook.`;

  const userPrompt = `Extract financial data from this ${filingType} filing:

${content.substring(0, 15000)}... (truncated if longer)

Return a JSON object with:
{
  "revenue": <number or null>,
  "revenueGrowth": <percentage as decimal or null>,
  "eps": <number or null>,
  "epsGrowth": <percentage as decimal or null>,
  "operatingMargin": <percentage as decimal or null>,
  "netMargin": <percentage as decimal or null>,
  "guidance": {
    "revenueLow": <number or null>,
    "revenueHigh": <number or null>,
    "epsLow": <number or null>,
    "epsHigh": <number or null>
  },
  "keyHighlights": [<array of strings>],
  "risks": [<array of strings>],
  "outlook": <string or null>
}`;

  try {
    const result = await callOpenAI<ExtractedFinancialData>(
      userPrompt,
      systemPrompt,
      {
        model: 'gpt-4o-mini', // Use cost-effective model for extraction
        temperature: 0.1, // Low temperature for accuracy
        maxTokens: 2000,
      }
    );

    return result.data || {};
  } catch (error: any) {
    console.error('[SEC EDGAR] Error extracting financial data:', error.message);
    return {};
  }
}

/**
 * Save filing to database
 */
async function saveFilingToDatabase(
  metadata: FilingMetadata,
  extractedData?: ExtractedFinancialData,
  linkedEvents?: string[]
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('financial_filings')
      .insert({
        company_ticker: metadata.ticker,
        company_name: metadata.companyName,
        cik: metadata.cik,
        filing_type: metadata.filingType,
        filing_date: metadata.filingDate,
        period_end_date: metadata.periodEndDate || null,
        fiscal_year: metadata.fiscalYear || null,
        fiscal_quarter: metadata.fiscalQuarter || null,
        filing_url: metadata.filingUrl,
        accession_number: metadata.accessionNumber,
        form_type: metadata.formType,
        extracted_data: extractedData || null,
        linked_events: linkedEvents || [],
        processing_status: 'completed',
        extraction_model: 'gpt-4o-mini',
        extracted_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      // Handle duplicate (already exists)
      if (error.code === '23505') { // Unique violation
        const { data: existing } = await supabase
          .from('financial_filings')
          .select('id')
          .eq('accession_number', metadata.accessionNumber)
          .single();
        return existing?.id || '';
      }
      throw error;
    }

    return data?.id || '';
  } catch (error: any) {
    console.error('[SEC EDGAR] Error saving filing to database:', error.message);
    throw error;
  }
}

/**
 * Main function: Fetch and process SEC filing
 */
export async function fetchAndProcessFiling(
  ticker: string,
  filingType: string = '10-K',
  options: {
    extractData?: boolean;
    linkEvents?: boolean;
    maxFilings?: number;
  } = {}
): Promise<FilingResult[]> {
  const { extractData = true, linkEvents = false, maxFilings = 5 } = options;

  try {
    // Fetch filing metadata
    const filings = await fetchFilingMetadata(ticker, filingType, maxFilings);

    const results: FilingResult[] = [];

    for (const filing of filings) {
      let extractedData: ExtractedFinancialData | undefined;
      let linkedEvents: string[] = [];

      // Extract financial data if requested
      if (extractData) {
        try {
          const content = await fetchFilingContent(filing.filingUrl);
          extractedData = await extractFinancialData(content, filing.filingType);
        } catch (error: any) {
          console.warn(`[SEC EDGAR] Failed to extract data for ${filing.accessionNumber}:`, error.message);
        }
      }

      // Link related events if requested
      if (linkEvents) {
        // TODO: Implement event linking logic (match by company name, sector, dates, etc.)
        // For now, leave empty
      }

      // Save to database
      const filingId = await saveFilingToDatabase(filing, extractedData, linkedEvents);

      results.push({
        metadata: filing,
        extractedData,
        linkedEvents,
      });
    }

    return results;
  } catch (error: any) {
    console.error(`[SEC EDGAR] Error processing filing for ${ticker}:`, error.message);
    throw error;
  }
}

/**
 * Get filings from database
 */
export async function getFilingsFromDatabase(
  ticker?: string,
  filingType?: string,
  limit: number = 50
): Promise<any[]> {
  try {
    let query = supabase
      .from('financial_filings')
      .select('*')
      .order('filing_date', { ascending: false })
      .limit(limit);

    if (ticker) {
      query = query.eq('company_ticker', ticker);
    }

    if (filingType) {
      query = query.eq('filing_type', filingType);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('[SEC EDGAR] Error fetching filings from database:', error.message);
    throw error;
  }
}
