const products = [
  { name: "ISO 19650 BIM Execution Plan Template", detail: "Architecture, Structure & MEP", price: "$32", link: process.env.NEXT_PUBLIC_STRIPE_BEP_URL },
  { name: "ISO 19650 BIM Appendix Package", detail: "Six practical project-delivery templates", price: "Price to confirm", link: process.env.NEXT_PUBLIC_STRIPE_APPENDIX_URL },
];

export default function Home() {
  return (
    <main>
      <nav className="nav shell" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="BIMVERSE home"><span className="brandMark">BV</span><span>BIMVERSE</span></a>
        <div className="navLinks"><a href="#products">Products</a><a href="#delivery">Delivery</a></div>
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
        <div className="sectionHeading"><p className="eyebrow">Product system</p><h2>Choose a structured starting point.</h2></div>
        <div className="productGrid">
          {products.map((product) => (
            <article className="productCard" key={product.name}>
              <p className="productMeta">DIGITAL RESOURCE</p><h3>{product.name}</h3><p>{product.detail}</p>
              <div className="productBottom"><strong>{product.price}</strong>{product.link ? <a className="checkoutButton ready" href={product.link}>Buy securely</a> : <span className="checkoutButton">Stripe setup required</span>}</div>
            </article>
          ))}
        </div>
      </section>
      <section className="delivery shell" id="delivery">
        <p className="eyebrow">Secure delivery</p><h2>Checkout through Stripe. Receive protected files automatically.</h2>
        <div className="deliverySteps"><span>01 Select product</span><span>02 Pay securely</span><span>03 Receive expiring download link</span></div>
      </section>
    </main>
  );
}
