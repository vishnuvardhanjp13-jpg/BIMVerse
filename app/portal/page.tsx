import { requireChatGPTUser } from "../chatgpt-auth";
import { getDraft, getMembership } from "../../db/portal";
import BepWorkspace from "./BepWorkspace";

export default async function PortalPage() {
  const user = await requireChatGPTUser("/portal");
  const [draft, membership] = await Promise.all([getDraft(user.userId), getMembership(user.userId, user.email)]);
  const active = membership?.status === "active" || membership?.status === "trialing";
  let initialData: Record<string, string> = {};
  try { initialData = draft ? JSON.parse(draft.data_json) : {}; } catch { initialData = {}; }
  return <BepWorkspace email={user.email} initialData={initialData} active={active} />;
}
