export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <span className="site-footer-text site-footer-text-left">
        © {year}
      </span>

      <span className="site-footer-text site-footer-text-center">
        ✦ ANURAG DOLUI · BUILT WITH INTENTION · DESIGNED WITH SOUL ✦
      </span>

      <span className="site-footer-text site-footer-text-right">
        KOLKATA, INDIA
      </span>
    </footer>
  );
}
