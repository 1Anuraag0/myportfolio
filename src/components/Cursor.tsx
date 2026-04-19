import { useEffect, useRef } from 'react';

export default function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Hide on mobile
    if (window.matchMedia('(max-width: 767px)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 2}px, ${e.clientY - 2}px)`;
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-cursor]');
      if (!el || !ringRef.current) return;
      const type = el.getAttribute('data-cursor');
      if (type === 'expand') {
        ringRef.current.style.width = '44px';
        ringRef.current.style.height = '44px';
        ringRef.current.style.opacity = '0.5';
      } else if (type === 'text') {
        ringRef.current.style.width = '2px';
        ringRef.current.style.height = '28px';
        ringRef.current.style.borderRadius = '2px';
      } else if (type === 'link') {
        ringRef.current.style.borderColor = 'var(--saffron)';
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-cursor]');
      if (!el || !ringRef.current) return;
      ringRef.current.style.width = '18px';
      ringRef.current.style.height = '18px';
      ringRef.current.style.opacity = '1';
      ringRef.current.style.borderRadius = '50%';
      ringRef.current.style.borderColor = 'var(--gold)';
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });

    let raf: number;
    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.12;
      pos.current.y += (target.current.y - pos.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${pos.current.x - 9}px, ${pos.current.y - 9}px)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Don't render on mobile
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
    return null;
  }

  return (
    <>
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 18,
          height: 18,
          border: '1.5px solid var(--gold)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'width 0.2s var(--ease-out-expo), height 0.2s var(--ease-out-expo), opacity 0.2s, border-color 0.2s, border-radius 0.2s',
          willChange: 'transform',
        }}
      />
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 4,
          height: 4,
          background: 'var(--gold-bright)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          willChange: 'transform',
        }}
      />
    </>
  );
}
