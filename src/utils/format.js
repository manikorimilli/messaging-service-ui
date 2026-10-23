export function formatDateTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? String(iso) : date.toLocaleString();
}

export function formatDuration(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.floor(ms / 60000)} min ${Math.round((ms % 60000) / 1000)} s`;
}

// Badge tone for a job-run or group status. Unknown values stay neutral.
export function statusTone(status) {
  const s = String(status || '').toUpperCase();
  if (/FAIL|ERROR/.test(s)) return 'error';
  if (s === 'PARTIAL') return 'warning';
  if (/SUCCESS|COMPLETE|SENT|DONE|OK/.test(s)) return 'success';
  if (/RUNNING|PROGRESS|STARTED|PENDING/.test(s)) return 'info';
  return 'neutral';
}

// Tone for an accepted/failed split: all accepted, none accepted, or mixed.
export function outcomeTone({ accepted, failed }) {
  if (!failed) return 'success';
  if (!accepted) return 'error';
  return 'warning';
}

const RELATIVE_UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

// "5 minutes ago", "yesterday", "just now". An empty string for a bad date.
export function formatRelative(iso, now = Date.now()) {
  if (!iso) return '';
  const seconds = (new Date(iso).getTime() - now) / 1000;
  if (Number.isNaN(seconds)) return '';
  if (Math.abs(seconds) < 45) return 'just now';
  const [unit, size] = RELATIVE_UNITS.find(([, s]) => Math.abs(seconds) >= s) || RELATIVE_UNITS.at(-1);
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round(seconds / size), unit);
}
