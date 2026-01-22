/**
 * Top Claims Panel
 * 
 * Displays intelligent synthesis of claims in Intelligence Feed style:
 * - Top Risks (warnings with high certainty)
 * - Top Uncertainties (low certainty claims)
 * - Top Predictions (predictions with high certainty)
 * 
 * PRIORITÉ PRODUIT #2: Synthèse intelligente des claims (style Intelligence Feed)
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, HelpCircle, Clock, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import type { SearchResult, Claim } from '../../types/search';

interface TopClaimsPanelProps {
  results: SearchResult[];
}

interface CategorizedClaims {
  risks: Claim[]; // Warnings with high certainty
  uncertainties: Claim[]; // Low certainty claims (any type)
  predictions: Claim[]; // Predictions with high certainty
  implications: Claim[]; // Implications with high certainty
}

export default function TopClaimsPanel({ results }: TopClaimsPanelProps) {
  const navigate = useNavigate();
  
  const categorizedClaims = useMemo(() => {
    // Extract all claims from all results
    const allClaims: Claim[] = [];
    results.forEach((result) => {
      if (result.claims && result.claims.length > 0) {
        allClaims.push(...result.claims);
      }
    });

    if (allClaims.length === 0) {
      return null;
    }

    const categorized: CategorizedClaims = {
      risks: [],
      uncertainties: [],
      predictions: [],
      implications: [],
    };

    // Categorize claims
    allClaims.forEach((claim) => {
      // Uncertainties: any claim with low certainty (< 0.5)
      if (claim.certainty < 0.5) {
        categorized.uncertainties.push(claim);
      }

      // Risks: warnings with high certainty (>= 0.6)
      if (claim.type === 'warning' && claim.certainty >= 0.6) {
        categorized.risks.push(claim);
      }

      // Predictions: predictions with high certainty (>= 0.6)
      if (claim.type === 'prediction' && claim.certainty >= 0.6) {
        categorized.predictions.push(claim);
      }

      // Implications: implications with high certainty (>= 0.6)
      if (claim.type === 'implication' && claim.certainty >= 0.6) {
        categorized.implications.push(claim);
      }
    });

    // Sort each category
    categorized.risks.sort((a, b) => b.certainty - a.certainty);
    categorized.uncertainties.sort((a, b) => a.certainty - b.certainty); // Lowest certainty first
    categorized.predictions.sort((a, b) => b.certainty - a.certainty);
    categorized.implications.sort((a, b) => b.certainty - a.certainty);

    // Limit to top 3-5 per category
    categorized.risks = categorized.risks.slice(0, 3);
    categorized.uncertainties = categorized.uncertainties.slice(0, 5);
    categorized.predictions = categorized.predictions.slice(0, 3);
    categorized.implications = categorized.implications.slice(0, 3);

    return categorized;
  }, [results]);

  if (!categorizedClaims) {
    return null;
  }

  const hasAnyClaims =
    categorizedClaims.risks.length > 0 ||
    categorizedClaims.uncertainties.length > 0 ||
    categorizedClaims.predictions.length > 0 ||
    categorizedClaims.implications.length > 0;

  if (!hasAnyClaims) {
    return null;
  }

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
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#E1463E]" />
        <h3 className="text-sm font-semibold text-text-primary">Key Intelligence</h3>
      </div>

      {/* Top Risks */}
      {categorizedClaims.risks.length > 0 && (
        <Card 
          className="p-4 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer"
          onClick={() => {
            const allRisks = results.flatMap(r => r.claims || []).filter(c => c.type === 'warning' && c.certainty >= 0.6);
            navigate('/intelligence/risks', { state: { claims: allRisks } });
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider">Top Risks</h4>
            </div>
            <ArrowRight className="w-4 h-4 text-red-500 opacity-50" />
          </div>
          <div className="space-y-3">
            {categorizedClaims.risks.map((claim) => (
              <div key={claim.id} className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                <p className="text-sm text-text-primary font-light leading-relaxed mb-2">
                  {claim.text}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="critical">
                    {(claim.certainty * 100).toFixed(0)}% certain
                  </Badge>
                  {claim.actor && claim.actor !== 'implied' && (
                    <Badge variant="neutral" className="text-xs">
                      {claim.actor}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Uncertainties */}
      {categorizedClaims.uncertainties.length > 0 && (
        <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-yellow-500" />
            <h4 className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">Key Uncertainties</h4>
          </div>
          <div className="space-y-3">
            {categorizedClaims.uncertainties.map((claim) => (
              <div key={claim.id} className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                <p className="text-sm text-text-primary font-light leading-relaxed mb-2">
                  {claim.text}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="neutral">
                    {(claim.certainty * 100).toFixed(0)}% certain
                  </Badge>
                  <Badge variant="neutral" className="text-xs capitalize">
                    {claim.type}
                  </Badge>
                  {claim.actor && claim.actor !== 'implied' && (
                    <Badge variant="neutral" className="text-xs">
                      {claim.actor}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Scenario Outlook */}
      {categorizedClaims.predictions.length > 0 && (
        <Card 
          className="p-4 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors cursor-pointer"
          onClick={() => {
            const allPredictions = results.flatMap(r => r.claims || []).filter(c => c.type === 'prediction' && c.certainty >= 0.6);
            navigate('/intelligence/predictions', { state: { claims: allPredictions } });
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Scenario Outlook</h4>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-500 opacity-50" />
          </div>
          <div className="space-y-3">
            {categorizedClaims.predictions.map((claim) => (
              <div key={claim.id} className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                <p className="text-sm text-text-primary font-light leading-relaxed mb-2">
                  {claim.text}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="level">
                    {(claim.certainty * 100).toFixed(0)}% certain
                  </Badge>
                  <Badge variant="neutral" className="text-xs">
                    {getTimeHorizonLabel(claim.timeHorizon)}
                  </Badge>
                  {claim.actor && claim.actor !== 'implied' && (
                    <Badge variant="neutral" className="text-xs">
                      {claim.actor}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Implications */}
      {categorizedClaims.implications.length > 0 && (
        <Card 
          className="p-4 border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors cursor-pointer"
          onClick={() => {
            const allImplications = results.flatMap(r => r.claims || []).filter(c => c.type === 'implication' && c.certainty >= 0.6);
            navigate('/intelligence/implications', { state: { claims: allImplications } });
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-500" />
              <h4 className="text-xs font-semibold text-purple-500 uppercase tracking-wider">Key Implications</h4>
            </div>
            <ArrowRight className="w-4 h-4 text-purple-500 opacity-50" />
          </div>
          <div className="space-y-3">
            {categorizedClaims.implications.map((claim) => (
              <div key={claim.id} className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                <p className="text-sm text-text-primary font-light leading-relaxed mb-2">
                  {claim.text}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="level">
                    {(claim.certainty * 100).toFixed(0)}% certain
                  </Badge>
                  {claim.actor && claim.actor !== 'implied' && (
                    <Badge variant="neutral" className="text-xs">
                      {claim.actor}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
