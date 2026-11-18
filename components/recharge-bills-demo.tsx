"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Clock3, CreditCard, FileText, Lightbulb, Phone, RadioTower, ReceiptText, ShieldCheck, Smartphone, Tv, Wifi, Droplets, Flame, Zap } from "lucide-react";

type Service = "Mobile" | "DTH" | "Electricity" | "Water" | "Gas" | "Broadband";
type Tx = { id: string; service: Service; account: string; amount: number; status: "Success (Demo)" };
const services: {name:Service;icon:typeof Smartphone;hint:string}[] = [
  {name:"Mobile",icon:Smartphone,hint:"Prepaid recharge"},
  {name:"DTH",icon:Tv,hint:"TV recharge"},
  {name:"Electricity",icon:Lightbulb,hint:"Electricity bill"},
  {name:"Water",icon:Droplets,hint:"Water bill"},
  {name:"Gas",icon:Flame,hint:"Gas bill"},
  {name:"Broadband",icon:Wifi,hint:"Internet bill"},
];
const operators: Record<Service,string[]> = {
  Mobile:["Airtel","Jio","Vi","BSNL"],
  DTH:["Tata Play","Airtel Digital TV","Dish TV","Sun Direct"],
  Electricity:["TANGEDCO (Tamil Nadu)","Other Electricity Board"],
  Water:["Metro Water","Municipal Water Board"],
  Gas:["Indane Gas","Bharat Gas","HP Gas"],
  Broadband:["ACT Fibernet","Airtel Xstream Fiber","JioFiber","BSNL Bharat Fiber"],
};
const plans = [{amount:149,validity:"28 days",detail:"1 GB/day · Unlimited calls"},{amount:199,validity:"28 days",detail:"1.5 GB/day · Unlimited calls"},{amount:299,validity:"28 days",detail:"2 GB/day · Unlimited calls"},{amount:399,validity:"56 days",detail:"1.5 GB/day · Unlimited calls"}];

export default function RechargeBillsDemo(){
  const [service,setService]=useState<Service>("Mobile");
  const [operator,setOperator]=useState(operators.Mobile[0]);
  const [circle,setCircle]=useState("Tamil Nadu");
  const [account,setAccount]=useState("");
  const [amount,setAmount]=useState("149");
  const [step,setStep]=useState<"details"|"bill"|"payment"|"done">("details");
  const [billName,setBillName]=useState("");
  const [billAmount,setBillAmount]=useState("850");
  const [transactions,setTransactions]=useState<Tx[]>([]);
  const [error,setError]=useState("");
  const [lastTx,setLastTx]=useState<Tx|null>(null);
  const [showHistory,setShowHistory]=useState(false);
  const isRecharge=service==="Mobile"||service==="DTH";
  const selectedService=services.find(x=>x.name===service)!;
  const amountNumber=Number(amount);
  const ref=useMemo(()=> "DEMO"+Date.now().toString().slice(-8),[step==="payment"]);
  function chooseService(next:Service){setService(next);setOperator(operators[next][0]);setAccount("");setAmount(next==="Mobile"?"149":"");setStep("details");setError("");}
  function continueFlow(){
    setError("");
    if(!account.trim()){setError(isRecharge?"Enter a mobile number or subscriber ID.":"Enter your consumer / account number.");return;}
    if(isRecharge && account.replace(/\D/g,"").length<8){setError("Please enter a valid number or subscriber ID.");return;}
    if(isRecharge){if(!amountNumber||amountNumber<10){setError("Choose a valid recharge amount.");return;}setStep("payment");}
    else {setBillName("Demo Customer");setStep("bill");}
  }
  function confirmBill(){setStep("payment");}
  function payDemo(){
    const value=isRecharge?amountNumber:Number(billAmount);
    const tx:Tx={id:ref,service,account,amount:value,status:"Success (Demo)"};
    setLastTx(tx);setTransactions(prev=>[tx,...prev]);setStep("done");
  }
  function reset(){setStep("details");setAccount("");setError("");setLastTx(null);}
  return <main className="rb-page">
    <section className="rb-hero"><div><span className="rb-eyebrow">SRI AMIRTHAA · DEMO MODE</span><h1>Recharge & Bills</h1><p>Recharge your mobile, DTH and explore bill-payment workflows in one place.</p></div><div className="rb-demo-pill"><ShieldCheck size={16}/> No API key · No real payment</div></section>
    <div className="rb-notice"><CircleHelp size={17}/><span><b>Demo only:</b> All operators, plans, bill details and payment results below are sample data. No money is collected and no actual recharge or bill payment is made.</span></div>
    <section className="rb-service-grid">{services.map(({name,icon:Icon,hint})=><button key={name} onClick={()=>chooseService(name)} className={`rb-service ${service===name?"active":""}`}><Icon size={22}/><b>{name}</b><small>{hint}</small></button>)}</section>
    <section className="rb-workspace">
      <div className="rb-workflow-head"><div><span className="rb-eyebrow">STEP-BY-STEP WORKFLOW</span><h2>{service} {isRecharge?"Recharge":"Bill Payment"}</h2></div><span className="rb-step-label">{step==="details"?"01 · Details":step==="bill"?"02 · Bill preview":step==="payment"?"03 · Demo payment":"04 · Completed"}</span></div>
      <div className="rb-progress"><i className={step!=="details"?"done":""}/><i className={["payment","done"].includes(step)?"done":""}/><i className={step==="done"?"done":""}/></div>
      {step==="details"&&<div className="rb-form-grid">
        <label>Operator / Provider<select value={operator} onChange={e=>setOperator(e.target.value)}>{operators[service].map(x=><option key={x}>{x}</option>)}</select></label>
        {service==="Mobile"&&<label>Circle / State<select value={circle} onChange={e=>setCircle(e.target.value)}>{["Tamil Nadu","Kerala","Karnataka","Andhra Pradesh","Telangana","Maharashtra","Delhi"].map(x=><option key={x}>{x}</option>)}</select></label>}
        <label className="rb-wide">{isRecharge?(service==="Mobile"?"Mobile number":"Subscriber / Customer ID"):"Consumer / Account number"}<input value={account} onChange={e=>setAccount(e.target.value)} placeholder={service==="Mobile"?"Enter 10-digit mobile number":"Enter your account / consumer number"} inputMode="numeric"/></label>
        {isRecharge&&<div className="rb-wide"><div className="rb-label">Choose a sample plan</div><div className="rb-plans">{plans.map(p=><button type="button" key={p.amount} onClick={()=>setAmount(String(p.amount))} className={amount===String(p.amount)?"selected":""}><b>₹{p.amount}</b><small>{p.validity}</small><small>{p.detail}</small></button>)}</div><label className="rb-amount">Or enter amount<input type="number" min="10" value={amount} onChange={e=>setAmount(e.target.value)}/></label></div>}
        <div className="rb-wide rb-actions"><button className="rb-primary" onClick={continueFlow}>Continue <ArrowRight size={17}/></button></div>
        {error&&<p className="rb-error rb-wide">{error}</p>}
      </div>}
      {step==="bill"&&<div className="rb-bill-preview"><div className="rb-bill-icon"><ReceiptText size={26}/></div><div><span className="rb-eyebrow">SAMPLE BILL FETCH RESULT</span><h3>{billName}</h3><p>{operator} · Account {account}</p><small>Billing period: Sample billing cycle · Due date: 28 Nov 2026</small></div><label>Bill amount<input type="number" value={billAmount} onChange={e=>setBillAmount(e.target.value)}/></label><button className="rb-primary" onClick={confirmBill}>Proceed to demo payment <ArrowRight size={17}/></button></div>}
      {step==="payment"&&<div className="rb-payment"><div className="rb-payment-card"><CreditCard size={25}/><span className="rb-eyebrow">DEMO CHECKOUT</span><h3>Review your payment</h3><div className="rb-payment-row"><span>Service</span><b>{service}</b></div><div className="rb-payment-row"><span>Provider</span><b>{operator}</b></div><div className="rb-payment-row"><span>Account</span><b>{account}</b></div><div className="rb-payment-row rb-total"><span>Amount</span><b>₹{(isRecharge?amountNumber:Number(billAmount)).toLocaleString("en-IN")}</b></div><p>This is a simulated checkout. Clicking below creates only a demo transaction record in this page session.</p><button className="rb-primary" onClick={payDemo}>Simulate successful payment <ArrowRight size={17}/></button><button className="rb-back" onClick={()=>setStep(isRecharge?"details":"bill")}><ArrowLeft size={15}/> Go back</button></div></div>}
      {step==="done"&&lastTx&&<div className="rb-success"><CheckCircle2 size={46}/><span className="rb-eyebrow">DEMO TRANSACTION COMPLETE</span><h3>Payment successful (Demo)</h3><p>No actual payment or recharge has taken place.</p><div className="rb-success-details"><span>Demo reference</span><b>{lastTx.id}</b><span>Service / Account</span><b>{lastTx.service} · {lastTx.account}</b><span>Amount</span><b>₹{lastTx.amount.toLocaleString("en-IN")}</b><span>Status</span><b className="rb-status">{lastTx.status}</b></div><button className="rb-primary" onClick={reset}>Start another demo <ArrowRight size={17}/></button></div>}
    </section>
    <section className="rb-history"><button onClick={()=>setShowHistory(v=>!v)}><span><Clock3 size={18}/> Demo transaction history ({transactions.length})</span><span>{showHistory?"−":"+"}</span></button>{showHistory&&<div className="rb-history-list">{transactions.length===0?<p>No demo transactions yet.</p>:transactions.map(tx=><div key={tx.id}><span><b>{tx.service}</b><small>{tx.id} · {tx.account}</small></span><span><b>₹{tx.amount.toLocaleString("en-IN")}</b><small className="rb-status">{tx.status}</small></span></div>)}</div>}</section>
    <p className="rb-footnote"><FileText size={14}/> Demo workflow is for UI testing only. Live operator lookup, bill fetch, recharge and payments will require an approved provider API and secure backend integration.</p>
  </main>;
}
