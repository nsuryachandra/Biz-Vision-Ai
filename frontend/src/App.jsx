import React, { useState, useEffect } from 'react';
import { BrainCircuit, AlertTriangle } from 'lucide-react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ReportView from './components/ReportView';
import './styles/theme.css';

export default function App() {
  const [page, setPage] = useState('landing');
  const [loadingStep, setLoadingStep] = useState(0);
  const [activeReport, setActiveReport] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [error, setError] = useState(null);
  const [currentIdea, setCurrentIdea] = useState('');

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch('http://localhost:5000/history');
        if (res.ok) {
          const list = await res.json();
          if (list && list.length > 0) {
            const reportRes = await fetch(`http://localhost:5000/report/${list[0].report_id}`);
            if (reportRes.ok) {
              const fullReport = await reportRes.json();
              setLatestReport(fullReport);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load latest report:", e);
      }
    };
    fetchLatest();
  }, [page]);

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
    <div className="app-shell" style={{ paddingLeft: '80px' }}>
      {/* Aurora Background */}
      <div className="aurora-bg">
        <div className="aurora-element"></div>
      </div>

      {/* Collapsible Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-screen w-20 hover:w-64 transition-all duration-500 z-50 bg-white/40 dark:bg-on-background/40 backdrop-blur-xl border-r border-outline-variant/10 flex flex-col group overflow-hidden">
        <div className="p-6 mb-10 flex items-center gap-4">
          <div className="min-w-[40px] h-10 bg-primary rounded-lg flex items-center justify-center shadow-xl">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
          </div>
          <span className="font-display text-xl font-bold tracking-tight opacity-0 group-hover:opacity-100 transition-opacity text-primary">BizVision</span>
        </div>
        <nav className="flex-grow flex flex-col gap-4 px-4">
          <button 
            className={`flex items-center gap-4 p-3 rounded-xl transition-all text-left border-none bg-transparent cursor-pointer w-full ${page === 'landing' ? 'nav-active text-primary bg-primary/5' : 'text-secondary hover:text-primary hover:bg-primary/5'}`} 
            onClick={() => setPage('landing')}
            style={{ border: 'none', background: 'transparent', outline: 'none' }}
          >
            <span className="material-symbols-outlined text-2xl">home</span>
            <span className="font-medium opacity-0 group-hover:opacity-100 whitespace-nowrap">Home Portal</span>
          </button>
          <button 
            className={`flex items-center gap-4 p-3 rounded-xl transition-all text-left border-none bg-transparent cursor-pointer w-full ${page === 'dashboard' ? 'nav-active text-primary bg-primary/5' : 'text-secondary hover:text-primary hover:bg-primary/5'}`} 
            onClick={() => setPage('dashboard')}
            style={{ border: 'none', background: 'transparent', outline: 'none' }}
          >
            <span className="material-symbols-outlined text-2xl">dashboard</span>
            <span className="font-medium opacity-0 group-hover:opacity-100 whitespace-nowrap">Command Center</span>
          </button>
        </nav>
        <div className="mt-auto p-4 border-t border-outline-variant/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden">
              <p className="text-sm font-bold truncate text-on-surface">Helena Vance</p>
              <p className="text-[10px] text-primary uppercase font-mono-label font-bold">Active VC</p>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {error && (
          <div style={{ maxWidth: '1200px', width: '100%', margin: '1.5rem auto 0', padding: '0 2rem' }} className="no-print animate-fade-in">
            <div className="error-banner" style={{ marginBottom: 0 }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span style={{ marginLeft: '0.5rem' }}>{error}</span>
              <button onClick={() => setError(null)}>✕</button>
            </div>
          </div>
        )}

        {page === 'landing' && <LandingPage onAnalyze={handleAnalyze} onDashboard={() => setPage('dashboard')} latestReport={latestReport} />}
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
          <div className="page-container" style={{ maxWidth: '1440px', padding: '4rem 2rem' }}>
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
