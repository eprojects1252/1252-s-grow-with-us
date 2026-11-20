export default function PetShopPage() {
  return (
    <main style={{minHeight:"100vh",padding:"34px 24px 70px",background:"linear-gradient(145deg,#f4fbf7,#f5f8f5 55%,#eef5ef)",color:"#173d2c"}}>
      <section style={{maxWidth:1120,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:18,marginBottom:34}}>
          <img src="/petopia-icon.svg" alt="Poonachi's Petopia" style={{width:92,height:92,objectFit:"contain"}}/>
          <div><p style={{margin:"0 0 5px",fontSize:11,fontWeight:800,letterSpacing:".18em",color:"#4b8a63"}}>SRI AMIRTHAA GROUPS 1252</p><h1 style={{margin:0,fontSize:"clamp(27px,5vw,46px)",lineHeight:1.05}}>Poonachi’s Petopia</h1><p style={{margin:"8px 0 0",color:"#668171"}}>Specialty Pets &amp; Supplies</p></div>
        </div>
        <div style={{padding:"clamp(24px,5vw,54px)",borderRadius:28,background:"linear-gradient(120deg,#e0f0e6,#f7f8ee)",border:"1px solid #d8e9dc",boxShadow:"0 20px 55px #315b3b12"}}>
          <p style={{margin:0,fontSize:11,fontWeight:800,letterSpacing:".2em",color:"#568266"}}>WELCOME TO PETOPIA</p>
          <h2 style={{maxWidth:650,margin:"13px 0",fontSize:"clamp(30px,5vw,52px)",lineHeight:1.08}}>A happy place for every little companion.</h2>
          <p style={{maxWidth:600,color:"#61796a",lineHeight:1.8}}>Our dedicated pet shop is being prepared. Pet categories, supplies, product listings, and shopping features will be added here.</p>
          <div style={{display:"inline-flex",marginTop:15,padding:"11px 16px",borderRadius:999,background:"#fff",border:"1px solid #d7e8dc",fontSize:12,fontWeight:750,color:"#3d7954"}}>Pet Shop • Coming Soon</div>
        </div>
      </section>
    </main>
  );
}
