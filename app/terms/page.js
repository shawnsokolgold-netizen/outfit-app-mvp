import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Terms of Use — BuildMyOutfit",
  description:
    "Terms of Use for BuildMyOutfit.com — governing your use of the outfit-building tool, affiliate links, and AI-generated recommendations.",
};

const LAST_UPDATED = "March 2025";

export default function TermsPage() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <SiteNav />

      {/* Page Header */}
      <section className="bg-black text-white py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-5">
          <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-4">
            Legal
          </p>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-5">
            Terms of Use
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-5 py-16 sm:py-20">
        <div className="space-y-12">

          <section>
            <p className="text-gray-600 leading-relaxed text-lg">
              Please read these Terms of Use ("Terms") carefully before using
              BuildMyOutfit.com ("the Site"). By accessing or using the Site, you
              agree to be bound by these Terms. If you do not agree, please do
              not use the Site.
            </p>
          </section>

          <Section title="1. Use of the site">
            <p className="text-gray-600 leading-relaxed">
              BuildMyOutfit.com provides a free, browser-based outfit-building
              tool for personal, non-commercial use. You may use the Site to
              upload photos, detect colors, and browse product recommendations.
              You agree not to use the Site for any unlawful purpose or in any
              way that could damage, disable, or impair the Site.
            </p>
          </Section>

          <Section title="2. AI-generated recommendations">
            <p className="text-gray-600 leading-relaxed mb-3">
              Product recommendations on BuildMyOutfit are generated
              algorithmically based on color matching logic. These recommendations
              are provided for informational and inspirational purposes only.
            </p>
            <p className="text-gray-600 leading-relaxed mb-3">
              <strong className="text-gray-800">
                We make no warranty or guarantee regarding the accuracy,
                suitability, or completeness of any AI-generated outfit
                recommendation.
              </strong>{" "}
              Color matching is approximate and may vary based on your device's
              display settings, photo quality, and lighting conditions.
            </p>
            <p className="text-gray-600 leading-relaxed">
              You acknowledge that outfit recommendations are subjective and that
              actual fit, style, and personal preference are your own
              responsibility.
            </p>
          </Section>

          <Section title="3. Product availability and pricing">
            <p className="text-gray-600 leading-relaxed mb-3">
              Product listings on BuildMyOutfit reflect information available at
              the time of publication. We do not guarantee the availability,
              accuracy, or current pricing of any product shown on this Site.
            </p>
            <p className="text-gray-600 leading-relaxed mb-3">
              <strong className="text-gray-800">
                Prices and availability are subject to change at any time without
                notice
              </strong>
              , and are determined solely by the third-party retailers (such as
              Amazon). BuildMyOutfit is not responsible for any discrepancies
              between the prices shown on this Site and the prices shown at the
              point of purchase.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Always confirm current pricing, availability, and product details
              on the retailer's website before completing a purchase.
            </p>
          </Section>

          <Section title="4. Third-party retailer sites">
            <p className="text-gray-600 leading-relaxed mb-3">
              BuildMyOutfit contains affiliate links that direct you to
              third-party retailer websites. When you click these links and visit
              a third-party site, you are subject to that site's own terms of
              use, privacy policy, return policies, and any other policies.
            </p>
            <p className="text-gray-600 leading-relaxed mb-3">
              <strong className="text-gray-800">
                BuildMyOutfit is not a party to any transaction you complete on a
                third-party retailer's site.
              </strong>{" "}
              We are not responsible for any loss, damage, or dispute arising
              from your use of third-party sites, including issues related to
              product quality, shipping, returns, or customer service.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Any disputes related to a product purchase should be directed to
              the retailer from whom you purchased the item.
            </p>
          </Section>

          <Section title="5. Affiliate relationships">
            <p className="text-gray-600 leading-relaxed">
              BuildMyOutfit participates in affiliate advertising programs,
              including the Amazon Services LLC Associates Program. We may earn a
              commission when you purchase a product through one of our links.
              This does not increase your cost. See our{" "}
              <a
                href="/affiliate-disclosure"
                className="text-gray-900 underline hover:text-gray-600"
              >
                Affiliate Disclosure
              </a>{" "}
              for full details.
            </p>
          </Section>

          <Section title="6. Intellectual property">
            <p className="text-gray-600 leading-relaxed">
              All content on BuildMyOutfit.com, including text, design, code, and
              branding, is owned by or licensed to BuildMyOutfit. Product images
              and names are the property of their respective brands and are used
              for editorial reference. You may not reproduce, distribute, or
              republish any content from this Site without prior written
              permission.
            </p>
          </Section>

          <Section title="7. Disclaimer of warranties">
            <p className="text-gray-600 leading-relaxed mb-3">
              The Site and its content are provided "as is" and "as available"
              without warranties of any kind, either express or implied. We do
              not warrant that the Site will be uninterrupted, error-free, or
              free of viruses or other harmful components.
            </p>
            <p className="text-gray-600 leading-relaxed">
              To the fullest extent permitted by law, BuildMyOutfit disclaims all
              warranties, including implied warranties of merchantability, fitness
              for a particular purpose, and non-infringement.
            </p>
          </Section>

          <Section title="8. Limitation of liability">
            <p className="text-gray-600 leading-relaxed">
              To the maximum extent permitted by applicable law, BuildMyOutfit
              shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages arising from your use of the
              Site, its content, or any third-party products or services
              accessed through the Site.
            </p>
          </Section>

          <Section title="9. Changes to these terms">
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to update these Terms at any time. Changes
              will be reflected by an updated "Last updated" date at the top of
              this page. Continued use of the Site after changes are posted
              constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="10. Contact">
            <p className="text-gray-600 leading-relaxed">
              If you have questions about these Terms, please contact us at{" "}
              <a
                href="mailto:support@buildmyoutfit.com"
                className="text-gray-900 underline hover:text-gray-600"
              >
                support@buildmyoutfit.com
              </a>
              .
            </p>
          </Section>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-xl font-black text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}
