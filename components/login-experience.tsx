"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ArrowRight, Eye, EyeOff, Check } from "lucide-react";

type Props = { initialMode?: "login" | "signup"; adminMode?: boolean; onAuthenticated?: () => void };

export default function LoginExperience({ initialMode = "login", adminMode = false, onAuthenticated }: Props) {
  const [mode, setMode] = useState<"login" | "signup">(adminMode ? "login" : initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const cometRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current, comet = cometRef.current, form = formRef.current;
    if (!canvas || !comet || !form) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, x = window.innerWidth / 2, y = window.innerHeight / 2, vx = 0, vy = 0, last = 0;
    let target = { x, y };
    const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), r: .5 + Math.random() }));
    const resize = () => { const d = Math.min(2, window.devicePixelRatio || 1); canvas.width = innerWidth * d; canvas.height = innerHeight * d; };
    const aim = (el: Element) => { const r = el.getBoundingClientRect(); target = { x: r.left + Math.min(24, r.width / 3), y: r.top + r.height / 2 }; };
    const inputs = Array.from(form.querySelectorAll("input"));
    const handlers = inputs.map(el => { const fn = () => aim(el); el.addEventListener("focus", fn); return () => el.removeEventListener("focus", fn); });
    aim(inputs[0] || form);
    const tick = (now: number) => {
      last = now; vx = (vx + (target.x - x) * .06) * .82; vy = (vy + (target.y - y) * .06) * .82; x += vx; y += vy;
      comet.style.transform = `translate3d(${x}px,${y}px,0)`;
      const d = Math.min(2, window.devicePixelRatio || 1); ctx.setTransform(d,0,0,d,0,0); ctx.clearRect(0,0,innerWidth,innerHeight); ctx.globalCompositeOperation = "lighter";
      for (const s of stars) { const sx=s.x*innerWidth, sy=s.y*innerHeight, near=Math.max(0,1-Math.hypot(sx-x,sy-y)/230); ctx.fillStyle=`rgba(190,225,255,${.08+near*.65})`; ctx.beginPath(); ctx.arc(sx,sy,s.r,0,Math.PI*2); ctx.fill(); }
      if (!reduce) { ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-vx*3,y-vy*3); ctx.strokeStyle="rgba(140,203,255,.55)"; ctx.lineWidth=3; ctx.stroke(); }
      raf = requestAnimationFrame(tick);
    };
    resize(); window.addEventListener("resize", resize); raf=requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); handlers.forEach(fn=>fn()); };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice("");
    if (!email.trim() || !password) { setNotice("Enter your email and password."); return; }
    if (mode === "signup" && password !== confirmPassword) { setNotice("Passwords do not match."); return; }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) { setNotice("Authentication setup is incomplete. Configure the Supabase URL and publishable key."); return; }
    setBusy(true);
    try {
      const supabase = createClient(url, key);
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` } });
        if (error) throw error;
        setNotice("Sign-up submitted. Check your email to confirm your account.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        if (adminMode) {
          if (data.user?.app_metadata?.role !== "admin") { await supabase.auth.signOut(); throw new Error("This account does not have Admin access."); }
          setSuccess(true); setNotice("Admin access verified."); onAuthenticated?.();
        } else { setSuccess(true); setNotice("You're signed in. Opening your account…"); window.location.assign("/account"); }
      }
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to complete sign-in. Please try again."); setSuccess(false); }
    finally { setBusy(false); }
  }

  async function googleSignIn() {
    setNotice(""); const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) { setNotice("Google sign-in is not configured yet."); return; }
    setBusy(true);
    try { const supabase = createClient(url, key); const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } }); if (error) throw error; }
    catch (error) { setNotice(error instanceof Error ? error.message : "Google sign-in could not start."); setBusy(false); }
  }

  return (
    <main className="comet-auth">
      <div className="comet-night" aria-hidden="true" />
      <canvas ref={canvasRef} className="comet-sky" aria-hidden="true" />
      <div ref={cometRef} className="comet-orb" aria-hidden="true"><i /><b /></div>
      <form ref={formRef} className="comet-form" onSubmit={submit} noValidate>
        <Link className="comet-brand" href="/">1252's <strong>GROW WITH US</strong></Link>
        <div className="comet-heading"><span>{adminMode ? "SECURE ADMIN ACCESS" : "SRI AMIRTHAA ID"}</span><h1>{adminMode ? <>Admin <em>Sign in</em></> : mode === "login" ? <>Welcome <em>Back</em></> : <>Create <em>Account</em></>}</h1><p>{adminMode ? "Sign in with an account assigned the Admin role." : mode === "login" ? "One secure account for your Sri Amirthaa services." : "Create one account to use across participating websites."}</p></div>
        {mode === "signup" && !adminMode && <label className="comet-field"><span>Full name</span><input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="Your full name" required /></label>}
        <label className="comet-field"><span>Email address</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" placeholder="name@example.com" required /></label>
        <label className="comet-field"><span>Password</span><div className="comet-password"><input type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="signup"?"new-password":"current-password"} placeholder="Enter your password" minLength={8} required /><button type="button" aria-label={showPassword?"Hide password":"Show password"} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        {mode === "signup" && !adminMode && <label className="comet-field"><span>Confirm password</span><input type={showPassword?"text":"password"} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Re-enter your password" minLength={8} required /></label>}
        {!adminMode && mode === "signup" && <label className="comet-terms"><input type="checkbox" required/><span>I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</span></label>}
        <button className={success?"comet-submit done":"comet-submit"} type="submit" disabled={busy}><span>{busy?"Please wait…":mode==="signup"?"Create account":adminMode?"Admin sign in":"Sign in"} <ArrowRight size={17}/></span><span className="comet-success"><Check size={18}/> You're in</span></button>
        {notice && <p className="comet-notice" role="status">{notice}</p>}
        {!adminMode && <><div className="comet-divider"><i/> OR CONTINUE WITH <i/></div><button className="comet-google" type="button" onClick={googleSignIn} disabled={busy}><b>G</b> Continue with Google</button><p className="comet-switch">{mode==="login"?"Don't have an account?":"Already have an account?"} <button type="button" onClick={()=>{setMode(mode==="login"?"signup":"login");setNotice("");setPassword("");setConfirmPassword("");}}>{mode==="login"?"Sign up":"Sign in"}</button></p></>}
      </form>
      {adminMode && <p className="comet-admin-foot">Admin access is checked against the Supabase Auth app_metadata role.</p>}
    </main>
  );
}
