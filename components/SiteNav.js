import Link from "next/link";

export default function SiteNav() {
  return (
    <nav
      className="sticky top-0 z-50 bg-white border-b border-gray-100"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-black tracking-tight text-gray-900 hover:opacity-80 transition-opacity"
        >
          BuildMyOutfit
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-8">
          <Link
            href="/about"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/#builder"
            className="bg-black text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            Try It Free
          </Link>
        </div>

        {/* Mobile / tablet menu */}
        <details className="relative lg:hidden">
          <summary className="list-none cursor-pointer inline-flex items-center justify-center w-10 h-10 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50">
            <span className="sr-only">Open navigation menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </summary>

          <div className="absolute right-0 top-12 w-52 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex flex-col gap-1">
            <Link
              href="/about"
              className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/#builder"
              className="mt-1 bg-black text-white text-sm font-semibold px-3 py-2 rounded-md text-center hover:bg-gray-800 transition-colors"
            >
              Try It Free
            </Link>
          </div>
        </details>
      </div>
    </nav>
  );
}
