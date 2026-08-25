import { env } from "cloudflare:workers";

type Bindings = { DB: D1Database };
const db = () => (env as unknown as Bindings).DB;

export async function getDraft(userId: string) {
  return db().prepare("SELECT data_json, completion, updated_at FROM bep_drafts WHERE user_id = ? LIMIT 1").bind(userId).first<{ data_json: string; completion: number; updated_at: number }>();
}

export async function saveDraft(userId: string, data: Record<string, string>, completion: number) {
  const now = Math.floor(Date.now() / 1000);
  await db().prepare(`INSERT INTO bep_drafts (user_id, data_json, completion, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data_json=excluded.data_json, completion=excluded.completion, updated_at=excluded.updated_at`)
    .bind(userId, JSON.stringify(data), completion, now, now).run();
}

export async function getMembership(userId: string, email: string) {
  return db().prepare("SELECT status, current_period_end FROM memberships WHERE user_id = ? OR lower(email) = lower(?) ORDER BY updated_at DESC LIMIT 1")
    .bind(userId, email).first<{ status: string; current_period_end: number | null }>();
}
