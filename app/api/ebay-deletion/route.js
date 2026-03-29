import { createHash } from "crypto";

const ENDPOINT = "https://buildmyoutfit.com/api/ebay-deletion";
const VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const challengeCode = searchParams.get("challenge_code");

  if (challengeCode) {
    if (!VERIFICATION_TOKEN) {
      return Response.json(
        { error: "Missing EBAY_VERIFICATION_TOKEN" },
        { status: 500 }
      );
    }

    const hash = createHash("sha256");
    hash.update(challengeCode);
    hash.update(VERIFICATION_TOKEN);
    hash.update(ENDPOINT);
    const challengeResponse = hash.digest("hex");

    return Response.json({ challengeResponse }, { status: 200 });
  }

  return Response.json(
    { message: "eBay deletion endpoint is live" },
    { status: 200 }
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("eBay deletion notification received:", body);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error handling eBay notification:", error);
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}