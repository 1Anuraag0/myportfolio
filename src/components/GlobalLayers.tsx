import { useEffect, useRef, useMemo } from 'react';

export default function GlobalLayers() {
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const updateGlow = () => {
      if (glowRef.current) {
        glowRef.current.style.setProperty('--cx', `${mouseRef.current.x}px`);
        glowRef.current.style.setProperty('--cy', `${mouseRef.current.y}px`);
      }
      rafRef.current = requestAnimationFrame(updateGlow);
    };
    rafRef.current = requestAnimationFrame(updateGlow);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const particles = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => {
      const size = 1 + Math.random() * 2.5;
      const duration = 22 + Math.random() * 33;
      const delay = -(Math.random() * duration);
      const left = (i / 48) * 100 + (Math.random() * 6 - 3);
      const isGold = i % 2 === 0;
      return { size, duration, delay, left, isGold };
    });
  }, []);

  return (
    <>
      {/* Layer 0 — Solid Background Color */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          background: 'linear-gradient(to bottom, #000000 0%, #170529 100%)',
        }}
      />

      {/* Layer 1 — Ikat Pattern */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.032,
          backgroundImage: `
            repeating-linear-gradient( 45deg, var(--gold) 0px, var(--gold) 0.6px, transparent 0.6px, transparent 46px),
            repeating-linear-gradient(-45deg, var(--gold) 0px, var(--gold) 0.6px, transparent 0.6px, transparent 46px),
            repeating-linear-gradient( 0deg,  var(--gold) 0px, var(--gold) 0.4px, transparent 0.4px, transparent 46px),
            repeating-linear-gradient(90deg,  var(--gold) 0px, var(--gold) 0.4px, transparent 0.4px, transparent 46px)
          `,
        }}
      />

      {/* Layer 2 — SVG Grain */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.038,
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Layer 3 — Cursor Radial Glow */}
      <div
        ref={glowRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(600px circle at var(--cx, 50%) var(--cy, 50%), rgba(201,162,39,0.055), transparent)',
        }}
      />

      {/* Layer 4 — Gold Dust Particles */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {particles.map((p, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: p.isGold ? 'var(--gold)' : 'var(--saffron)',
              left: `${p.left}%`,
              top: 0,
              animation: `float-up ${p.duration}s linear ${p.delay}s infinite`,
              willChange: 'transform',
            }}
          />
        ))}
      </div>
    </>
  );
}
