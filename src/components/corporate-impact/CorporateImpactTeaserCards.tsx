/**
 * Corporate Impact Teaser Cards — Causal Drivers, Impact Score, Decision Points.
 * Uses real dashboard data when available (from GET /api/corporate-impact/dashboard).
 */

import { Zap, Gauge, ClipboardList } from 'lucide-react';

export interface CorporateImpactDashboard {
  causal_drivers?: string[];
  impact_score?: { average: number; count: number; trend: string } | null;
  decision_points?: Array<{ label: string; reason: string; company?: string }>;
}

interface CorporateImpactTeaserCardsProps {
  dashboard?: CorporateImpactDashboard | null;
}

export default function CorporateImpactTeaserCards({ dashboard }: CorporateImpactTeaserCardsProps) {
  const drivers = dashboard?.causal_drivers?.slice(0, 5) || [];
  const impact = dashboard?.impact_score;
  const decisions = dashboard?.decision_points?.slice(0, 4) || [];

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Causal Drivers */}
        <div className="p-5 bg-gray-900/50 border border-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-white/5 border border-gray-700 rounded-lg">
              <Zap className="w-4 h-4 text-gray-400" aria-hidden />
            </div>
            <h3 className="text-sm font-medium text-gray-200">Causal Drivers</h3>
          </div>
          {drivers.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-gray-400 font-light">
              {drivers.map((d, i) => (
                <li key={i} className="truncate" title={d}>• {d}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 font-light leading-relaxed">
              Identify the events and mechanisms pushing the company.
            </p>
          )}
        </div>

        {/* Impact Score */}
        <div className="p-5 bg-gray-900/50 border border-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-white/5 border border-gray-700 rounded-lg">
              <Gauge className="w-4 h-4 text-gray-400" aria-hidden />
            </div>
            <h3 className="text-sm font-medium text-gray-200">Impact Score</h3>
          </div>
          {impact != null ? (
            <div className="space-y-1 text-xs text-gray-400 font-light">
              <p className="text-gray-300 font-medium">Avg. {impact.average}/100</p>
              <p className="text-gray-500">Across {impact.count} event analyses</p>
            </div>
          ) : (
            <p className="text-xs text-gray-500 font-light leading-relaxed">
              Quantify pressure across supply, demand, regulation, sentiment, and capital.
            </p>
          )}
        </div>

        {/* Decision Points */}
        <div className="p-5 bg-gray-900/50 border border-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-white/5 border border-gray-700 rounded-lg">
              <ClipboardList className="w-4 h-4 text-gray-400" aria-hidden />
            </div>
            <h3 className="text-sm font-medium text-gray-200">Decision Points</h3>
          </div>
          {decisions.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-gray-400 font-light">
              {decisions.map((d, i) => (
                <li key={i}>
                  <span className="text-gray-300 font-medium">{d.label}</span>
                  {d.company && <span className="text-gray-500"> — {d.company}</span>}
                  {d.reason && <span className="block text-gray-500 truncate">{d.reason}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 font-light leading-relaxed">
              Clear options: hold / hedge / accumulate / exit — with &quot;why now&quot;.
            </p>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-600 mt-8 font-light">
        Powered by web sources + market data. Always cited. Built for operators.
      </p>
    </section>
  );
}
