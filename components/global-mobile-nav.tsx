"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { House, Tag, UserRound, Heart, Package } from "lucide-react";

const tabs = [
 { label: "Home", href: "/", icon: House },
 { label: "Offers", href: "/offers", icon: Tag },
 { label: "My Account", href: "/account", icon: UserRound },
 { label: "Favorite", href: "/favorites", icon: Heart },
 { label: "Orders", href: "/orders", icon: Package },
];

function activeTabForPath(path: string) {
 if (path.startsWith("/offers")) return "Offers";
 if (path.startsWith("/account") || path.startsWith("/login") || path.startsWith("/signup") || path.startsWith("/wallet")) return "My Account";
 if (path.startsWith("/favorites")) return "Favorite";
 if (path.startsWith("/orders")) return "Orders";
 return "Home";
}

export default function GlobalMobileNav() {
 const pathname = usePathname();
 const router = useRouter();
 const [flight, setFlight] = useState<{from:number;to:number;key:number}|null>(null);
 const timer = useRef<ReturnType<typeof setTimeout>|null>(null);
 const active = activeTabForPath(pathname);
 useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
 const navigate = (label:string, href:string) => {
  const from = tabs.findIndex(tab => tab.label === active);
  const to = tabs.findIndex(tab => tab.label === label);
  if (from === to) {
   if (href === "/") window.scrollTo({top:0,behavior:"smooth"});
   else if (pathname !== href) router.push(href);
   return;
  }
  if (timer.current) clearTimeout(timer.current);
  setFlight({from,to,key:Date.now()});
  timer.current = setTimeout(() => {
   setFlight(null);
   if (href === "/") {
    if (pathname !== "/") router.push("/");
    else window.scrollTo({top:0,behavior:"smooth"});
   } else if (pathname !== href) router.push(href);
  },2200);
 };
 return <nav className="mobile-bottom-nav" aria-label="Main navigation">
  {flight && <span key={flight.key} className="nav-particle-flight" style={{left:`${10+flight.from*20}%`,["--start" as string]:`${10+flight.from*20}%`,["--to" as string]:`${10+flight.to*20}%`} as React.CSSProperties} aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i}/>)}</span>}
  {tabs.map(({label,href,icon:Icon})=><button key={label} type="button" className={`mobile-bottom-item ${active===label?"active":""}`} onClick={()=>navigate(label,href)} aria-label={label} aria-current={active===label?"page":undefined}><span className="bottom-icon-wrap"><Icon size={20}/>{active===label && <span className="nav-active-sparkles" aria-hidden="true">{Array.from({length:10},(_,i)=><i key={i}/>)}</span>}</span><span className="bottom-label">{label}</span></button>)}
 </nav>;
}
