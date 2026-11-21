"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
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

  async function sendCode() {
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

  async function verifyCode() {
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
    <section className="phone-otp-inline" aria-label="Phone number OTP sign in">
      <style jsx>{`
        .phone-otp-inline{position:relative;width:100%;margin:18px 0 0;padding:0;border:0;border-radius:0;background:transparent;color:#234632;box-shadow:none;display:grid;gap:14px;font-family:inherit}.otp-back{justify-self:start;padding:0;border:0;background:transparent;color:#28784b;font-size:10px;font-weight:800;cursor:pointer}
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
        .otp-change-number{justify-self:center;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 14px;border:1px solid rgba(37,132,81,.2);border-radius:999px;background:linear-gradient(135deg,rgba(255,255,255,.9),rgba(229,248,236,.8));color:#28784b;font-size:11px;font-weight:750;box-shadow:0 5px 16px rgba(40,120,75,.08);transition:transform .2s,box-shadow .2s,border-color .2s}
        .otp-change-number:hover{transform:translateY(-1px);border-color:rgba(37,132,81,.42);box-shadow:0 8px 20px rgba(40,120,75,.14)}
        .otp-error{color:#ffaaa7}
        .otp-arena{width:220px;height:220px;position:relative;margin:auto;isolation:isolate}
        .otp-orbit-digit{position:absolute;left:50%;top:50%;width:38px;height:38px;margin:-19px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(145deg,#f5fff8,#d9f5e3);border:1px solid rgba(22,131,99,.5);color:#168363;font-weight:850;animation:orbit 1.6s cubic-bezier(.65,0,.35,1) both;box-shadow:0 0 10px 3px rgba(38,190,111,.22),0 0 24px 7px rgba(38,190,111,.16),inset 0 1px 0 rgba(255,255,255,.95)}
        .otp-orbit-digit:before{content:"";position:absolute;inset:-8px;border-radius:14px;background:radial-gradient(circle,rgba(57,220,133,.32),rgba(57,220,133,0) 72%);filter:blur(5px);z-index:-1;animation:tileGlow .8s ease-in-out infinite alternate}
        @keyframes tileGlow{from{opacity:.35;transform:scale(.82)}to{opacity:1;transform:scale(1.16)}}
        .otp-orbit-digit:nth-child(2){animation-delay:-.08s}.otp-orbit-digit:nth-child(3){animation-delay:-.16s}.otp-orbit-digit:nth-child(4){animation-delay:-.24s}.otp-orbit-digit:nth-child(5){animation-delay:-.32s}.otp-orbit-digit:nth-child(6){animation-delay:-.4s}
        @keyframes orbit{from{transform:rotate(var(--start)) translateX(76px) rotate(var(--counter-start))}to{transform:rotate(calc(var(--start) + 360deg)) translateX(76px) rotate(calc(var(--counter-start) - 360deg))}}
        .otp-success{display:grid;justify-items:center;gap:10px;padding:16px 0;animation:fade .4s ease both}
        .otp-check{width:72px;height:72px;border:2px solid #168363;border-radius:18px;background:#e1f6ed;display:grid;place-items:center;color:#168363;font-size:36px;animation:pop .45s cubic-bezier(.68,-.55,.27,1.55) both}
        .otp-success strong{font-size:19px;letter-spacing:3px;color:#20dcb4}
        @keyframes fade{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
        @keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
        @media(prefers-reduced-motion:reduce){.otp-orbit-digit,.otp-success,.otp-check{animation:none}}
      `}</style>
      <button type="button" className="otp-back" onClick={onClose}>← Back to sign-in options</button>
      <div className="otp-kicker">SRI AMIRTHAA ID · SECURE ACCESS</div>
      {phase === "phone" && <>
        <div><h3 className="otp-title">Continue with phone</h3><p className="otp-copy">We’ll send a one-time password to verify your number.</p></div>
        <div className="grid gap-3">
          <label className="otp-field">Mobile number (with country code)
            <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 9876543210" required />
          </label>
          <button className="otp-action" type="button" onClick={()=>sendCode()} disabled={busy}>{busy ? "Sending OTP…" : "Send OTP"}</button>
        </div>
      </>}
      {phase === "otp" && <>
        <div><h3 className="otp-title">Enter your OTP</h3><p className="otp-copy">Enter the 6-digit code sent to {phone}.</p></div>
        <div className="grid gap-3">
          <div className="otp-boxes" onClick={()=>inputRef.current?.focus()}>
            {Array.from({length:DIGITS},(_,i)=><div className={`otp-digit ${code[i]?"filled":""}`} key={i}>{code[i] || (i===code.length?"•":"")}</div>)}
          </div>
          <input ref={inputRef} className="otp-hidden" type="tel" inputMode="numeric" autoComplete="one-time-code" maxLength={DIGITS} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,DIGITS))} aria-label="6-digit OTP" />
          <button className="otp-action" type="button" onClick={()=>verifyCode()} disabled={busy || code.length!==DIGITS}>{busy ? "Verifying…" : "Verify OTP"}</button>
          <button type="button" className="text-xs text-center text-teal-200 underline" onClick={()=>{setCode("");setPhase("phone");setConfirmation(null);setMessage("");}}>Change phone number</button>
        </div>
      </>}
      {phase === "orbit" && <><div className="otp-arena">{code.split("").map((digit,i)=><span key={i} className="otp-orbit-digit" style={{"--start":`${i*60-90}deg`,"--counter-start":`${90-i*60}deg`} as React.CSSProperties}>{digit}</span>)}</div><p className="otp-kicker">VERIFYING SECURELY…</p></>}
      {phase === "verified" && <div className="otp-success"><div className="otp-check">✓</div><strong>VERIFIED</strong><p className="otp-copy">Your phone number is verified.</p></div>}
      {message && <p role="status" className={`otp-message ${phase==="otp" && message.toLowerCase().includes("incorrect")?"otp-error":""}`}>{message}</p>}
      <div ref={recaptchaContainerRef} />
    </section>
  );
}
