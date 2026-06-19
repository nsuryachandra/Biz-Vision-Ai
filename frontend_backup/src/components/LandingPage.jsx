import React, { useState } from 'react';

export default function LandingPage({ onAnalyze, latestReport }) {
  const [idea, setIdea] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const suggestions = [
    'Electric vehicle charger repair in Berlin',
    'Subscription organic pet food in Munich',
    'AI-powered legal document audit SaaS',
    'Premium local bakery delivery in Frankfurt'
  ];

  const submit = (e) => {
    if (e) e.preventDefault();
    if (idea.trim()) onAnalyze(idea);
  };

  const handleSuggestion = (text) => {
    setIdea(text);
    onAnalyze(text);
  };

  const renderTrendsChart = () => {
    const trendPoints = latestReport && latestReport.trends && latestReport.trends.length > 0 ? latestReport.trends : null;
    if (!trendPoints) {
      return (
        <svg width="100%" height="100%" viewBox="0 0 500 140" preserveAspectRatio="none">
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3323cc" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#3323cc" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M 0 100 Q 120 40 250 80 T 500 20 L 500 140 L 0 140 Z" fill="url(#g1)" />
          <path d="M 0 100 Q 120 40 250 80 T 500 20" fill="none" stroke="#3323cc" strokeWidth="3" />
          <circle cx="250" cy="80" r="5" fill="#fff" stroke="#3323cc" strokeWidth="2" />
          <circle cx="500" cy="20" r="5" fill="#fff" stroke="#3323cc" strokeWidth="2" />
        </svg>
      );
    }
    const W = 500, H = 140, P = 20;
    const vals = trendPoints.map(t => Number(t.value) || 0);
    const maxVal = Math.max(...vals);
    const minVal = Math.min(...vals);
    const mx = maxVal === minVal && maxVal === 0 ? 100 : maxVal;
    const mn = minVal;
    
    const range = (mx - mn) || 1;
    const lengthDivider = (trendPoints.length - 1) || 1;

    const pts = trendPoints.map((t, i) => ({
      x: P + (i * (W - 2 * P)) / lengthDivider,
      y: H - P - (((Number(t.value) || 0) - mn) / range) * (H - 2 * P),
    }));
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const area = `${d} L ${pts[pts.length - 1].x} ${H - P} L ${pts[0].x} ${H - P} Z`;
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3323cc" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#3323cc" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={area} fill="url(#g1)" />
        <path d={d} fill="none" stroke="#3323cc" strokeWidth="3" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#fff" stroke="#3323cc" strokeWidth="1.5" />
        ))}
      </svg>
    );
  };

  const renderCompetitorsList = () => {
    const list = latestReport && latestReport.competitors && latestReport.competitors.length > 0 
      ? latestReport.competitors.slice(0, 2) 
      : null;
    if (!list) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div>
              <strong style={{ fontSize: '0.85rem', color: 'var(--on-surface)' }}>BioPet Gourmet Munich</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Traditional storefront & local delivery</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: 'var(--warning)', fontWeight: 700, fontSize: '0.85rem' }}>★ 4.8</span>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>142 reviews</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div>
              <strong style={{ fontSize: '0.85rem', color: 'var(--on-surface)' }}>Munich Organic Kibble Co.</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>E-commerce with standard parcel shipping</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: 'var(--warning)', fontWeight: 700, fontSize: '0.85rem' }}>★ 4.2</span>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>64 reviews</div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {list.map((c, i) => (
          <div key={i} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ minWidth: 0, flex: 1, paddingRight: '1rem' }}>
              <strong style={{ fontSize: '0.85rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--on-surface)' }}>{c.title}</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.address || 'Local competitor'}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{ color: 'var(--warning)', fontWeight: 700, fontSize: '0.85rem' }}>★ {c.rating || 'N/A'}</span>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{c.reviews || 0} reviews</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getDemandLabel = (val) => {
    if (val > 65) return 'High';
    if (val > 40) return 'Moderate';
    return 'Low';
  };

  const getTrendSlope = () => {
    if (!latestReport) return '+42%';
    const val = latestReport.scores.trend;
    const diff = val - 60;
    return (diff >= 0 ? '+' : '') + Math.round(diff * 1.5) + '%';
  };

  return (
    <div className="page-container animate-fade-in hero-gradient-asymmetric" style={{ maxWidth: '1440px', padding: '4rem 2rem' }}>
      
      {/* Hero Content Section */}
      <section className="reveal-on-scroll" style={{ marginBottom: '8rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--spacing-gutter)', alignItems: 'center' }}>
          
          {/* Left Column: Heading and Description */}
          <div style={{ gridColumn: 'span 7' }}>
            <div style={{ marginBottom: 'var(--spacing-stack-md)' }}>
              <span className="inline-block" style={{ background: 'rgba(51, 35, 204, 0.08)', border: '1px solid rgba(51, 35, 204, 0.15)', px: '1rem', py: '0.35rem', borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.35rem 1rem' }}>
                v4.0 Illuminated Intelligence
              </span>
            </div>
            <h1 className="font-heading" style={{ fontSize: 'calc(4vw + 24px)', lineHeight: '0.9', letterSpacing: '-0.04em', marginBottom: 'var(--spacing-stack-lg)', textTransform: 'uppercase' }}>
              Validate Your <br/>
              <span className="text-gradient" style={{ fontStyle: 'italic', fontWeight: 800 }}>Startup</span> <br/>
              <span className="text-stroke">Before You</span> Invest
            </h1>
            <p className="font-body" style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '640px', marginBottom: 'var(--spacing-stack-lg)', lineHeight: '1.6' }}>
              BizVision AI leverages multi-layered neural validation to dissect venture feasibility, market velocity, and structural risk. Professional-grade clarity for the modern VC.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ display: 'flex', marginLeft: '0.5rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-full)', border: '2px solid #fff', background: 'var(--surface-container-high)', display: 'inline-block' }}></div>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-full)', border: '2px solid #fff', background: 'var(--surface-container-high)', display: 'inline-block', marginLeft: '-0.75rem' }}></div>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-full)', border: '2px solid #fff', background: 'var(--surface-container-high)', display: 'inline-block', marginLeft: '-0.75rem' }}></div>
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Trusted by <span style={{ color: 'var(--primary)', fontWeight: 700 }}>400+</span> top-tier investment firms
              </p>
            </div>
          </div>

          {/* Right Column: Search Box & Input Portal */}
          <div className="float-animation" style={{ gridColumn: 'span 5' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '-1rem', bg: 'linear-gradient(to right, var(--primary), var(--surface-tint))', borderRadius: '2.5rem', filter: 'blur(24px)', opacity: 0.1, zIndex: 0 }}></div>
              <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '2rem', boxShadow: 'var(--shadow-xl)', position: 'relative', zIndex: 1, border: '1px solid var(--outline-variant)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                  <div>
                    <h3 className="font-heading" style={{ fontSize: '1.5rem', color: 'var(--on-surface)', fontWeight: 700 }}>Portal Access</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.85rem' }}>Synchronize concept data for validation</p>
                  </div>
                  <span className="material-symbols-outlined" style={{ color: 'rgba(51, 35, 204, 0.25)', fontSize: '2.5rem' }}>target</span>
                </div>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="input-glow" style={{ position: 'relative', border: '1px solid var(--outline-variant)', borderRadius: '1rem', background: 'rgba(255, 255, 255, 0.5)', transition: 'all 0.3s' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.4 }}>insights</span>
                    <input 
                      className="font-mono"
                      style={{ width: '100%', height: '4.5rem', background: 'transparent', border: 'none', paddingLeft: '3.5rem', paddingRight: '1.5rem', fontSize: '0.875rem', outline: 'none', color: 'var(--on-surface)' }}
                      placeholder="Enter concept (e.g. Pet food Munich)..."
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', height: '4.5rem', borderRadius: '1rem', fontWeight: 800, fontSize: '1rem', background: 'var(--primary)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 8px 16px rgba(51,35,204,0.2)' }}
                  >
                    <span>INITIALIZE ENGINE</span>
                    <span className="material-symbols-outlined">bolt</span>
                  </button>
                </form>
                <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                  <span>Status: <span style={{ color: '#10b981', fontWeight: 700 }}>Ready</span></span>
                  <span>AES-256 SECURED</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Suggestion & Examples Block */}
      <div className="suggestions-box animate-fade-in-up-delay-2" style={{ marginBottom: '8rem' }}>
        <span className="suggestions-label" style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '11px', color: 'var(--primary)' }}>Select Suggestion Protocol:</span>
        <div className="suggestions-list" style={{ marginTop: '0.5rem' }}>
          {suggestions.map((s, idx) => (
            <button key={idx} className="suggestion-tag" onClick={() => handleSuggestion(s)} style={{ fontFamily: 'var(--font-body)', padding: '0.5rem 1.25rem', border: '1px solid var(--outline-variant)', background: '#fff', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Mockup Preview Widget */}
      <div className="preview-container animate-fade-in-up-delay-2" style={{ marginBottom: '8rem' }}>
        <div className="preview-card" style={{ border: '1px solid var(--outline-variant)', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}>
          <div className="preview-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface-container-low)' }}>
            <div className="preview-dots" style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="preview-dot green" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
              <span className="preview-dot yellow" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308' }}></span>
              <span className="preview-dot red" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></span>
            </div>
            <div className="preview-tabs" style={{ display: 'flex', gap: '0.5rem' }}>
              <button className={`preview-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')} style={{ padding: '0.5rem 1.25rem', border: 'none', background: activeTab === 'overview' ? 'var(--primary)' : 'transparent', color: activeTab === 'overview' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.8rem' }}>Overview</button>
              <button className={`preview-tab-btn ${activeTab === 'trends' ? 'active' : ''}`} onClick={() => setActiveTab('trends')} style={{ padding: '0.5rem 1.25rem', border: 'none', background: activeTab === 'trends' ? 'var(--primary)' : 'transparent', color: activeTab === 'trends' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.8rem' }}>Google Trends</button>
              <button className={`preview-tab-btn ${activeTab === 'competitors' ? 'active' : ''}`} onClick={() => setActiveTab('competitors')} style={{ padding: '0.5rem 1.25rem', border: 'none', background: activeTab === 'competitors' ? 'var(--primary)' : 'transparent', color: activeTab === 'competitors' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.8rem' }}>Competitors</button>
            </div>
            <div className="preview-status" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', fontWeight: 700 }}>
              <span className="status-indicator-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', marginRight: '0.5rem' }}></span>
              {latestReport ? 'Live Database: Latest Analysis' : 'Demo Sandbox'}
            </div>
          </div>
          
          <div className="preview-card-content" style={{ padding: '2.5rem' }}>
            {activeTab === 'overview' && (
              <div className="tab-pane animate-fade-in">
                <div className="preview-card-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem' }}>
                  <div className="preview-sidebar" style={{ borderRight: '1px solid var(--border)', paddingRight: '2.5rem' }}>
                    <div className="preview-meta-label" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Startup Idea</div>
                    <div className="preview-meta-value font-heading" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {latestReport ? latestReport.metadata.idea_text : 'Organic Pet Food Delivery'}
                    </div>
                    <div className="preview-meta-label" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginBottom: '0.25rem', marginTop: '1.5rem' }}>Location</div>
                    <div className="preview-meta-value font-heading" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--on-surface)' }}>
                      {latestReport ? latestReport.metadata.location : 'Munich, Germany'}
                    </div>
                    <div className="preview-meta-label" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginBottom: '0.25rem', marginTop: '1.5rem' }}>Viability Index</div>
                    <div className="preview-score-badge font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
                      {latestReport ? latestReport.scores.viability : 87} / 100
                    </div>
                  </div>
                  <div className="preview-main">
                    <div className="preview-section-title font-heading" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--on-surface)' }}>Validation Overview</div>
                    <div className="preview-metric-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div className="preview-metric" style={{ background: 'var(--surface-container-low)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                        <div className="preview-metric-val font-heading" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--on-surface)' }}>
                          {latestReport ? getDemandLabel(latestReport.scores.demand) : 'High'}
                        </div>
                        <div className="preview-metric-lbl" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Market Demand</div>
                      </div>
                      <div className="preview-metric" style={{ background: 'var(--surface-container-low)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                        <div className="preview-metric-val font-heading" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--on-surface)' }}>
                          {latestReport ? latestReport.competitors.length : 12}
                        </div>
                        <div className="preview-metric-lbl" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Competitors</div>
                      </div>
                      <div className="preview-metric" style={{ background: 'rgba(51, 35, 204, 0.05)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(51, 35, 204, 0.15)' }}>
                        <div className="preview-metric-val font-heading" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                          {getTrendSlope()}
                        </div>
                        <div className="preview-metric-lbl" style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem' }}>Interest Slope</div>
                      </div>
                    </div>
                    <div className="preview-text-block italic" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', background: 'var(--surface-container-low)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)', lineHeight: '1.6' }}>
                      {latestReport 
                        ? latestReport.analysis.executive_summary.split('.')[0] + '.' 
                        : '"Excellent alignment between regional health-conscious demographics and premium pet product search volumes."'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="tab-pane animate-fade-in" style={{ padding: '1rem 0' }}>
                <div className="preview-section-title font-heading" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--on-surface)' }}>Interest Over Time (12 Months)</div>
                <div style={{ height: '140px', width: '100%', position: 'relative' }}>
                  {renderTrendsChart()}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                  <span>12 Months Ago</span>
                  <span style={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span className="material-symbols-outlined text-sm">trending_up</span> Peak Interest Reached
                  </span>
                  <span>Present</span>
                </div>
              </div>
            )}

            {activeTab === 'competitors' && (
              <div className="tab-pane animate-fade-in" style={{ padding: '1rem 0' }}>
                <div className="preview-section-title font-heading" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--on-surface)' }}>Local Competitive Landscape</div>
                {renderCompetitorsList()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bento Grid: Living Data Modules Section */}
      <section className="reveal-on-scroll" style={{ marginBottom: '8rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '4rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--primary)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>System Architecture</span>
          <h2 className="font-heading" style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '0.5rem', textTransform: 'uppercase' }}>Living Data Modules</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', marginTop: '1rem', lineHeight: '1.6' }}>Precision tools for VCs and founders to de-risk startup investments through real-time multi-dimensional analytics.</p>
        </div>

        {/* Bento Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
          
          {/* Bento Opportunity Card */}
          <div className="bento-card glass-panel" style={{ gridColumn: 'span 8', padding: '2.5rem', height: '420px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--outline-variant)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--primary)', background: 'rgba(51, 35, 204, 0.08)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', textTransform: 'uppercase', fontWeight: 700 }}>Mod-01</span>
                <h3 className="font-heading" style={{ fontSize: '2rem', marginTop: '1.25rem', fontWeight: 800 }}>Market Opportunity</h3>
              </div>
              <span className="material-symbols-outlined text-primary" style={{ opacity: 0.3, fontSize: '3rem' }}>trending_up</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '480px', lineHeight: '1.6' }}>
              Real-time market vacuum detection using asymmetrical Google Trends mapping. Find the structural demand gaps before the market saturates.
            </p>
            <div style={{ display: 'flex', items: 'center', gap: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--outline-variant)' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Signal Strength</span>
                <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>98.2%</span>
              </div>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Growth Velocity</span>
                <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.25rem' }}>12.4x</span>
              </div>
            </div>
          </div>

          {/* Bento Validation Card */}
          <div className="bento-card" style={{ gridColumn: 'span 4', background: 'var(--on-background)', color: '#fff', borderRadius: '1.5rem', padding: '2.5rem', height: '420px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, padding: '2.5rem', opacity: 0.05 }}>
              <span className="material-symbols-outlined text-white" style={{ fontSize: '6.5rem' }}>verified</span>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--primary-fixed-dim)', border: '1px solid rgba(195, 192, 255, 0.3)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', textTransform: 'uppercase', fontWeight: 700 }}>Mod-02</span>
              <h3 className="font-heading" style={{ fontSize: '2rem', marginTop: '1.25rem', fontWeight: 800 }}>Validation</h3>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '1.1rem', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>
              Cross-referencing technical feasibility metrics with historical success patterns and failure benchmarks.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', position: 'relative', zIndex: 1 }}>
              <span style={{ background: 'rgba(255,255,255,0.05)', fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NLP Analysis</span>
              <span style={{ background: 'rgba(255,255,255,0.05)', fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Founder KPI</span>
            </div>
          </div>

          {/* Bento Competitor Card */}
          <div className="bento-card glass-panel" style={{ gridColumn: 'span 5', padding: '2.5rem', height: '420px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--outline-variant)' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--primary)', background: 'rgba(51, 35, 204, 0.08)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', textTransform: 'uppercase', fontWeight: 700 }}>Mod-03</span>
              <h3 className="font-heading" style={{ fontSize: '2rem', marginTop: '1.25rem', fontWeight: 800 }}>Competitor Matrix</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
              Deep crawl algorithms tracking local business entities, reviews, and competitive density ratios instantly.
            </p>
            <div style={{ background: 'var(--surface-container-low)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Density Landscape</span>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--error)', fontWeight: 700 }}>CRITICAL RISK</span>
              </div>
              <div style={{ height: '0.75rem', bg: 'var(--surface-container-high)', borderRadius: 'var(--radius-full)', overflow: 'hidden', background: '#dde9ff' }}>
                <div style={{ height: '100%', bg: 'var(--primary)', width: '75%', borderRadius: 'var(--radius-full)', background: 'var(--primary)' }}></div>
              </div>
            </div>
          </div>

          {/* Bento Failure Card */}
          <div className="bento-card glass-panel" style={{ gridColumn: 'span 7', display: 'flex', border: '1px solid var(--outline-variant)', overflow: 'hidden', height: '420px' }}>
            <div style={{ width: '50%', padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--error)', background: 'var(--error-container)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', textTransform: 'uppercase', fontWeight: 700 }}>Mod-04</span>
                <h3 className="font-heading" style={{ fontSize: '2rem', marginTop: '1.25rem', fontWeight: 800 }}>Risk Modeling</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
                Inverse forecasting trained on 50,000+ failed models to expose critical operational vulnerabilities.
              </p>
              <div style={{ display: 'flex', items: 'center', gap: '0.5rem', color: 'var(--error)', fontWeight: 700, fontSize: '0.85rem' }}>
                <span className="material-symbols-outlined">warning</span>
                <span>Anomalies Modeled</span>
              </div>
            </div>
            <div style={{ width: '50%', background: 'var(--surface-container-highest)', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="ai-pulse" style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', border: '1px solid var(--primary-container)' }}>
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '3rem' }}>target</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Section: Start Seeing Clearly */}
      <section className="reveal-on-scroll" style={{ marginBottom: '4rem' }}>
        <div style={{ relative: 'relative', overflow: 'hidden', borderRadius: '2.5rem', background: 'var(--primary)', color: '#fff', padding: '5rem 3rem', textAlign: 'center', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 className="font-heading" style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#fff' }}>Start Seeing Clearly.</h2>
            <p style={{ color: 'var(--primary-fixed)', maxWidth: '600px', mx: 'auto', marginBottom: '2.5rem', fontSize: '1.2rem', lineHeight: '1.6', margin: '0 auto 2.5rem' }}>
              Join the world's most sophisticated investors using BizVision AI to de-risk their portfolio in real-time.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: '#fff', color: 'var(--primary)', border: 'none', padding: '1rem 2.5rem', borderRadius: '1rem', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>Get Started Free</button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
