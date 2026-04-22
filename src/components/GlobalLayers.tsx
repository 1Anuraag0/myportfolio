export default function GlobalLayers() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        background: '#000000',
      }}
    />
  );
}
