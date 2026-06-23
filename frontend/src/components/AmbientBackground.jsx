import React from 'react';
import { motion } from 'framer-motion';

// Premium ambient background with floating gradients and particles
export default function AmbientBackground({ variant = 'default' }) {
  const gradients = {
    default: [
      { from: 'indigo-500', to: 'purple-500', position: 'top-0 left-0' },
      { from: 'cyan-500', to: 'blue-500', position: 'bottom-0 right-0' },
      { from: 'violet-500', to: 'indigo-500', position: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' }
    ],
    hero: [
      { from: 'indigo-600', to: 'purple-600', position: 'top-0 left-0' },
      { from: 'cyan-500', to: 'teal-500', position: 'bottom-0 right-0' },
      { from: 'violet-600', to: 'indigo-600', position: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' }
    ],
    report: [
      { from: 'slate-200', to: 'slate-300', position: 'top-0 left-0' },
      { from: 'indigo-100', to: 'purple-100', position: 'bottom-0 right-0' }
    ]
  };

  const selectedGradients = gradients[variant] || gradients.default;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base background */}
      <div className="absolute inset-0 bg-background" />

      {/* Floating gradient orbs */}
      {selectedGradients.map((gradient, index) => (
        <motion.div
          key={index}
          className={`absolute ${gradient.position} w-[600px] h-[600px] bg-gradient-to-br from-${gradient.from}/10 via-${gradient.to}/5 to-transparent rounded-full blur-[120px]`}
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8 + index * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.5,
          }}
        />
      ))}

      {/* Ambient particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-indigo-500/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Depth layers */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}

// Floating particles component
export function FloatingParticles({ count = 30, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-500',
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-2 h-2 ${colors[color]} rounded-full opacity-20`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -200, 0],
            x: [0, Math.random() * 100 - 50, 0],
            scale: [0, 1, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Aurora gradient effect
export function AuroraGradient({ className = '' }) {
  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none ${className}`}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 50%, rgba(6, 182, 212, 0.05) 100%)',
        backgroundSize: '200% 200%',
      }}
    />
  );
}
