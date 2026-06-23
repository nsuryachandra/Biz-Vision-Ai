import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate, Link } from 'react-router-dom';
import FrameSequenceHero from '../components/FrameSequenceHero';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const BackgroundGradients = () => (
  <>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] -z-10 pointer-events-none" />
    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
  </>
);

const StatusBadge = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-md border border-border shadow-sm mb-10"
  >
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-600 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
    </span>
    <span className="text-xs font-bold uppercase tracking-widest text-foreground">Intelligence Engine v2.0 Live</span>
  </motion.div>
);

const Navigation = ({ onGetStarted }) => (
  <nav
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 32px',
      background: 'rgba(255, 255, 255, 0.12)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.18)',
      boxShadow: '0 2px 32px rgba(0,0,0,0.06)',
    }}
  >
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
      <img src="/logo.jpeg" alt="BizVision AI" style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
      <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>BizVision AI</span>
    </Link>
    <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
      <Link to="/" style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}>New Idea</Link>
      <Link to="/history-dashboard" style={{ fontSize: 14, fontWeight: 600, color: '#64748b', textDecoration: 'none' }}>Dashboard</Link>
      <button
        onClick={onGetStarted}
        style={{
          fontSize: 14,
          fontWeight: 700,
          background: '#0f172a',
          color: '#fff',
          padding: '10px 24px',
          borderRadius: 999,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(15,23,42,0.25)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,0.25)'; }}
      >
        Get Started
      </button>
    </div>
  </nav>
);

const FeatureTrustBar = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.8, duration: 0.5 }}
    className="mt-20 flex flex-wrap items-center justify-center gap-8 md:gap-12 text-muted-foreground/60 font-semibold text-sm uppercase tracking-widest"
  >
    <div className="flex items-center gap-2">
      <Icon icon="lucide:check-circle-2" className="text-lg text-indigo-500" /> 
      <span>Real-time Market Data</span>
    </div>
    <div className="flex items-center gap-2">
      <Icon icon="lucide:check-circle-2" className="text-lg text-indigo-500" /> 
      <span>Competitor Analysis</span>
    </div>
    <div className="flex items-center gap-2">
      <Icon icon="lucide:check-circle-2" className="text-lg text-indigo-500" /> 
      <span>Financial Risk Modeling</span>
    </div>
  </motion.div>
);

const OneIdeaInput = () => {
  const [startupIdea, setStartupIdea] = useState("Subscription organic pet food in Hyderabad");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const heroRef = useRef(null);

  const handleInputChange = (e) => {
    setStartupIdea(e.target.value);
  };

  const handleAnalyze = useCallback(() => {
    if (!startupIdea.trim()) return;
    
    setIsAnalyzing(true);
    navigate('/ai-processing', { state: { ideaText: startupIdea } });
  }, [startupIdea, navigate]);

  const handleGetStarted = () => {
    if (heroRef.current) {
      heroRef.current.playAndScroll(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      });
    } else {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  };


  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative overflow-x-hidden font-sans text-foreground">
      {/* Fixed glassmorphic navbar always on top of animation */}
      <Navigation onGetStarted={handleGetStarted} />

      {/* Scroll track + fixed canvas */}
      <FrameSequenceHero ref={heroRef} />

      {/* Hero content appears naturally after scroll track ends */}
      <main className="flex-1 flex flex-col items-center justify-center relative px-6 z-20 w-full max-w-7xl mx-auto pb-20 pt-24">
        <BackgroundGradients />

        <StatusBadge />

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-5xl md:text-8xl font-extrabold tracking-tighter text-center max-w-5xl leading-[1.05] text-foreground mb-8"
        >
          Validate Your Startup <br className="hidden md:block" /> Before You Invest.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg md:text-2xl text-muted-foreground text-center max-w-3xl leading-relaxed mb-12 font-medium"
        >
          Analyze market demand, competitors, trends, product demand, opportunities, and risks using AI-powered startup intelligence.
        </motion.p>

        {/* Interactive Input Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-full max-w-4xl relative group"
        >
          {/* Glow effect behind input */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-600/30 via-cyan-500/30 to-indigo-600/30 rounded-full blur-xl opacity-40 group-hover:opacity-80 transition duration-700 group-hover:duration-300"></div>
          
          <div className="relative flex flex-col md:flex-row items-center bg-white rounded-3xl md:rounded-full p-2.5 shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-border/80 transition-all group-hover:border-indigo-600/30">
            <div className="hidden md:flex pl-8 pr-4 text-indigo-600">
              <Icon icon="lucide:lightbulb" className="text-3xl" />
            </div>
            <input 
              ref={inputRef}
              type="text" 
              value={startupIdea}
              onChange={handleInputChange}
              className="flex-1 bg-transparent border-none outline-none text-lg md:text-xl text-foreground placeholder:text-muted-foreground/60 py-4 md:py-5 px-6 md:px-0 font-medium w-full" 
              placeholder="Describe your startup idea in detail..."
              disabled={isAnalyzing}
            />

            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={cn(
                "w-full md:w-auto bg-primary hover:bg-slate-900 text-primary-foreground font-bold text-lg px-10 py-5 rounded-full shadow-lg transition-all flex items-center justify-center gap-3 md:ml-2 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex-shrink-0",
                isAnalyzing && "animate-pulse"
              )}
            >
              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, rotate: 0 }}
                    animate={{ opacity: 1, rotate: 360 }}
                    exit={{ opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Icon icon="lucide:loader-2" className="text-2xl" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <Icon icon="lucide:cpu" className="text-2xl" />
                    <span>Analyze Idea</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.div>

        {/* Suggestion Tags */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3 max-w-3xl z-10"
        >
          <span className="text-xs font-bold text-muted-foreground/80 flex items-center gap-1.5 mr-1 uppercase tracking-wider">
            <Icon icon="lucide:sparkles" className="text-indigo-500 animate-pulse text-sm" /> Try suggesting:
          </span>
          {[
            { idea: "Pure vegetarian restaurant", location: "Hyderabad" },
            { idea: "Subscription organic pet food", location: "Hyderabad" },
            { idea: "SaaS billing and invoicing dashboard", location: "Hyderabad" },
            { idea: "On-demand laundry and dry cleaning", location: "Hyderabad" }
          ].map((tag, idx) => (
            <button
              key={idx}
              onClick={() => {
                setStartupIdea(`${tag.idea} in ${tag.location}`);
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
              className="text-xs font-semibold px-4 py-2 rounded-full border border-border/80 bg-white/50 backdrop-blur-sm hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] active:scale-95"
            >
              {tag.idea} in {tag.location}
            </button>
          ))}
        </motion.div>

        <FeatureTrustBar />
      </main>

      {/* Footer / Bottom Gradient */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  );
};

export default OneIdeaInput;
