export default function WhyItMatters() {
  const comparisons = [
    {
      traditional: 'Markets react to price.',
      nucigen: 'Nucigen Labs reacts to causality.',
    },
    {
      traditional: 'Sentiment models predict minutes.',
      nucigen: 'Nucigen Labs models structural disruptions months ahead.',
    },
    {
      traditional: 'Retail sees volatility.',
      nucigen: 'Operators see the build-up behind it.',
    },
  ];

  return (
    <section className="py-32 px-6 border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] text-slate-600 mb-8 text-center tracking-[0.3em] font-normal">
          WHY IT MATTERS
        </p>

        <h2 className="text-3xl md:text-5xl text-white font-light text-center mb-24 tracking-tight leading-[1.3]">
          Signals react.<br />Intelligence anticipates.
        </h2>

        <div className="space-y-8">
          {comparisons.map((comparison, index) => (
            <div
              key={index}
              className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg p-10 hover:border-white/[0.12] transition-all duration-300"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-center md:text-right">
                  <p className="text-base text-slate-500 font-light leading-[1.8]">
                    {comparison.traditional}
                  </p>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-8">
                  <div className="w-px h-12 bg-white/[0.1] hidden md:block"></div>
                  <p className="text-base text-slate-200 font-light leading-[1.8]">
                    {comparison.nucigen}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
