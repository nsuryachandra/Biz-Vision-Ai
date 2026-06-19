import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for Tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Interfaces
 */
type StepStatus = 'completed' | 'active' | 'pending';

interface Step {
  label: string;
  status: StepStatus;
  icon: string;
  detail?: string;
}

interface StatusItemProps {
  step: Step;
  index: number;
}

interface CircularProgressProps {
  currentStepIndex: number;
  totalSteps: number;
}

/**
 * Sub-components
 */

const CircularProgress: React.FC<CircularProgressProps> = ({ currentStepIndex, totalSteps }) => {
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

const StatusItem: React.FC<StatusItemProps> = ({ step }) => {
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

/**
 * Main Component
 */
const AIProcessing2: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(2);
  const [progressPercentage, setProgressPercentage] = useState(66);
  const [timeRemaining, setTimeRemaining] = useState(12);
  
  const steps: Step[] = [
    { label: 'Parsing startup parameters: "Organic pet food in Hyderabad"', status: 'completed', icon: 'lucide:check-circle-2' },
    { label: 'Aggregating local demographic data', status: 'completed', icon: 'lucide:check-circle-2' },
    { label: 'Analyzing competitor market share...', status: 'active', icon: 'lucide:loader-2' },
    { label: 'Calculating financial risk models', status: 'pending', icon: 'lucide:circle' },
    { label: 'Generating executive summary', status: 'pending', icon: 'lucide:circle' }
  ];

  const [currentSteps, setCurrentSteps] = useState<Step[]>(steps);

  const handleStepTransition = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setProgressPercentage(Math.round(((nextIndex + 1) / steps.length) * 100));
      
      const updatedSteps = currentSteps.map((step, idx) => {
        if (idx < nextIndex) return { ...step, status: 'completed' as StepStatus };
        if (idx === nextIndex) return { ...step, status: 'active' as StepStatus };
        return { ...step, status: 'pending' as StepStatus };
      });
      setCurrentSteps(updatedSteps);
    } else if (currentStepIndex === steps.length - 1) {
      // Final completion
      setProgressPercentage(100);
      const finalSteps = currentSteps.map(step => ({ ...step, status: 'completed' as StepStatus }));
      setCurrentSteps(finalSteps);
      onProcessingComplete();
    }
  }, [currentStepIndex, currentSteps, steps.length]);

  const onProcessingComplete = () => {
    // Simulate navigation or final state
    setTimeout(() => {
      alert("Processing Complete! Redirecting to results...");
    }, 500);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const transitionTimer = setInterval(() => {
      if (currentStepIndex < steps.length) {
        handleStepTransition();
      }
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(transitionTimer);
    };
  }, [currentStepIndex, handleStepTransition, steps.length]);

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

        <p className="mt-8 text-sm font-semibold text-muted-foreground uppercase tracking-widest animate-pulse">
          Estimated time remaining: {timeRemaining}s
        </p>

        {/* Manual Trigger for Demo Purposes */}
        <button 
          onClick={handleStepTransition}
          className="mt-6 px-4 py-2 text-xs font-bold text-indigo-600/40 hover:text-indigo-600 transition-colors uppercase tracking-widest"
        >
          Force Next Step
        </button>
      </div>
    </div>
  );
};

export default AIProcessing2;