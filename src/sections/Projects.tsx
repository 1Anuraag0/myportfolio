import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import OrnamentDivider from '../components/OrnamentDivider';
import { fetchGitHubData, formatRepoName, type GitHubRepo } from '../lib/github';

gsap.registerPlugin(ScrollTrigger);

function ProjectCard({ repo, index }: { repo: GitHubRepo; index: number }) {
  const indexStr = String(index + 1).padStart(2, '0');

  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="expand"
      className="project-card"
      style={{
        border: '1px solid var(--gold-border)',
        background: 'transparent',
        padding: '38px 34px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.4s, background 0.4s, transform 0.4s',
        willChange: 'transform',
        display: 'block',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'rgba(201, 162, 39, 0.55)';
        el.style.background = 'var(--gold-dim)';
        el.style.transform = 'translateY(-5px)';
        const topLine = el.querySelector('.card-top-line') as HTMLElement;
        if (topLine) topLine.style.transform = 'scaleX(1)';
        const corners = el.querySelectorAll('.corner-ornament') as NodeListOf<HTMLElement>;
        corners.forEach((c) => (c.style.borderColor = 'var(--gold)'));
        const idx = el.querySelector('.project-index') as HTMLElement;
        if (idx) idx.style.color = 'rgba(201, 162, 39, 0.13)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'var(--gold-border)';
        el.style.background = 'transparent';
        el.style.transform = 'translateY(0)';
        const topLine = el.querySelector('.card-top-line') as HTMLElement;
        if (topLine) topLine.style.transform = 'scaleX(0)';
        const corners = el.querySelectorAll('.corner-ornament') as NodeListOf<HTMLElement>;
        corners.forEach((c) => (c.style.borderColor = 'rgba(201, 162, 39, 0.4)'));
        const idx = el.querySelector('.project-index') as HTMLElement;
        if (idx) idx.style.color = 'rgba(201, 162, 39, 0.07)';
      }}
    >
      {/* Top border slide */}
      <div
        className="card-top-line"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
          transform: 'scaleX(0)',
          transformOrigin: 'left',
          transition: 'transform 0.48s var(--ease-out-expo)',
        }}
      />

      {/* Corner ornaments */}
      <span className="corner-ornament" style={{ position: 'absolute', top: 10, left: 10, width: 14, height: 14, borderTop: '1.5px solid rgba(201,162,39,0.4)', borderLeft: '1.5px solid rgba(201,162,39,0.4)', transition: 'border-color 0.3s' }} />
      <span className="corner-ornament" style={{ position: 'absolute', bottom: 10, right: 10, width: 14, height: 14, borderBottom: '1.5px solid rgba(201,162,39,0.4)', borderRight: '1.5px solid rgba(201,162,39,0.4)', transition: 'border-color 0.3s' }} />

      {/* Index number */}
      <div
        className="project-index"
        style={{
          position: 'absolute',
          top: 22,
          right: 26,
          fontFamily: 'var(--font-display)',
          fontSize: 88,
          fontWeight: 700,
          lineHeight: 1,
          color: 'rgba(201, 162, 39, 0.07)',
          transition: 'color 0.35s',
          userSelect: 'none',
        }}
      >
        {indexStr}
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 600,
          color: 'var(--gold-pale)',
          marginBottom: 12,
        }}>
          {formatRepoName(repo.name)}
        </h3>

        <p style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 14,
          lineHeight: 1.78,
          color: 'var(--ivory-dim)',
          marginBottom: 22,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}>
          {repo.description || 'A creative experiment in code.'}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {repo.language && (
            <span style={{
              padding: '4px 12px',
              border: '1px solid rgba(201, 162, 39, 0.28)',
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase' as const,
              color: 'var(--gold)',
            }}>
              {repo.language}
            </span>
          )}
          {repo.topics?.slice(0, 3).map((topic) => (
            <span
              key={topic}
              style={{
                padding: '4px 12px',
                border: '1px solid rgba(201, 162, 39, 0.28)',
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase' as const,
                color: 'var(--gold)',
              }}
            >
              {topic}
            </span>
          ))}
        </div>

        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          letterSpacing: '0.32em',
          textTransform: 'uppercase' as const,
          color: 'var(--saffron)',
        }}>
          EXPLORE →
        </span>
      </div>
    </a>
  );
}

export default function Projects() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGitHubData()
      .then(({ repos }) => {
        setRepos(repos);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || !gridRef.current) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const cards = gridRef.current.querySelectorAll('.project-card');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 64, rotation: 1.5 },
      {
        opacity: 1,
        y: 0,
        rotation: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: gridRef.current, start: 'top 75%' },
      }
    );
  }, [loading]);

  return (
    <section
      id="projects"
      style={{
        position: 'relative',
        padding: '120px 48px',
        background: 'var(--deep)',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div className="section-eye">✦ PORTFOLIO ✦</div>
        <h2 className="section-title">Selected <em>Works</em></h2>
        <OrnamentDivider />

        <div
          ref={gridRef}
          className="projects-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 32,
          }}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 280 }} />
              ))
            : repos.map((repo, i) => <ProjectCard key={repo.name} repo={repo} index={i} />)
          }
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .projects-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 767px) {
          .projects-grid { grid-template-columns: 1fr !important; }
          #projects { padding: 72px 24px !important; }
        }
      `}</style>
    </section>
  );
}
