// size="sm" suits text values such as dates or badges.
export function Stat({ label, value, tone, size }) {
  const classes = ['stat', tone && `stat-${tone}`, size && `stat-${size}`].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <span className="stat-value">{value ?? 0}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
