import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import OrnamentDivider from '../components/OrnamentDivider';
import { fetchGitHubData, type GitHubUser } from '../lib/github';

gsap.registerPlugin(ScrollTrigger);

interface StatCardProps {
  value: string;
  label: string;
  animate?: boolean;
}

function StatCard({ value, label, animate }: StatCardProps) {
  const valueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animate || !valueRef.current) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const numVal = parseInt(value, 10);
    if (isNaN(numVal)) return;

    gsap.from(valueRef.current, {
      textContent: 0,
      duration: 2,
      ease: 'power2.out',
      snap: { textContent: 1 },
      scrollTrigger: { trigger: valueRef.current, start: 'top 80%', once: true },
    });
  }, [value, animate]);

  return (
    <div
      data-cursor="expand"
      style={{
        border: '1px solid var(--gold-border)',
        background: 'var(--gold-dim)',
        padding: '28px 24px',
        position: 'relative',
        transition: 'border-color 0.35s, background 0.35s, transform 0.35s',
        cursor: 'none',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'var(--gold)';
        el.style.background = 'rgba(201, 162, 39, 0.09)';
        el.style.transform = 'translateY(-6px)';
        el.style.boxShadow = '0 24px 60px rgba(201, 162, 39, 0.08)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'var(--gold-border)';
        el.style.background = 'var(--gold-dim)';
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'none';
      }}
    >
      {/* Corner ornaments */}
      <span style={{ position: 'absolute', top: -1, left: -1, width: 12, height: 12, borderTop: '2px solid var(--gold)', borderLeft: '2px solid var(--gold)' }} />
      <span style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderBottom: '2px solid var(--gold)', borderRight: '2px solid var(--gold)' }} />
      <span style={{ position: 'absolute', top: -1, right: -1, width: 12, height: 12, borderTop: '2px solid var(--gold)', borderRight: '2px solid var(--gold)' }} />
      <span style={{ position: 'absolute', bottom: -1, left: -1, width: 12, height: 12, borderBottom: '2px solid var(--gold)', borderLeft: '2px solid var(--gold)' }} />

      <div
        ref={valueRef}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 52,
          lineHeight: 1,
          color: 'var(--gold)',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          letterSpacing: '0.35em',
          textTransform: 'uppercase' as const,
          color: 'var(--ivory-dim)',
          marginTop: 8,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function About() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(true);
  const leftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGitHubData()
      .then(({ user }) => {
        setUser(user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !leftRef.current) return;

    const paragraphs = leftRef.current.querySelectorAll('.about-paragraph');
    gsap.fromTo(
      paragraphs,
      { opacity: 0, x: -44 },
      {
        opacity: 1,
        x: 0,
        stagger: 0.22,
        ease: 'power3.out',
        duration: 1,
        scrollTrigger: { trigger: '#about', start: 'top 70%' },
      }
    );
  }, [loading]);

  const stats = [
    { value: loading ? '...' : String(user?.public_repos ?? 0), label: 'GitHub Repos', animate: true },
    { value: '3+', label: 'Years Building', animate: false },
    { value: '∞', label: 'Curiosity', animate: false },
    { value: '01', label: 'Creative Vision', animate: false },
  ];

  return (
    <section
      id="about"
      style={{
        position: 'relative',
        padding: '120px 48px',
        background: 'linear-gradient(142deg, var(--layer-warm) 0%, #1A0A1A 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Paisley overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.038,
        }}
      >
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <pattern id="paisley" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M40,100 Q60,40 100,60 Q140,80 120,140 Q100,180 60,160 Q20,140 40,100 Z" fill="none" stroke="var(--gold)" strokeWidth="0.5" />
              <path d="M140,30 Q160,10 180,30 Q200,50 180,70 Q160,80 140,60 Q130,45 140,30 Z" fill="none" stroke="var(--gold)" strokeWidth="0.5" />
              <circle cx="100" cy="120" r="4" fill="var(--gold)" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#paisley)" />
        </svg>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto' }}>
        <div className="section-eye">✦ THE MAKER ✦</div>
        <OrnamentDivider />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 80,
          }}
          className="about-grid"
        >
          {/* Left — copy */}
          <div ref={leftRef}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(42px, 6vw, 70px)',
              marginBottom: 32,
              lineHeight: 1.1,
            }}>
              <span style={{ fontWeight: 600, color: 'var(--gold-pale)' }}>About the </span>
              <em style={{ fontWeight: 300, fontStyle: 'italic', color: 'var(--ivory)' }}>Craft</em>
            </h2>

            <p className="about-paragraph" style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 17,
              lineHeight: 1.96,
              color: 'var(--ivory-dim)',
              marginBottom: 24,
              opacity: 0,
            }}>
              From the layered streets of Kolkata — where every wall bleeds with color and every alley hides a story — I bring that maximalist energy to every line of code.
            </p>

            <p className="about-paragraph" style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 17,
              lineHeight: 1.96,
              color: 'var(--ivory-dim)',
              marginBottom: 24,
              opacity: 0,
            }}>
              I build digital experiences that are bold, intentional, and alive. Whether a precision-crafted web application or a wild creative experiment, I show up with a developer's discipline and a creator's restless eye.
            </p>

            <p className="about-paragraph" style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 17,
              lineHeight: 1.96,
              color: 'var(--ivory-dim)',
              opacity: 0,
            }}>
              Inspired by the richness of Indian design — the ornate geometry, the saturated palette, the beautiful complexity — I believe software should have personality, not just function.
            </p>
          </div>

          {/* Right — stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
              alignContent: 'start',
            }}
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 140 }} />
              ))
            ) : (
              stats.map((s, i) => <StatCard key={i} {...s} />)
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .about-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          #about {
            padding: 72px 24px !important;
          }
        }
      `}</style>
    </section>
  );
}
