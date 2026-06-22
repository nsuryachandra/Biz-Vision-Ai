import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from '@iconify/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate, useLocation } from 'react-router-dom';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const CircularProgress = ({ currentStepIndex, totalSteps }) => {
  const segments = Array.from({ length: totalSteps });
  const radius = 46;
  const dashArray = "48 241.02"; // Approx 1/5th of circumference for 5 segments

  return (
    <div className="relative w-80 h-80 mb-12 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Base muted segments */}
        {segments.map((_, i) => (
          <circle
            key={`base-${i}`}
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-border/80"
            strokeWidth="1.5"
            strokeDasharray={dashArray}
            transform={`rotate(${i * 72} 50 50)`}
            strokeLinecap="round"
          />
        ))}

        {/* Completed segments */}
        {segments.map((_, i) => (
          i < currentStepIndex && (
            <circle
              key={`completed-${i}`}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-emerald-500 transition-all duration-500"
              strokeWidth="2.5"
              strokeDasharray={dashArray}
              transform={`rotate(${i * 72} 50 50)`}
              strokeLinecap="round"
            />
          )
        ))}

        {/* Active segment */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-indigo-600 animate-pulse transition-all duration-500"
          strokeWidth="3"
          strokeDasharray={dashArray}
          transform={`rotate(${currentStepIndex * 72} 50 50)`}
          strokeLinecap="round"
          filter="url(#glow)"
        />

        {/* Inner tech rings */}
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" className="text-cyan-500/20" strokeWidth="1" strokeDasharray="4 8" />
        <circle 
          cx="50" 
          cy="50" 
          r="38" 
          fill="none" 
          stroke="currentColor" 
          className="text-cyan-500/80 animate-[spin_4s_linear_infinite]" 
          strokeWidth="2" 
          strokeDasharray="10 120" 
          strokeLinecap="round" 
          filter="url(#glow)" 
        />
      </svg>
      
      {/* Center Chip */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-24 bg-white rounded-2xl shadow-[0_0_40px_rgba(79,70,229,0.15)] flex flex-col items-center justify-center animate-pulse border border-border/50 relative overflow-hidden z-10">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/10 to-transparent"></div>
          <Icon icon="lucide:cpu" className="text-3xl text-indigo-600 mb-1 relative z-10" />
          <span className="text-[10px] font-bold text-foreground uppercase tracking-wider relative z-10">AI Core</span>
        </div>
      </div>
    </div>
  );
};

const StatusItem = ({ step }) => {
  const isCompleted = step.status === 'completed';
  const isActive = step.status === 'active';
  const isPending = step.status === 'pending';

  return (
    <div className={cn(
      "flex items-center gap-3 text-sm transition-all duration-300",
      isCompleted && "font-medium text-muted-foreground",
      isActive && "font-bold text-foreground",
      isPending && "font-medium text-muted-foreground opacity-30"
    )}>
      {isCompleted && <Icon icon="lucide:check-circle-2" className="text-emerald-500 text-lg" />}
      {isActive && <Icon icon="lucide:loader-2" className="text-indigo-600 text-lg animate-spin" />}
      {isPending && <Icon icon="lucide:circle" className="text-lg" />}
      <span>{step.label}</span>
    </div>
  );
};

const AIProcessing2 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const ideaText = location.state?.ideaText || "I want to start an organic pet food business in Hyderabad.";

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const apiResultRef = useRef(null);
  const isFinishedRef = useRef(false);

  const steps = [
    { label: `Parsing startup parameters: "${ideaText.slice(0, 40)}${ideaText.length > 40 ? '...' : ''}"`, status: 'active', icon: 'lucide:loader-2' },
    { label: 'Aggregating local demographic data', status: 'pending', icon: 'lucide:circle' },
    { label: 'Analyzing competitor market share', status: 'pending', icon: 'lucide:circle' },
    { label: 'Calculating financial risk models', status: 'pending', icon: 'lucide:circle' },
    { label: 'Generating executive summary', status: 'pending', icon: 'lucide:circle' }
  ];

  const [currentSteps, setCurrentSteps] = useState(steps);

  const handleStepTransition = useCallback(() => {
    setCurrentStepIndex((prevIndex) => {
      if (prevIndex < steps.length - 1) {
        const nextIndex = prevIndex + 1;
        setProgressPercentage(Math.round(((nextIndex + 1) / steps.length) * 100));
        
        setCurrentSteps((prevSteps) =>
          prevSteps.map((step, idx) => {
            if (idx < nextIndex) return { ...step, status: 'completed' };
            if (idx === nextIndex) return { ...step, status: 'active' };
            return { ...step, status: 'pending' };
          })
        );
        return nextIndex;
      } else {
        // We are on the last step
        if (apiResultRef.current && !isFinishedRef.current) {
          isFinishedRef.current = true;
          setProgressPercentage(100);
          setCurrentSteps((prevSteps) => prevSteps.map(step => ({ ...step, status: 'completed' })));
          
          // Complete and navigate
          setTimeout(() => {
            navigate('/intelligence-report', { state: { report: apiResultRef.current } });
          }, 800);
        }
        return prevIndex;
      }
    });
  }, [navigate, steps.length]);

  useEffect(() => {
    // Start backend analyze fetch call
    const triggerAnalysis = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea_text: ideaText }),
        });
        if (res.ok) {
          const data = await res.ok ? await res.json() : null;
          apiResultRef.current = data;
        } else {
          throw new Error('Analysis failed');
        }
      } catch (err) {
        console.error("API Error during analysis:", err);
        alert("Backend analysis failed. Returning to dashboard.");
        navigate('/');
      }
    };

    triggerAnalysis();

    const transitionTimer = setInterval(() => {
      handleStepTransition();
    }, 2500); // Transition step every 2.5s

    return () => {
      clearInterval(transitionTimer);
    };
  }, [ideaText, navigate, handleStepTransition]);

  // Keep checking if API finished early, and steps also finished
  useEffect(() => {
    if (apiResultRef.current && currentStepIndex === steps.length - 1 && !isFinishedRef.current) {
      isFinishedRef.current = true;
      setProgressPercentage(100);
      setCurrentSteps((prevSteps) => prevSteps.map(step => ({ ...step, status: 'completed' })));
      setTimeout(() => {
        navigate('/intelligence-report', { state: { report: apiResultRef.current } });
      }, 800);
    }
  }, [currentStepIndex, steps.length, navigate]);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative items-center justify-center overflow-hidden font-sans text-foreground">
      <style>{`
        @keyframes translateX {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(300%) skewX(-20deg); }
        }
        .animate-shimmer {
          animation: translateX 2s infinite linear;
        }
      `}</style>

      {/* Ambient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] mix-blend-multiply animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Processing Container */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-6">
        
        <CircularProgress currentStepIndex={currentStepIndex} totalSteps={steps.length} />

        {/* Status Text */}
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-4 text-center">
          Synthesizing Intelligence
        </h2>
        
        {/* Terminal / Status Box */}
        <div className="w-full bg-white/60 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 relative overflow-hidden">
          {/* Progress Bar Top Edge */}
          <div className="absolute top-0 left-0 h-1 bg-muted w-full">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-r-full relative overflow-hidden transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
            </div>
          </div>

          <div className="space-y-4 mt-2">
            {currentSteps.map((step, index) => (
              <StatusItem key={index} step={step} index={index} />
            ))}
          </div>
        </div>



      </div>
    </div>
  );
};

export default AIProcessing2;
