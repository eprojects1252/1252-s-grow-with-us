"use client";

import { useEffect, useRef, useState } from "react";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { firebaseApp } from "@/lib/firebase";

type Props = { onAuthenticated: () => void; onClose: () => void };

const DIGITS = 6;

export default function PhoneOtpLogin({ onAuthenticated, onClose }: Props) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [phase, setPhase] = useState<"phone" | "otp" | "orbit" | "verified">("phone");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const verifier = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { verifier.current?.clear(); verifier.current = null; }, []);

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const normalized = phone.replace(/[\s()-]/g, "");
    if (!/^\+?[1-9]\d{7,14}$/.test(normalized)) {
      setMessage("Enter a valid phone number with country code, e.g. +91 9876543210.");
      return;
    }
    const e164 = normalized.startsWith("+") ? normalized : "+" + normalized;
    setBusy(true);
    try {
      const auth = getAuth(firebaseApp);
      verifier.current?.clear();
      verifier.current = null;
      const container = recaptchaContainerRef.current;
      if (!container) throw new Error("reCAPTCHA container is not available. Please refresh and try again.");
      container.replaceChildren();
      const nextVerifier = new RecaptchaVerifier(auth, container, { size: "invisible" });
      verifier.current = nextVerifier;
      await nextVerifier.render();
      const result = await signInWithPhoneNumber(auth, e164, nextVerifier);
      setConfirmation(result);
      setPhase("otp");
      setMessage("OTP sent. Check your phone.");
      window.setTimeout(() => inputRef.current?.focus(), 80);
    } catch (error) {
      verifier.current?.clear();
      verifier.current = null;
      recaptchaContainerRef.current?.replaceChildren();
      setMessage(error instanceof Error ? error.message : "Unable to send OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    if (!confirmation || code.length !== DIGITS) {
      setMessage("Enter the 6-digit OTP.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await confirmation.confirm(code);
      setPhase("orbit");
      window.setTimeout(() => {
        setPhase("verified");
        window.setTimeout(onAuthenticated, 900);
      }, 1650);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The OTP is incorrect or expired.");
      setBusy(false);
    }
  }

  return (
    <div className="phone-otp-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="phone-otp-panel" role="dialog" aria-modal="true" aria-label="Phone number OTP sign in"><button type="button" className="otp-close" aria-label="Close phone sign in" onClick={onClose}>×</button>
      <style jsx>{`
        .phone-otp-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:18px;background:rgba(5,18,15,.38);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}.phone-otp-panel{position:relative;width:min(100%,430px);max-height:min(88vh,720px);overflow:auto;padding:30px 22px 24px;border-radius:26px;background:linear-gradient(145deg,rgba(255,255,255,.94),rgba(231,249,242,.84));color:#12352b;border:1px solid rgba(255,255,255,.78);box-shadow:0 28px 90px rgba(5,35,25,.28),inset 0 1px rgba(255,255,255,.9);display:grid;gap:16px;font-family:inherit}.otp-close{position:absolute;right:14px;top:12px;width:34px;height:34px;border:1px solid rgba(20,90,65,.15);border-radius:50%;background:rgba(255,255,255,.7);color:#174c3b;font-size:21px;cursor:pointer}
        .otp-kicker{font:700 10px/1.4 ui-monospace,monospace;letter-spacing:2px;color:#168363;text-align:center}
        .otp-title{text-align:center;font-size:19px;font-weight:700;color:#12352b}
        .otp-copy{text-align:center;font-size:12px;line-height:1.6;color:#607b70}
        .otp-field{display:grid;gap:7px;font-size:12px;color:#9cb9c6}
        .otp-field input{width:100%;height:46px;border:1px solid rgba(20,110,78,.22);border-radius:11px;background:rgba(255,255,255,.78);color:#12352b;padding:0 13px;outline:none}
        .otp-field input:focus{border-color:#168363;box-shadow:0 0 0 3px rgba(22,131,99,.12)}
        .otp-action{height:44px;border:0;border-radius:11px;background:linear-gradient(110deg,#167a5b,#24ad83);color:white;font-weight:800;cursor:pointer}
        .otp-action:disabled{opacity:.55;cursor:wait}
        .otp-boxes{display:flex;justify-content:center;gap:clamp(4px,2vw,10px)}
        .otp-digit{width:clamp(35px,10vw,44px);height:52px;display:grid;place-items:center;border-radius:10px;border:1px solid rgba(20,110,78,.22);background:rgba(255,255,255,.8);color:#168363;font-size:22px;font-weight:800}
        .otp-digit.filled{background:#e1f6ed;border-color:#168363}
        .otp-hidden{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
        .otp-message{font-size:12px;text-align:center;color:#168363;overflow-wrap:anywhere}
        .otp-error{color:#ffaaa7}
        .otp-arena{width:220px;height:220px;position:relative;margin:auto}
        .otp-ring{position:absolute;inset:18px;border:1px solid rgba(22,131,99,.24);border-radius:50%}
        .otp-orbit-digit{position:absolute;left:50%;top:50%;width:38px;height:38px;margin:-19px;border-radius:9px;display:grid;place-items:center;background:#e1f6ed;border:1px solid #168363;color:#168363;font-weight:800;animation:orbit 1.6s cubic-bezier(.65,0,.35,1) both}
        .otp-orbit-digit:nth-child(2){animation-delay:-.08s}.otp-orbit-digit:nth-child(3){animation-delay:-.16s}.otp-orbit-digit:nth-child(4){animation-delay:-.24s}.otp-orbit-digit:nth-child(5){animation-delay:-.32s}.otp-orbit-digit:nth-child(6){animation-delay:-.4s}
        @keyframes orbit{from{transform:rotate(var(--start)) translateX(76px) rotate(var(--counter-start))}to{transform:rotate(calc(var(--start) + 360deg)) translateX(76px) rotate(calc(var(--counter-start) - 360deg))}}
        .otp-success{display:grid;justify-items:center;gap:10px;padding:16px 0;animation:fade .4s ease both}
        .otp-check{width:72px;height:72px;border:2px solid #168363;border-radius:18px;background:#e1f6ed;display:grid;place-items:center;color:#168363;font-size:36px;animation:pop .45s cubic-bezier(.68,-.55,.27,1.55) both}
        .otp-success strong{font-size:19px;letter-spacing:3px;color:#20dcb4}
        @keyframes fade{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
        @keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
        @media(prefers-reduced-motion:reduce){.otp-orbit-digit,.otp-success,.otp-check{animation:none}}
      `}</style>
      <div className="otp-kicker">SRI AMIRTHAA ID · SECURE ACCESS</div>
      {phase === "phone" && <>
        <div><h3 className="otp-title">Continue with phone</h3><p className="otp-copy">We’ll send a one-time password to verify your number.</p></div>
        <form onSubmit={sendCode} className="grid gap-3">
          <label className="otp-field">Mobile number (with country code)
            <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 9876543210" required />
          </label>
          <button className="otp-action" type="submit" disabled={busy}>{busy ? "Sending OTP…" : "Send OTP"}</button>
        </form>
      </>}
      {phase === "otp" && <>
        <div><h3 className="otp-title">Enter your OTP</h3><p className="otp-copy">Enter the 6-digit code sent to {phone}.</p></div>
        <form onSubmit={verifyCode} className="grid gap-3">
          <div className="otp-boxes" onClick={()=>inputRef.current?.focus()}>
            {Array.from({length:DIGITS},(_,i)=><div className={`otp-digit ${code[i]?"filled":""}`} key={i}>{code[i] || (i===code.length?"•":"")}</div>)}
          </div>
          <input ref={inputRef} className="otp-hidden" type="tel" inputMode="numeric" autoComplete="one-time-code" maxLength={DIGITS} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,DIGITS))} aria-label="6-digit OTP" />
          <button className="otp-action" type="submit" disabled={busy || code.length!==DIGITS}>{busy ? "Verifying…" : "Verify OTP"}</button>
          <button type="button" className="text-xs text-center text-teal-200 underline" onClick={()=>{setCode("");setPhase("phone");setConfirmation(null);setMessage("");}}>Change phone number</button>
        </form>
      </>}
      {phase === "orbit" && <><div className="otp-arena"><div className="otp-ring"/>{code.split("").map((digit,i)=><span key={i} className="otp-orbit-digit" style={{"--start":`${i*60-90}deg`,"--counter-start":`${90-i*60}deg`} as React.CSSProperties}>{digit}</span>)}</div><p className="otp-kicker">VERIFYING SECURELY…</p></>}
      {phase === "verified" && <div className="otp-success"><div className="otp-check">✓</div><strong>VERIFIED</strong><p className="otp-copy">Your phone number is verified.</p></div>}
      {message && <p role="status" className={`otp-message ${phase==="otp" && message.toLowerCase().includes("incorrect")?"otp-error":""}`}>{message}</p>}
      <div ref={recaptchaContainerRef} />
    </section></div>
  );
}
