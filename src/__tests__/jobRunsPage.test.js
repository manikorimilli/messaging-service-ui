import { describe, expect, it } from 'vitest';
import { formatRelative } from '../utils/format.js';
import { countByFilter, filterRuns, percent } from '../utils/jobRuns.js';

const runs = [
  { status: 'PARTIAL', total: 3, accepted: 1, failed: 2 },
  { status: 'COMPLETED', total: 2, accepted: 2, failed: 0 },
  { status: 'COMPLETED', total: 5, accepted: 5, failed: 0 },
  { status: 'FAILED', total: 0, accepted: 0, failed: 0 },
];

describe('job run helpers', () => {
  it('filters and counts runs by status', () => {
    expect(countByFilter(runs)).toEqual({ all: 4, success: 2, warning: 1, error: 1 });
    expect(filterRuns(runs, 'success')).toHaveLength(2);
    expect(filterRuns(runs, 'error')[0].status).toBe('FAILED');
    expect(filterRuns(runs, 'all')).toBe(runs);
  });

  it('rounds percentages', () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(1, 0)).toBeNull();
  });

  it('formats relative times', () => {
    const now = Date.parse('2026-10-23T12:00:00Z');
    expect(formatRelative('2026-10-23T11:59:50Z', now)).toBe('just now');
    expect(formatRelative('2026-10-23T11:55:00Z', now)).toBe('5 minutes ago');
    expect(formatRelative('2026-10-22T12:00:00Z', now)).toBe('yesterday');
    expect(formatRelative('oops', now)).toBe('');
  });
});
