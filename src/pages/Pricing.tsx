import Footer from '../components/Footer';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import PricingPreview from '../components/PricingPreview';

export default function Pricing() {
  return (
    <main className="min-h-screen">
      <SEO
        title="Pricing — Nucigen Labs"
        description="Transparent pricing for strategic market intelligence. $59/month for early access. Professional-grade intelligence accessible to everyone. No hidden costs, no setup fees."
        keywords="nucigen labs pricing, market intelligence pricing, strategic intelligence cost, predictive analytics pricing, early access pricing"
      />
      <StructuredData 
        type="Product"
        data={{
          name: 'Nucigen Labs Intelligence',
          description: 'Real-time market intelligence platform that predicts market movements before they happen through causal analysis of geopolitical and industrial events.',
          offers: {
            '@type': 'Offer',
            price: '59',
            priceCurrency: 'USD',
            priceValidUntil: '2026-12-31',
            availability: 'https://schema.org/PreOrder',
            url: 'https://nucigenlabs.com/pricing'
          }
        }}
      />

      <section className="relative px-6 py-32">
        <PricingPreview />
      </section>

      <Footer />
    </main>
  );
}
