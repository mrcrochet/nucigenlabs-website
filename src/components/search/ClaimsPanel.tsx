/**
 * Claims Panel
 * 
 * Displays actionable claims extracted from search results
 * With validation button for each claim (PRIORITÉ PRODUIT #1)
 */

import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Claim } from '../../types/search';

interface ValidationResult {
  validated: boolean;
  confidence: number;
  supportingSources: number;
  contradictingSources: number;
  evidence: Array<{
    url: string;
    title: string;
    supports: boolean;
    date: string;
    relevanceScore?: number;
  }>;
}

interface ClaimsPanelProps {
  claims: Claim[];
  resultTitle?: string;
  resultDate?: string;
}

export default function ClaimsPanel({ claims, resultTitle, resultDate }: ClaimsPanelProps) {
  const [validatingClaimId, setValidatingClaimId] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(new Map());

  if (!claims || claims.length === 0) {
    return null;
  }

  const handleValidate = async (claim: Claim) => {
    setValidatingClaimId(claim.id);
    
    try {
      console.log('[ClaimsPanel] Validating claim:', claim.text.substring(0, 100));
      
      const response = await fetch('/api/search/validate-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claim: claim.text,
          timeRange: '7d', // Default to 7 days
        }),
      });

      console.log('[ClaimsPanel] Response status:', response.status, response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[ClaimsPanel] Error response:', errorData);
        throw new Error(errorData.error || `Validation failed: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('[ClaimsPanel] Response data:', responseData);
      
      // Extract result (API returns { success: true, ...result })
      const result: ValidationResult = responseData.success 
        ? {
            validated: responseData.validated,
            confidence: responseData.confidence,
            supportingSources: responseData.supportingSources,
            contradictingSources: responseData.contradictingSources,
            evidence: responseData.evidence || [],
          }
        : responseData;
      
      // Store validation result
      setValidationResults(prev => {
        const next = new Map(prev);
        next.set(claim.id, result);
        return next;
      });

      // Show toast with result
      if (result.validated) {
        toast.success(`Claim validated (${result.supportingSources} sources supporting)`);
      } else {
        toast.warning(`Claim contradicted (${result.contradictingSources} sources contradicting)`);
      }
    } catch (error: any) {
      console.error('[ClaimsPanel] Validation error:', error);
      toast.error('Failed to validate claim. Please try again.');
    } finally {
      setValidatingClaimId(null);
    }
  };

  const handleCheckUpdates = async (claim: Claim) => {
    if (!resultDate) {
      toast.error('Cannot check updates: result date missing');
      return;
    }

    setValidatingClaimId(claim.id);
    
    try {
      console.log('[ClaimsPanel] Checking updates:', resultTitle || claim.text, resultDate);
      
      const response = await fetch('/api/search/check-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventTitle: resultTitle || claim.text,
          originalDate: resultDate,
          timeRange: '7d',
        }),
      });

      console.log('[ClaimsPanel] Updates response status:', response.status, response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[ClaimsPanel] Updates error response:', errorData);
        throw new Error(errorData.error || `Update check failed: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('[ClaimsPanel] Updates response data:', responseData);
      
      // Extract result (API returns { success: true, ...result })
      const result = responseData.success ? {
        totalUpdates: responseData.totalUpdates || 0,
        updates: responseData.updates || [],
        timeRange: responseData.timeRange || '7d',
      } : responseData;
      
      if (result.totalUpdates > 0) {
        toast.success(`Found ${result.totalUpdates} updates since original date`);
      } else {
        toast.info('No updates found');
      }
    } catch (error: any) {
      console.error('[ClaimsPanel] Update check error:', error);
      toast.error(error.message || 'Failed to check updates. Please try again.');
    } finally {
      setValidatingClaimId(null);
    }
  };

  const getClaimTypeIcon = (type: Claim['type']) => {
    switch (type) {
      case 'prediction':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'implication':
        return <RefreshCw className="w-4 h-4 text-purple-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
  };

  const getClaimTypeLabel = (type: Claim['type']) => {
    switch (type) {
      case 'prediction':
        return 'Prediction';
      case 'warning':
        return 'Warning';
      case 'implication':
        return 'Implication';
      default:
        return 'Statement';
    }
  };

  const getTimeHorizonLabel = (horizon: Claim['timeHorizon']) => {
    switch (horizon) {
      case 'immediate':
        return 'Immediate';
      case 'short':
        return 'Short-term';
      case 'medium':
        return 'Medium-term';
      case 'long':
        return 'Long-term';
      default:
        return horizon;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Actionable Claims ({claims.length})
        </h3>
        <span className="text-xs text-text-tertiary">
          Extracted from content
        </span>
      </div>

      <div className="space-y-3">
        {claims.map((claim) => {
          const validation = validationResults.get(claim.id);
          const isValidating = validatingClaimId === claim.id;

          return (
            <div
              key={claim.id}
              className="bg-background-glass-subtle border border-borders-subtle rounded-lg p-4 space-y-3"
            >
              {/* Claim Header */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getClaimTypeIcon(claim.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-text-secondary">
                      {getClaimTypeLabel(claim.type)}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      • {getTimeHorizonLabel(claim.timeHorizon)}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      • {(claim.certainty * 100).toFixed(0)}% certain
                    </span>
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed">
                    {claim.text}
                  </p>
                  {claim.actor && claim.actor !== 'implied' && (
                    <p className="text-xs text-text-tertiary mt-1">
                      Source: {claim.actor}
                    </p>
                  )}
                </div>
              </div>

              {/* Validation Result */}
              {validation && (
                <div
                  className={`p-3 rounded-md border ${
                    validation.validated
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-orange-500/10 border-orange-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {validation.validated ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-orange-500" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        validation.validated ? 'text-green-500' : 'text-orange-500'
                      }`}
                    >
                      {validation.validated
                        ? `Validated (${validation.supportingSources} sources)`
                        : `Contradicted (${validation.contradictingSources} sources)`}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      • {(validation.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  {validation.evidence.length > 0 && (
                    <div className="space-y-1">
                      {validation.evidence.slice(0, 3).map((ev, idx) => (
                        <a
                          key={idx}
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-text-secondary hover:text-primary truncate"
                        >
                          {ev.supports ? '✓' : '✗'} {ev.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-borders-subtle">
                <button
                  onClick={() => handleValidate(claim)}
                  disabled={isValidating}
                  className="flex items-center gap-2 px-3 py-1.5 bg-background-glass-medium hover:bg-background-glass-strong border border-borders-subtle rounded text-xs font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Validate
                    </>
                  )}
                </button>
                {resultDate && (
                  <button
                    onClick={() => handleCheckUpdates(claim)}
                    disabled={isValidating}
                    className="flex items-center gap-2 px-3 py-1.5 bg-background-glass-medium hover:bg-background-glass-strong border border-borders-subtle rounded text-xs font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Check Updates
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
