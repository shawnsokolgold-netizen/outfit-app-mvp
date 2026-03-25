import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

function extractAsin(input) {
  if (!input) return null;

  const trimmed = input.trim();

  const dpMatch = trimmed.match(/\/dp\/([A-Z0-9]{10})/i);
  if (dpMatch) return dpMatch[1].toUpperCase();

  const asinMatch = trimmed.match(/\b([A-Z0-9]{10})\b/i);
  if (asinMatch) return asinMatch[1].toUpperCase();

  return null;
}

function buildAffiliateLink(asin) {
  const tag = "outfitbuild0a-20"; // your ID
  return `https://www.amazon.com/dp/${asin}?tag=${tag}`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const supabase = createSupabaseServerClient();

    const asin = extractAsin(body.amazonUrl || body.asin);

    if (!asin) {
      return NextResponse.json(
        { error: "Could not extract ASIN." },
        { status: 400 }
      );
    }

    const affiliateUrl = buildAffiliateLink(asin);

    const product = {
      asin,
      title: body.title?.trim() || `Amazon Product ${asin}`,
      brand: body.brand?.trim() || null,
      category: body.category,
      colors: Array.isArray(body.colors) ? body.colors : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      image_url:
        body.imageUrl?.trim() ||
        `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SL500_.jpg`,
      affiliate_url: affiliateUrl,
      price_text: body.priceText?.trim() || null,
      active: true,
    };

    if (!product.category) {
      return NextResponse.json(
        { error: "Category is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("products")
      .upsert(product, { onConflict: "asin" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Unknown server error" },
      { status: 500 }
    );
  }
}