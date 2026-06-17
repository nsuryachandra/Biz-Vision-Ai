import React, { useState } from 'react';
import { BrainCircuit, AlertTriangle } from 'lucide-react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ReportView from './components/ReportView';
import './styles/theme.css';

export default function App() {
  const [page, setPage] = useState('landing');
  const [loadingStep, setLoadingStep] = useState(0);
  const [activeReport, setActiveReport] = useState(null);
  const [error, setError] = useState(null);
  const [currentIdea, setCurrentIdea] = useState('');

  const steps = [
    'Parsing idea with NLP engine…',
    'Extracting location & industry…',
    'Querying Google Search via SerpAPI…',
    'Fetching Google Trends data…',
    'Analyzing news sentiment…',
    'Scanning local competitors…',
    'Generating AI consulting report…',
  ];

  const runLoader = (cb) => {
    setLoadingStep(0);
    const iv = setInterval(() => {
      setLoadingStep((p) => {
        if (p < steps.length - 1) return p + 1;
        clearInterval(iv);
        cb();
        return p;
      });
    }, 900);
  };

  const handleAnalyze = (text) => {
    setPage('loading');
    setError(null);
    setCurrentIdea(text);
    runLoader(async () => {
      try {
        const res = await fetch('http://localhost:5000/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea_text: text }),
        });
        if (res.ok) {
          setActiveReport(await res.json());
          setPage('report');
        } else {
          const d = await res.json();
          throw new Error(d.error || 'Analysis failed');
        }
      } catch (e) {
        setError(e.message || 'Unable to reach backend on port 5000.');
        setPage('landing');
      }
    });
  };

  const handleSelectReport = (id) => {
    setPage('loading');
    setLoadingStep(5);
    setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:5000/report/${id}`);
        if (res.ok) {
          setActiveReport(await res.json());
          setPage('report');
        } else throw new Error('Report not found');
      } catch (e) {
        setError(e.message);
        setPage('dashboard');
      }
    }, 600);
  };

  return (
    <div className="app-shell">
      <header className="nav">
        <div className="nav-brand" onClick={() => setPage('landing')}>
          <BrainCircuit className="nav-brand-icon" />
          <span className="nav-brand-text">BizVision AI</span>
        </div>
        <nav className="nav-links">
          <span className={`nav-link ${page === 'landing' ? 'active' : ''}`} onClick={() => setPage('landing')}>Home</span>
          <span className={`nav-link ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>Dashboard</span>
        </nav>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {error && (
          <div className="page-container no-print" style={{ paddingBottom: 0 }}>
            <div className="error-banner">
              <AlertTriangle size={16} />
              <span>{error}</span>
              <button onClick={() => setError(null)}>✕</button>
            </div>
          </div>
        )}

        {page === 'landing' && <LandingPage onAnalyze={handleAnalyze} onDashboard={() => setPage('dashboard')} />}
        {page === 'dashboard' && <Dashboard onSelect={handleSelectReport} onAnalyze={handleAnalyze} />}

        {page === 'loading' && (
          <div className="loading-screen">
            <div className="spinner" />
            <h3 style={{ marginBottom: '0.25rem' }}>Analyzing Startup Idea</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '2rem' }}>"{currentIdea}"</p>
            <div className="loading-steps">
              {steps.map((s, i) => (
                <div key={i} className={`load-step ${i === loadingStep ? 'active' : ''} ${i < loadingStep ? 'done' : ''}`}>
                  <div className="load-step-dot">{i < loadingStep ? '✓' : ''}</div>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'report' && activeReport && (
          <div className="page-container">
            <ReportView report={activeReport} onBack={() => setPage('dashboard')} />
          </div>
        )}
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} BizVision AI · Startup Intelligence Platform
      </footer>
    </div>
  );
}
