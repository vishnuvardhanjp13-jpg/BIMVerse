"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(true), 1100);
    return () => window.clearTimeout(timer);
  }, []);

  return <main>
    <nav className="nav shell" aria-label="Primary navigation">
      <a className="brand" href="#top" aria-label="BIMVERSE home"><span className="brandMark">BV</span><span>BIMVERSE</span></a>
      <div className="navLinks"><a href="#workspace">BEP workspace</a><a href="#membership">Membership</a><a href="/portal">Member login</a></div>
    </nav>

    <section className="hero shell" id="top">
      <div className="heroCopy revealUp">
        <p className="eyebrow">BIMVERSE V3 · Subscription workspace</p>
        <h1>Build an issue-ready BEP without changing its professional design.</h1>
        <p className="lede">Complete the full project-information workflow, review the original 39-page BIMVERSE document, save your progress and download the completed PDF when every required detail is ready.</p>
        <div className="heroActions"><a className="primaryButton" href="/portal">Open BEP workspace</a><button className="textButton" onClick={() => setOpen(true)}>View membership</button></div>
      </div>
      <div className="systemCard portalVisual revealScale" aria-label="BIMVERSE V3 document workflow">
        <span className="systemLabel">BIMVERSE DOCUMENT ENGINE</span><div className="systemCore">39</div>
        <div className="systemGrid"><span>Project data</span><span>Protected preview</span><span>Saved draft</span><span>Final PDF</span></div>
        <div className="orbit orbitOne"/><div className="orbit orbitTwo"/>
      </div>
    </section>

    <section className="v3Feature shell" id="workspace">
      <div className="sectionHeading"><p className="eyebrow">The complete workflow</p><h2>One controlled workspace from blank fields to final BEP.</h2></div>
      <div className="workflowGrid">
        <article><span>01</span><h3>Complete all project details</h3><p>Work through document control, project scope, stakeholders, EIR, milestones, CDE, coordinates, naming, technology, responsibilities and appendices.</p></article>
        <article><span>02</span><h3>Review the exact document</h3><p>Your protected preview uses the original 39-page BIMVERSE BEP—not a simplified web recreation.</p></article>
        <article><span>03</span><h3>Continue from any device</h3><p>Private cloud drafts let members stop, return and continue the project-information workflow securely.</p></article>
        <article><span>04</span><h3>Unlock the completed PDF</h3><p>Final export is enabled only after required details are complete and the subscription is active.</p></article>
      </div>
    </section>

    <section className="membershipSection" id="membership"><div className="shell membershipInner">
      <div><p className="eyebrow">BIMVERSE Professional</p><h2>A growing BIM delivery system—not another template download.</h2><p>Access the BEP authoring portal, protected project previews, persistent drafts and future professional BIM workflow updates.</p></div>
      <div className="membershipCard"><p>Professional access</p><strong>$19 <small>/ month</small></strong><ul><li>Full BEP authoring workspace</li><li>Original 39-page document preview</li><li>Saved project drafts</li><li>Completed PDF export</li></ul><button onClick={() => setOpen(true)}>Choose membership</button></div>
    </div></section>

    <section className="delivery shell" id="delivery"><p className="eyebrow">Controlled member access</p><h2>Subscribe. Complete. Review. Download.</h2><div className="deliverySteps"><span>01 Activate membership</span><span>02 Complete and save the BEP</span><span>03 Download the validated PDF</span></div></section>

    {open && <div className="modalBackdrop" role="button" tabIndex={0} aria-label="Close membership popup" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape" || event.key === "Enter") setOpen(false); }}><section className="membershipModal" role="dialog" aria-modal="true" aria-labelledby="membership-title"><button className="modalClose" aria-label="Close membership popup" onClick={() => setOpen(false)}>×</button><p className="eyebrow">Start BIMVERSE V3</p><h2 id="membership-title">Choose your professional access.</h2><p>Both plans unlock the same complete BEP workspace. Annual access includes two months effectively free.</p><div className="modalPlans"><a href="https://buy.stripe.com/test_14A00j8fZfjleM9c3rfIs0i"><span>Monthly</span><strong>$19</strong><small>per month</small></a><a className="bestPlan" href="https://buy.stripe.com/test_28EeVd2VF0oreM97NbfIs0j"><b>BEST VALUE</b><span>Annual</span><strong>$190</strong><small>per year</small></a></div><a className="existingMember" href="/portal">Already a member? Open your workspace →</a><small className="testNotice">Checkout remains in Stripe test mode during V3 review.</small></section></div>}
  </main>;
}
