// eBay Marketplace Account Deletion Notification endpoint
// Required for eBay API compliance

export async function GET() {
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

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
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