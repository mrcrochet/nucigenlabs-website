import { Globe, Factory, Ship, TrendingUp } from 'lucide-react';

export default function FourLevels() {
  const levels = [
    {
      icon: Globe,
      title: 'Geopolitical Level',
      description: 'Wars, elections, sanctions, treaties',
      color: 'from-red-500/10 to-red-500/5 border-red-900/30'
    },
    {
      icon: Factory,
      title: 'Industrial Level',
      description: 'Mining, energy, factories, production',
      color: 'from-orange-500/10 to-orange-500/5 border-orange-900/30'
    },
    {
      icon: Ship,
      title: 'Supply Chain Level',
      description: 'Ports, logistics, transport, shortages',
      color: 'from-blue-500/10 to-blue-500/5 border-blue-900/30'
    },
    {
      icon: TrendingUp,
      title: 'Market Level',
      description: 'Stocks, crypto, commodities, currencies',
      color: 'from-green-500/10 to-green-500/5 border-green-900/30'
    }
  ];

  return (
    <section className="relative px-6 py-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Every news moves markets at four levels.
          </h2>
          <p className="text-base text-slate-400 font-light max-w-3xl mx-auto">
            Nucigen Labs models how one decision propagates through four economic levers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {levels.map((level, idx) => {
            const Icon = level.icon;
            return (
              <div
                key={idx}
                className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-xl p-8 hover:border-white/[0.15] transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${level.color} flex items-center justify-center mb-6 border`}>
                  <Icon size={26} className="text-white/80" />
                </div>
                <h3 className="text-xl text-white font-light mb-3">{level.title}</h3>
                <p className="text-sm text-slate-400 font-light leading-relaxed">
                  {level.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.12] rounded-xl p-8 text-center">
          <p className="text-lg text-white font-light leading-relaxed">
            Nucigen Labs connects these four layers in real time to anticipate price movement.
          </p>
        </div>
      </div>
    </section>
  );
}
