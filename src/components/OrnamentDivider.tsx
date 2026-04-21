export default function OrnamentDivider() {
  return (
    <div className="ornament-rule">
      <div className="rule-line" />
      <svg width="64" height="32" viewBox="0 0 64 32">
        {/* Left diamond */}
        <polygon
          points="10,16 16,10 22,16 16,22"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1"
          opacity="0.6"
        />
        {/* Center 8-pointed star */}
        <path
          d="M32,8 L34,14 L40,16 L34,18 L32,24 L30,18 L24,16 L30,14 Z
             M32,11 L33,14 L36,16 L33,18 L32,21 L31,18 L28,16 L31,14 Z"
          fill="var(--gold)"
          opacity="0.7"
        />
        {/* Right diamond */}
        <polygon
          points="42,16 48,10 54,16 48,22"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1"
          opacity="0.6"
        />
      </svg>
      <div className="rule-line rule-line--right" />
    </div>
  );
}
