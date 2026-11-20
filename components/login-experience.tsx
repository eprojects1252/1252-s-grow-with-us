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
  const signup = mode === "signup" && !adminMode;
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
  const passwordRef = useRef(password);
  const signupRef = useRef(signup);
  passwordRef.current = password;
  signupRef.current = signup;
  const slotRef = useRef<HTMLDivElement>(null);
  const score = passwordScore(password);

useEffect(() => {
    const button=submitRef.current, slot=slotRef.current, form=formRef.current;
    if(!button||!slot||!form||!signupRef.current)return;
    const activeButton=button, activeSlot=slot, activeForm=form;
    const RUN=170,REACH=90;
    const RULES=[[/\d/,"a number"],[/[^\w\s]/,"a symbol"],[/[A-Z]/,"a capital"],[/.{8,}/,"8+ characters"]] as const;
    const TONES=[["#D93D42","#fff"],["#C2410C","#fff"],["#F5A524","#1A1300"],["#9BD04A","#0F1A00"],["#15803D","#fff"]] as const;
    const WORDS=["Too weak","Weak","Fair","Good","Strong"], labels=Array.from(activeButton.querySelectorAll<HTMLElement>("span"));
    let pos:{x:number;y:number},vel={x:0,y:0},target:{x:number;y:number},pointer:{x:number;y:number}|null=null;
    let lastFlee=-1e9,sighAt=-1e9,wobbleAt=-1e9,said="",front=0,done=false,strong=false,cornered=false,raf=0,passwordFrame=0,last=performance.now();
    const motionQuery=window.matchMedia("(prefers-reduced-motion: reduce)");let reduced=motionQuery.matches;const still=()=>reduced, score=()=>RULES.filter(([re])=>re.test(passwordRef.current)).length;
    const home=()=>{const r=activeSlot.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};};
    const dist=(p:{x:number;y:number})=>Math.hypot(p.x-pos.x,p.y-pos.y);
    function say(text:string,withCheck=false){
      if(text===said)return;said=text;const out=labels[front],inn=labels[front^=1];if(!out||!inn)return;
      inn.replaceChildren();
      if(withCheck){const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 24 24");const path=document.createElementNS("http://www.w3.org/2000/svg","path");path.setAttribute("d","M5 12.5l4.5 4.5L19 7.5");path.setAttribute("pathLength","1");svg.append(path);inn.append(svg,document.createTextNode(text));}
      else inn.textContent=text;
      activeButton.setAttribute("aria-label",text);
      if(still()){out.style.opacity="0";inn.style.opacity="1";return;}
      out.animate([{opacity:1,transform:"none",filter:"blur(0)"},{opacity:0,transform:"translateY(-6px)",filter:"blur(2px)"}],{duration:160,easing:"ease-out",fill:"both"});
      inn.animate([{opacity:0,transform:"translateY(6px)",filter:"blur(2px)"},{opacity:1,transform:"none",filter:"blur(0)"}],{duration:220,easing:"cubic-bezier(.23, 1, .32, 1)",fill:"both"});
    }
    function update(){
      const n=score(),[tone,ink]=TONES[done?4:n];activeButton.style.setProperty("--tone",tone);activeButton.style.setProperty("--tone-ink",ink);
      activeButton.style.backgroundColor=tone;activeButton.style.color=ink;
      const meter=activeForm.querySelector(".runaway-meter");meter?.querySelectorAll("i").forEach((el,i)=>el.classList.toggle("on",i<n));
      const word=meter?.querySelector("b");if(word)word.textContent=passwordRef.current?WORDS[n]:"";
      activeForm.querySelectorAll(".runaway-rules li").forEach((el,i)=>el.classList.toggle("met",RULES[i][0].test(passwordRef.current)));
      const missing=RULES.find(([re])=>!re.test(passwordRef.current));
      say(done?"Account created":n===4?"Create account":n===0?"Nope":"Add "+missing?.[1],done);
      activeButton.classList.toggle("done",done);
    }
    function flee(from:{x:number;y:number},now:number){
      const run=RUN*(1-score()/4);if(!run||dist(from)>REACH||now-lastFlee<260)return;
      let dx=pos.x-from.x,dy=pos.y-from.y,d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
      const pad=24,w=activeButton.offsetWidth/2+pad,h=activeButton.offsetHeight/2+pad;
      const fit=(x:number,y:number)=>({x:Math.min(innerWidth-w,Math.max(w,x)),y:Math.min(innerHeight-h,Math.max(h,y))});
      let to=fit(pos.x+dx*run,pos.y+dy*run);
      if(Math.hypot(to.x-pos.x,to.y-pos.y)<run*.6){
        const side=Math.abs(dx)>Math.abs(dy)?{x:0,y:pos.y<innerHeight/2?1:-1}:{x:pos.x<innerWidth/2?1:-1,y:0};
        to=fit(pos.x+side.x*run+dx*run*.3,pos.y+side.y*run+dy*run*.3);dx=side.x;dy=side.y;
      }
      cornered=Math.hypot(to.x-pos.x,to.y-pos.y)<run*.35;target=to;vel.x+=dx*run*5;vel.y+=dy*run*5;lastFlee=now;activeSlot.classList.add("runaway-empty");if(cornered)say("I’m cornered!");
    }
    const move=(e:PointerEvent)=>{pointer={x:e.clientX,y:e.clientY};};
    const down=(e:PointerEvent)=>{pointer={x:e.clientX,y:e.clientY};if(e.pointerType!=="mouse"&&!still()&&!done)flee(pointer,performance.now());};
    const up=(e:PointerEvent)=>{if(e.pointerType!=="mouse")pointer=null;};
    const leave=()=>{pointer=null;};
    const resize=()=>{if(!activeSlot.classList.contains("runaway-empty"))pos=home();else{const pad=activeButton.offsetWidth/2+24,halfH=activeButton.offsetHeight/2+24;pos.x=Math.min(innerWidth-pad,Math.max(pad,pos.x));pos.y=Math.min(innerHeight-halfH,Math.max(halfH,pos.y));}target={...pos};vel={x:0,y:0};};
    const wobble=()=>{wobbleAt=performance.now();};
    const passwordInput=activeForm.querySelector<HTMLInputElement>(".auth-password input");
    const onPassword=()=>{cancelAnimationFrame(passwordFrame);passwordFrame=requestAnimationFrame(()=>{const n=score();if(n===4&&!strong)sighAt=performance.now();strong=n===4;done=false;cornered=false;update();});};
    const onSuccess=()=>{done=true;update();};
    activeForm.addEventListener("auth:success",onSuccess);activeForm.addEventListener("runaway:wobble",wobble);passwordInput?.addEventListener("input",onPassword);
    const tick=(now:number)=>{
      const dt=Math.min(1/30,Math.max(0,(now-last)/1000));last=now;
      const n=score(),runner=!still()&&!done&&signupRef.current&&n<4;
      if(runner&&pointer)flee(pointer,now);
      const far=!pointer||dist(pointer)>REACH*1.6,going=runner&&far&&now-lastFlee>900;
      if(going||(!runner&&!done)){target=home();cornered=false;}
      const k=n/4,response=going ? .6 : .3+.25*k,zeta=going ? .9 : .55+.2*k,w=2*Math.PI/response;
      vel.x+=(w*w*(target.x-pos.x)-2*zeta*w*vel.x)*dt;vel.y+=(w*w*(target.y-pos.y)-2*zeta*w*vel.y)*dt;
      pos.x+=vel.x*dt;pos.y+=vel.y*dt;
      const back=home();if(Math.hypot(pos.x-back.x,pos.y-back.y)<2&&Math.hypot(vel.x,vel.y)<20)activeSlot.classList.remove("runaway-empty");
      const speed=Math.hypot(vel.x,vel.y),stretch=1+Math.min(.2,speed/4200),angle=Math.atan2(vel.y,vel.x);
      let lx=0,ly=0,tilt=0,sy=1;
      if(pointer&&!still()){const d=dist(pointer),near=Math.max(0,1-d/(REACH*1.8)),ux=(pos.x-pointer.x)/(d||1),uy=(pos.y-pointer.y)/(d||1),lean=runner?12*near*near:-3*near;lx=ux*lean;ly=uy*lean;tilt=(runner?5:0)*near*Math.sign(ux||1);}
      const sigh=(now-sighAt)/450;if(sigh>=0&&sigh<1)sy-=.08*Math.sin(Math.PI*sigh);
      const wob=(now-wobbleAt)/360;if(wob>=0&&wob<1&&!still())lx+=7*Math.sin(2*Math.PI*3*wob)*(1-wob);
      activeButton.style.transform="translate("+(pos.x+lx-activeButton.offsetWidth/2).toFixed(2)+"px,"+(pos.y+ly-activeButton.offsetHeight/2).toFixed(2)+"px) rotate("+tilt.toFixed(2)+"deg) rotate("+angle+"rad) scale("+stretch.toFixed(4)+","+(sy/stretch).toFixed(4)+") rotate("+(-angle)+"rad)";
      raf=requestAnimationFrame(tick);
    };
    const onMotionChange=(event:MediaQueryListEvent)=>{reduced=event.matches;if(reduced){pointer=null;pos=home();target={...pos};vel={x:0,y:0};}};motionQuery.addEventListener("change",onMotionChange);window.addEventListener("pointermove",move);window.addEventListener("pointerdown",down);window.addEventListener("pointerup",up);
    document.documentElement.addEventListener("pointerleave",leave);window.addEventListener("resize",resize);
    pos=home();target={...pos};update();raf=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(raf);cancelAnimationFrame(passwordFrame);window.removeEventListener("pointermove",move);window.removeEventListener("pointerdown",down);window.removeEventListener("pointerup",up);document.documentElement.removeEventListener("pointerleave",leave);window.removeEventListener("resize",resize);motionQuery.removeEventListener("change",onMotionChange);passwordInput?.removeEventListener("input",onPassword);activeForm.removeEventListener("runaway:wobble",wobble);activeForm.removeEventListener("auth:success",onSuccess);};
  }, [signup]);

  function updatePassword(value:string) { setPassword(value); setNotice(""); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setNotice("");
    if(!email.trim()||!password){setNotice("Enter your email and password.");return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setNotice("Enter a valid email address.");return;}
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
  const missing=PASSWORD_RULES.find(rule=>!rule.test.test(password));
  const tone=PASSWORD_TONES[score];
  return (
    <main className="auth-page">

      <form id="auth-form" ref={formRef} className="auth-form" onSubmit={submit} onKeyDown={e=>{if(signup&&e.key==="Enter"&&score<4)formRef.current?.dispatchEvent(new Event("runaway:wobble"));}} noValidate>
        <Link className="auth-brand" href="/">1252's <strong>GROW WITH US</strong></Link>
        <div className="auth-heading"><span>{adminMode?"SECURE ADMIN ACCESS":"SRI AMIRTHAA ID"}</span><h1>{adminMode?<>Admin <em>Sign in</em></>:mode==="login"?<>Welcome <em>Back</em></>:<>Create <em>Account</em></>}</h1><p>{adminMode?"Sign in with an account assigned the Admin role.":mode==="login"?"One secure account for your Sri Amirthaa services.":"Create one account to use across participating websites."}</p></div>
        {signup&&<label className="auth-field"><span>Full name</span><input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="Your full name" required/></label>}
        <label className="auth-field auth-email"><span>Email address</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" placeholder="name@example.com" required/></label>
        <label className="auth-field"><span>Password</span><div className="auth-password"><input type={showPassword?"text":"password"} value={password} onChange={e=>updatePassword(e.target.value)} autoComplete={signup?"new-password":"current-password"} placeholder="Enter your password" minLength={signup?8:1} required/><button type="button" aria-label={showPassword?"Hide password":"Show password"} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        {signup&&<section className="runaway-strength" aria-live="polite">
          <div className="runaway-meter" style={{"--meter-tone":tone} as React.CSSProperties}>{[0,1,2,3].map(i=><i key={i} className={i<score?"on":""}/>)}<b>{password?PASSWORD_WORDS[score]:""}</b></div>
          <ul className="runaway-rules">{PASSWORD_RULES.map((rule,i)=><li key={rule.label} className={rule.test.test(password)?"met":""}>{rule.label}</li>)}</ul>
        </section>}
        {signup&&<label className="auth-field"><span>Confirm password</span><input type={showPassword?"text":"password"} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Re-enter your password" minLength={8} required/></label>}
        {!adminMode&&signup&&<label className="auth-terms"><input type="checkbox" required/><span>I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</span></label>}
        {signup&&<div ref={slotRef} className="runaway-slot" aria-hidden="true"/>}
        {notice&&<p className="auth-notice" role="status">{notice}</p>}
        {!adminMode&&<><div className="auth-divider"><i/> OR CONTINUE WITH <i/></div><button className="auth-google" type="button" onClick={googleSignIn} disabled={busy}><b>G</b> Continue with Google</button><p className="auth-switch">{mode==="login"?"Don't have an account?":"Already have an account?"} <button type="button" onClick={()=>{setMode(mode==="login"?"signup":"login");setNotice("");setPassword("");setConfirmPassword("");setShowPassword(false);setSuccess(false);}}>{mode==="login"?"Sign up":"Sign in"}</button></p></>}
      </form>
        <button ref={submitRef} className={`auth-submit ${signup?(success?"runaway-submit done":"runaway-submit"):success?"done":""}`} type="submit" form="auth-form" disabled={busy}><span>{signup?null:<>{busy?"Please wait…":adminMode?"Admin sign in":"Sign in"} <ArrowRight size={17}/></>}</span><span>{signup?null:<><Check size={18}/> You're in</>}</span></button>
      {adminMode&&<p className="auth-admin-foot">Admin access is checked against the Supabase Auth app_metadata role.</p>}
    </main>
  );
}
