/**
 * Live Search API
 * 
 * Client-side functions to search real-world events and create structured summaries
 */

export interface LiveSearchResult {
  success: boolean;
  event?: {
    id: string;
    summary: string;
    event_type: string;
    sector: string | null;
    region: string | null;
    impact_score: number;
    confidence: number;
  };
  causalChain?: {
    cause: string;
    first_order_effect: string;
    second_order_effect: string | null;
    time_horizon: string;
    confidence: number;
  };
  historicalContext?: {
    historical_context: string | null;
    similar_events: Array<{ title: string; date: string; relevance: number; url?: string }>;
    background_explanation: string | null;
    validation_notes: string | null;
  };
  error?: string;
}

/**
 * Search for real-world events and create structured summaries
 */
export async function searchLiveEvents(query: string): Promise<LiveSearchResult> {
  try {
    const response = await fetch('/api/live-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to search live events');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Live search error:', error);
    return {
      success: false,
      error: error.message || 'Failed to search live events',
    };
  }
}

