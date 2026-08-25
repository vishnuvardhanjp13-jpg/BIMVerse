import { findOrderByToken, getDeliveryBindings, recordDownload } from "../../../db/delivery";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const order = await findOrderByToken(token);
  if (!order || order.expires_at < Math.floor(Date.now() / 1000) || order.download_count >= 5) {
    return new Response("This download link is invalid or has expired.", { status: 410 });
  }
  const object = await getDeliveryBindings().FILES.get(order.object_key);
  if (!object) return new Response("The purchased file is temporarily unavailable.", { status: 503 });
  await recordDownload(token);
  const filename = order.object_key.split("/").pop() ?? "BIMVERSE-download";
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Disposition", `attachment; filename="${filename.replaceAll('"', "")}"`);
  headers.set("Cache-Control", "private, no-store");
  return new Response(object.body, { headers });
}
