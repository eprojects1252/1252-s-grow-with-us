import Link from "next/link";

type PageInfo = { title: string; description: string; section: string };

const pages: Record<string, PageInfo> = {
  categories: { title: "All Categories", description: "Explore products by category and discover new favourites.", section: "Shop" },
  category: { title: "Category", description: "Browse products in this category. Filters and live inventory will be connected in the next phase.", section: "Shop" },
  product: { title: "Product Details", description: "Product images, description, price, stock, reviews and 360° preview will appear here.", section: "Shop" },
  cart: { title: "Your Cart", description: "Review items, update quantities and continue to checkout.", section: "Shopping" },
  checkout: { title: "Checkout", description: "Confirm your address, apply an eligible coupon or wallet balance, and choose a payment method.", section: "Shopping" },
  login: { title: "Sign in to Sri Amirthaa ID", description: "Sign in securely with your central Sri Amirthaa account.", section: "Account" },
  signup: { title: "Create your Sri Amirthaa ID", description: "Create one account to use across participating Sri Amirthaa websites.", section: "Account" },
  wallet: { title: "My Wallet", description: "View your wallet balance, add-money options and transaction history.", section: "Account" },
  recharge: { title: "Recharge & Bills", description: "Submit a recharge request and track its processing status.", section: "Services" },
  orders: { title: "My Orders", description: "View order details, payment status, delivery updates and order history.", section: "Account" },
  account: { title: "My Account", description: "Manage your profile, saved addresses and account preferences.", section: "Account" },
  offers: { title: "Offers & Deals", description: "Discover current offers, eligible coupons and special promotions.", section: "Explore" },
  about: { title: "About Us", description: "Learn about 1252's grow with us and our promise to customers.", section: "Information" },
  contact: { title: "Contact Us", description: "Find the right way to contact our customer support team.", section: "Information" },
  faq: { title: "Frequently Asked Questions", description: "Find answers about shopping, orders, payments, wallet and recharge.", section: "Help" },
  terms: { title: "Terms & Conditions", description: "Read the terms that apply when using this website.", section: "Policies" },
  privacy: { title: "Privacy Policy", description: "Learn how account and shopping information is handled.", section: "Policies" },
  refund: { title: "Returns, Refunds & Cancellation", description: "Review the process and conditions for returns, refunds and cancellations.", section: "Policies" },
};

export default async function StructurePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const route = slug[0] ?? "";
  const info = pages[route] ?? {
    title: slug.map((part) => decodeURIComponent(part).replace(/-/g, " ")).join(" / "),
    description: "This page is part of the website structure. Its complete content and functionality will be added in the design and integration phases.",
    section: "Website",
  };

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(145deg, #f7f6ff 0%, #f8fbff 55%, #effaf6 100%)", padding: "28px 18px", color: "#172033" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "10px 0 30px" }}>
          <Link href="/" style={{ fontWeight: 800, letterSpacing: ".04em" }}>1252's grow with us</Link>
          <Link href="/" style={{ color: "#6558d3", fontWeight: 700, fontSize: 14 }}>← Back to Home</Link>
        </header>
        <section style={{ background: "#ffffffd9", border: "1px solid #e8e7f5", borderRadius: 24, padding: "clamp(24px, 6vw, 58px)", boxShadow: "0 22px 60px rgba(37,45,75,.08)" }}>
          <span style={{ color: "#756bd2", fontSize: 11, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase" }}>{info.section}</span>
          <h1 style={{ fontSize: "clamp(32px, 6vw, 52px)", lineHeight: 1.1, letterSpacing: "-.045em", margin: "14px 0" }}>{info.title}</h1>
          <p style={{ maxWidth: 650, color: "#778197", lineHeight: 1.8, fontSize: 15 }}>{info.description}</p>
          <div style={{ marginTop: 30, padding: 18, borderRadius: 15, background: "#f6f5ff", border: "1px solid #e9e6ff" }}>
            <strong style={{ display: "block", fontSize: 14 }}>Page structure created</strong>
            <p style={{ margin: "7px 0 0", color: "#778197", fontSize: 13, lineHeight: 1.7 }}>This is the first structural version. Real data, secure sign-in, payments and admin permissions will only be enabled after their backend integrations are configured.</p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
            <Link href="/categories" style={{ display: "inline-flex", padding: "12px 17px", borderRadius: 10, background: "#6b5ed9", color: "white", fontWeight: 700, fontSize: 13 }}>Explore categories</Link>
            <Link href="/account" style={{ display: "inline-flex", padding: "12px 17px", borderRadius: 10, background: "white", border: "1px solid #e5e7ef", color: "#545e75", fontWeight: 700, fontSize: 13 }}>My account</Link>
          </div>
        </section>
        <footer style={{ color: "#8992a5", fontSize: 12, padding: "24px 4px" }}>Buy Grow Joy · Supporting By Sri Amirthaa Groups 1252 · Managing By K² Techtron Team</footer>
      </div>
    </main>
  );
}
