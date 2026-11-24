"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import {
  EmailAuthProvider, GoogleAuthProvider, OAuthProvider, getAuth,
  linkWithCredential, signInWithEmailAndPassword, signInWithPhoneNumber,
  signInWithPopup, type ConfirmationResult
} from "firebase/auth";
import { firebaseApp } from "@/lib/firebase";

type Props = { initialMode?: "login" | "signup" };
const inputStyle: React.CSSProperties = { width:"100%", height:50, padding:"0 14px", border:"1px solid #d5e2ef", borderRadius:12, background:"#fff", color:"#243b57", outline:"none", boxSizing:"border-box" };
const buttonStyle: React.CSSProperties = { width:"100%", minHeight:50, border:0, borderRadius:12, background:"linear-gradient(100deg,#c8f0e0,#d8e8ff)", color:"#23416b", fontWeight:800, cursor:"pointer" };

export default function UnifiedIdentityLogin({ initialMode = "login" }: Props) {
  const [mode,setMode] = useState<"login"|"signup">(initialMode);
  const [identifier,setIdentifier] = useState("");
  const [email,setEmail] = useState("");
  const [phone,setPhone] = useState("");
  const [fullName,setFullName] = useState("");
  const [password,setPassword] = useState("");
  const [confirmPassword,setConfirmPassword] = useState("");
  const [otp,setOtp] = useState("");
  const [confirmation,setConfirmation] = useState<ConfirmationResult|null>(null);
  const [notice,setNotice] = useState("");
  const [busy,setBusy] = useState(false);
  const [showOtp,setShowOtp] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const auth = getAuth(firebaseApp);

  function phoneE164() {
    const digits = phone.replace(/\D/g,"");
    if (digits.length !== 10) throw new Error("Enter a valid 10-digit Indian mobile number.");
    return "+91" + digits;
  }

  async function startCentralSession(firebaseIdToken:string) {
    const response = await fetch("/api/auth/sri-amirthaa/start", {
      method:"POST", headers:{"Content-Type":"application/json"}, credentials:"same-origin", cache:"no-store",
      body:JSON.stringify({firebaseIdToken})
    });
    const result = await response.json().catch(()=>({}));
    if (!response.ok || typeof result.authorizationUrl !== "string") throw new Error(result.error || "Sri Amirthaa ID sign-in could not be completed.");
    window.location.assign(result.authorizationUrl);
  }

  async function signIn() {
    setNotice("");
    const value = identifier.trim();
    if (!value) throw new Error("Enter your phone number or email address.");
    if (!password) throw new Error("Enter your password.");
    const normalized = value.startsWith("+") ? value.replace(/[\s()-]/g,"") : (/^\d{10}$/.test(value) ? "+91"+value : value.toLowerCase());
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!url || !key || !firebaseApiKey) throw new Error("Sri Amirthaa ID authentication is not configured.");
    const supabase = createClient(url,key);
    const check = await fetch(url.replace(/\/$/,"")+"/functions/v1/identifier-login",{
      method:"POST", headers:{"Content-Type":"application/json",apikey:key},
      body:JSON.stringify({identifier:normalized,password,firebaseApiKey})
    });
    const checked = await check.json().catch(()=>({}));
    if (!check.ok) throw new Error(checked.error==="INVALID_CREDENTIALS"?"Phone/email or password is incorrect.":checked.error==="IDENTITY_NOT_FOUND"?"No Sri Amirthaa ID was found for this phone/email.":checked.error==="ACCOUNT_NOT_ACTIVE"?"This account is inactive.": "Unable to verify your Sri Amirthaa ID. Please try again.");
    const credential = await signInWithEmailAndPassword(auth,checked.email || normalized,password);
    await startCentralSession(await credential.user.getIdToken(true));
    void supabase;
  }

  async function beginSignup() {
    setNotice("");
    if (!fullName.trim()) throw new Error("Enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error("Enter a valid email address.");
    const e164 = phoneE164();
    if (password.length < 8 || !/\d/.test(password) || !/[^\w\s]/.test(password) || !/[A-Z]/.test(password)) throw new Error("Password must contain 8 characters, one capital letter, one number and one symbol.");
    if (password !== confirmPassword) throw new Error("Passwords do not match.");
    const [phoneCheck,emailCheck] = await Promise.all([
      fetch("/api/auth/check-phone",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:e164})}),
      fetch("/api/auth/check-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.trim().toLowerCase()})})
    ]);
    const p = await phoneCheck.json().catch(()=>({}));
    const e = await emailCheck.json().catch(()=>({}));
    if (!phoneCheck.ok) throw new Error(p.error || "Unable to check this phone number.");
    if (!emailCheck.ok) throw new Error(e.error || "Unable to check this email address.");
    if (p.registered) throw new Error("This phone number is already registered. Please sign in.");
    if (!e.available) throw new Error("This email is already registered. Please sign in.");
    const container = recaptchaRef.current;
    if (!container) throw new Error("Security verification is not ready. Refresh and try again.");
    container.replaceChildren();
    const { RecaptchaVerifier } = await import("firebase/auth");
    const verifier = new RecaptchaVerifier(auth,container,{size:"invisible"});
    await verifier.render();
    const result = await signInWithPhoneNumber(auth,e164,verifier);
    setConfirmation(result);
    setShowOtp(true);
    setNotice("A 6-digit OTP has been sent to your +91 mobile number.");
  }

  async function verifySignupOtp() {
    if (!confirmation || !/^\d{6}$/.test(otp)) throw new Error("Enter the 6-digit OTP.");
    const phoneCredential = await confirmation.confirm(otp);
    const emailCredential = EmailAuthProvider.credential(email.trim().toLowerCase(),password);
    const linked = await linkWithCredential(phoneCredential.user,emailCredential);
    await linked.user.updateProfile({displayName:fullName.trim()});
    const firebaseIdToken = await linked.user.getIdToken(true);
    const response = await fetch("/api/auth/phone-signup",{
      method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",
      body:JSON.stringify({firebaseIdToken,email:email.trim().toLowerCase(),fullName:fullName.trim()})
    });
    const result = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(result.error || "Unable to finish account registration.");
    setNotice("Phone OTP verified. Your account has been created. Please confirm the email sent to you, then sign in with your phone/email and password.");
    setShowOtp(false);
    setConfirmation(null);
    setMode("login");
    setIdentifier(email.trim().toLowerCase());
    setPassword("");
    setConfirmPassword("");
    setOtp("");
  }

  async function providerSignIn(provider:"google"|"apple") {
    const credential = provider==="google"
      ? await signInWithPopup(auth,new GoogleAuthProvider())
      : await signInWithPopup(auth,new OAuthProvider("apple.com"));
    if (!credential.user.phoneNumber) throw new Error("This Google/Apple account has no verified phone linked yet. Sign in with Phone once and link the same account before using this provider.");
    await startCentralSession(await credential.user.getIdToken(true));
  }

  async function run(action:()=>Promise<void>) {
    setBusy(true);setNotice("");
    try { await action(); }
    catch(error) { setNotice(error instanceof Error?error.message:"Unable to continue. Please try again."); }
    finally { setBusy(false); }
  }

  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"28px 18px",background:"linear-gradient(135deg,#f7fbff 0%,#f0f8f5 55%,#fff7ef 100%)",color:"#17243b",fontFamily:"Inter,ui-sans-serif,system-ui,sans-serif"}}>
      <section style={{width:"min(100%,460px)",padding:"30px",border:"1px solid #dbe6f1",borderRadius:24,background:"#ffffffed",boxShadow:"0 24px 70px #567aa51c"}}>
        <div style={{textAlign:"center",marginBottom:22}}>
          <Image src="/images/sri-amirthaa-groups-1252.png" alt="Sri Amirthaa Groups" width={180} height={72} priority style={{objectFit:"contain",margin:"0 auto"}}/>
          <h1 style={{fontSize:26,margin:"12px 0 6px",color:"#1d3151"}}>Sri Amirthaa ID</h1>
          <p style={{fontSize:13,color:"#62748e",margin:0}}>One account. One UID. Access every connected service.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18}}>
          <button type="button" onClick={()=>{setMode("login");setShowOtp(false);setNotice("");}} style={{...buttonStyle,background:mode==="login"?"#d8eee6":"#f3f7fb"}}>Sign In</button>
          <button type="button" onClick={()=>{setMode("signup");setShowOtp(false);setNotice("");}} style={{...buttonStyle,background:mode==="signup"?"#d8eee6":"#f3f7fb"}}>Sign Up</button>
        </div>
        {mode==="login" ? <>
          <label style={{display:"block",fontSize:11,fontWeight:700,color:"#607b9c",margin:"12px 0 7px"}}>PHONE NUMBER OR EMAIL</label>
          <input style={inputStyle} value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="+91 9876543210 or name@example.com" autoComplete="username"/>
          <label style={{display:"block",fontSize:11,fontWeight:700,color:"#607b9c",margin:"12px 0 7px"}}>PASSWORD</label>
          <input style={inputStyle} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password"/>
          <button type="button" style={{...buttonStyle,marginTop:18}} disabled={busy} onClick={()=>run(signIn)}>{busy?"Please wait…":"Sign In"}</button>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}>
            <button type="button" style={{...buttonStyle,background:"#fff",border:"1px solid #d5e2ef"}} disabled={busy} onClick={()=>run(()=>providerSignIn("google"))}>Continue with Google</button>
            <button type="button" style={{...buttonStyle,background:"#fff",border:"1px solid #d5e2ef"}} disabled={busy} onClick={()=>run(()=>providerSignIn("apple"))}>Continue with Apple</button>
          </div>
        </> : <>
          {!showOtp ? <>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#607b9c",margin:"12px 0 7px"}}>FULL NAME</label>
            <input style={inputStyle} value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your full name" autoComplete="name"/>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#607b9c",margin:"12px 0 7px"}}>EMAIL ADDRESS</label>
            <input style={inputStyle} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email"/>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#607b9c",margin:"12px 0 7px"}}>PHONE NUMBER</label>
            <div style={{display:"grid",gridTemplateColumns:"76px 1fr",gap:8}}><div style={{...inputStyle,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,background:"#f5f9fd"}}>🇮🇳 +91</div><input style={inputStyle} type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="10-digit mobile number" autoComplete="tel-national"/></div>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#607b9c",margin:"12px 0 7px"}}>PASSWORD</label>
            <input style={inputStyle} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Create a strong password" autoComplete="new-password"/>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#607b9c",margin:"12px 0 7px"}}>CONFIRM PASSWORD</label>
            <input style={inputStyle} type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Re-enter your password" autoComplete="new-password"/>
            <button type="button" style={{...buttonStyle,marginTop:18}} disabled={busy} onClick={()=>run(beginSignup)}>{busy?"Checking details…":"Continue & Send OTP"}</button>
          </> : <>
            <p style={{fontSize:13,color:"#62748e",lineHeight:1.7}}>OTP sent to <b>+91 {phone}</b>. Verify your mobile number to create your Sri Amirthaa ID.</p>
            <input style={{...inputStyle,textAlign:"center",letterSpacing:".4em",fontSize:20}} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="••••••" inputMode="numeric" autoComplete="one-time-code" maxLength={6}/>
            <button type="button" style={{...buttonStyle,marginTop:16}} disabled={busy} onClick={()=>run(verifySignupOtp)}>{busy?"Verifying…":"Verify OTP & Create Account"}</button>
            <button type="button" style={{...buttonStyle,marginTop:8,background:"transparent",color:"#5276a6"}} onClick={()=>{setShowOtp(false);setConfirmation(null);setOtp("");}}>Back</button>
          </>}
        </>}
        {notice&&<p role="status" style={{fontSize:12,lineHeight:1.6,color:/verified|created|sent/i.test(notice)?"#168363":"#b44d4a",margin:"16px 0 0"}}>{notice}</p>}
        <div ref={recaptchaRef}/>
        <p style={{fontSize:10,color:"#8b9db2",textAlign:"center",margin:"18px 0 0"}}>Secure authentication • Phone and email are linked to one immutable Sri Amirthaa UID</p>
      </section>
    </main>
  );
}
