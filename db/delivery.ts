import { env } from "cloudflare:workers";

export type DeliveryOrder = {
  id: string; stripe_session_id: string; customer_email: string; product_key: string;
  object_key: string; download_token: string; expires_at: number; download_count: number; created_at: number;
};

type DeliveryBindings = {
  DB: D1Database; FILES: R2Bucket; STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string; DELIVERY_FROM_EMAIL?: string;
  PRODUCT_UPLOAD_SECRET?: string;
};

export function getDeliveryBindings() { return env as unknown as DeliveryBindings; }

export async function findOrderBySession(stripeSessionId: string) {
  return getDeliveryBindings().DB.prepare("SELECT * FROM delivery_orders WHERE stripe_session_id = ? LIMIT 1")
    .bind(stripeSessionId).first<DeliveryOrder>();
}

export async function findOrderByToken(token: string) {
  return getDeliveryBindings().DB.prepare("SELECT * FROM delivery_orders WHERE download_token = ? LIMIT 1")
    .bind(token).first<DeliveryOrder>();
}

export async function createDeliveryOrder(order: DeliveryOrder) {
  await getDeliveryBindings().DB.prepare(`
    INSERT INTO delivery_orders
      (id, stripe_session_id, customer_email, product_key, object_key, download_token, expires_at, download_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(order.id, order.stripe_session_id, order.customer_email, order.product_key, order.object_key,
    order.download_token, order.expires_at, order.download_count, order.created_at).run();
}

export async function recordDownload(token: string) {
  await getDeliveryBindings().DB.prepare("UPDATE delivery_orders SET download_count = download_count + 1 WHERE download_token = ?")
    .bind(token).run();
}
