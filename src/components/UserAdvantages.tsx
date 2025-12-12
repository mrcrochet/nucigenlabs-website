import { Users, TrendingUp, Building2, Lock } from 'lucide-react';

export default function UserAdvantages() {
  const advantages = [
    {
      icon: Users,
      title: 'For Analysts',
      features: [
        'Early sector inflection points',
        'Real-time event monitoring',
        'Causality classification',
      ],
      locked: false,
    },
    {
      icon: TrendingUp,
      title: 'For Investors',
      features: [
        'Alpha windows',
        'Macro-to-micro propagation',
        'Sector sensitivity mapping',
      ],
      locked: false,
    },
    {
      icon: Building2,
      title: 'For Institutions',
      features: [
        'Private intelligence feed',
        'API pipelines',
        'Strategic reports',
      ],
      locked: true,
    },
  ];

  return (
    <section className="py-32 px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <p className="text-[10px] text-slate-600 mb-8 text-center tracking-[0.3em] font-normal">
          ADVANTAGES FOR USERS
        </p>

        <h2 className="text-3xl md:text-5xl text-white font-light text-center mb-24 tracking-tight leading-[1.3]">
          Built for operators who<br />understand cause and effect
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {advantages.map((advantage, index) => {
            const Icon = advantage.icon;
            return (
              <div
                key={index}
                className="relative backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg p-8 transition-all duration-300 hover:border-white/[0.12]"
              >
                {advantage.locked && (
                  <div className="absolute inset-0 backdrop-blur-[2px] bg-black/20 rounded-lg flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 px-5 py-3 bg-black/80 border border-white/10 rounded-md backdrop-blur-xl">
                      <Lock className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                      <span className="text-xs text-slate-300 font-light tracking-wide">
                        Operator+ access required
                      </span>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <div className="mb-6 w-12 h-12 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                  </div>

                  <h3 className="text-lg text-slate-200 font-normal mb-6 tracking-wide">
                    {advantage.title}
                  </h3>

                  <ul className="space-y-3">
                    {advantage.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-start gap-3 text-xs text-slate-500 font-light leading-[1.7]"
                      >
                        <span className="text-slate-700 mt-0.5">—</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
