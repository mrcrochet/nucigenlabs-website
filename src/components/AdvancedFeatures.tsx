import { Activity, Shield, Cpu, Radio } from 'lucide-react';
import EnhancedCard from './EnhancedCard';
import ParallaxSection from './ParallaxSection';
import TypewriterText from './TypewriterText';

export default function AdvancedFeatures() {
  const features = [
    {
      icon: Activity,
      title: 'Real-Time Stream Processing',
      description: 'Process millions of events per second with sub-millisecond latency using distributed computing infrastructure.',
      metrics: ['340ms avg latency', '99.9% uptime', '10M+ events/sec'],
      glowColor: 'rgba(59, 130, 246, 0.3)',
    },
    {
      icon: Cpu,
      title: 'Advanced ML Pipeline',
      description: 'Multi-model ensemble combining transformer architectures, causal inference, and time-series forecasting.',
      metrics: ['94% accuracy', '15+ models', 'Auto-tuning'],
      glowColor: 'rgba(16, 185, 129, 0.3)',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade encryption, zero-trust architecture, and SOC 2 Type II compliance for institutional requirements.',
      metrics: ['AES-256', 'SOC 2 Type II', 'Zero-trust'],
      glowColor: 'rgba(239, 68, 68, 0.3)',
    },
    {
      icon: Radio,
      title: 'Signal Intelligence',
      description: 'Proprietary algorithms extract alpha from market microstructure, order flow, and cross-asset correlations.',
      metrics: ['12K+ signals', 'Multi-asset', 'Alpha verified'],
      glowColor: 'rgba(245, 158, 11, 0.3)',
    },
  ];

  return (
    <section className="relative px-6 py-32">
      <div className="max-w-7xl mx-auto">
        <ParallaxSection speed={0.3}>
          <div className="text-center mb-20">
            <p className="text-xs text-slate-500 font-light tracking-[0.3em] mb-6">
              ENTERPRISE-GRADE INFRASTRUCTURE
            </p>
            <h2 className="text-4xl md:text-6xl font-light text-white mb-8 leading-tight">
              Built for professionals.<br />
              <span className="text-slate-400">Accessible to everyone.</span>
            </h2>
            <p className="text-lg text-slate-400 font-light max-w-3xl mx-auto mb-4">
              The same intelligence used by professionals — now accessible to everyone.
            </p>
            <p className="text-base text-slate-500 font-light max-w-2xl mx-auto italic min-h-[3rem]">
              <TypewriterText
                texts={[
                  'Institutional-grade market intelligence, built for anyone who wants to invest smarter.',
                  'Political uncertainty does not hit markets directly. It first alters permits, enforcement, financing, and movement.',
                  'Nucigen Labs does not forecast outcomes. It maps how decisions and disruptions propagate through real systems.',
                  'Volatility is rarely random. Nucigen Labs links price instability to structural constraints rather than treating it as noise.',
                  'Industrial bottlenecks are often invisible until they fail. Nucigen Labs identifies them earlier by mapping dependency networks.'
                ]}
                typingSpeed={70}
                deletingSpeed={25}
                pauseDuration={5000}
                className="text-slate-500 italic"
              />
            </p>
          </div>
        </ParallaxSection>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;

            return (
              <ParallaxSection key={feature.title} speed={0.2 + idx * 0.05}>
                <EnhancedCard glowColor={feature.glowColor}>
                  <div className="p-10">
                    <div className="flex items-start gap-6 mb-6">
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${feature.glowColor}, transparent)`,
                        }}
                      >
                        <Icon size={32} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl text-white font-light mb-3">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-slate-400 font-light leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-6 border-t border-white/[0.08]">
                      {feature.metrics.map((metric, metricIdx) => (
                        <div
                          key={metricIdx}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              background: feature.glowColor,
                              boxShadow: `0 0 8px ${feature.glowColor}`,
                            }}
                          ></div>
                          <span className="text-xs text-slate-300 font-light">
                            {metric}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none"></div>
                  </div>
                </EnhancedCard>
              </ParallaxSection>
            );
          })}
        </div>

        <ParallaxSection speed={0.4} className="mt-16">
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.1] rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.05] to-orange-500/[0.05] rounded-2xl"></div>

            <div className="relative">
              <p className="text-3xl md:text-4xl font-light text-white mb-6 leading-relaxed">
                Every microsecond counts.<br />
                <span className="text-slate-400">Every signal matters.</span>
              </p>
              <p className="text-base text-slate-400 font-light max-w-2xl mx-auto">
                Our infrastructure is designed for speed, reliability, and precision at institutional scale.
              </p>
            </div>
          </div>
        </ParallaxSection>
      </div>
    </section>
  );
}
