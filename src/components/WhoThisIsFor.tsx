import { GraduationCap, Users, TrendingUp, Coins, LineChart, Target } from 'lucide-react';

export default function WhoThisIsFor() {
  const audiences = [
    {
      icon: GraduationCap,
      title: 'Beginners',
      description: 'Start investing with professional-grade intelligence'
    },
    {
      icon: Users,
      title: 'Students',
      description: 'Learn market dynamics through real causal analysis'
    },
    {
      icon: Users,
      title: 'Retail Investors',
      description: 'Make informed decisions based on reality, not hype'
    },
    {
      icon: Coins,
      title: 'Crypto Traders',
      description: 'Anticipate crypto movements through global events'
    },
    {
      icon: LineChart,
      title: 'Stock Traders',
      description: 'Position before market repricing windows'
    },
    {
      icon: Target,
      title: 'Long-term Investors',
      description: 'Understand the fundamental drivers of value'
    }
  ];

  return (
    <section className="relative px-6 py-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light mb-6">
            Built for everyone who wants to invest smarter.
          </h2>
          <p className="text-base text-slate-500 font-light max-w-3xl mx-auto mb-4">
            You no longer need thousands of dollars to access professional-grade market intelligence.
          </p>
          <p className="text-sm text-slate-400 font-light max-w-2xl mx-auto italic">
            If you can read the news, you can use Nucigen Labs. No charts to decode. No noise. Just clear cause → effect → market impact.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {audiences.map((audience, idx) => {
            const Icon = audience.icon;
            return (
              <div
                key={idx}
                className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-6 hover:border-white/[0.20] hover:shadow-xl hover:shadow-white/[0.05] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-white/[0.10] border border-white/20 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  <Icon size={22} className="text-[#E1463E] transition-colors duration-200" />
                </div>
                <h3 className="text-lg font-light mb-2 text-white">{audience.title}</h3>
                <p className="text-sm text-slate-400 font-light leading-relaxed">
                  {audience.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-8 text-center hover:border-white/[0.18] transition-all duration-300">
          <p className="text-lg font-light leading-relaxed text-white">
            The intelligence usually reserved for institutions — now available for $59/month.
          </p>
        </div>
      </div>
    </section>
  );
}
