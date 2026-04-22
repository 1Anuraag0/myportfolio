import { useEffect, useRef } from 'react';

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isExpanded = false;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('[data-cursor="expand"]') ||
        target.closest('a') ||
        target.closest('button')
      ) {
        isExpanded = true;
        ring.style.width = '56px';
        ring.style.height = '56px';
        ring.style.borderColor = 'var(--saffron)';
        ring.style.opacity = '1';
        dot.style.transform = 'translate(-50%, -50%) scale(0.5)';
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('[data-cursor="expand"]') ||
        target.closest('a') ||
        target.closest('button')
      ) {
        isExpanded = false;
        ring.style.width = '36px';
        ring.style.height = '36px';
        ring.style.borderColor = 'var(--gold)';
        ring.style.opacity = '0.5';
        dot.style.transform = 'translate(-50%, -50%) scale(1)';
      }
    };

    const handleMouseDown = () => {
      ring.style.transform = 'translate(-50%, -50%) scale(0.85)';
    };

    const handleMouseUp = () => {
      ring.style.transform = 'translate(-50%, -50%) scale(1)';
    };

    let raf: number;
    const animate = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;

      dot.style.left = mouseX + 'px';
      dot.style.top = mouseY + 'px';
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';

      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (isMobile) return null;

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--gold)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'transform 0.15s ease',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1.5px solid var(--gold)',
          opacity: 0.5,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 9998,
          transition: 'width 0.3s ease, height 0.3s ease, border-color 0.3s ease, opacity 0.3s ease, transform 0.15s ease',
        }}
      />
    </>
  );
}
