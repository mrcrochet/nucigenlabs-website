import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Calendar, Mail, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import CountdownTimer from '../components/CountdownTimer';

export default function EarlyAccessConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date('2026-01-30T15:00:00Z'); // January 30, 2026 at 15:00 UTC

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!email) {
      navigate('/');
    }
  }, [email, navigate]);

  return (
    <main className="min-h-screen">
      <SEO 
        title="Early Access Confirmed — Nucigen Labs"
        description="You're on the list! Get ready for early access to Nucigen Labs on January 30, 2026."
      />

      <section className="relative min-h-screen flex items-center justify-center px-6 py-24">
        <div className="max-w-3xl mx-auto w-full text-center">
          {/* Success Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E1463E]/20 to-[#E1463E]/10 border border-[#E1463E]/30 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-[#E1463E]" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-light mb-6 text-white">
            You're on the list!
          </h1>

          {/* Email confirmation */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-3 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl px-6 py-4">
              <Mail size={20} className="text-[#E1463E]" />
              <p className="text-base text-slate-300 font-light">
                Confirmation sent to <span className="text-white font-normal">{email}</span>
              </p>
            </div>
          </div>

          {/* Countdown */}
          <div className="mb-12">
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-2xl p-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Calendar size={24} className="text-[#E1463E]" />
                <p className="text-sm text-slate-400 font-light tracking-[0.2em] uppercase">
                  Official Launch
                </p>
              </div>
              <div className="mb-4">
                <p className="text-lg text-white font-light mb-2">January 30, 2026 at 15:00 UTC</p>
              </div>
              <div className="flex items-center justify-center gap-2 md:gap-3">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-light text-white tabular-nums tracking-tight">
                    {timeLeft.days.toString().padStart(2, '0')}
                  </div>
                  <div className="text-[8px] md:text-[9px] text-slate-500 tracking-[0.3em] font-light mt-1">DAYS</div>
                </div>
                <div className="text-2xl md:text-3xl text-slate-600 font-extralight pb-3">|</div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-light text-white tabular-nums tracking-tight">
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </div>
                  <div className="text-[8px] md:text-[9px] text-slate-500 tracking-[0.3em] font-light mt-1">HOURS</div>
                </div>
                <div className="text-2xl md:text-3xl text-slate-600 font-extralight pb-3">|</div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-light text-white tabular-nums tracking-tight">
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </div>
                  <div className="text-[8px] md:text-[9px] text-slate-500 tracking-[0.3em] font-light mt-1">MINUTES</div>
                </div>
                <div className="text-2xl md:text-3xl text-slate-600 font-extralight pb-3">|</div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-light text-white tabular-nums tracking-tight">
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </div>
                  <div className="text-[8px] md:text-[9px] text-slate-500 tracking-[0.3em] font-light mt-1">SECONDS</div>
                </div>
              </div>
            </div>
          </div>

          {/* What to expect */}
          <div className="mb-12 text-left">
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-8">
              <h2 className="text-xl font-light text-white mb-6">What to expect</h2>
              <ul className="space-y-4">
                {[
                  'Priority access to the platform on launch day',
                  'Real-time predictive market intelligence',
                  'Four-level economic impact analysis',
                  'Early access pricing and special benefits',
                  'Direct input on platform features'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E1463E] mt-2 flex-shrink-0"></div>
                    <p className="text-base text-slate-300 font-light">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/20 hover:border-white/40 hover:bg-white/[0.05] rounded-lg text-white text-base font-light transition-all"
            >
              Back to Home
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg transition-all duration-150 hover:scale-105 hover:shadow-[0_0_25px_rgba(225,70,62,0.35)]"
            >
              Learn More
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Info */}
          <p className="mt-12 text-sm text-slate-500 font-light">
            We'll keep you updated as we approach launch. Check your email for more details.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

