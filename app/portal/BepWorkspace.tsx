"use client";

import { useMemo, useState } from "react";
import { allBepFields, bepSections } from "../../lib/bep-schema";

export default function BepWorkspace({ email, initialData, active }: { email: string; initialData: Record<string, string>; active: boolean }) {
  const [data, setData] = useState(initialData);
  const [section, setSection] = useState(0);
  const [saving, setSaving] = useState(false);
  const completed = useMemo(() => allBepFields.filter((field) => !field.required || data[field.id]?.trim()).length, [data]);
  const percent = Math.round((completed / allBepFields.length) * 100);
  const preview = `/api/bep/pdf?mode=preview&v=${encodeURIComponent(String(Object.values(data).join("").length))}`;

  async function save() {
    setSaving(true);
    await fetch("/api/bep/draft", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ data }) });
    setSaving(false);
  }

  const current = bepSections[section];
  return <main className="portalShell">
    <header className="portalHero"><div><p className="eyebrow">BIMVERSE V3 · MASTER BEP WORKSPACE</p><h1>Your project data. Your original 39-page BEP.</h1><p>The preview below is the canonical BIMVERSE document—never an HTML redesign. Drafts are private to <strong>{email}</strong>.</p></div><div className={`memberState ${active ? "active" : "inactive"}`}>{active ? "Subscription active" : "Subscription required"}</div></header>
    {!active && <section className="subscribeGate"><h2>Activate BIMVERSE Professional</h2><p>Authoring, protected previews, saved drafts and clean PDF export are available to active members.</p><div><a href="https://buy.stripe.com/test_14A00j8fZfjleM9c3rfIs0i">Monthly · $19</a><a href="https://buy.stripe.com/test_28EeVd2VF0oreM97NbfIs0j">Annual · $190</a></div><small>Test-mode checkout while V3 is under review.</small></section>}
    <section className={`portalProgress ${!active ? "disabled" : ""}`}><div><span>BEP completion</span><strong>{percent}%</strong><i style={{ width: `${percent}%` }} /></div><p>{allBepFields.length - completed} required details remaining</p></section>
    <section className={`portalGrid ${!active ? "disabled" : ""}`}>
      <div className="authorPanel">
        <nav>{bepSections.map((item, index) => <button key={item.name} className={index === section ? "selected" : ""} onClick={() => setSection(index)}>{index + 1}. {item.name}</button>)}</nav>
        <div className="fieldPanel"><h2>{current.name}</h2><p>{current.lead}</p><div className="fieldGrid">{current.fields.map((field) => <label key={field.id} className={field.type === "textarea" ? "wide" : ""}><span>{field.label} *</span>{field.type === "textarea" ? <textarea value={data[field.id] ?? ""} onChange={(event) => setData({ ...data, [field.id]: event.target.value })} /> : <input value={data[field.id] ?? ""} onChange={(event) => setData({ ...data, [field.id]: event.target.value })} />}</label>)}</div></div>
        <footer><button onClick={() => setSection(Math.max(0, section - 1))}>Back</button><button onClick={save}>{saving ? "Saving…" : "Save draft"}</button><button onClick={() => setSection(Math.min(bepSections.length - 1, section + 1))}>Next</button></footer>
      </div>
      <div className="previewPanel"><header><div><h2>Exact 39-page preview</h2><p>Personalized, watermarked draft · copy and print restricted</p></div>{percent === 100 ? <a className="downloadReady" href="/api/bep/pdf?mode=final">Download final PDF</a> : <button className="downloadLocked" disabled>Complete all fields</button>}</header><div className="pdfShield" onContextMenu={(event) => event.preventDefault()}><iframe title="BIMVERSE BEP preview" src={`${preview}#toolbar=0&navpanes=0`} /></div><p className="securityNote">Browser screenshot capture cannot be completely blocked. BIMVERSE deters misuse with a personalized watermark on every preview page and server-side download authorization.</p></div>
    </section>
  </main>;
}
