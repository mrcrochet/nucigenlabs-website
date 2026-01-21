/**
 * Answer Synthesizer
 * 
 * Synthesizes search results into a structured answer with source mappings
 * Similar to Perplexity: each sentence/paragraph is linked to its sources
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { SearchResult } from './search-orchestrator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY is required for answer synthesis');
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export interface SourceMapping {
  text: string;
  sourceIds: string[];
  sourceNames: string[];
}

export interface AnswerSection {
  id: string;
  title?: string;
  content: string;
  sourceMappings: SourceMapping[];
  sources: Array<{
    id: string;
    name: string;
    url: string;
    count: number;
    resultId: string;
  }>;
}

export interface SynthesizedAnswer {
  summary: string;
  sections: AnswerSection[];
  totalSources: number;
  sourceList: Array<{
    id: string;
    name: string;
    url: string;
    title: string;
    resultId: string;
  }>;
}

function extractDomainName(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    return hostname;
  } catch {
    return 'unknown';
  }
}

export async function synthesizeAnswer(
  query: string,
  results: SearchResult[],
  maxResults: number = 20
): Promise<SynthesizedAnswer> {
  if (results.length === 0) {
    return {
      summary: 'No results found for this query.',
      sections: [],
      totalSources: 0,
      sourceList: [],
    };
  }

  const topResults = results
    .sort((a, b) => {
      const scoreA = (a.impactScore || a.relevanceScore || 0);
      const scoreB = (b.impactScore || b.relevanceScore || 0);
      return scoreB - scoreA;
    })
    .slice(0, maxResults);

  const sourceMap = new Map<string, {
    id: string;
    name: string;
    url: string;
    title: string;
    resultId: string;
    count: number;
  }>();

  for (const result of topResults) {
    const domainName = extractDomainName(result.url);
    const existing = sourceMap.get(domainName);
    
    if (existing) {
      existing.count++;
    } else {
      sourceMap.set(domainName, {
        id: domainName,
        name: domainName,
        url: result.url,
        title: result.title,
        resultId: result.id,
        count: 1,
      });
    }
  }

  const contentForSynthesis = topResults.map((r, idx) => 
    `[Source ${idx + 1}: ${extractDomainName(r.url)}]
Title: ${r.title}
Summary: ${r.summary}
${r.content ? `Content: ${r.content.substring(0, 500)}` : ''}
Source ID: ${r.id}
URL: ${r.url}`
  ).join('\n\n');

  const prompt = `Synthesize the following search results into a comprehensive, well-structured answer.

Query: ${query}

Search Results:
${contentForSynthesis}

TASK:
1. Write a clear, comprehensive answer that synthesizes information from all sources
2. Organize the answer into logical sections (e.g., "Main Challenges", "Economic Strategies", "Institutional Improvements")
3. For each section, identify which sources support each sentence/paragraph
4. Use source names (domain names) like "banquemondiale", "futuribles", etc.

Return ONLY a JSON object with this structure:
{
  "summary": "Executive summary (2-3 sentences)",
  "sections": [
    {
      "title": "Section title (optional, can be null)",
      "content": "Full text of the section (can be multiple paragraphs)",
      "sourceMappings": [
        {
          "text": "A specific sentence or paragraph from the content",
          "sourceIds": ["Source 1", "Source 2"]
        }
      ]
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert intelligence analyst. Synthesize information from multiple sources into a clear, comprehensive answer with proper source attribution.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    const synthesized = JSON.parse(responseText);

    const sourceIdToResultId = new Map<string, string>();
    topResults.forEach((r, idx) => {
      sourceIdToResultId.set(`Source ${idx + 1}`, r.id);
    });

    const processedSections: AnswerSection[] = (synthesized.sections || []).map((section: any, sectionIdx: number) => {
      const sourceMappings: SourceMapping[] = (section.sourceMappings || []).map((mapping: any) => {
        const sourceIds = (mapping.sourceIds || []).map((sourceId: string) => {
          return sourceIdToResultId.get(sourceId) || sourceId;
        });

        const sourceNames = sourceIds
          .map(id => {
            const result = topResults.find(r => r.id === id);
            return result ? extractDomainName(result.url) : null;
          })
          .filter((name): name is string => name !== null);

        return {
          text: mapping.text || '',
          sourceIds,
          sourceNames,
        };
      });

      const sectionSources = new Map<string, {
        id: string;
        name: string;
        url: string;
        count: number;
        resultId: string;
      }>();

      sourceMappings.forEach(mapping => {
        mapping.sourceIds.forEach((resultId) => {
          const result = topResults.find(r => r.id === resultId);
          if (result) {
            const domainName = extractDomainName(result.url);
            const existing = sectionSources.get(domainName);
            if (existing) {
              existing.count++;
            } else {
              sectionSources.set(domainName, {
                id: domainName,
                name: domainName,
                url: result.url,
                count: 1,
                resultId: result.id,
              });
            }
          }
        });
      });

      return {
        id: `section-${sectionIdx}`,
        title: section.title || undefined,
        content: section.content || '',
        sourceMappings,
        sources: Array.from(sectionSources.values()),
      };
    });

    const sourceList = Array.from(sourceMap.values()).map(s => ({
      id: s.id,
      name: s.name,
      url: s.url,
      title: s.title,
      resultId: s.resultId,
    }));

    return {
      summary: synthesized.summary || '',
      sections: processedSections,
      totalSources: sourceMap.size,
      sourceList,
    };
  } catch (error: any) {
    console.error('[AnswerSynthesizer] Error:', error.message);
    
    return {
      summary: topResults[0]?.summary || 'No summary available.',
      sections: [{
        id: 'fallback-section',
        content: topResults.map(r => r.summary).join('\n\n'),
        sourceMappings: [],
        sources: Array.from(sourceMap.values()).map(s => ({
          id: s.id,
          name: s.name,
          url: s.url,
          count: s.count,
          resultId: s.resultId,
        })),
      }],
      totalSources: sourceMap.size,
      sourceList: Array.from(sourceMap.values()).map(s => ({
        id: s.id,
        name: s.name,
        url: s.url,
        title: s.title,
        resultId: s.resultId,
      })),
    };
  }
}
