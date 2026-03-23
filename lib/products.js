// ============================================================
//  lib/products.js  —  MVP Product Catalog
//  Colors used: black, white, gray, teal, purple, yellow, denim
//
//  Outfit matching logic:
//    - top:    matches 1–2 selected shoe colors
//    - bottom: neutral OR matches an accent color
//    - hat:    matches accent color OR neutral
//
//  Image paths assume Next.js /public folder.
//  Swap image URLs for real product photos when ready for launch.
// ============================================================

export const products = [

  // ── TOPS ────────────────────────────────────────────────────

  {
    id: 1,
    name: "Black Tee",
    category: "top",
    image: "/products/tops/black-tee.jpg",
    price: 25,
    colors: ["black"],
    tags: ["neutral", "essential"],
  },
  {
    id: 2,
    name: "White Tee",
    category: "top",
    image: "/products/tops/white-tee.jpg",
    price: 25,
    colors: ["white"],
    tags: ["neutral", "essential"],
  },
  {
    id: 3,
    name: "Teal Hoodie",
    category: "top",
    image: "/products/tops/teal-hoodie.jpg",
    price: 55,
    colors: ["teal"],
    tags: ["accent"],
  },
  {
    id: 4,
    name: "Purple Hoodie",
    category: "top",
    image: "/products/tops/purple-hoodie.jpg",
    price: 55,
    colors: ["purple"],
    tags: ["accent"],
  },
  {
    id: 5,
    name: "Yellow Tee",
    category: "top",
    image: "/products/tops/yellow-tee.jpg",
    price: 30,
    colors: ["yellow"],
    tags: ["accent"],
  },
  {
    id: 6,
    name: "Denim Jacket",
    category: "top",
    image: "/products/tops/denim-jacket.jpg",
    price: 80,
    colors: ["denim", "blue"],
    tags: ["neutral"],
  },
  {
    id: 7,
    name: "Gray Crewneck",
    category: "top",
    image: "/products/tops/gray-crewneck.jpg",
    price: 45,
    colors: ["gray"],
    tags: ["neutral"],
  },

  // ── BOTTOMS ─────────────────────────────────────────────────

  {
    id: 8,
    name: "Black Joggers",
    category: "bottom",
    image: "/products/bottoms/black-joggers.jpg",
    price: 45,
    colors: ["black"],
    tags: ["neutral", "essential"],
  },
  {
    id: 9,
    name: "Dark Denim Jeans",
    category: "bottom",
    image: "/products/bottoms/dark-denim-jeans.jpg",
    price: 65,
    colors: ["denim", "blue"],
    tags: ["neutral"],
  },
  {
    id: 10,
    name: "Light Denim Jeans",
    category: "bottom",
    image: "/products/bottoms/light-denim-jeans.jpg",
    price: 60,
    colors: ["denim", "blue", "white"],
    tags: ["neutral"],
  },
  {
    id: 11,
    name: "Gray Sweatpants",
    category: "bottom",
    image: "/products/bottoms/gray-sweatpants.jpg",
    price: 40,
    colors: ["gray"],
    tags: ["neutral"],
  },
  {
    id: 12,
    name: "White Shorts",
    category: "bottom",
    image: "/products/bottoms/white-shorts.jpg",
    price: 35,
    colors: ["white"],
    tags: ["neutral"],
  },
  {
    id: 13,
    name: "Teal Shorts",
    category: "bottom",
    image: "/products/bottoms/teal-shorts.jpg",
    price: 38,
    colors: ["teal"],
    tags: ["accent"],
  },

  // ── HATS ────────────────────────────────────────────────────

  {
    id: 14,
    name: "Black Cap",
    category: "hat",
    image: "/products/hats/black-cap.jpg",
    price: 28,
    colors: ["black"],
    tags: ["neutral", "essential"],
  },
  {
    id: 15,
    name: "White Cap",
    category: "hat",
    image: "/products/hats/white-cap.jpg",
    price: 28,
    colors: ["white"],
    tags: ["neutral"],
  },
  {
    id: 16,
    name: "Teal Cap",
    category: "hat",
    image: "/products/hats/teal-cap.jpg",
    price: 32,
    colors: ["teal"],
    tags: ["accent"],
  },
  {
    id: 17,
    name: "Purple Hat",
    category: "hat",
    image: "/products/hats/purple-hat.jpg",
    price: 28,
    colors: ["purple"],
    tags: ["accent"],
  },
  {
    id: 18,
    name: "Yellow Cap",
    category: "hat",
    image: "/products/hats/yellow-cap.jpg",
    price: 24,
    colors: ["yellow"],
    tags: ["accent"],
  },
  {
    id: 19,
    name: "Denim Hat",
    category: "hat",
    image: "/products/hats/denim-hat.jpg",
    price: 30,
    colors: ["denim", "blue"],
    tags: ["neutral"],
  },
];


// ============================================================
//  OUTFIT MATCHING ENGINE
//  Pass in an array of detected shoe colors (e.g. ["teal","purple","yellow"])
//  Returns { top, bottom, hat } — one product each
// ============================================================

const NEUTRALS = ["black", "white", "gray", "denim"];
const ACCENTS  = ["teal", "purple", "yellow"];

/**
 * Returns true if a product shares at least one color with the target list.
 */
function matchesAny(product, colorList) {
  return product.colors.some((c) => colorList.includes(c));
}

/**
 * Pick one product from a filtered list, ranked by color priority.
 * Prefers items that match more shoe colors.
 */
function pickBest(candidates, shoeColors) {
  if (!candidates.length) return null;
  const ranked = [...candidates].sort((a, b) => {
    const scoreA = a.colors.filter((c) => shoeColors.includes(c)).length;
    const scoreB = b.colors.filter((c) => shoeColors.includes(c)).length;
    return scoreB - scoreA;
  });
  return ranked[0];
}

/**
 * Main function: given shoe colors, return a matched outfit.
 *
 * @param {string[]} shoeColors   - e.g. ["teal", "purple", "yellow"]
 * @param {object}   options
 * @param {boolean}  options.includeHat  - default true
 * @returns {{ top: object|null, bottom: object|null, hat: object|null }}
 */
export function buildOutfit(shoeColors = [], { includeHat = true } = {}) {
  const accentMatches  = shoeColors.filter((c) => ACCENTS.includes(c));
  const neutralMatches = shoeColors.filter((c) => NEUTRALS.includes(c));
  const allMatches     = [...new Set([...accentMatches, ...neutralMatches])];

  const tops    = products.filter((p) => p.category === "top");
  const bottoms = products.filter((p) => p.category === "bottom");
  const hats    = products.filter((p) => p.category === "hat");

  // TOP: match 1–2 shoe accent colors first, fall back to neutral
  const topCandidates =
    tops.filter((p) => matchesAny(p, accentMatches)).length > 0
      ? tops.filter((p) => matchesAny(p, accentMatches))
      : tops.filter((p) => matchesAny(p, allMatches));

  // BOTTOM: prefer neutral; allow accent if no neutral found
  const bottomNeutrals = bottoms.filter((p) => p.tags.includes("neutral"));
  const bottomCandidates = bottomNeutrals.length > 0 ? bottomNeutrals : bottoms;

  // HAT: prefer accent match; fall back to neutral
  const hatAccents = hats.filter((p) => matchesAny(p, accentMatches));
  const hatCandidates = hatAccents.length > 0
    ? hatAccents
    : hats.filter((p) => p.tags.includes("neutral"));

  return {
    top:    pickBest(topCandidates,    shoeColors),
    bottom: pickBest(bottomCandidates, shoeColors),
    hat:    includeHat ? pickBest(hatCandidates, shoeColors) : null,
  };
}


// ============================================================
//  REAL IMAGE SOURCES — swap in when going to production
//
//  Free / licensed options:
//    • Unsplash API  — https://unsplash.com/developers
//    • Pexels API    — https://www.pexels.com/api/
//    • Amazon PA API — affiliate product images
//    • ASOS API      — retailer feed (apply for access)
//
//  Example Unsplash direct URLs (no API key needed for single images):
//    Black tee:   https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400
//    White tee:   https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400
//    Denim jeans: https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400
//    Black cap:   https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400
// ============================================================
