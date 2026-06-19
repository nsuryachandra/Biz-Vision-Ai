import React, { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Disable on touch/coarse devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const container = containerRef.current;
    if (!container) return;

    // Create the SVG overlay
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'gooey-cursor-svg');
    svg.innerHTML = `
      <defs>
        <!-- The magic gooey filter -->
        <filter id="gooey-filter">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
        <!-- Glow filter for premium neon aura -->
        <filter id="cursor-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#gooey-filter)">
        <!-- Outer trailing blob -->
        <circle id="cursor-trail" cx="0" cy="0" r="16" fill="url(#trail-grad)" />
        <!-- Core lead dot -->
        <circle id="cursor-core" cx="0" cy="0" r="7" fill="url(#core-grad)" />
      </g>
    `;

    // Define gradients
    const defs = svg.querySelector('defs');
    
    const coreGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    coreGrad.setAttribute('id', 'core-grad');
    coreGrad.innerHTML = `
      <stop offset="0%" stop-color="#818CF8" />
      <stop offset="100%" stop-color="#4F46E5" />
    `;
    defs.appendChild(coreGrad);

    const trailGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    trailGrad.setAttribute('id', 'trail-grad');
    trailGrad.innerHTML = `
      <stop offset="0%" stop-color="#A78BFA" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#EC4899" stop-opacity="0.75" />
    `;
    defs.appendChild(trailGrad);

    container.appendChild(svg);

    const core = svg.getElementById('cursor-core');
    const trail = svg.getElementById('cursor-trail');

    // Tracking position state
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let corePos = { x: mouse.x, y: mouse.y };
    let trailPos = { x: mouse.x, y: mouse.y };

    // Springs for buttery smooth organic motion
    const coreEase = 0.22;
    const trailEase = 0.085; // trails behind more for stretching

    let isHovering = false;
    let isClicking = false;
    let targetRadius = 16;
    let currentRadius = 16;

    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const onMouseDown = () => {
      isClicking = true;
      targetRadius = 10; // squash on click
    };

    const onMouseUp = () => {
      isClicking = false;
      targetRadius = isHovering ? 26 : 16;
    };

    // Hover elements selector
    const hoverSelector = 'a, button, input, textarea, select, [role="button"], .suggestion-tag, .nav-link, .bento-card, .kpi, .name-card, .scorecard-item';

    const onMouseEnterTarget = () => {
      isHovering = true;
      targetRadius = 26; // expand trail on hover
    };

    const onMouseLeaveTarget = () => {
      isHovering = false;
      targetRadius = 16;
    };

    const bindHoverEvents = () => {
      document.querySelectorAll(hoverSelector).forEach((el) => {
        el.removeEventListener('mouseenter', onMouseEnterTarget);
        el.removeEventListener('mouseleave', onMouseLeaveTarget);
        el.addEventListener('mouseenter', onMouseEnterTarget);
        el.addEventListener('mouseleave', onMouseLeaveTarget);
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    bindHoverEvents();
    const observer = new MutationObserver(bindHoverEvents);
    observer.observe(document.body, { childList: true, subtree: true });

    let animId;
    const updateCursor = () => {
      // 1. Interpolate core (closely follows mouse)
      corePos.x += (mouse.x - corePos.x) * coreEase;
      corePos.y += (mouse.y - corePos.y) * coreEase;

      // 2. Interpolate trail (lagging behind)
      trailPos.x += (mouse.x - trailPos.x) * trailEase;
      trailPos.y += (mouse.y - trailPos.y) * trailEase;

      // 3. Smooth radius sizing transitions
      currentRadius += (targetRadius - currentRadius) * 0.15;
      trail.setAttribute('r', String(currentRadius));

      // 4. Update elements attributes
      core.setAttribute('transform', `translate(${corePos.x}, ${corePos.y})`);
      trail.setAttribute('transform', `translate(${trailPos.x}, ${trailPos.y})`);

      // Hover color modifications
      if (isHovering) {
        core.setAttribute('fill', '#F43F5E'); // Rose core
        trail.setAttribute('fill', 'url(#trail-grad-hover)');
      } else {
        core.setAttribute('fill', 'url(#core-grad)');
        trail.setAttribute('fill', 'url(#trail-grad)');
      }

      animId = requestAnimationFrame(updateCursor);
    };

    // Create Hover Gradient dynamically
    const hoverGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    hoverGrad.setAttribute('id', 'trail-grad-hover');
    hoverGrad.innerHTML = `
      <stop offset="0%" stop-color="#F43F5E" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#FB7185" stop-opacity="0.6" />
    `;
    defs.appendChild(hoverGrad);

    animId = requestAnimationFrame(updateCursor);

    // CSS Styling Injection for the overlay
    const style = document.createElement('style');
    style.id = 'gooey-cursor-styles';
    style.innerHTML = `
      .gooey-cursor-svg {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 999999;
        will-change: transform;
      }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      observer.disconnect();
      cancelAnimationFrame(animId);
      container.innerHTML = '';
      style.remove();
    };
  }, []);

  return <div ref={containerRef} className="gooey-cursor-container" />;
}
