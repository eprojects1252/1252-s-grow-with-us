"use client";

import { useState } from "react";
import { getAuth } from "firebase/auth";
import { MailCheck, SearchCheck } from "lucide-react";
import { firebaseApp } from "@/lib/firebase";

export default function PhoneAccountLink() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "available" | "registered" | "error">("idle");

  async function checkEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setStatus("idle");
    const normalized = email.trim().toLowerCase();
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(normalized)) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      const user = getAuth(firebaseApp).currentUser;
      if (!user || !user.phoneNumber) throw new Error("Please sign in with your verified mobile number first.");
      const idToken = await user.getIdToken(true);
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ email: normalized })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to check this email.");
      setStatus(result.available ? "available" : "registered");
      setMessage(result.message || (result.available ? "This email is available." : "Email already registered."));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to check this email right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="phone-email-check" aria-label="Check email registration">
      <div className="phone-email-heading">
        <span className="phone-email-icon"><MailCheck size={19}/></span>
        <div><h3>Account email</h3><p>Enter your email address to check whether it is already registered.</p></div>
      </div>
      <form onSubmit={checkEmail} className="phone-email-form">
        <label htmlFor="account-email-check">Email address</label>
        <input id="account-email-check" type="email" autoComplete="email" inputMode="email" value={email} onChange={event => {setEmail(event.target.value);setStatus("idle");setMessage("");}} placeholder="name@example.com" required/>
        <button type="submit" disabled={busy}><SearchCheck size={16}/>{busy ? "Checking…" : "Check email"}</button>
      </form>
      {message && <p className={`phone-email-message ${status}`} role="status">{message}</p>}
    </section>
  );
}
