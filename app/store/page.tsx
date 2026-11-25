"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Store, Wallet, LogOut, Package, RefreshCw, Save } from "lucide-react";

type StoreInfo = { id:string; store_code:string; store_name:string; status:string; role:string };
type CatalogProduct = { id:string; name:string; sku:string|null; brand:string|null; price:number; gst_rate:number; hsn_code:string|null };
type InventoryItem = { id:string; product_id:string; store_sku:string|null; price:number; stock_quantity:number; is_active:boolean; updated_at:string; products:CatalogProduct };
const url = process.env.NEXT_PUBLIC_SUPABASE_ECOMMERCE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ECOMMERCE_PUBLISHABLE_KEY || "";
const supabase = url && key ? createClient(url,key) : null;
const field:React.CSSProperties={width:"100%",height:42,border:"1px solid #dce7e0",borderRadius:9,padding:"0 11px",background:"#fff",color:"#183b30",boxSizing:"border-box"};

export default function PartnerStorePage() {
  const [stores,setStores] = useState<StoreInfo[]>([]);
  const [selectedStoreId,setSelectedStoreId] = useState("");
  const [inventory,setInventory] = useState<InventoryItem[]>([]);
  const [catalog,setCatalog] = useState<CatalogProduct[]>([]);
  const [productId,setProductId] = useState("");
  const [storeSku,setStoreSku] = useState("");
  const [price,setPrice] = useState("");
  const [stock,setStock] = useState("0");
  const [loading,setLoading] = useState(true);
  const [inventoryLoading,setInventoryLoading] = useState(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");

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
        if (active) {
          const list = Array.isArray(body.stores)?body.stores:[];
          setStores(list);
          if (list[0]?.id) setSelectedStoreId(list[0].id);
        }
      } catch (e) { if (active) setError(e instanceof Error?e.message:"Unable to load Store workspace."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  },[]);

  useEffect(() => {
    let active = true;
    if (!selectedStoreId || !supabase) return;
    setInventoryLoading(true);
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error("Your session expired. Please sign in again.");
        const response = await fetch("/api/store/inventory?storeId="+encodeURIComponent(selectedStoreId),{headers:{Authorization:"Bearer "+token},cache:"no-store"});
        const body = await response.json().catch(()=>({}));
        if (!response.ok) throw new Error(body.error || "Unable to load Store inventory.");
        if (active) { setInventory(body.inventory||[]); setCatalog(body.catalog||[]); }
      } catch (e) { if (active) setError(e instanceof Error?e.message:"Unable to load inventory."); }
      finally { if (active) setInventoryLoading(false); }
    })();
    return () => { active = false; };
  },[selectedStoreId]);

  const currentStore = stores.find(s=>s.id===selectedStoreId);
  const canManage = currentStore ? ["owner","admin"].includes(currentStore.role) : false;
  const selectedProduct = catalog.find(p=>p.id===productId);
  function chooseProduct(id:string) {
    setProductId(id);
    const existing = inventory.find(item=>item.product_id===id);
    const product = catalog.find(item=>item.id===id);
    setStoreSku(existing?.store_sku || product?.sku || "");
    setPrice(String(existing?.price ?? product?.price ?? ""));
    setStock(String(existing?.stock_quantity ?? 0));
  }
  async function saveInventory(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");setNotice("");
    if (!supabase || !selectedStoreId || !productId) return;
    setSaving(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token=data.session?.access_token;
      if(!token) throw new Error("Your session expired. Please sign in again.");
      const response=await fetch("/api/store/inventory",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},cache:"no-store",body:JSON.stringify({storeId:selectedStoreId,productId,storeSku,price:Number(price),stockQuantity:Number(stock)})});
      const body=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(body.error||"Unable to save inventory.");
      setNotice("Store inventory saved.");
      const refresh=await fetch("/api/store/inventory?storeId="+encodeURIComponent(selectedStoreId),{headers:{Authorization:"Bearer "+token},cache:"no-store"});
      const refreshed=await refresh.json().catch(()=>({}));
      if(refresh.ok){setInventory(refreshed.inventory||[]);setCatalog(refreshed.catalog||[]);}
    } catch(e) {setError(e instanceof Error?e.message:"Unable to save inventory.");}
    finally {setSaving(false);}
  }
  async function signOut() { if (supabase) await supabase.auth.signOut(); window.location.assign("/login"); }

  return <main style={{minHeight:"100vh",background:"#f5f8f6",padding:"28px 16px",color:"#183b30"}}>
    <div style={{maxWidth:1040,margin:"0 auto"}}>
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><Store size={26}/><div><b>Partner Store Workspace</b><div style={{fontSize:12,color:"#71847a"}}>Sri Amirthaa ID · Shared account</div></div></div>
        <div style={{display:"flex",gap:8}}><Link href="/wallet" style={{padding:"10px 13px",borderRadius:10,background:"#e5f2eb",color:"#176b4d",textDecoration:"none",fontWeight:700,fontSize:13,display:"flex",gap:7,alignItems:"center"}}><Wallet size={16}/> Shared Wallet</Link><button onClick={signOut} style={{padding:"10px 13px",borderRadius:10,border:"1px solid #dce5e0",background:"#fff",color:"#315b49",display:"flex",gap:7,alignItems:"center"}}><LogOut size={16}/> Sign out</button></div>
      </header>
      {loading?<p>Loading your Store workspace…</p>:error&&!stores.length?<section style={{padding:20,background:"#fff0ed",borderRadius:12,color:"#9a392b"}}>{error}<p><Link href="/login">Return to sign in</Link></p></section>:<>
        <h1 style={{fontSize:28,margin:"0 0 8px"}}>Your Partner Store</h1>
        <p style={{color:"#71847a",fontSize:13,marginBottom:18}}>Use your normal Sri Amirthaa ID login. Your access is controlled by Admin-assigned Store membership.</p>
        <section style={{background:"#fff",border:"1px solid #e4ece7",borderRadius:14,padding:16,marginBottom:16,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
          <label style={{fontSize:12,fontWeight:700}}>Select Store</label>
          <select value={selectedStoreId} onChange={e=>{setSelectedStoreId(e.target.value);setProductId("");}} style={{...field,maxWidth:340,flex:1}}>{stores.map(s=><option key={s.id} value={s.id}>{s.store_name} · {s.store_code}</option>)}</select>
          {currentStore&&<span style={{fontSize:12,color:"#23744e",fontWeight:700}}>{currentStore.role.toUpperCase()}</span>}
        </section>
        {currentStore&&<section style={{background:"#eaf5ee",borderRadius:12,padding:14,marginBottom:18,fontSize:12,color:"#416b55"}}><b>{currentStore.store_name}</b> · Store ID: <strong>{currentStore.store_code}</strong> · {currentStore.status.toUpperCase()}<p style={{margin:"5px 0 0"}}>Products and stock below are specific to this Store. Wallet remains shared across all connected Stores.</p></section>}
        {canManage&&<form onSubmit={saveInventory} style={{background:"#fff",border:"1px solid #e4ece7",borderRadius:16,padding:18,marginBottom:18}}>
          <h2 style={{fontSize:17,margin:"0 0 14px",display:"flex",alignItems:"center",gap:8}}><Package size={19}/> Add / update Store inventory</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
            <label style={{fontSize:11,color:"#71847a"}}>Product from central catalogue<select required value={productId} onChange={e=>chooseProduct(e.target.value)} style={{...field,display:"block",marginTop:5}}><option value="">Select product</option>{catalog.map(p=><option key={p.id} value={p.id}>{p.name}{p.sku?" · "+p.sku:""}</option>)}</select></label>
            <label style={{fontSize:11,color:"#71847a"}}>Store SKU<input value={storeSku} onChange={e=>setStoreSku(e.target.value)} maxLength={100} placeholder="Optional Store SKU" style={{...field,display:"block",marginTop:5}}/></label>
            <label style={{fontSize:11,color:"#71847a"}}>Store price (₹)<input required type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} style={{...field,display:"block",marginTop:5}}/></label>
            <label style={{fontSize:11,color:"#71847a"}}>Available stock<input required type="number" min="0" step="1" value={stock} onChange={e=>setStock(e.target.value)} style={{...field,display:"block",marginTop:5}}/></label>
          </div>
          {selectedProduct&&<p style={{fontSize:11,color:"#71847a",margin:"10px 0 0"}}>Central catalogue: {selectedProduct.name} · GST {selectedProduct.gst_rate}% · HSN {selectedProduct.hsn_code||"Not set"}</p>}
          <button disabled={saving||!productId} style={{marginTop:13,height:40,padding:"0 15px",border:0,borderRadius:9,background:"#176b4d",color:"#fff",fontWeight:700,display:"inline-flex",alignItems:"center",gap:7}}><Save size={15}/>{saving?"Saving…":"Save Store Inventory"}</button>
        </form>}
        {error&&<p role="alert" style={{padding:12,background:"#fff0ed",borderRadius:10,color:"#a13d34",fontSize:12}}>{error}</p>}
        {notice&&<p role="status" style={{padding:12,background:"#eaf5ee",borderRadius:10,color:"#23744e",fontSize:12}}>{notice}</p>}
        <section style={{background:"#fff",border:"1px solid #e4ece7",borderRadius:16,padding:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:12}}><h2 style={{fontSize:17,margin:0,display:"flex",alignItems:"center",gap:8}}><Package size={18}/> Store Inventory</h2><button onClick={()=>setSelectedStoreId(id=>id)} style={{height:34,padding:"0 10px",border:"1px solid #dce7e0",borderRadius:8,background:"#fff",color:"#315b49",display:"flex",alignItems:"center",gap:6}}><RefreshCw size={14}/> Refresh</button></div>
          {inventoryLoading?<p style={{fontSize:12,color:"#71847a"}}>Loading inventory…</p>:inventory.length===0?<p style={{fontSize:12,color:"#71847a"}}>No products have been assigned to this Store yet. Choose products from the central catalogue above.</p>:<div style={{display:"grid",gap:9}}>{inventory.map(item=><article key={item.id} style={{border:"1px solid #edf1ee",borderRadius:12,padding:13,display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><b style={{fontSize:13}}>{item.products?.name||"Product"}</b><div style={{fontSize:11,color:"#71847a",marginTop:4}}>SKU: {item.store_sku||item.products?.sku||"—"} · GST: {item.products?.gst_rate??0}%</div></div><div style={{textAlign:"right"}}><b style={{fontSize:13}}>₹{Number(item.price).toLocaleString("en-IN",{maximumFractionDigits:2})}</b><div style={{fontSize:11,color:Number(item.stock_quantity)>0?"#23744e":"#a13d34",marginTop:4}}>Stock: {item.stock_quantity}</div></div></article>)}</div>}
        </section>
        <footer style={{marginTop:22,fontSize:12,color:"#87968e"}}><Link href="/account">Customer Account</Link> · Store inventory is isolated by Store ID. Order checkout integration will use the selected Store once storefront tenancy is enabled.</footer>
      </>}
    </div>
  </main>;
}
