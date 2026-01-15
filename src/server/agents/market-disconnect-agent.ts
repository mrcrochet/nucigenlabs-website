/**
 * Market Disconnect Agent
 * 
 * Detects disconnect between real-world risk and market pricing
 * 
 * PROMPT: Market Disconnect Detection
 */

import { callOpenAI } from '../services/openai-optimizer';
import type { Signal } from '../../types/intelligence';

export interface MarketDisconnectInput {
  signal: Signal;
  marketData: {
    symbol?: string;
    price_change_24h?: number;
    price_change_7d?: number;
    volume_change?: number;
    volatility?: number;
  };
}

export interface MarketDisconnectResult {
  disconnect: boolean;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
}

export class MarketDisconnectAgent {
  /**
   * Detect if there's a disconnect between signal and market reaction
   */
  async detectDisconnect(input: MarketDisconnectInput): Promise<MarketDisconnectResult> {
    const { signal, marketData } = input;

    const systemPrompt = `You compare real-world risk with market reaction.`;

    const userPrompt = `Signal:
Title: ${signal.title}
Description: ${signal.summary}
Strength: ${signal.impact_score}/100
Confidence: ${signal.confidence_score}/100
Time Horizon: ${signal.time_horizon}

Market behavior:
${marketData.symbol ? `Symbol: ${marketData.symbol}` : 'General market'}
24h change: ${marketData.price_change_24h || 0}%
7d change: ${marketData.price_change_7d || 0}%
Volume change: ${marketData.volume_change || 0}%
Volatility: ${marketData.volatility || 0}

Is there a disconnect between real-world developments and market pricing?
Answer cautiously.

Output format (JSON only):
{
  "disconnect": true | false,
  "explanation": "...",
  "severity": "low | medium | high"
}`;

    try {
      const response = await callOpenAI({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        disconnect: parsed.disconnect || false,
        explanation: parsed.explanation || 'Unable to assess disconnect.',
        severity: parsed.severity || 'low',
      };
    } catch (error: any) {
      console.error('[MarketDisconnectAgent] Error:', error);
      return {
        disconnect: false,
        explanation: 'Unable to assess market disconnect.',
        severity: 'low',
      };
    }
  }
}
