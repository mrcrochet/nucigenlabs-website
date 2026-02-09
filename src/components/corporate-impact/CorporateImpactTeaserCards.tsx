/**
 * Corporate Impact Teaser Cards — v1 (Palantir / Intel)
 * 3 cards: Causal Drivers, Impact Score, Decision Points.
 */

import { Zap, Gauge, ClipboardList } from 'lucide-react';

const cards = [
  {
    icon: Zap,
    title: 'Causal Drivers',
    description: 'Identify the events and mechanisms pushing the company.',
  },
  {
    icon: Gauge,
    title: 'Impact Score',
    description: 'Quantify pressure across supply, demand, regulation, sentiment, and capital.',
  },
  {
    icon: ClipboardList,
    title: 'Decision Points',
    description: 'Clear options: hold / hedge / accumulate / exit — with "why now".',
  },
] as const;

export default function CorporateImpactTeaserCards() {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="p-5 bg-gray-900/50 border border-gray-800 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-white/5 border border-gray-700 rounded-lg">
                <Icon className="w-4 h-4 text-gray-400" aria-hidden />
              </div>
              <h3 className="text-sm font-medium text-gray-200">{title}</h3>
            </div>
            <p className="text-xs text-gray-500 font-light leading-relaxed">
              {description}
            </p>
          </div>
        ))}
      </div>

      {/* Micro-text */}
      <p className="text-center text-xs text-gray-600 mt-8 font-light">
        Powered by web sources + market data. Always cited. Built for operators.
      </p>
    </section>
  );
}
