import React, { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef   = useRef(null);
  const ringRef  = useRef(null);
  const styleRef = useRef(null);

  useEffect(() => {
    // Disable on touch / coarse-pointer devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    // ── Inject CSS ─────────────────────────────────────────────────────────
    const style = document.createElement('style');
    style.id = 'ring-cursor-styles';
    style.innerHTML = `
      *, *::before, *::after { cursor: none !important; }

      .rc-dot {
        position: fixed;
        top: 0; left: 0;
        width: 8px; height: 8px;
        border-radius: 50%;
        background: #818CF8;
        box-shadow: 0 0 8px 2px rgba(129,140,248,0.9);
        pointer-events: none;
        z-index: 999999;
        transform: translate(-50%, -50%);
        will-change: transform;
        transition: width 0.15s ease, height 0.15s ease, background 0.2s ease, box-shadow 0.2s ease;
      }

      .rc-ring {
        position: fixed;
        top: 0; left: 0;
        width: 36px; height: 36px;
        border-radius: 50%;
        border: 2px solid rgba(129,140,248,0.65);
        box-shadow: 0 0 12px 2px rgba(129,140,248,0.25), inset 0 0 8px rgba(129,140,248,0.1);
        pointer-events: none;
        z-index: 999998;
        transform: translate(-50%, -50%);
        will-change: transform;
        transition: width 0.25s cubic-bezier(.25,.46,.45,.94),
                    height 0.25s cubic-bezier(.25,.46,.45,.94),
                    border-color 0.2s ease,
                    box-shadow 0.2s ease,
                    opacity 0.2s ease;
      }

      .rc-ring.is-hovering {
        width: 52px; height: 52px;
        border-color: rgba(244,63,94,0.8);
        box-shadow: 0 0 18px 4px rgba(244,63,94,0.3), inset 0 0 10px rgba(244,63,94,0.1);
      }

      .rc-dot.is-hovering {
        width: 6px; height: 6px;
        background: #F43F5E;
        box-shadow: 0 0 10px 3px rgba(244,63,94,0.9);
      }

      .rc-ring.is-clicking {
        width: 28px; height: 28px;
        border-color: rgba(129,140,248,1);
        box-shadow: 0 0 20px 6px rgba(129,140,248,0.45);
      }

      .rc-dot.is-clicking {
        width: 12px; height: 12px;
        box-shadow: 0 0 14px 4px rgba(129,140,248,1);
      }
    `;
    document.head.appendChild(style);
    styleRef.current = style;

    // ── Create DOM elements ────────────────────────────────────────────────
    const dot  = document.createElement('div');
    dot.className = 'rc-dot';
    const ring = document.createElement('div');
    ring.className = 'rc-ring';
    document.body.appendChild(ring);
    document.body.appendChild(dot);
    dotRef.current  = dot;
    ringRef.current = ring;

    // ── State ──────────────────────────────────────────────────────────────
    let mouse   = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let ringPos = { x: mouse.x, y: mouse.y };
    const RING_EASE = 0.1; // how quickly ring catches up to dot
    let animId;

    // ── Mouse move — dot is instant (CSS transform) ────────────────────────
    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      dot.style.left = `${e.clientX}px`;
      dot.style.top  = `${e.clientY}px`;
    };

    const onMouseDown = () => {
      dot.classList.add('is-clicking');
      ring.classList.add('is-clicking');
    };

    const onMouseUp = () => {
      dot.classList.remove('is-clicking');
      ring.classList.remove('is-clicking');
    };

    // ── Hover detection ────────────────────────────────────────────────────
    const hoverSelector = 'a, button, input, textarea, select, [role="button"], label';

    const onEnter = () => {
      dot.classList.add('is-hovering');
      ring.classList.add('is-hovering');
    };
    const onLeave = () => {
      dot.classList.remove('is-hovering');
      ring.classList.remove('is-hovering');
    };

    const bindHover = () => {
      document.querySelectorAll(hoverSelector).forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });
    };

    bindHover();
    const observer = new MutationObserver(bindHover);
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup',   onMouseUp);

    // ── Animation loop — ring lags smoothly behind dot ─────────────────────
    const tick = () => {
      ringPos.x += (mouse.x - ringPos.x) * RING_EASE;
      ringPos.y += (mouse.y - ringPos.y) * RING_EASE;
      ring.style.left = `${ringPos.x}px`;
      ring.style.top  = `${ringPos.y}px`;
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup',   onMouseUp);
      observer.disconnect();
      cancelAnimationFrame(animId);
      dot.remove();
      ring.remove();
      style.remove();
    };
  }, []);

  return null;
}
