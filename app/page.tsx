const productGroups = [
  { number: "01", title: "ISO 19650 BIM Execution Plan", intro: "A discipline-structured BEP system for Architecture, Structure and MEP delivery.", tiers: [
    { name: "Standard", price: "$59", href: "/checkout/bep-standard", features: ["Editable BEP Word template", "Architecture, Structure & MEP structure", "ISO 19650-aligned framework"] },
    { name: "Professional", price: "$99", href: "/checkout/bep-professional", featured: true, features: ["Everything in Standard", "Completed reference example", "Faster project customization"] },
    { name: "Assisted", price: "$199", href: "/checkout/bep-assisted", features: ["Everything in Professional", "Professional BEP review", "Consultation and project feedback"] },
  ]},
  { number: "02", title: "BIM Execution Plan Appendix Package", intro: "Editable project-delivery tools for model planning, quality control, information need and coordination.", tiers: [
    { name: "Standard", price: "$45", href: "/checkout/appendix-standard", features: ["Six editable Excel templates", "Individual professional-use license", "MBS, QA/QC, LOIN, MIDP, clash matrix and TIDP"] },
    { name: "Professional", price: "$79", href: "/checkout/appendix-professional", featured: true, features: ["Everything in Standard", "Project/team-use license", "Future minor template updates"] },
    { name: "Ultimate", price: "$129", href: "/checkout/appendix-ultimate", features: ["Everything in Professional", "One structured implementation review", "Project-specific appendix guidance"] },
  ]},
];

const previews = [
  { name: "Model Breakdown Structure", image: "/appendix-previews/model-breakdown.png" },
  { name: "Model QA/QC Checklist", image: "/appendix-previews/qaqc-checklist.png" },
  { name: "Level of Information Need Matrix", image: "/appendix-previews/loin-matrix.png" },
  { name: "Master Information Delivery Plan", image: "/appendix-previews/midp.png" },
  { name: "Master Clash Detection Matrix", image: "/appendix-previews/clash-matrix.png" },
  { name: "Task Information Delivery Plan", image: "/appendix-previews/tidp.png" },
];

export default function Home() {
  return (
    <main>
      <nav className="nav shell" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="BIMVERSE home"><span className="brandMark">BV</span><span>BIMVERSE</span></a>
        <div className="navLinks"><a href="#products">Products</a><a href="#appendix-preview">Preview</a><a href="#delivery">Delivery</a></div>
      </nav>
      <section className="hero shell" id="top">
        <div className="heroCopy">
          <p className="eyebrow">Professional BIM resources</p>
          <h1>Structured tools for real-world BIM delivery.</h1>
          <p className="lede">Practical templates and documentation resources for BIM managers, coordinators, architects, engineers, contractors and consultants.</p>
          <a className="primaryButton" href="#products">Explore BIM products</a>
        </div>
        <div className="systemCard" aria-label="BIM information framework">
          <span className="systemLabel">INFORMATION FRAMEWORK</span><div className="systemCore">BEP</div>
          <div className="systemGrid"><span>Architecture</span><span>Structure</span><span>MEP</span><span>CDE</span></div>
        </div>
      </section>
      <section className="products shell" id="products">
        <div className="sectionHeading"><p className="eyebrow">Product system</p><h2>Choose the support level your project needs.</h2></div>
        {productGroups.map((group) => (
          <div className="productGroup" key={group.number}>
            <div className="groupHeading"><span>{group.number}</span><div><h3>{group.title}</h3><p>{group.intro}</p></div></div>
            <div className="tierGrid">{group.tiers.map((tier) => (
              <article className={`tierCard${tier.featured ? " featured" : ""}`} key={tier.name}>
                {tier.featured && <p className="recommended">Recommended</p>}
                <p className="productMeta">{tier.name}</p><p className="tierPrice">{tier.price}<small> one-time</small></p>
                <ul>{tier.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                <a className="checkoutButton ready" href={tier.href}>Buy securely</a>
              </article>
            ))}</div>
          </div>
        ))}
      </section>
      <section className="previewSection" id="appendix-preview"><div className="shell">
        <div className="sectionHeading"><p className="eyebrow">Product 02 preview</p><h2>See the working templates before you buy.</h2></div>
        <p className="previewIntro">Real previews rendered from the editable Excel package. Project fields remain as placeholders for your team to customize.</p>
        <div className="previewGrid">{previews.map((preview) => (
          <figure className="previewCard" key={preview.name}><div className="previewFrame"><img src={preview.image} alt={`${preview.name} spreadsheet preview`} loading="lazy" /></div><figcaption>{preview.name}</figcaption></figure>
        ))}</div>
      </div></section>
      <section className="delivery shell" id="delivery">
        <p className="eyebrow">Secure delivery</p><h2>One payment. Immediate access. No monthly subscription.</h2>
        <div className="deliverySteps"><span>01 Select product and tier</span><span>02 Pay securely through Stripe</span><span>03 Receive protected download access</span></div>
      </section>
    </main>
  );
}
