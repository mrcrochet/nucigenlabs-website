import { Newspaper, ArrowRight, CheckCircle2 } from 'lucide-react';

interface NewsItem {
  news: string;
  prediction: string;
  timing: string;
}

const lanes: NewsItem[][] = [
  [
    {
      news: 'Explosion reported at a semiconductor fabrication plant in Taiwan',
      prediction: 'Chip supply disruption → Foundry prices up, hardware manufacturers under margin pressure',
      timing: '6 hours before market reaction',
    },
    {
      news: 'Export controls expanded on advanced lithography equipment to Asia',
      prediction: 'Production bottleneck → GPU shortages, AI infrastructure costs rise',
      timing: '18 hours before repricing',
    },
  ],
  [
    {
      news: '10-day dockworker strike announced at Rotterdam port',
      prediction: 'Shipping delays → Container rates spike, retail inventory stress in EU',
      timing: '2 days before price movement',
    },
    {
      news: 'Panama Canal transit slots reduced due to drought conditions',
      prediction: 'Longer shipping routes → Fuel demand up, freight costs increase globally',
      timing: '48 hours before transport sector move',
    },
  ],
  [
    {
      news: 'New oil export sanctions imposed on major producer',
      prediction: 'Supply constraint → Oil prices up, airline stocks down',
      timing: '12 hours before market opens',
    },
    {
      news: 'China announces strategic rare earth export restrictions',
      prediction: 'Input scarcity → EV battery costs rise, clean-tech margins compress',
      timing: '1 day before repricing',
    },
  ],
  [
    {
      news: 'Drone co-production agreement signed between two defense blocs',
      prediction: 'Military electronics demand → Upstream semiconductor pressure',
      timing: '36 hours before sector rotation',
    },
    {
      news: 'Military escalation reported near strategic shipping corridor',
      prediction: 'Insurance premiums surge → Maritime transport stocks reprice',
      timing: 'Before volatility spike',
    },
  ],
  [
    {
      news: 'Multiple mining concessions approved for cobalt extraction',
      prediction: 'Battery metal oversupply → EV input costs down, vehicle margins expand',
      timing: 'Weeks before procurement repricing',
    },
    {
      news: 'EU carbon tax expansion confirmed for industrial imports',
      prediction: 'Cost transfer → Steel & cement prices higher across construction sector',
      timing: 'Before futures repositioning',
    },
  ],
];

export default function LiveNewsFeed() {
  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-slate-950/50 to-transparent">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/5 to-transparent pointer-events-none"></div>

      <div className="max-w-6xl mx-auto mb-16 text-center relative z-10 px-6">
        <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
          From news to prediction in real-time.
        </h2>
        <p className="text-base text-slate-400 font-light max-w-3xl mx-auto">
          Our system detects market-moving events from global news and predicts their impact before the market prices it in.
        </p>
      </div>

      <div className="relative space-y-5">
        {lanes.map((laneData, laneIndex) => (
          <ScrollingLane key={laneIndex} items={laneData} speed={35 + laneIndex * 3} delay={laneIndex * 2} />
        ))}
      </div>

      <div className="mt-20 max-w-4xl mx-auto relative z-10 px-6">
        <div className="bg-gradient-to-r from-red-950/20 via-red-900/20 to-red-950/20 border border-red-900/30 rounded-xl p-8 text-center">
          <h3 className="text-2xl md:text-3xl font-light text-white mb-4">
            The edge isn't in the data. It's in the timing.
          </h3>
          <p className="text-slate-400 font-light">
            Every prediction is derived from real events, analyzed through causal chains, and delivered before the market reacts.
          </p>
        </div>
      </div>
    </section>
  );
}

function ScrollingLane({ items, speed, delay }: { items: NewsItem[]; speed: number; delay: number }) {
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden">
      <div
        className="flex gap-4"
        style={{
          animation: `scrollLeft ${speed}s linear infinite`,
          animationDelay: `${delay}s`,
        }}
      >
        {duplicatedItems.map((item, index) => (
          <NewsCard key={index} item={item} />
        ))}
      </div>

      <style>{`
        @keyframes scrollLeft {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <div className="flex-shrink-0 w-[800px] flex items-center gap-4 bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex-1 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-center flex-shrink-0">
          <Newspaper size={16} className="text-slate-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-slate-500 font-medium mb-1 tracking-wider">NEWS DETECTED</p>
          <p className="text-sm text-white font-light leading-relaxed">{item.news}</p>
        </div>
      </div>

      <div className="flex-shrink-0">
        <ArrowRight size={22} className="text-[#E1463E]" />
      </div>

      <div className="flex-1 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={16} className="text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-slate-500 font-medium mb-1 tracking-wider">PREDICTION GENERATED</p>
          <p className="text-sm text-white font-light mb-1.5 leading-relaxed">{item.prediction}</p>
          <p className="text-[10px] text-red-400 font-light">Predicted {item.timing}</p>
        </div>
      </div>
    </div>
  );
}
