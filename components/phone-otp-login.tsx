"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Eye, EyeOff, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { firebaseApp } from "@/lib/firebase";
import { createClient } from "@supabase/supabase-js";

type Props = { onAuthenticated: () => void; onClose: () => void };
type Phase = "phone" | "password" | "email" | "otp" | "orbit" | "verified";
const DIGITS = 6;
const validEmail = (value: string) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value.trim());

export default function PhoneOtpLogin({ onAuthenticated, onClose }: Props) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [phase, setPhase] = useState<Phase>("phone");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [existingEmail, setExistingEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const verifier = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { verifier.current?.clear(); verifier.current = null; }, []);

  async function checkPhone() {
    setMessage("");
    const normalized = phone.replace(/[\\s()-]/g, "");
    const e164 = normalized.startsWith("+") ? normalized : "+" + normalized;
    if (!/^\\+[1-9]\\d{7,14}$/.test(e164)) {
      setMessage("Enter a valid phone number with country code, e.g. +91 9876543210.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/check-phone", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: e164 })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to check this phone number.");
      setPhone(e164);
      if (result.registered) {
        if (!result.canPasswordLogin || !result.email) {
          throw new Error("This phone number is already registered but its account needs secure recovery. Please contact support.");
        }
        setExistingEmail(result.email);
        setEmail(result.email);
        setPhase("password");
        setMessage("Existing account found. Sign in with your password.");
      } else {
        setPhase("email");
        setMessage("New phone number. Enter an email address to continue signup.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to check this phone number.");
    } finally { setBusy(false); }
  }

  async function checkEmail() {
    setMessage("");
    setEmailAvailable(null);
    if (!validEmail(email)) { setMessage("Enter a valid email address."); return; }
    setEmailChecking(true);
    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to check this email.");
      setEmailAvailable(Boolean(result.available));
      setMessage(result.message || (result.available ? "Email is available." : "Email already registered."));
    } catch (error) {
      setEmailAvailable(null);
      setMessage(error instanceof Error ? error.message : "Unable to check this email.");
    } finally { setEmailChecking(false); }
  }

  async function sendCode() {
    setMessage("");
    if (phase === "email") {
      if (emailAvailable !== true) { setMessage("Check that this email address is available before requesting OTP."); return; }
      if (!fullName.trim()) { setMessage("Enter your full name."); return; }
      if (password !== confirmPassword) { setMessage("Passwords do not match."); return; }
      if (!acceptedTerms) { setMessage("Please accept the Terms and Privacy Policy."); return; }
      if (password.length < 8 || !/[A-Z]/.test(password) || !/\\d/.test(password) || !/[^\\w\\s]/.test(password)) {
        setMessage("Password must contain 8 characters, a capital letter, a number and a symbol."); return;
      }
    }
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
      const result = await signInWithPhoneNumber(auth, phone, nextVerifier);
      setConfirmation(result);
      setPhase("otp");
      setCode("");
      setMessage("OTP sent. Check your phone.");
      window.setTimeout(() => inputRef.current?.focus(), 80);
    } catch (error) {
      verifier.current?.clear();
      verifier.current = null;
      recaptchaContainerRef.current?.replaceChildren();
      setMessage(error instanceof Error ? error.message : "Unable to send OTP. Please try again.");
    } finally { setBusy(false); }
  }

  async function resetExistingPassword() {
    setMessage("");
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) throw new Error("Password recovery is not configured.");
      const supabase = createClient(url, key);
      const { error } = await supabase.auth.resetPasswordForEmail(existingEmail, {
        redirectTo: window.location.origin + "/auth/reset-password"
      });
      if (error) throw error;
      setMessage("If password recovery is available, a reset link has been sent to your registered email.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send a password reset link.");
    }
  }

  async function signInWithPhonePassword() {
    if (!password) { setMessage("Enter your password."); return; }
    if (!validEmail(existingEmail)) { setMessage("The account email is unavailable. Please contact support."); return; }
    setBusy(true); setMessage("");
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) throw new Error("Authentication setup is incomplete.");
      const supabase = createClient(url, key);
      const { error } = await supabase.auth.signInWithPassword({ email: existingEmail, password });
      if (error) throw error;
      setPhase("verified");
      setMessage("Signed in successfully. Opening your account…");
      window.setTimeout(onAuthenticated, 700);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in. Check your password.");
    } finally { setBusy(false); }
  }

  async function verifyCode() {
    if (!confirmation || code.length !== DIGITS) { setMessage("Enter the 6-digit OTP."); return; }
    setBusy(true); setMessage("");
    try {
      const credential = await confirmation.confirm(code);
      const firebaseIdToken = await credential.user.getIdToken(true);
      setPhase("orbit");
      if (emailAvailable === true) {
        const response = await fetch("/api/auth/phone-signup", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firebaseIdToken, email: email.trim(), password, fullName })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to create your account.");
        setPhase("verified");
        setMessage("Phone verified. Check your email to confirm your new account before signing in.");
      } else {
        setPhase("verified");
        setMessage("Phone verified. Opening your account…");
        window.setTimeout(onAuthenticated, 800);
      }
    } catch (error) {
      setPhase("otp");
      setMessage(error instanceof Error ? error.message : "The OTP is incorrect or expired.");
    } finally { setBusy(false); }
  }

  function resetPhone() {
    verifier.current?.clear(); verifier.current = null; recaptchaContainerRef.current?.replaceChildren();
    setPhase("phone"); setConfirmation(null); setCode(""); setPassword(""); setConfirmPassword(""); setAcceptedTerms(false); setEmail(""); setEmailAvailable(null);
    setExistingEmail(""); setMessage("");
  }

  return (
    <section className="phone-otp-inline" aria-label="Phone sign in and signup">
      <style jsx>{`
        .phone-otp-inline{position:relative;width:100%;margin:18px 0 0;padding:0;border:0;border-radius:0;background:transparent;color:#234632;display:grid;gap:14px;font-family:inherit}
        .otp-back{justify-self:start;padding:0;border:0;background:transparent;color:#28784b;font-size:10px;font-weight:800;cursor:pointer}
        .otp-kicker{font:700 10px/1.4 ui-monospace,monospace;letter-spacing:2px;color:#168363;text-align:center}
        .otp-title{text-align:center;font-size:19px;font-weight:700;color:#12352b}.otp-copy{text-align:center;font-size:12px;line-height:1.6;color:#607b70}
        .otp-field{display:grid;gap:7px;font-size:12px;color:#45634f;font-weight:650}
        .otp-field input{width:100%;height:46px;border:1px solid rgba(20,110,78,.22);border-radius:11px;background:rgba(255,255,255,.78);color:#12352b;padding:0 13px;outline:none}
        .otp-field input:focus{border-color:#168363;box-shadow:0 0 0 3px rgba(22,131,99,.12)}
        .otp-action{height:44px;border:0;border-radius:11px;background:linear-gradient(110deg,#167a5b,#24ad83);color:white;font-weight:800;cursor:pointer}
        .otp-action:disabled{opacity:.45;cursor:not-allowed}
        .otp-secondary{height:40px;border:1px solid rgba(37,132,81,.2);border-radius:11px;background:rgba(255,255,255,.7);color:#28784b;font-size:11px;font-weight:750}
        .otp-boxes{display:flex;justify-content:center;gap:clamp(4px,2vw,10px)}
        .otp-digit{width:clamp(35px,10vw,44px);height:52px;display:grid;place-items:center;border-radius:10px;border:1px solid rgba(20,110,78,.22);background:rgba(255,255,255,.8);color:#168363;font-size:22px;font-weight:800}
        .otp-digit.filled{background:#e1f6ed;border-color:#168363}
        .otp-hidden{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
        .otp-message{font-size:12px;text-align:center;color:#168363;overflow-wrap:anywhere}
        .otp-message.error{color:#b43f3b}.otp-change-number{justify-self:center;display:inline-flex;align-items:center;gap:7px;padding:9px 14px;border:1px solid rgba(37,132,81,.2);border-radius:999px;background:linear-gradient(135deg,rgba(255,255,255,.9),rgba(229,248,236,.8));color:#28784b;font-size:11px;font-weight:750}
        .otp-arena{width:220px;height:220px;position:relative;margin:auto;isolation:isolate}
        .otp-orbit-digit{position:absolute;left:50%;top:50%;width:38px;height:38px;margin:-19px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(145deg,#f5fff8,#d9f5e3);border:1px solid rgba(22,131,99,.5);color:#168363;font-weight:850;animation:orbit 1.6s cubic-bezier(.65,0,.35,1) both;box-shadow:0 0 10px 3px rgba(38,190,111,.22),0 0 24px 7px rgba(38,190,111,.16),inset 0 1px 0 rgba(255,255,255,.95)}
        .otp-orbit-digit:before{content:"";position:absolute;inset:-8px;border-radius:14px;background:radial-gradient(circle,rgba(57,220,133,.32),rgba(57,220,133,0) 72%);filter:blur(5px);z-index:-1;animation:tileGlow .8s ease-in-out infinite alternate}
        @keyframes tileGlow{from{opacity:.35;transform:scale(.82)}to{opacity:1;transform:scale(1.16)}}
        .otp-orbit-digit:nth-child(2){animation-delay:-.08s}.otp-orbit-digit:nth-child(3){animation-delay:-.16s}.otp-orbit-digit:nth-child(4){animation-delay:-.24s}.otp-orbit-digit:nth-child(5){animation-delay:-.32s}.otp-orbit-digit:nth-child(6){animation-delay:-.4s}
        @keyframes orbit{from{transform:rotate(var(--start)) translateX(76px) rotate(var(--counter-start))}to{transform:rotate(calc(var(--start) + 360deg)) translateX(76px) rotate(calc(var(--counter-start) - 360deg))}}
        .otp-success{display:grid;justify-items:center;gap:10px;padding:16px 0}.otp-check{width:72px;height:72px;border:2px solid #168363;border-radius:18px;background:#e1f6ed;display:grid;place-items:center;color:#168363;font-size:36px}
        .otp-success strong{font-size:19px;letter-spacing:3px;color:#20a879}
        @media(prefers-reduced-motion:reduce){.otp-orbit-digit{animation:none}}
      `}</style>
      <button type="button" className="otp-back" onClick={onClose}>← Back to sign-in options</button>
      <div className="otp-kicker">SRI AMIRTHAA ID · SECURE ACCESS</div>

      {phase === "phone" && <>
        <div><h3 className="otp-title">Continue with phone</h3><p className="otp-copy">Enter your mobile number. We’ll check whether you already have an account.</p></div>
        <label className="otp-field"><span>Mobile number</span><input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 9876543210"/></label>
        <button className="otp-action" type="button" onClick={checkPhone} disabled={busy}>{busy ? "Checking…" : "Continue"}</button>
      </>}

      {phase === "password" && <>
        <div><h3 className="otp-title">Welcome back</h3><p className="otp-copy">Existing account found for {phone}. Sign in with your password.</p></div>
        <label className="otp-field"><span>Email address</span><input type="email" value={existingEmail} readOnly/></label>
        <label className="otp-field"><span>Password</span><div style={{position:"relative"}}><input type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" placeholder="Enter your password"/><button type="button" aria-label={showPassword?"Hide password":"Show password"} onClick={()=>setShowPassword(v=>!v)} style={{position:"absolute",right:12,top:13,border:0,background:"transparent",color:"#28784b"}}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        <button className="otp-action" type="button" onClick={signInWithPhonePassword} disabled={busy}>{busy?"Signing in…":"Sign in"}</button>
        <button type="button" className="otp-back" onClick={resetExistingPassword}>Forgot password?</button>
        <button className="otp-change-number" type="button" onClick={resetPhone}><ArrowLeftRight size={15}/> Change number</button>
      </>}

      {phase === "email" && <>
        <div><h3 className="otp-title">Create your account</h3><p className="otp-copy">New phone number detected. Check your email before sending OTP.</p></div>
        <label className="otp-field"><span>Email address</span><input type="email" value={email} onChange={e=>{setEmail(e.target.value);setEmailAvailable(null);setMessage("");}} placeholder="name@example.com" autoComplete="email"/></label>
        <button className="otp-secondary" type="button" onClick={checkEmail} disabled={emailChecking||!validEmail(email)}>{emailChecking?"Checking email…":"Check email availability"}</button>
        {emailAvailable===true && <>
          <label className="otp-field"><span>Full name</span><input value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name" placeholder="Your full name"/></label>
          <label className="otp-field"><span>Create password</span><input type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" placeholder="8+ characters, capital, number & symbol"/></label>
          <label className="otp-field"><span>Confirm password</span><input type={showPassword?"text":"password"} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Re-enter your password"/></label>
          <label style={{display:"flex",alignItems:"flex-start",gap:8,fontSize:11,color:"#607b70",lineHeight:1.5}}><input type="checkbox" checked={acceptedTerms} onChange={e=>setAcceptedTerms(e.target.checked)} style={{marginTop:2}}/><span>I agree to the Terms and Privacy Policy.</span></label>
        </>}
        <button className="otp-action" type="button" onClick={sendCode} disabled={busy||emailAvailable!==true||!fullName.trim()||password.length<8||password!==confirmPassword||!acceptedTerms}>{busy?"Sending OTP…":"Send OTP"}</button>
        {emailAvailable===false && <p className="otp-message error">Email already registered. OTP cannot be sent. Please sign in with your existing account.</p>}
      </>}

      {phase === "otp" && <>
        <div><h3 className="otp-title">Enter your OTP</h3><p className="otp-copy">Enter the 6-digit code sent to {phone}.</p></div>
        <div className="otp-boxes" onClick={()=>inputRef.current?.focus()}>{Array.from({length:DIGITS},(_,i)=><div className={`otp-digit ${code[i]?"filled":""}`} key={i}>{code[i]||(i===code.length?"•":"")}</div>)}</div>
        <input ref={inputRef} className="otp-hidden" type="tel" inputMode="numeric" autoComplete="one-time-code" maxLength={DIGITS} value={code} onChange={e=>setCode(e.target.value.replace(/\\D/g,"").slice(0,DIGITS))} aria-label="6-digit OTP"/>
        <button className="otp-action" type="button" onClick={verifyCode} disabled={busy||code.length!==DIGITS}>{busy?"Verifying…":"Verify OTP"}</button>
        <button type="button" className="otp-change-number" onClick={resetPhone}><ArrowLeftRight size={15}/> Change number</button>
      </>}

      {phase === "orbit" && <><div className="otp-arena">{code.split("").map((digit,i)=><span key={i} className="otp-orbit-digit" style={{"--start":`${i*60-90}deg`,"--counter-start":`${90-i*60}deg`} as React.CSSProperties}>{digit}</span>)}</div><p className="otp-kicker">VERIFYING SECURELY…</p></>}
      {phase === "verified" && <div className="otp-success"><div className="otp-check">✓</div><strong>VERIFIED</strong><p className="otp-copy">{message}</p></div>}
      {message && phase!=="verified" && <p role="status" className={`otp-message ${/already registered|error|unable|invalid|incorrect|already|not configured|contact support/i.test(message)?"error":""}`}>{message}</p>}
      <div ref={recaptchaContainerRef}/>
    </section>
  );
}
