export default function LoadingSkeleton({ height = '20px', width = '100%', borderRadius = 'var(--radius-sm)' }) {
  return (
    <div
      style={{
        height, width, borderRadius,
        background: 'linear-gradient(90deg, rgba(0,0,0,0.02) 25%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.02) 75%)',
        backgroundSize: '400% 100%',
        animation: 'shimmer 1.5s infinite linear',
        border: '1px solid var(--glass-border)'
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
