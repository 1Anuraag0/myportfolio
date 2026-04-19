export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        height: 76,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 80px',
        borderTop: '1px solid rgba(201, 162, 39, 0.1)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          letterSpacing: '0.4em',
          textTransform: 'uppercase' as const,
          color: 'rgba(201, 162, 39, 0.35)',
        }}
      >
        © {year}
      </span>

      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          letterSpacing: '0.4em',
          textTransform: 'uppercase' as const,
          color: 'rgba(201, 162, 39, 0.32)',
        }}
      >
        ✦ ANURAG DOLUI · BUILT WITH INTENTION · DESIGNED WITH SOUL ✦
      </span>

      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          letterSpacing: '0.4em',
          textTransform: 'uppercase' as const,
          color: 'rgba(201, 162, 39, 0.35)',
        }}
      >
        KOLKATA, INDIA
      </span>
    </footer>
  );
}
