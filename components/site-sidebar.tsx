"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  PanelLeftOpen, PanelLeftClose, Search, Grid2X2, Wallet, Smartphone,
  UserRound, Tag, Heart, Package, ShoppingCart, Store, Handshake, Settings
} from "lucide-react";

const items = [
  { label: "Search Icon", icon: Search, href: "/?search=1", key: "search" },
  { label: "All Categories", icon: Grid2X2, href: "/#categories" },
  { label: "UPI & Wallet", icon: Wallet, href: "/wallet" },
  { label: "Bills & Recharges", icon: Smartphone, href: "/recharge-bills" },
  { label: "My Account", icon: UserRound, href: "/login" },
  { label: "Offers", icon: Tag, href: "/#offers" },
  { label: "Favorite", icon: Heart, href: "/#favorites" },
  { label: "Orders", icon: Package, href: "/login" },
  { label: "Cart", icon: ShoppingCart, href: "/#cart" },
  { label: "Followed Stores", icon: Store, href: "/#stores" },
  { label: "Affiliate Program", icon: Handshake, href: "/#affiliate" },
  { label: "Settings", icon: Settings, href: "/login" },
];

export default function SiteSidebar() {
  const [expanded, setExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const pathname = usePathname();

  function handleItem(label: string, href: string, key?: string) {
    if (key === "search") {
      setSearchOpen((v) => !v);
      if (expanded) setExpanded(true);
      return;
    }
    if (label === "Cart" && pathname === "/") {
      window.dispatchEvent(new CustomEvent("amirthaa:open-cart"));
      return;
    }
    window.location.assign(href);
  }

  return (
    <>
      <div className="site-dust-field" aria-hidden="true">
        {Array.from({ length: 34 }, (_, i) => (
          <i key={i} style={{
            left: ((i * 37 + 11) % 100) + "%",
            top: ((i * 53 + 7) % 100) + "%",
            animationDelay: ((i * 0.37) % 8) + "s",
            animationDuration: (9 + (i % 7) * 2) + "s",
            opacity: 0.22 + (i % 5) * 0.09,
            "--dust-x": (((i * 19) % 90) - 45) + "px",
            "--dust-y": (-35 - (i % 6) * 18) + "px",
          } as React.CSSProperties} />
        ))}
      </div>
      <aside className={`site-sidebar ${expanded ? "is-expanded" : "is-collapsed"}`}>
        <button className="site-sidebar-toggle" type="button" onClick={() => setExpanded(v => !v)} aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"} title={expanded ? "Collapse" : "Expand"}>
          {expanded ? <PanelLeftClose size={19}/> : <PanelLeftOpen size={19}/>}
          {expanded && <span>Expand Button</span>}
        </button>
        {searchOpen && (
          <form className="site-sidebar-search" onSubmit={(e) => { e.preventDefault(); window.location.assign("/?search=" + encodeURIComponent(search) + "#products"); }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" aria-label="Search products"/>
          </form>
        )}
        <nav aria-label="Site navigation">
          {items.map(({ label, icon: Icon, href, key }) => (
            <button key={label} type="button" className={`site-sidebar-item ${(label === "UPI & Wallet" && pathname === "/wallet") ? "active" : ""}`} onClick={() => handleItem(label, href, key)} title={expanded ? undefined : label}>
              <Icon size={19} strokeWidth={1.9}/><span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
