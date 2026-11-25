"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Store, Wallet, RefreshCw, LogOut } from "lucide-react";

type StoreInfo = { id:string; store_code:string; store_name:string; status:string; role:string };
const url = process.env.NEXT_PUBLIC_SUPABASE_ECOMMERCE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ECOMMERCE_PUBLISHABLE_KEY || "";
const supabase = url && key ? createClient(url,key) : null;

export default function PartnerStorePage() {
  const [stores,setStores] = useState<StoreInfo[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!supabase) throw new Error("Store login is not configured.");
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session?.access_token) throw new Error("Your session expired. Please sign in again.");
        const response = await fetch("/api/store/workspace",{headers:{Authorization:"Bearer "+data.session.access_token},cache:"no-store"});
        const body = await response.json().catch(()=>({}));
        if (!response.ok) throw new Error(body.error || "Unable to open your Store workspace.");
        if (active) setStores(Array.isArray(body.stores)?body.stores:[]);
      } catch (e) { if (active) setError(e instanceof Error?e.message:"Unable to load Store workspace."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  },[]);
  async function signOut() { if (supabase) await supabase.auth.signOut(); window.location.assign("/login"); }
  return <main style={{minHeight:"100vh",background:"#f5f8f6",padding:"28px 16px",color:"#183b30"}}>
    <div style={{maxWidth:980,margin:"0 auto"}}>
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><Store size={26}/><div><b>Partner Store Workspace</b><div style={{fontSize:12,color:"#71847a"}}>Sri Amirthaa ID · Shared account</div></div></div>
        <div style={{display:"flex",gap:8}}><Link href="/wallet" style={{padding:"10px 13px",borderRadius:10,background:"#e5f2eb",color:"#176b4d",textDecoration:"none",fontWeight:700,fontSize:13,display:"flex",gap:7,alignItems:"center"}}><Wallet size={16}/> Shared Wallet</Link><button onClick={signOut} style={{padding:"10px 13px",borderRadius:10,border:"1px solid #dce5e0",background:"#fff",color:"#315b49",display:"flex",gap:7,alignItems:"center"}}><LogOut size={16}/> Sign out</button></div>
      </header>
      {loading?<p>Loading your Store workspace…</p>:error?<section style={{padding:20,background:"#fff0ed",borderRadius:12,color:"#9a392b"}}>{error}<p><Link href="/login">Return to sign in</Link></p></section>:<><h1 style={{fontSize:28,margin:"0 0 8px"}}>Your assigned Stores</h1><p style={{color:"#71847a",fontSize:13,marginBottom:20}}>Use your normal Sri Amirthaa ID login. Your Store access is controlled by Admin-assigned membership.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>{stores.map(s=><section key={s.id} style={{background:"#fff",border:"1px solid #e4ece7",borderRadius:16,padding:20}}><Store color="#176b4d"/><h2 style={{fontSize:19,margin:"12px 0 5px"}}>{s.store_name}</h2><p style={{fontSize:13,color:"#71847a"}}>Store ID: <b style={{color:"#176b4d"}}>{s.store_code}</b></p><p style={{fontSize:12,color:"#71847a"}}>Your role: {s.role}</p><span style={{fontSize:11,color:"#23744e",fontWeight:700}}>ACTIVE</span></section>)}</div></>}
      <footer style={{marginTop:28,fontSize:12,color:"#87968e"}}><Link href="/account">Customer Account</Link> · Store inventory, order and staff modules will be enabled as each Partner Store workflow is connected.</footer>
    </div>
  </main>;
}
