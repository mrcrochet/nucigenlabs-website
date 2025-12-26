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

export default function Home() {
  const [showAccessModal, setShowAccessModal] = useState(false);

  return (
    <main className="min-h-screen">
      <SEO />

      <section className="relative min-h-screen flex items-center justify-center px-section-h py-section-v-lg">
        <div className="max-w-5xl mx-auto w-full text-left">
          <div className="inline-block tag-badge mb-12">
            <p className="text-xs text-nucigen-red font-normal tracking-[0.15em] uppercase">PREDICTIVE NEWS ANALYSIS</p>
          </div>

          <h1 className="mb-12 leading-[1.1] text-nucigen-text-primary">
            We scan the news.<br />We predict the market.<br />
            <span className="text-nucigen-red">Before it moves.</span>
          </h1>

          <p className="text-lg text-nucigen-text-secondary leading-relaxed mb-8 max-w-3xl">
            Nucigen Labs transforms global news into predictive market signals in real-time.
          </p>

          <p className="text-base text-nucigen-text-tertiary leading-relaxed mb-16 max-w-2xl">
            When a factory closes in Taiwan or a sanction hits Russia, we detect it instantly and predict which assets will move — hours or days before the market reacts.
          </p>

          <div className="mb-16">
            <div className="inline-block card-infrastructure px-8 py-6">
              <div className="text-xs text-nucigen-text-tertiary font-normal tracking-[0.2em] mb-4 uppercase">OFFICIAL LAUNCH IN</div>
              <CountdownTimer />
            </div>
          </div>

          <button
            onClick={() => setShowAccessModal(true)}
            className="btn-primary group inline-flex items-center gap-3 text-base mb-6"
            aria-label="Join early access to Nucigen Labs"
          >
            Join Early Access
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-150" />
          </button>

          <p className="text-xs text-nucigen-text-tertiary font-normal">
            Early users shape the future of the platform.
          </p>
        </div>
      </section>

      <LiveNewsFeed />

      <div className="section-light">
      <FourLevels />
      </div>

      <AdvancedFeatures />

      <div className="section-light">
      <WhoThisIsFor />
      </div>

      <section className="relative px-section-h py-section-v">
        <div className="max-w-4xl mx-auto">
          <div className="mb-20">
            <h2 className="mb-12">
              What Nucigen Labs is NOT
            </h2>
          </div>

          <div className="card-infrastructure mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              {[
                'Not a signal group',
                'Not a trading bot',
                'Not a sentiment-based hype tool',
                'Not a get-rich-quick platform'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <XCircle size={18} className="text-nucigen-red/70 flex-shrink-0" />
                  <p className="text-base text-nucigen-text-secondary font-normal">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-infrastructure">
            <div>
              <p className="text-sm text-nucigen-text-tertiary font-normal mb-4 uppercase tracking-wider">WHAT NUCIGEN LABS IS</p>
              <p className="text-xl text-nucigen-text-primary font-normal">
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
