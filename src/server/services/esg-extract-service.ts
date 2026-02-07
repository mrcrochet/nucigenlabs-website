/**
 * ESG extraction from document text or PDF (inspiration: esGPT / esg_company_search).
 * Extracts structured ESG indicators via OpenAI. Accepts raw text or PDF buffer.
 */

import OpenAI from 'openai';

export interface ESGExtractResult {
  companyName?: string;
  environmental: string[];
  social: string[];
  governance: string[];
  summary?: string;
  generatedAt: string;
}

/**
 * Extract text from a PDF buffer using pdf-parse (optional dependency).
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')) as unknown as (b: Buffer) => Promise<{ text?: string }>;
    const data = await pdfParse(buffer);
    return (data?.text || '').trim();
  } catch (err) {
    throw new Error('PDF parsing failed. Install pdf-parse or send document as text.');
  }
}

/**
 * Extract structured ESG indicators from document text using OpenAI.
 */
export async function extractESGFromDocument(input: {
  text?: string;
  pdfBuffer?: Buffer;
}): Promise<ESGExtractResult> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) throw new Error('OPENAI_API_KEY is required for ESG extraction');
  const openai = new OpenAI({ apiKey: openaiApiKey });

  let text = (input.text || '').trim();
  if (input.pdfBuffer && input.pdfBuffer.length > 0) {
    text = await extractTextFromPdf(input.pdfBuffer);
  }
  if (!text || text.length < 100) {
    throw new Error('Document text is required and must be at least 100 characters (or provide a PDF)');
  }

  const chunk = text.slice(0, 12000);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an ESG analyst. Extract from the document ONLY the following, as JSON with exactly these keys:
- companyName: string (if identifiable)
- environmental: array of strings (key environmental metrics, emissions, energy, waste, etc.)
- social: array of strings (labor, diversity, community, health & safety, etc.)
- governance: array of strings (board, ethics, transparency, anti-corruption, etc.)
- summary: string (2-3 sentence ESG summary)
Use only information explicitly stated in the document. If a category has no clear data, use an empty array. Return ONLY valid JSON, no markdown.`,
      },
      { role: 'user', content: `Document excerpt:\n\n${chunk}` },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1500,
    temperature: 0.2,
  });

  const raw = completion.choices?.[0]?.message?.content;
  if (!raw) throw new Error('No response from model');

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''));
  } catch {
    throw new Error('Invalid JSON from model');
  }

  const env = parsed.environmental;
  const soc = parsed.social;
  const gov = parsed.governance;

  return {
    companyName: typeof parsed.companyName === 'string' ? parsed.companyName : undefined,
    environmental: Array.isArray(env) ? env.map(String) : [],
    social: Array.isArray(soc) ? soc.map(String) : [],
    governance: Array.isArray(gov) ? gov.map(String) : [],
    summary: typeof parsed.summary === 'string' ? parsed.summary : undefined,
    generatedAt: new Date().toISOString(),
  };
}
