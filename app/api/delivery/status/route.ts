import { findOrderBySession } from "../../../../db/delivery";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";
  if (!/^cs_(?:test_)?[A-Za-z0-9_]{16,}$/.test(sessionId)) {
    return Response.json({ error: "Invalid payment reference." }, { status: 400 });
  }

  const order = await findOrderBySession(sessionId);
  if (!order) return Response.json({ ready: false }, { status: 404 });
  if (order.expires_at < Math.floor(Date.now() / 1000) || order.download_count >= 5) {
    return Response.json({ error: "This download has expired or reached its download limit." }, { status: 410 });
  }

  return Response.json({ ready: true, downloadUrl: `/download/${order.download_token}` }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
