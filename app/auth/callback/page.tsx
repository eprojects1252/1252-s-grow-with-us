"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing your secure sign-in...");

  useEffect(() => {
    let active = true;
    async function completeSignIn() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_ECOMMERCE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ECOMMERCE_PUBLISHABLE_KEY;
      if (!url || !key) {
        setMessage("Authentication configuration is missing. Please contact support.");
        return;
      }
      const supabase = createClient(url, key, { auth: { detectSessionInUrl: false } });
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          return;
        }
      }
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error || !data.session) {
        setMessage(error?.message ?? "Sign-in could not be completed. Please try again.");
        return;
      }
      router.replace("/account");
    }
    completeSignIn();
    return () => { active = false; };
  }, [router]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#090909", color: "#f5e7bd", textAlign: "center" }}>
      <div><h1 style={{ fontSize: 24, marginBottom: 12 }}>Sri Amirthaa ID</h1><p>{message}</p></div>
    </main>
  );
}
