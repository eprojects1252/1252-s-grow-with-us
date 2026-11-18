"use client";

export default function RechargeBillsPage() {
  return (
    <main style={{ padding: 0, minHeight: "100dvh", overflow: "hidden" }}>
      <iframe
        title="Recharge and Bills demo"
        src="/recharge-bills-demo.html"
        style={{ display: "block", width: "100%", height: "100dvh", border: 0, background: "#f1f5f9" }}
        allow="clipboard-read; clipboard-write"
      />
    </main>
  );
}
