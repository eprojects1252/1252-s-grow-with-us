"use client";

import { useEffect, useRef, useState } from "react";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { firebaseApp } from "@/lib/firebase";

export default function SriAmirthaaIdLogin() {
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const verifier = useRef<RecaptchaVerifier | null>(null);
  const recaptcha = useRef<HTMLDivElement>(null);

  useEffect(() => () => { verifier.current?.clear(); verifier.current = null; }, []);

  async function sendOtp() {
    setMessage("");
    const normalized = phone.replace(/[\s()-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
      setMessage("Enter a valid phone number with country code.");
      return;
    }
    setBusy(true);
    try {
      const auth = getAuth(firebaseApp);
      verifier.current?.clear();
      verifier.current = null;
      if (!recaptcha.current) throw new Error("Security check is unavailable. Refresh and try again.");
      recaptcha.current.replaceChildren();
      const nextVerifier = new RecaptchaVerifier(auth, recaptcha.current, { size: "invisible" });
      verifier.current = nextVerifier;
      await nextVerifier.render();
      const result = await signInWithPhoneNumber(auth, normalized, nextVerifier);
      setConfirmation(result);
      setMessage("OTP sent. Enter the 6-digit code received on your phone.");
    } catch (error) {
      verifier.current?.clear();
      verifier.current = null;
      setMessage(error instanceof Error ? error.message : "Unable to send OTP.");
    } finally { setBusy(false); }
  }

  async function verifyAndContinue() {
    if (!confirmation || !/^\d{6}$/.test(code)) {
      setMessage("Enter the 6-digit OTP.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const credential = await confirmation.confirm(code);
      const firebaseIdToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/auth/sri-amirthaa/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ firebaseIdToken })
      });
      const result = await response.json();
      if (!response.ok || typeof result.authorizationUrl !== "string") {
        throw new Error(result.error || "Sri Amirthaa ID sign-in could not start.");
      }
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Phone verification failed.");
      setBusy(false);
    }
  }

  return (
    <section style={{ display: "grid", gap: 10, marginTop: 14 }}>
      <p style={{ margin: 0, textAlign: "center", color: "#607b70", fontSize: 12 }}>
        Verify your Sri Amirthaa ID mobile number to continue securely.
      </p>
      {!confirmation ? <>
        <label style={{ display: "grid", gap: 6, color: "#45634f", fontSize: 12, fontWeight: 650 }}>
          Mobile number
          <input value={phone} onChange={event => setPhone(event.target.value)} type="tel" autoComplete="tel" placeholder="+91 9876543210"
            style={{ width: "100%", height: 46, border: "1px solid rgba(20,110,78,.22)", borderRadius: 11, background: "rgba(255,255,255,.78)", color: "#12352b", padding: "0 13px" }} />
        </label>
        <button type="button" className="auth-google" onClick={sendOtp} disabled={busy}>{busy ? "Sending OTP..." : "Send secure OTP"}</button>
      </> : <>
        <label style={{ display: "grid", gap: 6, color: "#45634f", fontSize: 12, fontWeight: 650 }}>
          6-digit OTP
          <input value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="Enter OTP"
            style={{ width: "100%", height: 46, border: "1px solid rgba(20,110,78,.22)", borderRadius: 11, background: "rgba(255,255,255,.78)", color: "#12352b", padding: "0 13px", letterSpacing: 5 }} />
        </label>
        <button type="button" className="auth-google" onClick={verifyAndContinue} disabled={busy || code.length !== 6}>{busy ? "Verifying..." : "Verify and continue"}</button>
        <button type="button" onClick={() => { setConfirmation(null); setCode(""); setMessage(""); }} style={{ border: 0, background: "transparent", color: "#28784b", fontSize: 11, fontWeight: 700 }}>Change phone number</button>
      </>}
      {message && <p role="status" style={{ margin: 0, textAlign: "center", color: /unable|invalid|failed|error|expired|not configured/i.test(message) ? "#b43f3b" : "#168363", fontSize: 12 }}>{message}</p>}
      <div ref={recaptcha} />
    </section>
  );
}
