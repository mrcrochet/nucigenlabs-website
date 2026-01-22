/**
 * Global Watch Indicators Component
 * 
 * Aggregates watch indicators from all scenarios
 * Displays cross-scenario signals to monitor
 */

import { Radio, MessageSquare, DollarSign, Zap } from 'lucide-react';
import Card from '../ui/Card';
import type { Outlook } from '../../types/prediction';

interface WatchIndicatorsProps {
  outlooks: Outlook[];
}

export default function WatchIndicators({ outlooks }: WatchIndicatorsProps) {
  // Aggregate all watch indicators from all scenarios
  const allIndicators = outlooks.flatMap(outlook => 
    (outlook.watch_indicators || []).map(indicator => ({
      text: indicator,
      scenario: outlook.title,
    }))
  );

  // Deduplicate and categorize indicators
  const categorizedIndicators = {
    military: allIndicators.filter(i => 
      /military|naval|deployment|troop|defense|weapon/i.test(i.text)
    ),
    diplomatic: allIndicators.filter(i => 
      /diplomatic|meeting|talks|negotiation|statement|official/i.test(i.text)
    ),
    economic: allIndicators.filter(i => 
      /economic|price|cost|market|trade|sanction|currency|shipping|insurance/i.test(i.text)
    ),
    energy: allIndicators.filter(i => 
      /energy|oil|gas|fuel|petroleum|crude/i.test(i.text)
    ),
    other: allIndicators.filter(i => 
      !/military|naval|deployment|troop|defense|weapon|diplomatic|meeting|talks|negotiation|statement|official|economic|price|cost|market|trade|sanction|currency|shipping|insurance|energy|oil|gas|fuel|petroleum|crude/i.test(i.text)
    ),
  };

  const categories = [
    { 
      key: 'military', 
      label: 'Military movements', 
      icon: Radio, 
      color: 'text-red-400',
      indicators: categorizedIndicators.military 
    },
    { 
      key: 'diplomatic', 
      label: 'Diplomatic statements', 
      icon: MessageSquare, 
      color: 'text-blue-400',
      indicators: categorizedIndicators.diplomatic 
    },
    { 
      key: 'economic', 
      label: 'Shipping & insurance costs', 
      icon: DollarSign, 
      color: 'text-green-400',
      indicators: categorizedIndicators.economic 
    },
    { 
      key: 'energy', 
      label: 'Energy price volatility', 
      icon: Zap, 
      color: 'text-amber-400',
      indicators: categorizedIndicators.energy 
    },
  ].filter(cat => cat.indicators.length > 0);

  if (categories.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-light text-text-primary mb-2">
          Global Signals to Watch
        </h3>
        <p className="text-sm text-text-secondary font-light">
          Cross-scenario indicators aggregated from all outlooks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(category => {
          const Icon = category.icon;
          const uniqueIndicators = Array.from(
            new Map(category.indicators.map(i => [i.text, i])).values()
          ).slice(0, 5); // Limit to top 5 per category

          return (
            <div key={category.key} className="p-4 bg-white/[0.02] rounded-lg border border-white/[0.05]">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${category.color}`} />
                <h4 className="text-sm font-semibold text-text-primary">
                  {category.label}
                </h4>
                <span className="text-xs text-text-tertiary">
                  ({uniqueIndicators.length})
                </span>
              </div>
              <ul className="space-y-2">
                {uniqueIndicators.map((indicator, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-text-secondary font-light">
                    <span className={`${category.color} mt-1`}>•</span>
                    <span className="leading-relaxed">{indicator.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
