import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function CaseStudiesPreview() {
  const cases = [
    {
      number: '01',
      title: 'From cobalt concessions to EV repricing',
      description: 'How mining agreements created a 6–12 month window in EV supply chains.',
    },
    {
      number: '02',
      title: 'When ports blink: the cost of a 10-day backlog',
      description: 'How a slowdown cascaded across retail inventories and shipping premiums.',
    },
    {
      number: '03',
      title: 'Drone co-production and microelectronics demand',
      description: 'How defense partnerships impact upstream semiconductor pressure.',
    },
  ];

  return (
    <section className="py-32 px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <p className="text-[10px] text-slate-600 mb-8 text-center tracking-[0.3em] font-normal">
          CASE STUDIES
        </p>

        <h2 className="text-3xl md:text-5xl text-white font-light text-center mb-24 tracking-tight leading-[1.3]">
          Real events.<br />Real consequences.
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {cases.map((caseStudy, index) => (
            <Link
              key={index}
              to="/case-studies"
              className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg p-8 hover:border-white/[0.15] transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-radial from-slate-700/5 via-transparent to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

              <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-[10px] text-slate-600 tracking-[0.3em] font-normal">
                    CASE {caseStudy.number}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
                </div>

                <h3 className="text-base text-slate-200 font-normal mb-5 leading-[1.5] min-h-[3rem]">
                  {caseStudy.title}
                </h3>

                <p className="text-xs text-slate-500 font-light leading-[1.8]">
                  {caseStudy.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/case-studies"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors font-light tracking-wide"
          >
            View all case studies
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}
