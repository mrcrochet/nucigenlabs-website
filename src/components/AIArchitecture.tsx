import { ArrowDown, ArrowRight, Database, Brain, Target, Zap } from 'lucide-react';

export default function AIArchitecture() {
  const pipeline = [
    {
      stage: 'News Ingestion',
      icon: Database,
      description: 'Global news sources monitored 24/7',
      color: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/30',
    },
    {
      stage: 'Event Extraction',
      icon: Brain,
      description: 'Linguistic analysis & classification',
      color: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30',
    },
    {
      stage: 'Causal Mapping',
      icon: Target,
      description: '4-level causal graph construction',
      color: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30',
    },
    {
      stage: 'Impact Prediction',
      icon: Zap,
      description: 'Market impact forecasting',
      color: 'from-orange-500/20 to-red-500/20',
      borderColor: 'border-orange-500/30',
    },
    {
      stage: 'Alpha Window',
      icon: Target,
      description: 'Optimal timing detection',
      color: 'from-red-500/20 to-pink-500/20',
      borderColor: 'border-red-500/30',
    },
  ];

  return (
    <section className="section-light relative px-6 py-32">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-xs text-slate-600 font-light tracking-[0.3em] mb-6">
            TECHNOLOGY
          </p>
          <h2 className="text-4xl md:text-6xl font-light mb-8 leading-tight">
            Powered by the Nucigen Causal Engine™
          </h2>
          <p className="text-lg text-slate-500 font-light max-w-3xl mx-auto">
            A multi-layered AI architecture that transforms raw events into actionable intelligence.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="relative">
          {/* Vertical Flow - Desktop */}
          <div className="hidden md:block">
            <div className="flex flex-col items-center gap-8 max-w-2xl mx-auto">
              {pipeline.map((step, idx) => {
                const Icon = step.icon;
                const isLast = idx === pipeline.length - 1;
                
                return (
                  <div key={idx} className="w-full">
                    {/* Step Card */}
                    <div className={`backdrop-blur-xl bg-gradient-to-br ${step.color} border ${step.borderColor} rounded-xl p-8 hover:border-opacity-60 transition-all duration-300`}>
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} border ${step.borderColor} flex items-center justify-center flex-shrink-0`}>
                          <Icon size={32} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-light mb-2">{step.stage}</h3>
                          <p className="text-sm text-slate-500 font-light">{step.description}</p>
                        </div>
                        <div className="text-3xl font-light text-slate-400">0{idx + 1}</div>
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    {!isLast && (
                      <div className="flex justify-center my-4">
                        <ArrowDown size={32} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Horizontal Flow - Mobile */}
          <div className="md:hidden">
            <div className="space-y-6">
              {pipeline.map((step, idx) => {
                const Icon = step.icon;
                const isLast = idx === pipeline.length - 1;
                
                return (
                  <div key={idx}>
                    <div className={`backdrop-blur-xl bg-gradient-to-br ${step.color} border ${step.borderColor} rounded-xl p-6 hover:border-opacity-60 transition-all duration-300`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${step.color} border ${step.borderColor} flex items-center justify-center flex-shrink-0`}>
                          <Icon size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-light">{step.stage}</h3>
                            <span className="text-xs text-slate-500">0{idx + 1}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-light">{step.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    {!isLast && (
                      <div className="flex justify-center my-2">
                        <ArrowDown size={24} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-20 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-xl p-6 text-center">
            <div className="text-3xl font-light mb-2">15+</div>
            <div className="text-sm text-slate-500 font-light">ML Models</div>
          </div>
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-xl p-6 text-center">
            <div className="text-3xl font-light mb-2">340ms</div>
            <div className="text-sm text-slate-500 font-light">Avg Latency</div>
          </div>
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-xl p-6 text-center">
            <div className="text-3xl font-light mb-2">99.9%</div>
            <div className="text-sm text-slate-500 font-light">Uptime</div>
          </div>
        </div>

        {/* Bottom Quote */}
        <div className="mt-16 text-center">
          <p className="text-xl font-light text-slate-400 italic max-w-3xl mx-auto">
            "Price is an output. Causality is the input."
          </p>
        </div>
      </div>
    </section>
  );
}

