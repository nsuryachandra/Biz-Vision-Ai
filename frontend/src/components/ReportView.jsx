import React from 'react';
import { ArrowLeft, Printer, Sparkles, ShieldCheck, Compass, AlertTriangle, TrendingUp, Users, CheckCircle } from 'lucide-react';

export default function ReportView({ report, onBack }) {
  if (!report) return null;
  const { metadata, scores, analysis, business_names, competitors, trends } = report;

  const riskLevel = (s) => s > 60 ? { l: 'High Risk', c: 'var(--danger)', bg: 'var(--danger-light)' } : s > 35 ? { l: 'Medium Risk', c: 'var(--warning)', bg: 'var(--warning-light)' } : { l: 'Low Risk', c: 'var(--success)', bg: 'var(--success-light)' };
  const scoreColor = (s) => s > 70 ? 'var(--success)' : s > 45 ? 'var(--accent)' : 'var(--danger)';
  const risk = riskLevel(scores.risk);

  const gauge = (score, label, icon) => {
    const r = 24, c = 2 * Math.PI * r, off = c - (score / 100) * c, col = scoreColor(score);
    return (
      <div className="scorecard-item">
        <div className="gauge-circle">
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
            <circle cx="28" cy="28" r={r} fill="none" stroke={col} strokeWidth="4" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
          </svg>
          <div className="gauge-value" style={{ color: col }}>{score}</div>
        </div>
        <div className="scorecard-info">
          <label>{icon} {label}</label>
          <span>{score > 70 ? 'Excellent' : score > 45 ? 'Moderate' : 'Critical'}</span>
        </div>
      </div>
    );
  };

  const chart = () => {
    if (!trends || !trends.length) return null;
    const W = 460, H = 140, P = 28;
    const vals = trends.map(t => t.value), mx = Math.max(...vals, 100), mn = Math.min(...vals, 0);
    const pts = trends.map((t, i) => ({
      x: P + (i * (W - 2 * P)) / (trends.length - 1),
      y: H - P - ((t.value - mn) / (mx - mn)) * (H - 2 * P),
      v: t.value, l: t.date,
    }));
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const area = `${d} L ${pts[pts.length - 1].x} ${H - P} L ${pts[0].x} ${H - P} Z`;
    return (
      <div className="chart-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Search Interest (12 Months)</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>Interest Over Time</span>
        </div>
        <div className="chart-svg-area">
          <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
            <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" /><stop offset="100%" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
            <line x1={P} y1={P} x2={W - P} y2={P} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1={P} y1={H / 2} x2={W - P} y2={H / 2} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="var(--border)" strokeWidth="1" />
            <path d={area} fill="url(#cg)" />
            <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" />
            {pts.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="3" fill="#fff" stroke="var(--accent)" strokeWidth="1.5" />
                {i % 2 === 0 && <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="8" fontWeight="600" fill="var(--text-secondary)">{p.v}</text>}
                <text x={p.x} y={H - 8} textAnchor="middle" fontSize="7" fill="var(--text-tertiary)">{p.l}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const sections = [
    { id: 'scorecard', label: 'Scorecard' },
    { id: 'summary', label: 'Executive Summary' },
    { id: 'names', label: 'Brand Names' },
    { id: 'market', label: 'Market Analysis' },
    { id: 'competitors', label: 'Competitors' },
    { id: 'risk', label: 'Risk Assessment' },
    { id: 'recommendation', label: 'Recommendation' },
  ];

  const barRow = (label, val, col) => (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 700 }}>{val}</span>
      </div>
      <div className="kpi-bar"><div className="kpi-bar-fill" style={{ width: `${val}%`, background: col }} /></div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }} className="no-print">
        <button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={14} /> Back to Dashboard</button>
        <button className="btn btn-primary" onClick={() => window.print()}><Printer size={14} /> Print Report</button>
      </div>

      <div className="report-layout">
        <aside className="report-toc no-print">
          {sections.map(s => (
            <a key={s.id} className="toc-link" href={`#${s.id}`}>{s.label}</a>
          ))}
        </aside>

        <div className="report-body">
          <div className="report-paper" style={{ position: 'relative' }}>
            <div className="report-confidential">Confidential — BizVision AI</div>

            <div className="report-header">
              <div className="report-type-label">Startup Intelligence & Market Validation Report</div>
              <h1 className="report-title">{metadata.idea_text}</h1>
              <div className="report-meta-row">
                <div className="report-meta-item"><label>Industry</label><span>{metadata.industry}</span></div>
                <div className="report-meta-item"><label>Channel</label><span>{metadata.business_type}</span></div>
                <div className="report-meta-item"><label>Location</label><span>{metadata.location}</span></div>
                <div className="report-meta-item"><label>Risk Level</label><span style={{ color: risk.c }}>{risk.l}</span></div>
              </div>
            </div>

            <div id="scorecard" className="report-section">
              <h3 className="report-section-title"><Sparkles size={16} style={{ color: 'var(--accent)' }} /> Executive Scorecard</h3>
              <div className="scorecard-row">
                {gauge(scores.viability, 'Viability', '')}
                {gauge(scores.opportunity, 'Opportunity', '')}
                {gauge(scores.risk, 'Risk', '')}
              </div>
              {barRow('Market Demand', scores.demand, 'var(--accent)')}
              {barRow('Trend Growth', scores.trend, 'var(--accent-secondary)')}
              {barRow('Competition Density', scores.competition, 'var(--warning)')}
              {barRow('News Sentiment', scores.sentiment, 'var(--success)')}
            </div>

            <div id="summary" className="report-section">
              <h3 className="report-section-title"><ShieldCheck size={16} style={{ color: 'var(--success)' }} /> Executive Summary</h3>
              <div className="callout">{analysis.executive_summary}</div>
            </div>

            {business_names && business_names.length > 0 && (
              <div id="names" className="report-section">
                <h3 className="report-section-title"><Sparkles size={16} style={{ color: 'var(--accent-secondary)' }} /> Brand Name Validation</h3>
                <div className="name-grid">
                  {business_names.map((n, i) => (
                    <div key={i} className="name-card">
                      <div className="name-card-head">
                        <h4>{n.name}</h4>
                        <span className="score-pill neutral" style={{ fontFamily: 'var(--font-mono)' }}>{n.brand_uniqueness}%</span>
                      </div>
                      <div className="name-attrs">
                        <div>Popularity <strong>{n.popularity}</strong></div>
                        <div>Competition <strong>{n.competition}</strong></div>
                      </div>
                      <div className="name-rationale"><strong>Rationale:</strong> {n.rationale}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div id="market" className="report-section">
              <h3 className="report-section-title"><TrendingUp size={16} style={{ color: 'var(--accent)' }} /> Market Demand & Trend Analysis</h3>
              <div className="report-section-body"><p>{analysis.market_analysis}</p></div>
              {chart()}
            </div>

            {competitors && competitors.length > 0 && (
              <div id="competitors" className="report-section">
                <h3 className="report-section-title"><Users size={16} style={{ color: 'var(--accent-secondary)' }} /> Competitor Intelligence</h3>
                <div className="report-section-body"><p>{analysis.competitor_analysis}</p></div>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Competitor</th><th>Rating</th><th>Reviews</th><th>Address</th></tr></thead>
                    <tbody>
                      {competitors.map((c, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{c.title}</td>
                          <td><span style={{ color: 'var(--warning)', fontWeight: 700 }}>★ {c.rating}</span></td>
                          <td>{c.reviews}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{c.address}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div id="risk" className="report-section">
              <h3 className="report-section-title"><AlertTriangle size={16} style={{ color: 'var(--danger)' }} /> Risk Assessment</h3>
              <div className="report-section-body"><p>{analysis.risk_analysis}</p></div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: risk.bg, border: `1px solid ${risk.c}20`, padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginTop: '0.75rem' }}>
                <AlertTriangle size={18} style={{ color: risk.c, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>Risk Profile</div>
                  <div style={{ fontWeight: 700, color: risk.c }}>{risk.l} — Exposure {scores.risk}/100</div>
                </div>
              </div>
            </div>

            <div id="recommendation" className="report-section" style={{ borderTop: '2px solid var(--text-primary)', paddingTop: '1.5rem' }}>
              <h3 className="report-section-title" style={{ border: 'none', paddingBottom: 0 }}><CheckCircle size={16} style={{ color: 'var(--success)' }} /> Final Recommendation</h3>
              <div className="report-section-body"><p>{analysis.final_recommendation}</p></div>
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '1.15rem', borderRadius: 'var(--radius-md)', marginTop: '0.75rem' }}>
                <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Execution Roadmap</strong>
                <ul style={{ paddingLeft: '1.15rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>Validate brand names ({business_names?.[0]?.name}) in local trademark registries.</li>
                  <li>Run qualitative consumer surveys targeting {metadata.location} demographics.</li>
                  <li>Launch a micro-budget digital ad pilot to measure acquisition costs.</li>
                </ul>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '2rem', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              BizVision AI Strategic Report · {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
