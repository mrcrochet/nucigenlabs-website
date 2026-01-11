import Footer from '../components/Footer';
import SEO from '../components/SEO';

export default function Privacy() {
  return (
    <main className="min-h-screen">
      <SEO
        title="Privacy Policy — Nucigen Labs"
        description="Privacy Policy for Nucigen Labs. Learn how we collect, use, and protect your personal information."
        keywords="privacy policy, data protection, personal information, GDPR, privacy rights"
      />

      <section className="relative px-4 sm:px-6 py-20 sm:py-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-400 font-light">
              Last Updated: January 2025
            </p>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-base text-slate-300 font-light leading-relaxed mb-8">
              At Nucigen Labs, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>

            <div className="space-y-12">
              {/* Section 1 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">1. Introduction</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">
                    This Privacy Policy describes how Nucigen Labs ("we," "our," or "us") collects, uses, and shares information about you when you use our website, services, and platform.
                  </p>
                  <p className="text-base">
                    By using our services, you agree to the collection and use of information in accordance with this policy.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">2. Information We Collect</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">
                    <strong className="text-white">2.1 Account Information</strong>
                  </p>
                  <p className="text-base ml-4">
                    When you create an account, we collect information such as your name, email address, company name, and role.
                  </p>

                  <p className="text-base">
                    <strong className="text-white">2.2 Usage Information</strong>
                  </p>
                  <p className="text-base ml-4">
                    We collect information about how you interact with our platform, including pages visited, features used, and time spent on the platform.
                  </p>

                  <p className="text-base">
                    <strong className="text-white">2.3 Payment Information</strong>
                  </p>
                  <p className="text-base ml-4">
                    Payment processing is handled by secure third-party providers. We do not store your full payment card details on our servers.
                  </p>

                  <p className="text-base">
                    <strong className="text-white">2.4 Communications</strong>
                  </p>
                  <p className="text-base ml-4">
                    We collect information from your communications with us, including support requests and feedback.
                  </p>
                </div>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">3. How We Use Your Information</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">We use the information we collect to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Provide, maintain, and improve our services</li>
                    <li>Process transactions and manage subscriptions</li>
                    <li>Send you updates, alerts, and important information</li>
                    <li>Respond to your inquiries and provide customer support</li>
                    <li>Personalize your experience and deliver relevant content</li>
                    <li>Detect, prevent, and address technical issues and security threats</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </div>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">4. Sharing of Data</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">
                    <strong className="text-white">4.1</strong> Nucigen Labs does not sell personal data to third parties.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">4.2</strong> We may share your information with:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Service providers who assist in operating our platform (e.g., payment processors, hosting providers)</li>
                    <li>Legal authorities when required by law or to protect our rights</li>
                    <li>Business partners with your explicit consent</li>
                  </ul>
                  <p className="text-base">
                    <strong className="text-white">4.3</strong> All third-party service providers are contractually obligated to protect your information.
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">5. Data Retention</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">
                    <strong className="text-white">5.1</strong> We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">5.2</strong> When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal or regulatory purposes.
                  </p>
                </div>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">6. Security</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">
                    <strong className="text-white">6.1</strong> We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">6.2</strong> We use industry-standard encryption, secure authentication, and regular security audits.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">6.3</strong> However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">7. Your Rights</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">Depending on your location, you may have the following rights:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li><strong className="text-white">Access:</strong> Request a copy of your personal information</li>
                    <li><strong className="text-white">Correction:</strong> Request correction of inaccurate information</li>
                    <li><strong className="text-white">Deletion:</strong> Request deletion of your personal information</li>
                    <li><strong className="text-white">Portability:</strong> Request transfer of your data to another service</li>
                    <li><strong className="text-white">Objection:</strong> Object to certain processing activities</li>
                    <li><strong className="text-white">Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
                  </ul>
                  <p className="text-base">
                    To exercise these rights, please contact us at{' '}
                    <a href="mailto:privacy@nucigenlabs.com" className="text-[#E1463E] hover:text-[#E1463E]/80 transition-colors">
                      privacy@nucigenlabs.com
                    </a>
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-2xl font-light text-white mb-4">8. Updates to This Policy</h2>
                <div className="space-y-4 text-slate-300 font-light leading-relaxed">
                  <p className="text-base">
                    <strong className="text-white">8.1</strong> We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">8.2</strong> We will notify you of significant changes by email or through our platform.
                  </p>
                  <p className="text-base">
                    <strong className="text-white">8.3</strong> The latest version will always be available on this page with an updated "Last Updated" date.
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

