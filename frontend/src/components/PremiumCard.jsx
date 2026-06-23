import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

// Premium Card with 3D tilt effect and hover animations
export function PremiumCard({ children, className = '', onClick = null }) {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  function onMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    x.set(clientX - left - width / 2);
    y.set(clientY - top - height / 2);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }

  const rotateX = useTransform(mouseY, [-200, 200], [5, -5]);
  const rotateY = useTransform(mouseX, [-200, 200], [-5, 5]);

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-0 transition-opacity duration-300"
        animate={{ opacity: isHovered ? 0.6 : 0 }}
      />
      <motion.div
        style={{ transform: 'translateZ(20px)' }}
        className="relative"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// Magnetic Button with smooth follow effect
export function MagneticButton({ children, className = '', onClick = null, variant = 'primary' }) {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 200, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 200, damping: 20 });

  function onMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    x.set(clientX - left - width / 2);
    y.set(clientY - top - height / 2);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }

  const variants = {
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white',
    secondary: 'bg-white text-slate-900 border border-slate-200',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100'
  };

  return (
    <motion.button
      ref={ref}
      className={`relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${variants[variant]} ${className}`}
      style={{
        x: mouseX,
        y: mouseY,
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
    >
      <motion.span
        className="relative z-10"
        animate={{ scale: isHovered ? 1.1 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>
      {variant === 'primary' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl opacity-0"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
}

// Glowing Border Card
export function GlowingCard({ children, className = '', color = 'indigo' }) {
  const colors = {
    indigo: 'from-indigo-500 via-purple-500 to-cyan-500',
    emerald: 'from-emerald-500 via-teal-500 to-cyan-500',
    amber: 'from-amber-500 via-orange-500 to-red-500',
    rose: 'from-rose-500 via-pink-500 to-purple-500'
  };

  return (
    <motion.div
      className={`relative p-[1px] rounded-3xl bg-gradient-to-r ${colors[color]} ${className}`}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-3xl"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
        }}
      />
      <div className="relative bg-white rounded-3xl p-6 h-full">
        {children}
      </div>
    </motion.div>
  );
}

// Floating Element with parallax
export function FloatingElement({ children, delay = 0, duration = 3 }) {
  return (
    <motion.div
      animate={{
        y: [0, -20, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

// Pulse Glow Effect
export function PulseGlow({ children, className = '', color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500'
  };

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`absolute inset-0 ${colors[color]} rounded-full blur-xl opacity-30`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
