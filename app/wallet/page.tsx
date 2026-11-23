"use client";

import { useId, useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, CreditCard, QrCode, ShieldCheck, Wallet, Smartphone, Info } from "lucide-react";
import Link from "next/link";

const UPI_ID = "s2h1252bank-5@okhdfcbank";
const formatINR = (value: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);

export default function WalletPage() {
  const [amount, setAmount] = useState("500");
  const [utr, setUtr] = useState("");
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const validAmount = /^\d+$/.test(amount) && Number(amount) >= 1 && Number(amount) <= 100000;
  const reference = `SRI${useId().replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`;
  const upiUri = useMemo(() => {
    if (!validAmount) return "";
    const params = new URLSearchParams({
      pa: UPI_ID,
      pn: "Sri Amirthaa",
      am: Number(amount).toFixed(2),
      cu: "INR",
      tn: "Amirthaa Wallet Top-up",
      tr: reference,
    });
    return `upi://pay?${params.toString()}`;
  }, [amount, validAmount, reference]);
  const qrUrl = upiUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(upiUri)}`
    : "";

  async function copyUpi() {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice("Copy is unavailable in this browser. Please select the UPI ID manually.");
    }
  }

  function submitProof(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Your UTR has been entered. Payment submission will be enabled after the secure wallet backend and Admin verification are connected. No coins have been credited.");
  }

  return (
    <main className="amc-page">
      <div className="amc-shell">
        <Link className="amc-back" href="/"><ArrowLeft size={17}/> Back to store</Link>
        <header className="amc-heading">
          <div className="amc-brand-icon"><Wallet size={25}/></div>
          <div><span> SRI AMIRTHAA · DIGITAL WALLET</span><h1>Add coins to your wallet</h1><p>Top up when you need. Coins appear after payment verification.</p></div>
        </header>

        <section className="amc-layout">
          <div className="amc-card amc-amount-card">
            <div className="amc-section-title"><span className="amc-step">01</span><div><h2>Choose top-up amount</h2><p>₹1 = 1 Sri</p></div></div>
            <label className="amc-label" htmlFor="amc-amount">Amount in INR</label>
            <div className="amc-amount-input"><span>₹</span><input id="amc-amount" inputMode="numeric" type="number" min="1" max="100000" step="1" value={amount} onChange={(event) => { setAmount(event.target.value); setNotice(""); }} placeholder="Enter amount"/></div>
            <div className="amc-presets">{[100, 250, 500, 1000].map((value) => <button type="button" key={value} className={amount === String(value) ? "selected" : ""} onClick={() => { setAmount(String(value)); setNotice(""); }}>₹{value.toLocaleString("en-IN")}</button>)}</div>
            <div className="amc-credit-preview"><div><span>You will receive</span><small>After Admin confirms the payment</small></div><strong>{validAmount ? `${formatINR(Number(amount))} Sri` : "— Sri"}</strong></div>
            {!validAmount && <p className="amc-validation">Enter a whole amount between ₹1 and ₹1,00,000.</p>}
          </div>

          <div className="amc-card amc-pay-card">
            <div className="amc-section-title"><span className="amc-step">02</span><div><h2>Pay using UPI</h2><p>Your QR updates automatically when the amount changes.</p></div></div>
            <div className="amc-payment-switch"><span className="active"><QrCode size={16}/> Scan QR</span><span><Smartphone size={16}/> UPI App</span></div>
            <div className="amc-qr-stage">
              {validAmount ? <img src={qrUrl} alt={`UPI payment QR for ₹${amount}`} width="220" height="220"/> : <div className="amc-qr-placeholder"><QrCode size={54}/><span>Enter an amount to generate your QR</span></div>}
              {validAmount && <><strong>Scan to pay ₹{formatINR(Number(amount))}</strong><small>Open GPay, PhonePe, Paytm or another UPI app</small></>}
            </div>
            <div className="amc-or"><span>OR PAY DIRECTLY</span></div>
            <a className={validAmount ? "amc-upi-launch" : "amc-upi-launch disabled"} href={validAmount ? upiUri : undefined}>
              <span className="amc-upi-logo"><CreditCard size={19}/></span><span><b>Pay with UPI App</b><small>Opens an installed UPI app with amount filled</small></span><span className="amc-launch-arrow">↗</span>
            </a>
            <div className="amc-upi-id"><div><span>Pay to UPI ID</span><b>{UPI_ID}</b></div><button type="button" onClick={copyUpi} aria-label="Copy UPI ID">{copied ? <Check size={17}/> : <Copy size={17}/>} {copied ? "Copied" : "Copy"}</button></div>
            <div className="amc-reference"><span>Payment reference</span><b>{reference}</b></div>
          </div>
        </section>

        <section className="amc-card amc-proof-card">
          <div className="amc-section-title"><span className="amc-step">03</span><div><h2>After you pay</h2><p>Enter the UTR / transaction reference so the team can match your payment.</p></div></div>
          <form className="amc-proof-form" onSubmit={submitProof}>
            <label className="amc-label" htmlFor="amc-utr">UPI transaction ID / UTR</label>
            <input id="amc-utr" value={utr} onChange={(event) => setUtr(event.target.value)} placeholder="Enter the 12-digit UTR / transaction ID" minLength={6} maxLength={40} required/>
            <button type="submit" disabled={!validAmount || utr.trim().length < 6}>Submit payment reference</button>
          </form>
          {notice && <p className="amc-notice" role="status"><Info size={16}/>{notice}</p>}
          <div className="amc-security-note"><ShieldCheck size={18}/><span>Coins are not credited just because a QR is scanned or a UTR is entered. Admin must verify the actual bank credit first.</span></div>
        </section>
        <p className="amc-disclaimer">Preview stage: this page creates a UPI QR and opens UPI apps. Payment records, screenshot uploads, Admin approval and wallet credit are not connected yet.</p>
      </div>
      <style jsx>{`
        .amc-page{min-height:100vh;padding:34px 24px 70px;background:radial-gradient(circle at 12% 4%,#eeeaff 0,transparent 30%),radial-gradient(circle at 92% 25%,#e4faf3 0,transparent 27%),#f7f8fc;color:#20283b}
        .amc-shell{max-width:1000px;margin:0 auto}.amc-back{display:inline-flex;align-items:center;gap:8px;color:#68738a;text-decoration:none;font-size:13px;font-weight:650;margin-bottom:25px}
        .amc-heading{display:flex;align-items:center;gap:16px;margin-bottom:25px}.amc-brand-icon{width:58px;height:58px;display:grid;place-items:center;border-radius:18px;background:linear-gradient(145deg,#7666df,#9a8af1);color:#fff;box-shadow:0 12px 28px #7666df35}.amc-heading span{font-size:9px;letter-spacing:2px;font-weight:850;color:#8173ce}.amc-heading h1{font-size:clamp(25px,4vw,34px);letter-spacing:-1.2px;margin:5px 0}.amc-heading p,.amc-section-title p{margin:0;color:#8992a4;font-size:12px;line-height:1.6}
        .amc-layout{display:grid;grid-template-columns:.9fr 1.1fr;gap:17px;align-items:start}.amc-card{border:1px solid #e8eaf2;border-radius:21px;background:#ffffffed;box-shadow:0 15px 42px #25334b0a;padding:23px}.amc-section-title{display:flex;align-items:flex-start;gap:11px;margin-bottom:22px}.amc-step{width:28px;height:28px;flex:0 0 28px;display:grid;place-items:center;border-radius:9px;background:#f0edff;color:#7565cf;font-size:11px;font-weight:850}.amc-section-title h2{font-size:16px;margin:2px 0 5px}.amc-label{display:block;margin:0 0 8px;color:#4c5870;font-size:11px;font-weight:800}
        .amc-amount-input{height:58px;display:flex;align-items:center;gap:10px;padding:0 15px;border:1px solid #e2e5ef;border-radius:13px;background:#fff}.amc-amount-input:focus-within{border-color:#8e7ee0;box-shadow:0 0 0 4px #8e7ee019}.amc-amount-input span{font-size:22px;color:#9299aa}.amc-amount-input input{width:100%;border:0;outline:0;background:transparent;font-size:25px;font-weight:800;color:#28334a}.amc-presets{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:12px}.amc-presets button{padding:9px 5px;border:1px solid #e7e8f0;border-radius:9px;background:#fff;color:#657086;font-size:11px;font-weight:750}.amc-presets button.selected{border-color:#9a8be5;background:#f5f2ff;color:#6e5dc9}.amc-credit-preview{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:24px;padding:15px;border-radius:13px;background:linear-gradient(110deg,#f1efff,#effaf6)}.amc-credit-preview span,.amc-credit-preview small{display:block}.amc-credit-preview span{font-size:11px;font-weight:800}.amc-credit-preview small{font-size:9px;color:#9299a8;margin-top:4px}.amc-credit-preview strong{font-size:20px;color:#218a70;white-space:nowrap}.amc-validation{color:#c45461;font-size:11px}
        .amc-payment-switch{display:flex;gap:7px;padding:5px;border-radius:11px;background:#f4f5f9}.amc-payment-switch span{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:9px;border-radius:8px;color:#8a92a3;font-size:11px;font-weight:750}.amc-payment-switch .active{background:#fff;color:#6659c6;box-shadow:0 2px 8px #26334b12}.amc-qr-stage{display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 10px 16px;text-align:center}.amc-qr-stage img{width:220px;height:220px;padding:9px;border:1px solid #ececf3;border-radius:15px;background:#fff;object-fit:contain}.amc-qr-stage strong{font-size:14px}.amc-qr-stage small{font-size:10px;color:#8c95a6}.amc-qr-placeholder{height:220px;width:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;border:1px dashed #d8d9e6;border-radius:15px;color:#a0a5b4}.amc-qr-placeholder span{font-size:10px}
        .amc-or{display:flex;align-items:center;gap:10px;color:#a0a6b4;font-size:9px;font-weight:800;letter-spacing:1px}.amc-or:before,.amc-or:after{content:"";height:1px;background:#eceef3;flex:1}
        .amc-upi-launch{display:flex;align-items:center;gap:11px;padding:12px;margin-top:12px;border:1px solid #e5e5ef;border-radius:13px;color:#344057;text-decoration:none}.amc-upi-launch.disabled{opacity:.45;pointer-events:none}.amc-upi-logo{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;background:#f0edff;color:#7565cf}.amc-upi-launch>span:nth-child(2){flex:1}.amc-upi-launch b,.amc-upi-launch small{display:block}.amc-upi-launch b{font-size:12px}.amc-upi-launch small{margin-top:4px;color:#8c95a6;font-size:9px}.amc-launch-arrow{font-size:19px;color:#8172d2}
        .amc-upi-id,.amc-reference{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 2px;border-bottom:1px solid #eff0f4}.amc-upi-id span,.amc-reference span{display:block;color:#929aaa;font-size:9px;margin-bottom:4px}.amc-upi-id b,.amc-reference b{font-size:11px;overflow-wrap:anywhere}.amc-upi-id button{display:flex;align-items:center;gap:5px;padding:8px 10px;border:1px solid #e8e8f0;border-radius:8px;background:#fff;color:#6d60c7;font-size:10px;font-weight:750}
        .amc-proof-card{margin-top:17px}.amc-proof-form{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end}.amc-proof-form .amc-label{grid-column:1/-1;margin:0}.amc-proof-form input{height:44px;min-width:0;padding:0 12px;border:1px solid #e2e5ef;border-radius:10px;outline:none}.amc-proof-form button{height:44px;padding:0 16px;border:0;border-radius:10px;background:linear-gradient(120deg,#6e5ed2,#8d7ae9);color:#fff;font-size:11px;font-weight:800}.amc-proof-form button:disabled{opacity:.45;cursor:not-allowed}.amc-notice{display:flex;align-items:flex-start;gap:8px;padding:11px;border-radius:10px;background:#fff8e9;color:#80683d;font-size:11px;line-height:1.5}.amc-notice svg{flex:0 0 auto}.amc-security-note{display:flex;gap:9px;align-items:flex-start;margin-top:16px;padding:12px;border-radius:11px;background:#effaf5;color:#477d6b;font-size:10px;line-height:1.55}.amc-security-note svg{flex:0 0 auto}.amc-disclaimer{margin:14px 3px;color:#969eac;font-size:10px;line-height:1.6}
        @media(max-width:760px){.amc-page{padding:22px 13px 45px}.amc-layout{grid-template-columns:1fr}.amc-card{padding:18px}.amc-heading{align-items:flex-start}.amc-brand-icon{width:48px;height:48px;border-radius:15px}.amc-proof-form{grid-template-columns:1fr}.amc-proof-form .amc-label{grid-column:auto}.amc-proof-form button{width:100%}}
      `}</style>
    </main>
  );
}
