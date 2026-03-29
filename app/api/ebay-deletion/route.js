Replace the file app/api/ebay-deletion/route.js with this exact code:

import crypto from "crypto";

const ENDPOINT = "https://buildmyoutfit.com/api/ebay-deletion";
const VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const challengeCode = searchParams.get("challenge_code");

  if (challengeCode) {
    if (!VERIFICATION_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Missing EBAY_VERIFICATION_TOKEN" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const hash = crypto.createHash("sha256");
    hash.update(challengeCode);
    hash.update(VERIFICATION_TOKEN);
    hash.update(ENDPOINT);
    const challengeResponse = hash.digest("hex");

    return new Response(
      JSON.stringify({ challengeResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({ message: "eBay deletion endpoint is live" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("eBay deletion notification received:", body);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error handling eBay notification:", error);

    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}