import React, { useState, useEffect } from 'react';

export default function Dashboard({ onSelect }) {
  const [metrics, setMetrics] = useState({ total_ideas_analyzed: 0, average_viability_score: 0, average_risk_score: 0, average_opportunity_score: 0 });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:5000/dashboard');
        if (res.ok) {
          const d = await res.json();
          setMetrics(d.metrics || {});
          setReports(d.recent_reports || []);
        }
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pillClass = (score, isRisk) => {
    if (isRisk) return score > 60 ? 'danger' : score > 35 ? 'warning' : 'success';
    return score > 70 ? 'success' : score > 45 ? 'neutral' : 'danger';
  };

  const getRiskLabel = (val) => {
    if (val > 60) return 'HIGH';
    if (val > 35) return 'MEDIUM';
    return 'LOW';
  };

  const viabilityScore = metrics.average_viability_score || 0;
  const riskScore = metrics.average_risk_score || 0;
  const opportunityScore = metrics.average_opportunity_score || 0;
  const totalAnalyzed = metrics.total_ideas_analyzed || 0;

  // Calculate SVG stroke properties for Risk Circle
  const radius = 88;
  const circumference = 2 * Math.PI * radius; // ~552.9
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: '1440px', padding: '4rem 2rem' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="status-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }}></span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--primary)', fontWeight: 700 }}>Protocol v.4.2.0</span>
          </div>
          <h2 className="font-heading" style={{ fontSize: '3rem', fontWeight: 800, textTransform: 'uppercase' }}>Intelligence Stream</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="glass-panel" style={{ padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--outline-variant)' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--on-surface)' }}>30D WINDOW</span>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>tune</span>
          </div>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
        
        {/* Metric Cluster 1: Startup Scorecard */}
        <div className="glass-panel" style={{ gridColumn: 'span 8', padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', border: '1px solid var(--outline-variant)', height: '360px' }}>
          <div style={{ position: 'absolute', top: '-6rem', right: '-6rem', width: '16rem', height: '16rem', background: 'rgba(51, 35, 204, 0.04)', borderRadius: '50%', filter: 'blur(48px)' }}></div>
          <div style={{ relative: 'relative', zIndex: 1 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.15em', marginBottom: '1.5rem' }}>// CORE_SCORE_INDEX</p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
              <h3 className="font-mono" style={{ fontSize: '6rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1, letterSpacing: '-0.05em' }}>{viabilityScore}</h3>
              <div style={{ marginTop: '1rem' }}>
                <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>+12.4% Δ</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '200px' }}>Average startup viability index evaluated.</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', borderTop: '1px solid var(--outline-variant)', paddingTop: '1.5rem', relative: 'relative', zIndex: 1 }}>
            <div style={{ background: 'var(--on-background)', color: '#fff', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', opacity: 0.6 }}>VELOCITY_BURST</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{totalAnalyzed} IDEAS</p>
            </div>
            <div style={{ background: 'var(--on-background)', color: '#fff', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', opacity: 0.6 }}>STABILITY_RATIO</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>92/100</p>
            </div>
            <div style={{ background: 'var(--on-background)', color: '#fff', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(51,35,204,0.3)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', opacity: 0.6 }}>BURN_STATE</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary-fixed-dim)' }}>OPTIMIZED</p>
            </div>
          </div>
        </div>

        {/* Metric Cluster 2: Risk Profile */}
        <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid var(--outline-variant)', height: '360px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.15em', marginBottom: '1.5rem' }}>RISK_PARAM_Z</p>
          <div style={{ relative: 'relative', width: '12rem', height: '12rem', marginBottom: '1.5rem', position: 'relative' }}>
            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle style={{ color: 'var(--surface-container-high)' }} cx="96" cy="96" r="80" fill="transparent" stroke="currentColor" strokeWidth="3"></circle>
              <circle className="chart-line" style={{ color: 'var(--primary)', strokeDasharray: circumference, strokeDashoffset: strokeDashoffset }} cx="96" cy="96" r="80" fill="transparent" stroke="currentColor" strokeWidth="6" strokeLinecap="round"></circle>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)' }}>{getRiskLabel(riskScore)}</span>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', opacity: 0.6, tracking: '0.2em' }}>{riskScore}% VALUE</span>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', lineHeight: '1.6', padding: '0 1rem' }}>
            Aggregated exposure index within current Q3 evaluation metrics.
          </p>
        </div>

        {/* Market Demand Analysis (Minimalist Fluid Chart Mockup) */}
        <div className="glass-panel" style={{ gridColumn: 'span 5', padding: '2rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--outline-variant)', height: '320px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)' }}>Market Pulse</h3>
              <p style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Historical Query Density</p>
            </div>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>insights</span>
          </div>
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'end', gap: '0.35rem', height: '10rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, background: 'var(--surface-container-high)', borderRadius: '2px 2px 0 0', height: '30%', transition: 'all 0.3s' }}></div>
            <div style={{ flex: 1, background: 'var(--surface-container-high)', borderRadius: '2px 2px 0 0', height: '45%', transition: 'all 0.3s' }}></div>
            <div style={{ flex: 1, background: 'var(--primary)', borderRadius: '2px 2px 0 0', height: '85%', transition: 'all 0.3s' }}></div>
            <div style={{ flex: 1, background: 'var(--surface-container-high)', borderRadius: '2px 2px 0 0', height: '60%', transition: 'all 0.3s' }}></div>
            <div style={{ flex: 1, background: 'var(--surface-container-high)', borderRadius: '2px 2px 0 0', height: '40%', transition: 'all 0.3s' }}></div>
            <div style={{ flex: 1, background: 'var(--surface-container-high)', borderRadius: '2px 2px 0 0', height: '55%', transition: 'all 0.3s' }}></div>
            <div style={{ flex: 1, background: 'rgba(51,35,204,0.4)', borderRadius: '2px 2px 0 0', height: '95%', transition: 'all 0.3s' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            <span>01_SEP</span>
            <span>15_SEP</span>
            <span>30_SEP</span>
          </div>
        </div>

        {/* Sentiment & Opportunity Convergence */}
        <div style={{ gridColumn: 'span 7', display: 'grid', gridTemplateRows: 'repeat(2, 1fr)', gap: '1.5rem', height: '320px' }}>
          <div className="glass-panel" style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--outline-variant)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.1em' }}>SENTIMENT_STREAM</p>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>trending_up</span>
            </div>
            <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)' }}>Bullish Market Convergence</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{opportunityScore}%</span>
              <div style={{ flexGrow: 1, height: '4px', background: 'var(--surface-container)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--primary)', width: `${opportunityScore}%` }}></div>
              </div>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid var(--outline-variant)' }}>
            <div style={{ width: '4rem', height: '4rem', background: 'rgba(51,35,204,0.1)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>hub</span>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-tertiary)', letterSpacing: '0.15em' }}>CONVERGENCE</p>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.25rem', lineHeight: '1.3' }}>AI x Market Sentiment Analysis Engine Online</h4>
            </div>
          </div>
        </div>

        {/* Ecosystem Map (Startups Table) */}
        <div className="glass-panel" style={{ gridColumn: 'span 12', padding: '2.5rem', border: '1px solid var(--outline-variant)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase' }}>Ecosystem Map</h3>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-tertiary)' }}>RECENTLY EVALUATED VENTURES</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <div className="spinner" style={{ marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Retrieving ecosystem map...</p>
            </div>
          ) : reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
              No validation reports yet. Analyze your first idea from the Home page.
            </div>
          ) : (
            <table className="reports-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Venture / Concept</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Location</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Industry</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Viability</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Risk</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '1rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.report_id} onClick={() => onSelect(r.report_id)} style={{ borderBottom: '1px solid rgba(199,196,216,0.2)', cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-primary/5">
                    <td style={{ padding: '1.25rem 1rem', fontWeight: 700, color: 'var(--on-surface)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.idea_text}</td>
                    <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)' }}>{r.location}</td>
                    <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)' }}>{r.industry}</td>
                    <td style={{ padding: '1.25rem 1rem' }}><span className={`score-pill ${pillClass(r.viability_score, false)}`}>{r.viability_score}</span></td>
                    <td style={{ padding: '1.25rem 1rem' }}><span className={`score-pill ${pillClass(r.risk_score, true)}`}>{r.risk_score}</span></td>
                    <td style={{ padding: '1.25rem 1rem', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                      {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                      <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>east</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}
