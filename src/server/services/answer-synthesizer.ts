/**
 * Answer Synthesizer
 * 
 * Synthesizes search results into a structured answer with source mappings
 * Similar to Perplexity's answer format with inline source citations
 * 
 * Strategy:
 * - Use OpenAI to synthesize results into coherent sections
 * - Map each sentence/paragraph to supporting sources
 * - Group sources by domain name
 * - Return structured answer with source citations
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
  text: string; // The sentence or paragraph
  sourceIds: string[]; // IDs of results that support this text
  sourceNames: string[]; // Domain names (e.g., "banquemondiale", "futuribles")
}

export interface AnswerSection {
  id: string;
  title?: string; // e.g., "Défis Principaux", "Stratégies Économiques"
  content: string; // Full content of the section
  sourceMappings: SourceMapping[]; // Mappings for each paragraph/sentence
  sources: Array<{
    id: string;
    name: string;
    url: string;
    count: number;
    resultId: string;
  }>;
}

export interface SynthesizedAnswer {
  summary: string; // Executive summary (first paragraph)
  sections: AnswerSection[];
  totalSources: number;
  sourceList: Array<{
    id: string;
    name: string; // Domain name
    url: string;
    count: number; // How many times this source is cited
    resultId: string; // Original result ID
  }>;
}

/**
 * Extract domain name from URL (for display)
 */
function extractDomainName(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2]; // e.g., "banquemondiale" from "banquemondiale.org"
    }
    return hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Synthesize search results into a structured answer
 */
export async function synthesizeAnswer(
  query: string,
  results: SearchResult[],
  maxSections: number = 4
): Promise<SynthesizedAnswer> {
  if (results.length === 0) {
    return {
      summary: 'No results found for this query.',
      sections: [],
      totalSources: 0,
      sourceList: [],
    };
  }

  // Limit results to top 20 for synthesis
  const topResults = results
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, 20);

  // Build context from results
  const resultsContext = topResults.map((r, idx) => {
    const domain = extractDomainName(r.url);
    return `[Source ${idx + 1}: ${domain}]
ID: ${r.id}
Title: ${r.title}
Summary: ${r.summary}
${r.content ? `Content: ${r.content.substring(0, 500)}` : ''}
URL: ${r.url}`;
  }).join('\n\n');

  const prompt = `Synthesize the following search results into a comprehensive answer for the query: "${query}"

SEARCH RESULTS:
${resultsContext}

TASK:
1. Create an executive summary (2-3 sentences) that directly answers the query
2. Organize the information into ${maxSections} logical sections with clear titles
3. For each section, write coherent paragraphs that synthesize information from multiple sources
4. IMPORTANT: After each paragraph or key sentence, indicate which sources support it using [Source X, Source Y] format

OUTPUT FORMAT (JSON):
{
  "summary": "Executive summary answering the query",
  "sections": [
    {
      "title": "Section title (e.g., 'Défis Principaux', 'Stratégies Économiques')",
      "content": "Full section content with source citations like [Source 1, Source 3]",
      "paragraphs": [
        {
          "text": "First paragraph text",
          "sourceIndices": [1, 3] // Indices (1-based) of sources that support this
        }
      ]
    }
  ]
}

RULES:
- Be factual and comprehensive
- Cite multiple sources when possible
- Group related information together
- Use clear, professional language
- Each paragraph should cite at least one source
- Source indices are 1-based (Source 1 = first result, Source 2 = second result, etc.)

Return ONLY the JSON object, no markdown, no code blocks.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert intelligence analyst. Synthesize search results into comprehensive, well-structured answers with proper source citations.',
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

    const response = JSON.parse(responseText);

    // Build source mappings from response
    const sourceMappings: SourceMapping[] = [];
    const sections: AnswerSection[] = [];

    for (const sectionData of response.sections || []) {
      const mappings: SourceMapping[] = [];

      // Process paragraphs if available
      if (sectionData.paragraphs && Array.isArray(sectionData.paragraphs)) {
        for (const para of sectionData.paragraphs) {
          const sourceIds: string[] = [];
          const sourceNames: string[] = [];

          // Map source indices (1-based) to actual result IDs
          if (Array.isArray(para.sourceIndices)) {
            for (const idx of para.sourceIndices) {
              const resultIndex = idx - 1; // Convert to 0-based
              if (resultIndex >= 0 && resultIndex < topResults.length) {
                const result = topResults[resultIndex];
                sourceIds.push(result.id);
                sourceNames.push(extractDomainName(result.url));
              }
            }
          }

          mappings.push({
            text: para.text || '',
            sourceIds,
            sourceNames,
          });
        }
      } else {
        // Fallback: parse source citations from content
        const content = sectionData.content || '';
        const citationRegex = /\[Source (\d+)(?:, Source (\d+))*(?:\+(\d+))?\]/g;
        let match;
        const paragraphs = content.split('\n\n').filter(p => p.trim());

        for (const para of paragraphs) {
          const sourceIds: string[] = [];
          const sourceNames: string[] = [];
          const seenIndices = new Set<number>();

          while ((match = citationRegex.exec(para)) !== null) {
            const indices = [parseInt(match[1])];
            if (match[2]) indices.push(parseInt(match[2]));
            if (match[3]) {
              // Handle "+N" notation (e.g., "Source 1 +2" means Source 1, 2, 3)
              const base = parseInt(match[1]);
              const additional = parseInt(match[3]);
              for (let i = 1; i <= additional; i++) {
                indices.push(base + i);
              }
            }

            for (const idx of indices) {
              if (!seenIndices.has(idx)) {
                seenIndices.add(idx);
                const resultIndex = idx - 1;
                if (resultIndex >= 0 && resultIndex < topResults.length) {
                  const result = topResults[resultIndex];
                  sourceIds.push(result.id);
                  sourceNames.push(extractDomainName(result.url));
                }
              }
            }
          }

          if (sourceIds.length > 0 || para.trim().length > 0) {
            mappings.push({
              text: para.replace(citationRegex, '').trim(), // Remove citations from text
              sourceIds,
              sourceNames,
            });
          }
        }
      }

      // Build sources for this section
      const sectionSourceMap = new Map<string, {
        id: string;
        name: string;
        url: string;
        count: number;
        resultId: string;
      }>();

      mappings.forEach(mapping => {
        mapping.sourceIds.forEach((resultId) => {
          const result = topResults.find(r => r.id === resultId);
          if (result) {
            const domainName = extractDomainName(result.url);
            const existing = sectionSourceMap.get(domainName);
            if (existing) {
              existing.count++;
            } else {
              sectionSourceMap.set(domainName, {
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

      sections.push({
        id: `section-${sections.length + 1}`,
        title: sectionData.title,
        content: sectionData.content || '',
        sourceMappings: mappings,
        sources: Array.from(sectionSourceMap.values()),
      });
    }

    // Build source list with counts
    const sourceCountMap = new Map<string, {
      id: string;
      name: string;
      url: string;
      count: number;
      resultId: string;
    }>();

    for (const section of sections) {
      for (const mapping of section.sourceMappings) {
        for (let i = 0; i < mapping.sourceIds.length; i++) {
          const resultId = mapping.sourceIds[i];
          const sourceName = mapping.sourceNames[i];
          const result = topResults.find(r => r.id === resultId);

          if (result) {
            const key = `${sourceName}-${resultId}`;
            const existing = sourceCountMap.get(key);
            if (existing) {
              existing.count++;
            } else {
              sourceCountMap.set(key, {
                id: resultId,
                name: sourceName,
                url: result.url,
                count: 1,
                resultId: result.id,
              });
            }
          }
        }
      }
    }

    return {
      summary: response.summary || 'No summary available.',
      sections,
      totalSources: sourceCountMap.size,
      sourceList: Array.from(sourceCountMap.values()).sort((a, b) => b.count - a.count),
    };
  } catch (error: any) {
    console.error('[AnswerSynthesizer] Error synthesizing answer:', error.message);
    
    // Fallback: simple synthesis
    return {
      summary: `Found ${results.length} results for "${query}".`,
      sections: [{
        id: 'section-1',
        title: 'Results',
        content: results.map(r => r.summary).join('\n\n'),
        sourceMappings: results.map(r => ({
          text: r.summary,
          sourceIds: [r.id],
          sourceNames: [extractDomainName(r.url)],
        })),
      }],
      totalSources: results.length,
      sourceList: results.map(r => ({
        id: r.id,
        name: extractDomainName(r.url),
        url: r.url,
        count: 1,
        resultId: r.id,
      })),
    };
  }
}

      summary: synthesized.summary || '',
      sections: processedSections,
      totalSources: sourceMap.size,
      sourceList,
    };
  } catch (error: any) {
    console.error('[AnswerSynthesizer] Error synthesizing answer:', error.message);
    
    // Fallback: simple synthesis without source mappings
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
