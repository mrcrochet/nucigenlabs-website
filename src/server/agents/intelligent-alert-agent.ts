/**
 * Intelligent Alert Agent
 * 
 * Generates intelligent alerts with explanations
 * - Signal threshold alerts (with why it matters)
 * - Critical event alerts (with context)
 * - Trajectory change alerts (with comparison)
 * 
 * PROMPT: Alert Explanation
 */

import { callOpenAI } from '../services/openai-optimizer';
import type { Signal, Alert } from '../../types/intelligence';

export interface IntelligentAlertInput {
  signal?: Signal;
  event?: {
    id: string;
    title: string;
    summary: string;
    impact_score?: number;
    sector?: string;
    region?: string;
  };
  alertType: 'signal_threshold' | 'critical_event' | 'trajectory_change';
  previousState?: {
    impact_score?: number;
    confidence_score?: number;
    trend?: string;
  };
  threshold?: {
    impact_threshold?: number;
    confidence_threshold?: number;
  };
}

export interface IntelligentAlertResult {
  alert: Alert;
  explanation: string; // Why this alert was triggered
  context: string; // Additional context
  recommended_action?: string;
}

export class IntelligentAlertAgent {
  /**
   * Generate intelligent alert with explanation
   */
  async generateAlert(input: IntelligentAlertInput): Promise<IntelligentAlertResult> {
    const { signal, event, alertType, previousState, threshold } = input;

    let explanationPrompt = '';
    let contextPrompt = '';

    if (alertType === 'signal_threshold' && signal) {
      explanationPrompt = `Signal threshold alert:
Signal: ${signal.title}
Current Impact: ${signal.impact_score}/100
Current Confidence: ${signal.confidence_score}/100
Threshold: Impact >= ${threshold?.impact_threshold || 70}, Confidence >= ${threshold?.confidence_threshold || 60}

Explain why this alert was triggered and why it matters.
Max 100 words.`;

      contextPrompt = `Provide additional context about this signal:
- Why is this threshold crossing significant?
- What should the user watch for?
- What makes this different from normal fluctuations?
Max 80 words.`;
    } else if (alertType === 'critical_event' && event) {
      explanationPrompt = `Critical event alert:
Event: ${event.title}
Summary: ${event.summary}
Impact Score: ${event.impact_score || 0}/100
${event.sector ? `Sector: ${event.sector}` : ''}
${event.region ? `Region: ${event.region}` : ''}

Explain why this event is critical and requires immediate attention.
Max 100 words.`;

      contextPrompt = `Provide context about this critical event:
- What are the immediate implications?
- What should be monitored?
- Why is this more significant than typical events?
Max 80 words.`;
    } else if (alertType === 'trajectory_change' && signal && previousState) {
      explanationPrompt = `Trajectory change alert:
Signal: ${signal.title}
Previous Impact: ${previousState.impact_score || 0}/100
Current Impact: ${signal.impact_score}/100
Previous Confidence: ${previousState.confidence_score || 0}/100
Current Confidence: ${signal.confidence_score}/100
Previous Trend: ${previousState.trend || 'unknown'}

Explain why this trajectory change is significant.
Max 100 words.`;

      contextPrompt = `Provide context about this trajectory change:
- What does this change indicate?
- What factors might have caused it?
- What should be monitored going forward?
Max 80 words.`;
    } else {
      return {
        alert: {
          id: `alert-${Date.now()}`,
          type: 'alert',
          title: 'Alert',
          trigger_reason: 'Alert triggered',
          threshold_exceeded: 'Unknown',
          severity: 'moderate',
          impact: 0,
          confidence: 0,
          related_signal_ids: signal ? [signal.id] : [],
          related_event_ids: event ? [event.id] : [],
          last_updated: new Date().toISOString(),
        },
        explanation: 'Unable to generate alert explanation.',
        context: '',
      };
    }

    const systemPrompt = `You explain alerts so users trust them.
Be concise, factual, and actionable.`;

    try {
      // Generate explanation
      const explanationResponse = await callOpenAI({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: explanationPrompt },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const explanation = explanationResponse.choices[0]?.message?.content || 'Alert triggered.';

      // Generate context
      const contextResponse = await callOpenAI({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contextPrompt },
        ],
        temperature: 0.3,
        max_tokens: 150,
      });

      const context = contextResponse.choices[0]?.message?.content || '';

      // Determine severity
      let severity: 'moderate' | 'high' | 'critical' = 'moderate';
      if (signal) {
        if ((signal.impact_score || 0) >= 90 || (signal.confidence_score || 0) >= 90) {
          severity = 'critical';
        } else if ((signal.impact_score || 0) >= 80 || (signal.confidence_score || 0) >= 80) {
          severity = 'high';
        }
      } else if (event && (event.impact_score || 0) >= 90) {
        severity = 'critical';
      }

      // Create alert
      const alert: Alert = {
        id: `alert-${Date.now()}`,
        type: 'alert',
        title: signal?.title || event?.title || 'Alert',
        trigger_reason: explanation,
        threshold_exceeded: alertType === 'signal_threshold'
          ? `Impact: ${signal?.impact_score || 0}% >= ${threshold?.impact_threshold || 70}%`
          : alertType === 'critical_event'
          ? 'Critical event detected'
          : 'Trajectory change detected',
        severity,
        impact: signal?.impact_score || event?.impact_score || 0,
        confidence: signal?.confidence_score || 0,
        related_signal_ids: signal ? [signal.id] : [],
        related_event_ids: event ? [event.id] : [],
        last_updated: new Date().toISOString(),
      };

      return {
        alert,
        explanation,
        context,
        recommended_action: this.generateRecommendedAction(alertType, signal, event),
      };
    } catch (error: any) {
      console.error('[IntelligentAlertAgent] Error:', error);
      return {
        alert: {
          id: `alert-${Date.now()}`,
          type: 'alert',
          title: signal?.title || event?.title || 'Alert',
          trigger_reason: 'Alert triggered',
          threshold_exceeded: 'Unknown',
          severity: 'moderate',
          impact: signal?.impact_score || event?.impact_score || 0,
          confidence: signal?.confidence_score || 0,
          related_signal_ids: signal ? [signal.id] : [],
          related_event_ids: event ? [event.id] : [],
          last_updated: new Date().toISOString(),
        },
        explanation: 'Unable to generate alert explanation.',
        context: '',
      };
    }
  }

  private generateRecommendedAction(
    alertType: string,
    signal?: Signal,
    event?: { id: string; title: string }
  ): string {
    if (alertType === 'signal_threshold') {
      return 'Review signal details and related events to understand the full context.';
    } else if (alertType === 'critical_event') {
      return 'Review event details and assess immediate implications for your interests.';
    } else if (alertType === 'trajectory_change') {
      return 'Compare current signal state with previous state to understand the change.';
    }
    return 'Review the alert details for more information.';
  }
}
