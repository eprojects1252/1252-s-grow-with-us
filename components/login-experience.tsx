"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, LockKeyhole, UserRound, ArrowRight } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

export default function LoginExperience({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [remember, setRemember] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setNotice("");
    setGoogleLoading(true);
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) {
        throw new Error("Google Login setup is incomplete. Please configure the Supabase environment variables.");
      }
      const supabase = createClient(url, key);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to start Google sign-in. Please try again.");
      setGoogleLoading(false);
    }
  }

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setNotice("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (mode === "signup" && data.get("password") !== data.get("confirmPassword")) {
      setNotice("Passwords do not match. Please check both password fields.");
      return;
    }
    setNotice(mode === "signup"
      ? "Your email sign-up form is ready. Account creation will activate after the secure database and authentication are connected."
      : "Secure sign-in will activate after Sri Amirthaa ID authentication is connected.");
  }

  return (
    <main className="auth-v7">
      <div className="auth-v7-backdrop" aria-hidden="true">
        <span className="auth-metal-band auth-metal-band-a" />
        <span className="auth-metal-band auth-metal-band-b" />
        <span className="auth-metal-band auth-metal-band-c" />
        <span className="auth-metal-band auth-metal-band-d" />
        <span className="auth-metal-glint" />
      </div>

      <section className={mode === "signup" ? "auth-v7-card auth-v7-card-signup" : "auth-v7-card"} aria-label={mode === "login" ? "Sign in" : "Create account"}>
        <span className="auth-v7-corner auth-v7-corner-top" aria-hidden="true" />
        <span className="auth-v7-corner auth-v7-corner-bottom" aria-hidden="true" />
        <div className="auth-v7-inner">
          <header className="auth-v7-heading">
            <h1>{mode === "login" ? <>Welcome <em>Back</em></> : <>Create <em>Account</em></>}</h1>
            <p>{mode === "login" ? "Enter your credentials to access your secure account" : "Create your account using your email address"}</p>
          </header>

          <form className="auth-v7-form" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <label className="auth-v7-field">
                <span>Full Name</span>
                <div className="auth-v7-input"><UserRound size={15} /><input name="name" autoComplete="name" placeholder="Your full name" required /></div>
              </label>
            )}

            <label className="auth-v7-field">
              <span>Email Address</span>
              <div className="auth-v7-input"><Mail size={15} /><input name="email" type="email" autoComplete="email" placeholder="name@domain.com" required /></div>
            </label>

            {mode === "login" ? (
              <label className="auth-v7-field">
                <span>Password</span>
                <div className="auth-v7-input"><LockKeyhole size={15} /><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••••" minLength={8} required /><button type="button" className="auth-v7-eye" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
              </label>
            ) : (
              <div className="auth-v7-password-row">
                <label className="auth-v7-field">
                  <span>Password</span>
                  <div className="auth-v7-input"><LockKeyhole size={15} /><input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" minLength={8} required /><button type="button" className="auth-v7-eye" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
                </label>
                <label className="auth-v7-field">
                  <span>Confirm Password</span>
                  <div className="auth-v7-input"><LockKeyhole size={15} /><input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Re-enter your password" minLength={8} required /><button type="button" className="auth-v7-eye" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
                </label>
              </div>
            )}

            {mode === "login" ? (
              <div className="auth-v7-options">
                <label><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Remember me</span></label>
                <button type="button" onClick={() => setNotice("Password recovery will be available after Sri Amirthaa ID authentication is connected.")}>Forgot password?</button>
              </div>
            ) : (
              <label className="auth-v7-terms"><input type="checkbox" required /><span>I agree to the <Link href="/terms">Terms</Link> &amp; <Link href="/privacy">Privacy Policy</Link></span></label>
            )}

            <button className="auth-v7-submit" type="submit">{mode === "login" ? "Sign In" : "Create Account"} <ArrowRight size={15} /></button>
            {notice && <p className="auth-v7-notice" role="status">{notice}</p>}
          </form>

          <div className="auth-v7-divider"><span />OR CONTINUE WITH<span /></div>
          <div className="auth-v7-socials">
            <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading}><b className="auth-google-g">G</b> {googleLoading ? "Connecting..." : "Continue with Google"}</button>
            <button type="button" onClick={() => setNotice("Apple sign-in will be enabled after provider authentication setup.")}><b className="auth-apple-mark">●</b> Apple</button>
          </div>
          <p className="auth-v7-switch">{mode === "login" ? "Don't have an account?" : "Already have an account?"} <button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Sign Up" : "Sign In"}</button></p>
        </div>
      </section>

      <Link className="auth-v7-home" href="/" aria-label="Back to 1252's Grow With Us">1252's <strong>GROW WITH US</strong></Link>
    </main>
  );
}
