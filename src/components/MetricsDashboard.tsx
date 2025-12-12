import { useEffect, useState } from 'react';
import { TrendingUp, Clock, Globe, Zap } from 'lucide-react';

interface Metric {
  label: string;
  baseValue: number;
  suffix: string;
  icon: typeof TrendingUp;
  color: string;
  iconColor: string;
  variance: number;
  speed: number;
}

export default function MetricsDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [counters, setCounters] = useState<Record<string, number>>({
    signals: 12847,
    latency: 340,
    sources: 847,
    accuracy: 94,
  });

  const [systemHealth, setSystemHealth] = useState({
    api: 99.9,
    data: 100,
    ml: 99.8,
  });

  const metrics: Metric[] = [
    {
      label: 'Signals Generated',
      baseValue: 12847,
      suffix: '+',
      icon: Zap,
      color: 'from-amber-600 to-amber-700',
      iconColor: 'text-amber-600',
      variance: 15,
      speed: 2000,
    },
    {
      label: 'Analysis Latency',
      baseValue: 340,
      suffix: 'ms',
      icon: Clock,
      color: 'from-sky-600 to-sky-700',
      iconColor: 'text-sky-600',
      variance: 50,
      speed: 1500,
    },
    {
      label: 'Data Sources',
      baseValue: 847,
      suffix: '',
      icon: Globe,
      color: 'from-emerald-600 to-emerald-700',
      iconColor: 'text-emerald-600',
      variance: 3,
      speed: 3000,
    },
    {
      label: 'Prediction Accuracy',
      baseValue: 94,
      suffix: '%',
      icon: TrendingUp,
      color: 'from-rose-600 to-rose-700',
      iconColor: 'text-rose-600',
      variance: 2,
      speed: 2500,
    },
  ];

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    metrics.forEach((metric) => {
      const key = metric.label.toLowerCase().replace(/\s+/g, '_');

      const interval = setInterval(() => {
        const variance = (Math.random() - 0.5) * metric.variance * 2;
        const newValue = metric.baseValue + variance;

        setCounters((prev) => ({
          ...prev,
          [key]: Math.max(0, Math.round(newValue * 10) / 10),
        }));
      }, metric.speed);

      intervals.push(interval);
    });

    const healthInterval = setInterval(() => {
      setSystemHealth({
        api: Math.round((99.85 + Math.random() * 0.15) * 10) / 10,
        data: Math.round((99.9 + Math.random() * 0.1) * 10) / 10,
        ml: Math.round((99.7 + Math.random() * 0.2) * 10) / 10,
      });
    }, 3000);

    intervals.push(healthInterval);

    return () => intervals.forEach(clearInterval);
  }, []);

  return (
    <section className="relative px-6 py-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-slate-800/40 border border-slate-700/50 rounded-lg px-3 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <p className="text-xs text-slate-400 font-medium tracking-wider">LIVE SYSTEM METRICS</p>
          </div>
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Real-time Intelligence Infrastructure
          </h2>
          <p className="text-base text-slate-400 font-light max-w-2xl mx-auto">
            Our platform processes millions of data points every second to deliver actionable insights.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const key = metric.label.toLowerCase().replace(/\s+/g, '_');
            const value = counters[key] || 0;
            const percentage = Math.min(100, ((value / metric.baseValue) * 100));

            return (
              <div
                key={metric.label}
                className="relative bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/40 hover:border-slate-600/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-12 h-12 rounded-lg bg-slate-700/30 flex items-center justify-center`}>
                    <Icon size={22} className={metric.iconColor} />
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full ${metric.iconColor.replace('text-', 'bg-')}`}></div>
                </div>

                <div className="mb-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-light text-white tabular-nums transition-all duration-500">
                      {typeof value === 'number' && !isNaN(value)
                        ? Math.floor(value).toLocaleString()
                        : '0'}
                    </span>
                    <span className={`text-lg font-light ${metric.iconColor}`}>
                      {metric.suffix}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-400 font-light mb-4">
                  {metric.label}
                </p>

                <div className="h-1 bg-slate-700/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${metric.color} transition-all duration-700 ease-out`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <div>
                <p className="text-white font-medium">All Systems Operational</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Last updated: {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full"></div>
                <span className="text-slate-400">API: <span className="text-slate-200 tabular-nums">{systemHealth.api}%</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span className="text-slate-400">Data: <span className="text-slate-200 tabular-nums">{systemHealth.data}%</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full"></div>
                <span className="text-slate-400">ML: <span className="text-slate-200 tabular-nums">{systemHealth.ml}%</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
