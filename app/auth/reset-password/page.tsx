"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import { Eye, EyeOff, Check } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [show,setShow]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [done,setDone]=useState(false);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setMessage("");
    if(password.length<8){setMessage("Use at least 8 characters for your new password.");return;}
    if(!/[A-Z]/.test(password)||!/\\d/.test(password)||!/[^\\w\\s]/.test(password)){setMessage("Include a capital letter, a number and a symbol.");return;}
    if(password!==confirm){setMessage("The passwords do not match.");return;}
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if(!url||!key){setMessage("Authentication configuration is missing.");return;}
    setBusy(true);
    try{
      const supabase=createClient(url,key);
      const {data}=await supabase.auth.getSession();
      if(!data.session){setMessage("This reset link is invalid or expired. Request a new password reset link.");return;}
      const {error}=await supabase.auth.updateUser({password});
      if(error)throw error;
      setDone(true);setMessage("Your password has been updated successfully.");
    }catch(error){setMessage(error instanceof Error?error.message:"Unable to update your password.");}
    finally{setBusy(false);}
  }

  return <main className="auth-page reset-auth-page"><section className="auth-form reset-auth-card">
    <Link className="auth-brand" href="/">1252's <strong>GROW WITH US</strong></Link>
    <div className="auth-heading"><span>ACCOUNT SECURITY</span><h1>New <em>Password</em></h1><p>Create a strong password for your Sri Amirthaa ID.</p></div>
    {done?<div className="reset-done"><span><Check size={28}/></span><b>Password updated</b><p>{message}</p><Link href="/">Return to sign in</Link></div>:<form onSubmit={submit}>
      <label className="auth-field"><span>New password</span><div className="auth-password"><input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" placeholder="Enter new password" required/><button type="button" aria-label={show?"Hide password":"Show password"} onClick={()=>setShow(v=>!v)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
      <label className="auth-field"><span>Confirm new password</span><input type={show?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" placeholder="Re-enter new password" required/></label>
      {message&&<p className="auth-notice" role="status">{message}</p>}
      <button className="auth-submit reset-submit" type="submit" disabled={busy}>{busy?"Updating…":"Update password"}</button>
    </form>}
  </section></main>;
}
