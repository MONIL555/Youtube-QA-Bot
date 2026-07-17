export default function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}>
      {[0, 0.2, 0.4].map((delay, i) => (
        <div key={i} style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: 'var(--accent-cyan)',
          animation: `pulse 1s ease-in-out ${delay}s infinite`,
        }} />
      ))}
    </div>
  );
}
