"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserRound, Tag, CreditCard, MapPin, Wallet, Heart, ShoppingCart,
  Package, Store, Headset, TrendingUp, Settings, ChevronRight, ArrowUpRight
} from "lucide-react";

const sections = [
  { id: "account-details", title: "Account details", icon: UserRound, items: ["Name", "Age & Gender", "Email", "Phone number", "Address", "Refer & Earn"] },
  { id: "offers-coupons", title: "Offers & Coupon", icon: Tag, items: [] },
  { id: "payments", title: "My Payments", icon: CreditCard, items: ["Credit card payments", "Bank details", "UPI details", "Payments History", "Refunds", "Cancellations"] },
  { id: "saved-address", title: "Saved Address", icon: MapPin, items: [] },
  { id: "wallet", title: "1252 Wallet", icon: Wallet, items: ["Gift Cards", "Buy Gift Card", "Gift Gift Card", "1252's Pay Later"] },
  { id: "wishlist", title: "Wishlisted Products", icon: Heart, items: [] },
  { id: "cart", title: "My cart", icon: ShoppingCart, items: [] },
  { id: "orders", title: "Orders", icon: Package, items: [] },
  { id: "followed-shops", title: "Followed shops", icon: Store, items: [] },
  { id: "dsp-to-us", title: "DSP to us", icon: Headset, items: [] },
  { id: "grow-earn", title: "Grow & Earn with Us", icon: TrendingUp, items: ["Affiliate Program", "Sell on 1252's Grow with us", "To Claim Francis"] },
  { id: "settings", title: "Settings", icon: Settings, items: ["FAQ", "Terms & Conditions", "Legal Policies", "Privacy Policy", "Affiliate Policy", "Return Policy", "Refund Policy", "About Us", "De-activate my Account", "Delete my Account"] },
] as const;

const routeFor = (label: string) => {
  const routes: Record<string, string> = {
    "Offers & Coupon": "/offers",
    "Saved Address": "/account",
    "Wishlisted Products": "/favorites",
    "My cart": "/cart",
    "Orders": "/orders",
    "FAQ": "/faq",
    "Terms & Conditions": "/terms",
    "Privacy Policy": "/privacy",
    "Return Policy": "/refund",
    "Refund Policy": "/refund",
    "About Us": "/about",
  };
  return routes[label];
};

export default function CustomerDashboard() {
  const [active, setActive] = useState<string>("account-details");
  const current = sections.find(section => section.id === active) ?? sections[0];
  const Icon = current.icon;

  return (
    <main className="customer-dashboard">
      <header className="customer-dash-header">
        <div><span className="customer-dash-kicker">1252'S GROW WITH US</span><h1>My Account</h1><p>Your account, shopping and membership space.</p></div>
        <Link href="/" className="customer-dash-shop-link">Continue Shopping <ArrowUpRight size={15}/></Link>
      </header>

      <div className="customer-dash-layout">
        <aside className="customer-dash-sidebar" aria-label="Customer account menu">
          <div className="customer-dash-profile"><span className="customer-dash-avatar"><UserRound size={23}/></span><div><small>WELCOME</small><strong>My Account</strong></div></div>
          <nav>
            {sections.map(section => {
              const ItemIcon = section.icon;
              return <button key={section.id} type="button" className={active === section.id ? "customer-dash-nav active" : "customer-dash-nav"} onClick={() => setActive(section.id)}>
                <ItemIcon size={17}/><span>{section.title}</span><ChevronRight size={15}/>
              </button>;
            })}
          </nav>
        </aside>

        <section className="customer-dash-content">
          <div className="customer-dash-section-title"><span className="customer-dash-section-icon"><Icon size={20}/></span><div><small>ACCOUNT MENU</small><h2>{current.title}</h2></div></div>
          {current.id === "account-details" ? (
            <div className="customer-dash-grid">
              {current.items.map((item, index) => <article className="customer-dash-tile" key={item}><span className="customer-dash-number">0{index + 1}</span><strong>{item}</strong><small>{item === "Refer & Earn" ? "Referral programme" : "Profile information"}</small></article>)}
            </div>
          ) : current.items.length ? (
            <div className="customer-dash-list">
              {current.items.map(item => {
                const href = routeFor(item);
                return href ? <Link className="customer-dash-row" href={href} key={item}><span>{item}</span><ChevronRight size={17}/></Link>
                  : <button className="customer-dash-row" type="button" key={item} onClick={() => {}}><span>{item}</span><ChevronRight size={17}/></button>;
              })}
            </div>
          ) : (
            <div className="customer-dash-empty"><span className="customer-dash-empty-icon"><Icon size={25}/></span><h3>{current.title}</h3><p>This section is ready for its next development phase.</p></div>
          )}
          <p className="customer-dash-footnote">Account services and secure data will be connected during the Sri Amirthaa ID integration phase.</p>
        </section>
      </div>
    </main>
  );
}
