/**
 * Detective Claim Extractor — Extraction de claims structurés pour le graphe d'enquête.
 *
 * Règle d'or : le graphe ne consomme que des CLAIMS (subject, action, object, polarity).
 * Ce module transforme du texte brut (Signal / Firecrawl) en claims au format canonique.
 *
 * Voir docs/SCHEMA_INVESTIGATION_ENGINE.md § 2b et src/types/investigation-schema.ts (Claim).
 */

import OpenAI from 'openai';
import type { ClaimPolarity } from '../../types/investigation-schema.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** Payload d'un claim tel que retourné par l'extraction (sans id, investigation_id, signal_id, created_at). */
export interface DetectiveClaimPayload {
  text: string;
  subject: string;
  action: string;
  object: string;
  polarity: ClaimPolarity;
  confidence: number;
  date?: string | null;
  source_url?: string | null;
  source_name?: string | null;
}

const POLARITY_VALUES: ClaimPolarity[] = ['supports', 'weakens', 'neutral'];

function normalizePolarity(s: unknown): ClaimPolarity {
  if (typeof s === 'string' && POLARITY_VALUES.includes(s as ClaimPolarity)) {
    return s as ClaimPolarity;
  }
  return 'neutral';
}

function normalizeConfidence(n: unknown): number {
  const v = typeof n === 'number' && !Number.isNaN(n) ? n : Number(n);
  return Math.min(1, Math.max(0, v));
}

function normalizeDate(s: unknown): string | null {
  if (s == null || s === '') return null;
  if (typeof s !== 'string') return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  return trimmed;
}

function normalizeString(s: unknown, fallback: string): string {
  if (s == null) return fallback;
  const t = typeof s === 'string' ? s.trim() : String(s).trim();
  return t || fallback;
}

/** Valide et normalise un objet brut en DetectiveClaimPayload. */
function toClaimPayload(raw: Record<string, unknown>, sourceUrl?: string, sourceName?: string): DetectiveClaimPayload {
  return {
    text: normalizeString(raw.text, ''),
    subject: normalizeString(raw.subject, 'unknown'),
    action: normalizeString(raw.action, 'unknown'),
    object: normalizeString(raw.object, 'unknown'),
    polarity: normalizePolarity(raw.polarity),
    confidence: normalizeConfidence(raw.confidence),
    date: normalizeDate(raw.date),
    source_url: sourceUrl ?? null,
    source_name: sourceName ?? null,
  };
}

const SYSTEM_PROMPT = `Tu es un analyste d'enquête. Tu extrais des CLAIMS structurés à partir de texte brut.

RÈGLES STRICTES:
- Un claim = un fait vérifiable, énoncé en une phrase (sujet fait quelque chose à/qu’envers une cible).
- subject = acteur ou entité (qui).
- action = fait ou événement (quoi).
- object = cible, ressource ou impact (envers quoi / sur quoi).
- polarity = par rapport à l’hypothèse d’enquête fournie: "supports" (renforce), "weakens" (affaiblit), "neutral" (hors sujet ou neutre).
- confidence = 0.0 à 1.0 (confiance dans ce fait d’après le texte).
- date = date du fait si explicite (format ISO YYYY-MM-DD ou année), sinon null.

Tu renvoies UNIQUEMENT un objet JSON valide avec une clé "claims" contenant un tableau d’objets.
Chaque objet doit avoir exactement: text, subject, action, object, polarity, confidence, date (ou null).
Aucun autre champ. Pas de commentaire, pas de markdown.`;

function buildUserPrompt(
  hypothesis: string,
  rawText: string,
  maxTextLength: number = 12000
): string {
  const truncated =
    rawText.length > maxTextLength
      ? rawText.slice(0, maxTextLength) + '\n[... texte tronqué ...]'
      : rawText;
  return `Hypothèse d'enquête à évaluer:\n"${hypothesis}"\n\nTexte source:\n\n${truncated}`;
}

/**
 * Extrait des claims structurés depuis un texte brut, par rapport à une hypothèse d'enquête.
 * Chaque claim est normalisé (polarity, confidence 0..1). source_url et source_name ne sont
 * pas renvoyés par le LLM — à renseigner côté appelant sur chaque claim si besoin.
 */
export async function extractDetectiveClaims(params: {
  hypothesis: string;
  rawText: string;
  sourceUrl?: string;
  sourceName?: string;
  maxTextLength?: number;
}): Promise<DetectiveClaimPayload[]> {
  const { hypothesis, rawText, sourceUrl, sourceName, maxTextLength } = params;
  if (!hypothesis?.trim() || !rawText?.trim()) {
    return [];
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[DetectiveClaimExtractor] OPENAI_API_KEY missing, returning empty claims');
    return [];
  }

  const userPrompt = buildUserPrompt(hypothesis, rawText, maxTextLength);

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_DETECTIVE_CLAIM_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content?.trim()) return [];

    const parsed = JSON.parse(content) as { claims?: unknown[] };
    const rawClaims = Array.isArray(parsed.claims) ? parsed.claims : [];

    const payloads = rawClaims
      .filter((c): c is Record<string, unknown> => c != null && typeof c === 'object')
      .map((raw) => toClaimPayload(raw, sourceUrl, sourceName))
      .filter((c) => c.text.length > 0);

    return payloads;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[DetectiveClaimExtractor] extraction failed:', message);
    return [];
  }
}
