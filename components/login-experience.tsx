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
  const cometRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const passwordRef = useRef(password);
  const successRef = useRef(success);
  const signupRef = useRef(signup);
  passwordRef.current = password;
  successRef.current = success;
  signupRef.current = signup;
  const slotRef = useRef<HTMLDivElement>(null);
  const score = passwordScore(password);

  useEffect(() => {
    const form=formRef.current, canvas=canvasRef.current, comet=cometRef.current;
    if(!form||!canvas||!comet)return;
    const g=canvas.getContext("2d"); if(!g)return;
    const emailEl=form.querySelector<HTMLInputElement>(".comet-email input");
    const passEl=form.querySelector<HTMLInputElement>(".comet-password input");
    const eye=form.querySelector<HTMLButtonElement>(".comet-password button");
    const send=submitRef.current, night=comet.closest<HTMLElement>(".comet-auth")?.querySelector<HTMLElement>(".comet-night") ?? null;
    const mailField=emailEl?.parentElement as HTMLElement|null;
    const passField=passEl?.parentElement as HTMLElement|null;
    const dots=form.querySelector<HTMLElement>(".comet-password-mirror .dots");
    const mirrorText=form.querySelector<HTMLElement>(".comet-password-mirror .text");
    const caret=form.querySelector<HTMLElement>(".comet-password-mirror .caret");
    if(!emailEl||!passEl||!eye||!send||!night||!mailField||!passField||!dots||!mirrorText||!caret)return;
    const reduce=false; // Keep the requested Comet interaction visible on devices configured to reduce motion.
    const STIFF=.06,DAMP=.82,ORBIT=14,SPIN=5.7,TAIL=36,LAP=3;
    const DIM=[1,.4,.15,.3,.6,.85,1], clamp=(v:number,a=0,b=1)=>Math.min(b,Math.max(a,v));
    const pen=document.createElement("canvas").getContext("2d"); if(pen)pen.font="500 16px system-ui,sans-serif";
    const at=(el:HTMLElement)=>{const r=el.getBoundingClientRect();return el===emailEl||el===passEl?{x:r.left+22,y:el===passEl?r.top+r.height/2:r.top-4}:{x:r.left+r.width/2,y:r.top+r.height/2};};
    const caretGoal=(el:HTMLInputElement)=>{const r=el.getBoundingClientRect(),v=el.value;const w=el===emailEl?(pen?.measureText(v).width||0)+24:passField.classList.contains("show")?(pen?.measureText(v).width||0)+v.length*.5:v.length*14-7;return{x:r.left+(el===emailEl?24:18)+Math.min(Math.max(w,6),r.width-70),y:el===emailEl?r.top-4:r.top+r.height/2};};
    let p=at(emailEl),x=p.x,y=p.y,vx=0,vy=0,goal={...p},idle=1,dimAt=-1e4,rx=ORBIT,ry=ORBIT/2,spin=SPIN,day=false,dawn=0,strike:(()=>void)|null=null;
    let last=performance.now(),acc=0,dpr=1,raf=0,dropT:ReturnType<typeof setTimeout>,badT:ReturnType<typeof setTimeout>;
    const tail:Array<{x:number;y:number}>=[],sparks:Array<{x:number;y:number;vx:number;vy:number;age:number;life:number;r:number;red?:boolean;dust?:number}>=[],rings:Array<{x:number;y:number;age:number}>=[];
    const aim=(q:{x:number;y:number},wide?:{x:number;y:number})=>{goal=q;idle=0;rx=wide?wide.x:ORBIT;ry=wide?wide.y:ORBIT/2;spin=wide?LAP:SPIN;};
    const daylight=(on:boolean)=>{day=on;night.classList.toggle("day",on);};
    const size=()=>{dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;canvas.style.width="100%";canvas.style.height="100%";};
    const light=(now:number)=>{const s=(now-dimAt)/150,i=Math.floor(s);if(reduce||s<0||i>=DIM.length-1)return 1;return DIM[i]+(DIM[i+1]-DIM[i])*(s-i);};
    const heat=(now:number)=>{const s=(now-dimAt)/1000;return s<0?0:clamp(s/.15)*clamp((1.05-s)/.3);};
    const stars=Array.from({length:90},()=>({x:Math.random(),y:Math.random(),r:.6+.8*Math.random(),f:.683*(3+Math.floor(4*Math.random())),p:7*Math.random()}));
    const PASSES:[[number,number,number[],number],[number,number,number[],number],[number,number,number[],number]]=[[1,9,[140,203,255],.16],[.65,4.5,[160,212,255],.4],[.35,2,[236,246,255],.95]];
    const HOT=[[255,120,145],[255,143,160],[255,226,232]];
    const draw=(k:number,hot:number,t:number)=>{
      g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,innerWidth,innerHeight);g.globalCompositeOperation="lighter";
      for(const s of stars){const sx=s.x*innerWidth+(reduce?0:Math.sin(t*.683+s.p)*6),sy=s.y*innerHeight+(reduce?0:Math.cos(t*.683+s.p*1.7)*8),near=Math.pow(clamp(1-Math.hypot(sx-x,sy-y)/(260*(.4+.6*k))),1.5),a=(.08+.34*dawn+.8*near)*(reduce?1:.55+.45*Math.sin(t*s.f+s.p));if(a>.02){g.fillStyle="rgba(200,230,255,"+a.toFixed(3)+")";g.beginPath();g.arc(sx,sy,s.r,0,7);g.fill();}}
      g.lineCap=g.lineJoin="round";
      if(!reduce&&tail.length>2)for(let pi=0;pi<PASSES.length;pi++){const [part,width,c,alpha]=PASSES[pi],h=HOT[pi],rgb="rgba("+c.map((v,j)=>Math.round(v+(h[j]-v)*hot)).join(",")+",",n=Math.max(2,Math.round(tail.length*part)),end=tail[n-1],fade=g.createLinearGradient(tail[0].x,tail[0].y,end.x,end.y);fade.addColorStop(0,rgb+(alpha*k).toFixed(3)+")");fade.addColorStop(1,rgb+"0)");g.strokeStyle=fade;g.lineWidth=width;g.beginPath();g.moveTo(tail[0].x,tail[0].y);for(let i=1;i<n;i++)g.lineTo(tail[i].x,tail[i].y);g.stroke();}
      for(const q of sparks){const a=1-q.age/q.life;if(!q.dust){g.fillStyle="rgba("+(q.red?"255,143,160":"200,230,255")+","+a.toFixed(3)+")";g.beginPath();g.arc(q.x,q.y,q.r,0,7);g.fill();}else{const al=a*(.6+.4*Math.sin(q.age*14+q.r*9)),d=g.createRadialGradient(q.x,q.y,0,q.x,q.y,q.r*4);d.addColorStop(0,"rgba(236,246,255,"+al.toFixed(3)+")");d.addColorStop(.35,"rgba(140,203,255,"+(.5*al).toFixed(3)+")");d.addColorStop(1,"rgba(140,203,255,0)");g.fillStyle=d;g.fillRect(q.x-q.r*4,q.y-q.r*4,q.r*8,q.r*8);}}
      for(const o of rings){const e=1-Math.pow(1-o.age/.7,3),q=1-o.age/.3;if(q>0){const R=50+170*(1-q),d=g.createRadialGradient(o.x,o.y,0,o.x,o.y,R);d.addColorStop(0,"rgba(236,246,255,"+(.85*q).toFixed(3)+")");d.addColorStop(.4,"rgba(140,203,255,"+(.3*q).toFixed(3)+")");d.addColorStop(1,"rgba(140,203,255,0)");g.fillStyle=d;g.fillRect(o.x-R,o.y-R,R*2,R*2);}g.strokeStyle="rgba(160,212,255,"+(.75*(1-o.age/.7)).toFixed(3)+")";g.lineWidth=2.5;g.beginPath();g.ellipse(o.x,o.y,10+190*e,4+52*e,0,0,7);g.stroke();}
    };
    const paintPassword=(fresh:boolean)=>{const v=Array.from(passEl.value);dots.replaceChildren(...v.map((_,i)=>{const n=document.createElement("i");n.style.setProperty("--i",String(i));if(fresh&&i===v.length-1)n.className="new";return n;}));mirrorText.replaceChildren(...v.map((ch,i)=>{const n=document.createElement("b");n.textContent=ch;n.style.setProperty("--i",String(i));if(fresh&&i===v.length-1)n.className="new";return n;}));caret.style.translate=(passField.classList.contains("show")?mirrorText.offsetWidth:v.length*14)+"px 0";};
    const focus=(el:HTMLElement)=>()=>aim(at(el));
    const onEmail=()=>aim(caretGoal(emailEl)),onPass=()=>{clearTimeout(dropT);passField.classList.remove("drop");paintPassword(true);aim(passEl.value?caretGoal(passEl):at(passEl));};
    const onEye=()=>{const on=passField.classList.toggle("show");eye.setAttribute("aria-pressed",String(on));eye.setAttribute("aria-label",on?"Hide password":"Show password");paintPassword(false);};
    const fizzle=()=>{setPassword("");dimAt=performance.now();vx=6;vy=-14;for(let i=0;i<22;i++)sparks.push({x,y,vx:(Math.random()-.5)*10,vy:-1.5-5*Math.random(),age:0,life:.45+.45*Math.random(),r:1.8,red:true});passEl.value="";paintPassword(false);passEl.focus();passField.classList.add("bad","drop");send.classList.add("bad");clearTimeout(dropT);dropT=setTimeout(()=>passField.classList.remove("drop"),600);clearTimeout(badT);badT=setTimeout(()=>{passField.classList.remove("bad");send.classList.remove("bad");},1050);aim(at(passEl));};
    const impact=()=>{rings.push({x,y,age:0});for(let i=0;i<56;i++){const a=-Math.PI/2+(Math.random()-.5)*2.8,s=2+4.5*Math.random();sparks.push({x,y,vx:Math.cos(a)*s*1.4,vy:Math.sin(a)*s,age:0,life:1.4+1.4*Math.random(),r:.9+1.3*Math.random(),dust:1});}};
    const lightFrom=()=>{const r=send.getBoundingClientRect();send.classList.add("still");send.style.setProperty("--hx",clamp(x-r.left,0,r.width)+"px");void send.offsetWidth;send.classList.remove("still");};
    const onWrong=()=>fizzle();
    const onSuccess=()=>{const r=send.getBoundingClientRect();if(!reduce){aim({x:r.left+r.width*.9,y:r.top-150});window.setTimeout(()=>{aim(at(send));vx-=6;vy+=12;let hit=false;const finish=()=>{if(hit)return;hit=true;strike=null;lightFrom();send.classList.add("done");daylight(true);impact();vx=vy=0;aim({x,y});const f=form.getBoundingClientRect();form.animate([{translate:"0 0"},{translate:"0 6px",offset:.2},{translate:"0 0"}],{duration:420,easing:"cubic-bezier(.23,1,.32,1)"});window.setTimeout(()=>aim({x:f.left+f.width/2,y:f.top+f.height/2},{x:f.width*.52,y:f.height*.7}),450);};strike=finish;window.setTimeout(finish,420);},280);}else{lightFrom();send.classList.add("done");daylight(true);}};
    const onReset=()=>{clearTimeout(dropT);clearTimeout(badT);dimAt=-1e4;passField.classList.remove("show","bad","drop");eye.setAttribute("aria-pressed","false");send.classList.remove("done","bad");daylight(false);paintPassword(false);aim(at(emailEl));};
    emailEl.addEventListener("focus",focus(emailEl));emailEl.addEventListener("click",focus(emailEl));passEl.addEventListener("focus",focus(passEl));passEl.addEventListener("click",focus(passEl));eye.addEventListener("click",onEye);send.addEventListener("focus",focus(send));send.addEventListener("click",focus(send));emailEl.addEventListener("input",onEmail);passEl.addEventListener("input",onPass);form.addEventListener("comet:wrong",onWrong);form.addEventListener("comet:success",onSuccess);form.addEventListener("comet:reset",onReset);
    const resize=()=>size();window.addEventListener("resize",resize);size();paintPassword(false);
    const fly=(now:number)=>{acc+=Math.min(100,now-last);last=now;for(;acc>=1000/60;acc-=1000/60){if(!reduce)idle+=1/60;const grow=clamp(idle*2-.6),ox=Math.cos(idle*spin)*rx*grow,oy=Math.sin(idle*spin)*ry*grow;vx=(vx+(goal.x+ox-x)*STIFF)*DAMP;vy=(vy+(goal.y+oy-y)*STIFF)*DAMP;x+=vx;y+=vy;tail.unshift({x,y});if(tail.length>TAIL)tail.pop();if(strike&&Math.hypot(goal.x-x,goal.y-y)<20){strike();strike=null;}dawn+=((day?1:0)-dawn)*.05;if(!reduce&&Math.hypot(vx,vy)>2.5&&Math.random()<.5)sparks.push({x,y,vx:vx*.15+Math.random()-.5,vy:vy*.15+Math.random()-.5,age:0,life:.5+Math.random()*.5,r:1.3,red:heat(now)>.5});for(const q of sparks){const f=q.dust?.93:.95;q.x+=q.vx;q.y+=q.vy;q.vx*=f;q.vy=q.vy*f+(q.dust?.012:.03);q.age+=1/60;}for(const q of rings)q.age+=1/60;}for(let i=sparks.length-1;i>=0;i--)if(sparks[i].age>=sparks[i].life)sparks.splice(i,1);for(let i=rings.length-1;i>=0;i--)if(rings[i].age>=.7)rings.splice(i,1);const k=light(now),hot=heat(now),t=now/1000,pulse=reduce?1:.86+.14*Math.sin(t*5.464),level=(.3+.7*k)*pulse,core=.4+.6*k;comet.style.translate=x+"px "+y+"px";comet.style.setProperty("--glow",(level*(1-hot)).toFixed(3));comet.style.setProperty("--hot-glow",(level*hot).toFixed(3));comet.style.setProperty("--core",(core*(1-hot)).toFixed(3));comet.style.setProperty("--hot-core",(core*hot).toFixed(3));night.style.setProperty("--x",x+"px");night.style.setProperty("--y",y+"px");night.style.setProperty("--r",(260*(.4+.6*k))+"px");for(const f of [mailField,passField]){const r=f.getBoundingClientRect(),dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom);f.style.setProperty("--rim",(clamp(1-Math.hypot(dx,dy)/150)*k).toFixed(3));}draw(k,hot,t);raf=requestAnimationFrame(fly);};
    raf=requestAnimationFrame(fly);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);emailEl.removeEventListener("focus",focus(emailEl));emailEl.removeEventListener("click",focus(emailEl));passEl.removeEventListener("focus",focus(passEl));passEl.removeEventListener("click",focus(passEl));eye.removeEventListener("click",onEye);send.removeEventListener("focus",focus(send));send.removeEventListener("click",focus(send));emailEl.removeEventListener("input",onEmail);passEl.removeEventListener("input",onPass);form.removeEventListener("comet:wrong",onWrong);form.removeEventListener("comet:success",onSuccess);form.removeEventListener("comet:reset",onReset);clearTimeout(dropT);clearTimeout(badT);};
  }, []);  useEffect(() => {
    const button=submitRef.current, slot=slotRef.current, form=formRef.current;
    if(!button||!slot||!form||!signupRef.current)return;
    const activeButton=button, activeSlot=slot, activeForm=form;
    const RUN=170,REACH=90;
    const RULES=[[/\d/,"a number"],[/[^\w\s]/,"a symbol"],[/[A-Z]/,"a capital"],[/.{8,}/,"8+ characters"]] as const;
    const TONES=[["#D93D42","#fff"],["#C2410C","#fff"],["#F5A524","#1A1300"],["#9BD04A","#0F1A00"],["#15803D","#fff"]] as const;
    const WORDS=["Too weak","Weak","Fair","Good","Strong"], labels=Array.from(activeButton.querySelectorAll<HTMLElement>("span"));
    let pos:{x:number;y:number},vel={x:0,y:0},target:{x:number;y:number},pointer:{x:number;y:number}|null=null;
    let lastFlee=-1e9,sighAt=-1e9,wobbleAt=-1e9,said="",front=0,done=false,strong=false,raf=0,passwordFrame=0,last=performance.now();
    const still=()=>false, score=()=>RULES.filter(([re])=>re.test(passwordRef.current)).length;
    const home=()=>{const r=activeSlot.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};};
    const dist=(p:{x:number;y:number})=>Math.hypot(p.x-pos.x,p.y-pos.y);
    function say(text:string,html=text){
      if(text===said)return;said=text;const out=labels[front],inn=labels[front^=1];if(!out||!inn)return;
      inn.innerHTML=html;activeButton.setAttribute("aria-label",text);
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
      say(done?"Account created":n===4?"Create account":n===0?"Nope":"Add "+missing?.[1],done?'<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1"/></svg>Account created':undefined);
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
      target=to;vel.x+=dx*run*5;vel.y+=dy*run*5;lastFlee=now;activeSlot.classList.add("runaway-empty");
    }
    const move=(e:PointerEvent)=>{pointer={x:e.clientX,y:e.clientY};};
    const down=(e:PointerEvent)=>{pointer={x:e.clientX,y:e.clientY};if(e.pointerType!=="mouse"&&!still()&&!done)flee(pointer,performance.now());};
    const up=(e:PointerEvent)=>{if(e.pointerType!=="mouse")pointer=null;};
    const leave=()=>{pointer=null;};
    const resize=()=>{if(!activeSlot.classList.contains("runaway-empty"))pos=home();target={...pos};};
    const wobble=()=>{wobbleAt=performance.now();};
    const passwordInput=activeForm.querySelector<HTMLInputElement>(".comet-password input");
    const onPassword=()=>{cancelAnimationFrame(passwordFrame);passwordFrame=requestAnimationFrame(()=>{const n=score();if(n===4&&!strong)sighAt=performance.now();strong=n===4;done=false;update();});};
    const onSuccess=()=>{done=true;update();};
    activeForm.addEventListener("comet:success",onSuccess);activeForm.addEventListener("runaway:wobble",wobble);passwordInput?.addEventListener("input",onPassword);
    const tick=(now:number)=>{
      const dt=Math.min(1/30,Math.max(0,(now-last)/1000));last=now;
      const n=score(),runner=!still()&&!done&&signupRef.current&&n<4;
      if(runner&&pointer)flee(pointer,now);
      const far=!pointer||dist(pointer)>REACH*1.6,going=runner&&far&&now-lastFlee>900;
      if(going)target=home();
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
    window.addEventListener("pointermove",move);window.addEventListener("pointerdown",down);window.addEventListener("pointerup",up);
    document.documentElement.addEventListener("pointerleave",leave);window.addEventListener("resize",resize);
    pos=home();target={...pos};update();raf=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(raf);cancelAnimationFrame(passwordFrame);window.removeEventListener("pointermove",move);window.removeEventListener("pointerdown",down);window.removeEventListener("pointerup",up);document.documentElement.removeEventListener("pointerleave",leave);window.removeEventListener("resize",resize);passwordInput?.removeEventListener("input",onPassword);activeForm.removeEventListener("runaway:wobble",wobble);activeForm.removeEventListener("comet:success",onSuccess);};
  }, [signup]);

  function updatePassword(value:string) { setPassword(value); setNotice(""); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setNotice("");
    if(!email.trim()||!password){setNotice("Enter your email and password.");return;}
    if(signup){
      if(!name.trim()){setNotice("Enter your full name.");return;}
      const missing=PASSWORD_RULES.find(rule=>!rule.test.test(password));
      if(missing){setNotice("Please add "+missing.label+" to your password.");formRef.current?.dispatchEvent(new Event("runaway:wobble"));formRef.current?.dispatchEvent(new Event("comet:wrong"));return;}
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
        }else{setSuccess(true);formRef.current?.dispatchEvent(new Event("comet:success"));setNotice("You're signed in. Opening your account…");await new Promise(resolve=>window.setTimeout(resolve,1250));window.location.assign("/account");}
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
        <label className="comet-field comet-email"><span>Email address</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" placeholder="name@example.com" required/></label>
        <label className="comet-field"><span>Password</span><div className="comet-password"><input type={showPassword?"text":"password"} value={password} onChange={e=>updatePassword(e.target.value)} autoComplete={signup?"new-password":"current-password"} placeholder="Enter your password" minLength={signup?8:1} required/><button type="button" aria-label={showPassword?"Hide password":"Show password"} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button><span className="comet-password-mirror" aria-hidden="true"><span className="dots"/><span className="text"/><i className="caret"/></span></div></label>
        {signup&&<section className="runaway-strength" aria-live="polite">
          <div className="runaway-meter" style={{"--meter-tone":tone} as React.CSSProperties}>{[0,1,2,3].map(i=><i key={i} className={i<score?"on":""}/>)}<b>{password?PASSWORD_WORDS[score]:""}</b></div>
          <ul className="runaway-rules">{PASSWORD_RULES.map((rule,i)=><li key={rule.label} className={rule.test.test(password)?"met":""}>{rule.label}</li>)}</ul>
        </section>}
        {signup&&<label className="comet-field"><span>Confirm password</span><input type={showPassword?"text":"password"} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Re-enter your password" minLength={8} required/></label>}
        {!adminMode&&signup&&<label className="comet-terms"><input type="checkbox" required/><span>I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</span></label>}
        {signup&&<div ref={slotRef} className="runaway-slot" aria-hidden="true"/>}
        {notice&&<p className="comet-notice" role="status">{notice}</p>}
        {!adminMode&&<><div className="comet-divider"><i/> OR CONTINUE WITH <i/></div><button className="comet-google" type="button" onClick={googleSignIn} disabled={busy}><b>G</b> Continue with Google</button><p className="comet-switch">{mode==="login"?"Don't have an account?":"Already have an account?"} <button type="button" onClick={()=>{setMode(mode==="login"?"signup":"login");setNotice("");setPassword("");setConfirmPassword("");setSuccess(false);formRef.current?.dispatchEvent(new Event("comet:reset"));}}>{mode==="login"?"Sign up":"Sign in"}</button></p></>}
      </form>
        <button ref={submitRef} className={(success?"comet-submit done":"comet-submit")+(signup?" runaway-submit":"")} type="submit" form="comet-auth-form" disabled={busy}><span>{signup?null:<>{busy?"Please wait…":adminMode?"Admin sign in":"Sign in"} <ArrowRight size={17}/></>}</span><span>{signup?null:<><Check size={18}/> You're in</>}</span></button>
      {adminMode&&<p className="comet-admin-foot">Admin access is checked against the Supabase Auth app_metadata role.</p>}
    </main>
  );
}
