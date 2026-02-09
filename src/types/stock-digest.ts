/** Stock digest types — aligned with tavily-ai/market-researcher */

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

export interface StockDigestResponse {
  success: boolean;
  reports: Record<string, StockReport>;
  generated_at: string;
  error?: string;
}
