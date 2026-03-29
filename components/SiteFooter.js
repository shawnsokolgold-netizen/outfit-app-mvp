import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer
      className="bg-black text-white"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-5 py-16">
        <div className="grid sm:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="inline-block text-xl font-black mb-3 hover:opacity-80 transition-opacity"
            >
              BuildMyOutfit
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              AI-powered outfit builder that matches your colors to curated
              products from top brands.
            </p>
          </div>

          {/* Explore */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
              Explore
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/#how-it-works"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/#featured"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Featured Products
                </Link>
              </li>
              <li>
                <Link
                  href="/#builder"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Outfit Builder
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
              Legal
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link
                  href="/affiliate-disclosure"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Affiliate Disclosure
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed max-w-3xl">
            <span className="text-gray-400 font-semibold">
              Affiliate Disclosure:{" "}
            </span>
            BuildMyOutfit.com is a participant in the Amazon Services LLC
            Associates Program, an affiliate advertising program designed to
            provide a means for sites to earn advertising fees by advertising
            and linking to Amazon.com. As an Amazon Associate, we earn from
            qualifying purchases.
          </p>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} BuildMyOutfit.com · All product prices
            and availability are subject to change.
          </p>
        </div>
      </div>
    </footer>
  );
}
