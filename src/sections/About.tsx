import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import OrnamentDivider from '../components/OrnamentDivider';
import ProfileCard from '../components/ProfileCard';

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const leftRef = useRef<HTMLDivElement>(null);

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
  }, []);

  return (
    <section
      id="about"
      style={{
        position: 'relative',
        padding: '120px 48px',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >


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

          {/* Right — profile card */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}
          >
            <ProfileCard
              avatarUrl="/pic.png"
              miniAvatarUrl="/pic.png"
              iconUrl=""
              grainUrl=""
              name="Anurag"
              title="Developer & Creator"
              handle="aaaanuraggg"
              status="Building"
              contactText="Contact"
              contactOptions={[
                { label: 'LinkedIn', url: 'https://www.linkedin.com/in/anuragdolui' },
                { label: 'Instagram', url: 'https://www.instagram.com/aaaanuraggg/' }
              ]}
              className="about-profile-card"
            />
          </div>
        </div>
      </div>

      <style>{`
        .about-profile-card {
          width: min(100%, 420px);
        }
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
