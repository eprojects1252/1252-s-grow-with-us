"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { ArrowRight, Eye, EyeOff, Check } from "lucide-react";
import PhoneOtpLogin from "@/components/phone-otp-login";

type Props = { initialMode?: "login" | "signup"; adminMode?: boolean; onAuthenticated?: () => void };
const PASSWORD_RULES = [
  { test: /\d/, label: "a number" },
  { test: /[^\w\s]/, label: "a symbol" },
  { test: /[A-Z]/, label: "a capital" },
  { test: /.{8,}/, label: "8+ characters" },
];
const PASSWORD_TONES = ["#D93D42", "#C2410C", "#F5A524", "#9BD04A", "#15803D"];
const PASSWORD_WORDS = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const passwordScore = (value: string) => PASSWORD_RULES.filter(rule => rule.test.test(value)).length;

export default function LoginExperience({ initialMode = "login", adminMode = false, onAuthenticated }: Props) {
  const [mode, setMode] = useState<"login" | "signup">(adminMode ? "login" : initialMode);
  const [showPhoneOtp, setShowPhoneOtp] = useState(!adminMode);
  const [forgotPassword, setForgotPassword] = useState(false);
  const signup = mode === "signup" && !adminMode && !showPhoneOtp && !forgotPassword;
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const score = passwordScore(password);



  function updatePassword(value:string) { setPassword(value); setNotice(""); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setNotice("");
    if(!email.trim()){setNotice("Enter your email address.");return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setNotice("Enter a valid email address.");return;}
    if(forgotPassword){
      const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if(!url||!key){setNotice("Password recovery is not configured yet.");return;}
      setBusy(true);
      try{const supabase=createClient(url,key);const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+"/auth/reset-password"});if(error)throw error;setNotice("If an account exists for this email, a password reset link has been sent.");}
      catch(error){setNotice(error instanceof Error?error.message:"Unable to send the reset link. Please try again.");}
      finally{setBusy(false);}
      return;
    }
    if(!password){setNotice("Enter your password.");return;}
    if(signup){
      if(!name.trim()){setNotice("Enter your full name.");return;}
      const terms=formRef.current?.querySelector<HTMLInputElement>(".auth-terms input");
      if(!terms?.checked){setNotice("Please accept the Terms and Privacy Policy.");return;}
  const missing=PASSWORD_RULES.find(rule=>!rule.test.test(password));
      if(missing){setNotice("Please add "+missing.label+" to your password.");formRef.current?.dispatchEvent(new Event("runaway:wobble"));return;}
      if(password!==confirmPassword){setNotice("Passwords do not match.");return;}
    }
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if(!url||!key){setNotice("Authentication setup is incomplete. Configure the Supabase URL and publishable key.");return;}
    setBusy(true);
    try{
      const supabase=createClient(url,key);
      if(signup){
        const {error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim()},emailRedirectTo:window.location.origin+"/auth/callback"}});
        if(error)throw error;
        setSuccess(true);formRef.current?.dispatchEvent(new Event("auth:success"));setNotice("Sign-up submitted. Check your email to confirm your account.");
      }else{
        const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
        if(error)throw error;
        if(adminMode){
          if(data.user?.app_metadata?.role!=="admin"){await supabase.auth.signOut();throw new Error("This account does not have Admin access.");}
          setSuccess(true);formRef.current?.dispatchEvent(new Event("auth:success"));setNotice("Admin access verified.");onAuthenticated?.();
        }else{setSuccess(true);formRef.current?.dispatchEvent(new Event("auth:success"));setNotice("You're signed in. Opening your account…");await new Promise(resolve=>window.setTimeout(resolve,1250));window.location.assign("/account");}
      }
    }catch(error){if(!signup)setNotice(error instanceof Error?error.message:"Unable to complete sign-in. Please try again.");setSuccess(false);}
    finally{setBusy(false);}
  }
  async function googleSignIn(){
    setNotice("");const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if(!url||!key){setNotice("Google sign-in is not configured yet.");return;}
    setBusy(true);
    try{const supabase=createClient(url,key);const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin+"/auth/callback"}});if(error)throw error;}
    catch(error){setNotice(error instanceof Error?error.message:"Google sign-in could not start.");setBusy(false);}
  }
  async function appleSignIn(){
    setNotice("");
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if(!url||!key){setNotice("Apple sign-in is not configured yet.");return;}
    setBusy(true);
    try{
      const supabase=createClient(url,key);
      const {error}=await supabase.auth.signInWithOAuth({provider:"apple",options:{redirectTo:window.location.origin+"/auth/callback"}});
      if(error)throw error;
    }catch(error){
      setNotice(error instanceof Error?error.message:"Apple sign-in could not start.");
      setBusy(false);
    }
  }

  const missing=PASSWORD_RULES.find(rule=>!rule.test.test(password));
  const tone=PASSWORD_TONES[score];
  if (showPhoneOtp && !adminMode) return <PhoneOtpLogin onClose={()=>{setShowPhoneOtp(false);setNotice("");}} />;

  return (
    <main className="auth-page">
      <aside className="auth-showcase"><div className="auth-orb auth-orb-one"/><div className="auth-orb auth-orb-two"/><div className="auth-showcase-content"><span className="auth-live"><i/> SRI AMIRTHAA IDENTITY NETWORK</span><div className="auth-monogram"><Image src="/images/sri-amirthaa-groups-1252.png" alt="Sri Amirthaa Groups" width={300} height={120} priority /></div><h2>One identity.<br/><em>Everywhere you belong.</em></h2><p>One trusted identity. Seamless access across the Sri Amirthaa digital ecosystem.</p><div className="auth-feature"><span>01</span><div><b>One secure account</b><small>Access connected Sri Amirthaa services.</small></div></div><div className="auth-feature"><span>02</span><div><b>Protected sign-in</b><small>OTP and trusted identity providers.</small></div></div><div className="auth-feature"><span>03</span><div><b>Your account, your control</b><small>Privacy-first access and recovery.</small></div></div></div><div className="auth-showcase-foot">SRI AMIRTHAA GROUPS <span>•</span> SECURE IDENTITY</div></aside>
      <form id="auth-form" ref={formRef} className="auth-form" onSubmit={submit} onKeyDown={e=>{if(signup&&e.key==="Enter"&&score<4)formRef.current?.dispatchEvent(new Event("runaway:wobble"));}} noValidate>
        <Link className="auth-brand" href="/" aria-label="Sri Amirthaa Groups home"><Image src="/images/sri-amirthaa-groups-1252.png" alt="Sri Amirthaa Groups" width={190} height={76} priority /></Link>
        <div className="auth-heading"><span>{adminMode?"SECURE ADMIN ACCESS":forgotPassword?"ACCOUNT RECOVERY":"SRI AMIRTHAA ID"}</span><h1>{adminMode?<>Admin <em>Sign in</em></>:forgotPassword?<>Reset <em>Password</em></>:mode==="login"?<>Welcome <em>Back</em></>:<>Create <em>Account</em></>}</h1><p>{adminMode?"Sign in with an account assigned the Admin role.":forgotPassword?"We’ll email you a secure link to create a new password.":mode==="login"?"Your secure gateway to the Sri Amirthaa ecosystem.":"Create one account to use across participating websites."}</p></div>
        {!adminMode && !forgotPassword && <button type="button" className="auth-google" onClick={()=>setShowPhoneOtp(v=>!v)} aria-expanded={showPhoneOtp}><span aria-hidden="true">📱</span> {showPhoneOtp?"Back to sign-in options":"Continue with Phone"}</button>}
        {showPhoneOtp && !adminMode && <PhoneOtpLogin onClose={()=>{setShowPhoneOtp(false);setNotice("");}} />}
        {!showPhoneOtp&&!forgotPassword&&signup&&<label className="auth-field"><span>Full name</span><input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="Your full name" required/></label>}
        {!showPhoneOtp&&<><div className="auth-method-label">{forgotPassword?"RECOVERY EMAIL":"CONTINUE WITH EMAIL"}</div><label className="auth-field auth-email"><span>Email address</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" placeholder="name@example.com" required/></label>
        {!forgotPassword&&<label className="auth-field"><span>Password</span><div className="auth-password"><input type={showPassword?"text":"password"} value={password} onChange={e=>updatePassword(e.target.value)} autoComplete={signup?"new-password":"current-password"} placeholder="Enter your password" minLength={signup?8:1} required/><button type="button" aria-label={showPassword?"Hide password":"Show password"} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>}
        {!forgotPassword&&signup&&<section className="runaway-strength" aria-live="polite">
          <div className="runaway-meter" style={{"--meter-tone":tone} as React.CSSProperties}>{[0,1,2,3].map(i=><i key={i} className={i<score?"on":""}/>)}<b>{password?PASSWORD_WORDS[score]:""}</b></div>
          <ul className="runaway-rules">{PASSWORD_RULES.map((rule,i)=><li key={rule.label} className={rule.test.test(password)?"met":""}>{rule.label}</li>)}</ul>
        </section>}
        {!forgotPassword&&signup&&<label className="auth-field"><span>Confirm password</span><input type={showPassword?"text":"password"} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Re-enter your password" minLength={8} required/></label>}
        {!forgotPassword&&!adminMode&&signup&&<label className="auth-terms"><input type="checkbox" required/><span>I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</span></label>}
        {!forgotPassword&&signup&&<div className="runaway-slot" aria-hidden="true"/>}
        {!forgotPassword&&mode==="login"&&!adminMode&&<button type="button" className="auth-forgot" onClick={()=>{setForgotPassword(true);setNotice("");setShowPhoneOtp(false);}}>Forgot password?</button>}
        {notice&&<p className="auth-notice" role="status">{notice}</p>}
        {!adminMode&&!forgotPassword&&!showPhoneOtp&&<><div className="auth-divider"><i/> OR CONTINUE WITH <i/></div><button className="auth-google" type="button" onClick={googleSignIn} disabled={busy}><svg aria-hidden="true" viewBox="0 0 48 48" width="19" height="19"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.9 6-15z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.3A20 20 0 0 0 24 44z"/><path fill="#FBBC05" d="M12.8 27.7a12 12 0 0 1 0-7.4V15H5.9a20 20 0 0 0 0 17.9z"/><path fill="#EA4335" d="M24 12.1c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.9 15l6.9 5.3c1.6-4.7 6-8.2 11.2-8.2z"/></svg> Continue with Google</button><button className="auth-google" type="button" onClick={appleSignIn} disabled={busy}><svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M16.37 12.5c.02 2.2 1.93 2.93 1.95 2.94-.02.05-.3 1.04-.99 2.06-.6.9-1.23 1.8-2.22 1.82-.97.02-1.28-.59-2.39-.59-1.1 0-1.45.57-2.36.61-.95.04-1.67-.98-2.27-1.88-1.23-1.82-2.17-5.14-.91-7.38.62-1.11 1.73-1.81 2.94-1.83.92-.02 1.79.64 2.36.64.56 0 1.62-.79 2.73-.67.47.02 1.8.19 2.65 1.44-.07.04-1.58.92-1.56 2.84ZM14.58 6.99c.5-.61.84-1.45.75-2.29-.72.03-1.59.48-2.11 1.09-.46.53-.87 1.39-.76 2.21.8.06 1.62-.41 2.12-1.01Z"/></svg> Continue with Apple</button><p className="auth-switch">{forgotPassword?"Remembered your password?":mode==="login"?"Don't have an account?":"Already have an account?"} <button type="button" onClick={()=>{if(forgotPassword){setForgotPassword(false);setNotice("");return;}setMode(mode==="login"?"signup":"login");setNotice("");setPassword("");setConfirmPassword("");setShowPassword(false);setSuccess(false);}}>{forgotPassword?"Back to sign in":mode==="login"?"Sign up":"Sign in"}</button></p></>}
        </>}
      </form>

        {!showPhoneOtp&&<button ref={submitRef} className={`auth-submit ${success?"done":""}`} type="submit" form="auth-form" disabled={busy}><span>{busy?"Please wait…":forgotPassword?"Send reset link":adminMode?"Admin sign in":signup?"Create account":"Sign in"} <ArrowRight size={17}/></span><span><Check size={18}/> {signup?"Account created":"You're in"}</span></button>}
      {adminMode&&<p className="auth-admin-foot">Admin access is checked against the Supabase Auth app_metadata role.</p>}
    </main>
  );
}
