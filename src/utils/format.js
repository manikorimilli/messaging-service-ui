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
