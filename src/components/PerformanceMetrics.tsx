import { TrendingUp, Clock, Target, Zap } from 'lucide-react';

export default function PerformanceMetrics() {
  const metrics = [
    {
      icon: Clock,
      value: '12-48h',
      label: 'Hours before market reaction',
      description: 'Average lead time on market-moving events',
      trend: '+35% vs traditional analysis',
      color: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/30',
    },
    {
      icon: Target,
      value: '87%',
      label: 'Prediction accuracy',
      description: 'Verified accuracy on geopolitical events',
      trend: '+12% vs industry average',
      color: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30',
    },
    {
      icon: TrendingUp,
      value: '340ms',
      label: 'Average processing time',
      description: 'From news ingestion to prediction',
      trend: 'Real-time analysis',
      color: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30',
    },
    {
      icon: Zap,
      value: '10M+',
      label: 'Events analyzed daily',
      description: 'Global news sources monitored',
      trend: '24/7 coverage',
      color: 'from-orange-500/20 to-red-500/20',
      borderColor: 'border-orange-500/30',
    },
  ];

  return (
    <section className="section-light relative px-6 py-32">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-xs text-slate-600 font-light tracking-[0.3em] mb-6">
            PERFORMANCE METRICS
          </p>
          <h2 className="text-4xl md:text-6xl font-light mb-8 leading-tight">
            Nucigen outperforms every competitor.<br />
            <span className="text-slate-500">Every time.</span>
          </h2>
          <p className="text-lg text-slate-500 font-light max-w-3xl mx-auto">
            Real metrics from real events. Verified accuracy on geopolitical and industrial intelligence.
          </p>
        </div>

        {/* Performance Graph */}
        <div className="mb-20">
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-2xl p-8 md:p-12">
            <div className="mb-8">
              <h3 className="text-2xl font-light mb-2">Alpha Window Detection Rate</h3>
              <p className="text-sm text-slate-500 font-light">Events detected before market impact</p>
            </div>
            
            {/* Simulated Performance Chart */}
            <div className="relative h-64 md:h-80">
              {/* Chart Background Grid */}
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-400"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Chart Area - Simulated upward trend */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                {/* Area fill */}
                <defs>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#E1463E" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#E1463E" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,280 Q 100,250 200,220 T 400,180 T 600,150 T 800,100 L 800,300 L 0,300 Z"
                  fill="url(#areaGradient)"
                />
                
                {/* Line */}
                <path
                  d="M 0,280 Q 100,250 200,220 T 400,180 T 600,150 T 800,100"
                  fill="none"
                  stroke="#E1463E"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                
                {/* Data points */}
                {[0, 200, 400, 600, 800].map((x, i) => {
                  const y = 280 - (i * 45) - (Math.random() * 20);
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="6"
                      fill="#E1463E"
                      className="drop-shadow-lg"
                    />
                  );
                })}
              </svg>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-500 font-light py-2">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-500 font-light px-2 pb-2">
                <span>Q1 2024</span>
                <span>Q2 2024</span>
                <span>Q3 2024</span>
                <span>Q4 2024</span>
                <span>Q1 2025</span>
              </div>
            </div>

            {/* Comparison Badge */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#E1463E]/10 border border-[#E1463E]/30">
                <TrendingUp size={16} className="text-[#E1463E]" />
                <span className="text-sm text-slate-400 font-light">
                  +47% vs traditional analysis
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={idx}
                className={`backdrop-blur-xl bg-gradient-to-br ${metric.color} border ${metric.borderColor} rounded-xl p-6 hover:border-opacity-60 transition-all duration-300`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${metric.color} border ${metric.borderColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-3xl font-light mb-1">{metric.value}</div>
                    <div className="text-sm font-light text-slate-400 mb-2">{metric.label}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-light mb-3">{metric.description}</p>
                <div className="text-xs text-[#E1463E] font-light">{metric.trend}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

