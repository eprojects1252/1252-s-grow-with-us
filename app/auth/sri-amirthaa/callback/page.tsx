"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function SriAmirthaaCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing your Sri Amirthaa ID sign-in...");

  useEffect(() => {
    let active = true;
    async function complete() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code") ?? "";
      const state = params.get("state") ?? "";
      const providerError = params.get("error");
      if (providerError || !code || !state) {
        setMessage("Sign-in was cancelled or the authorization link expired. Please try again.");
        return;
      }
      try {
        const response = await fetch("/api/auth/sri-amirthaa/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({ code, state })
        });
        const result = await response.json();
        if (!response.ok || typeof result.tokenHash !== "string") {
          throw new Error(result.error || "Unable to complete secure sign-in.");
        }
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        if (!url || !key) throw new Error("E-Commerce authentication is not configured.");
        const supabase = createClient(url, key, { auth: { detectSessionInUrl: false } });
        const { error } = await supabase.auth.verifyOtp({
          token_hash: result.tokenHash,
          type: "magiclink"
        });
        if (error) throw error;
        if (!active) return;
        window.history.replaceState({}, "", "/auth/sri-amirthaa/callback");
        setMessage("Sign-in successful. Opening your account...");
        router.replace("/account");
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Sri Amirthaa ID sign-in failed.");
      }
    }
    void complete();
    return () => { active = false; };
  }, [router]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#090909", color: "#f5e7bd", textAlign: "center" }}>
      <div><h1 style={{ fontSize: 24, marginBottom: 12 }}>Sri Amirthaa ID</h1><p>{message}</p></div>
    </main>
  );
}
