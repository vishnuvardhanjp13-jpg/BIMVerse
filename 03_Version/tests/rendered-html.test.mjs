import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

test("ships the canonical BIMVERSE BEP and its placement map", async () => {
  const pdf = await readFile("public/bep-template/BIMVERSE-BEP-Base.pdf");
  const placements = JSON.parse(await readFile("public/bep-template/placements.json", "utf8"));
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  assert.equal((await PDFDocument.load(pdf)).getPageCount(), 39);
  assert.ok((await stat("public/bep-template/BIMVERSE-BEP-Base.pdf")).size > 500_000);
  assert.ok(placements.length >= 200);
  assert.ok(Math.max(...placements.map((item) => item.page)) >= 37);
});

test("protects preview and final PDF generation on the server", async () => {
  const source = await readFile("app/api/bep/pdf/route.ts", "utf8");
  assert.match(source, /Active subscription required/);
  assert.match(source, /BIMVERSE PROTECTED PREVIEW/);
  assert.match(source, /Preview generated:/);
  assert.match(source, /Complete all required BEP fields first/);
  assert.match(source, /cache-control.*private, no-store/s);
});

test("provides the full multi-section authoring workspace", async () => {
  const schema = await readFile("lib/bep-schema.ts", "utf8");
  const workspace = await readFile("app/portal/BepWorkspace.tsx", "utf8");
  assert.ok((schema.match(/group\("/g) ?? []).length >= 16);
  assert.match(workspace, /Exact 39-page preview/);
  assert.match(workspace, /Save draft/);
});
