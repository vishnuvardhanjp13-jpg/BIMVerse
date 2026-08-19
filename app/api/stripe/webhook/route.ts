import { createDeliveryOrder, findOrderBySession, getDeliveryBindings } from "../../../../db/delivery";

const PRODUCT_FILES: Record<string, string> = {
  "bep-standard": "bep/BEP-Template-Discipline-Based-Final.docx",
  "bep-professional": "bep/BEP-Template-Discipline-Based-Final.docx",
  "bep-assisted": "bep/BEP-Template-Discipline-Based-Final.docx",
  "appendix-package": "appendix/ISO-19650-BIM-Appendix-Package.zip",
  "appendix-standard": "appendix/ISO-19650-BIM-Appendix-Package.zip",
  "appendix-professional": "appendix/ISO-19650-BIM-Appendix-Package.zip",
  "appendix-ultimate": "appendix/ISO-19650-BIM-Appendix-Package.zip",
};

const PRODUCT_NAMES: Record<string, string> = {
  "bep-standard": "Standard BEP Template",
  "bep-professional": "Professional BEP Package",
  "bep-assisted": "Assisted BEP Package",
  "appendix-package": "BIM Appendix Package",
  "appendix-standard": "Standard BIM Appendix Package",
  "appendix-professional": "Professional BIM Appendix Package",
  "appendix-ultimate": "Ultimate BIM Appendix Package",
};

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

async function verifyStripeSignature(body: string, header: string, secret: string) {
  const parts = header.split(",").map((part) => part.split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || signatures.length === 0 || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`)));
  return signatures.some((signature) => safeEqual(digest, signature));
}

async function sendDeliveryEmail(email: string, downloadUrl: string, productKey: string) {
  const { RESEND_API_KEY, DELIVERY_FROM_EMAIL } = getDeliveryBindings();
  if (!RESEND_API_KEY || !DELIVERY_FROM_EMAIL) return false;
  const productName = PRODUCT_NAMES[productKey] ?? "BIMVERSE product";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: DELIVERY_FROM_EMAIL, to: [email], subject: "Your BIMVERSE download is ready",
      html: `<p>Thank you for purchasing from BIMVERSE.</p><p><a href="${downloadUrl}">Download your ${productName}</a></p><p>This protected link expires in seven days.</p>` }),
  });
  if (!response.ok) throw new Error(`Delivery email failed with status ${response.status}`);
  return true;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  const { STRIPE_WEBHOOK_SECRET } = getDeliveryBindings();
  if (!STRIPE_WEBHOOK_SECRET) return Response.json({ error: "Webhook is not configured" }, { status: 503 });
  if (!(await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET))) return Response.json({ error: "Invalid signature" }, { status: 400 });
  const event = JSON.parse(body) as { type?: string; data?: { object?: Record<string, unknown> } };
  const supportedEvents = new Set([
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
  ]);
  if (event.type === "checkout.session.async_payment_failed") {
    return Response.json({ received: true, payment_failed: true });
  }
  if (!event.type || !supportedEvents.has(event.type)) return Response.json({ received: true });
  const session = event.data?.object ?? {};
  const paymentStatus = typeof session.payment_status === "string" ? session.payment_status : "";
  if (paymentStatus === "unpaid") return Response.json({ received: true, awaiting_payment: true });
  const sessionId = typeof session.id === "string" ? session.id : "";
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const productKey = metadata.product_key;
  const objectKey = PRODUCT_FILES[productKey];
  const details = (session.customer_details ?? {}) as Record<string, unknown>;
  const email = typeof details.email === "string" ? details.email : "";
  if (!sessionId || !email || !objectKey) return Response.json({ error: "Missing delivery metadata" }, { status: 400 });
  let order = await findOrderBySession(sessionId);
  if (!order) {
    const now = Math.floor(Date.now() / 1000);
    order = { id: crypto.randomUUID(), stripe_session_id: sessionId, customer_email: email, product_key: productKey,
      object_key: objectKey, download_token: `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", ""),
      expires_at: now + 604800, download_count: 0, created_at: now };
    await createDeliveryOrder(order);
  }
  const emailSent = await sendDeliveryEmail(email, new URL(`/download/${order.download_token}`, request.url).toString(), productKey);
  return Response.json({ received: true, email_sent: emailSent });
}
