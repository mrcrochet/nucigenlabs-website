/**
 * Meeting brief — 1-page briefing for a company/meeting (inspiration: tavily-ai/meeting-prep-agent).
 * Tavily search + OpenAI synthesis.
 */

import { searchTavily } from './tavily-unified-service.js';
import OpenAI from 'openai';

export interface MeetingBriefInput {
  company: string;
  ticker?: string;
  meetingType?: string;
  date?: string;
}

export interface MeetingBriefResult {
  brief: string;
  sources: { title: string; url: string }[];
  generatedAt: string;
}

function buildContext(articles: { title: string; url: string; content?: string; publishedDate?: string }[]): string {
  return articles
    .slice(0, 12)
    .map(
      (a) =>
        `Title: ${a.title}\nURL: ${a.url}\nContent: ${(a.content || '').slice(0, 1500)}\n`
    )
    .join('\n---\n');
}

export async function generateMeetingBrief(input: MeetingBriefInput): Promise<MeetingBriefResult> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) throw new Error('OPENAI_API_KEY is required for meeting brief');
  const openai = new OpenAI({ apiKey: openaiApiKey });

  const company = (input.company || '').trim();
  if (!company) throw new Error('company is required');

  const tickerPart = input.ticker ? ` (${input.ticker})` : '';
  const meetingPart = input.meetingType ? ` ${input.meetingType}` : '';
  const datePart = input.date ? ` ${input.date}` : '';

  const query = `${company}${tickerPart} recent news${meetingPart}${datePart}`.trim();

  const searchResult = await searchTavily(query, 'news', {
    maxResults: 12,
    days: 14,
  });
  const articles = searchResult.articles || [];
  const context = buildContext(articles);
  const sources = articles.map((a) => ({ title: a.title, url: a.url }));

  const prompt = `You are preparing a one-page meeting brief. Based on the following web search results about "${company}"${tickerPart}, write a concise brief in markdown (about 1 page when rendered). Use these sections:

## Key updates
(2-3 bullet points: latest material developments)

## Recent news
(2-4 short paragraphs summarizing the most relevant news)

## Key figures / metrics
(If available: stock move, earnings highlights, guidance, analyst views)

## Questions to consider
(3-5 suggested questions or discussion points for the meeting)

Keep the tone professional and factual. Use only information from the search results below; if something is not found, say "Not found in sources" or omit.

Web search results:
${context.slice(0, 14000)}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.3,
  });

  const brief = (completion.choices?.[0]?.message?.content ?? '').trim() || '*No content generated.*';

  return {
    brief,
    sources,
    generatedAt: new Date().toISOString(),
  };
}
