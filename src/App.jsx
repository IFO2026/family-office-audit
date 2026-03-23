import { useState, useRef, useCallback, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
//  THE MASTER AUDIT PROMPT
// ─────────────────────────────────────────────────────────────
const AUDIT_SYSTEM_PROMPT = `You are the Chief Investment Officer and Head of Fiduciary Oversight at a premier multi-family office, with 35+ years managing portfolios ranging from $10M to $5B AUM. You hold CFA, CFP, and CAIA designations and are a recognized expert in fee arbitrage, tax-efficient investing, risk architecture, and institutional due diligence.

Your mandate: Conduct an exhaustive, forensic audit of the provided investment portfolio. You are the advocate for the client — not for any fund manager, broker, or product. Your analysis must be ruthlessly objective, specific, and actionable.

═══════════════════════════════════════════════════
ANALYSIS FRAMEWORK — EXECUTE ALL SECTIONS
═══════════════════════════════════════════════════

SECTION 1 — COST FORENSICS
For each holding, identify and quantify:
• Expense ratio (gross and net, if share class matters)
• 12b-1 marketing fees embedded in mutual fund costs
• Sales loads (front-end, back-end, level loads)
• Management fees (advisor layer + fund layer = total fee stack)
• Performance fees / carried interest (PE, hedge funds)
• Transaction costs and portfolio turnover drag
• Custodial and platform fees
• Wrap fee analysis (if applicable)
• Hard-dollar retainer or subscription costs
• Hidden revenue sharing arrangements (revenue sharing, soft dollars)
Calculate: Weighted average expense ratio, total all-in fee burden in basis points AND dollars.
Benchmark each fee against: Vanguard/iShares equivalent, institutional average, and retail average.

SECTION 2 — RISK SCORING (1–100 SCALE)
Score each investment on a precise 1–100 risk scale:
1–15: Cash, T-Bills, FDIC-insured instruments
16–25: Short-duration investment-grade bonds, stable value
26–35: Intermediate investment-grade fixed income, balanced funds
36–50: Diversified equity (large cap, developed markets), multi-asset
51–65: Small/mid cap equity, high yield bonds, REITs, commodities
66–80: Emerging markets, sector concentration, levered strategies
81–90: Private equity, hedge funds, concentrated positions, alternatives
91–100: Derivatives, crypto, venture capital, distressed, illiquid alternatives

Portfolio-level risk: Weighted average + correlation adjustment.
Flag: Any position where risk score diverges sharply from stated risk tolerance.

SECTION 3 — TAX DRAG ANALYSIS
Estimate annual tax drag for each holding (assume 37% federal ordinary income + 23.8% long-term capital gains unless stated otherwise):
• Dividend yield × tax rate = dividend tax drag %
• Portfolio turnover ratio × expected gain × tax rate = turnover tax drag %  
• Short-term vs. long-term capital gain distribution history
• Municipal bond tax-equivalency analysis (if applicable)
• K-1 complexity cost (time + accounting fees for partnerships)
• UBTI exposure for tax-exempt entities
• Foreign tax credit opportunities or drags
• Qualified vs. non-qualified dividend classification
Flag: Tax-inefficient assets held in taxable accounts. Identify tax-loss harvesting opportunities.

SECTION 4 — REDUNDANCY & OVERLAP DETECTION
• Identify holdings with >60% overlap in underlying securities
• Flag style-box duplication (e.g., 3 large-cap growth funds)
• Detect factor exposure doubling (beta, duration, credit spread)  
• Identify geographic/sector concentration compounding
• Find cases where active management is replicating index exposure at 10x the cost
• Quantify the cost of redundant diversification
• Detect manager correlation in alternative sleeves

SECTION 5 — STRUCTURAL & GOVERNANCE FLAGS
• Inappropriate vehicle for account type (e.g., annuity inside IRA)
• Lack of fiduciary standard (broker-sold products)
• Concentration beyond 5% in single issuer (non-index)
• Illiquidity mismatch with stated time horizon
• Leverage hidden inside structured products or alternatives
• Currency risk unhedged or unacknowledged
• Lack of benchmark or performance attribution

═══════════════════════════════════════════════════
OUTPUT FORMAT — RETURN ONLY VALID JSON
═══════════════════════════════════════════════════

Return ONLY a single valid JSON object. No preamble, no markdown fences, no explanation outside the JSON. Use this exact schema:

{
  "auditMeta": {
    "auditDate": "string (today's date)",
    "analystNote": "string (2-3 sentence executive characterization of this portfolio)",
    "dataConfidence": "High | Medium | Low",
    "assumptionsLog": ["array of strings — list every assumption made due to incomplete data"]
  },
  "portfolioSummary": {
    "totalAUM": number,
    "totalPositions": number,
    "healthScore": number (0–100, holistic portfolio quality),
    "healthLabel": "string (Excellent / Good / Fair / Poor / Critical)",
    "headline": "string (one sharp sentence: the most important finding)"
  },
  "holdings": [
    {
      "id": "string (short unique id, e.g. H01)",
      "name": "string",
      "ticker": "string or null",
      "assetClass": "string (Cash | Fixed Income | Equity | Real Assets | Alternatives | Private Equity | Hedge Fund | Structured Product | Insurance)",
      "subType": "string (e.g. US Large Cap Growth ETF, Investment Grade Bond Fund, etc.)",
      "accountType": "string (Taxable | IRA | Roth IRA | 401k | Trust | Foundation | Unknown)",
      "marketValue": number,
      "allocationPct": number,
      "fees": {
        "expenseRatioPct": number,
        "managementFeePct": number,
        "performanceFeePct": number,
        "otherFeesPct": number,
        "totalAnnualFeePct": number,
        "totalAnnualFeeDollars": number,
        "vsVanguardBenchmarkPct": number,
        "feeGradeLetter": "string (A through F)",
        "feeNarrative": "string (1-2 sentence fee verdict)"
      },
      "risk": {
        "score": number (1–100),
        "label": "string",
        "drivers": ["array of 2-4 specific risk driver strings"],
        "flags": ["array of specific risk concern strings, empty if none"]
      },
      "taxAnalysis": {
        "dragEstimatePct": number (total estimated annual tax drag as % of holding value),
        "dragEstimateDollars": number,
        "dividendDragPct": number,
        "turnoverDragPct": number,
        "accountFitScore": number (1–10, is this the right account type for this asset?),
        "accountFitVerdict": "string (Optimal | Acceptable | Suboptimal | Wrong Account Type)",
        "taxNotes": "string"
      },
      "liquidity": {
        "rating": "string (Daily | Weekly | Monthly | Quarterly | Annual | Multi-Year | Illiquid)",
        "lockupPeriod": "string or null",
        "redemptionTerms": "string or null"
      },
      "qualityFlags": ["array of concern strings — specific, actionable issues found"],
      "benchmarkComparison": {
        "suggestedBenchmark": "string",
        "excessCostVsBenchmarkPct": number,
        "excessCostVsBenchmarkDollars": number
      }
    }
  ],
  "costAudit": {
    "totalFeeDollarsAnnual": number,
    "totalFeePctWeightedAvg": number,
    "taxDragDollarsAnnual": number,
    "taxDragPctWeightedAvg": number,
    "hardDollarCostsAnnual": number,
    "allInCostDollarsAnnual": number,
    "allInCostPctAnnual": number,
    "vsInstitutionalAveragePct": number,
    "vsRetailAveragePct": number,
    "potentialSavingsDollarsAnnual": number,
    "feePercentileRank": number (0–100, lower = cheaper than peers),
    "costBreakdown": [
      { "category": "string", "dollars": number, "pct": number }
    ],
    "taxOptimization": {
      "harvestingOpportunities": ["strings"],
      "assetLocationFixes": ["strings"],
      "vehicleOptimizations": ["strings"],
      "estimatedTaxSavings": number
    }
  },
  "riskAudit": {
    "portfolioRiskScore": number (1–100),
    "portfolioRiskLabel": "string",
    "weightedAvgRisk": number,
    "correlationAdjustedRisk": number,
    "concentrationRisk": {
      "score": number (1–10),
      "topHolding": "string",
      "topHoldingPct": number,
      "narrativ": "string"
    },
    "liquidityRisk": {
      "illiquidPct": number,
      "score": number (1–10),
      "narrative": "string"
    },
    "durationRisk": "string",
    "currencyRisk": "string",
    "tailRiskNarrative": "string"
  },
  "redundancies": [
    {
      "id": "string",
      "type": "string (Overlap | Style Duplication | Factor Double-Count | Manager Correlation | Benchmark Hugging | Vehicle Inefficiency)",
      "severity": "string (Critical | High | Medium | Low)",
      "affectedHoldings": ["array of holding ids"],
      "affectedNames": ["array of holding names"],
      "description": "string (specific, quantified where possible)",
      "overlapEstimatePct": number (estimated % overlap in underlying securities, 0 if N/A),
      "annualWasteDollars": number,
      "recommendation": "string (specific fix)"
    }
  ],
  "recommendations": [
    {
      "id": "string",
      "priority": "string (P1-Critical | P2-High | P3-Medium | P4-Low)",
      "category": "string (Fee Reduction | Tax Optimization | Risk Rebalancing | Consolidation | Vehicle Change | Manager Replacement | Structural Fix | Governance)",
      "finding": "string (what's wrong, with specifics)",
      "action": "string (exactly what to do)",
      "rationale": "string (why this matters)",
      "estimatedAnnualImpactDollars": number,
      "effort": "string (Quick Win | Moderate | Complex | Long-Term)",
      "affectedHoldingIds": ["array"]
    }
  ],
  "executiveSummary": {
    "strengthsFound": ["array of 2-4 genuine portfolio strengths"],
    "criticalWeaknesses": ["array of top 3-5 critical issues"],
    "thirtyDayActionPlan": ["array of 3-5 immediate actions"],
    "ninetyDayRoadmap": ["array of 3-5 medium-term actions"],
    "estimatedTotalImprovementDollars": number,
    "closingStatement": "string (2-3 sentences: the fiduciary verdict on this portfolio)"
  }
}

PROFESSIONAL STANDARDS:
— Be specific. Not "fees are high" but "PIMCO Total Return A shares carry a 0.85% expense ratio and 3.75% front-end load — the Institutional share class (PTTRX) achieves identical exposure at 0.50%, saving $3,500/yr on a $700K position."
— Quantify everything in both percentage AND dollar terms.  
— If data is incomplete, state your assumption clearly in assumptionsLog and flag confidence accordingly.
— Never hedge excessively. Give a clear verdict on each holding.
— Think like a forensic accountant, not a salesperson.`;

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
const fmt$ = (n, decimals = 0) => {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(decimals)}`;
};
const fmtPct = (n) => (n !== undefined && n !== null ? `${Number(n).toFixed(2)}%` : "—");
const fmtBps = (n) => (n !== undefined && n !== null ? `${Math.round(n * 100)} bps` : "—");

const riskColor = (s) => {
  if (s <= 20) return "#34d399";
  if (s <= 40) return "#86efac";
  if (s <= 55) return "#fbbf24";
  if (s <= 70) return "#fb923c";
  if (s <= 85) return "#f87171";
  return "#ef4444";
};

const priorityMeta = {
  "P1-Critical": { bg: "#ef444418", border: "#ef4444", text: "#fca5a5", dot: "#ef4444" },
  "P2-High":     { bg: "#f9731618", border: "#f97316", text: "#fdba74", dot: "#f97316" },
  "P3-Medium":   { bg: "#eab30818", border: "#eab308", text: "#fde047", dot: "#eab308" },
  "P4-Low":      { bg: "#22c55e18", border: "#22c55e", text: "#86efac", dot: "#22c55e" },
};

const severityMeta = {
  Critical: { color: "#ef4444" },
  High:     { color: "#f97316" },
  Medium:   { color: "#eab308" },
  Low:      { color: "#22c55e" },
};

const gradeColor = (g) => {
  if (!g) return "#6b7280";
  if (g === "A") return "#34d399";
  if (g === "B") return "#86efac";
  if (g === "C") return "#fbbf24";
  if (g === "D") return "#fb923c";
  return "#ef4444";
};

// ─────────────────────────────────────────────────────────────
//  SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────
const RiskArc = ({ score, size = 140 }) => {
  const cx = size / 2, cy = size * 0.72;
  const r = size * 0.42;
  const angle = (score / 100) * Math.PI;
  const needleX = cx + r * 0.82 * Math.cos(Math.PI - angle);
  const needleY = cy - r * 0.82 * Math.sin(angle);
  const color = riskColor(score);
  const trackD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`}>
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#34d399" />
          <stop offset="30%"  stopColor="#fbbf24" />
          <stop offset="65%"  stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <path d={trackD} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size * 0.09} strokeLinecap="round" />
      <path d={trackD} fill="none" stroke="url(#arcGrad)" strokeWidth={size * 0.07} strokeLinecap="round"
        strokeDasharray={`${(score / 100) * Math.PI * r} ${Math.PI * r}`} />
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={size * 0.045} fill={color} />
      <text x={cx} y={cy - size * 0.12} textAnchor="middle" fill="white"
        fontSize={size * 0.2} fontWeight="700" fontFamily="'Syne', sans-serif">{score}</text>
    </svg>
  );
};

const ScoreRing = ({ value, max = 100, color, size = 60, label }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / max) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
        <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize={size * 0.22} fontWeight="700" fontFamily="'Syne', sans-serif">{value}</text>
      </svg>
      {label && <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", fontFamily: "'Space Mono', monospace", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>{label}</div>}
    </div>
  );
};

const Pill = ({ text, color = "rgba(255,255,255,0.12)", textColor = "rgba(255,255,255,0.6)" }) => (
  <span style={{ padding: "2px 9px", borderRadius: "100px", background: color, color: textColor,
    fontSize: "10px", fontFamily: "'Space Mono', monospace", fontWeight: 600, whiteSpace: "nowrap" }}>
    {text}
  </span>
);

const SectionHead = ({ label, count }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
    <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
    <span style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase",
      color: "rgba(255,255,255,0.3)", fontFamily: "'Space Mono', monospace" }}>{label}</span>
    {count !== undefined && <span style={{ padding: "1px 7px", borderRadius: "100px", background: "rgba(255,255,255,0.06)",
      fontSize: "10px", color: "rgba(255,255,255,0.35)", fontFamily: "'Space Mono', monospace" }}>{count}</span>}
    <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
  </div>
);

const StatBox = ({ label, value, sub, highlight, accent = "#c8a96e" }) => (
  <div style={{ padding: "20px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "12px", borderTop: `2px solid ${highlight ? accent : "rgba(255,255,255,0.1)"}`,
    transition: "border-color 0.2s" }}>
    <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase",
      color: "rgba(255,255,255,0.35)", fontFamily: "'Space Mono', monospace", marginBottom: "8px" }}>{label}</div>
    <div style={{ fontSize: "22px", fontWeight: 700, fontFamily: "'Syne', sans-serif",
      color: highlight ? accent : "white", lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "5px",
      fontFamily: "'Space Mono', monospace" }}>{sub}</div>}
  </div>
);

// ─────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function FamilyOfficeAudit() {
  const [stage, setStage]           = useState("landing");   // landing | input | analyzing | results
  const [inputMode, setInputMode]   = useState("text");
  const [textInput, setTextInput]   = useState("");
  const [files, setFiles]           = useState([]);
  const [filePayloads, setFilePayloads] = useState([]);
  const [report, setReport]         = useState(null);
  const [error, setError]           = useState(null);
  const [progress, setProgress]     = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [activeTab, setActiveTab]   = useState("summary");
  const [hoveredHolding, setHoveredHolding] = useState(null);
  const fileRef = useRef();
  const progressMessages = [
    "Scanning fee structures…",
    "Profiling risk exposure…",
    "Calculating tax drag…",
    "Detecting redundancies…",
    "Running benchmark comparisons…",
    "Flagging governance issues…",
    "Synthesizing recommendations…",
    "Finalizing audit report…",
  ];

  // ── FILE HANDLING (fully async, awaitable) ────────────────
  const readFileAsB64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve({ name: file.name, type: file.type, b64: e.target.result.split(",")[1] });
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

  const processFiles = async (fileList) => {
    const arr = Array.from(fileList);
    setFiles(arr);
    try {
      const payloads = await Promise.all(arr.map(readFileAsB64));
      setFilePayloads(payloads);
    } catch (e) { setError(e.message); }
  };

  const onDrop = useCallback(e => {
    e.preventDefault();
    processFiles(e.dataTransfer.files);
  }, []);

  // ── BULLETPROOF JSON EXTRACTOR ────────────────────────────
  const extractJSON = (raw) => {
    if (!raw || typeof raw !== "string") return null;
    // Strip markdown fences
    let s = raw.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/m, "").trim();
    const start = s.indexOf("{");
    if (start === -1) return null;
    s = s.slice(start);
    // 1) Try direct parse
    try { return JSON.parse(s); } catch (_) {}
    // 2) Find balanced end
    let depth = 0, inStr = false, esc = false, endIdx = -1;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (esc) { esc = false; continue; }
      if (c === "\\" && inStr) { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === "{") depth++;
      else if (c === "}") { depth--; if (depth === 0) { endIdx = i; break; } }
    }
    if (endIdx !== -1) { try { return JSON.parse(s.slice(0, endIdx + 1)); } catch (_) {} }
    // 3) Auto-repair
    let out = "", stk = [], iS = false, iE = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (iE) { out += c; iE = false; continue; }
      if (c === "\\" && iS) { out += c; iE = true; continue; }
      if (c === '"') { iS = !iS; out += c; continue; }
      if (iS) { out += c; continue; }
      if (c === "{" || c === "[") { stk.push(c === "{" ? "}" : "]"); out += c; }
      else if (c === "}" || c === "]") { if (stk.length) stk.pop(); out += c; }
      else out += c;
    }
    if (iS) out += '"';
    out = out.replace(/,(\s*)([}\]])/g, "$1$2").replace(/,\s*$/, "");
    while (stk.length) out += stk.pop();
    try { return JSON.parse(out); } catch (_) { return null; }
  };

  // ─────────────────────────────────────────────────────────────
  //  API HELPERS
  // ─────────────────────────────────────────────────────────────
  const JSON_SYS = "You are a JSON-only API. Output ONLY a valid JSON object. No markdown fences, no explanation, no text before or after the JSON. Begin your response with { and end with }.";

  const post = async (system, userContent, maxTokens) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: userContent }],
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || `HTTP ${res.status}`);
    const text = data.content?.find(b => b.type === "text")?.text || "";
    // If truncated, do one continuation pass automatically
    if (data.stop_reason === "max_tokens" && text) {
      const res2 = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: Math.min(maxTokens, 3000),
          system,
          messages: [
            { role: "user",      content: userContent },
            { role: "assistant", content: text },
            { role: "user",      content: "Continue the JSON from exactly where you stopped. Output only the remaining JSON needed to close all open arrays and objects. No preamble." },
          ],
        }),
      });
      const data2 = await res2.json();
      const text2 = data2.content?.find(b => b.type === "text")?.text || "";
      return { text: text + text2, stop_reason: data2.stop_reason };
    }
    return { text, stop_reason: data.stop_reason };
  };

  const parseOrThrow = (raw, label) => {
    const result = extractJSON(raw);
    if (!result) throw new Error(`Parse failed on ${label}. Raw starts: ${raw.slice(0, 120)}`);
    return result;
  };

  // ─────────────────────────────────────────────────────────────
  //  NORMALIZE — every field guaranteed safe for rendering
  // ─────────────────────────────────────────────────────────────
  const normalizeReport = (p) => {
    const num = (v) => (typeof v === "number" && isFinite(v)) ? v : 0;
    const arr = (v) => Array.isArray(v) ? v : [];
    const obj = (v) => (v && typeof v === "object" && !Array.isArray(v)) ? v : {};

    const out = {
      auditMeta: {
        auditDate: "", analystNote: "Audit complete.", dataConfidence: "Medium", assumptionsLog: [],
        ...obj(p.auditMeta),
      },
      portfolioSummary: {
        totalAUM: 0, totalPositions: 0, healthScore: 50, healthLabel: "Fair", headline: "Portfolio analyzed.",
        ...obj(p.portfolioSummary),
        totalAUM: num(obj(p.portfolioSummary).totalAUM),
        healthScore: num(obj(p.portfolioSummary).healthScore) || 50,
      },
      costAudit: {
        totalFeeDollarsAnnual: 0, totalFeePctWeightedAvg: 0, taxDragDollarsAnnual: 0,
        taxDragPctWeightedAvg: 0, hardDollarCostsAnnual: 0, allInCostDollarsAnnual: 0,
        allInCostPctAnnual: 0, vsInstitutionalAveragePct: 0, vsRetailAveragePct: 0,
        potentialSavingsDollarsAnnual: 0, feePercentileRank: 50,
        costBreakdown: [], taxOptimization: { harvestingOpportunities: [], assetLocationFixes: [], vehicleOptimizations: [], estimatedTaxSavings: 0 },
        ...obj(p.costAudit),
      },
      riskAudit: {
        portfolioRiskScore: 50, portfolioRiskLabel: "Moderate", weightedAvgRisk: 50,
        correlationAdjustedRisk: 50, durationRisk: "", currencyRisk: "", tailRiskNarrative: "",
        concentrationRisk: { score: 5, topHolding: "", topHoldingPct: 0, narrativ: "" },
        liquidityRisk: { illiquidPct: 0, score: 3, narrative: "" },
        ...obj(p.riskAudit),
      },
      redundancies: arr(p.redundancies),
      recommendations: arr(p.recommendations),
      executiveSummary: {
        strengthsFound: [], criticalWeaknesses: [], thirtyDayActionPlan: [], ninetyDayRoadmap: [],
        estimatedTotalImprovementDollars: 0, closingStatement: "",
        ...obj(p.executiveSummary),
      },
      holdings: arr(p.holdings).map((h, i) => {
        const hobj = obj(h);
        const fees = obj(hobj.fees);
        const risk = obj(hobj.risk);
        const tax  = obj(hobj.taxAnalysis);
        const liq  = obj(hobj.liquidity);
        const bench= obj(hobj.benchmarkComparison);
        return {
          id: hobj.id || `H${String(i+1).padStart(2,"0")}`,
          name: hobj.name || "Unknown Holding",
          ticker: hobj.ticker || null,
          assetClass: hobj.assetClass || "Unknown",
          subType: hobj.subType || "",
          accountType: hobj.accountType || "Unknown",
          marketValue: num(hobj.marketValue),
          allocationPct: num(hobj.allocationPct),
          fees: {
            expenseRatioPct: num(fees.expenseRatioPct),
            managementFeePct: num(fees.managementFeePct),
            performanceFeePct: num(fees.performanceFeePct),
            otherFeesPct: num(fees.otherFeesPct),
            totalAnnualFeePct: num(fees.totalAnnualFeePct),
            totalAnnualFeeDollars: num(fees.totalAnnualFeeDollars),
            vsVanguardBenchmarkPct: num(fees.vsVanguardBenchmarkPct),
            feeGradeLetter: fees.feeGradeLetter || "C",
            feeNarrative: fees.feeNarrative || "",
          },
          risk: {
            score: Math.min(100, Math.max(1, num(risk.score) || 50)),
            label: risk.label || "Moderate",
            drivers: arr(risk.drivers),
            flags: arr(risk.flags),
          },
          taxAnalysis: {
            dragEstimatePct: num(tax.dragEstimatePct),
            dragEstimateDollars: num(tax.dragEstimateDollars),
            dividendDragPct: num(tax.dividendDragPct),
            turnoverDragPct: num(tax.turnoverDragPct),
            accountFitScore: num(tax.accountFitScore) || 5,
            accountFitVerdict: tax.accountFitVerdict || "Unknown",
            taxNotes: tax.taxNotes || "",
          },
          liquidity: { rating: liq.rating || "Daily", lockupPeriod: liq.lockupPeriod || null, redemptionTerms: liq.redemptionTerms || null },
          qualityFlags: arr(hobj.qualityFlags),
          benchmarkComparison: {
            suggestedBenchmark: bench.suggestedBenchmark || "",
            excessCostVsBenchmarkPct: num(bench.excessCostVsBenchmarkPct),
            excessCostVsBenchmarkDollars: num(bench.excessCostVsBenchmarkDollars),
          },
        };
      }),
    };

    // Ensure nested objects inside costAudit/riskAudit are clean
    out.costAudit.costBreakdown = arr(out.costAudit.costBreakdown);
    out.costAudit.taxOptimization = {
      harvestingOpportunities: [], assetLocationFixes: [], vehicleOptimizations: [], estimatedTaxSavings: 0,
      ...obj(out.costAudit.taxOptimization),
    };
    out.riskAudit.concentrationRisk = { score: 5, topHolding: "", topHoldingPct: 0, narrativ: "", ...obj(out.riskAudit.concentrationRisk) };
    out.riskAudit.liquidityRisk     = { illiquidPct: 0, score: 3, narrative: "", ...obj(out.riskAudit.liquidityRisk) };
    return out;
  };

  // ─────────────────────────────────────────────────────────────
  //  MAIN AUDIT — 3 focused calls, each with small output budget
  // ─────────────────────────────────────────────────────────────
  // ── Parse a JSON array robustly ──────────────────────────
  const parseArray = (raw) => {
    if (!raw) return [];
    let s = raw.trim().replace(/^```(?:json)?\s*/im,"").replace(/\s*```$/m,"").trim();
    // If wrapped in object, unwrap
    if (s.startsWith("{")) {
      const obj = extractJSON(s);
      if (obj) {
        const arrKey = Object.keys(obj).find(k => Array.isArray(obj[k]));
        if (arrKey) return obj[arrKey];
      }
    }
    // Find [ ... ] boundaries
    const start = s.indexOf("[");
    if (start === -1) return [];
    s = s.slice(start);
    // Try direct
    try { const r = JSON.parse(s); if (Array.isArray(r)) return r; } catch(_) {}
    // Find balanced end
    let depth=0, inStr=false, esc=false, end=-1;
    for (let i=0;i<s.length;i++){
      const c=s[i];
      if(esc){esc=false;continue;}
      if(c==="\\"&&inStr){esc=true;continue;}
      if(c==='"'){inStr=!inStr;continue;}
      if(inStr)continue;
      if(c==="["||c==="{")depth++;
      else if(c==="]"||c==="}"){depth--;if(depth===0){end=i;break;}}
    }
    if(end!==-1){try{const r=JSON.parse(s.slice(0,end+1));if(Array.isArray(r))return r;}catch(_){}}
    // Repair
    let out="",stk=[],iS=false,iE=false;
    for(let i=0;i<s.length;i++){
      const c=s[i];
      if(iE){out+=c;iE=false;continue;}
      if(c==="\\"&&iS){out+=c;iE=true;continue;}
      if(c==='"'){iS=!iS;out+=c;continue;}
      if(iS){out+=c;continue;}
      if(c==="["||c==="{"){stk.push(c==="["?"]":"}");out+=c;}
      else if(c==="]"||c==="}"){if(stk.length)stk.pop();out+=c;}
      else out+=c;
    }
    if(iS)out+='"';
    out=out.replace(/,(\s*)([}\]])/g,"$1$2").replace(/,\s*$/,"");
    while(stk.length)out+=stk.pop();
    try{const r=JSON.parse(out);if(Array.isArray(r))return r;}catch(_){}
    return [];
  };

  // ── Analyze ONE holding via API ───────────────────────────
  const analyzeOneholding = async (holdingText, idx, totalAUM) => {
    const HOLDING_SYS = "You are a JSON-only API. Output ONLY one valid JSON object. No arrays, no markdown, no explanation. Start with { end with }.";
    const prompt = `Analyze this single investment holding and return ONE JSON object.
All strings max 60 chars. Numbers must be actual numbers.
Risk 1-100: Cash=8,ShortBond=22,IntBond=30,LargeCap=45,SmallCap=58,HY=62,REIT=60,Intl=50,EM=70,HF=82,PE=85
Fee grade: A<0.10%,B<0.30%,C<0.60%,D<1.00%,F>=1.00%
Tax drag=(divYield×0.238)+(turnover×gain×0.37)

HOLDING DATA: ${holdingText}
TOTAL PORTFOLIO AUM: $${totalAUM}

Return this exact shape:
{"id":"H${String(idx+1).padStart(2,"0")}","name":"","ticker":null,"assetClass":"","subType":"","accountType":"","marketValue":0,"allocationPct":0,"fees":{"expenseRatioPct":0,"managementFeePct":0,"performanceFeePct":0,"otherFeesPct":0,"totalAnnualFeePct":0,"totalAnnualFeeDollars":0,"vsVanguardBenchmarkPct":0,"feeGradeLetter":"C","feeNarrative":""},"risk":{"score":50,"label":"Moderate","drivers":[],"flags":[]},"taxAnalysis":{"dragEstimatePct":0,"dragEstimateDollars":0,"dividendDragPct":0,"turnoverDragPct":0,"accountFitScore":5,"accountFitVerdict":"Acceptable","taxNotes":""},"liquidity":{"rating":"Daily","lockupPeriod":null,"redemptionTerms":null},"qualityFlags":[],"benchmarkComparison":{"suggestedBenchmark":"","excessCostVsBenchmarkPct":0,"excessCostVsBenchmarkDollars":0}}`;

    const r = await post(HOLDING_SYS, prompt, 1200);
    return extractJSON(r.text) || {
      id: `H${String(idx+1).padStart(2,"0")}`, name: holdingText.split("\n")[0].slice(0,60),
      ticker:null,assetClass:"Unknown",subType:"",accountType:"Unknown",
      marketValue:0,allocationPct:0,
      fees:{expenseRatioPct:0,managementFeePct:0,performanceFeePct:0,otherFeesPct:0,totalAnnualFeePct:0,totalAnnualFeeDollars:0,vsVanguardBenchmarkPct:0,feeGradeLetter:"C",feeNarrative:""},
      risk:{score:50,label:"Moderate",drivers:[],flags:[]},
      taxAnalysis:{dragEstimatePct:0,dragEstimateDollars:0,dividendDragPct:0,turnoverDragPct:0,accountFitScore:5,accountFitVerdict:"Unknown",taxNotes:""},
      liquidity:{rating:"Daily",lockupPeriod:null,redemptionTerms:null},
      qualityFlags:[],benchmarkComparison:{suggestedBenchmark:"",excessCostVsBenchmarkPct:0,excessCostVsBenchmarkDollars:0}
    };
  };

  const runAudit = async () => {
    setStage("analyzing");
    setProgress(0);
    setError(null);
    let msgIdx = 0;
    setProgressMsg(progressMessages[0]);
    const ticker = setInterval(() => {
      setProgress(p => {
        const next = Math.min(p + (Math.random() * 2.5 + 0.8), 91);
        const idx  = Math.min(Math.floor((next/91)*progressMessages.length), progressMessages.length-1);
        if (idx!==msgIdx){msgIdx=idx;setProgressMsg(progressMessages[idx]);}
        return next;
      });
    }, 900);

    try {
      // ── STEP 1: Ensure files ready ─────────────────────────
      let freshPayloads = filePayloads;
      if (inputMode==="upload" && files.length>0 && filePayloads.length===0) {
        freshPayloads = await Promise.all(files.map(readFileAsB64));
        setFilePayloads(freshPayloads);
      }

      // ── STEP 2: Extract plain text ─────────────────────────
      let portfolioText = textInput.trim();

      if (inputMode==="upload" && freshPayloads.length>0) {
        setProgressMsg("Reading document…");
        const docBlocks = freshPayloads.map(fp => {
          const isPDF = fp.type==="application/pdf"||(fp.name||"").toLowerCase().endsWith(".pdf");
          return isPDF
            ? {type:"document",source:{type:"base64",media_type:"application/pdf",data:fp.b64}}
            : {type:"image",source:{type:"base64",media_type:fp.type||"image/png",data:fp.b64}};
        });
        const r1 = await post(
          "You extract financial data from documents. Output plain numbered text only. No JSON, no markdown.",
          [...docBlocks, {type:"text",text:`List every investment holding in this statement as a numbered list.
For each item on a separate line include: name, ticker symbol, current market value in dollars, number of shares, asset class, expense ratio percentage, and account type.
Also include at the top: total portfolio value, statement date, account owner name.
Include EVERY holding. Do not skip any.`}],
          4000
        );
        if (!r1.text.trim()) throw new Error("Document unreadable. Try a clearer file or Manual Entry mode.");
        portfolioText = r1.text + (textInput.trim() ? `\n\nUSER NOTES: ${textInput.trim()}` : "");
      }

      if (!portfolioText.trim()) throw new Error("No portfolio data. Please upload a statement or use Manual Entry.");

      // ── STEP 3: Parse holding list into individual chunks ──
      // Ask model to return a simple list of holdings as JSON names only
      setProgressMsg("Identifying holdings…");
      const listPrompt = `From the portfolio data below, return ONLY a JSON array of strings.
Each string = one holding's name and key data on a single line, max 120 chars.
Format each as: "Name (TICKER): $VALUE, TYPE, EXPENSE_RATIO%"
Include every holding. No markdown, no object wrapper — just a plain JSON array of strings.

Portfolio data:
${portfolioText}`;

      const rList = await post(
        "You are a JSON-only API. Output ONLY a JSON array of strings. Start with [ end with ].",
        listPrompt,
        2000
      );

      let holdingLines = parseArray(rList.text);
      // Fallback: split portfolio text by line if list parse failed
      if (holdingLines.length === 0) {
        holdingLines = portfolioText
          .split("\n")
          .map(l=>l.trim())
          .filter(l=>l.length>10 && /\$|%|\d/.test(l))
          .slice(0,30);
      }
      if (holdingLines.length === 0) throw new Error("Could not identify holdings. Please use Manual Entry mode.");

      // Estimate total AUM from text
      const aumMatch = portfolioText.match(/total[^$]*\$?([\d,]+)/i);
      const estimatedAUM = aumMatch ? parseFloat(aumMatch[1].replace(/,/g,"")) : 0;

      // ── STEP 4: Analyze each holding individually ──────────
      // Each call = 1 holding = ~1200 tokens max output = NEVER truncates
      setProgressMsg(`Analyzing ${holdingLines.length} holdings…`);
      const holdings = [];
      for (let i=0; i<holdingLines.length; i++) {
        setProgressMsg(`Analyzing holding ${i+1} of ${holdingLines.length}…`);
        const h = await analyzeOneholding(holdingLines[i], i, estimatedAUM);
        holdings.push(h);
      }

      // ── STEP 5: Portfolio-level analysis ───────────────────
      setProgressMsg("Computing portfolio analysis…");
      const totalAUM = holdings.reduce((s,h)=>s+(Number(h.marketValue)||0),0)||estimatedAUM;
      
      // Recalculate allocationPct now that we have all values
      if (totalAUM>0) {
        holdings.forEach(h=>{
          if (!h.allocationPct && h.marketValue) h.allocationPct=+(((h.marketValue/totalAUM)*100).toFixed(2));
        });
      }

      const holdingsSummary = holdings.map((h,i)=>
        `H${String(i+1).padStart(2,"0")} ${h.name}: $${h.marketValue} (${h.allocationPct}%), `+
        `fee ${h.fees?.totalAnnualFeePct||0}%, risk ${h.risk?.score||50}, taxDrag ${h.taxAnalysis?.dragEstimatePct||0}%, `+
        `class ${h.assetClass}, account ${h.accountType}`
      ).join("\n");

      const analysisPrompt = `You are a senior family office CIO. Analyze this portfolio and return a JSON audit report.
Output ONLY the JSON object. No markdown. All strings max 90 chars.

PORTFOLIO STATS:
Total AUM: $${totalAUM.toLocaleString()}
Holdings: ${holdings.length}

HOLDINGS:
${holdingsSummary}

Return this exact JSON structure (fill all fields with real calculated values):
{"auditMeta":{"auditDate":"${new Date().toISOString().split("T")[0]}","analystNote":"","dataConfidence":"Medium","assumptionsLog":[]},"portfolioSummary":{"totalAUM":${totalAUM},"totalPositions":${holdings.length},"healthScore":0,"healthLabel":"","headline":""},"costAudit":{"totalFeeDollarsAnnual":0,"totalFeePctWeightedAvg":0,"taxDragDollarsAnnual":0,"taxDragPctWeightedAvg":0,"hardDollarCostsAnnual":0,"allInCostDollarsAnnual":0,"allInCostPctAnnual":0,"vsInstitutionalAveragePct":0,"vsRetailAveragePct":0,"potentialSavingsDollarsAnnual":0,"feePercentileRank":0,"costBreakdown":[{"category":"","dollars":0,"pct":0}],"taxOptimization":{"harvestingOpportunities":[],"assetLocationFixes":[],"vehicleOptimizations":[],"estimatedTaxSavings":0}},"riskAudit":{"portfolioRiskScore":0,"portfolioRiskLabel":"","weightedAvgRisk":0,"correlationAdjustedRisk":0,"concentrationRisk":{"score":0,"topHolding":"","topHoldingPct":0,"narrativ":""},"liquidityRisk":{"illiquidPct":0,"score":0,"narrative":""},"durationRisk":"","currencyRisk":"","tailRiskNarrative":""},"redundancies":[{"id":"R01","type":"","severity":"High","affectedHoldings":[],"affectedNames":[],"description":"","overlapEstimatePct":0,"annualWasteDollars":0,"recommendation":""}],"recommendations":[{"id":"REC01","priority":"P1-Critical","category":"","finding":"","action":"","rationale":"","estimatedAnnualImpactDollars":0,"effort":"Quick Win","affectedHoldingIds":[]}],"executiveSummary":{"strengthsFound":[],"criticalWeaknesses":[],"thirtyDayActionPlan":[],"ninetyDayRoadmap":[],"estimatedTotalImprovementDollars":0,"closingStatement":""}}`;

      const rB = await post(JSON_SYS, analysisPrompt, 3500);
      const analysis = extractJSON(rB.text) || {};

      const fullReport = normalizeReport({ ...analysis, holdings });

      clearInterval(ticker);
      setProgress(100);
      setProgressMsg("Complete.");
      setReport(fullReport);
      setTimeout(()=>{setStage("results");setActiveTab("summary");},400);

    } catch(err) {
      clearInterval(ticker);
      setError(err.message||"Analysis failed. Please try again.");
      setStage("input");
    }
  };

  // ─────────────────────────────────────────────────────────────
  //  STYLES
  // ─────────────────────────────────────────────────────────────
  const GOLD = "#c8a96e";
  const GOLD2 = "#e8c98e";
  const BG = "#09090b";
  const PANEL = "rgba(255,255,255,0.025)";
  const BORDER = "rgba(255,255,255,0.08)";

  const base = {
    minHeight: "100vh", background: BG, color: "white",
    fontFamily: "'DM Sans', sans-serif", position: "relative", overflowX: "hidden",
  };

  // ─────────────────────────────────────────────────────────────
  //  LANDING
  // ─────────────────────────────────────────────────────────────
  if (stage === "landing") return (
    <div style={base}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(200,169,110,0.3); border-radius: 2px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
        .feature-card:hover { border-color: rgba(200,169,110,0.3) !important; background: rgba(200,169,110,0.05) !important; }
        .cta-btn:hover { background: linear-gradient(135deg, #e8c98e, #b8891e) !important; transform: translateY(-1px); box-shadow: 0 12px 40px rgba(200,169,110,0.25); }
      `}</style>
      {/* Atmospheric BG */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"-20%", left:"50%", transform:"translateX(-50%)", width:"80vw", height:"60vh",
          background:"radial-gradient(ellipse, rgba(200,169,110,0.09) 0%, transparent 70%)" }} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"40vh",
          background:"radial-gradient(ellipse at 50% 100%, rgba(200,169,110,0.04) 0%, transparent 70%)" }} />
        {/* Grid */}
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.04 }}>
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div style={{ maxWidth:"960px", margin:"0 auto", padding:"80px 32px 100px", position:"relative" }}>
        {/* Badge */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:"40px", animation:"fadeUp 0.5s ease both" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"10px", padding:"7px 20px",
            border:`1px solid ${GOLD}40`, borderRadius:"100px", background:`${GOLD}0a` }}>
            <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:GOLD, animation:"shimmer 2s ease infinite" }} />
            <span style={{ fontSize:"10px", letterSpacing:"0.25em", textTransform:"uppercase",
              color:GOLD, fontFamily:"'Space Mono', monospace", fontWeight:700 }}>
              Institutional-Grade Portfolio Intelligence
            </span>
          </div>
        </div>

        {/* Hero */}
        <h1 style={{ fontSize:"clamp(42px, 7vw, 80px)", fontFamily:"'Syne', sans-serif", fontWeight:800,
          lineHeight:1.0, textAlign:"center", letterSpacing:"-0.02em", marginBottom:"24px",
          animation:"fadeUp 0.6s 0.1s ease both", opacity:0, animationFillMode:"forwards" }}>
          Family Office<br />
          <span style={{ background:`linear-gradient(135deg, ${GOLD}, ${GOLD2})`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Audit Calculator
          </span>
        </h1>

        <p style={{ textAlign:"center", fontSize:"17px", lineHeight:1.75, color:"rgba(255,255,255,0.45)",
          maxWidth:"580px", margin:"0 auto 56px", animation:"fadeUp 0.6s 0.2s ease both",
          opacity:0, animationFillMode:"forwards" }}>
          Upload investment statements or enter portfolio data. Our AI conducts a forensic audit — 
          fee stacks, tax drag, risk scoring, redundancy detection, and fiduciary-grade recommendations.
        </p>

        {/* Feature Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:"14px",
          marginBottom:"52px", animation:"fadeUp 0.6s 0.3s ease both", opacity:0, animationFillMode:"forwards" }}>
          {[
            { icon:"◈", title:"Fee Forensics", desc:"Expense ratios, loads, layered advisor fees, hidden revenue sharing — quantified to the dollar." },
            { icon:"◎", title:"Risk Scoring", desc:"Precise 1–100 score per holding and portfolio-wide. Concentration, duration, liquidity, currency." },
            { icon:"◊", title:"Tax Drag Analysis", desc:"Dividend drag, turnover tax cost, K-1 complexity, asset location mismatch — all quantified annually." },
            { icon:"⊡", title:"Redundancy Detection", desc:"Identifies overlapping holdings, style duplication, factor double-counting, and benchmark hugging." },
          ].map(f => (
            <div key={f.title} className="feature-card" style={{ padding:"24px 20px",
              background:PANEL, border:`1px solid ${BORDER}`, borderRadius:"14px", transition:"all 0.2s", cursor:"default" }}>
              <div style={{ fontSize:"24px", marginBottom:"12px", color:GOLD }}>{f.icon}</div>
              <div style={{ fontSize:"13px", fontWeight:700, fontFamily:"'Syne', sans-serif",
                marginBottom:"8px", color:"rgba(255,255,255,0.85)" }}>{f.title}</div>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.38)", lineHeight:1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display:"flex", justifyContent:"center", gap:"16px", flexWrap:"wrap",
          animation:"fadeUp 0.6s 0.4s ease both", opacity:0, animationFillMode:"forwards" }}>
          <button className="cta-btn" onClick={() => setStage("input")}
            style={{ padding:"16px 44px", background:`linear-gradient(135deg, ${GOLD}, #a87820)`,
              border:"none", borderRadius:"10px", color:"#09090b", fontSize:"14px",
              fontWeight:700, fontFamily:"'Syne', sans-serif", letterSpacing:"0.04em",
              cursor:"pointer", transition:"all 0.2s" }}>
            Begin Audit →
          </button>
        </div>

        {/* Compliance Note */}
        <p style={{ textAlign:"center", fontSize:"11px", color:"rgba(255,255,255,0.2)",
          marginTop:"48px", fontFamily:"'Space Mono', monospace", lineHeight:1.7,
          animation:"fadeUp 0.6s 0.5s ease both", opacity:0, animationFillMode:"forwards" }}>
          FOR INFORMATIONAL PURPOSES ONLY · NOT INVESTMENT ADVICE · CONSULT A REGISTERED INVESTMENT ADVISOR
        </p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  //  INPUT
  // ─────────────────────────────────────────────────────────────
  if (stage === "input") return (
    <div style={base}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:rgba(200,169,110,0.3); border-radius:2px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .drop-zone:hover { border-color: rgba(200,169,110,0.5) !important; background: rgba(200,169,110,0.04) !important; }
        .run-btn:not(:disabled):hover { transform:translateY(-1px); box-shadow:0 10px 40px rgba(200,169,110,0.3); }
        .tab-pill:hover { color: rgba(255,255,255,0.7) !important; }
        textarea:focus { outline:none; }
        textarea::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 60% 40% at 50% 0%, rgba(200,169,110,0.08) 0%, transparent 70%)", pointerEvents:"none" }} />

      <div style={{ maxWidth:"760px", margin:"0 auto", padding:"48px 24px 80px", position:"relative" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"44px", animation:"fadeUp 0.4s ease both" }}>
          <button onClick={() => setStage("landing")} style={{ background:"none", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", color:"rgba(255,255,255,0.4)", padding:"8px 14px", cursor:"pointer", fontSize:"11px", fontFamily:"'Space Mono', monospace" }}>← Back</button>
          <div>
            <div style={{ fontSize:"11px", color:GOLD, fontFamily:"'Space Mono', monospace", letterSpacing:"0.15em", textTransform:"uppercase" }}>Step 1 of 1</div>
            <div style={{ fontSize:"20px", fontFamily:"'Syne', sans-serif", fontWeight:700, marginTop:"2px" }}>Portfolio Data Input</div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:"10px", padding:"4px", marginBottom:"24px", animation:"fadeUp 0.4s 0.05s ease both", opacity:0, animationFillMode:"forwards" }}>
          {[["text","✏  Manual Entry"],["upload","⬆  Upload Statements"]].map(([m, label]) => (
            <button key={m} className="tab-pill" onClick={() => setInputMode(m)} style={{
              flex:1, padding:"11px", border:"none", borderRadius:"7px",
              background: inputMode===m ? `${GOLD}18` : "transparent",
              color: inputMode===m ? GOLD2 : "rgba(255,255,255,0.35)",
              fontFamily:"'Space Mono', monospace", fontSize:"11px",
              letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer",
              transition:"all 0.2s", fontWeight: inputMode===m ? 700 : 400,
              borderBottom: inputMode===m ? `2px solid ${GOLD}` : "2px solid transparent",
            }}>{label}</button>
          ))}
        </div>

        {/* Input Panel */}
        <div style={{ background:PANEL, border:`1px solid ${BORDER}`, borderRadius:"16px", overflow:"hidden",
          marginBottom:"20px", animation:"fadeUp 0.4s 0.1s ease both", opacity:0, animationFillMode:"forwards" }}>
          {inputMode === "text" ? (
            <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
              style={{ width:"100%", minHeight:"320px", background:"transparent", border:"none",
                color:"rgba(255,255,255,0.8)", fontSize:"13px", lineHeight:"1.8", padding:"28px",
                fontFamily:"'Space Mono', monospace", resize:"vertical", display:"block" }}
              placeholder={`Paste investment statement data, fund holdings, or describe your portfolio...\n\nExamples of what to include:\n• Account balances and fund names/tickers\n• Stated expense ratios or management fees\n• Account types (IRA, taxable, trust, foundation)\n• Advisor fee structure (AUM %, flat, hourly)\n• Alternative investments (PE, hedge funds, real estate)\n• Approximate income tax bracket\n• Investment objectives and risk tolerance\n\nThe more detail you provide, the deeper the audit.`} />
          ) : (
            <div className="drop-zone" onDrop={onDrop} onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              style={{ padding:"60px 40px", textAlign:"center", cursor:"pointer",
                border:"none", transition:"all 0.2s", minHeight:"280px",
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px" }}>
              <input ref={fileRef} type="file" multiple accept="image/*,.pdf" style={{ display:"none" }} onChange={e => processFiles(e.target.files)} />
              <div style={{ width:"56px", height:"56px", borderRadius:"14px", background:`${GOLD}18`,
                border:`1px solid ${GOLD}40`, display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"24px" }}>📄</div>
              <div>
                <div style={{ fontSize:"15px", fontWeight:600, color:"rgba(255,255,255,0.7)", marginBottom:"6px" }}>Drop statements here</div>
                <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono', monospace" }}>PDF · PNG · JPG · Brokerage statements · Fund factsheets · Account summaries</div>
              </div>
              {files.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", justifyContent:"center", marginTop:"8px" }}>
                  {files.map((f,i) => (
                    <div key={i} style={{ padding:"5px 14px", background:`${GOLD}15`, border:`1px solid ${GOLD}40`,
                      borderRadius:"6px", fontSize:"11px", fontFamily:"'Space Mono', monospace", color:GOLD2 }}>✓ {f.name}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Optional context */}
        {inputMode === "upload" && files.length > 0 && (
          <div style={{ marginBottom:"20px", animation:"fadeUp 0.3s ease both" }}>
            <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
              style={{ width:"100%", minHeight:"80px", background:PANEL, border:`1px solid ${BORDER}`,
                borderRadius:"12px", color:"rgba(255,255,255,0.6)", fontSize:"12px", lineHeight:"1.7",
                padding:"16px 20px", fontFamily:"'Space Mono', monospace", resize:"none", outline:"none" }}
              placeholder="Optional: Add context (account types, advisor fee, tax bracket, investment goals)…" />
          </div>
        )}

        {error && (
          <div style={{ padding:"14px 18px", background:"#ef444412", border:"1px solid #ef444440",
            borderRadius:"8px", color:"#fca5a5", fontSize:"12px", marginBottom:"18px",
            fontFamily:"'Space Mono', monospace" }}>⚠ {error}</div>
        )}

        <button className="run-btn" onClick={runAudit}
          disabled={inputMode==="text" ? !textInput.trim() : filePayloads.length===0}
          style={{ width:"100%", padding:"18px", background:`linear-gradient(135deg, ${GOLD}, #a87820)`,
            border:"none", borderRadius:"12px", color:"#09090b", fontSize:"13px", fontWeight:700,
            fontFamily:"'Syne', sans-serif", letterSpacing:"0.08em", textTransform:"uppercase",
            cursor:"pointer", transition:"all 0.2s", opacity:(inputMode==="text" ? !textInput.trim() : filePayloads.length===0) ? 0.35 : 1,
            animation:"fadeUp 0.4s 0.15s ease both", animationFillMode:"forwards" }}>
          Run Full Forensic Audit →
        </button>

        <p style={{ textAlign:"center", fontSize:"10px", color:"rgba(255,255,255,0.2)",
          marginTop:"20px", fontFamily:"'Space Mono', monospace", lineHeight:1.7 }}>
          Your data is analyzed in real-time and never stored. · For informational purposes only.
        </p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  //  ANALYZING
  // ─────────────────────────────────────────────────────────────
  if (stage === "analyzing") return (
    <div style={{ ...base, display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(1);} 50%{opacity:0.7;transform:scale(1.04);} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 50% 50% at 50% 50%, rgba(200,169,110,0.08) 0%, transparent 70%)", pointerEvents:"none" }} />
      <div style={{ textAlign:"center", maxWidth:"440px", padding:"40px", position:"relative" }}>
        {/* Spinner */}
        <div style={{ position:"relative", width:"96px", height:"96px", margin:"0 auto 36px" }}>
          <div style={{ position:"absolute", inset:0, border:`2px solid ${GOLD}40`, borderRadius:"50%" }} />
          <div style={{ position:"absolute", inset:0, border:`2px solid transparent`,
            borderTopColor:GOLD, borderRadius:"50%", animation:"spin 1s linear infinite" }} />
          <div style={{ position:"absolute", inset:"12px", border:`1px solid ${GOLD}20`, borderRadius:"50%", animation:"pulse 2s ease infinite" }} />
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"28px" }}>◈</div>
        </div>

        <h2 style={{ fontFamily:"'Syne', sans-serif", fontSize:"28px", fontWeight:800, marginBottom:"10px", color:GOLD2 }}>Auditing Portfolio</h2>
        <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.35)", fontFamily:"'Space Mono', monospace", marginBottom:"40px", lineHeight:1.7, minHeight:"44px" }}>
          {progressMsg}
        </p>

        {/* Progress Bar */}
        <div style={{ height:"3px", background:"rgba(255,255,255,0.07)", borderRadius:"2px", overflow:"hidden", marginBottom:"12px" }}>
          <div style={{ height:"100%", width:`${progress}%`, background:`linear-gradient(90deg, ${GOLD}, ${GOLD2})`,
            borderRadius:"2px", transition:"width 0.5s ease" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          {progressMessages.map((m, i) => (
            <div key={i} style={{ width:"6px", height:"6px", borderRadius:"50%",
              background: progress >= (i/progressMessages.length)*100 ? GOLD : "rgba(255,255,255,0.1)",
              transition:"background 0.4s" }} />
          ))}
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  //  RESULTS
  // ─────────────────────────────────────────────────────────────
  if (stage === "results" && report) {
    const R = report;
    const tabs = [
      { id:"summary",         label:"Executive Summary" },
      { id:"holdings",        label:`Holdings (${R.holdings?.length || 0})` },
      { id:"costs",           label:"Cost Audit" },
      { id:"risk",            label:"Risk Audit" },
      { id:"redundancies",    label:`Redundancies (${R.redundancies?.length || 0})` },
      { id:"recommendations", label:`Recommendations (${R.recommendations?.length || 0})` },
    ];

    const healthColor = R.portfolioSummary?.healthScore >= 75 ? "#34d399"
      : R.portfolioSummary?.healthScore >= 50 ? "#fbbf24"
      : R.portfolioSummary?.healthScore >= 30 ? "#f97316" : "#ef4444";

    return (
      <div style={base}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
          * { box-sizing:border-box; margin:0; padding:0; }
          ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:rgba(200,169,110,0.2); border-radius:2px; }
          @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
          .holding-row:hover { background: rgba(255,255,255,0.045) !important; border-color: rgba(200,169,110,0.2) !important; }
          .tab-item:hover { color: rgba(255,255,255,0.7) !important; }
          .rec-card:hover { border-color: rgba(255,255,255,0.15) !important; }
        `}</style>
        <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 70% 30% at 50% 0%, rgba(200,169,110,0.06) 0%, transparent 60%)", pointerEvents:"none", zIndex:0 }} />

        {/* ── TOPBAR ── */}
        <div style={{ position:"sticky", top:0, zIndex:100, background:"rgba(9,9,11,0.92)", backdropFilter:"blur(20px)",
          borderBottom:`1px solid ${BORDER}`, padding:"0 32px" }}>
          <div style={{ maxWidth:"1400px", margin:"0 auto" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0 0", marginBottom:"14px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
                <button onClick={() => { setStage("input"); setReport(null); }}
                  style={{ background:"none", border:`1px solid ${BORDER}`, borderRadius:"8px",
                    color:"rgba(255,255,255,0.4)", padding:"6px 12px", cursor:"pointer",
                    fontSize:"11px", fontFamily:"'Space Mono', monospace" }}>← New Audit</button>
                <div>
                  <div style={{ fontSize:"10px", color:GOLD, letterSpacing:"0.2em", textTransform:"uppercase",
                    fontFamily:"'Space Mono', monospace" }}>Forensic Audit Report · {R.auditMeta?.auditDate || "Today"}</div>
                  <div style={{ fontSize:"15px", fontFamily:"'Syne', sans-serif", fontWeight:700, marginTop:"2px",
                    color:"rgba(255,255,255,0.85)", maxWidth:"600px" }}>{R.portfolioSummary?.headline}</div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"20px" }}>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono', monospace", letterSpacing:"0.1em" }}>HEALTH SCORE</div>
                  <div style={{ fontSize:"28px", fontFamily:"'Syne', sans-serif", fontWeight:800, color:healthColor, lineHeight:1 }}>
                    {R.portfolioSummary?.healthScore}<span style={{ fontSize:"14px", opacity:0.5 }}>/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display:"flex", gap:"0", overflowX:"auto" }}>
              {tabs.map(t => (
                <button key={t.id} className="tab-item" onClick={() => setActiveTab(t.id)} style={{
                  padding:"10px 18px", background:"none", border:"none", cursor:"pointer",
                  fontSize:"11px", fontFamily:"'Space Mono', monospace", letterSpacing:"0.06em",
                  color: activeTab===t.id ? GOLD2 : "rgba(255,255,255,0.35)",
                  borderBottom: activeTab===t.id ? `2px solid ${GOLD}` : "2px solid transparent",
                  transition:"all 0.15s", whiteSpace:"nowrap", fontWeight: activeTab===t.id ? 700 : 400,
                }}>{t.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth:"1400px", margin:"0 auto", padding:"32px 32px 100px", position:"relative", zIndex:1 }}>

          {/* ══════════ EXECUTIVE SUMMARY ══════════ */}
          {activeTab === "summary" && (
            <div style={{ animation:"fadeUp 0.4s ease both" }}>
              {/* KPI Row */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:"14px", marginBottom:"32px" }}>
                <StatBox label="Total AUM" value={fmt$(R.portfolioSummary?.totalAUM)} sub={`${R.portfolioSummary?.totalPositions} positions`} highlight />
                <StatBox label="All-In Annual Cost" value={fmt$(R.costAudit?.allInCostDollarsAnnual)} sub={fmtBps(R.costAudit?.allInCostPctAnnual)} highlight accent="#ef4444" />
                <StatBox label="Annual Tax Drag" value={fmt$(R.costAudit?.taxDragDollarsAnnual)} sub={fmtPct(R.costAudit?.taxDragPctWeightedAvg)} highlight accent="#f97316" />
                <StatBox label="Potential Savings" value={fmt$(R.costAudit?.potentialSavingsDollarsAnnual)} sub="if optimized" highlight accent="#34d399" />
                <StatBox label="Portfolio Risk" value={`${R.riskAudit?.portfolioRiskScore}/100`} sub={R.riskAudit?.portfolioRiskLabel} highlight accent={riskColor(R.riskAudit?.portfolioRiskScore || 50)} />
                <StatBox label="Fee Percentile" value={`${R.costAudit?.feePercentileRank}th`} sub="vs peers (lower = better)" highlight accent={R.costAudit?.feePercentileRank > 60 ? "#ef4444" : "#34d399"} />
              </div>

              {/* 2-col layout */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px", marginBottom:"24px" }}>
                {/* Analyst Note */}
                <div style={{ padding:"28px", background:PANEL, border:`1px solid ${BORDER}`, borderRadius:"14px",
                  borderLeft:`3px solid ${GOLD}` }}>
                  <div style={{ fontSize:"9px", letterSpacing:"0.2em", textTransform:"uppercase", color:GOLD,
                    fontFamily:"'Space Mono', monospace", marginBottom:"14px" }}>Analyst Note · {R.auditMeta?.dataConfidence} Confidence</div>
                  <p style={{ fontSize:"14px", lineHeight:"1.8", color:"rgba(255,255,255,0.7)",
                    fontFamily:"'DM Sans', sans-serif" }}>{R.auditMeta?.analystNote}</p>
                  {R.auditMeta?.assumptionsLog?.length > 0 && (
                    <div style={{ marginTop:"16px", padding:"12px", background:"rgba(255,255,255,0.03)", borderRadius:"8px" }}>
                      <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono', monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>ASSUMPTIONS MADE</div>
                      {R.auditMeta.assumptionsLog.map((a,i) => (
                        <div key={i} style={{ fontSize:"11px", color:"rgba(255,255,255,0.4)", marginBottom:"4px", paddingLeft:"10px",
                          borderLeft:"1px solid rgba(255,255,255,0.1)", lineHeight:1.6 }}>· {a}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Risk Arc */}
                <div style={{ padding:"28px", background:PANEL, border:`1px solid ${BORDER}`, borderRadius:"14px", textAlign:"center" }}>
                  <div style={{ fontSize:"9px", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)",
                    fontFamily:"'Space Mono', monospace", marginBottom:"16px" }}>Portfolio Risk Profile</div>
                  <RiskArc score={R.riskAudit?.portfolioRiskScore || 50} size={180} />
                  <div style={{ marginTop:"16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                    {[
                      ["Concentration", R.riskAudit?.concentrationRisk?.score + "/10"],
                      ["Liquidity Risk", R.riskAudit?.liquidityRisk?.score + "/10"],
                    ].map(([l,v]) => (
                      <div key={l} style={{ padding:"10px", background:"rgba(255,255,255,0.03)", borderRadius:"8px" }}>
                        <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono', monospace", letterSpacing:"0.08em" }}>{l}</div>
                        <div style={{ fontSize:"16px", fontWeight:700, fontFamily:"'Syne', sans-serif", color:"rgba(255,255,255,0.8)" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px", marginBottom:"24px" }}>
                <div style={{ padding:"24px", background:"rgba(52,211,153,0.04)", border:"1px solid rgba(52,211,153,0.15)", borderRadius:"14px" }}>
                  <div style={{ fontSize:"9px", letterSpacing:"0.2em", textTransform:"uppercase", color:"#34d399",
                    fontFamily:"'Space Mono', monospace", marginBottom:"16px" }}>✓ Portfolio Strengths</div>
                  {R.executiveSummary?.strengthsFound?.map((s,i) => (
                    <div key={i} style={{ display:"flex", gap:"10px", marginBottom:"10px", alignItems:"flex-start" }}>
                      <span style={{ color:"#34d399", fontSize:"12px", marginTop:"2px" }}>◆</span>
                      <span style={{ fontSize:"13px", color:"rgba(255,255,255,0.65)", lineHeight:1.6 }}>{s}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding:"24px", background:"rgba(239,68,68,0.04)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:"14px" }}>
                  <div style={{ fontSize:"9px", letterSpacing:"0.2em", textTransform:"uppercase", color:"#f87171",
                    fontFamily:"'Space Mono', monospace", marginBottom:"16px" }}>⚑ Critical Weaknesses</div>
                  {R.executiveSummary?.criticalWeaknesses?.map((w,i) => (
                    <div key={i} style={{ display:"flex", gap:"10px", marginBottom:"10px", alignItems:"flex-start" }}>
                      <span style={{ color:"#ef4444", fontSize:"12px", marginTop:"2px" }}>◆</span>
                      <span style={{ fontSize:"13px", color:"rgba(255,255,255,0.65)", lineHeight:1.6 }}>{w}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Plans */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px", marginBottom:"24px" }}>
                {[
                  { title:"30-Day Action Plan", items: R.executiveSummary?.thirtyDayActionPlan, color:GOLD },
                  { title:"90-Day Roadmap", items: R.executiveSummary?.ninetyDayRoadmap, color:"#60a5fa" },
                ].map(plan => (
                  <div key={plan.title} style={{ padding:"24px", background:PANEL, border:`1px solid ${BORDER}`, borderRadius:"14px" }}>
                    <div style={{ fontSize:"9px", letterSpacing:"0.2em", textTransform:"uppercase", color:plan.color,
                      fontFamily:"'Space Mono', monospace", marginBottom:"16px" }}>{plan.title}</div>
                    {plan.items?.map((item, i) => (
                      <div key={i} style={{ display:"flex", gap:"12px", marginBottom:"12px", alignItems:"flex-start" }}>
                        <div style={{ width:"20px", height:"20px", borderRadius:"50%", background:`${plan.color}20`,
                          border:`1px solid ${plan.color}60`, display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:"9px", color:plan.color, fontFamily:"'Space Mono', monospace", flexShrink:0, fontWeight:700 }}>{i+1}</div>
                        <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)", lineHeight:1.65 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Closing */}
              <div style={{ padding:"28px 32px", background:`${GOLD}08`, border:`1px solid ${GOLD}30`, borderRadius:"14px" }}>
                <div style={{ fontSize:"9px", letterSpacing:"0.2em", textTransform:"uppercase", color:GOLD,
                  fontFamily:"'Space Mono', monospace", marginBottom:"12px" }}>Fiduciary Verdict</div>
                <p style={{ fontSize:"15px", lineHeight:"1.8", color:"rgba(255,255,255,0.75)", fontFamily:"'DM Sans', sans-serif", fontStyle:"italic" }}>
                  "{R.executiveSummary?.closingStatement}"
                </p>
                <div style={{ marginTop:"16px", fontFamily:"'Space Mono', monospace", fontSize:"11px", color:GOLD }}>
                  Estimated total improvement potential: <strong>{fmt$(R.executiveSummary?.estimatedTotalImprovementDollars)} / year</strong>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ HOLDINGS ══════════ */}
          {activeTab === "holdings" && (
            <div style={{ animation:"fadeUp 0.4s ease both" }}>
              <SectionHead label={`${R.holdings?.length} Positions Analyzed`} />
              <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                {R.holdings?.sort((a,b) => (b.marketValue||0)-(a.marketValue||0)).map((h,i) => (
                  <div key={h.id} className="holding-row"
                    style={{ background:PANEL, border:`1px solid ${BORDER}`, borderRadius:"14px", overflow:"hidden",
                      borderLeft:`3px solid ${riskColor(h.risk?.score||50)}`, transition:"all 0.2s", cursor:"pointer" }}
                    onClick={() => setHoveredHolding(hoveredHolding===h.id ? null : h.id)}>
                    {/* Collapsed row */}
                    <div style={{ display:"flex", alignItems:"center", padding:"18px 24px", gap:"16px", flexWrap:"wrap" }}>
                      <div style={{ minWidth:"240px", flex:1 }}>
                        <div style={{ fontSize:"15px", fontWeight:700, fontFamily:"'Syne', sans-serif", marginBottom:"4px" }}>
                          {h.name}
                          {h.ticker && <span style={{ marginLeft:"8px", fontSize:"10px", padding:"2px 7px",
                            background:"rgba(255,255,255,0.06)", borderRadius:"4px",
                            fontFamily:"'Space Mono', monospace", color:"rgba(255,255,255,0.45)" }}>{h.ticker}</span>}
                        </div>
                        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                          <Pill text={h.assetClass} />
                          <Pill text={h.accountType} />
                          <Pill text={h.liquidity?.rating} />
                          {h.qualityFlags?.length > 0 && <Pill text={`${h.qualityFlags.length} flags`} color="rgba(239,68,68,0.15)" textColor="#fca5a5" />}
                        </div>
                      </div>

                      <div style={{ display:"flex", gap:"24px", alignItems:"center", flexWrap:"wrap" }}>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:"16px", fontWeight:700, fontFamily:"'Syne', sans-serif" }}>{fmt$(h.marketValue)}</div>
                          <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.35)", fontFamily:"'Space Mono', monospace" }}>{fmtPct(h.allocationPct)}</div>
                        </div>
                        {[
                          ["Fee Grade", h.fees?.feeGradeLetter, gradeColor(h.fees?.feeGradeLetter)],
                          ["Exp Ratio", fmtPct(h.fees?.expenseRatioPct), "rgba(255,255,255,0.7)"],
                          ["Fee $/yr", fmt$(h.fees?.totalAnnualFeeDollars), "#fca5a5"],
                          ["Tax Drag", fmtPct(h.taxAnalysis?.dragEstimatePct), "#fdba74"],
                        ].map(([lbl,val,col]) => (
                          <div key={lbl} style={{ textAlign:"center" }}>
                            <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.28)", fontFamily:"'Space Mono', monospace", letterSpacing:"0.08em", marginBottom:"3px" }}>{lbl}</div>
                            <div style={{ fontSize:"13px", fontWeight:700, fontFamily:"'Space Mono', monospace", color:col }}>{val}</div>
                          </div>
                        ))}
                        <ScoreRing value={h.risk?.score||50} color={riskColor(h.risk?.score||50)} size={52} label="Risk" />
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {hoveredHolding === h.id && (
                      <div style={{ padding:"0 24px 24px", borderTop:`1px solid ${BORDER}` }}>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:"14px", marginTop:"20px" }}>
                          {/* Fee Detail */}
                          <div style={{ padding:"16px", background:"rgba(239,68,68,0.04)", border:"1px solid rgba(239,68,68,0.12)", borderRadius:"10px" }}>
                            <div style={{ fontSize:"9px", color:"#fca5a5", fontFamily:"'Space Mono', monospace", letterSpacing:"0.1em", marginBottom:"10px" }}>FEE ANALYSIS</div>
                            {[
                              ["Expense Ratio", fmtPct(h.fees?.expenseRatioPct)],
                              ["Mgmt Fee", fmtPct(h.fees?.managementFeePct)],
                              ["Performance Fee", fmtPct(h.fees?.performanceFeePct)],
                              ["Other Fees", fmtPct(h.fees?.otherFeesPct)],
                              ["TOTAL / yr", fmt$(h.fees?.totalAnnualFeeDollars)],
                              ["vs. Vanguard", fmtPct(h.fees?.vsVanguardBenchmarkPct) + " more"],
                            ].map(([l,v]) => (
                              <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                                <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", fontFamily:"'Space Mono', monospace" }}>{l}</span>
                                <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.7)", fontFamily:"'Space Mono', monospace", fontWeight:700 }}>{v}</span>
                              </div>
                            ))}
                            <div style={{ marginTop:"10px", padding:"8px", background:"rgba(255,255,255,0.03)", borderRadius:"6px",
                              fontSize:"11px", color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>{h.fees?.feeNarrative}</div>
                          </div>

                          {/* Tax Detail */}
                          <div style={{ padding:"16px", background:"rgba(249,115,22,0.04)", border:"1px solid rgba(249,115,22,0.12)", borderRadius:"10px" }}>
                            <div style={{ fontSize:"9px", color:"#fdba74", fontFamily:"'Space Mono', monospace", letterSpacing:"0.1em", marginBottom:"10px" }}>TAX ANALYSIS</div>
                            {[
                              ["Total Drag %", fmtPct(h.taxAnalysis?.dragEstimatePct)],
                              ["Tax Drag $/yr", fmt$(h.taxAnalysis?.dragEstimateDollars)],
                              ["Dividend Drag", fmtPct(h.taxAnalysis?.dividendDragPct)],
                              ["Turnover Drag", fmtPct(h.taxAnalysis?.turnoverDragPct)],
                              ["Account Fit", `${h.taxAnalysis?.accountFitScore}/10`],
                              ["Verdict", h.taxAnalysis?.accountFitVerdict],
                            ].map(([l,v]) => (
                              <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                                <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", fontFamily:"'Space Mono', monospace" }}>{l}</span>
                                <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.7)", fontFamily:"'Space Mono', monospace", fontWeight:700 }}>{v}</span>
                              </div>
                            ))}
                            <div style={{ marginTop:"10px", padding:"8px", background:"rgba(255,255,255,0.03)", borderRadius:"6px",
                              fontSize:"11px", color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>{h.taxAnalysis?.taxNotes}</div>
                          </div>

                          {/* Risk Detail */}
                          <div style={{ padding:"16px", background:`${riskColor(h.risk?.score||50)}08`, border:`1px solid ${riskColor(h.risk?.score||50)}25`, borderRadius:"10px" }}>
                            <div style={{ fontSize:"9px", color:riskColor(h.risk?.score||50), fontFamily:"'Space Mono', monospace", letterSpacing:"0.1em", marginBottom:"10px" }}>RISK PROFILE · {h.risk?.score}/100</div>
                            <div style={{ marginBottom:"10px" }}>
                              <div style={{ height:"5px", background:"rgba(255,255,255,0.06)", borderRadius:"3px", marginBottom:"6px" }}>
                                <div style={{ height:"100%", width:`${h.risk?.score}%`, background:riskColor(h.risk?.score||50), borderRadius:"3px" }} />
                              </div>
                              <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.5)", fontFamily:"'Space Mono', monospace" }}>{h.risk?.label}</div>
                            </div>
                            <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono', monospace", letterSpacing:"0.08em", marginBottom:"6px" }}>RISK DRIVERS</div>
                            {h.risk?.drivers?.map((d,i) => <div key={i} style={{ fontSize:"11px", color:"rgba(255,255,255,0.55)", marginBottom:"4px" }}>· {d}</div>)}
                          </div>

                          {/* Flags */}
                          {(h.qualityFlags?.length > 0 || h.risk?.flags?.length > 0) && (
                            <div style={{ padding:"16px", background:"rgba(239,68,68,0.03)", border:"1px solid rgba(239,68,68,0.1)", borderRadius:"10px" }}>
                              <div style={{ fontSize:"9px", color:"#fca5a5", fontFamily:"'Space Mono', monospace", letterSpacing:"0.1em", marginBottom:"10px" }}>⚑ FLAGS & CONCERNS</div>
                              {[...(h.qualityFlags||[]), ...(h.risk?.flags||[])].map((f,i) => (
                                <div key={i} style={{ display:"flex", gap:"8px", marginBottom:"8px", padding:"7px 10px",
                                  background:"rgba(239,68,68,0.06)", borderRadius:"6px", alignItems:"flex-start" }}>
                                  <span style={{ color:"#ef4444", fontSize:"10px", marginTop:"1px" }}>⚑</span>
                                  <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.6)", lineHeight:1.5 }}>{f}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Benchmark comparison */}
                        {h.benchmarkComparison && (
                          <div style={{ marginTop:"14px", padding:"14px 18px", background:"rgba(255,255,255,0.02)", borderRadius:"8px",
                            display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"10px" }}>
                            <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", fontFamily:"'Space Mono', monospace" }}>
                              Benchmark: <span style={{ color:"rgba(255,255,255,0.6)" }}>{h.benchmarkComparison.suggestedBenchmark}</span>
                            </div>
                            <div style={{ fontSize:"11px", fontFamily:"'Space Mono', monospace", color:"#fca5a5", fontWeight:700 }}>
                              Excess cost: {fmtPct(h.benchmarkComparison.excessCostVsBenchmarkPct)} ({fmt$(h.benchmarkComparison.excessCostVsBenchmarkDollars)}/yr)
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ COST AUDIT ══════════ */}
          {activeTab === "costs" && (
            <div style={{ animation:"fadeUp 0.4s ease both" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(170px, 1fr))", gap:"14px", marginBottom:"32px" }}>
                <StatBox label="Total Fees / Year" value={fmt$(R.costAudit?.totalFeeDollarsAnnual)} sub={fmtBps(R.costAudit?.totalFeePctWeightedAvg)} highlight accent="#ef4444" />
                <StatBox label="Annual Tax Drag" value={fmt$(R.costAudit?.taxDragDollarsAnnual)} sub={fmtPct(R.costAudit?.taxDragPctWeightedAvg)} highlight accent="#f97316" />
                <StatBox label="Hard Dollar Costs" value={fmt$(R.costAudit?.hardDollarCostsAnnual)} sub="custody, advisory, admin" highlight accent="#eab308" />
                <StatBox label="All-In Total / Year" value={fmt$(R.costAudit?.allInCostDollarsAnnual)} sub={fmtBps(R.costAudit?.allInCostPctAnnual)} highlight accent="#ef4444" />
                <StatBox label="vs Institutional Avg" value={fmtBps((R.costAudit?.allInCostPctAnnual||0) - (R.costAudit?.vsInstitutionalAveragePct||0))} sub="above peer benchmark" highlight={R.costAudit?.feePercentileRank>50} accent="#f97316" />
                <StatBox label="Potential Savings" value={fmt$(R.costAudit?.potentialSavingsDollarsAnnual)} sub="if fully optimized" highlight accent="#34d399" />
              </div>

              {/* Breakdown Bar Chart */}
              <div style={{ padding:"28px", background:PANEL, border:`1px solid ${BORDER}`, borderRadius:"14px", marginBottom:"20px" }}>
                <SectionHead label="Cost Breakdown" />
                {R.costAudit?.costBreakdown?.map((item, i) => {
                  const pct = R.costAudit.allInCostDollarsAnnual > 0 ? (item.dollars / R.costAudit.allInCostDollarsAnnual) * 100 : 0;
                  const colors = ["#ef4444","#f97316","#eab308","#60a5fa","#a78bfa"];
                  return (
                    <div key={i} style={{ marginBottom:"16px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                        <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.55)" }}>{item.category}</span>
                        <div style={{ display:"flex", gap:"16px" }}>
                          <span style={{ fontSize:"12px", color:colors[i % colors.length], fontFamily:"'Space Mono', monospace", fontWeight:700 }}>{fmt$(item.dollars)}</span>
                          <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono', monospace" }}>{fmtPct(item.pct)}</span>
                        </div>
                      </div>
                      <div style={{ height:"8px", background:"rgba(255,255,255,0.05)", borderRadius:"4px" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:colors[i % colors.length], borderRadius:"4px", transition:"width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tax Optimization */}
              {R.costAudit?.taxOptimization && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px" }}>
                  {[
                    { title:"Tax-Loss Harvesting", items: R.costAudit.taxOptimization.harvestingOpportunities, color:"#34d399" },
                    { title:"Asset Location Fixes", items: R.costAudit.taxOptimization.assetLocationFixes, color:"#60a5fa" },
                    { title:"Vehicle Optimizations", items: R.costAudit.taxOptimization.vehicleOptimizations, color:GOLD },
                  ].map(s => (
                    <div key={s.title} style={{ padding:"20px", background:PANEL, border:`1px solid ${BORDER}`, borderRadius:"12px" }}>
                      <div style={{ fontSize:"9px", color:s.color, fontFamily:"'Space Mono', monospace", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"14px" }}>{s.title}</div>
                      {s.items?.length > 0 ? s.items.map((item,i) => (
                        <div key={i} style={{ fontSize:"12px", color:"rgba(255,255,255,0.55)", marginBottom:"8px",
                          paddingLeft:"10px", borderLeft:`2px solid ${s.color}60`, lineHeight:1.6 }}>{item}</div>
                      )) : <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.25)", fontFamily:"'Space Mono', monospace" }}>None identified</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════ RISK AUDIT ══════════ */}
          {activeTab === "risk" && (
            <div style={{ animation:"fadeUp 0.4s ease both" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:"20px", marginBottom:"24px" }}>
                <div style={{ padding:"32px", background:PANEL, border:`1px solid ${BORDER}`, borderRadius:"14px", textAlign:"center" }}>
                  <div style={{ fontSize:"9px", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono', monospace", marginBottom:"16px" }}>Portfolio Risk Score</div>
                  <RiskArc score={R.riskAudit?.portfolioRiskScore || 50} size={200} />
                  <div style={{ marginTop:"8px", fontSize:"16px", fontWeight:700, fontFamily:"'Syne', sans-serif", color:riskColor(R.riskAudit?.portfolioRiskScore||50) }}>{R.riskAudit?.portfolioRiskLabel}</div>
                  <div style={{ marginTop:"16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                    <div style={{ padding:"12px", background:"rgba(255,255,255,0.03)", borderRadius:"8px" }}>
                      <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono', monospace" }}>WEIGHTED AVG</div>
                      <div style={{ fontSize:"18px", fontWeight:700, fontFamily:"'Syne', sans-serif" }}>{R.riskAudit?.weightedAvgRisk}</div>
                    </div>
                    <div style={{ padding:"12px", background:"rgba(255,255,255,0.03)", borderRadius:"8px" }}>
                      <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono', monospace" }}>CORR-ADJUSTED</div>
                      <div style={{ fontSize:"18px", fontWeight:700, fontFamily:"'Syne', sans-serif" }}>{R.riskAudit?.correlationAdjustedRisk}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  {[
                    { label:"Concentration Risk", data: R.riskAudit?.concentrationRisk, extra: `Top: ${R.riskAudit?.concentrationRisk?.topHolding} (${fmtPct(R.riskAudit?.concentrationRisk?.topHoldingPct)})`, narrative: R.riskAudit?.concentrationRisk?.narrativ },
                    { label:"Liquidity Risk", data: R.riskAudit?.liquidityRisk, extra: `${fmtPct(R.riskAudit?.liquidityRisk?.illiquidPct)} illiquid`, narrative: R.riskAudit?.liquidityRisk?.narrative },
                  ].map(item => (
                    <div key={item.label} style={{ padding:"20px", background:PANEL, border:`1px solid ${BORDER}`, borderRadius:"12px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                        <div style={{ fontSize:"11px", fontWeight:700, fontFamily:"'Syne', sans-serif" }}>{item.label}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                          <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", fontFamily:"'Space Mono', monospace" }}>{item.extra}</span>
                          <div style={{ padding:"3px 10px", background:"rgba(255,255,255,0.06)", borderRadius:"100px",
                            fontSize:"12px", fontWeight:700, fontFamily:"'Space Mono', monospace" }}>{item.data?.score}/10</div>
                        </div>
                      </div>
                      <div style={{ height:"6px", background:"rgba(255,255,255,0.05)", borderRadius:"3px", marginBottom:"10px" }}>
                        <div style={{ height:"100%", width:`${(item.data?.score||0)*10}%`, borderRadius:"3px",
                          background: item.data?.score > 7 ? "#ef4444" : item.data?.score > 5 ? "#f97316" : "#34d399" }} />
                      </div>
                      <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.45)", lineHeight:1.6 }}>{item.narrative}</div>
                    </div>
                  ))}
                  {[
                    ["Duration Risk", R.riskAudit?.durationRisk],
                    ["Currency Risk", R.riskAudit?.currencyRisk],
                    ["Tail Risk", R.riskAudit?.tailRiskNarrative],
                  ].map(([lbl, val]) => (
                    <div key={lbl} style={{ padding:"16px 20px", background:PANEL, border:`1px solid ${BORDER}`, borderRadius:"12px" }}>
                      <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono', monospace", letterSpacing:"0.1em", marginBottom:"6px", textTransform:"uppercase" }}>{lbl}</div>
                      <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)", lineHeight:1.6 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk by holding */}
              <SectionHead label="Risk Score by Position" />
              <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                {R.holdings?.sort((a,b) => (b.risk?.score||0) - (a.risk?.score||0)).map(h => (
                  <div key={h.id} style={{ display:"flex", alignItems:"center", gap:"14px", padding:"12px 18px",
                    background:"rgba(255,255,255,0.02)", borderRadius:"8px" }}>
                    <div style={{ width:"36px", height:"36px", borderRadius:"8px", display:"flex", alignItems:"center",
                      justifyContent:"center", background:`${riskColor(h.risk?.score||50)}18`,
                      fontSize:"12px", fontWeight:700, fontFamily:"'Space Mono', monospace", color:riskColor(h.risk?.score||50) }}>
                      {h.risk?.score}
                    </div>
                    <div style={{ flex:1, fontSize:"13px", fontFamily:"'DM Sans', sans-serif" }}>{h.name}</div>
                    <div style={{ width:"150px", height:"5px", background:"rgba(255,255,255,0.05)", borderRadius:"3px" }}>
                      <div style={{ height:"100%", width:`${h.risk?.score}%`, background:riskColor(h.risk?.score||50), borderRadius:"3px" }} />
                    </div>
                    <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono', monospace", width:"50px", textAlign:"right" }}>{fmtPct(h.allocationPct)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ REDUNDANCIES ══════════ */}
          {activeTab === "redundancies" && (
            <div style={{ animation:"fadeUp 0.4s ease both" }}>
              {!R.redundancies?.length ? (
                <div style={{ textAlign:"center", padding:"80px", color:"rgba(255,255,255,0.25)", fontFamily:"'Space Mono', monospace" }}>✓ No significant redundancies detected</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  {R.redundancies.sort((a,b) => (b.annualWasteDollars||0)-(a.annualWasteDollars||0)).map((red, i) => {
                    const sm = severityMeta[red.severity] || severityMeta.Medium;
                    return (
                      <div key={red.id || i} style={{ padding:"24px", background:PANEL,
                        border:`1px solid ${sm.color}30`, borderRadius:"14px", borderLeft:`3px solid ${sm.color}` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"14px", flexWrap:"wrap", gap:"10px" }}>
                          <div>
                            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px" }}>
                              <span style={{ padding:"2px 9px", borderRadius:"100px", background:`${sm.color}18`, border:`1px solid ${sm.color}60`,
                                color:sm.color, fontSize:"9px", fontFamily:"'Space Mono', monospace", fontWeight:700, letterSpacing:"0.1em" }}>{red.severity}</span>
                              <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.4)", fontFamily:"'Space Mono', monospace" }}>{red.type}</span>
                            </div>
                            <div style={{ fontSize:"15px", fontWeight:600, fontFamily:"'Syne', sans-serif" }}>{red.description}</div>
                          </div>
                          {red.annualWasteDollars > 0 && (
                            <div style={{ textAlign:"right" }}>
                              <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono', monospace", marginBottom:"4px" }}>WASTE / YR</div>
                              <div style={{ fontSize:"22px", fontWeight:700, fontFamily:"'Syne', sans-serif", color:"#fca5a5" }}>{fmt$(red.annualWasteDollars)}</div>
                            </div>
                          )}
                        </div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"12px" }}>
                          {red.affectedNames?.map((n,i) => (
                            <span key={i} style={{ padding:"4px 10px", background:`${sm.color}12`, border:`1px solid ${sm.color}25`,
                              borderRadius:"4px", fontSize:"11px", fontFamily:"'Space Mono', monospace", color:sm.color }}>{n}</span>
                          ))}
                          {red.overlapEstimatePct > 0 && <Pill text={`~${red.overlapEstimatePct}% overlap`} color={`${sm.color}15`} textColor={sm.color} />}
                        </div>
                        <div style={{ padding:"12px 16px", background:"rgba(255,255,255,0.025)", borderRadius:"8px",
                          fontSize:"12px", color:"rgba(255,255,255,0.55)", lineHeight:1.65, borderLeft:`2px solid ${GOLD}60` }}>
                          <span style={{ color:GOLD, fontFamily:"'Space Mono', monospace", fontSize:"9px", letterSpacing:"0.1em" }}>RECOMMENDATION: </span>
                          {red.recommendation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════ RECOMMENDATIONS ══════════ */}
          {activeTab === "recommendations" && (
            <div style={{ animation:"fadeUp 0.4s ease both" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"28px" }}>
                {["P1-Critical","P2-High","P3-Medium","P4-Low"].map(p => {
                  const pm = priorityMeta[p];
                  const count = R.recommendations?.filter(r => r.priority === p).length || 0;
                  const impact = R.recommendations?.filter(r => r.priority === p).reduce((s,r) => s + (r.estimatedAnnualImpactDollars||0), 0) || 0;
                  return (
                    <div key={p} style={{ padding:"16px", background:pm.bg, border:`1px solid ${pm.border}40`, borderRadius:"10px" }}>
                      <div style={{ fontSize:"9px", color:pm.text, fontFamily:"'Space Mono', monospace", letterSpacing:"0.1em", marginBottom:"8px" }}>{p}</div>
                      <div style={{ fontSize:"24px", fontWeight:800, fontFamily:"'Syne', sans-serif", color:pm.text }}>{count}</div>
                      {impact > 0 && <div style={{ fontSize:"10px", color:pm.dot, fontFamily:"'Space Mono', monospace", marginTop:"4px" }}>{fmt$(impact)}/yr</div>}
                    </div>
                  );
                })}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                {R.recommendations?.sort((a,b) => {
                  const order = {"P1-Critical":0,"P2-High":1,"P3-Medium":2,"P4-Low":3};
                  return (order[a.priority]||3) - (order[b.priority]||3);
                }).map((rec, i) => {
                  const pm = priorityMeta[rec.priority] || priorityMeta["P4-Low"];
                  return (
                    <div key={rec.id || i} className="rec-card"
                      style={{ padding:"22px 24px", background:PANEL, border:`1px solid ${BORDER}`,
                        borderRadius:"12px", borderLeft:`3px solid ${pm.dot}`, transition:"border-color 0.2s" }}>
                      <div style={{ display:"flex", gap:"14px", alignItems:"flex-start" }}>
                        <div style={{ flexShrink:0 }}>
                          <div style={{ padding:"3px 9px", borderRadius:"100px", background:pm.bg, border:`1px solid ${pm.dot}50`,
                            fontSize:"9px", fontFamily:"'Space Mono', monospace", fontWeight:700, color:pm.text,
                            letterSpacing:"0.08em", marginBottom:"6px" }}>{rec.priority}</div>
                          <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.25)", fontFamily:"'Space Mono', monospace", letterSpacing:"0.06em" }}>{rec.effort}</div>
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.3)", fontFamily:"'Space Mono', monospace", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"6px" }}>{rec.category}</div>
                          <div style={{ fontSize:"14px", fontWeight:700, fontFamily:"'Syne', sans-serif", marginBottom:"8px", color:"rgba(255,255,255,0.9)" }}>{rec.action}</div>
                          <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.45)", marginBottom:"6px", lineHeight:1.6 }}>
                            <span style={{ color:"rgba(255,255,255,0.25)", fontFamily:"'Space Mono', monospace", fontSize:"9px" }}>FINDING: </span>{rec.finding}
                          </div>
                          <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.45)", lineHeight:1.6 }}>
                            <span style={{ color:"rgba(255,255,255,0.25)", fontFamily:"'Space Mono', monospace", fontSize:"9px" }}>RATIONALE: </span>{rec.rationale}
                          </div>
                        </div>
                        {rec.estimatedAnnualImpactDollars > 0 && (
                          <div style={{ textAlign:"right", flexShrink:0 }}>
                            <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.25)", fontFamily:"'Space Mono', monospace", marginBottom:"4px" }}>IMPACT/YR</div>
                            <div style={{ fontSize:"20px", fontWeight:700, fontFamily:"'Syne', sans-serif", color:"#34d399" }}>{fmt$(rec.estimatedAnnualImpactDollars)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  return null;
}
