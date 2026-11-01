import { describe, expect, it } from 'vitest';
import { niceMax, providerTotals, runTotals } from '../utils/jobRuns.js';
import { overviewRedirect } from '../utils/routes.js';

const runs = [
  {
    total: 3,
    accepted: 1,
    failed: 2,
    groups: [
      { provider: 'TWILIO', total: 2, accepted: 0, failed: 2 },
      { provider: 'VONAGE', total: 1, accepted: 1, failed: 0 },
    ],
  },
  { total: 5, accepted: 5, failed: 0, groups: [{ provider: 'VONAGE', total: 5, accepted: 5, failed: 0 }] },
];

describe('overview totals', () => {
  it('adds up every run', () => {
    expect(runTotals(runs)).toEqual({ runs: 2, total: 8, accepted: 6, failed: 2, rate: 75 });
    expect(runTotals([])).toEqual({ runs: 0, total: 0, accepted: 0, failed: 0, rate: null });
  });

  it('adds up each provider across runs, busiest first', () => {
    expect(providerTotals(runs)).toEqual([
      { provider: 'VONAGE', total: 6, accepted: 6, failed: 0, rate: 100 },
      { provider: 'TWILIO', total: 2, accepted: 0, failed: 2, rate: 0 },
    ]);
  });

  it('rounds the chart maximum up to a value with a whole-number half', () => {
    expect(niceMax(0)).toBe(2);
    expect(niceMax(3)).toBe(4);
    expect(niceMax(5)).toBe(6);
    expect(niceMax(29)).toBe(30);
    expect(niceMax(31)).toBe(40);
  });
});

describe('hidden overview route', () => {
  it('redirects the /overview path to the hash route', () => {
    expect(overviewRedirect('/overview', '')).toBe('/#/overview');
    expect(overviewRedirect('/overview/', '')).toBe('/#/overview');
  });

  it('leaves every other address alone', () => {
    expect(overviewRedirect('/', '#/providers')).toBeNull();
    expect(overviewRedirect('/', '#/overview')).toBeNull();
    expect(overviewRedirect('/overview', '#/providers')).toBeNull();
  });
});
