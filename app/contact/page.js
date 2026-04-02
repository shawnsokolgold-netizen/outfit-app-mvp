import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Contact - BuildMyOutfit",
  description:
    "Get in touch with the BuildMyOutfit team for support, feedback, or partnership inquiries.",
};

export default function ContactPage() {
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
            Contact
          </p>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-5">
            Get in touch
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
            If you have any questions, feedback, or suggestions, feel free to reach out. We are always working to improve BuildMyOutfit and make it more useful.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-5 py-16 sm:py-20">

        {/* Email */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 mb-4">
            Email us
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            The best way to reach us is by email. We respond to all inquiries
            within 24–48 hours.
          </p>

          <div className="bg-gray-50 rounded-2xl p-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Support
            </p>
            <a
              href="mailto:support@buildmyoutfit.com"
              className="text-lg font-bold text-gray-900 hover:text-gray-600 transition-colors"
            >
              support@buildmyoutfit.com
            </a>
          </div>
        </section>

        {/* What to send */}
        <section className="border-t border-gray-100 pt-12">
          <h2 className="text-2xl font-black text-gray-900 mb-6">
            What we can help with
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Support</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Questions about how the app works, broken links, or product
                issues. We'll get back to you within 24–48 hours.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Feedback</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                We're always improving. If something isn't working as expected
                or you have a product or feature suggestion, we'd genuinely like
                to hear it.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                Partnerships
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Interested in collaborating, co-marketing, or listing your
                brand? Email us with a brief description and we'll follow up.
              </p>
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
