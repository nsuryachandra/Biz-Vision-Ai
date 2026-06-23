import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

const TOTAL_FRAMES = 120;
const SCROLL_TRACK_VH = 4;

const FrameSequenceHero = forwardRef((props, ref) => {
  const spacerRef       = useRef(null);
  const canvasRef       = useRef(null);
  const imagesRef       = useRef([]);          // ImageBitmap[] or HTMLImageElement[]
  const drawnFrameRef   = useRef(0);
  const targetFrameRef  = useRef(1);
  const rafIdRef        = useRef(null);
  const ctxRef          = useRef(null);
  const scrollAnimRef   = useRef(null);

  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoaded,     setIsLoaded]     = useState(false);
  const [isActive,     setIsActive]     = useState(true);

  // ── Preload as ImageBitmap (GPU-resident, zero-CPU draw) ─────────────────
  useEffect(() => {
    let count = 0;
    const imgs = new Array(TOTAL_FRAMES).fill(null);
    const useIB = typeof createImageBitmap === 'function';

    const done = (idx, src) => {
      imgs[idx] = src;
      count++;
      setLoadProgress(Math.round((count / TOTAL_FRAMES) * 100));
      if (count === TOTAL_FRAMES) {
        imagesRef.current = imgs;
        setIsLoaded(true);
      }
    };

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const url = `/scrollpack/frames/frame_${String(i).padStart(4, '0')}.jpg`;
      const idx = i - 1;

      if (useIB) {
        fetch(url)
          .then(r => r.blob())
          .then(b => createImageBitmap(b))
          .then(bm => done(idx, bm))
          .catch(() => {
            // HTMLImage fallback
            const el = new Image();
            el.src = url;
            el.onload = el.onerror = () => done(idx, el);
          });
      } else {
        const el = new Image();
        el.decoding = 'async';
        el.src = url;
        el.onload = el.onerror = () => done(idx, el);
      }
    }

    return () => { 
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current); 
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    };
  }, []);

  // ── Draw one frame, crisp & Retina-correct ───────────────────────────────
  const drawFrame = (index) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = imagesRef.current[index - 1];
    if (!image) return;
    if (image instanceof HTMLImageElement && (!image.complete || !image.naturalWidth)) return;

    // Lazy-init context with alpha:false (faster compositing for opaque JPGs)
    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext('2d', { alpha: false, desynchronized: true });
    }
    const ctx = ctxRef.current;
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const vw  = window.innerWidth;
    const vh  = window.innerHeight;
    const pw  = Math.floor(vw * dpr);
    const ph  = Math.floor(vh * dpr);

    // Resize canvas buffer only when needed
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width  = pw;
      canvas.height = ph;
      // Explicit CSS px size = exact 1:1 physical-pixel mapping → no browser scaling blur
      canvas.style.width  = `${vw}px`;
      canvas.style.height = `${vh}px`;
      ctxRef.current = canvas.getContext('2d', { alpha: false, desynchronized: true });
    }

    const c = ctxRef.current;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';

    const iw = image.width  || image.naturalWidth;
    const ih = image.height || image.naturalHeight;
    const r  = Math.max(vw / iw, vh / ih);          // cover
    const nw = iw * r;
    const nh = ih * r;

    c.drawImage(image, 0, 0, iw, ih, (vw - nw) / 2, (vh - nh) / 2, nw, nh);
    drawnFrameRef.current = index;
  };

  // ── Scroll → target frame (direct snap, no LERP) ─────────────────────────
  useEffect(() => {
    if (!isLoaded) return;

    const onScroll = () => {
      const spacer = spacerRef.current;
      if (!spacer) return;
      const { top, height } = spacer.getBoundingClientRect();
      const scrolled    = -top;
      const trackLength = height - window.innerHeight;
      const progress    = Math.min(1, Math.max(0, scrolled / trackLength));

      setIsActive(top <= 0 && scrolled <= trackLength);

      targetFrameRef.current = Math.min(TOTAL_FRAMES, Math.max(1,
        Math.round(progress * (TOTAL_FRAMES - 1)) + 1
      ));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [isLoaded]);

  // ── RAF loop — redraws ONLY when frame index changes ─────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    drawFrame(1);

    const loop = () => {
      if (targetFrameRef.current !== drawnFrameRef.current) {
        drawFrame(targetFrameRef.current);
      }
      rafIdRef.current = requestAnimationFrame(loop);
    };
    rafIdRef.current = requestAnimationFrame(loop);
    return () => { if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current); };
  }, [isLoaded]);

  // ── Redraw on window resize ───────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    const onResize = () => {
      drawnFrameRef.current = 0; // force redraw with new size
      drawFrame(targetFrameRef.current);
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [isLoaded]);

  // ── Play animation and scroll user to bottom of the track ─────────────────
  const playAndScroll = (onComplete) => {
    if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);

    const spacer = spacerRef.current;
    if (!spacer) return;

    const start = window.scrollY;
    const end = document.documentElement.scrollHeight - window.innerHeight;
    const distance = Math.abs(end - start);
    if (distance < 10) {
      if (onComplete) onComplete();
      return;
    }

    const duration = 3500; // 3.5 seconds
    const startTime = performance.now();

    // Interrupt auto-scroll if user interacts
    let interrupted = false;
    const interruptHandler = () => {
      interrupted = true;
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('wheel', interruptHandler);
      window.removeEventListener('touchmove', interruptHandler);
      window.removeEventListener('mousedown', interruptHandler);
    };

    window.addEventListener('wheel', interruptHandler, { passive: true });
    window.addEventListener('touchmove', interruptHandler, { passive: true });
    window.addEventListener('mousedown', interruptHandler, { passive: true });

    const animateScroll = (currentTime) => {
      if (interrupted) return;

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: easeInOutQuad
      const ease = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      window.scrollTo(0, start + (end - start) * ease);

      if (progress < 1) {
        scrollAnimRef.current = requestAnimationFrame(animateScroll);
      } else {
        cleanup();
        if (onComplete) onComplete();
      }
    };

    scrollAnimRef.current = requestAnimationFrame(animateScroll);
  };

  useImperativeHandle(ref, () => ({
    playAndScroll
  }));

  return (
    <>
      {/* Fixed full-viewport canvas */}
      <div style={{ position:'fixed', inset:0, zIndex:10, pointerEvents:'none',
                    opacity: isActive ? 1 : 0, transition:'opacity 0.35s ease' }}>

        {/* Loader */}
        {!isLoaded && (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
                        alignItems:'center', justifyContent:'center',
                        background:'rgba(250,251,253,0.97)', backdropFilter:'blur(16px)', zIndex:60 }}>
            <div style={{ marginBottom:18, fontSize:13, fontWeight:700,
                          letterSpacing:'0.12em', textTransform:'uppercase', color:'#4f46e5' }}>
              BizVision AI
            </div>
            <div style={{ width:260, height:2, background:'#e2e8f0', borderRadius:99,
                          overflow:'hidden', marginBottom:10 }}>
              <div style={{ height:'100%', width:`${loadProgress}%`,
                            background:'linear-gradient(90deg,#4f46e5,#06b6d4)',
                            borderRadius:99, transition:'width 0.2s linear' }} />
            </div>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.1em',
                          textTransform:'uppercase', color:'#94a3b8' }}>
              Loading Experience — {loadProgress}%
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display:'block' }} />
      </div>

      {/* Scroll-track spacer */}
      <div ref={spacerRef}
           style={{ width:'100%', height:`${SCROLL_TRACK_VH * 100}vh`,
                    flexShrink:0, background:'rgb(205,205,207)' }} />
    </>
  );
});

export default FrameSequenceHero;
