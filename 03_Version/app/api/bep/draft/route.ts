import { getChatGPTUser } from "../../../chatgpt-auth";
import { allBepFields } from "../../../../lib/bep-schema";
import { saveDraft } from "../../../../db/portal";

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { data?: unknown };
  if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) return Response.json({ error: "Invalid draft" }, { status: 400 });
  const allowed = new Set(allBepFields.map((field) => field.id));
  const data = Object.fromEntries(Object.entries(body.data as Record<string, unknown>).filter(([key, value]) => allowed.has(key) && typeof value === "string").map(([key, value]) => [key, String(value).slice(0, 10000)]));
  const completion = Math.round(allBepFields.filter((field) => data[field.id]?.trim()).length / allBepFields.length * 100);
  await saveDraft(user.userId, data, completion);
  return Response.json({ saved: true, completion });
}
