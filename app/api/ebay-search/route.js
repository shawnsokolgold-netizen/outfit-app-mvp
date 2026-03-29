const EBAY_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";

async function getEbayAccessToken() {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing eBay credentials");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(EBAY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "https://api.ebay.com/oauth/api_scope",
    }).toString(),
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("eBay token error:", data);
    throw new Error(data.error_description || "Failed to get eBay access token");
  }

  return data.access_token;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const query = body?.query?.trim();
    const limit = Math.min(Math.max(Number(body?.limit) || 10, 1), 20);

    if (!query) {
      return Response.json({ error: "Missing query" }, { status: 400 });
    }

    const accessToken = await getEbayAccessToken();

    const url = new URL(EBAY_SEARCH_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("eBay search error:", data);
      return Response.json(
        { error: "Failed to fetch eBay products", details: data },
        { status: response.status }
      );
    }

    const items = (data.itemSummaries || []).map((item) => ({
      title: item.title || "",
      price: item.price
        ? `${item.price.value} ${item.price.currency}`
        : "",
      image: item.image?.imageUrl || "",
      itemWebUrl: item.itemAffiliateWebUrl || item.itemWebUrl || "",
      condition: item.condition || "",
    }));

    return Response.json({ items }, { status: 200 });
  } catch (error) {
    console.error("eBay search route error:", error);
    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}