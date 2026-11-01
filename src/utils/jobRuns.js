// Pure helpers for the scheduled job runs page.
import { statusTone } from './format.js';

// Whole-number percentage, or null when there is nothing to divide.
export function percent(part, whole) {
  return whole ? Math.round((part / whole) * 100) : null;
}

export const RUN_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'success', label: 'Completed' },
  { key: 'warning', label: 'Partial' },
  { key: 'error', label: 'Failed' },
];

// Filter key for a run, from the same tone its status badge uses.
export function runFilterKey(run) {
  return statusTone(run?.status);
}

export function filterRuns(runs, key) {
  const list = Array.isArray(runs) ? runs : [];
  return key === 'all' ? list : list.filter((run) => runFilterKey(run) === key);
}

export function countByFilter(runs) {
  const counts = { all: 0, success: 0, warning: 0, error: 0 };
  for (const run of Array.isArray(runs) ? runs : []) {
    counts.all += 1;
    const key = runFilterKey(run);
    if (key in counts) counts[key] += 1;
  }
  return counts;
}

// Totals across every run in the list.
export function runTotals(runs) {
  const list = Array.isArray(runs) ? runs : [];
  const total = list.reduce((n, r) => n + (r.total || 0), 0);
  const accepted = list.reduce((n, r) => n + (r.accepted || 0), 0);
  const failed = list.reduce((n, r) => n + (r.failed || 0), 0);
  return { runs: list.length, total, accepted, failed, rate: percent(accepted, total) };
}

// Accepted and failed recipients per provider across every run, busiest first.
export function providerTotals(runs) {
  const byProvider = new Map();
  for (const run of Array.isArray(runs) ? runs : []) {
    for (const g of run.groups || []) {
      const row = byProvider.get(g.provider) || { provider: g.provider, total: 0, accepted: 0, failed: 0 };
      row.total += g.total || 0;
      row.accepted += g.accepted || 0;
      row.failed += g.failed || 0;
      byProvider.set(g.provider, row);
    }
  }
  return [...byProvider.values()]
    .map((row) => ({ ...row, rate: percent(row.accepted, row.total) }))
    .sort((a, b) => b.total - a.total || a.provider.localeCompare(b.provider));
}

// A round chart maximum at or above `value` whose half is a whole number.
export function niceMax(value) {
  if (!value || value <= 0) return 2;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 3, 4, 5, 6, 8, 10].find((m) => m * power >= value && (m * power) % 2 === 0);
  return step * power;
}
