import { useEffect, useRef } from 'react';

const N = 40;
const SVG = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';

const DEFS = `<defs>
  <!-- Glow Filter -->
  <filter id="d-glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="3" result="blur" />
    <feComponentTransfer in="blur" result="glow">
      <feFuncA type="linear" slope="1.5" />
    </feComponentTransfer>
    <feMerge>
      <feMergeNode in="glow" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>

  <!-- Gradients -->
  <linearGradient id="headGrad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#8b5cf6" />
    <stop offset="50%" stop-color="#3b82f6" />
    <stop offset="100%" stop-color="#06b6d4" />
  </linearGradient>

  <linearGradient id="hornGrad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#ec4899" />
    <stop offset="100%" stop-color="#8b5cf6" />
  </linearGradient>

  <linearGradient id="wingGrad1" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.85"/>
    <stop offset="100%" stop-color="#4f46e5" stop-opacity="0.85"/>
  </linearGradient>

  <linearGradient id="wingGrad2" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.9"/>
    <stop offset="100%" stop-color="#d946ef" stop-opacity="0.9"/>
  </linearGradient>

  <linearGradient id="spineGrad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#3b82f6" />
    <stop offset="100%" stop-color="#06b6d4" />
  </linearGradient>

  <!-- Cabeza (Head) -->
  <g id="d-head">
    <!-- Horns -->
    <path fill="url(#hornGrad)" d="M-12,-4 C-25,-12 -38,-15 -42,-12 C-38,-6 -25,-2 -12,-4 Z" />
    <path fill="url(#hornGrad)" d="M-12,4 C-25,12 -38,15 -42,12 C-38,6 -25,2 -12,4 Z" />
    <!-- Cybernetic crest -->
    <polygon points="-8,-5 12,0 -8,5 -15,0" fill="url(#headGrad)" />
    <!-- Main head shell -->
    <path fill="url(#headGrad)" d="M-22,-8 C-10,-10 8,-5 20,0 C8,5 -10,10 -22,8 C-16,3 -16,-3 -22,-8 Z" />
    <!-- Glowing neon eyes -->
    <circle cx="6" cy="-4" r="2.5" fill="#00ffff" filter="url(#d-glow)" />
    <circle cx="6" cy="4" r="2.5" fill="#00ffff" filter="url(#d-glow)" />
    <!-- Sleek sensory whiskers -->
    <path stroke="#00ffff" stroke-width="1.5" fill="none" d="M10,-2 C20,-6 30,-5 35,-3" opacity="0.8" filter="url(#d-glow)" />
    <path stroke="#00ffff" stroke-width="1.5" fill="none" d="M10,2 C20,6 30,5 35,3" opacity="0.8" filter="url(#d-glow)" />
  </g>

  <!-- Aletas (Fins/Wings) -->
  <g id="d-fin">
    <!-- Wing blade left -->
    <path fill="url(#wingGrad1)" d="M20,-10 C-10,-50 -45,-85 -70,-105 C-55,-65 -25,-30 -10,-15 Z" />
    <!-- Wing blade right -->
    <path fill="url(#wingGrad1)" d="M20,10 C-10,50 -45,85 -70,105 C-55,65 -25,30 -10,15 Z" />
    <!-- Energy thruster overlays -->
    <path fill="url(#wingGrad2)" d="M10,-8 C-15,-40 -40,-70 -60,-85 C-48,-50 -20,-20 -5,-10 Z" opacity="0.9" />
    <path fill="url(#wingGrad2)" d="M10,8 C-15,40 -40,70 -60,85 C-48,50 -20,20 -5,10 Z" opacity="0.9" />
    <!-- Center energy nexus -->
    <polygon points="-8,0 0,-8 8,0 0,8" fill="#ffffff" filter="url(#d-glow)" />
  </g>

  <!-- Espina (Spine/Body segments) -->
  <g id="d-spine">
    <!-- Sleek chevron scale shell -->
    <path fill="url(#spineGrad)" d="M-10,0 L5,-7 L12,0 L5,7 Z" />
    <!-- Energy side ribs -->
    <path fill="url(#hornGrad)" d="M-2,-3 L-12,-8 L-6,-1 Z" opacity="0.8" />
    <path fill="url(#hornGrad)" d="M-2,3 L-12,8 L-6,1 Z" opacity="0.8" />
    <!-- Glowing power node -->
    <polygon points="-4,0 0,-3 4,0 0,3" fill="#00ffff" filter="url(#d-glow)" />
  </g>
</defs>`;

export default function CustomCursor() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    /* ── SVG wrapper ── */
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('style', 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999;');
    svg.innerHTML = DEFS;
    root.appendChild(svg);

    let w = window.innerWidth;
    let h = window.innerHeight;

    /* ── physics state ── */
    const pts = Array.from({ length: N }, () => ({ x: w / 2, y: h / 2 }));
    const ptr = { x: w / 2, y: h / 2 };
    let rad = 0;
    let frm = Math.random();
    const radMax = Math.min(w, h) / 2 - 20;

    /* ── head ring (SVG circle) ── */
    const ring = document.createElementNS(SVG, 'circle');
    ring.setAttribute('cx', '0');
    ring.setAttribute('cy', '0');
    ring.setAttribute('r', '18');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', 'rgba(0,255,255,0.4)');
    ring.setAttribute('stroke-width', '1.5');
    ring.style.filter = 'drop-shadow(0 0 6px rgba(0,255,255,0.2))';
    ring.style.transition = 'r 0.3s cubic-bezier(0.16,1,0.3,1), stroke 0.3s';
    svg.appendChild(ring);

    /* ── shockwave ── */
    const shock = document.createElementNS(SVG, 'circle');
    shock.setAttribute('cx', '0');
    shock.setAttribute('cy', '0');
    shock.setAttribute('r', '4');
    shock.setAttribute('fill', 'none');
    shock.setAttribute('stroke', '#00ffff');
    shock.setAttribute('stroke-width', '3');
    shock.style.opacity = '0';
    svg.appendChild(shock);

    /* ── dragon segments ── */
    const uses = [];
    for (let i = 1; i < N; i++) {
      const el = document.createElementNS(SVG, 'use');
      let href;
      if (i === 1) href = '#d-head';
      else if (i === 8 || i === 14) href = '#d-fin';
      else href = '#d-spine';
      el.setAttributeNS(XLINK, 'href', href);
      /* each spine gets a hue shift for body gradient */
      const t = (i - 1) / (N - 2);
      if (i !== 1 && i !== 8 && i !== 14) {
        el.style.filter = `drop-shadow(0 0 2px rgba(6,182,212,0.25)) hue-rotate(${t * 15}deg)`;
      } else {
        el.style.filter = 'drop-shadow(0 0 5px rgba(6,182,212,0.4))';
      }
      svg.appendChild(el);
      uses.push(el);
    }

    /* ── events ── */
    const onMove = (e) => { ptr.x = e.clientX; ptr.y = e.clientY; rad = 0; };
    document.addEventListener('pointermove', onMove);

    const onClick = () => {
      shock.style.opacity = '0.9';
      shock.setAttribute('r', '4');
      shock.setAttribute('stroke-width', '3');
      shock.setAttribute('stroke', '#00ffff');
      const burst = () => {
        const r = parseFloat(shock.getAttribute('r') || '4');
        if (r > 50) { shock.style.opacity = '0'; return; }
        shock.setAttribute('r', String(r + 2));
        shock.setAttribute('stroke-width', String(Math.max(0.5, 3 - (r / 50) * 2.5)));
        shock.setAttribute('stroke', r > 25 ? '#3b82f6' : '#00ffff');
        shock.style.opacity = String(Math.max(0, 0.9 - r / 55));
        requestAnimationFrame(burst);
      };
      requestAnimationFrame(burst);
    };
    document.addEventListener('click', onClick);

    const onResize = () => { w = window.innerWidth; h = window.innerHeight; };
    window.addEventListener('resize', onResize);

    /* ── hover ── */
    const sel = 'a, button, input, textarea, select, [role="button"], .suggestion-tag, .nav-link, .bento-card, .kpi, .name-card, .scorecard-item, .report-table tr, .toc-link, .glass-panel';
    const glowUp = () => {
      ring.setAttribute('r', '26');
      ring.setAttribute('stroke', 'rgba(0,255,255,0.8)');
      ring.style.filter = 'drop-shadow(0 0 12px rgba(0,255,255,0.5))';
      uses.forEach((el, i) => {
        const cur = el.style.filter || '';
        if (cur.includes('hue-rotate')) {
          el.style.filter = `drop-shadow(0 0 5px rgba(6,182,212,0.5)) hue-rotate(${(i / (N - 2)) * 15}deg) brightness(1.35)`;
        } else {
          el.style.filter = 'drop-shadow(0 0 8px rgba(6,182,212,0.6)) brightness(1.35)';
        }
      });
    };
    const glowDown = () => {
      ring.setAttribute('r', '18');
      ring.setAttribute('stroke', 'rgba(0,255,255,0.4)');
      ring.style.filter = 'drop-shadow(0 0 6px rgba(0,255,255,0.2))';
      uses.forEach((el, i) => {
        const cur = el.style.filter || '';
        if (cur.includes('hue-rotate')) {
          el.style.filter = `drop-shadow(0 0 2px rgba(6,182,212,0.25)) hue-rotate(${(i / (N - 2)) * 15}deg)`;
        } else {
          el.style.filter = 'drop-shadow(0 0 5px rgba(6,182,212,0.4))';
        }
      });
    };
    const bindHover = () => {
      document.querySelectorAll(sel).forEach((el) => {
        el.addEventListener('mouseenter', glowUp);
        el.addEventListener('mouseleave', glowDown);
      });
    };
    bindHover();
    const ob = new MutationObserver(bindHover);
    ob.observe(document.body, { childList: true, subtree: true });

    /* ── animation ── */
    const anim = () => {
      const ax = Math.cos(3 * frm) * rad * w / h;
      const ay = Math.sin(4 * frm) * rad * h / w;

      pts[0].x += (ax + ptr.x - pts[0].x) / 10;
      pts[0].y += (ay + ptr.y - pts[0].y) / 10;

      /* head ring follows pts[0] */
      ring.setAttribute('transform', `translate(${pts[0].x},${pts[0].y})`);
      shock.setAttribute('transform', `translate(${pts[0].x},${pts[0].y})`);

      for (let i = 1; i < N; i++) {
        const a = Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x);
        pts[i].x += (pts[i - 1].x - pts[i].x + Math.cos(a) * (100 - i) / 5) / 4;
        pts[i].y += (pts[i - 1].y - pts[i].y + Math.sin(a) * (100 - i) / 5) / 4;

        const mx = (pts[i - 1].x + pts[i].x) / 2;
        const my = (pts[i - 1].y + pts[i].y) / 2;
        const s = (162 + 4 * (1 - i)) / 50;
        const deg = (180 / Math.PI) * a;
        uses[i - 1].setAttributeNS(null, 'transform', `translate(${mx},${my}) rotate(${deg}) scale(${s})`);
      }

      if (rad < radMax) rad++;
      frm += 0.003;
      if (rad > 60) {
        ptr.x += (w / 2 - ptr.x) * 0.05;
        ptr.y += (h / 2 - ptr.y) * 0.05;
      }

      requestAnimationFrame(anim);
    };
    anim();

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      ob.disconnect();
      root.innerHTML = '';
    };
  }, []);

  return <div ref={rootRef} className="dragon-root" />;
}
