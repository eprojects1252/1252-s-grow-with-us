"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ArrowRight, Eye, EyeOff, Check } from "lucide-react";

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
  const submitRef = useRef<HTMLButtonElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const score = passwordScore(password);
  const signup = mode === "signup" && !adminMode;

  useEffect(() => {
    const canvas = canvasRef.current, comet = cometRef.current, form = formRef.current;
    if (!canvas || !comet || !form) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = reduceMotion.matches;
    const STIFF = .06, DAMP = .82, TAIL = 36;
    let raf = 0, x = window.innerWidth * .5, y = window.innerHeight * .5, vx = 0, vy = 0;
    let goal = { x, y }, pointer: { x: number; y: number } | null = null;
    let phase: "idle" | "wrong" | "success" = "idle", phaseAt = 0, last = 0, orbit = 0;
    const trail: Array<{x:number;y:number;life:number}> = [];
    const sparks: Array<{x:number;y:number;vx:number;vy:number;life:number;size:number}> = [];
    const rings: Array<{x:number;y:number;life:number}> = [];
    const stars = Array.from({length:90}, () => ({x:Math.random(),y:Math.random(),r:.35+Math.random()*1.35,p:Math.random()*Math.PI*2}));
    const inputs = Array.from(form.querySelectorAll<HTMLInputElement>("input:not([type=checkbox])"));
    const resize = () => {
      const d = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(window.innerWidth*d); canvas.height = Math.round(window.innerHeight*d);
      canvas.style.width = window.innerWidth+"px"; canvas.style.height = window.innerHeight+"px";
    };
    const inputAim = (el: HTMLInputElement) => {
      const r = el.getBoundingClientRect();
      let caretX = r.left + 18;
      try {
        if (el.type === "text" || el.type === "email") {
          const before = el.value.slice(0, el.selectionStart || 0);
          const style = getComputedStyle(el);
          const measure = document.createElement("canvas").getContext("2d");
          if (measure) { measure.font = style.font; caretX = r.left + 14 + measure.measureText(before).width; }
        } else if (el.type === "password") {
          caretX = r.left + Math.min(r.width-24, 18 + (el.value.length * 8));
        }
      } catch {}
      goal = {x:Math.max(r.left+12,Math.min(r.right-12,caretX)),y:r.top+r.height*.5};
    };
    const aimAtElement = (target: EventTarget | null) => {
      const el = target instanceof Element ? target.closest("input") : null;
      if (el instanceof HTMLInputElement && form.contains(el) && el.type !== "checkbox") inputAim(el);
    };
    const focusHandler = (e: Event) => aimAtElement(e.target);
    const typingHandler = (e: Event) => aimAtElement(e.target);
    form.addEventListener("focusin", focusHandler);
    form.addEventListener("input", typingHandler);
    form.addEventListener("click", focusHandler);
    const first = inputs.find(el => el.offsetParent !== null);
    if (first) inputAim(first);
    else { const r=form.getBoundingClientRect(); goal={x:r.left+24,y:r.top+80}; }
    const burst = (at:{x:number;y:number}, count:number, power:number) => {
      for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,v=power*(.25+Math.random());sparks.push({x:at.x,y:at.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,size:1+Math.random()*2.8});}
    };
    const onWrong = () => { phase="wrong";phaseAt=performance.now();comet.classList.add("comet-fizzle");burst({x,y},34,5); };
    const onSuccess = () => { phase="success";phaseAt=performance.now();comet.classList.remove("comet-fizzle"); };
    form.addEventListener("comet:wrong", onWrong as EventListener);
    form.addEventListener("comet:success", onSuccess as EventListener);
    const tick = (now:number) => {
      const dt=Math.min(.033,Math.max(.001,(now-(last||now))/1000));last=now;
      if(phase==="idle"){
        if(pointer && !reduce){goal={x:goal.x,y:goal.y};}
        const dx=goal.x-x,dy=goal.y-y;
        vx=(vx+dx*STIFF)*DAMP;vy=(vy+dy*STIFF)*DAMP;x+=vx;y+=vy;
        orbit+=dt*1.7;
        if(Math.hypot(dx,dy)<9){x+=Math.cos(orbit)*.7;y+=Math.sin(orbit*1.2)*.5;}
      } else if(phase==="wrong"){
        const t=(now-phaseAt)/1000;
        if(t<.62){vx=-vx*.92+(Math.random()-.5)*2.2;vy=-vy*.92+(Math.random()-.5)*2.2;x+=vx*2;y+=vy*2;}
        else {phase="idle";comet.classList.remove("comet-fizzle");const active=form.querySelector<HTMLInputElement>("input:focus");if(active)inputAim(active);}
      } else {
        const button=submitRef.current, r=button?.getBoundingClientRect();
        if(r){const tx=r.left+r.width*.5,ty=r.top+r.height*.5;const t=Math.min(1,(now-phaseAt)/650);x+=(tx-x)*(.035+t*.12);y+=(ty-y)*(.035+t*.12);if(t>.85){rings.push({x:tx,y:ty,life:1});burst({x:tx,y:ty},42,7);phase="idle";}}
      }
      comet.style.transform="translate3d("+(x-12)+"px,"+(y-12)+"px,0)";
      trail.push({x,y,life:1});if(trail.length>TAIL)trail.shift();
      const d=Math.min(2,window.devicePixelRatio||1);
      ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,window.innerWidth,window.innerHeight);ctx.globalCompositeOperation="lighter";
      for(const s of stars){const near=Math.max(0,1-Math.hypot(s.x*innerWidth-x,s.y*innerHeight-y)/260);const twinkle=.35+.3*Math.sin(now*.0015+s.p);ctx.beginPath();ctx.arc(s.x*innerWidth,s.y*innerHeight,s.r+near,0,Math.PI*2);ctx.fillStyle="rgba(190,220,255,"+(.12+twinkle*.35+near*.5)+")";ctx.fill();}
      if(!reduce){
        for(let pass=2;pass>=0;pass--){ctx.beginPath();trail.forEach((p,i)=>{if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});ctx.strokeStyle=pass===0?"rgba(225,246,255,.9)":pass===1?"rgba(91,177,255,.28)":"rgba(50,126,255,.12)";ctx.lineWidth=pass===0?1.6:pass===1?5:11;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();}
      }
      for(let i=sparks.length-1;i>=0;i--){const p=sparks[i];p.x+=p.vx;p.y+=p.vy;p.vx*=.97;p.vy*=.97;p.life-=dt*1.5;ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);ctx.fillStyle="rgba(133,204,255,"+Math.max(0,p.life)+")";ctx.fill();if(p.life<=0)sparks.splice(i,1);}
      for(let i=rings.length-1;i>=0;i--){const q=rings[i];q.life-=dt*1.6;ctx.beginPath();ctx.arc(q.x,q.y,(1-q.life)*58,0,Math.PI*2);ctx.strokeStyle="rgba(153,211,255,"+q.life+")";ctx.lineWidth=2;ctx.stroke();if(q.life<=0)rings.splice(i,1);}
      raf=requestAnimationFrame(tick);
    };
    resize();window.addEventListener("resize",resize);raf=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);form.removeEventListener("focusin",focusHandler);form.removeEventListener("input",typingHandler);form.removeEventListener("click",focusHandler);form.removeEventListener("comet:wrong",onWrong as EventListener);form.removeEventListener("comet:success",onSuccess as EventListener);};
  }, []);

  useEffect(() => {
    const button=submitRef.current, slot=slotRef.current, form=formRef.current;
    if(!button||!slot||!form)return;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
    const RUN=170,REACH=90;
    let pos={x:0,y:0},vel={x:0,y:0},target={x:0,y:0},pointer:{x:number;y:number}|null=null;
    let lastFlee=-1e9,raf=0,last=performance.now(),wobbleAt=-1e9;
    const home=()=>{const r=slot.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};};
    const dist=(p:{x:number;y:number})=>Math.hypot(p.x-pos.x,p.y-pos.y);
    const fit=(x:number,y:number)=>{const w=button.offsetWidth/2+24,h=button.offsetHeight/2+24;return{x:Math.min(innerWidth-w,Math.max(w,x)),y:Math.min(innerHeight-h,Math.max(h,y))};};
    const flee=(from:{x:number;y:number},now:number)=>{
      const strength=passwordScore(password);const run=RUN*(1-strength/4);
      if(!run||dist(from)>REACH||now-lastFlee<260)return;
      let dx=pos.x-from.x,dy=pos.y-from.y,d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
      let to=fit(pos.x+dx*run,pos.y+dy*run);
      if(Math.hypot(to.x-pos.x,to.y-pos.y)<run*.6){const side=Math.abs(dx)>Math.abs(dy)?{x:0,y:pos.y<innerHeight/2?1:-1}:{x:pos.x<innerWidth/2?1:-1,y:0};to=fit(pos.x+side.x*run+dx*run*.3,pos.y+side.y*run+dy*run*.3);dx=side.x;dy=side.y;}
      target=to;vel.x+=dx*run*5;vel.y+=dy*run*5;lastFlee=now;slot.classList.add("runaway-empty");
    };
    const move=(e:PointerEvent)=>{pointer={x:e.clientX,y:e.clientY};};
    const down=(e:PointerEvent)=>{pointer={x:e.clientX,y:e.clientY};if(e.pointerType!=="mouse"&&!reduced.matches)flee(pointer,performance.now());};
    const up=(e:PointerEvent)=>{if(e.pointerType!=="mouse")pointer=null;};
    const leave=()=>{pointer=null;};
    const resize=()=>{if(!slot.classList.contains("runaway-empty"))pos=home();target={...pos};};
    const tick=(now:number)=>{
      const dt=Math.min(1/30,Math.max(0,(now-last)/1000));last=now;
      const s=passwordScore(password),runner=!reduced.matches&&!success&&s<4;
      if(runner&&pointer)flee(pointer,now);
      const far=!pointer||dist(pointer)>REACH*1.6,going=runner&&far&&now-lastFlee>900;
      if(going)target=home();
      const k=s/4,response=going ? .6 : .3+.25*k,zeta=going ? .9 : .55+.2*k,w=2*Math.PI/response;
      vel.x+=(w*w*(target.x-pos.x)-2*zeta*w*vel.x)*dt;vel.y+=(w*w*(target.y-pos.y)-2*zeta*w*vel.y)*dt;
      pos.x+=vel.x*dt;pos.y+=vel.y*dt;
      const h=home();if(Math.hypot(pos.x-h.x,pos.y-h.y)<2&&Math.hypot(vel.x,vel.y)<20)slot.classList.remove("runaway-empty");
      const speed=Math.hypot(vel.x,vel.y),stretch=1+Math.min(.2,speed/4200),angle=Math.atan2(vel.y,vel.x);
      const x=pos.x-button.offsetWidth/2,y=pos.y-button.offsetHeight/2;
      button.style.transform="translate("+x.toFixed(2)+"px,"+y.toFixed(2)+"px) rotate("+angle+"rad) scale("+stretch.toFixed(4)+","+(1/stretch).toFixed(4)+") rotate("+(-angle)+"rad)";
      raf=requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove",move);window.addEventListener("pointerdown",down);window.addEventListener("pointerup",up);document.documentElement.addEventListener("pointerleave",leave);window.addEventListener("resize",resize);
    pos=home();target={...pos};raf=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("pointermove",move);window.removeEventListener("pointerdown",down);window.removeEventListener("pointerup",up);document.documentElement.removeEventListener("pointerleave",leave);window.removeEventListener("resize",resize);};
  }, [password,success,signup]);

  function updatePassword(value:string) { setPassword(value); setNotice(""); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setNotice("");
    if(!email.trim()||!password){setNotice("Enter your email and password.");return;}
    if(signup){
      if(!name.trim()){setNotice("Enter your full name.");return;}
      const missing=PASSWORD_RULES.find(rule=>!rule.test.test(password));
      if(missing){setNotice("Please add "+missing.label+" to your password.");submitRef.current?.classList.add("runaway-wobble");formRef.current?.dispatchEvent(new Event("comet:wrong"));window.setTimeout(()=>submitRef.current?.classList.remove("runaway-wobble"),450);return;}
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
        setSuccess(true);formRef.current?.dispatchEvent(new Event("comet:success"));setNotice("Sign-up submitted. Check your email to confirm your account.");
      }else{
        const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
        if(error)throw error;
        if(adminMode){
          if(data.user?.app_metadata?.role!=="admin"){await supabase.auth.signOut();throw new Error("This account does not have Admin access.");}
          setSuccess(true);formRef.current?.dispatchEvent(new Event("comet:success"));setNotice("Admin access verified.");onAuthenticated?.();
        }else{setSuccess(true);formRef.current?.dispatchEvent(new Event("comet:success"));setNotice("You're signed in. Opening your account…");window.location.assign("/account");}
      }
    }catch(error){formRef.current?.dispatchEvent(new Event("comet:wrong"));setNotice(error instanceof Error?error.message:"Unable to complete sign-in. Please try again.");setSuccess(false);}
    finally{setBusy(false);}
  }
  async function googleSignIn(){
    setNotice("");const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if(!url||!key){setNotice("Google sign-in is not configured yet.");return;}
    setBusy(true);
    try{const supabase=createClient(url,key);const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin+"/auth/callback"}});if(error)throw error;}
    catch(error){setNotice(error instanceof Error?error.message:"Google sign-in could not start.");setBusy(false);}
  }
  const missing=PASSWORD_RULES.find(rule=>!rule.test.test(password));
  const tone=PASSWORD_TONES[score];
  return (
    <main className="comet-auth">
      <div className="comet-night" aria-hidden="true"/>
      <canvas ref={canvasRef} className="comet-sky" aria-hidden="true"/>
      <div ref={cometRef} className="comet-orb" aria-hidden="true"><i/><b/></div>
      <form id="comet-auth-form" ref={formRef} className="comet-form" onSubmit={submit} noValidate>
        <Link className="comet-brand" href="/">1252's <strong>GROW WITH US</strong></Link>
        <div className="comet-heading"><span>{adminMode?"SECURE ADMIN ACCESS":"SRI AMIRTHAA ID"}</span><h1>{adminMode?<>Admin <em>Sign in</em></>:mode==="login"?<>Welcome <em>Back</em></>:<>Create <em>Account</em></>}</h1><p>{adminMode?"Sign in with an account assigned the Admin role.":mode==="login"?"One secure account for your Sri Amirthaa services.":"Create one account to use across participating websites."}</p></div>
        {signup&&<label className="comet-field"><span>Full name</span><input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="Your full name" required/></label>}
        <label className="comet-field"><span>Email address</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" placeholder="name@example.com" required/></label>
        <label className="comet-field"><span>Password</span><div className="comet-password"><input type={showPassword?"text":"password"} value={password} onChange={e=>updatePassword(e.target.value)} autoComplete={signup?"new-password":"current-password"} placeholder="Enter your password" minLength={signup?8:1} required/><button type="button" aria-label={showPassword?"Hide password":"Show password"} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        {signup&&<section className="runaway-strength" aria-live="polite">
          <div className="runaway-meter" style={{"--meter-tone":tone} as React.CSSProperties}>{[0,1,2,3].map(i=><i key={i} className={i<score?"on":""}/>)}<b>{password?PASSWORD_WORDS[score]:""}</b></div>
          <ul className="runaway-rules">{PASSWORD_RULES.map((rule,i)=><li key={rule.label} className={rule.test.test(password)?"met":""}>{rule.label}</li>)}</ul>
        </section>}
        {signup&&<label className="comet-field"><span>Confirm password</span><input type={showPassword?"text":"password"} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Re-enter your password" minLength={8} required/></label>}
        {!adminMode&&signup&&<label className="comet-terms"><input type="checkbox" required/><span>I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</span></label>}
        {signup&&<div ref={slotRef} className="runaway-slot" aria-hidden="true"/>}
        <button ref={submitRef} className={(success?"comet-submit done":"comet-submit")+(signup?" runaway-submit":"")} type="submit" form="comet-auth-form" disabled={busy}><span>{busy?"Please wait…":signup?(score===4?"Create account":score===0?"Nope":"Add "+(missing?.label||"details")):adminMode?"Admin sign in":"Sign in"} <ArrowRight size={17}/></span><span className="comet-success"><Check size={18}/> You're in</span></button>
        {notice&&<p className="comet-notice" role="status">{notice}</p>}
        {!adminMode&&<><div className="comet-divider"><i/> OR CONTINUE WITH <i/></div><button className="comet-google" type="button" onClick={googleSignIn} disabled={busy}><b>G</b> Continue with Google</button><p className="comet-switch">{mode==="login"?"Don't have an account?":"Already have an account?"} <button type="button" onClick={()=>{setMode(mode==="login"?"signup":"login");setNotice("");setPassword("");setConfirmPassword("");setSuccess(false);}}>{mode==="login"?"Sign up":"Sign in"}</button></p></>}
      </form>
      {adminMode&&<p className="comet-admin-foot">Admin access is checked against the Supabase Auth app_metadata role.</p>}
    </main>
  );
}
