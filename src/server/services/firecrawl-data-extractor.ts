/**
 * Firecrawl Data Extractor
 * 
 * Extracts structured data (tables, metrics, dates, entities) from documents
 * scraped by Firecrawl using OpenAI for intelligent extraction.
 */

import OpenAI from 'openai';
import { scrapeOfficialDocument, isFirecrawlAvailable } from '../phase4/firecrawl-official-service';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY is required for data extraction');
}

const openai = new OpenAI({ apiKey: openaiApiKey });

export interface StructuredData {
  tables?: Array<{
    title?: string;
    headers: string[];
    rows: string[][];
    description?: string;
  }>;
  metrics?: Array<{
    name: string;
    value: string | number;
    unit?: string;
    date?: string;
    context?: string;
  }>;
  dates?: Array<{
    date: string;
    description: string;
    importance?: 'high' | 'medium' | 'low';
  }>;
  entities?: {
    organizations?: string[];
    people?: string[];
    locations?: string[];
    regulations?: string[];
  };
  citations?: Array<{
    text: string;
    source?: string;
    page?: string;
  }>;
  references?: Array<{
    text: string;
    url?: string;
    type?: 'regulation' | 'document' | 'website';
  }>;
}

export interface ExtractionResult {
  success: boolean;
  data: StructuredData | null;
  error?: string;
}

/**
 * Extract structured data from a document using OpenAI
 */
export async function extractStructuredData(
  content: string,
  url: string,
  documentType?: string
): Promise<ExtractionResult> {
  if (!content || content.length < 100) {
    return {
      success: false,
      data: null,
      error: 'Content too short or empty',
    };
  }

  try {
    const prompt = `You are a data extraction specialist. Extract structured information from the following official document.

Document URL: ${url}
Document Type: ${documentType || 'unknown'}

Extract the following information:
1. **Tables**: All tables with headers and rows (financial data, statistics, etc.)
2. **Metrics**: Key numerical metrics (percentages, amounts, rates, etc.) with context
3. **Important Dates**: Significant dates with descriptions and importance level
4. **Entities**: Organizations, people, locations, regulations mentioned
5. **Citations**: Quotes and citations with sources
6. **References**: Links to other documents, regulations, or resources

Return ONLY valid JSON in this structure:
{
  "tables": [
    {
      "title": "Table title if available",
      "headers": ["Column1", "Column2", ...],
      "rows": [["Value1", "Value2", ...], ...],
      "description": "What this table shows"
    }
  ],
  "metrics": [
    {
      "name": "Metric name",
      "value": "123.45 or number",
      "unit": "percentage, USD, etc.",
      "date": "2025-01-15",
      "context": "Context for this metric"
    }
  ],
  "dates": [
    {
      "date": "2025-03-01",
      "description": "Implementation deadline",
      "importance": "high"
    }
  ],
  "entities": {
    "organizations": ["Organization Name 1", ...],
    "people": ["Person Name", ...],
    "locations": ["Country/Region", ...],
    "regulations": ["Regulation Name/Number", ...]
  },
  "citations": [
    {
      "text": "Quoted text",
      "source": "Source name if available",
      "page": "Page number if available"
    }
  ],
  "references": [
    {
      "text": "Reference description",
      "url": "URL if available",
      "type": "regulation"
    }
  ]
}

Document Content (first 15000 characters):
${content.substring(0, 15000)}

Return ONLY the JSON object, no markdown, no explanations.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use mini for cost efficiency
      messages: [
        {
          role: 'system',
          content: 'You are a precise data extraction system. Return ONLY valid JSON, no other text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return {
        success: false,
        data: null,
        error: 'No response from OpenAI',
      };
    }

    // Parse JSON response
    let parsedData: StructuredData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError: any) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from OpenAI');
      }
    }

    return {
      success: true,
      data: parsedData,
    };
  } catch (error: any) {
    console.error('[FirecrawlDataExtractor] Error extracting structured data:', error);
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Extract structured data from a URL (scrape first, then extract)
 */
export async function extractStructuredDataFromUrl(
  url: string
): Promise<ExtractionResult & { document?: any }> {
  if (!isFirecrawlAvailable()) {
    return {
      success: false,
      data: null,
      error: 'Firecrawl not available',
    };
  }

  try {
    // Scrape document first
    const document = await scrapeOfficialDocument(url, { checkWhitelist: true });

    if (!document || !document.content) {
      return {
        success: false,
        data: null,
        error: 'Failed to scrape document or no content',
      };
    }

    // Extract domain for document type detection
    const domain = new URL(url).hostname;
    const documentType = domain.includes('gov') ? 'government' :
                         domain.includes('sec') || domain.includes('fca') ? 'regulator' :
                         domain.includes('bank') || domain.includes('federalreserve') || domain.includes('ecb') ? 'central_bank' :
                         'institution';

    // Extract structured data
    const extractionResult = await extractStructuredData(document.content, url, documentType);

    return {
      ...extractionResult,
      document: {
        url: document.domain,
        title: document.title,
        domain: document.domain,
        source_type: document.source_type,
      },
    };
  } catch (error: any) {
    console.error('[FirecrawlDataExtractor] Error extracting from URL:', error);
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Save extracted structured data to database
 */
export async function saveStructuredData(
  url: string,
  structuredData: StructuredData,
  eventId?: string,
  nucigenEventId?: string
): Promise<boolean> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[FirecrawlDataExtractor] Supabase not configured');
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if structured_data table exists, if not create it or store in metadata
    // For now, store in official_documents metadata column
    const { error: updateError } = await supabase
      .from('official_documents')
      .update({
        metadata: {
          ...structuredData,
          extracted_at: new Date().toISOString(),
        },
      })
      .eq('url', url);

    if (updateError) {
      console.error('[FirecrawlDataExtractor] Error saving structured data:', updateError);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('[FirecrawlDataExtractor] Error saving structured data:', error);
    return false;
  }
}
