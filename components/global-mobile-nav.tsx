"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, House, Tag, UserRound, Heart, Package, Grid2X2, Zap, Monitor, Shirt, Home as HomeIcon, LogIn } from "lucide-react";

const items = [
  { label: "Home", href: "/", icon: House },
  { label: "All Categories", href: "/#categories", icon: Grid2X2 },
  { label: "Recharge & Bills", href: "/#recharge", icon: Zap },
  { label: "Electronics", href: "/?category=Electronics#products", icon: Monitor },
  { label: "Fashion", href: "/?category=Fashion#products", icon: Shirt },
  { label: "Home Appliances", href: "/?category=Home%20Appliances#products", icon: HomeIcon },
  { label: "Admin Demo", href: "/admin", icon: LogIn },
  { label: "Offers", href: "/offers", icon: Tag },
  { label: "My Account", href: "/account", icon: UserRound },
  { label: "Favorite", href: "/favorites", icon: Heart },
  { label: "Orders", href: "/orders", icon: Package },
];

export default function GlobalMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  return (
    <aside className={`global-store-sidebar ${expanded ? "global-store-sidebar-expanded" : ""}`} aria-label="Store navigation">
      <button className="global-sidebar-expand" type="button" onClick={() => setExpanded(v => !v)} aria-label={expanded ? "Collapse menu" : "Expand menu"} title={expanded ? "Collapse menu" : "Expand menu"}>
        {expanded ? <PanelLeftClose size={19}/> : <PanelLeftOpen size={19}/>}
        <span>{expanded ? "Collapse" : "Expand menu"}</span>
      </button>
      <nav className="global-sidebar-links">
        {items.map(({label,href,icon:Icon}) => {
          const basePath = href.startsWith("/?") || href.startsWith("/#") ? "/" : href.split(/[?#]/)[0];
          const active = pathname === basePath;
          return <button key={label} type="button" className={`global-sidebar-link ${active ? "is-active" : ""}`} onClick={() => href.includes("#") ? (router.push(href), href.includes("#products") && setTimeout(() => document.getElementById("products")?.scrollIntoView({behavior:"smooth"}),150)) : router.push(href)} aria-label={label} title={label}>
            <Icon size={20}/><span>{label}</span><i>{label}</i>
          </button>;
        })}
      </nav>
    </aside>
  );
}
