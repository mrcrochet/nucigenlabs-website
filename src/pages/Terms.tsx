import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <main className="min-h-screen">
      <SEO
        title="Terms and Conditions — Nucigen Labs"
        description="Terms and Conditions for Nucigen Labs. Read our terms of service, user agreements, and legal policies."
        keywords="terms and conditions, terms of service, user agreement, legal policy"
      />

      <section className="relative px-4 sm:px-6 py-20 sm:py-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light text-white mb-4">
              Terms and Conditions
            </h1>
            <p className="text-sm text-slate-400 font-light">
              Last Updated: January 2025
            </p>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-base text-slate-300 font-light leading-relaxed mb-8">
              By accessing or using the Nucigen Labs website and services, you agree to be bound by these Terms and Conditions. Please read them carefully before using our platform.
            </p>

            <div className="space-y-12">
              {/* Section 1 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">1. Acceptance of Terms</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">
                    <strong className="text-white">1.1</strong> These Terms and Conditions ("Terms") apply to all users of the Nucigen Labs platform, including visitors, registered users, and subscribers.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">1.2</strong> By accessing or using our services, you agree to be bound by these Terms, our Privacy Policy, and our Cookie Policy.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">1.3</strong> If you do not agree to these Terms, you must not use our services.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">2. Use of the Platform</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">
                    <strong className="text-white">2.1</strong> Nucigen Labs provides a strategic intelligence platform that transforms global news into predictive market signals through causal analysis.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">2.2</strong> You agree to use our platform only for lawful purposes and in accordance with these Terms.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">2.3</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">2.4</strong> You agree not to use our services to:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe upon the rights of others</li>
                    <li>Transmit any harmful or malicious code</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Interfere with or disrupt our services</li>
                  </ul>
                </div>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">3. Accounts and Access</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">
                    <strong className="text-white">3.1</strong> To access certain features, you must create an account and provide accurate, current, and complete information.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">3.2</strong> You are responsible for maintaining the security of your account and password.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">3.3</strong> You must notify us immediately of any unauthorized use of your account.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">3.4</strong> We reserve the right to suspend or terminate accounts that violate these Terms.
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">4. Intellectual Property</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">
                    <strong className="text-white">4.1</strong> All content, designs, materials, and intellectual property on the Nucigen Labs platform are the property of Nucigen Labs or its licensors.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">4.2</strong> You may not copy, reproduce, distribute, or create derivative works from our content without explicit written permission.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">4.3</strong> The Nucigen Labs name, logo, and trademarks are protected intellectual property.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">5. Payments and Billing</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">
                    <strong className="text-white">5.1</strong> Subscription fees are billed in advance on a monthly or annual basis, as selected during registration.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">5.2</strong> Payments are processed securely by third-party payment providers. We do not store your full payment card details.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">5.3</strong> By subscribing, you authorize us to charge your payment method for the subscription fee.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">5.4</strong> All sales are final unless otherwise stated. Refunds are handled on a case-by-case basis.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">5.5</strong> You may cancel your subscription at any time, and access will continue until the end of your billing period.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">6. Limitation of Liability</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">
                    <strong className="text-white">6.1</strong> Nucigen Labs is provided "as is" and "as available" without warranties of any kind, either express or implied.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">6.2</strong> We do not guarantee that our services will be uninterrupted, secure, or error-free.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">6.3</strong> Our intelligence signals are for informational purposes only and do not constitute financial, investment, or trading advice.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">6.4</strong> To the maximum extent permitted by law, Nucigen Labs shall not be liable for any indirect, incidental, special, or consequential damages.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">7. Termination</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">
                    <strong className="text-white">7.1</strong> We reserve the right to suspend or terminate your access to our services at any time, with or without notice, for violations of these Terms.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">7.2</strong> You may stop using our services at any time by canceling your subscription.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">7.3</strong> Upon termination, your right to use the services will immediately cease.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">8. Changes to These Terms</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">
                    <strong className="text-white">8.1</strong> We may update these Terms from time to time to reflect changes in our services or legal requirements.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">8.2</strong> The latest version of these Terms will always be available on this page.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">8.3</strong> Continued use of our services after changes constitutes acceptance of the updated Terms.
                  </p>
                </div>
              </section>

              {/* Section 9 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">9. Contact</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">
                    If you have any questions about these Terms and Conditions, please contact us at:
                  </p>
                  <p className="text-base">
                    <a href="mailto:support@nucigenlabs.com" className="text-[#E1463E] hover:text-[#E1463E]/80 transition-colors">
                      support@nucigenlabs.com
                    </a>
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

