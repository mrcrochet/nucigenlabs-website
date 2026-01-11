/**
 * Firecrawl Validator
 * 
 * Validates event information against official sources scraped by Firecrawl.
 * Performs fact-checking, detects inconsistencies, and generates confidence scores.
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { scrapeOfficialDocument, isFirecrawlAvailable } from '../phase4/firecrawl-official-service';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY is required for validation');
}

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const openai = new OpenAI({ apiKey: openaiApiKey });
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  source_evidence?: string;
  suggested_correction?: string;
}

export interface ValidationResult {
  validated: boolean;
  confidence_score: number; // 0-1
  issues: ValidationIssue[];
  verified_fields: string[];
  inconsistencies: Array<{
    event_value: any;
    source_value: any;
    field: string;
    source_url: string;
  }>;
  source_verification: Array<{
    source_url: string;
    matches: boolean;
    confidence: number;
  }>;
}

/**
 * Get official documents related to an event
 */
async function getRelatedOfficialDocuments(
  eventId: string,
  nucigenEventId?: string | null
): Promise<Array<{ url: string; content: string; domain: string; source_type: string }>> {
  try {
    let query = supabase
      .from('official_documents')
      .select('url, content, domain, source_type');

    if (nucigenEventId) {
      query = query.eq('nucigen_event_id', nucigenEventId);
    } else {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[FirecrawlValidator] Error fetching related documents:', error);
      return [];
    }

    return (data || []).map(doc => ({
      url: doc.url,
      content: doc.content || '',
      domain: doc.domain,
      source_type: doc.source_type,
    }));
  } catch (error: any) {
    console.error('[FirecrawlValidator] Error fetching related documents:', error);
    return [];
  }
}

/**
 * Validate event information against official sources using OpenAI
 */
export async function validateEvent(
  eventId: string,
  nucigenEventId?: string | null
): Promise<ValidationResult> {
  try {
    // Get event data
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError || !event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // Get nucigen_event if exists
    let nucigenEvent = null;
    if (nucigenEventId) {
      const { data } = await supabase
        .from('nucigen_events')
        .select('*')
        .eq('id', nucigenEventId)
        .maybeSingle();
      nucigenEvent = data;
    }

    // Get related official documents
    const officialDocs = await getRelatedOfficialDocuments(eventId, nucigenEventId);

    if (officialDocs.length === 0) {
      // No official sources to validate against
      return {
        validated: false,
        confidence_score: 0.5, // Neutral confidence
        issues: [],
        verified_fields: [],
        inconsistencies: [],
        source_verification: [],
      };
    }

    // Prepare event data for validation
    const eventData = {
      title: event.title,
      summary: nucigenEvent?.summary || event.description,
      country: nucigenEvent?.country || event.country,
      region: nucigenEvent?.region || event.region,
      sector: nucigenEvent?.sector || event.sector,
      actors: nucigenEvent?.actors || [],
      why_it_matters: nucigenEvent?.why_it_matters,
      first_order_effect: nucigenEvent?.first_order_effect,
      second_order_effect: nucigenEvent?.second_order_effect,
      impact_score: nucigenEvent?.impact_score,
      confidence: nucigenEvent?.confidence,
      published_at: event.published_at,
      url: event.url,
    };

    // Use OpenAI to validate against official sources
    const officialSourcesText = officialDocs
      .map((doc, index) => `[Source ${index + 1}: ${doc.domain} (${doc.source_type})]\n${doc.content.substring(0, 5000)}`)
      .join('\n\n---\n\n');

    const validationPrompt = `You are a fact-checking specialist. Validate the following event information against official sources.

EVENT TO VALIDATE:
${JSON.stringify(eventData, null, 2)}

OFFICIAL SOURCES:
${officialSourcesText.substring(0, 20000)}

TASK:
1. Compare event information with official sources
2. Identify any inconsistencies or errors
3. Verify which fields match the sources
4. Suggest corrections if discrepancies are found
5. Calculate an overall confidence score (0-1)

Return ONLY valid JSON in this structure:
{
  "validated": true/false,
  "confidence_score": 0.0-1.0,
  "issues": [
    {
      "field": "field_name",
      "severity": "error|warning|info",
      "message": "Description of issue",
      "source_evidence": "Quote from source",
      "suggested_correction": "Corrected value if applicable"
    }
  ],
  "verified_fields": ["field1", "field2", ...],
  "inconsistencies": [
    {
      "event_value": "value in event",
      "source_value": "value in source",
      "field": "field_name",
      "source_url": "source URL"
    }
  ],
  "source_verification": [
    {
      "source_url": "URL",
      "matches": true/false,
      "confidence": 0.0-1.0
    }
  ]
}

Return ONLY the JSON object, no markdown, no explanations.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precise fact-checking system. Return ONLY valid JSON, no other text.',
        },
        {
          role: 'user',
          content: validationPrompt,
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    let validationResult: ValidationResult;
    try {
      validationResult = JSON.parse(responseText);
    } catch (parseError: any) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from OpenAI');
      }
    }

    // Enhance source URLs in verification results
    validationResult.source_verification = validationResult.source_verification?.map(verification => {
      const matchingDoc = officialDocs.find(doc => doc.url.includes(verification.source_url) || verification.source_url.includes(doc.url));
      return {
        ...verification,
        source_url: matchingDoc?.url || verification.source_url,
      };
    }) || [];

    return validationResult;
  } catch (error: any) {
    console.error('[FirecrawlValidator] Error validating event:', error);
    return {
      validated: false,
      confidence_score: 0.0,
      issues: [{
        field: 'validation_error',
        severity: 'error',
        message: error.message || 'Validation failed',
      }],
      verified_fields: [],
      inconsistencies: [],
      source_verification: [],
    };
  }
}

/**
 * Validate and update event confidence score based on validation
 */
export async function validateAndUpdateEvent(
  eventId: string,
  nucigenEventId?: string | null
): Promise<ValidationResult> {
  const validationResult = await validateEvent(eventId, nucigenEventId);

  // Update nucigen_event confidence if validation found issues
  if (nucigenEventId && validationResult.confidence_score < 0.7) {
    await supabase
      .from('nucigen_events')
      .update({
        confidence: Math.min(validationResult.confidence_score, validationResult.confidence_score * 0.9), // Reduce confidence if validation issues
        updated_at: new Date().toISOString(),
      })
      .eq('id', nucigenEventId);
  }

  // Store validation result in metadata (could be a separate table in the future)
  if (nucigenEventId) {
    const { data: existingEvent } = await supabase
      .from('nucigen_events')
      .select('metadata')
      .eq('id', nucigenEventId)
      .maybeSingle();

    const existingMetadata = existingEvent?.metadata || {};
    const updatedMetadata = {
      ...existingMetadata,
      validation: {
        validated_at: new Date().toISOString(),
        result: validationResult,
      },
    };

    await supabase
      .from('nucigen_events')
      .update({ metadata: updatedMetadata })
      .eq('id', nucigenEventId);
  }

  return validationResult;
}
