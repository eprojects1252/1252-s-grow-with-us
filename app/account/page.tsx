"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowLeft, UserRound, MapPin, Wallet, ReceiptText, RefreshCw, ShieldCheck } from "lucide-react";
import { firebaseApp } from "@/lib/firebase";
import { getAuth } from "firebase/auth";

type Address = {
  id: string; label?: string; recipient_name: string; phone_e164?: string | null;
  address_line1: string; address_line2?: string | null; landmark?: string | null;
  city: string; state: string; postal_code: string; country?: string; is_default?: boolean;
};
type Transaction = {
  id: string; transaction_type: string; amount: number; balance_after: number;
  reference_type?: string | null; description?: string | null; created_at: string;
};
type PortalData = {
  identity: { userId: string; phoneNumber?: string | null; email?: string | null; displayName?: string | null };
  profile?: { full_name?: string | null; date_of_birth?: string | null; gender?: string | null } | null;
  addresses: Address[];
  wallet: { balance: number; currency_code: string; updated_at?: string } | null;
  transactions: Transaction[];
};

const auth = getAuth(firebaseApp);
const inr = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(value);

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(current: User) {
    setLoading(true); setError("");
    try {
      const issuer = process.env.NEXT_PUBLIC_SRI_AMIRTHAA_ID_ISSUER || "";
      if (!issuer) throw new Error("Sri Amirthaa ID connection is not configured.");
      const endpoint = issuer.replace(/\\/+$/, "").replace(/\\/[^/]+$/, "/customer-portal");
      const idToken = await current.getIdToken(true);
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        cache: "no-store", body: JSON.stringify({ idToken, action: "load" })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to load your central account details.");
      setData(result as PortalData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load account details.");
    } finally { setLoading(false); }
  }

  useEffect(() => onAuthStateChanged(auth, current => {
    setUser(current);
    if (current) void load(current);
    else { setData(null); setLoading(false); }
  }), []);

  return (
    <main style={{ minHeight: "100vh", background: "#f6f8fc", padding: "32px 18px 72px", color: "#172033" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#667085", fontSize: 13, marginBottom: 22 }}><ArrowLeft size={16}/> Back to store</Link>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
          <div><div style={{ color: "#7467cf", fontSize: 10, fontWeight: 800, letterSpacing: 2 }}>SRI AMIRTHAA ID · CUSTOMER SPACE</div><h1 style={{ margin: "7px 0 4px", fontSize: 30 }}>My Account</h1><p style={{ margin: 0, color: "#7b8497", fontSize: 13 }}>Your profile, saved addresses and shared wallet in one place.</p></div>
          {user && <button onClick={() => void load(user)} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid #e2e7f0", borderRadius: 12, background: "#fff", padding: "10px 13px", color: "#43506a", fontWeight: 700 }}><RefreshCw size={15}/> Refresh</button>}
        </header>
        {loading ? <section style={card}><p>Loading your secure Sri Amirthaa ID details…</p></section> : !user ? <section style={card}><h2>Sign in to view your account</h2><p style={muted}>Use your existing Sri Amirthaa ID. Admin and customer accounts use the same sign-in page.</p><Link href="/login" style={primary}>Continue to sign in</Link></section> : error ? <section style={card}><p style={{ color: "#b42318" }}>{error}</p><button onClick={() => void load(user)} style={primary}>Try again</button></section> : data ? <>
          <section style={{ ...card, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16 }}>
            <div><div style={eyebrow}><UserRound size={15}/> PERSONAL PROFILE</div><h2 style={heading}>{data.profile?.full_name || data.identity.displayName || "Sri Amirthaa User"}</h2><p style={muted}>{data.identity.email || "Email not available"}</p><p style={muted}>{data.identity.phoneNumber || "Phone not available"}</p></div>
            <div style={{ borderLeft: "1px solid #edf0f5", paddingLeft: 18 }}><div style={eyebrow}><Wallet size={15}/> CENTRAL WALLET</div><div style={{ fontSize: 30, fontWeight: 850, marginTop: 12 }}>{inr(Number(data.wallet?.balance || 0))}</div><p style={muted}>Shared Sri Amirthaa Wallet balance</p><span style={{ fontSize: 11, color: "#16845b", display: "inline-flex", alignItems: "center", gap: 5 }}><ShieldCheck size={13}/> Core Wallet Ledger</span></div>
          </section>
          <section style={card}><div style={eyebrow}><MapPin size={15}/> SAVED ADDRESSES · CORE ID</div>
            {data.addresses.length ? data.addresses.map(a => <article key={a.id} style={{ padding: "15px 0", borderBottom: "1px solid #edf0f5" }}><div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><b>{a.label || "Address"}</b>{a.is_default && <span style={tag}>Default</span>}</div><p style={{ ...muted, color: "#46536a", lineHeight: 1.7 }}>{a.recipient_name}<br/>{a.address_line1}{a.address_line2 ? ", "+a.address_line2 : ""}{a.landmark ? ", "+a.landmark : ""}<br/>{a.city}, {a.state} - {a.postal_code}<br/>{a.country || "India"}{a.phone_e164 ? " · "+a.phone_e164 : ""}</p></article>) : <p style={muted}>No saved address is linked to this Sri Amirthaa ID yet.</p>}
          </section>
          <section style={card}><div style={eyebrow}><ReceiptText size={15}/> WALLET LEDGER · LATEST TRANSACTIONS</div>
            {data.transactions.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}><thead><tr>{["Date","Description","Type","Amount","Balance after"].map(x=><th key={x} style={th}>{x}</th>)}</tr></thead><tbody>{data.transactions.map(t=><tr key={t.id}><td style={td}>{new Date(t.created_at).toLocaleString("en-IN")}</td><td style={td}>{t.description || t.reference_type || "Wallet transaction"}</td><td style={td}>{t.transaction_type}</td><td style={td}>{inr(Number(t.amount))}</td><td style={td}>{inr(Number(t.balance_after))}</td></tr>)}</tbody></table></div> : <p style={muted}>No wallet transactions yet. Your balance is {inr(Number(data.wallet?.balance || 0))}.</p>}
          </section>
        </> : null}
        <p style={{ color: "#98a1b2", fontSize: 11, textAlign: "center", marginTop: 22 }}>Your account data is loaded from the central Sri Amirthaa ID service and scoped to your signed-in identity.</p>
      </div>
    </main>
  );
}

const card: React.CSSProperties = { background: "#fff", border: "1px solid #e7ebf2", borderRadius: 20, padding: 22, marginBottom: 16, boxShadow: "0 12px 35px #17203308" };
const muted: React.CSSProperties = { color: "#8490a3", fontSize: 13, lineHeight: 1.6 };
const eyebrow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 7, color: "#7467cf", fontSize: 10, fontWeight: 850, letterSpacing: 1.2 };
const heading: React.CSSProperties = { fontSize: 20, margin: "12px 0 5px" };
const primary: React.CSSProperties = { display: "inline-flex", border: 0, borderRadius: 12, background: "#6357d5", color: "#fff", padding: "12px 17px", fontWeight: 800, marginTop: 8 };
const tag: React.CSSProperties = { background: "#eaf8f1", color: "#16845b", padding: "4px 8px", borderRadius: 20, fontSize: 10, fontWeight: 800 };
const th: React.CSSProperties = { textAlign: "left", color: "#7a8496", fontSize: 11, padding: "12px 10px", borderBottom: "1px solid #e9edf4" };
const td: React.CSSProperties = { padding: "13px 10px", fontSize: 12, borderBottom: "1px solid #f0f2f6", whiteSpace: "nowrap" };
