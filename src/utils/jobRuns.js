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
