import { useState, useEffect } from 'react';
import TypewriterText from './TypewriterText';

export default function HowPeopleUseNucigen() {
  const [memberCount, setMemberCount] = useState(137);
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const updateCount = () => {
      setMemberCount(prev => prev + 30);
      // Programmer la prochaine mise à jour (5-8 heures)
      scheduleNextUpdate();
    };

    const scheduleNextUpdate = () => {
      // Calculer l'intervalle en millisecondes : 5-8 heures
      // 5 heures = 5 * 60 * 60 * 1000 = 18,000,000 ms
      // 8 heures = 8 * 60 * 60 * 1000 = 28,800,000 ms
      const minInterval = 5 * 60 * 60 * 1000; // 5 heures en ms
      const maxInterval = 8 * 60 * 60 * 1000; // 8 heures en ms
      const randomInterval = Math.random() * (maxInterval - minInterval) + minInterval;

      timeoutId = setTimeout(updateCount, randomInterval);
    };

    // Démarrer le premier cycle
    scheduleNextUpdate();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);
  const useCases = [
    {
      role: 'Portfolio Managers',
      action: 'Monitor structural signals in real-time',
      benefit: 'Receive alerts when risk thresholds are crossed, anticipate sector rotations before consensus forms'
    },
    {
      role: 'Risk Analysts',
      action: 'Track supply chain disruptions',
      benefit: 'Identify bottlenecks and vulnerabilities before they impact prices, assess exposure across portfolios'
    },
    {
      role: 'Operators & Traders',
      action: 'Anticipate supply disruptions',
      benefit: 'Get early signals on commodity shortages, logistics delays, and industrial capacity shifts before markets reprice'
    },
    {
      role: 'Researchers & Analysts',
      action: 'Explore second-order effects',
      benefit: 'Map causal chains from geopolitical events to market impact, discover connections before consensus forms'
    }
  ];

  return (
    <section className="relative px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block mb-6 px-4 py-1 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm">
            <span className="text-[10px] text-slate-600 font-light tracking-[0.25em]">USE CASES</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-light mb-6 text-white">
            How could you use Nucigen Labs?
          </h2>
          <p className="text-lg text-slate-400 font-light max-w-3xl mx-auto leading-relaxed">
            We're building for everyone. Whether you're an analyst, investor, researcher, or operator — discover how Nucigen Labs can help you stay ahead of market movements.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {useCases.map((useCase, idx) => (
            <div
              key={idx}
              className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] rounded-xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-white/[0.03] hover:-translate-y-1"
            >
              <div className="mb-6">
                <h3 className="text-xl text-white font-light mb-2 tracking-wide">
                  {useCase.role}
                </h3>
                <p className="text-sm text-slate-300 font-medium mb-3">
                  {useCase.action}
                </p>
                <p className="text-sm text-slate-400 font-light leading-relaxed">
                  {useCase.benefit}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-xl px-8 py-6">
            <p className="text-sm text-slate-400 font-light mb-2">
              <span className="text-white font-medium">Early access cohort:</span>{' '}
              <span className="text-white font-medium">
                {memberCount.toLocaleString()}+
              </span>{' '}
              <span className="text-slate-400">members</span>
            </p>
            <p className="text-xs text-slate-500 font-light min-h-[2rem]">
              <TypewriterText
                texts={[
                  'Join analysts, investors, researchers, and operators from finance, supply chains, and beyond',
                  'When new sanctions are introduced, Nucigen maps causal chains across trade, compliance, and supply corridors.',
                  'When compute availability tightens, Nucigen maps how capacity constraints propagate across AI and cloud ecosystems.',
                  'When a major competitor exits a market, Nucigen maps substitution limits to identify which players gain pricing power.'
                ]}
                typingSpeed={50}
                deletingSpeed={20}
                pauseDuration={6000}
                className="text-slate-500 text-xs"
              />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

