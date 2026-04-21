export default function Marquee() {
  const text = 'DEVELOPER · CREATOR · KOLKATA · VISUAL THINKER · CODE & CRAFT · ';

  return (
    <div
      style={{
        height: 46,
        overflow: 'hidden',
        background: 'var(--gold)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div
        className="marquee-track"
        style={{
          display: 'flex',
          whiteSpace: 'nowrap',
          animation: 'marquee-scroll 20s linear infinite',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            letterSpacing: '0.32em',
            fontWeight: 600,
            color: 'var(--ink)',
            padding: '0 24px',
          }}
        >
          {text.repeat(6)}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            letterSpacing: '0.32em',
            fontWeight: 600,
            color: 'var(--ink)',
            padding: '0 24px',
          }}
        >
          {text.repeat(6)}
        </span>
      </div>
      <style>{`
        .marquee-track:hover { animation-play-state: paused; }
        @media (max-width: 767px) {
          .marquee-track span { font-size: 9px !important; }
        }
      `}</style>
    </div>
  );
}
