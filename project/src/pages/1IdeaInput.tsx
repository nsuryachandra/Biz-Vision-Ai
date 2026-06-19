import React, { useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for Tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Sub-components ---

const BackgroundGradients: React.FC = () => (
  <>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] -z-10 pointer-events-none" />
    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
  </>
);

const StatusBadge: React.FC = () => (
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

const Navigation: React.FC<{ onSignIn: () => void; onGetStarted: () => void }> = ({ onSignIn, onGetStarted }) => (
  <nav className="w-full px-8 py-6 flex items-center justify-between z-20 relative">
    <div className="flex items-center gap-3 cursor-pointer group">
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
        <Icon icon="lucide:sparkles" className="text-white text-xl" />
      </div>
      <span className="text-2xl font-extrabold tracking-tight">BizVision AI</span>
    </div>
    <div className="hidden md:flex items-center gap-8">
      <a href="#" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Product</a>
      <a href="#" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
      <a href="#" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Enterprise</a>
      <div className="h-5 w-px bg-border"></div>
      <button 
        onClick={onSignIn}
        className="text-sm font-semibold text-foreground hover:text-indigo-600 transition-colors"
      >
        Sign In
      </button>
      <button 
        onClick={onGetStarted}
        className="text-sm font-bold bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
      >
        Get Started
      </button>
    </div>
    {/* Mobile Menu Toggle (Visual Only) */}
    <div className="md:hidden">
      <Icon icon="lucide:menu" className="text-2xl text-foreground" />
    </div>
  </nav>
);

const FeatureTrustBar: React.FC = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.8, duration: 0.5 }}
    className="mt-24 flex flex-wrap items-center justify-center gap-8 md:gap-12 text-muted-foreground/60 font-semibold text-sm uppercase tracking-widest"
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

// --- Main Component ---

const OneIdeaInput: React.FC = () => {
  const [startupIdea, setStartupIdea] = useState<string>("I want to start an organic pet food business in Hyderabad.");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartupIdea(e.target.value);
  };

  const handleAnalyze = useCallback(() => {
    if (!startupIdea.trim()) return;
    
    setIsAnalyzing(true);
    // Simulate AI Analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      alert(`Analysis complete for: "${startupIdea}"\n\nRedirecting to dashboard...`);
    }, 2000);
  }, [startupIdea]);

  const handleSignIn = () => {
    console.log("Redirecting to Sign In...");
    // In a real app: navigate('/signin')
  };

  const handleGetStarted = () => {
    console.log("Starting onboarding process...");
    // In a real app: navigate('/onboarding')
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative overflow-hidden font-sans text-foreground">
      <Navigation onSignIn={handleSignIn} onGetStarted={handleGetStarted} />

      <main className="flex-1 flex flex-col items-center justify-center relative px-6 z-10 w-full max-w-7xl mx-auto pb-20">
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
          className="text-lg md:text-2xl text-muted-foreground text-center max-w-3xl leading-relaxed mb-16 font-medium"
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
                "w-full md:w-auto bg-primary hover:bg-slate-900 text-primary-foreground font-bold text-lg px-10 py-5 rounded-full shadow-lg transition-all flex items-center justify-center gap-3 md:ml-2 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed",
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

        <FeatureTrustBar />
      </main>

      {/* Footer / Bottom Gradient */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  );
};

export default OneIdeaInput;

/**
 * Note: The component name "1IdeaInput" was converted to "OneIdeaInput" 
 * to comply with JavaScript identifier rules (cannot start with a number).
 */