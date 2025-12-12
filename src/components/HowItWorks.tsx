import { Globe2, Factory, Ship, TrendingUp } from 'lucide-react';

export default function HowItWorks() {
  const stages = [
    {
      icon: Globe2,
      number: '1',
      title: 'Geopolitical Vectors',
      description: 'Treaties, sanctions, defense deals, resource concessions.',
    },
    {
      icon: Factory,
      number: '2',
      title: 'Industrial Chains',
      description: 'Mines → refineries → OEM → distributors.',
    },
    {
      icon: Ship,
      number: '3',
      title: 'Supply Corridors',
      description: 'Ports, shipping lanes, rail networks, inventories, disruptions.',
    },
    {
      icon: TrendingUp,
      number: '4',
      title: 'Alpha Windows',
      description: 'Predictive windows created by real-world constraints.',
    },
  ];

  return (
    <section className="py-32 px-6 border-t border-white/[0.06] relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.02)_0%,_transparent_70%)] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative">
        <p className="text-[10px] text-slate-600 mb-8 text-center tracking-[0.3em] font-normal">
          HOW IT WORKS
        </p>

        <h2 className="text-3xl md:text-5xl text-white font-light text-center mb-24 tracking-tight leading-[1.3]">
          Four-Block Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.number}
                className="relative p-8 backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg hover:border-white/[0.15] transition-all duration-300 group"
              >
                <div className="absolute inset-0 bg-gradient-radial from-slate-700/5 via-transparent to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                <div className="relative">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center group-hover:bg-white/[0.08] transition-colors">
                      <Icon className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                    </div>
                    <span className="text-[10px] text-slate-700 font-light tracking-[0.3em]">
                      {stage.number.padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="text-base text-slate-200 font-normal mb-4 tracking-wide leading-[1.4]">
                    {stage.title}
                  </h3>

                  <p className="text-xs text-slate-500 font-light leading-[1.8]">
                    {stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-20 text-center">
          <p className="text-sm text-slate-400 font-light leading-[1.9] italic">
            Background subtle grid. Minimalist.
          </p>
        </div>
      </div>
    </section>
  );
}
