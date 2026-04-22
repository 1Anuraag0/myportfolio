import { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hyperspeed from '../components/HyperspeedRenderer';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  /* Cyberpunk preset — reduced for performance, NO interactivity */
  const cyberpunkOptions = useMemo(() => ({
    onSpeedUp: () => {},
    onSlowDown: () => {},
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 10,
    islandWidth: 2,
    lanesPerRoad: 2,
    totalSideLightSticks: 15,
    lightPairsPerRoadWay: 20,
    fov: 90,
    fovSpeedUp: 90,   // same as fov → no zoom on click
    speedUp: 0,       // no speed boost on click
    carLightsFade: 0.4,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5] as [number, number],
    lightStickHeight: [1.3, 1.7] as [number, number],
    movingAwaySpeed: [60, 80] as [number, number],
    movingCloserSpeed: [-120, -160] as [number, number],
    carLightsLength: [400 * 0.03, 400 * 0.2] as [number, number],
    carLightsRadius: [0.05, 0.14] as [number, number],
    carWidthPercentage: [0.3, 0.5] as [number, number],
    carShiftX: [-0.8, 0.8] as [number, number],
    carFloorSeparation: [0, 5] as [number, number],
    colors: {
      roadColor: 0x080808,
      islandColor: 0x0a0a0a,
      background: 0x000000,
      shoulderLines: 0x131318,
      brokenLines: 0x131318,
      leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
      rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
      sticks: 0x03b3c3,
    },
  }), []);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const tl = gsap.timeline({ delay: 0.3 });

    tl.fromTo('.pre-label', { opacity: 0, y: 52 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0)
      .fromTo('.name-line-1', { opacity: 0, y: 52 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power4.out' }, 0.18)
      .fromTo('.name-line-2', { opacity: 0, y: 52 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power4.out' }, 0.28)
      .fromTo('.ornament-divider', { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.8 }, 0.45)
      .fromTo('.hero-subtitle', { opacity: 0, y: 52 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.55)
      .fromTo('.hero-cta .btn', { opacity: 0, y: 52 }, { opacity: 1, y: 0, stagger: 0.12, duration: 0.8, ease: 'power3.out' }, 0.70);

    gsap.to('.hero-name', {
      yPercent: 22,
      ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1.2 },
    });
    gsap.to('.pre-label', {
      yPercent: 14,
      opacity: 0,
      scrollTrigger: { trigger: '#hero', start: 'top top', end: '40% top', scrub: 1 },
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === document.querySelector('#hero')) st.kill();
      });
    };
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Hyperspeed 3D background — passive, no interaction */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <Hyperspeed effectOptions={cyberpunkOptions} />
      </div>

      {/* Hero content — on top, fully clickable */}
      <div
        className="hero-content"
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '0 24px',
        }}
      >
        <span className="pre-label" style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          letterSpacing: '0.6em',
          textTransform: 'uppercase' as const,
          color: 'var(--saffron)',
          marginBottom: 28,
          display: 'block',
          opacity: 0,
        }}>
          ✦ DEVELOPER & CREATOR · KOLKATA ✦
        </span>

        <h1 className="hero-name" style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(58px, 13vw, 168px)',
          fontWeight: 700,
          lineHeight: 0.86,
          letterSpacing: '-0.03em',
          textAlign: 'center',
          marginBottom: 0,
        }}>
          <span className="name-line-1" style={{
            display: 'block',
            background: 'linear-gradient(90deg, var(--gold) 0%, var(--gold-pale) 38%, var(--gold-bright) 62%, var(--gold) 100%)',
            backgroundSize: '250% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'shimmer 6s linear infinite',
            opacity: 0,
          }}>
            ANURAG
          </span>
          <span className="name-line-2" style={{
            display: 'block',
            fontStyle: 'italic',
            fontWeight: 300,
            color: 'var(--ivory)',
            WebkitTextFillColor: 'var(--ivory)',
            opacity: 0,
          }}>
            DOLUI
          </span>
        </h1>

        <div className="ornament-divider" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(6px, 2vw, 14px)',
          margin: '28px auto',
          width: '100%',
          maxWidth: '400px',
          opacity: 0,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--gold)', opacity: 0.4 }} />
          <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
            <polygon points="6,0 12,6 6,12 0,6" fill="none" stroke="var(--gold)" strokeWidth="1" />
          </svg>
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
            <path d="M8,0 L10,6 L16,8 L10,10 L8,16 L6,10 L0,8 L6,6 Z" fill="var(--gold)" opacity="0.7" />
          </svg>
          <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
            <polygon points="6,0 12,6 6,12 0,6" fill="none" stroke="var(--gold)" strokeWidth="1" />
          </svg>
          <div style={{ flex: 1, height: 1, background: 'var(--gold)', opacity: 0.4 }} />
        </div>

        <p className="hero-subtitle" style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(18px, 2.5vw, 26px)',
          fontStyle: 'italic',
          fontWeight: 300,
          color: 'var(--ivory-dim)',
          letterSpacing: '0.06em',
          opacity: 0,
        }}>
          Crafting digital experiences with code & soul
        </p>

        <div className="hero-cta" style={{
          display: 'flex',
          gap: 20,
          justifyContent: 'center',
          marginTop: 40,
          flexWrap: 'wrap',
        }}>
          <a href="#projects" className="btn btn-gold" data-cursor="expand">VIEW MY WORK</a>
          <a href="#contact" className="btn btn-saffron" data-cursor="expand">GET IN TOUCH</a>
        </div>
      </div>
    </section>
  );
}
