const stores = [
  {
    name: "Poonachi’s Petopia",
    description: "Specialty pets, food, accessories and everyday care essentials.",
    href: "/pet-shop",
    status: "Coming soon",
    initials: "P",
    tone: "petopia",
  },
];

export default function StoresPage() {
  return (
    <main className="stores-page">
      <div className="stores-page-inner">
        <div className="stores-eyebrow">SRI AMIRTHAA GROUPS 1252</div>
        <div className="stores-heading-row">
          <div>
            <h1>Stores</h1>
            <p>Explore the stores connected to our shopping platform.</p>
          </div>
          <div className="stores-count"><strong>{stores.length.toString().padStart(2, "0")}</strong><span>Stores</span></div>
        </div>

        <section className="stores-grid" aria-label="Available stores">
          {stores.map((store) => (
            <a className="store-card" href={store.href} key={store.name}>
              <div className={`store-card-mark ${store.tone}`}>
                <img src="/petopia-icon.svg" alt="" />
              </div>
              <div className="store-card-copy">
                <span className="store-card-kicker">SPECIALTY STORE</span>
                <h2>{store.name}</h2>
                <p>{store.description}</p>
                <span className="store-card-status">{store.status}</span>
              </div>
              <span className="store-card-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
          <div className="store-add-card">
            <div className="store-add-icon">＋</div>
            <h2>More stores coming</h2>
            <p>New partner and seller stores will appear here as they are approved.</p>
          </div>
        </section>
        <div className="stores-note">
          <strong>One platform. Multiple stores.</strong>
          <span>Each store will have its own secure owner login and dashboard as the seller programme is introduced.</span>
        </div>
      </div>
    </main>
  );
}
