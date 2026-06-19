import React, { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const followerRef = useRef(null);

  useEffect(() => {
    // Disable on mobile/touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const follower = followerRef.current;
    if (!follower) return;

    let mouseX = 0;
    let mouseY = 0;
    let followerX = 0;
    let followerY = 0;
    let isHidden = true;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      if (isHidden) {
        isHidden = false;
        follower.style.opacity = '1';
      }
    };

    const onMouseLeave = () => {
      isHidden = true;
      follower.style.opacity = '0';
    };

    const onMouseEnter = () => {
      isHidden = false;
      follower.style.opacity = '1';
    };

    // Hover state over interactive elements
    const addHoverClass = () => {
      if (follower) {
        follower.style.transform = 'translate(-50%, -50%) scale(2)';
        follower.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
        follower.style.borderColor = 'rgba(99, 102, 241, 0.8)';
        follower.style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.3)';
      }
    };

    const removeHoverClass = () => {
      if (follower) {
        follower.style.transform = 'translate(-50%, -50%) scale(1)';
        follower.style.backgroundColor = 'rgba(99, 102, 241, 0.35)';
        follower.style.borderColor = 'transparent';
        follower.style.boxShadow = '0 0 8px rgba(99, 102, 241, 0.4)';
      }
    };

    // Animation frame loop for hardware-accelerated rendering (lag-free)
    let animationFrameId = 0;
    const render = () => {
      // Smooth linear interpolation for trailing ring
      const ease = 0.14; 
      followerX += (mouseX - followerX) * ease;
      followerY += (mouseY - followerY) * ease;

      follower.style.left = `${followerX}px`;
      follower.style.top = `${followerY}px`;

      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    const updateHoverListeners = () => {
      const targets = document.querySelectorAll('button, a, input, select, textarea, [role="button"], .hover-interactive');
      targets.forEach(target => {
        target.removeEventListener('mouseenter', addHoverClass);
        target.removeEventListener('mouseleave', removeHoverClass);
        target.addEventListener('mouseenter', addHoverClass);
        target.addEventListener('mouseleave', removeHoverClass);
      });
    };

    updateHoverListeners();
    animationFrameId = requestAnimationFrame(render);

    const observer = new MutationObserver(updateHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={followerRef}
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-transparent bg-indigo-500/35 shadow-[0_0_8px_rgba(99,102,241,0.4)] opacity-0 transition-transform duration-300 ease-out will-change-transform"
      style={{ pointerEvents: 'none' }}
    />
  );
}
