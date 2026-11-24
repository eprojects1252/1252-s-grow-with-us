import Link from "next/link";
import LoginExperience from "@/components/login-experience";
import CustomerDashboard from "@/components/customer-dashboard";

type PageInfo = { title: string; description: string; section: string };
const pages: Record<string, PageInfo> = {
  categories: { title: "All Categories", description: "Explore products by category and discover new favourites.", section: "Shop" },
  category: { title: "Category", description: "Browse products in this category.", section: "Shop" },
  product: { title: "Product Details", description: "Product images, description, price, stock, reviews and 360° preview will appear here.", section: "Shop" },
  cart: { title: "Your Cart", description: "Review items, update quantities and continue to checkout.", section: "Shopping" },
  checkout: { title: "Checkout", description: "Confirm your address, apply an eligible coupon or wallet balance, and choose a payment method.", section: "Shopping" },
  login: { title: "Sign in to Sri Amirthaa ID", description: "Sign in securely with your central Sri Amirthaa account.", section: "Account" },
  signup: { title: "Create your Sri Amirthaa ID", description: "Create one account to use across participating Sri Amirthaa websites.", section: "Account" },
  wallet: { title: "My Wallet", description: "View your wallet balance, add-money options and transaction history.", section: "Account" },
  recharge: { title: "Recharge & Bills", description: "Submit a recharge request and track its processing status.", section: "Services" },
  orders: { title: "My Orders", description: "View order details, payment status, delivery updates and order history.", section: "Account" },
  account: { title: "My Account", description: "Manage your profile, saved addresses and account preferences.", section: "Account" },
  offers: { title: "Offers & Deals", description: "Explore coupons, vouchers and rewards in one place.", section: "Explore" },
  settings: { title: "Settings", description: "Manage your website preferences, account security and support options.", section: "Preferences" },
  about: { title: "About Us", description: "Learn about 1252&apos;s grow with us and our promise to customers.", section: "Information" },
  contact: { title: "Contact Us", description: "Find the right way to contact our customer support team.", section: "Information" },
  faq: { title: "Frequently Asked Questions", description: "Find answers about shopping, orders, payments, wallet and recharge.", section: "Help" },
  terms: { title: "Terms & Conditions", description: "Read the terms that apply when using this website.", section: "Policies" },
  privacy: { title: "Privacy Policy", description: "Learn how account and shopping information is handled.", section: "Policies" },
  refund: { title: "Returns, Refunds & Cancellation", description: "Review the process and conditions for returns, refunds and cancellations.", section: "Policies" },
};
const offerLinks = [
  ["Coupons", "/offers/coupons", "View and use available coupons."],
  ["Discount Vouchers", "/offers/discount-vouchers", "Browse eligible discount vouchers."],
  ["Rewards", "/offers/rewards", "Explore your rewards and benefits."],
  ["Gift Coupons", "/offers/gift-coupons", "Manage gift coupons."],
  ["Gift Vouchers", "/offers/gift-vouchers", "Browse gift vouchers."],
] as const;
const settingsLinks = [
  ["Themes", "/settings/themes", "Choose your preferred appearance."],
  ["Notification", "/settings/notification", "Manage website notifications."],
  ["Manage Devices", "/settings/manage-devices", "Review devices connected to your account."],
  ["Terms & Policies", "/settings/terms-policies", "Read terms, privacy and policies."],
  ["Feedback", "/settings/feedback", "Share feedback with our team."],
  ["About Us", "/about", "Learn more about Sri Amirthaa Groups."],
] as const;

export default async function StructurePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const route = slug[0] ?? "";
  if (route === "login") return <LoginExperience initialMode="login" />;
  if (route === "signup") return <LoginExperience initialMode="signup" />;
  if (route === "account") return <CustomerDashboard />;
  const info = pages[route] ?? {
    title: slug.map((part) => decodeURIComponent(part).replace(/-/g, " ")).join(" / "),
    description: "This page is part of the website structure. Its complete content and functionality will be added in the design and integration phases.",
    section: "Website",
  };
  const links = route === "offers" ? offerLinks : route === "settings" ? settingsLinks : null;
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(145deg, #f1fff7 0%, #f7fbf8 55%, #eaf8f0 100%)", padding: "28px 18px", color: "#172033" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "10px 0 30px" }}>
          <Link href="/" style={{ fontWeight: 800, letterSpacing: ".04em" }}>1252&#39;s grow with us</Link>
          <Link href="/" style={{ color: "#23804a", fontWeight: 700, fontSize: 14 }}>← Back to Home</Link>
        </header>
        <section style={{ background: "#ffffffdf", border: "1px solid #dcefe3", borderRadius: 24, padding: "clamp(24px, 6vw, 48px)", boxShadow: "0 22px 60px rgba(37,75,50,.08)" }}>
          <span style={{ color: "#23804a", fontSize: 11, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase" }}>{info.section}</span>
          <h1 style={{ fontSize: "clamp(32px, 6vw, 48px)", lineHeight: 1.1, letterSpacing: "-.045em", margin: "14px 0" }}>{info.title}</h1>
          <p style={{ maxWidth: 650, color: "#77877d", lineHeight: 1.8, fontSize: 15 }}>{info.description}</p>
          {links ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginTop: 30 }}>
            {links.map(([label, href, description]) => <Link key={href} href={href} style={{ display: "block", padding: "20px", minHeight: 112, borderRadius: 16, background: "linear-gradient(145deg,#fff,#f3fff7)", border: "1px solid #dcefe3", boxShadow: "0 8px 24px rgba(35,128,74,.07)" }}>
              <strong style={{ display: "block", fontSize: 16, color: "#174b2c" }}>{label}</strong>
              <span style={{ display: "block", marginTop: 8, fontSize: 12, lineHeight: 1.6, color: "#718277" }}>{description}</span>
            </Link>)}
          </div> : <div style={{ marginTop: 30, padding: 18, borderRadius: 15, background: "#f2fbf5", border: "1px solid #dcefe3" }}>
            <strong style={{ display: "block", fontSize: 14 }}>Page structure created</strong>
            <p style={{ margin: "7px 0 0", color: "#77877d", fontSize: 13, lineHeight: 1.7 }}>Live data, secure sign-in, payments and account permissions will be enabled as their integrations are completed.</p>
          </div>}
        </section>
        <footer style={{ color: "#899b90", fontSize: 12, padding: "24px 4px" }}>Buy Grow Joy · Supporting By Sri Amirthaa Groups 1252 · Managing By K² Techtron Team</footer>
      </div>
    </main>
  );
}
