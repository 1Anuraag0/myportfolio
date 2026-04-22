import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import OrnamentDivider from '../components/OrnamentDivider';

gsap.registerPlugin(ScrollTrigger);

const SOCIALS = [
  {
    label: 'GitHub',
    href: 'https://github.com/1Anuraag0',
    icon: 'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.43 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.23c-3.34.73-4.03-1.41-4.03-1.41-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.19.7.8.58A12.01 12.01 0 0 0 24 12c0-6.63-5.37-12-12-12Z',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/anuragdolui',
    icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com/1Anuraag0',
    icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  {
    label: 'Dribbble',
    href: 'https://dribbble.com/1Anuraag0',
    icon: 'M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308a10.18 10.18 0 0 0 4.392-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4a10.16 10.16 0 0 0 6.29 2.166c1.42 0 2.77-.29 4.006-.816zM3.616 20.396c.232-.413 3.044-5.25 8.36-7.03.134-.044.27-.084.405-.12a43.66 43.66 0 0 0-1.24-2.58C6.1 12.262 1.15 12.155.83 12.143l-.004.26c0 3.06 1.07 5.87 2.79 8.003zM1.285 10.29c.33.007 5.8.052 10.596-1.405A102.3 102.3 0 0 0 8.1 3.64 10.156 10.156 0 0 0 1.285 10.3zm8.88-7.96A83.7 83.7 0 0 1 13.94 7.56c3.45-1.29 4.91-3.25 5.1-3.52A10.12 10.12 0 0 0 12 1.84c-.69 0-1.37.07-2.025.2l.19.29zm12.055 3.2c-.22.3-1.83 2.39-5.44 3.84.39.8.756 1.62 1.095 2.45.12.29.232.58.34.87 3.44-.43 6.84.27 7.18.33a10.1 10.1 0 0 0-3.175-7.49z',
  },
];

export default function Contact() {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    gsap.fromTo(
      '.contact-content > *',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '#contact', start: 'top 70%' },
      }
    );


  }, []);

  return (
    <section
      id="contact"
      style={{
        position: 'relative',
        padding: '120px 48px',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >


      <div
        className="contact-content"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 800,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <div className="section-eye">✦ CONNECT ✦</div>
        <h2 className="section-title">Let's <em>Create</em></h2>
        <OrnamentDivider />

        {/* Pull quote */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          margin: '40px auto',
          maxWidth: 600,
        }}>
          <div style={{
            width: 1,
            height: 60,
            background: 'var(--gold)',
            opacity: 0.5,
            flexShrink: 0,
          }} />
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontStyle: 'italic',
            color: 'var(--ivory-dim)',
            lineHeight: 1.6,
          }}>
            The best projects begin with a conversation — let's build something worth remembering.
          </p>
          <div style={{
            width: 1,
            height: 60,
            background: 'var(--gold)',
            opacity: 0.5,
            flexShrink: 0,
          }} />
        </div>

        {/* CTA */}
        <a
          href="mailto:anuragdolui@gmail.com"
          className="btn btn-gold"
          data-cursor="expand"
          style={{ margin: '40px auto', display: 'inline-block' }}
        >
          BEGIN A CONVERSATION
        </a>

        {/* Social Icons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          marginTop: 48,
        }}>
          {SOCIALS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="link"
              style={{
                width: 52,
                height: 52,
                border: '1px solid var(--gold-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                transition: 'border-color 0.3s, transform 0.3s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold)';
                e.currentTarget.style.transform = 'translateY(-5px)';
                const svg = e.currentTarget.querySelector('svg path') as SVGPathElement;
                if (svg) svg.setAttribute('fill', 'var(--gold)');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold-border)';
                e.currentTarget.style.transform = 'translateY(0)';
                const svg = e.currentTarget.querySelector('svg path') as SVGPathElement;
                if (svg) svg.setAttribute('fill', 'var(--ivory-dim)');
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d={social.icon} fill="var(--ivory-dim)" />
              </svg>
            </a>
          ))}
        </div>

        {/* Social Labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          marginTop: 8,
        }}>
          {SOCIALS.map((social) => (
            <span
              key={social.label}
              style={{
                width: 52,
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.15em',
                color: 'var(--ivory-dim)',
                textAlign: 'center',
              }}
            >
              {social.label}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          #contact { padding: 72px 24px !important; }
        }
      `}</style>
    </section>
  );
}
