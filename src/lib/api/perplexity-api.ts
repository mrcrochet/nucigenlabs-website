/**
 * Perplexity API Client
 * 
 * Frontend wrapper for Perplexity API endpoints
 */

export interface PerplexityChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-online';
  options?: {
    temperature?: number;
    max_tokens?: number;
    return_citations?: boolean;
    return_related_questions?: boolean;
  };
}

export interface PerplexityChatResponse {
  success: boolean;
  data?: {
    id: string;
    model: string;
    choices: Array<{
      message: {
        role: string;
        content: string;
        citations?: string[];
      };
    }>;
    citations?: string[];
    related_questions?: string[];
  };
  error?: string;
}

export interface SignalEnrichmentRequest {
  signalTitle: string;
  signalSummary: string;
  sector?: string;
  region?: string;
  user_preferences?: {
    preferred_sectors?: string[];
    preferred_regions?: string[];
  };
}

export interface SignalEnrichmentResponse {
  success: boolean;
  data?: {
    historical_context?: string;
    expert_analysis?: string;
    market_implications?: string;
    citations?: string[];
    related_questions?: string[];
    confidence?: number;
  };
  error?: string;
}

/**
 * Chat with Perplexity
 */
export async function chatWithPerplexity(
  request: PerplexityChatRequest
): Promise<PerplexityChatResponse> {
  try {
    const API_BASE = import.meta.env.DEV ? '/api' : '/api';
    
    const response = await fetch(`${API_BASE}/perplexity/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: request.messages,
        model: request.model || 'sonar-pro',
        options: request.options,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to chat with Perplexity' }));
      throw new Error(errorData.error || 'Failed to chat with Perplexity');
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to chat with Perplexity',
    };
  }
}

/**
 * Enrich signal with Perplexity
 */
export async function enrichSignalWithPerplexity(
  signalId: string,
  request: SignalEnrichmentRequest
): Promise<SignalEnrichmentResponse> {
  try {
    const API_BASE = import.meta.env.DEV ? '/api' : '/api';
    
    const response = await fetch(`${API_BASE}/signals/${signalId}/enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to enrich signal' }));
      throw new Error(errorData.error || 'Failed to enrich signal');
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to enrich signal',
    };
  }
}
