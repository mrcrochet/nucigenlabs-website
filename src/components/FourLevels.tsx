import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Factory, Ship, TrendingUp, ArrowRight } from 'lucide-react';

export default function FourLevels() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  const levels = [
    {
      icon: Globe,
      title: 'Geopolitical Level',
      slug: 'geopolitical',
      description: 'Wars, elections, sanctions, treaties',
      examples: [
        'Russia sanctions → Energy embargo',
        'Taiwan tensions → Chip supply risk',
        'Election results → Policy shifts'
      ],
      metrics: '847 events tracked',
      color: 'from-red-500/10 to-red-500/5 border-red-900/30',
      nextLevel: 1
    },
    {
      icon: Factory,
      title: 'Industrial Level',
      slug: 'industrial',
      description: 'Mining, energy, factories, production',
      examples: [
        'Factory closures → Production gaps',
        'Energy shortages → Manufacturing delays',
        'Mining disruptions → Material scarcity'
      ],
      metrics: '1,203 facilities monitored',
      color: 'from-orange-500/10 to-orange-500/5 border-orange-900/30',
      nextLevel: 2
    },
    {
      icon: Ship,
      title: 'Supply Chain Level',
      slug: 'supply-chain',
      description: 'Ports, logistics, transport, shortages',
      examples: [
        'Port closures → Shipping delays',
        'Trade route changes → Cost increases',
        'Logistics bottlenecks → Inventory gaps'
      ],
      metrics: '312 routes analyzed',
      color: 'from-blue-500/10 to-blue-500/5 border-blue-900/30',
      nextLevel: 3
    },
    {
      icon: TrendingUp,
      title: 'Market Level',
      slug: 'market',
      description: 'Stocks, crypto, commodities, currencies',
      examples: [
        'Supply disruptions → Price volatility',
        'Demand shifts → Asset repricing',
        'Risk events → Market corrections'
      ],
      metrics: '47 markets tracked',
      color: 'from-green-500/10 to-green-500/5 border-green-900/30',
      nextLevel: null
    }
  ];

  return (
    <section className="relative px-6 py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light mb-6">
            Every news moves markets at four levels.
          </h2>
          <p className="text-base text-slate-500 font-light max-w-3xl mx-auto">
            Nucigen Labs models how one decision propagates through four economic levers in real-time.
          </p>
        </div>

        <div className="relative">
          {/* Connection lines - visible on hover */}
          <div className="absolute inset-0 pointer-events-none hidden md:block" style={{ height: '100%' }}>
            <svg className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
              <defs>
                <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#E1463E" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#E1463E" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#E1463E" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              {/* Vertical flow line */}
              <line
                x1="50%"
                y1="12%"
                x2="50%"
                y2="88%"
                stroke="url(#connection-gradient)"
                strokeWidth="2"
                strokeDasharray="6,4"
                opacity={hoveredIndex !== null ? 0.5 : 0.2}
                style={{ transition: 'opacity 0.3s ease' }}
              />
              {/* Connection points */}
              {levels.map((level, idx) => {
                if (level.nextLevel === null) return null;
                const isActive = hoveredIndex === idx || hoveredIndex === level.nextLevel;
                const yPositions = [25, 50, 75, 100];
                return (
                  <circle
                    key={`point-${idx}`}
                    cx="50%"
                    cy={`${yPositions[idx]}%`}
                    r="4"
                    fill="#E1463E"
                    opacity={isActive ? 0.8 : 0.3}
                    style={{ transition: 'opacity 0.3s ease' }}
                  />
                );
              })}
            </svg>
          </div>

          <div className="grid md:grid-cols-2 gap-6 relative z-10">
            {levels.map((level, idx) => {
              const Icon = level.icon;
              const isHovered = hoveredIndex === idx;
              const nextLevel = level.nextLevel !== null ? levels[level.nextLevel] : null;
              
              return (
                <div
                  key={idx}
                  className="group relative"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div
                    onClick={() => navigate(`/level/${level.slug}`)}
                    className={`backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border rounded-xl p-8 transition-all duration-300 cursor-pointer ${
                      isHovered 
                        ? 'border-white/[0.25] scale-[1.02] shadow-lg shadow-[#E1463E]/10' 
                        : 'border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${level.color} flex items-center justify-center border`}>
                        <Icon size={26} className="text-[#E1463E]" />
                      </div>
                      {nextLevel && (
                        <div className={`flex items-center gap-2 text-xs text-slate-500 transition-opacity duration-300 ${
                          isHovered ? 'opacity-100' : 'opacity-0'
                        }`}>
                          <span>Propagates to</span>
                          <ArrowRight size={14} className="text-[#E1463E]" />
                          <span className="text-[#E1463E]">{nextLevel.title}</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-light mb-3">{level.title}</h3>
                    <p className="text-sm text-slate-400 font-light leading-relaxed mb-4">
                      {level.description}
                    </p>

                    {/* Examples */}
                    <div className="space-y-2 mb-4">
                      {level.examples.map((example, exampleIdx) => (
                        <div
                          key={exampleIdx}
                          className="flex items-start gap-2 text-xs text-slate-500 font-light"
                        >
                          <div className="w-1 h-1 rounded-full bg-[#E1463E]/50 mt-1.5 flex-shrink-0"></div>
                          <span>{example}</span>
                        </div>
                      ))}
                    </div>

                    {/* Metrics */}
                    <div className="pt-4 border-t border-white/[0.08]">
                      <p className="text-xs text-slate-500 font-light">
                        {level.metrics}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom explanation */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-full">
            <div className="flex items-center gap-2">
              {levels.map((_, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#E1463E]/50"></div>
                  {idx < levels.length - 1 && (
                    <ArrowRight size={12} className="text-slate-500" />
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-light ml-2">
              Real-time propagation chain
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
