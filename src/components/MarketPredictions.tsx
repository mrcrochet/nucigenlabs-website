import { TrendingUp, TrendingDown, ArrowRight, ExternalLink } from 'lucide-react';

interface Prediction {
  question: string;
  options: {
    label: string;
    probability: number;
    change?: number;
    direction?: 'up' | 'down';
  }[];
  volume: string;
  source?: string;
}

interface MarketPredictionsProps {
  predictions?: Prediction[];
}

export default function MarketPredictions({ predictions }: MarketPredictionsProps) {
  // Mock data - à remplacer par de vraies données
  const defaultPredictions: Prediction[] = [
    {
      question: 'Energy prices after new sanctions?',
      options: [
        { label: 'Increase 5-10%', probability: 68.0, change: 12.3, direction: 'up' },
        { label: 'Increase 10-15%', probability: 24.0, change: -3.2, direction: 'down' },
        { label: 'Stable or decrease', probability: 8.0, change: -9.1, direction: 'down' },
      ],
      volume: '$142M',
      source: 'Nucigen Analysis',
    },
    {
      question: 'Semiconductor supply chain impact timeframe?',
      options: [
        { label: '12-24 hours', probability: 45.0, change: 8.5, direction: 'up' },
        { label: '24-48 hours', probability: 32.0, change: -2.1, direction: 'down' },
        { label: '48-72 hours', probability: 23.0, change: -6.4, direction: 'down' },
      ],
      volume: '$89M',
      source: 'Nucigen Analysis',
    },
    {
      question: 'Shipping index movement in next 48h?',
      options: [
        { label: 'Down 3-5%', probability: 52.0, change: 15.2, direction: 'up' },
        { label: 'Down 5-8%', probability: 28.0, change: -4.8, direction: 'down' },
        { label: 'Stable or up', probability: 20.0, change: -10.4, direction: 'down' },
      ],
      volume: '$67M',
      source: 'Nucigen Analysis',
    },
  ];

  const displayPredictions = predictions || defaultPredictions;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light text-white">Market Predictions</h2>
        <button className="text-sm text-[#E1463E] hover:text-[#E1463E]/80 transition-colors flex items-center gap-1.5 font-light">
          View all <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6">
        {displayPredictions.map((prediction, index) => (
          <div key={index} className="bg-white/[0.02] rounded-2xl p-7 hover:bg-white/[0.025] transition-all">
            <h3 className="text-lg font-light text-white mb-6 leading-snug">{prediction.question}</h3>
            
            <div className="space-y-4 mb-5">
              {prediction.options.map((option, optIndex) => (
                <div key={optIndex}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500 font-light">{option.label}</span>
                    <div className="flex items-center gap-4">
                      {option.change !== undefined && (
                        <span
                          className={`text-xs font-light flex items-center gap-1 ${
                            option.direction === 'up' ? 'text-green-500/70' : 'text-red-500/70'
                          }`}
                        >
                          {option.direction === 'up' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {Math.abs(option.change).toFixed(1)}%
                        </span>
                      )}
                      <span className="text-base text-white font-light min-w-[3.5rem] text-right">
                        {option.probability.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-white/[0.03] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-[#E1463E]/25 rounded-full transition-all"
                      style={{ width: `${option.probability}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-white/[0.02]">
              <span className="text-sm text-slate-600 font-light">{prediction.volume} vol.</span>
              {prediction.source && (
                <span className="text-sm text-slate-600 font-light flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  {prediction.source}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="w-full py-4 mt-6 text-sm text-slate-600 hover:text-white transition-colors font-light rounded-xl hover:bg-white/[0.02]">
        See more predictions
      </button>
    </div>
  );
}

