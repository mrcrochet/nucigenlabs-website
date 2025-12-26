import { useState } from 'react';
import { ArrowRight, XCircle } from 'lucide-react';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import AccessRequestModal from '../components/AccessRequestModal';
import CountdownTimer from '../components/CountdownTimer';
import LiveNewsFeed from '../components/LiveNewsFeed';
import FourLevels from '../components/FourLevels';
import WhoThisIsFor from '../components/WhoThisIsFor';
import WaitingListSection from '../components/WaitingListSection';
import Mission from '../components/Mission';
import AdvancedFeatures from '../components/AdvancedFeatures';
import PerformanceMetrics from '../components/PerformanceMetrics';
import Integrations from '../components/Integrations';
import AIArchitecture from '../components/AIArchitecture';

export default function Home() {
  const [showAccessModal, setShowAccessModal] = useState(false);

  return (
    <main className="min-h-screen">
      <SEO />

      <section className="relative min-h-screen flex items-center justify-center px-6 py-32">
        <div className="max-w-5xl mx-auto w-full text-center">
          <div className="inline-block backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/20 rounded-full px-6 py-2 mb-8">
            <p className="text-sm text-[#E1463E] font-light tracking-[0.15em]">PREDICTIVE NEWS ANALYSIS</p>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light mb-10 leading-[1.1] text-white">
            We scan the news.<br />We predict the market.<br />
            <span className="text-[#E1463E]">Before it moves.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 leading-relaxed font-light mb-6 max-w-4xl mx-auto">
            Nucigen Labs transforms global news into predictive market signals in real-time.
          </p>

          <p className="text-base md:text-lg text-slate-500 leading-relaxed font-light mb-12 max-w-3xl mx-auto">
            When a factory closes in Taiwan or a sanction hits Russia, we detect it instantly and predict which assets will move — hours or days before the market reacts.
          </p>

          <div className="mb-8">
            <div className="inline-block backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-2xl px-8 py-6">
              <div className="text-xs text-slate-500 font-light tracking-[0.2em] mb-4 text-center">OFFICIAL LAUNCH IN</div>
              <CountdownTimer />
            </div>
          </div>

          <button
            onClick={() => setShowAccessModal(true)}
            className="group inline-flex items-center gap-3 px-10 py-4 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg transition-all duration-150 hover:scale-105 hover:shadow-[0_0_35px_rgba(225,70,62,0.4)] text-base tracking-wide mb-6 focus:outline-none focus:ring-2 focus:ring-[#E1463E] focus:ring-offset-2 focus:ring-offset-[#0A0A0A]"
            aria-label="Join early access to Nucigen Labs"
          >
            Join Early Access
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-xs text-slate-600 font-light">
            Early users shape the future of the platform.
          </p>
        </div>
      </section>

      <LiveNewsFeed />

      <div className="section-light">
      <FourLevels />
      </div>

      <PerformanceMetrics />

      <AdvancedFeatures />

      <Integrations />

      <AIArchitecture />

      <div className="section-light">
      <WhoThisIsFor />
      </div>

      <section className="relative px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light mb-12">
              What Nucigen Labs is NOT
            </h2>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-10 mb-10">
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Not a signal group',
                'Not a trading bot',
                'Not a sentiment-based hype tool',
                'Not a get-rich-quick platform'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <XCircle size={20} className="text-[#E1463E]/70 flex-shrink-0" />
                  <p className="text-base text-slate-400 font-light">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-10">
            <div className="text-center">
              <p className="text-sm text-slate-500 font-light mb-3">WHAT NUCIGEN LABS IS</p>
              <p className="text-xl font-light">
                A strategic information-to-decision platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="section-light">
      <WaitingListSection />
      </div>

      <Mission />

      <Footer />

      <AccessRequestModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        onSuccess={() => {}}
        onError={() => {}}
        sourcePage="home"
      />
    </main>
  );
}
