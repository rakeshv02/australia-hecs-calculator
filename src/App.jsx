const { useState } = React;

// Source: ATO — 2025–26 HECS/HELP repayment thresholds (last updated 30 June 2026)
// From 2025–26 a NEW MARGINAL RATE system applies (not a flat % of all income).
// Repayment is calculated ONLY on income above each threshold boundary.

const BANDS_2526 = [
  { min: 0,       max: 67000,  marginalRate: 0 },
  { min: 67000,   max: 125000, marginalRate: 0.15 },
  { min: 125000,  max: 179285, marginalRate: 0.17 },
  { min: 179285,  max: Infinity, flatRate: 0.10 }, // 10% of TOTAL repayment income
];

function calcRepayment(income) {
  if (income <= 67000) return 0;
  if (income <= 125000) return (income - 67000) * 0.15;
  if (income <= 179285) return 8700 + (income - 125000) * 0.17;
  return income * 0.10; // flat 10% of total income
}

function simulate(debt, income, growth, indexation) {
  let remaining = debt, totalPaid = 0;
  const yearly = [];
  for (let yr = 1; yr <= 40; yr++) {
    const cur = income * Math.pow(1 + growth / 100, yr - 1);
    const repayment = Math.min(calcRepayment(cur), remaining);
    remaining = (remaining * (1 + indexation / 100)) - repayment;
    totalPaid += repayment;
    const effectiveRate = cur > 0 ? repayment / cur : 0;
    yearly.push({ yr, income: cur, repayment, effectiveRate, balance: Math.max(0, remaining) });
    if (remaining <= 0) return { totalPaid, years: yr, writtenOff: 0, paidOff: true, yearly };
  }
  return { totalPaid, years: 40, writtenOff: Math.max(0, remaining), paidOff: false, yearly };
}

const fmt = n => "$" + Math.round(n).toLocaleString();
const pct = n => (n * 100).toFixed(1) + "%";

export default function AustraliaHECS() {
  const [debt, setDebt] = useState("35000");
  const [income, setIncome] = useState("80000");
  const [growth, setGrowth] = useState("3");
  const [indexation, setIndexation] = useState("3.0");
  const [result, setResult] = useState(null);

  const calculate = () => {
    const d = parseFloat(debt) || 0, i = parseFloat(income) || 0;
    const g = parseFloat(growth) || 0, idx = parseFloat(indexation) || 3.0;
    const annualRepayment = calcRepayment(i);
    const effectiveRate = i > 0 ? annualRepayment / i : 0;
    const sim = simulate(d, i, g, idx);
    setResult({ debt: d, income: i, annualRepayment, monthlyRepayment: annualRepayment / 12, effectiveRate, ...sim });
  };

  const inputStyle = { width: "100%", padding: "12px", border: "2px solid #bbf7d0", borderRadius: 10, fontSize: 16, boxSizing: "border-box", outline: "none" };
  const labelStyle = { display: "block", fontWeight: 600, marginBottom: 6, color: "#333" };

  return (
    <div style={{ fontFamily: "'Segoe UI',Arial,sans-serif", background: "#f0fdf4", minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#1a1a2e" }}>Australia HECS/HELP Calculator</h1>
          <p style={{ margin: "8px 0 0", color: "#555", fontSize: 16 }}>Compulsory repayments, payoff timeline & total cost — 2025–26</p>
        </div>

        <div style={{ background: "#e0f2fe", border: "1px solid #38bdf8", borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 13, color: "#0369a1" }}>
          <strong>🆕 New from 2025–26:</strong> HECS repayments now use a <strong>marginal rate system</strong> — you only pay on income <em>above</em> each threshold, not a flat % of all earnings. This significantly reduces repayments for many people.
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px,1fr))", gap: 20 }}>
            <div><label style={labelStyle}>HECS/HELP Debt</label><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#666", fontWeight: 600 }}>$</span><input type="number" value={debt} onChange={e => setDebt(e.target.value)} style={{ ...inputStyle, paddingLeft: 28 }} /></div></div>
            <div><label style={labelStyle}>Annual Income (AUD)</label><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#666", fontWeight: 600 }}>$</span><input type="number" value={income} onChange={e => setIncome(e.target.value)} style={{ ...inputStyle, paddingLeft: 28 }} /></div></div>
            <div><label style={labelStyle}>Annual Salary Growth (%)</label><div style={{ position: "relative" }}><input type="number" value={growth} min="0" max="20" onChange={e => setGrowth(e.target.value)} style={{ ...inputStyle, paddingRight: 32 }} /><span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#666" }}>%</span></div></div>
            <div><label style={labelStyle}>Indexation Rate (%)</label><div style={{ position: "relative" }}><input type="number" value={indexation} min="0" max="20" step="0.1" onChange={e => setIndexation(e.target.value)} style={{ ...inputStyle, paddingRight: 32 }} /><span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#666" }}>%</span></div><div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>CPI-linked, set annually by ATO</div></div>
          </div>
          <button onClick={calculate} style={{ width: "100%", marginTop: 24, padding: "16px", background: "linear-gradient(135deg, #059669, #0d9488)", color: "#fff", border: "none", borderRadius: 12, fontSize: 18, fontWeight: 700, cursor: "pointer" }}>Calculate HECS Repayments</button>
        </div>

        {result && <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Annual Repayment", value: fmt(result.annualRepayment), color: "#059669", bg: "#f0fdf4" },
              { label: "Monthly Repayment", value: fmt(result.monthlyRepayment), color: "#0d9488", bg: "#f0fdfa" },
              { label: "Effective Rate", value: pct(result.effectiveRate), color: "#7c3aed", bg: "#faf5ff" },
              { label: "Years to Pay Off", value: result.paidOff ? `${result.years} yrs ✓` : `40 yrs (written off)`, color: result.paidOff ? "#059669" : "#d97706", bg: result.paidOff ? "#f0fdf4" : "#fffbeb" },
              { label: "Total Paid", value: fmt(result.totalPaid), color: "#dc2626", bg: "#fff5f5" },
            ].map((item, i) => (
              <div key={i} style={{ background: item.bg, borderRadius: 14, padding: 18, textAlign: "center", border: `2px solid ${item.color}22` }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 4, fontWeight: 500 }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>Year-by-Year (first 10)</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ background: "#f0fdf4" }}>{["Yr", "Income", "Rate", "Repayment", "Balance"].map(h => <th key={h} style={{ padding: "8px", textAlign: "left", fontWeight: 700 }}>{h}</th>)}</tr></thead>
                <tbody>{result.yearly.slice(0, 10).map((y, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f3f5" }}>
                    <td style={{ padding: "7px 8px" }}>{y.yr}</td>
                    <td style={{ padding: "7px 8px" }}>{fmt(y.income)}</td>
                    <td style={{ padding: "7px 8px", color: "#059669", fontWeight: 600 }}>{pct(y.effectiveRate)}</td>
                    <td style={{ padding: "7px 8px" }}>{fmt(y.repayment)}</td>
                    <td style={{ padding: "7px 8px", fontWeight: 600, color: y.balance < result.debt * 0.3 ? "#059669" : "#333" }}>{fmt(y.balance)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>Summary</h3>
              {[
                { label: "Starting Debt", value: fmt(result.debt) },
                { label: "Income", value: fmt(result.income) },
                { label: "Annual Repayment Now", value: fmt(result.annualRepayment), color: "#059669" },
                { label: "Effective Rate", value: pct(result.effectiveRate) },
                { label: "Total Repaid", value: fmt(result.totalPaid), bold: true, color: "#dc2626" },
                { label: "Written Off", value: result.writtenOff > 0 ? fmt(result.writtenOff) : "$0 (fully paid!)", color: "#059669" },
                { label: result.paidOff ? "Paid Off In" : "Written Off After", value: `${result.years} years`, bold: true, border: true, color: result.paidOff ? "#059669" : "#d97706" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: row.border ? "2px solid #e9ecef" : "1px solid #f1f3f5" }}>
                  <span style={{ fontSize: 14, color: "#444", fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: row.bold ? 700 : 600, color: row.color || "#222" }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 12, padding: 16, fontSize: 13, color: "#664d03" }}>
            <strong>Note:</strong> From 2025–26 repayments are marginal (only on income above each threshold). Indexation is CPI-linked and set each year by the ATO. Repayments are made automatically through your tax return.
          </div>
        </>}

        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginTop: 24 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>📊 2025–26 Repayment Thresholds (Marginal System)</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#f0fdf4" }}>{["Repayment Income", "Repayment on This Income"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700 }}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                ["$0 – $67,000", "Nil"],
                ["$67,001 – $125,000", "15c for each $1 over $67,000"],
                ["$125,001 – $179,285", "$8,700 plus 17c for each $1 over $125,000"],
                ["$179,286 and over", "10% of total repayment income"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f3f5", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 14px", color: "#333" }}>{row[0]}</td>
                  <td style={{ padding: "10px 14px", color: i === 0 ? "#059669" : "#0d9488", fontWeight: 500 }}>{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: "12px 0 0", fontSize: 12, color: "#888" }}>Source: ATO (ato.gov.au), last updated 30 June 2026.</p>
        </div>
      </div>
    </div>
  );
}
