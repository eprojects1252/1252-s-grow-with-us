"use client";
import { useState } from "react";
import { ArrowLeft, Plus, Layers3, Smartphone, ShieldAlert, Trash2 } from "lucide-react";
import LoginExperience from "@/components/login-experience";

const initial = [
  { name: "Mobiles & Tablets", subs: ["Smartphones", "Tablets", "Accessories"] },
  { name: "Electronics", subs: ["Headphones", "Speakers", "Cameras"] },
  { name: "Fashion – Men", subs: ["Shirts", "T-Shirts", "Footwear"] },
];

export default function AdminDemo() {
  const [adminAuthorized, setAdminAuthorized] = useState(false);
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [sub, setSub] = useState("");
  const [parent, setParent] = useState(initial[0].name);
  const [notice, setNotice] = useState("Demo mode: changes remain in this browser session only.");
  const addCategory = () => {
    if (!name.trim()) return;
    if (items.some(x => x.name.toLowerCase() === name.trim().toLowerCase())) { setNotice("That category already exists."); return; }
    setItems([...items, { name: name.trim(), subs: [] }]); setName(""); setNotice("Category added in demo mode.");
  };
  const addSub = () => {
    if (!sub.trim()) return;
    setItems(items.map(x => x.name === parent ? { ...x, subs: [...x.subs, sub.trim()] } : x)); setSub(""); setNotice("Subcategory added in demo mode.");
  };
  if (!adminAuthorized) return <LoginExperience adminMode onAuthenticated={() => setAdminAuthorized(true)} />;
  return <main className="admin-page"><header className="admin-top"><a href="/" className="back-link"><ArrowLeft size={17}/> Storefront</a><span className="admin-label">SRI AMIRTHAA · ADMIN</span></header><div className="admin-wrap"><span className="eyebrow">STORE MANAGEMENT</span><h1>Admin workspace</h1><p className="admin-intro">Manage your store structure and review the modules planned for the next integration phase.</p><div className="demo-warning"><ShieldAlert/><span><b>Preview only — not secured.</b> Connect Supabase authentication, admin roles and database policies before using this panel in production.</span></div><div className="admin-stats"><div><Layers3/><b>{items.length}</b><span>Demo categories</span></div><div><Smartphone/><b>Manual</b><span>Recharge workflow</span></div></div><section className="admin-card"><h2>Create main category</h2><div className="admin-form"><input value={name} onChange={e => setName(e.target.value)} placeholder="Category name"/><button className="primary-btn" onClick={addCategory}><Plus size={16}/> Add category</button></div></section><section className="admin-card"><h2>Create subcategory</h2><div className="admin-form stacked"><select value={parent} onChange={e => setParent(e.target.value)}>{items.map(x => <option key={x.name}>{x.name}</option>)}</select><input value={sub} onChange={e => setSub(e.target.value)} placeholder="Subcategory name"/><button className="primary-btn" onClick={addSub}><Plus size={16}/> Add subcategory</button></div></section><p className="admin-notice">{notice}</p><section className="admin-card"><h2>Category structure</h2><div className="admin-list">{items.map(x => <div className="admin-category" key={x.name}><div><b>{x.name}</b><span>{x.subs.length} subcategories</span></div><div className="admin-sublist">{x.subs.map(s => <span key={s}>{s}</span>)}</div></div>)}</div></section><section className="admin-card"><h2>Recharge requests</h2><p className="muted">Payment verification, retailer reference, processing status, refunds and activity logs will be connected in the backend phase. No real recharge is processed in this preview.</p></section></div></main>;
}
