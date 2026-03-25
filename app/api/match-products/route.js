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

function buildOutfit(products, anchorColors = [], { includeHat = true, includeShoe = true, strictMatch = true } = {}) {
  const accentMatches = anchorColors.filter((c) => ACCENTS.includes(c));
  const neutralMatches = anchorColors.filter((c) => NEUTRALS.includes(c));
  const allMatches = [...new Set([...accentMatches, ...neutralMatches])];

  const tops = products.filter((p) => p.category === "top");
  const bottoms = products.filter((p) => p.category === "bottom");
  const hats = products.filter((p) => p.category === "hat");
  const shoes = products.filter((p) => p.category === "shoe");

  const safeColors = allMatches.length > 0 ? allMatches : ["black", "white", "gray", "denim"];
  
  // Determine if we need strict matching (multiple colors selected AND strictMatch enabled)
  const useStrictMatching = anchorColors.length > 1 && strictMatch;

  // Tops: strict match if multiple colors, otherwise any match
  const topCandidates = useStrictMatching && accentMatches.length > 1
    ? tops.filter((p) => matchesAll(p, accentMatches))
    : tops.filter((p) => matchesAny(p, accentMatches)).length > 0
      ? tops.filter((p) => matchesAny(p, accentMatches))
      : tops.filter((p) => matchesAny(p, safeColors));

  const bottomNeutralCandidates = bottoms.filter((p) =>
    Array.isArray(p.tags) ? p.tags.includes("neutral") : false
  );

  // Bottoms: strict match if multiple colors, otherwise any match
  const bottomCandidates = useStrictMatching && allMatches.length > 1
    ? bottomNeutralCandidates.filter((p) => matchesAll(p, allMatches)).length > 0
      ? bottomNeutralCandidates.filter((p) => matchesAll(p, allMatches))
      : bottomNeutralCandidates.filter((p) => matchesAny(p, safeColors))
    : bottomNeutralCandidates.filter((p) => matchesAny(p, safeColors)).length > 0
      ? bottomNeutralCandidates.filter((p) => matchesAny(p, safeColors))
      : bottomNeutralCandidates.length > 0
      ? bottomNeutralCandidates
      : bottoms;

  // Hats: strict match if multiple colors selected
  const hatCandidates = useStrictMatching && accentMatches.length > 1
    ? hats.filter((p) => matchesAll(p, accentMatches))
    : accentMatches.length > 0
      ? hats.filter((p) => matchesAny(p, accentMatches))
      : hats.filter((p) => Array.isArray(p.tags) ? p.tags.includes("neutral") : false);

  // Shoes: strict match if multiple colors, otherwise any match
  const shoeCandidates = useStrictMatching && safeColors.length > 1
    ? shoes.filter((p) => matchesAll(p, safeColors)).length > 0
      ? shoes.filter((p) => matchesAll(p, safeColors))
      : shoes.filter((p) => matchesAny(p, safeColors))
    : shoes.filter((p) => matchesAny(p, safeColors)).length > 0
      ? shoes.filter((p) => matchesAny(p, safeColors))
      : shoes.filter((p) => (Array.isArray(p.tags) ? p.tags.includes("neutral") : false));

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
    const body = await request.json();
    const anchorColors = Array.isArray(body.colors) ? body.colors : [];
    const strictMatch = body.strictMatch !== undefined ? body.strictMatch : true;

    const supabase = createSupabaseServerClient();

    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = buildOutfit(products || [], anchorColors, { strictMatch });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
