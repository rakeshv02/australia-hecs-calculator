const { useState } = React;

const THRESHOLDS = [
  {min:0,max:54434,rate:0},{min:54435,max:62850,rate:0.01},{min:62851,max:66620,rate:0.02},
  {min:66621,max:70618,rate:0.025},{min:70619,max:74855,rate:0.03},{min:74856,max:79346,rate:0.035},
  {min:79347,max:83407,rate:0.04},{min:83408,max:88833,rate:0.045},{min:88834,max:94568,rate:0.05},
  {min:94569,max:100518,rate:0.055},{min:100519,max:106539,rate:0.06},{min:106540,max:112571,rate:0.065},
  {min:112572,max:119310,rate:0.07},{min:119311,max:126619,rate:0.075},{min:126620,max:134003,rate:0.08},
  {min:134004,max:141848,rate:0.085},{min:141849,max:150373,rate:0.09},{min:150374,max:159657,rate:0.095},
  {min:159658,max:Infinity,rate:0.10},
];

function getRate(income) { return (THRESHOLDS.find(t=>income>=t.min&&income<=t.max)||{rate:0.10}).rate; }

function simulate(debt, income, growth, indexation) {
  let remaining = debt, totalPaid = 0;
  const yearly = [];
  for (let yr=1; yr<=40; yr++) {
    const cur = income * Math.pow(1+growth/100, yr-1);
    const rate = getRate(cur);
    const repayment = Math.min(cur*rate, remaining);
    remaining = (remaining*(1+indexation/100)) - repayment;
    totalPaid += repayment;
    yearly.push({ yr, income:cur, rate, repayment, balance:Math.max(0,remaining) });
    if (remaining<=0) return { totalPaid, years:yr, writtenOff:0, paidOff:true, yearly };
  }
  return { totalPaid, years:40, writtenOff:Math.max(0,remaining), paidOff:false, yearly };
}

const fmt = n => "$"+Math.round(n).toLocaleString();
const pct = n => (n*100).toFixed(1)+"%";

export default function AustraliaHECS() {
  const [debt,setDebt]=useState("35000");
  const [income,setIncome]=useState("70000");
  const [growth,setGrowth]=useState("3");
  const [indexation,setIndexation]=useState("3.2");
  const [result,setResult]=useState(null);

  const calculate = () => {
    const d=parseFloat(debt)||0, i=parseFloat(income)||0, g=parseFloat(growth)||0, idx=parseFloat(indexation)||3.2;
    const rate=getRate(i);
    const sim=simulate(d,i,g,idx);
    setResult({ debt:d, income:i, rate, annualRepayment:i*rate, monthlyRepayment:(i*rate)/12, ...sim });
  };

  const inputStyle={width:"100%",padding:"12px",border:"2px solid #bbf7d0",borderRadius:10,fontSize:16,boxSizing:"border-box",outline:"none"};
  const labelStyle={display:"block",fontWeight:600,marginBottom:6,color:"#333"};

  return (
    <div style={{fontFamily:"'Segoe UI',Arial,sans-serif",background:"#f0fdf4",minHeight:"100vh",padding:"20px"}}>
      <div style={{maxWidth:820,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:48,marginBottom:8}}>🎓</div>
          <h1 style={{margin:0,fontSize:32,fontWeight:800,color:"#1a1a2e"}}>Australia HECS/HELP Calculator</h1>
          <p style={{margin:"8px 0 0",color:"#555",fontSize:16}}>Compulsory repayments, payoff timeline & total cost — 2024–25</p>
        </div>
        <div style={{background:"#fff",borderRadius:16,padding:28,boxShadow:"0 4px 24px rgba(0,0,0,0.08)",marginBottom:24}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(190px,1fr))",gap:20}}>
            <div><label style={labelStyle}>HECS/HELP Debt</label><div style={{position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#666",fontWeight:600}}>$</span><input type="number" value={debt} onChange={e=>setDebt(e.target.value)} style={{...inputStyle,paddingLeft:28}} /></div></div>
            <div><label style={labelStyle}>Annual Income (AUD)</label><div style={{position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#666",fontWeight:600}}>$</span><input type="number" value={income} onChange={e=>setIncome(e.target.value)} style={{...inputStyle,paddingLeft:28}} /></div></div>
            <div><label style={labelStyle}>Annual Salary Growth (%)</label><div style={{position:"relative"}}><input type="number" value={growth} min="0" max="20" onChange={e=>setGrowth(e.target.value)} style={{...inputStyle,paddingRight:32}} /><span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#666"}}>%</span></div></div>
            <div><label style={labelStyle}>Indexation Rate (%)</label><div style={{position:"relative"}}><input type="number" value={indexation} min="0" max="20" step="0.1" onChange={e=>setIndexation(e.target.value)} style={{...inputStyle,paddingRight:32}} /><span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#666"}}>%</span></div><div style={{fontSize:12,color:"#888",marginTop:4}}>2024: 3.2% (CPI-linked)</div></div>
          </div>
          <button onClick={calculate} style={{width:"100%",marginTop:24,padding:"16px",background:"linear-gradient(135deg, #059669, #0d9488)",color:"#fff",border:"none",borderRadius:12,fontSize:18,fontWeight:700,cursor:"pointer"}}>Calculate HECS Repayments</button>
        </div>

        {result && <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(160px,1fr))",gap:16,marginBottom:24}}>
            {[
              {label:"Annual Repayment",value:fmt(result.annualRepayment),color:"#059669",bg:"#f0fdf4"},
              {label:"Monthly Repayment",value:fmt(result.monthlyRepayment),color:"#0d9488",bg:"#f0fdfa"},
              {label:"Repayment Rate",value:pct(result.rate),color:"#7c3aed",bg:"#faf5ff"},
              {label:"Years to Pay Off",value:result.paidOff?`${result.years} yrs ✓`:`40 yrs (written off)`,color:result.paidOff?"#059669":"#d97706",bg:result.paidOff?"#f0fdf4":"#fffbeb"},
              {label:"Total Paid",value:fmt(result.totalPaid),color:"#dc2626",bg:"#fff5f5"},
            ].map((item,i)=>(
              <div key={i} style={{background:item.bg,borderRadius:14,padding:18,textAlign:"center",border:`2px solid ${item.color}22`}}>
                <div style={{fontSize:20,fontWeight:800,color:item.color}}>{item.value}</div>
                <div style={{fontSize:12,color:"#555",marginTop:4,fontWeight:500}}>{item.label}</div>
              </div>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
            <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
              <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:700,color:"#1a1a2e"}}>Year-by-Year (first 10)</h3>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:"#f0fdf4"}}>{["Yr","Income","Rate","Repayment","Balance"].map(h=><th key={h} style={{padding:"8px",textAlign:"left",fontWeight:700}}>{h}</th>)}</tr></thead>
                <tbody>{result.yearly.slice(0,10).map((y,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid #f1f3f5"}}>
                    <td style={{padding:"7px 8px"}}>{y.yr}</td>
                    <td style={{padding:"7px 8px"}}>{fmt(y.income)}</td>
                    <td style={{padding:"7px 8px",color:"#059669",fontWeight:600}}>{pct(y.rate)}</td>
                    <td style={{padding:"7px 8px"}}>{fmt(y.repayment)}</td>
                    <td style={{padding:"7px 8px",fontWeight:600,color:y.balance<result.debt*0.3?"#059669":"#333"}}>{fmt(y.balance)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
              <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:700,color:"#1a1a2e"}}>Summary</h3>
              {[
                {label:"Starting Debt",value:fmt(result.debt)},
                {label:"Income",value:fmt(result.income)},
                {label:"Repayment Rate Now",value:pct(result.rate),color:"#059669"},
                {label:"Annual Repayment Now",value:fmt(result.annualRepayment)},
                {label:"Total Repaid",value:fmt(result.totalPaid),bold:true,color:"#dc2626"},
                {label:"Written Off",value:result.writtenOff>0?fmt(result.writtenOff):"$0 (fully paid!)",color:"#059669"},
                {label:result.paidOff?"Paid Off In":"Written Off After",value:`${result.years} years`,bold:true,border:true,color:result.paidOff?"#059669":"#d97706"},
              ].map((row,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderTop:row.border?"2px solid #e9ecef":"1px solid #f1f3f5"}}>
                  <span style={{fontSize:14,color:"#444",fontWeight:row.bold?700:400}}>{row.label}</span>
                  <span style={{fontSize:14,fontWeight:row.bold?700:600,color:row.color||"#222"}}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{background:"#fff3cd",border:"1px solid #ffc107",borderRadius:12,padding:16,fontSize:13,color:"#664d03"}}>
            <strong>Note:</strong> HECS-HELP is indexed annually to CPI. 2024 indexation was 4.7%. Repayments are made automatically through your tax return — no manual payments needed.
          </div>
        </>}
      </div>
    </div>
  );
}
