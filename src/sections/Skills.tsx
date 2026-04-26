import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import OrnamentDivider from '../components/OrnamentDivider';
import { fetchGitHubData, aggregateLanguages } from '../lib/github';

gsap.registerPlugin(ScrollTrigger);

function SkillCategory({ title, skills }: { title: string; skills: string[] }) {
  const titleRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      if (titleRef.current) {
        ScrollTrigger.create({
          trigger: titleRef.current,
          start: 'top 80%',
          once: true,
          onEnter: () => titleRef.current?.classList.add('visible'),
        });
      }

      if (pillsRef.current) {
        const pills = pillsRef.current.querySelectorAll('.skill-pill');
        gsap.fromTo(
          pills,
          { scale: 0.78, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            stagger: 0.055,
            ease: 'back.out(1.4)',
            duration: 0.6,
            scrollTrigger: { trigger: pillsRef.current, start: 'top 78%', once: true },
          }
        );
      }
    });

    return () => ctx.revert();
  }, [skills]);

  return (
    <div style={{ marginBottom: 48 }}>
      <div
        ref={titleRef}
        className="skill-category-title"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontStyle: 'italic',
          fontWeight: 300,
          color: 'var(--saffron)',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {title}
        <span
          style={{
            flex: 1,
            height: 1,
            background: 'linear-gradient(to right, rgba(224,105,13,0.35), transparent)',
            transform: 'scaleX(0)',
            transformOrigin: 'left',
            transition: 'transform 0.9s var(--ease-out-expo)',
          }}
          className="skill-line"
        />
      </div>

      <div
        ref={pillsRef}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        {skills.map((skill) => (
          <span
            key={skill}
            className="skill-pill"
            data-cursor="expand"
            style={{
              padding: '10px 22px',
              border: '1px solid var(--gold-border)',
              fontFamily: 'var(--font-serif)',
              fontSize: 14,
              color: 'var(--ivory-dim)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'border-color 0.28s, color 0.28s',
              cursor: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold)';
              e.currentTarget.style.color = 'var(--gold-pale)';
              e.currentTarget.style.background = 'var(--gold-dim)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold-border)';
              e.currentTarget.style.color = 'var(--ivory-dim)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {skill}
          </span>
        ))}
      </div>

      <style>{`
        .skill-category-title.visible .skill-line {
          transform: scaleX(1) !important;
        }
      `}</style>
    </div>
  );
}

export default function Skills() {
  const [languages, setLanguages] = useState<string[]>([]);

  useEffect(() => {
    fetchGitHubData()
      .then(({ repos }) => {
        const langs = aggregateLanguages(repos);
        setLanguages(langs.length > 0 ? langs : ['JavaScript', 'TypeScript', 'Python', 'C++']);
      })
      .catch(() => setLanguages(['JavaScript', 'TypeScript', 'Python', 'C++']));
  }, []);

  return (
    <section
      id="skills"
      style={{
        position: 'relative',
        padding: '120px 48px',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >


      <div style={{ position: 'relative', zIndex: 1, maxWidth: 920, margin: '0 auto' }}>
        <div className="section-eye">✦ EXPERTISE ✦</div>
        <h2 className="section-title">Skills & <em>Tools</em></h2>
        <OrnamentDivider />

        <SkillCategory
          title="Frontend"
          skills={['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'HTML / CSS', 'JavaScript', 'Three.js', 'GSAP']}
        />

        <SkillCategory title="Languages" skills={languages} />

        <SkillCategory
          title="Creative"
          skills={['UI/UX Design', 'Figma', 'Creative Coding', 'Visual Storytelling', 'Motion Design', 'Generative Art']}
        />
      </div>

      <style>{`
        @media (max-width: 767px) {
          #skills { padding: 72px 24px !important; }
        }
      `}</style>
    </section>
  );
}
