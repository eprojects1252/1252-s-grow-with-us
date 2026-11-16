"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, LockKeyhole, UserRound, ArrowRight, Chrome } from "lucide-react";

export default function LoginExperience({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [remember, setRemember] = useState(true);

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setNotice("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Your form is ready. Secure Sri Amirthaa ID authentication will be enabled after backend integration.");
  }

  return (
    <main className="auth-scene">
      <div className="auth-orbit auth-orbit-one" />
      <div className="auth-orbit auth-orbit-two" />
      <div className="auth-gold-ribbon auth-gold-ribbon-one" />
      <div className="auth-gold-ribbon auth-gold-ribbon-two" />
      <Link className="auth-brand" href="/">
        <span className="auth-brand-mark">1252</span>
        <span><strong>GROW WITH US</strong><small>Shop Everything. Grow With Us.</small></span>
      </Link>

      <section className="auth-card-wrap">
        <div className="auth-card">
          <div className="auth-card-glow" />
          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button type="button" className={mode === "login" ? "auth-tab active" : "auth-tab"} onClick={() => switchMode("login")}>Sign In</button>
            <button type="button" className={mode === "signup" ? "auth-tab active" : "auth-tab"} onClick={() => switchMode("signup")}>Create Account</button>
          </div>

          <div className="auth-heading">
            <span className="auth-eyebrow">SRI AMIRTHAA ID</span>
            <h1>{mode === "login" ? "Welcome Back" : "Create Account"}</h1>
            <p>{mode === "login" ? "Sign in to continue your journey with us." : "One account. More ways to grow with us."}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <label className="auth-field">
                <span>Full Name</span>
                <div className="auth-input-wrap"><UserRound size={17} /><input name="name" autoComplete="name" placeholder="Enter your full name" required /></div>
              </label>
            )}
            <label className="auth-field">
              <span>Email Address</span>
              <div className="auth-input-wrap"><Mail size={17} /><input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></div>
            </label>
            {mode === "signup" && (
              <label className="auth-field">
                <span>Mobile Number</span>
                <div className="auth-input-wrap"><span className="auth-country-code">+91</span><input name="mobile" type="tel" inputMode="numeric" autoComplete="tel" placeholder="Enter mobile number" pattern="[0-9]{10}" required /></div>
              </label>
            )}
            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input-wrap"><LockKeyhole size={17} /><input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Enter your password" minLength={8} required /><button className="auth-eye" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            </label>
            {mode === "signup" && (
              <label className="auth-field">
                <span>Confirm Password</span>
                <div className="auth-input-wrap"><LockKeyhole size={17} /><input name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Confirm your password" minLength={8} required /></div>
              </label>
            )}

            {mode === "login" ? (
              <div className="auth-options"><label className="auth-remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> <span>Remember me</span></label><button type="button" className="auth-text-button" onClick={() => setNotice("Password recovery will be available after secure authentication is connected.")}>Forgot Password?</button></div>
            ) : (
              <label className="auth-remember auth-terms"><input type="checkbox" required /> <span>I agree to the <Link href="/terms">Terms &amp; Conditions</Link> and <Link href="/privacy">Privacy Policy</Link>.</span></label>
            )}

            <button className="auth-submit" type="submit">{mode === "login" ? "Sign In" : "Create Account"} <ArrowRight size={17} /></button>
            {notice && <p className="auth-notice" role="status">{notice}</p>}
          </form>

          <div className="auth-divider"><span /> <small>OR CONTINUE WITH</small> <span /></div>
          <div className="auth-socials">
            <button type="button" onClick={() => setNotice("Google sign-in will be enabled after provider authentication setup.")}><Chrome size={17} /> Google</button>
            <button type="button" onClick={() => setNotice("Apple sign-in will be enabled after provider authentication setup.")}><span className="auth-apple">●</span> Apple</button>
          </div>
          <p className="auth-switch">{mode === "login" ? "New to 1252's Grow With Us?" : "Already have an account?"} <button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create account" : "Sign in"}</button></p>
        </div>
      </section>
      <footer className="auth-footer">Supporting By Sri Amirthaa Groups 1252 <span>•</span> Managing By K² Techtron Team</footer>
    </main>
  );
}
