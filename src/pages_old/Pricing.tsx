import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PricingPreview from '../components/PricingPreview';

export default function Pricing() {
  return (
    <main className="min-h-screen">
      <SEO
        title="Pricing — Nucigen Labs"
        description="Professional-grade market intelligence — no longer reserved for institutions."
      />

      <section className="relative px-6 py-32">
        <PricingPreview />
      </section>

      <Footer />
    </main>
  );
}
