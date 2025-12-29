import { Users, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

export default function SocialProof() {
  const stats = [
    {
      icon: Users,
      value: '500+',
      label: 'Early access requests',
      color: 'text-[#E1463E]'
    },
    {
      icon: TrendingUp,
      value: '87%',
      label: 'Prediction accuracy',
      color: 'text-green-400'
    },
    {
      icon: Clock,
      value: '12-48h',
      label: 'Hours ahead of market',
      color: 'text-blue-400'
    },
    {
      icon: CheckCircle2,
      value: '24/7',
      label: 'Continuous monitoring',
      color: 'text-purple-400'
    }
  ];

  return (
    <section className="relative px-4 sm:px-6 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-xs sm:text-sm text-slate-500 font-light mb-2 sm:mb-3 tracking-[0.15em] uppercase">
            Trusted by analysts and operators
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-white mb-3 sm:mb-4 px-2">
            Join a growing network of intelligence-driven professionals
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-4 sm:p-6 hover:border-white/[0.20] transition-all duration-300 text-center"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                  <Icon size={20} className={`sm:w-6 sm:h-6 ${stat.color}`} />
                </div>
                <div className={`text-2xl sm:text-3xl font-light mb-1 sm:mb-2 ${stat.color}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-slate-400 font-light leading-tight">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Testimonial Preview */}
        <div className="mt-12 text-center">
          <div className="inline-block backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-6 max-w-2xl mx-auto">
            <p className="text-sm text-slate-300 font-light italic mb-3">
              "Nucigen Labs gives us the edge we need. We see market movements before they become obvious."
            </p>
            <p className="text-xs text-slate-500 font-light">
              — Portfolio Manager, Hedge Fund
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

