import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";

export const metadata = {
  title: "About - BuildMyOutfit",
  description:
    "BuildMyOutfit is an AI-powered outfit builder that helps everyday shoppers discover coordinated looks from real retailers.",
};

export default function AboutPage() {
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
            About Us
          </p>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-5">
            About BuildMyOutfit
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
            An AI-powered outfit builder that turns any photo into a complete,
            shoppable look from real products at real retailers.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-5 py-16 sm:py-20">

        {/* What it is */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-gray-900 mb-5">What is BuildMyOutfit?</h2>
          <p className="text-gray-600 leading-relaxed text-lg mb-4">
            BuildMyOutfit helps you create outfits based on colors.
          </p>
          <p className="text-gray-600 leading-relaxed text-lg">
            Upload a photo or choose colors, and the app suggests matching items using real products from online retailers. The goal is to make it easy to discover outfits that look good together without overthinking it.
          </p>
        </section>

        {/* Problem */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-gray-900 mb-5">The problem we solve</h2>
          <p className="text-gray-600 leading-relaxed text-lg mb-4">
            Most shoppers know what they like when they see it, but turning that
            into a complete outfit means juggling colors, categories, and a dozen
            different websites. It takes time most people don't have.
          </p>
          <p className="text-gray-600 leading-relaxed text-lg">
            BuildMyOutfit closes that gap. Instead of starting from scratch, you
            start from something you already love and let the tool do the
            color-matching work for you.
          </p>
        </section>

        {/* How it works */}
        <section className="mb-16 bg-gray-50 rounded-2xl p-8 sm:p-10">
          <h2 className="text-2xl font-black text-gray-900 mb-8">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload any photo",
                desc: "A shoe, a shirt, a photo you love, or anything with colors you want to build an outfit around.",
              },
              {
                step: "02",
                title: "AI detects the colors",
                desc: "We analyze the dominant colors in your photo and map them to real product color families.",
              },
              {
                step: "03",
                title: "Shop matching products",
                desc: "We surface coordinated tops, bottoms, shoes, and accessories from multiple retailers, ready to browse and buy.",
              },
            ].map((item) => (
              <div key={item.step}>
                <span className="text-5xl font-black text-gray-300 leading-none block mb-3">
                  {item.step}
                </span>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How we make money */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-gray-900 mb-5">
            How we make money
          </h2>
          <p className="text-gray-600 leading-relaxed text-lg mb-4">
            BuildMyOutfit is free to use. We earn a small commission when you
            click through to a retailer and make a purchase, at no extra cost
            to you. This is a standard affiliate arrangement, and it's how we
            keep the platform running and the product catalog growing.
          </p>
          <p className="text-gray-600 leading-relaxed text-lg mb-4">
            We partner with multiple retailers so our recommendations aren't
            locked to a single store. Our goal is to surface the best match for
            your colors, not to favor any particular brand or merchant.
          </p>
          <p className="text-gray-600 leading-relaxed text-lg">
            All affiliate relationships are disclosed in our{" "}
            <Link href="/affiliate-disclosure" className="underline text-gray-900 hover:text-gray-600">
              Affiliate Disclosure
            </Link>
            .
          </p>
        </section>

        {/* Trust statement */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-gray-900 mb-5">
            Our commitment to you
          </h2>
          <p className="text-gray-600 leading-relaxed text-lg mb-4">
            Product recommendations on BuildMyOutfit are driven by color
            coordination logic, not paid placements or sponsorships. We
            recommend items because they work well together, period.
          </p>
          <p className="text-gray-600 leading-relaxed text-lg">
            We maintain our catalog actively. When products go out of stock or
            are discontinued, we replace them. We take the trust you place in
            our recommendations seriously, and we aim to earn it with every
            outfit we build.
          </p>
        </section>

        {/* CTA */}
        <section className="bg-black text-white rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">
            Ready to build your outfit?
          </h2>
          <p className="text-gray-400 mb-7 leading-relaxed">
            Upload a photo and let the AI handle the color matching.
          </p>
          <Link
            href="/#builder"
            className="inline-block bg-white text-black font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-colors"
          >
            Try It Free →
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
