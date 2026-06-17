import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, Compass, AlertTriangle, FileText, Calendar, ArrowUpRight } from 'lucide-react';

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

  const kpis = [
    { label: 'Ideas Analyzed', value: metrics.total_ideas_analyzed, icon: <Search size={13} />, color: 'var(--accent)' },
    { label: 'Avg. Viability', value: `${metrics.average_viability_score}`, icon: <ShieldCheck size={13} />, color: 'var(--success)', bar: metrics.average_viability_score, barColor: 'var(--success)' },
    { label: 'Avg. Opportunity', value: `${metrics.average_opportunity_score}`, icon: <Compass size={13} />, color: 'var(--accent-secondary)', bar: metrics.average_opportunity_score, barColor: 'var(--accent-secondary)' },
    { label: 'Avg. Risk', value: `${metrics.average_risk_score}`, icon: <AlertTriangle size={13} />, color: metrics.average_risk_score > 60 ? 'var(--danger)' : 'var(--warning)', bar: metrics.average_risk_score, barColor: metrics.average_risk_score > 60 ? 'var(--danger)' : 'var(--warning)' },
  ];

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h2>Dashboard</h2>
          <p>Aggregated platform intelligence and recent validation reports.</p>
        </div>
      </div>

      <div className="kpi-row">
        {kpis.map((k, i) => (
          <div key={i} className="kpi">
            <div className="kpi-label" style={{ color: k.color }}>{k.icon} {k.label}</div>
            <div className="kpi-value" style={{ color: k.color === 'var(--accent)' ? 'var(--text-primary)' : k.color }}>{k.value}</div>
            {k.bar !== undefined && (
              <div className="kpi-bar">
                <div className="kpi-bar-fill" style={{ width: `${k.bar}%`, background: k.barColor }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={16} style={{ color: 'var(--accent)' }} />
          <h3 style={{ fontSize: '0.95rem' }}>Recent Reports</h3>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            Loading…
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">No validation reports yet. Analyze your first idea from the Home page.</div>
        ) : (
          <table className="reports-table">
            <thead>
              <tr>
                <th>Idea</th>
                <th>Location</th>
                <th>Industry</th>
                <th>Viability</th>
                <th>Risk</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.report_id} onClick={() => onSelect(r.report_id)}>
                  <td style={{ fontWeight: 600, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.idea_text}</td>
                  <td>{r.location}</td>
                  <td>{r.industry}</td>
                  <td><span className={`score-pill ${pillClass(r.viability_score, false)}`}>{r.viability_score}</span></td>
                  <td><span className={`score-pill ${pillClass(r.risk_score, true)}`}>{r.risk_score}</span></td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                    {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </td>
                  <td><ArrowUpRight size={14} style={{ color: 'var(--text-tertiary)' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
