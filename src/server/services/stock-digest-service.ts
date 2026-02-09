/**
 * Stock Digest Service — inspired by tavily-ai/market-researcher
 * Uses Tavily Search (finance) + OpenAI to produce structured stock reports.
 */

import { searchTavily } from './tavily-unified-service.js';
import OpenAI from 'openai';

const MAX_TICKERS = 5;
const RESEARCH_PROMPT = `Do a comprehensive stock analysis for {ticker} as of {date}:
- Current stock price and recent price performance
- Market capitalization and key financial metrics
- Latest earnings results and guidance
- Recent news and developments
- Analyst ratings, upgrades/downgrades, and price targets
- Key risks and opportunities
- Investment recommendation with reasoning
Focus on all the recent updates about the company.`;

export interface StockDigestSource {
  url: string;
  title: string;
  domain?: string;
  published_date?: string;
  score?: number;
}

export interface StockReport {
  ticker: string;
  company_name: string;
  summary: string;
  current_performance: string;
  key_insights: string[];
  recommendation: string;
  risk_assessment: string;
  price_outlook: string;
  market_cap?: number;
  pe_ratio?: number;
  sources: StockDigestSource[];
}

export interface StockDigestResult {
  reports: Record<string, StockReport>;
  generated_at: string;
}

function buildContextFromArticles(articles: { title: string; url: string; content?: string; publishedDate?: string }[]): string {
  return articles
    .slice(0, 10)
    .map(
      (a) =>
        `Title: ${a.title}\nURL: ${a.url}\nContent: ${(a.content || '').slice(0, 2000)}\n`
    )
    .join('\n---\n');
}

export async function generateStockDigest(tickers: string[]): Promise<StockDigestResult> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) throw new Error('OPENAI_API_KEY is required for stock digest');
  const openai = new OpenAI({ apiKey: openaiApiKey });

  const list = tickers.slice(0, MAX_TICKERS).map((t) => t.trim().toUpperCase()).filter(Boolean);
  if (list.length === 0) throw new Error('At least one ticker is required');

  const date = new Date().toISOString().slice(0, 10);
  const reports: Record<string, StockReport> = {};

  await Promise.all(
    list.map(async (ticker) => {
      try {
        const searchResult = await searchTavily(
          `Stock ${ticker} analysis news performance earnings`,
          'news',
          { maxResults: 12, days: 30 }
        );
        const articles = searchResult.articles || [];
        const context = buildContextFromArticles(articles);
        const sources: StockDigestSource[] = articles.map((a) => ({
          url: a.url,
          title: a.title,
          published_date: a.publishedDate,
          score: a.score,
        }));

        const prompt = `Based on the following web search results about the stock ${ticker}, produce a structured analysis.

${RESEARCH_PROMPT.replace('{ticker}', ticker).replace('{date}', date)}

Web search results:
${context.slice(0, 12000)}

Respond with a JSON object (no markdown) with exactly these keys: company_name, summary, current_performance, key_insights (array of strings), recommendation, risk_assessment, price_outlook, market_cap (number or null), pe_ratio (number or null). Use the content above; if something is unavailable, say "Not available" or use an empty array for key_insights.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 1500,
          temperature: 0.3,
        });
        const raw = completion.choices?.[0]?.message?.content;
        if (!raw) {
          reports[ticker] = createErrorReport(ticker, 'No response from model');
          return;
        }
        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''));
        } catch {
          reports[ticker] = createErrorReport(ticker, 'Invalid JSON');
          return;
        }
        const ki = parsed.key_insights;
        reports[ticker] = {
          ticker,
          company_name: String(parsed.company_name || ticker),
          summary: String(parsed.summary || ''),
          current_performance: String(parsed.current_performance || ''),
          key_insights: Array.isArray(ki) ? ki.map(String) : [],
          recommendation: String(parsed.recommendation || ''),
          risk_assessment: String(parsed.risk_assessment || ''),
          price_outlook: String(parsed.price_outlook || ''),
          market_cap: typeof parsed.market_cap === 'number' ? parsed.market_cap : undefined,
          pe_ratio: typeof parsed.pe_ratio === 'number' ? parsed.pe_ratio : undefined,
          sources,
        };
      } catch (err: any) {
        console.error(`[StockDigest] Error for ${ticker}:`, err);
        reports[ticker] = createErrorReport(ticker, err.message || 'Research failed');
      }
    })
  );

  return {
    reports,
    generated_at: new Date().toISOString(),
  };
}

function createErrorReport(ticker: string, message: string): StockReport {
  return {
    ticker,
    company_name: ticker,
    summary: `Research failed: ${message}`,
    current_performance: 'Unable to analyze',
    key_insights: [],
    recommendation: 'Unable to provide recommendation',
    risk_assessment: 'Unable to assess risks',
    price_outlook: 'Unable to provide outlook',
    sources: [],
  };
}
