"use client";

import { useEffect, useRef, useState } from "react";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { firebaseApp } from "@/lib/firebase";

type Props = { onClose: () => void };
type Phase = "phone" | "password" | "email" | "review" | "otp" | "orbit" | "verified";
const DIGITS = 6;
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function PhoneOtpLogin({ onClose }: Props) {
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
  const verifier = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { verifier.current?.clear(); verifier.current = null; }, []);

  async function checkPhone() {
    setMessage("");
    const normalized = phone.replace(/[\s()-]/g, "");
    const e164 = normalized.startsWith("+") ? normalized : "+" + normalized;
    if (!/^\+[1-9]\d{7,14}$/.test(e164)) {
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
        if (!result.canPasswordLogin) {
          throw new Error("This phone number is already registered but its account needs secure recovery. Please contact support.");
        }
        setExistingEmail("");
        setEmail("");
        setPhase("password");
        setMessage("Existing account found. Verify your phone number to continue.");
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
      if (result.available) setPhase("review");
    } catch (error) {
      setEmailAvailable(null);
      setMessage(error instanceof Error ? error.message : "Unable to check this email.");
    } finally { setEmailChecking(false); }
  }

  async function sendCode() {
    setMessage("");
    if (phase === "review") {
      if (emailAvailable !== true) { setMessage("Check that this email address is available before requesting OTP."); return; }
      if (!fullName.trim()) { setMessage("Enter your full name."); return; }
      if (password !== confirmPassword) { setMessage("Passwords do not match."); return; }
      if (!acceptedTerms) { setMessage("Please accept the Terms and Privacy Policy."); return; }
      if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^\w\s]/.test(password)) {
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
        const response = await fetch("/api/auth/sri-amirthaa/start", {
          method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", cache: "no-store",
          body: JSON.stringify({ firebaseIdToken, pendingEmail: existingEmail || undefined })
        });
        const result = await response.json();
        if (!response.ok || typeof result.authorizationUrl !== "string") throw new Error(result.error || "Secure sign-in could not start.");
        window.location.assign(result.authorizationUrl);
      }
    } catch (error) {
      setPhase("otp");
      setMessage(error instanceof Error ? error.message : "The OTP is incorrect or expired.");
    } finally { setBusy(false); }
  }

  function resetPhone() {
    verifier.current?.clear(); verifier.current = null; recaptchaContainerRef.current?.replaceChildren();
    setPhase("phone"); setConfirmation(null); setCode(""); setPassword(""); setConfirmPassword(""); setAcceptedTerms(false); setEmail(""); setEmailAvailable(null);
    setExistingEmail(""); setFullName(""); setAcceptedTerms(false); setMessage("");
  }

  return (
    <main className="core-login-shell" aria-label="Sri Amirthaa secure phone login">
      <style jsx global>{`
        .core-login-shell{min-height:100vh;margin:0;padding:0 22px 22px;background:radial-gradient(ellipse at 12% 20%,#dff5ed 0%,transparent 38%),radial-gradient(ellipse at 88% 12%,#e9e4ff 0%,transparent 35%),linear-gradient(135deg,#f7fbff,#f0f8f5 55%,#fff7ef);color:#17243b;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex;flex-direction:column;overflow:hidden}
        .core-login-shell *{box-sizing:border-box}
        .core-login-top{height:82px;display:flex;align-items:center;justify-content:space-between;max-width:1180px;width:100%;margin:0 auto;border-bottom:1px solid #dce7f3}
        .core-login-brand{display:flex;align-items:center;gap:12px;color:#17243b;text-decoration:none;font-size:12px;letter-spacing:.14em;font-weight:800}
        .core-login-mark{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(145deg,#d9f7ec,#b8d8ff);color:#23416b;font-weight:900;box-shadow:0 7px 22px #8db5ed35}
        .core-login-secure{border:1px solid #c8d9f1;background:#ffffffb8;color:#496a91;padding:8px 12px;border-radius:30px;font-size:10px;letter-spacing:.12em}
        .core-login-layout{max-width:1120px;width:100%;margin:auto;display:grid;grid-template-columns:1fr 440px;gap:80px;align-items:center;flex:1;padding:40px 0}
        .core-login-intro{padding:35px 0;position:relative}.core-login-eyebrow{color:#5276a6;font-size:11px;letter-spacing:.2em;font-weight:700}
        .core-login-intro h1{font-size:clamp(48px,6vw,76px);line-height:1.04;letter-spacing:-.055em;margin:25px 0 18px;font-weight:650;color:#1d3151}
        .core-login-intro h1 em{font-style:normal;background:linear-gradient(90deg,#4b9fe8,#9274e8,#54bf9b,#f39a61);-webkit-background-clip:text;background-clip:text;color:transparent}
        .core-login-intro p{max-width:440px;color:#62748e;font-size:15px;line-height:1.9}
        .core-login-trust{display:flex;gap:24px;margin-top:28px;color:#627b99;font-size:12px}
        .core-login-card{width:100%;padding:34px;border:1px solid #dbe6f1;border-radius:25px;background:#ffffffd9;box-shadow:0 25px 75px #567aa51c,inset 0 1px #fff;backdrop-filter:blur(24px)}
        .core-login-cardtop{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}
        .core-login-mini{width:34px;height:34px;border-radius:10px;background:linear-gradient(145deg,#d9f7ec,#b8d8ff);color:#23416b;display:grid;place-items:center;font-size:12px;font-weight:800}
        .core-login-step{font-size:9px;letter-spacing:.2em;color:#5276a6;font-weight:700}
        .core-login-card h2{font-size:25px;letter-spacing:-.035em;margin:0 0 8px;color:#1d3151}
        .core-login-sub{color:#6d7e96;font-size:13px;line-height:1.7;margin:0 0 23px}
        .core-login-label{display:block;color:#607b9c;font-size:9px;letter-spacing:.17em;font-weight:700;margin:16px 0 9px}
        .core-login-input{width:100%;height:54px;border:1px solid #d5e2ef;border-radius:13px;background:#f7faff;color:#1d3151;padding:0 14px;outline:0;font-size:15px}
        .core-login-input::placeholder{color:#9aabc0}.core-login-input:focus{border-color:#62aee7;box-shadow:0 0 0 3px #62aee71c}
        .core-login-btn{width:100%;min-height:52px;border:0;border-radius:13px;margin-top:18px;background:linear-gradient(100deg,#bce9ff,#d9d0ff 48%,#c5f1d9);color:#213b5b;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 9px 28px #7cabea30}
        .core-login-btn:disabled{opacity:.5;cursor:not-allowed}
        .core-login-back,.core-login-link{border:0;background:transparent;color:#568cc0;font-size:11px;font-weight:700;cursor:pointer;padding:0;margin:0 0 18px}
        .core-login-summary{border:1px solid #d8e8f1;background:linear-gradient(120deg,#f0f8ff,#f1fbf6);border-radius:12px;padding:14px;display:grid;gap:7px;margin:14px 0}
        .core-login-summary small{color:#7892aa;font-size:9px;letter-spacing:.16em}.core-login-summary strong{color:#315a7c;font-size:13px;overflow-wrap:anywhere;margin-bottom:8px}
        .core-login-message{font-size:12px;line-height:1.6;color:#477d61;overflow-wrap:anywhere;margin:13px 0 0}
        .core-login-message.error{color:#b44d4a}.core-login-check{display:flex;align-items:flex-start;gap:8px;color:#62748e;font-size:11px;line-height:1.5;margin-top:14px}
        .core-login-otp{letter-spacing:.35em;text-align:center;font-size:22px}.core-login-footer{max-width:1180px;width:100%;margin:15px auto 0;padding:18px 0 8px;border-top:1px solid #dce7f3;display:flex;justify-content:space-between;color:#8b9db2;font-size:9px;letter-spacing:.1em}
        .core-login-recaptcha{min-height:1px}
        @media(max-width:900px){.core-login-layout{grid-template-columns:1fr 420px;gap:25px}.core-login-intro h1{font-size:52px}}
        @media(max-width:700px){.core-login-shell{padding:0 17px 15px}.core-login-top{height:70px}.core-login-layout{display:flex;flex-direction:column;align-items:stretch;gap:25px;padding:34px 0 38px;flex:unset}.core-login-intro{padding:0}.core-login-intro h1{font-size:43px;margin:15px 0 10px}.core-login-intro p{font-size:12px;margin:0}.core-login-trust{margin-top:15px;gap:15px;font-size:10px}.core-login-card{padding:25px 21px;border-radius:21px}.core-login-footer{font-size:8px;gap:10px;flex-wrap:wrap}}
        @media(max-width:380px){.core-login-card{padding:22px 16px}.core-login-intro h1{font-size:38px}.core-login-secure{letter-spacing:.05em}}
      `}</style>
      <header className="core-login-top"><div className="core-login-brand"><span className="core-login-mark">SA</span><span>SRI AMIRTHAA<small style={{display:"block",fontSize:8,color:"#71c9a7",letterSpacing:".3em",marginTop:3}}>SECURE ACCESS</small></span></div><span className="core-login-secure">SECURE IDENTITY</span></header>
      <section className="core-login-layout">
        <div className="core-login-intro"><span className="core-login-eyebrow">✦ ONE ID. EVERY CONNECTION.</span><h1>Your world,<br/><em>one identity.</em></h1><p>ஒரே Sri Amirthaa account மூலம் இணைக்கப்பட்ட அனைத்து சேவைகளையும் பாதுகாப்பாக அணுகுங்கள்.</p><div className="core-login-trust"><span>◈ Verified identity</span><span>▣ Encrypted access</span></div></div>
        <section className="core-login-card">
          <div className="core-login-cardtop"><span className="core-login-mini">SA</span><span className="core-login-step">{phase==="phone"?"PHONE CHECK":phase==="email"?"NEW ACCOUNT • EMAIL":phase==="review"?"CONFIRM DETAILS":phase==="password"?"EXISTING ACCOUNT":phase==="otp"?"PHONE VERIFICATION":phase==="orbit"?"SECURE CHECK":"ACCOUNT STATUS"}</span></div>
          {phase==="phone" && <><h2>Continue with Phone</h2><p className="core-login-sub">உங்கள் மொபைல் எண்ணை உள்ளிடுங்கள். ஏற்கெனவே கணக்கு உள்ளதா எனச் சரிபார்க்கிறோம்.</p><label className="core-login-label">PHONE NUMBER</label><input className="core-login-input" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 9876543210"/><button className="core-login-btn" type="button" onClick={checkPhone} disabled={busy}>{busy?"Checking…":"Continue"}</button></>}
          {phase==="password" && <><button className="core-login-back" type="button" onClick={resetPhone}>← Change phone number</button><h2>Welcome back</h2><p className="core-login-sub">இந்த Phone Number ஏற்கெனவே பதிவு செய்யப்பட்டுள்ளது. OTP மூலம் உறுதிப்படுத்துங்கள்.</p><div className="core-login-summary"><small>SRI USER ID</small><strong>{phone}</strong></div><button className="core-login-btn" type="button" onClick={sendCode} disabled={busy}>{busy?"Sending…":"Verify phone & Send OTP"}</button></>}
          {phase==="email" && <><button className="core-login-back" type="button" onClick={resetPhone}>← Change phone number</button><h2>Welcome, New User!</h2><p className="core-login-sub">புதிய கணக்கிற்காக விவரங்களை உள்ளிட்டு Email ID-ஐ சரிபார்க்கவும்.</p><label className="core-login-label">EMAIL ADDRESS</label><input className="core-login-input" type="email" autoComplete="email" value={email} onChange={e=>{setEmail(e.target.value);setEmailAvailable(null);setMessage("");}} placeholder="you@example.com"/><label className="core-login-label">FULL NAME</label><input className="core-login-input" value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name" placeholder="Your full name"/><label className="core-login-label">LOGIN PASSWORD</label><input className="core-login-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" placeholder="8+ characters, capital, number & symbol"/><label className="core-login-label">CONFIRM PASSWORD</label><input className="core-login-input" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Re-enter password"/><label className="core-login-check"><input type="checkbox" checked={acceptedTerms} onChange={e=>setAcceptedTerms(e.target.checked)}/> I agree to the Terms and Privacy Policy.</label><button className="core-login-btn" type="button" onClick={checkEmail} disabled={emailChecking||!validEmail(email)||!fullName.trim()||password.length<8||password!==confirmPassword||!acceptedTerms}>{emailChecking?"Checking…":"Verify Email"}</button></>}
          {phase==="review" && <><button className="core-login-back" type="button" onClick={()=>{setPhase("email");setMessage("");}}>← Change email</button><h2>Confirm your details</h2><p className="core-login-sub">OTP அனுப்புவதற்கு முன் விவரங்களைச் சரிபார்க்கவும்.</p><div className="core-login-summary"><small>EMAIL STATUS</small><strong>✓ AVAILABLE — CHECKED</strong><small>SRI USER ID</small><strong>{phone}</strong><small>REGISTERED PHONE</small><strong>{phone}</strong><small>EMAIL ADDRESS</small><strong>{email.trim().toLowerCase()}</strong><small>FULL NAME</small><strong>{fullName}</strong></div><button className="core-login-btn" type="button" onClick={sendCode} disabled={busy||!fullName.trim()||password.length<8||password!==confirmPassword||!acceptedTerms}>{busy?"Sending OTP…":"Verify phone & Send OTP"}</button></>}
          {phase==="otp" && <><button className="core-login-back" type="button" onClick={resetPhone}>← Change number</button><h2>Verify your number</h2><p className="core-login-sub">இந்த எண்ணிற்கு அனுப்பிய 6 இலக்க OTP-ஐ உள்ளிடுங்கள்.</p><div className="core-login-summary"><small>OTP SENT TO</small><strong>{phone}</strong></div><label className="core-login-label">6-DIGIT VERIFICATION CODE</label><input ref={inputRef} className="core-login-input core-login-otp" type="tel" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="••••••"/><button className="core-login-btn" type="button" onClick={verifyCode} disabled={busy||code.length!==6}>{busy?"Verifying securely…":"Verify OTP"}</button></>}
          {phase==="orbit" && <><h2>Verifying securely…</h2><p className="core-login-sub">உங்கள் கணக்கை பாதுகாப்பாக இணைக்கிறோம்.</p></>}
          {phase==="verified" && <><h2>Account status</h2><p className="core-login-sub">{message}</p></>}
          {message && phase!=="verified" && <p role="status" className={`core-login-message ${/already registered|error|unable|invalid|incorrect|not configured|contact support/i.test(message)?"error":""}`}>{message}</p>}
          <div ref={recaptchaContainerRef} className="core-login-recaptcha"/>
          <p className="core-login-message" style={{fontSize:10,color:"#729b87"}}>By continuing, you agree to Sri Amirthaa’s Terms & Privacy Policy.</p>
        </section>
      </section>
      <footer className="core-login-footer"><span>© 2026 Sri Amirthaa Groups</span><span>IDENTITY • PRIVACY • SECURITY</span></footer>
    </main>
  );
}
