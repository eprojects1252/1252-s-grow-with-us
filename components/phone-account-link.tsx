"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getAuth } from "firebase/auth";
import { firebaseApp } from "@/lib/firebase";

export default function PhoneAccountLink() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<import("firebase/auth").ConfirmationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function sendOtp() {
    setMessage(""); setError(false);
    const normalized = phone.replace(/[\\s()-]/g, "");
    if (!/^\\+?[1-9]\\d{7,14}$/.test(normalized)) {
      setError(true); setMessage("Enter a valid phone number with country code, for example +91 9876543210."); return;
    }
    const e164 = normalized.startsWith("+") ? normalized : "+" + normalized;
    setBusy(true);
    try {
      const auth = getAuth(firebaseApp);
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
      const verifier = new RecaptchaVerifier(auth, "account-phone-recaptcha", { size: "invisible" });
      const result = await signInWithPhoneNumber(auth, e164, verifier);
      setConfirmation(result);
      setMessage("OTP sent. Enter the code received on your phone.");
    } catch (e) {
      setError(true); setMessage(e instanceof Error ? e.message : "Could not send OTP.");
    } finally { setBusy(false); }
  }

  async function verifyAndLink() {
    if (!confirmation || otp.length !== 6) { setError(true); setMessage("Enter the 6-digit OTP."); return; }
    setBusy(true); setError(false); setMessage("");
    try {
      const credential = await confirmation.confirm(otp);
      const firebaseIdToken = await credential.user.getIdToken(true);
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) throw new Error("Supabase client configuration is missing.");
      const supabase = createClient(url, key);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error("First sign in with your existing Google or email account, then link your phone here.");
      const response = await fetch("/api/auth/link-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ firebaseIdToken })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Phone linking failed.");
      setMessage("Phone number verified and securely linked to this account.");
      setConfirmation(null); setOtp("");
    } catch (e) {
      setError(true); setMessage(e instanceof Error ? e.message : "Phone verification or linking failed.");
    } finally { setBusy(false); }
  }

  return (
    <section style={{marginBottom:24,padding:20,border:"1px solid #dcefe3",borderRadius:18,background:"#f7fff9"}}>
      <h3 style={{fontSize:17,fontWeight:800,color:"#174b2c"}}>Link your verified mobile number</h3>
      <p style={{fontSize:13,color:"#718277",lineHeight:1.6,margin:"7px 0 14px"}}>Sign in to your existing account first. Then verify your phone with Firebase OTP to link it without creating a duplicate account.</p>
      {!confirmation ? (
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input aria-label="Mobile number with country code" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 9876543210" style={{flex:"1 1 210px",minWidth:0,padding:"11px 12px",border:"1px solid #cfe4d5",borderRadius:10,background:"white"}} />
          <button type="button" disabled={busy} onClick={sendOtp} style={{padding:"11px 16px",borderRadius:10,background:"#176b3a",color:"white",fontWeight:700}}>{busy?"Sending…":"Send OTP"}</button>
        </div>
      ) : (
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input aria-label="Six digit OTP" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\\D/g,"").slice(0,6))} placeholder="6-digit OTP" style={{flex:"1 1 150px",padding:"11px 12px",border:"1px solid #cfe4d5",borderRadius:10,background:"white"}} />
          <button type="button" disabled={busy || otp.length!==6} onClick={verifyAndLink} style={{padding:"11px 16px",borderRadius:10,background:"#176b3a",color:"white",fontWeight:700}}>{busy?"Verifying…":"Verify & Link"}</button>
        </div>
      )}
      {message && <p role="status" style={{fontSize:13,marginTop:12,color:error?"#b42318":"#176b3a"}}>{message}</p>}
      <div id="account-phone-recaptcha" />
    </section>
  );
}
