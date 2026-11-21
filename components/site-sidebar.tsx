"use client";

import { useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search, WalletCards, ReceiptText,
  UserRound, BadgePercent, Heart, ClipboardList, SlidersHorizontal, Store
} from "lucide-react";


function StoresNetworkIcon(props: {size?:number;strokeWidth?:number}) {
  return <svg width={props.size ?? 20} height={props.size ?? 20} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth={props.strokeWidth ?? 1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18 5.5 11h11L19 18v2a3.2 3.2 0 0 1-6 1.5A3.2 3.2 0 0 1 7 21.5 3.2 3.2 0 0 1 3 20z"/>
      <path d="M6 23v13h10V23M9 36v-7h4v7"/>
      <path d="m29 18 2.5-7h11l2.5 7v2a3.2 3.2 0 0 1-6 1.5 3.2 3.2 0 0 1-6 0 3.2 3.2 0 0 1-4-1.5z"/>
      <path d="M32 23v13h10V23M35 36v-7h4v7"/>
      <path d="m15 17 2.5-9h13l2.5 9v3a4 4 0 0 1-7.5 2 4 4 0 0 1-7.5 0A4 4 0 0 1 15 20z"/>
      <path d="M18 23v19h13V23M22 42V30h5v12"/>
      <path d="M16 27h-3m22 0h3M14 39h-3m26 0h-3"/>
    </g>
    <circle cx="24.5" cy="5" r="1.5" fill="currentColor"/>
  </svg>;
}

function CategoryOrbitIcon(props: {size?:number;strokeWidth?:number}) {
  return <svg width={props.size ?? 19} height={props.size ?? 19} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="9" stroke="currentColor" strokeWidth="2.2"/>
    <circle cx="24" cy="5.5" r="3" fill="#eabf42"/><circle cx="37.2" cy="10.8" r="3" fill="#e99b37"/>
    <circle cx="42.5" cy="24" r="3" fill="#df694c"/><circle cx="37.2" cy="37.2" r="3" fill="#c85b70"/>
    <circle cx="24" cy="42.5" r="3" fill="#a34d70"/><circle cx="10.8" cy="37.2" r="3" fill="#6d63a8"/>
    <circle cx="5.5" cy="24" r="3" fill="#327f9c"/><circle cx="10.8" cy="10.8" r="3" fill="#239b87"/>
    <path d="M24 1.5a22.5 22.5 0 0 1 19.2 10.8M46.5 24a22.5 22.5 0 0 1-10.8 19.2M24 46.5A22.5 22.5 0 0 1 4.8 35.7M1.5 24A22.5 22.5 0 0 1 12.3 4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2.5 3.5"/>
  </svg>;
}
function CartLineIcon(props: {size?:number;strokeWidth?:number}) {
  return <svg width={props.size ?? 19} height={props.size ?? 19} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M5 8h5l4.2 23.1a3.5 3.5 0 0 0 3.4 2.9h19.1a3.5 3.5 0 0 0 3.4-2.7L44 16H12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 20h23M18.5 26h20M21 16l1.2 15M32 16l-1 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="19" cy="40" r="3" stroke="currentColor" strokeWidth="2.2"/><circle cx="36" cy="40" r="3" stroke="currentColor" strokeWidth="2.2"/>
    <path d="M17 13.5 16 8.5h9l2 5M29 13.5l2-5h8l-1 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function AffiliateNetworkIcon(props: {size?:number;strokeWidth?:number}) {
  return <svg width={props.size ?? 19} height={props.size ?? 19} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <circle cx="21" cy="17" r="8" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M7 39c.8-7 5.8-11 14-11 4.1 0 7.4 1 10 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="m27 24 7-5m-6 10 7 5M17 28l-5 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    <circle cx="38" cy="16" r="5" stroke="currentColor" strokeWidth="2.2"/>
    <circle cx="39" cy="37" r="5" stroke="currentColor" strokeWidth="2.2"/>
    <circle cx="7" cy="40" r="4" stroke="currentColor" strokeWidth="2.2"/>
  </svg>;
}

const items = [
  { label: "Search", icon: Search, href: "/?search=1", key: "search" },
  { label: "All Categories", icon: CategoryOrbitIcon, href: "/#categories" },
  { label: "UPI & Wallet", icon: WalletCards, href: "/wallet" },
  { label: "Bills & Recharges", icon: ReceiptText, href: "/recharge-bills" },
  { label: "My Account", icon: UserRound, href: "/login" },
  { label: "Offers", icon: BadgePercent, href: "/#offers" },
  { label: "Favorite", icon: Heart, href: "/#favorites" },
  { label: "Orders", icon: ClipboardList, href: "/login" },
  { label: "Cart", icon: CartLineIcon, href: "/#cart" },
  { label: "Followed Stores", icon: Store, href: "/#stores" },
  { label: "Affiliate Program", icon: AffiliateNetworkIcon, href: "/#affiliate" },
  { label: "Settings", icon: SlidersHorizontal, href: "/login" },
  { label: "Stores", icon: StoresNetworkIcon, href: "/stores" },
];

export default function SiteSidebar() {
  const [expanded, setExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [trail, setTrail] = useState<{x:number;y:number;dx:number;dy:number;key:number}|null>(null);
  const swipeStart = useRef<{x:number;y:number}|null>(null);
  const suppressClick = useRef(false);
  const pathname = usePathname();

  function handleItem(label: string, href: string, key?: string, target?: HTMLButtonElement) {
    if (key === "search") {
      setSearchOpen((v) => !v);
      return;
    }
    setSearchOpen(false);
    const source = document.querySelector<HTMLButtonElement>(".site-sidebar-item.active") || document.querySelector<HTMLButtonElement>(".site-sidebar-item");
    if (source && target) {
      const a = source.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      setTrail({ x: a.left + a.width / 2, y: a.top + a.height / 2, dx: b.left + b.width / 2 - (a.left + a.width / 2), dy: b.top + b.height / 2 - (a.top + a.height / 2), key: Date.now() });
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
          } as CSSProperties} />
        ))}
      </div>
      {trail && <div className="site-dust-trail" key={trail.key} aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => <i key={i} style={{
          left: trail.x + "px", top: trail.y + "px",
          "--trail-x": (trail.dx + Math.cos(i * 0.9) * 24) + "px",
          "--trail-y": (trail.dy + Math.sin(i * 0.9) * 24) + "px",
          animationDelay: (i * 18) + "ms",
        } as CSSProperties}/>)}
      </div>}
      <aside
        className={`site-sidebar ${expanded ? "is-expanded" : "is-collapsed"} ${searchOpen ? "has-search-open" : ""}`}
        onPointerDown={(event) => { swipeStart.current = { x: event.clientX, y: event.clientY }; }}
        onPointerUp={(event) => {
          if (!swipeStart.current) return;
          const dx = event.clientX - swipeStart.current.x;
          const dy = event.clientY - swipeStart.current.y;
          swipeStart.current = null;
          if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) {
            suppressClick.current = true;
            setExpanded(dx > 0);
          }
        }}
        onClickCapture={(event) => {
          if (suppressClick.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
      >
        <button className="site-sidebar-brand" type="button" aria-label="Grow With Us sidebar" title="Swipe right to expand; swipe left to collapse">
          <img src="/images/grow-with-us-logo.png" alt="1252's Grow With Us" />
        </button>
        <nav aria-label="Site navigation">
          {items.map(({ label, icon: Icon, href, key }) => (
            <button key={label} type="button" className={`site-sidebar-item ${label === "Stores" ? "site-sidebar-stores-item" : ""} ${(label === "UPI & Wallet" && pathname === "/wallet") ? "active" : ""}`} onClick={(event) => { event.stopPropagation(); handleItem(label, href, key, event.currentTarget); }} title={expanded ? undefined : label} aria-expanded={key === "search" ? searchOpen : undefined}>
              <Icon size={19} strokeWidth={1.9}/><span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
      {searchOpen && (
        <form className="site-sidebar-search" role="search" aria-label="Full screen product search" onSubmit={(e) => { e.preventDefault(); window.location.assign("/?search=" + encodeURIComponent(search) + "#products"); }}>
          <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" aria-label="Search products"/>
          <button type="submit" aria-label="Submit search"><Search size={17}/></button>
        </form>
      )}
    </>
  );
}
