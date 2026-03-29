import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Privacy Policy — BuildMyOutfit",
  description:
    "Privacy Policy for BuildMyOutfit.com — how we handle image uploads, analytics, cookies, and affiliate links.",
};

const LAST_UPDATED = "March 2025";

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-5 py-16 sm:py-20">
        <div className="prose-style space-y-12">

          <section>
            <p className="text-gray-600 leading-relaxed text-lg">
              BuildMyOutfit.com ("we," "us," or "our") is committed to protecting
              your privacy. This Privacy Policy explains what information we
              collect, how we use it, and your rights regarding that information
              when you use our website and outfit-building tool.
            </p>
          </section>

          <Section title="1. Information we collect">
            <Subsection title="Image uploads">
              <p>
                When you upload a photo to BuildMyOutfit, that image is processed
                entirely within your browser using the HTML5 Canvas API. Your
                image is <strong>never sent to our servers</strong>, stored in
                any database, or shared with third parties. The color-detection
                process happens locally on your device and the image data is
                discarded when you leave or refresh the page.
              </p>
            </Subsection>

            <Subsection title="Analytics and cookies">
              <p>
                We may use third-party analytics services (such as Google
                Analytics) to collect anonymized data about how visitors use our
                site. This includes information such as pages visited, time on
                site, browser type, and general geographic region. This data is
                aggregated and does not identify you personally.
              </p>
              <p className="mt-3">
                Cookies may be set by these analytics services to track sessions
                over time. You can disable cookies in your browser settings at
                any time, though this may affect site functionality.
              </p>
            </Subsection>

            <Subsection title="Affiliate link clicks">
              <p>
                When you click a product link on our site, you may be redirected
                to a third-party retailer (such as Amazon). These retailers have
                their own privacy policies and may set their own cookies. We
                receive aggregated, anonymized commission data from purchases
                made through our affiliate links but do not receive any personal
                information about you from these transactions.
              </p>
            </Subsection>

            <Subsection title="Contact inquiries">
              <p>
                If you contact us via email, we retain your email address and
                message only for the purpose of responding to your inquiry. We do
                not add you to any mailing list without your explicit consent.
              </p>
            </Subsection>
          </Section>

          <Section title="2. How we use information">
            <p className="text-gray-600 leading-relaxed">
              We use the limited information we collect to:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600 list-disc pl-5 leading-relaxed">
              <li>Operate and improve the outfit-building tool</li>
              <li>Understand how visitors use the site (via analytics)</li>
              <li>Respond to support inquiries</li>
              <li>Monitor and improve site performance and stability</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              We do not sell, rent, or share your personal information with any
              third parties for marketing purposes.
            </p>
          </Section>

          <Section title="3. Third-party services and links">
            <p className="text-gray-600 leading-relaxed">
              Our site contains links to third-party retailer websites (including
              Amazon.com). Once you leave BuildMyOutfit.com, the privacy practices
              of the destination site apply. We are not responsible for the
              content or privacy practices of third-party sites.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              We participate in the Amazon Services LLC Associates Program. Amazon
              may use cookies and tracking to associate your purchases with our
              affiliate tag. Please review{" "}
              <a
                href="https://www.amazon.com/gp/help/customer/display.html?nodeId=468496"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 underline hover:text-gray-600"
              >
                Amazon's Privacy Notice
              </a>{" "}
              for details.
            </p>
          </Section>

          <Section title="4. Data retention">
            <p className="text-gray-600 leading-relaxed">
              We do not store any uploaded images. Analytics data is retained
              in accordance with our analytics provider's standard retention
              policies (typically 26 months for Google Analytics). Contact
              inquiry emails are retained only as long as necessary to resolve
              the inquiry.
            </p>
          </Section>

          <Section title="5. Children's privacy">
            <p className="text-gray-600 leading-relaxed">
              BuildMyOutfit.com is not directed to children under 13 years of age.
              We do not knowingly collect personal information from children. If
              you believe we have inadvertently collected information from a child,
              please contact us and we will promptly delete it.
            </p>
          </Section>

          <Section title="6. Your rights">
            <p className="text-gray-600 leading-relaxed">
              Depending on your location, you may have rights regarding your
              personal data, including the right to access, correct, or delete
              information we hold about you. Since we collect minimal personal
              data, most requests can be fulfilled simply by contacting us at{" "}
              <a
                href="mailto:support@buildmyoutfit.com"
                className="text-gray-900 underline hover:text-gray-600"
              >
                support@buildmyoutfit.com
              </a>
              .
            </p>
          </Section>

          <Section title="7. Changes to this policy">
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. When we do,
              we will update the "Last updated" date at the top of this page.
              Continued use of the site after changes are posted constitutes
              acceptance of the updated policy.
            </p>
          </Section>

          <Section title="8. Contact">
            <p className="text-gray-600 leading-relaxed">
              If you have questions or concerns about this Privacy Policy, please
              contact us at{" "}
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

function Subsection({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-bold text-gray-800 mb-2">{title}</h3>
      <div className="text-gray-600 leading-relaxed">{children}</div>
    </div>
  );
}
