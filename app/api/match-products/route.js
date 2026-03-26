import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

const NEUTRALS = ["black", "white", "gray", "denim"];
const ACCENTS = ["teal", "purple", "yellow"];

function matchesAny(product, colorList) {
  const productColors = Array.isArray(product.colors) ? product.colors : [];
  const normalizedColorList = colorList.map((c) => c.toLowerCase());
  return productColors.some((c) => normalizedColorList.includes(c.toLowerCase()));
}

function matchesAll(product, colorList) {
  const productColors = Array.isArray(product.colors) ? product.colors : [];
  const normalizedColorList = colorList.map((c) => c.toLowerCase());
  const normalizedProductColors = productColors.map((c) => c.toLowerCase());
  return normalizedColorList.every((c) => normalizedProductColors.includes(c));
}

function rankCandidates(candidates, anchorColors) {
  return [...candidates].sort((a, b) => {
    const colorsA = Array.isArray(a.colors) ? a.colors : [];
    const colorsB = Array.isArray(b.colors) ? b.colors : [];
    const tagsA = Array.isArray(a.tags) ? a.tags : [];
    const tagsB = Array.isArray(b.tags) ? b.tags : [];

    const scoreA = colorsA.filter((c) => anchorColors.includes(c)).length;
    const scoreB = colorsB.filter((c) => anchorColors.includes(c)).length;

    if (scoreB !== scoreA) return scoreB - scoreA;

    const neutralA = tagsA.includes("neutral") ? 1 : 0;
    const neutralB = tagsB.includes("neutral") ? 1 : 0;

    return neutralB - neutralA;
  });
}

function pickBest(candidates, anchorColors) {
  if (!candidates.length) return null;

  const ranked = [...candidates].sort((a, b) => {
    const colorsA = Array.isArray(a.colors) ? a.colors : [];
    const colorsB = Array.isArray(b.colors) ? b.colors : [];
    const tagsA = Array.isArray(a.tags) ? a.tags : [];
    const tagsB = Array.isArray(b.tags) ? b.tags : [];

    const scoreA = colorsA.filter((c) => anchorColors.includes(c)).length;
    const scoreB = colorsB.filter((c) => anchorColors.includes(c)).length;

    if (scoreB !== scoreA) return scoreB - scoreA;

    const neutralA = tagsA.includes("neutral") ? 1 : 0;
    const neutralB = tagsB.includes("neutral") ? 1 : 0;

    return neutralB - neutralA;
  });

  return ranked[0];
}

function filterByMode(items, colors, strict) {
  return strict
    ? items.filter((p) => matchesAll(p, colors))
    : items.filter((p) => matchesAny(p, colors));
}

function buildOutfit(products, anchorColors = [], { includeHat = true, includeShoe = true, strictMatch = true } = {}) {
  const accentMatches = anchorColors.filter((c) => ACCENTS.includes(c));
  const neutralMatches = anchorColors.filter((c) => NEUTRALS.includes(c));
  const allMatches = [...new Set([...accentMatches, ...neutralMatches])];

  const tops = products.filter((p) => p.category === "top");
  const bottoms = products.filter((p) => p.category === "bottom");
  const hats = products.filter((p) => p.category === "hat");
  const shoes = products.filter((p) => p.category === "shoe");

  const safeColors = allMatches.length > 0 ? allMatches : ["black", "white", "gray", "denim"];

  // Strict mode: every selected color must appear in the product; no fallback to any-match.
  const useStrictMatching = strictMatch;

  // Tops: must match all selected colors in strict mode, any in loose mode.
  const topCandidates = filterByMode(tops, anchorColors, useStrictMatching);

  const bottomNeutralCandidates = bottoms.filter((p) =>
    Array.isArray(p.tags) ? p.tags.includes("neutral") : false
  );

  // Bottoms are complementary neutrals.
  const bottomCandidates = useStrictMatching
    ? filterByMode(bottoms, anchorColors, true)
    : bottomNeutralCandidates.filter((p) => matchesAny(p, safeColors)).length > 0
    ? bottomNeutralCandidates.filter((p) => matchesAny(p, safeColors))
    : bottomNeutralCandidates.length > 0
    ? bottomNeutralCandidates
    : bottoms;

  // Hats: must match all selected colors in strict mode, any in loose mode.
  const hatCandidates = filterByMode(hats, anchorColors, useStrictMatching);

  // Shoes: must match all selected colors in strict mode, any in loose mode.
  const shoeCandidates = filterByMode(shoes, anchorColors, useStrictMatching);

  const rankedHats = includeHat ? rankCandidates(hatCandidates, safeColors) : [];

return {
  top: pickBest(topCandidates, safeColors),
  bottom: pickBest(bottomCandidates, safeColors),
  hat: rankedHats[0] || null,
  hats: rankedHats,
  shoe: includeShoe ? pickBest(shoeCandidates, safeColors) : null,
};
}

export async function POST(request) {
  try {
    console.log("match-products route hit");

    const body = await request.json();
    console.log("request body:", body);

    const anchorColors = Array.isArray(body.colors) ? body.colors : [];
    const strictMatch = body.strictMatch !== undefined ? body.strictMatch : true;
    const useStrictMatching = anchorColors.length > 1 && strictMatch;

    console.log("selectedColors:", body.colors);
    console.log("anchorColors:", anchorColors);
    console.log("useStrictMatching:", useStrictMatching);

    console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const supabase = createSupabaseServerClient();

    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allProducts = products || [];
    console.log("tops length:", allProducts.filter((p) => p.category === "top").length);
    console.log("bottoms length:", allProducts.filter((p) => p.category === "bottom").length);
    console.log("hats length:", allProducts.filter((p) => p.category === "hat").length);
    console.log("shoes length:", allProducts.filter((p) => p.category === "shoe").length);

    const result = buildOutfit(allProducts, anchorColors, { strictMatch });

    return NextResponse.json(result);
  } catch (err) {
    console.error("match-products error:", err);
    console.error("error.message:", err.message);
    console.error("error.stack:", err.stack);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
