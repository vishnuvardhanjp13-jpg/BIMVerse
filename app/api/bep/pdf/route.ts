import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { allBepFields } from "../../../../lib/bep-schema";
import { getDraft, getMembership } from "../../../../db/portal";

type Placement = { page: number; text: string; x: number; y: number; w: number; h: number };
const ignored = new Set(["the", "of", "and", "or", "in", "to", "for", "this", "project", "name", "description", "requirement"]);
const words = (value: string) => new Set(value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((word) => word.length > 1 && !ignored.has(word)));
function similarity(label: string, placeholder: string) {
  const a = words(label), b = words(placeholder);
  if (!a.size || !b.size) return 0;
  const common = [...a].filter((word) => b.has(word)).length;
  return common / Math.min(a.size, b.size);
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await getMembership(user.userId, user.email);
  if (!membership || !["active", "trialing"].includes(membership.status)) return Response.json({ error: "Active subscription required" }, { status: 403 });
  const draft = await getDraft(user.userId);
  const data = draft ? JSON.parse(draft.data_json) as Record<string, string> : {};
  const finalMode = new URL(request.url).searchParams.get("mode") === "final";
  if (finalMode && allBepFields.some((field) => !data[field.id]?.trim())) return Response.json({ error: "Complete all required BEP fields first" }, { status: 409 });
  const baseUrl = new URL("/bep-template/BIMVERSE-BEP-Base.pdf", request.url);
  const source = await fetch(baseUrl).then((response) => response.arrayBuffer());
  const pdf = await PDFDocument.load(source);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const placements = await fetch(new URL("/bep-template/placements.json", request.url)).then((response) => response.json()) as Placement[];
  for (const field of allBepFields) {
    const value = data[field.id]?.trim();
    if (!value) continue;
    const candidates = placements.filter((placement) => similarity(field.label, placement.text) >= 0.72);
    for (const placement of candidates) {
      const page = pdf.getPage(placement.page);
      const size = Math.max(5.5, Math.min(10, placement.h * 0.74, (placement.w * 1.8) / Math.max(1, value.length) * 8));
      page.drawRectangle({ x: placement.x - 1, y: placement.y - 1, width: placement.w + 2, height: placement.h + 2, color: rgb(1, 1, 1) });
      page.drawText(value.slice(0, 240), { x: placement.x, y: placement.y + Math.max(0, (placement.h - size) / 2), size, font: regular, color: rgb(0.04, 0.08, 0.12), maxWidth: Math.max(placement.w, 80), lineHeight: size * 1.12 });
    }
  }
  if (!finalMode) {
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const generatedAt = new Date().toISOString();
    const stamp = "BIMVERSE PROTECTED PREVIEW";
    for (const page of pdf.getPages()) {
      const { width, height } = page.getSize();
      const size = Math.min(34, width / 18);
      page.drawText(stamp, { x: width * 0.12, y: height * 0.24, size, font, color: rgb(0.58, 0.58, 0.58), opacity: 0.16, rotate: degrees(45) });
      page.drawRectangle({ x: 16, y: 8, width: 226, height: 14, color: rgb(1, 1, 1), opacity: 0.92 });
      page.drawText(`Preview generated: ${generatedAt.replace("T", " ").replace("Z", " UTC")}`, { x: 20, y: 12, size: 6.5, font: regular, color: rgb(0.3, 0.36, 0.42) });
    }
  }
  const bytes = await pdf.save();
  return new Response(bytes, { headers: { "content-type": "application/pdf", "content-disposition": `${finalMode ? "attachment" : "inline"}; filename="BIMVERSE-BEP-${finalMode ? "Final" : "Preview"}.pdf"`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
}
