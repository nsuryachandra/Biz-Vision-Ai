import React, { useEffect, useState } from 'react';

export default function ReportView({ report, onBack }) {
  if (!report) return null;
  const { metadata, scores, analysis, business_names, competitors, trends } = report;

  const [activeSection, setActiveSection] = useState('cover');

  // Scroll Progress Bar Logic
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      const progressBar = document.getElementById("progress-bar");
      if (progressBar) {
        progressBar.style.width = scrolled + "%";
      }

      // Update active TOC link
      const sections = ['cover', 'executive-summary', 'market-analysis', 'competition', 'trends', 'risks', 'final-recommendation'];
      let current = 'cover';
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 180) {
            current = section;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getViabilityStatus = (score) => {
    if (score > 60) return { label: 'FINAL RECOMMENDATION: GO', bg: '#4f46e5', text: '#ffffff' };
    return { label: 'RECOMMENDATION: CAUTION', bg: '#ba1a1a', text: '#ffffff' };
  };

  const status = getViabilityStatus(scores.viability);

  // Dynamic TAM/SAM/SOM calculation based on demand & currency context
  const isIndia = 
    (metadata.location && /india|hyderabad|mumbai|delhi|bangalore|pune|chennai|kolkata|punjagutta/i.test(metadata.location)) ||
    (metadata.idea_text && /india|hyderabad|mumbai|delhi|bangalore|pune|chennai|kolkata|punjagutta/i.test(metadata.idea_text));

  const isLocal = /hotel|veg|restaurant|shop|cafe|store|salon|bakery|dhabha|spa|boutique|delivery/i.test(metadata.idea_text || '');

  let currencySymbol = '$';
  let currencyUnit = 'B';
  let tamValue = 84;
  
  if (isIndia) {
    currencySymbol = '₹';
    if (isLocal) {
      tamValue = 25; // ₹25 Crores for local business
      currencyUnit = ' Cr';
    } else {
      tamValue = 4500; // ₹4500 Crores for national venture
      currencyUnit = ' Cr';
    }
  } else {
    if (isLocal) {
      tamValue = 12; // $12M for local business
      currencyUnit = 'M';
    } else {
      tamValue = 84; // $84B
      currencyUnit = 'B';
    }
  }

  const demand = scores.demand || 50;
  const tamVal = tamValue;
  const samVal = Math.round(tamVal * (demand / 100));
  const somVal = Math.round(samVal * 0.15); // standard SOM calculation

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      
      {/* Top Progress Bar */}
      <div className="scroll-indicator-bar" id="progress-bar" style={{ position: 'fixed', top: 0, left: '80px', right: 0, zIndex: 100, width: '0%', height: '3px' }}></div>

      {/* Top Action Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '1rem' }}>
        <button 
          onClick={onBack} 
          style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Back to Dashboard</span>
        </button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => window.print()} 
            style={{ background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', color: 'var(--primary)', px: '1.25rem', py: '0.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.85rem' }}
          >
            <span className="material-symbols-outlined text-sm">print</span>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '3rem' }}>
        
        {/* Left Main Content */}
        <main style={{ gridColumn: 'span 9' }} className="space-y-24">
          
          {/* Cover / Hero Section */}
          <header id="cover" className="scroll-mt-32" style={{ marginBottom: '5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', padding: '0.35rem 1rem', borderRadius: 'var(--radius-full)', background: 'rgba(51, 35, 204, 0.08)', border: '1px solid rgba(51, 35, 204, 0.15)', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              STRATEGIC ANALYSIS — Q4 2024
            </div>
            <h1 className="font-heading" style={{ fontSize: '3.5rem', lineHeight: '1.1', fontWeight: 800, color: 'var(--on-surface)', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
              {metadata.idea_text}
            </h1>
            <p className="font-body" style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '720px', marginBottom: '2.5rem' }}>
              A comprehensive validation assessment of market viability, competitive landscape density, search intent metrics, and regulatory risk profile in {metadata.location}.
            </p>
            <div style={{ display: 'flex', gap: '4rem', borderTop: '1px solid var(--outline-variant)', paddingTop: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Prepared For</span>
                <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.25rem' }}>Visionary Venture Group</span>
              </div>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI confidence score</span>
                <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>{scores.viability}%</span>
              </div>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Venture Type</span>
                <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.25rem' }}>{metadata.business_type}</span>
              </div>
            </div>
          </header>

          {/* 1. Executive Summary */}
          <section id="executive-summary" className="scroll-mt-32" style={{ marginBottom: '5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="font-heading" style={{ fontSize: '1.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>article</span>
                Executive Summary
              </h2>
              <div style={{ background: status.bg, color: status.text, padding: '0.45rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.05em' }}>
                {status.label}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '2.5rem', border: '1px solid var(--outline-variant)', borderRadius: '1.5rem', background: '#fff' }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '2rem' }}>
                {analysis.executive_summary}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <div style={{ background: 'var(--surface-container-low)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Market Demand</span>
                  <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.25rem' }}>{scores.demand}/100</span>
                </div>
                <div style={{ background: 'var(--surface-container-low)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Opportunity Index</span>
                  <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.25rem' }}>{scores.opportunity}/100</span>
                </div>
                <div style={{ background: 'rgba(51, 35, 204, 0.05)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(51, 35, 204, 0.15)' }}>
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', textTransform: 'uppercase' }}>Viability Index</span>
                  <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>{scores.viability}/100</span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Brand Name Evaluation (if present) */}
          {business_names && business_names.length > 0 && (
            <section id="brand-names" className="scroll-mt-32" style={{ marginBottom: '5rem' }}>
              <h2 className="font-heading" style={{ fontSize: '1.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>label</span>
                Brand Name Diagnostics
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                {business_names.map((n, i) => (
                  <div key={i} className="glass-panel" style={{ padding: '2rem', border: '1px solid var(--outline-variant)', borderRadius: '1.5rem', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{n.name}</h4>
                      <span style={{ background: 'var(--surface-container-high)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{n.brand_uniqueness}% UNIQUE</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <div>Popularity Score: <strong style={{ color: 'var(--on-surface)' }}>{n.popularity}</strong></div>
                      <div>Competition Rating: <strong style={{ color: 'var(--on-surface)' }}>{n.competition}</strong></div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      <strong>Rationale:</strong> {n.rationale}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. Market Addressability Projection */}
          <section id="market-analysis" className="scroll-mt-32" style={{ marginBottom: '5rem' }}>
            <h2 className="font-heading" style={{ fontSize: '1.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>analytics</span>
              Market Addressability
            </h2>
            <div className="glass-panel ai-pulse" style={{ padding: '2.5rem', border: '1px solid var(--outline-variant)', borderRadius: '1.5rem', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
                <div>
                  <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)' }}>TAM / SAM / SOM Projection</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Dynamic addressable market projections based on regional demand signals.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{currencySymbol}{tamVal}{currencyUnit}</span>
                  <span style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>TAM 2030 PROJ.</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    <span>TAM: Total Addressable Market</span>
                    <span>100% ({currencySymbol}{tamVal}{currencyUnit})</span>
                  </div>
                  <div style={{ height: '1.5rem', background: 'var(--surface-container-high)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'rgba(51, 35, 204, 0.2)', width: '100%' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    <span>SAM: Serviceable Addressable Market</span>
                    <span>{demand}% ({currencySymbol}{samVal}{currencyUnit})</span>
                  </div>
                  <div style={{ height: '1.5rem', background: 'var(--surface-container-high)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'rgba(51, 35, 204, 0.5)', width: `${demand}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    <span>SOM: Serviceable Obtainable Market</span>
                    <span>{Math.round(demand * 0.15)}% ({currencySymbol}{somVal}{currencyUnit})</span>
                  </div>
                  <div style={{ height: '1.5rem', background: 'var(--surface-container-high)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--primary)', width: `${Math.round(demand * 0.15)}%` }}></div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--outline-variant)', paddingTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.7' }}>
                {analysis.market_analysis}
              </div>
            </div>
          </section>

          {/* 4. Competition Analysis */}
          <section id="competition" className="scroll-mt-32" style={{ marginBottom: '5rem' }}>
            <h2 className="font-heading" style={{ fontSize: '1.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>groups</span>
              Competitive Landscape
            </h2>
            <div className="glass-panel" style={{ padding: '2.5rem', border: '1px solid var(--outline-variant)', borderRadius: '1.5rem', background: '#fff', overflow: 'hidden' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '2rem' }}>
                {analysis.competitor_analysis}
              </p>
              {competitors && competitors.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                      <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Player</th>
                      <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Rating</th>
                      <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Reviews Count</th>
                      <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Operational Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(199,196,216,0.2)' }}>
                        <td style={{ padding: '1.25rem 1rem', fontWeight: 700, color: 'var(--on-surface)' }}>{c.title}</td>
                        <td style={{ padding: '1.25rem 1rem' }}>
                          <span style={{ color: 'var(--warning)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            ★ {c.rating || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)' }}>{c.reviews || 0} reviews</td>
                        <td style={{ padding: '1.25rem 1rem', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{c.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No direct local brick-and-mortar competitors found in Google Places registry.</div>
              )}
            </div>
          </section>

          {/* 5. Trend Analysis */}
          <section id="trends" className="scroll-mt-32" style={{ marginBottom: '5rem' }}>
            <h2 className="font-heading" style={{ fontSize: '1.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>timeline</span>
              Trend Timeline Analysis
            </h2>
            <div className="glass-panel" style={{ padding: '2.5rem', border: '1px solid var(--outline-variant)', borderRadius: '1.5rem', background: '#fff' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '2.5rem' }}>
                {analysis.trend_analysis}
              </p>
              
              {trends && trends.length > 0 ? (
                <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                  <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '1px', background: 'var(--outline-variant)' }}></div>
                  {trends.slice(0, 3).map((t, idx) => (
                    <div key={idx} style={{ position: 'relative', marginBottom: '2.5rem' }}>
                      <div style={{ position: 'absolute', left: '-2.25rem', top: '2px', width: '1.5rem', height: '1.5rem', borderRadius: '50%', background: '#fff', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                      </div>
                      <h4 className="font-heading" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--on-surface)' }}>{t.date} : Search Volume Value: {t.value}/100</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Recorded peak interest signal in regional database registry indicators.</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No historical Google Trends data points available.</div>
              )}
            </div>
          </section>

          {/* 6. Risk Assessment */}
          <section id="risks" className="scroll-mt-32" style={{ marginBottom: '5rem' }}>
            <h2 className="font-heading" style={{ fontSize: '1.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>warning</span>
              Risk & Exposure Analysis
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '1.5rem', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Structural Volatility</span>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginTop: '1rem' }}>
                    {analysis.risk_analysis}
                  </p>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>
                  <span className="material-symbols-outlined">trending_up</span>
                  <span>Impact: Severe Exposure ({scores.risk}/100)</span>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '2rem', border: '1px solid var(--outline-variant)', borderRadius: '1.5rem', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Regulatory Friction</span>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginTop: '1rem' }}>
                    Regional policy changes, trademark availability checks and tax guidelines may increase initial capital overhead by 15-20%.
                  </p>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', fontWeight: 700, fontSize: '0.85rem' }}>
                  <span className="material-symbols-outlined">horizontal_rule</span>
                  <span>Impact: Moderate Friction</span>
                </div>
              </div>
            </div>
          </section>

          {/* 7. Final Recommendation & Signature */}
          <section id="final-recommendation" className="scroll-mt-32" style={{ marginBottom: '5rem' }}>
            <div style={{ background: 'var(--primary)', color: '#fff', borderRadius: '2rem', padding: '3.5rem', boxShadow: 'var(--shadow-xl)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px', pointerEvents: 'none' }}></div>
              <div style={{ relative: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                    <span className="material-symbols-outlined text-white" style={{ fontSize: '24px' }}>psychology</span>
                  </div>
                  <h3 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>BizVision Intelligence Signature</h3>
                </div>
                
                <p className="font-body" style={{ fontSize: '1.25rem', fontWeight: 300, fontStyle: 'italic', lineHeight: '1.7', color: 'rgba(255, 255, 255, 0.95)' }}>
                  "{analysis.final_recommendation}"
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '2rem', marginTop: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>SYSTEM VALIDATED</span>
                    <div style={{ height: '3rem', marginTop: '0.5rem', opacity: 0.85 }}>
                      <img 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBChH-Z6PvOjk4DnzvNG10zcSgN9gJclXuoSnwz7c6f_dclaJufIC8PlpVnfxH7BIMKBSUkB_rF6vzQu2XTp5PkCIFKtG320O6HgKF94Av-pQLIGWOaPI--u64QrV81VGenfOLshfYgEjoLPJOcKeaNJAJyJX-qIhSAZAhhYI-kUZzLM-HDRVv4lcRDxKq9KxI1cva_8Tuj70HvzykKRhQbmkV3-nfK9oOW-E_HIrSRVKlLfoH6ZC6mwJd9vvwm4ecr8yJqfkLfw6g" 
                        alt="Digital signature" 
                        style={{ height: '100%', objectFit: 'contain', filter: 'invert(1) brightness(2)' }}
                      />
                    </div>
                    <span style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'rgba(255, 255, 255, 0.8)', marginTop: '0.5rem' }}>ID: BVI-ALPHA-9921-X</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </main>

        {/* Right Sidebar Table of Contents */}
        <aside style={{ gridColumn: 'span 3', position: 'sticky', top: '120px', height: 'fit-content' }} className="hidden xl:block no-print">
          <div className="glass-panel" style={{ padding: '2rem', border: '1px solid var(--outline-variant)', borderRadius: '1.5rem', background: '#fff' }}>
            <h3 style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.15em', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Report Sections</h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <a 
                href="#cover" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: activeSection === 'cover' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeSection === 'cover' ? 'var(--primary)' : 'var(--outline-variant)', transition: 'all 0.2s' }}></span>
                <span>Cover Page</span>
              </a>

              <a 
                href="#executive-summary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: activeSection === 'executive-summary' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeSection === 'executive-summary' ? 'var(--primary)' : 'var(--outline-variant)', transition: 'all 0.2s' }}></span>
                <span>Executive Summary</span>
              </a>

              {business_names && business_names.length > 0 && (
                <a 
                  href="#brand-names" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: activeSection === 'brand-names' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeSection === 'brand-names' ? 'var(--primary)' : 'var(--outline-variant)', transition: 'all 0.2s' }}></span>
                  <span>Brand Diagnostics</span>
                </a>
              )}

              <a 
                href="#market-analysis" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: activeSection === 'market-analysis' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeSection === 'market-analysis' ? 'var(--primary)' : 'var(--outline-variant)', transition: 'all 0.2s' }}></span>
                <span>Market Addressability</span>
              </a>

              <a 
                href="#competition" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: activeSection === 'competition' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeSection === 'competition' ? 'var(--primary)' : 'var(--outline-variant)', transition: 'all 0.2s' }}></span>
                <span>Competitive Landscape</span>
              </a>

              <a 
                href="#trends" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: activeSection === 'trends' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeSection === 'trends' ? 'var(--primary)' : 'var(--outline-variant)', transition: 'all 0.2s' }}></span>
                <span>Trend Timeline</span>
              </a>

              <a 
                href="#risks" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: activeSection === 'risks' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeSection === 'risks' ? 'var(--primary)' : 'var(--outline-variant)', transition: 'all 0.2s' }}></span>
                <span>Risk & Exposure</span>
              </a>

              <a 
                href="#final-recommendation" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: activeSection === 'final-recommendation' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeSection === 'final-recommendation' ? 'var(--primary)' : 'var(--outline-variant)', transition: 'all 0.2s' }}></span>
                <span>Final Recommendation</span>
              </a>
            </nav>
          </div>
        </aside>

      </div>

    </div>
  );
}
