import { useState, useEffect, useCallback } from 'react';
import { getLenis } from '../lib/lenis';

const NAV_LINKS = [
  { label: 'ABOUT', href: '#about' },
  { label: 'WORK', href: '#projects' },
  { label: 'SKILLS', href: '#skills' },
  { label: 'CONTACT', href: '#contact' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 100);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      { threshold: 0.3 }
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(href);
    } else {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }
    setMenuOpen(false);
  }, []);

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 48px',
          background: scrolled ? '#000000' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px) saturate(160%)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(201, 162, 39, 0.12)' : '1px solid transparent',
          transition: 'all 0.5s var(--ease-out-expo)',
        }}
      >
        {/* Monogram */}
        <a
          href="#hero"
          onClick={(e) => handleNavClick(e, '#hero')}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            color: 'var(--gold)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
          }}
          data-cursor="link"
        >
          AD
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="4" y="4" width="8" height="8" transform="rotate(45 8 8)" stroke="var(--gold)" strokeWidth="1" opacity="0.6" />
            <rect x="5" y="5" width="6" height="6" transform="rotate(45 8 8)" stroke="var(--gold)" strokeWidth="0.5" opacity="0.4" />
          </svg>
        </a>

        {/* Desktop Links */}
        <div
          className="nav-links-desktop"
          style={{
            display: 'flex',
            gap: 40,
          }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              data-cursor="link"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                letterSpacing: '0.38em',
                color: activeSection === link.href ? 'var(--gold)' : 'var(--ivory-dim)',
                textTransform: 'uppercase' as const,
                position: 'relative',
                transition: 'color 0.3s',
                textDecoration: 'none',
                paddingBottom: 4,
              }}
            >
              {link.label}
              <span
                style={{
                  position: 'absolute',
                  bottom: -4,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'var(--gold)',
                  opacity: activeSection === link.href ? 1 : 0,
                  transition: 'opacity 0.3s',
                }}
              />
            </a>
          ))}
        </div>

        {/* Hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'none',
            padding: 8,
            flexDirection: 'column',
            gap: 5,
          }}
          aria-label="Toggle menu"
        >
          <span style={{ width: 22, height: 1.5, background: 'var(--gold)', display: 'block', transition: 'all 0.3s' }} />
          <span style={{ width: 22, height: 1.5, background: 'var(--gold)', display: 'block', transition: 'all 0.3s' }} />
          <span style={{ width: 16, height: 1.5, background: 'var(--gold)', display: 'block', transition: 'all 0.3s' }} />
        </button>
      </nav>

      {/* Mobile Overlay */}
      <div
        className="mobile-nav-overlay"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 300,
          background: 'var(--layer-warm)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.5s var(--ease-out-expo)',
        }}
      >
        <button
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            background: 'none',
            border: 'none',
            color: 'var(--gold)',
            fontSize: 28,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
          aria-label="Close menu"
        >
          ✕
        </button>
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={(e) => handleNavClick(e, link.href)}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 48,
              color: 'var(--ivory)',
              textDecoration: 'none',
              letterSpacing: '0.05em',
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .nav-links-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
