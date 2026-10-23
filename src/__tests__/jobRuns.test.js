import { beforeEach, describe, expect, it } from 'vitest';
import * as mock from '../api/mockApi.js';
import { formatDuration, outcomeTone, statusTone } from '../utils/format.js';
import { camelizeKeys } from '../utils/keys.js';

beforeEach(() => {
  mock.setMockLatency(0);
  mock.resetMockStore();
});

describe('camelizeKeys', () => {
  it('converts the job-run kebab-case keys recursively', () => {
    const run = camelizeKeys({
      'run-id': 'r1',
      'targets-version': '2026-10-20',
      groups: [{ 'duplicates-removed': 0, results: [{ 'provider-error-code': '572006', 'provider-message-id': null }] }],
    });
    expect(run).toEqual({
      runId: 'r1',
      targetsVersion: '2026-10-20',
      groups: [{ duplicatesRemoved: 0, results: [{ providerErrorCode: '572006', providerMessageId: null }] }],
    });
  });
});

describe('mock job runs', () => {
  it('lists runs newest first without per-recipient results', async () => {
    const runs = await mock.listJobRuns();
    expect(runs.length).toBeGreaterThan(0);
    expect(new Date(runs[0]['started-at']) > new Date(runs[1]['started-at'])).toBe(true);
    expect(runs[0].groups[0]).not.toHaveProperty('results');
  });

  it('returns one run with results, and 404 for an unknown id', async () => {
    const [first] = await mock.listJobRuns();
    const run = await mock.getJobRun(first['run-id']);
    expect(run.groups[0].results.length).toBe(run.groups[0].total);
    await expect(mock.getJobRun('nope')).rejects.toMatchObject({ status: 404, code: 'JOB_RUN_NOT_FOUND' });
  });
});

describe('job-run formatting', () => {
  it('formats durations, including the backend nanosecond timestamps', () => {
    expect(formatDuration('2026-10-23T11:47:00.000399941+05:30', '2026-10-23T11:47:01.336490433+05:30')).toBe('1.3 s');
    expect(formatDuration('2026-10-23T11:47:00Z', null)).toBeNull();
    expect(formatDuration('2026-10-23T11:47:00Z', '2026-10-23T11:49:05Z')).toBe('2 min 5 s');
  });

  it('maps statuses to badge tones, unknown ones to neutral', () => {
    expect(statusTone('PARTIAL')).toBe('warning');
    expect(statusTone('SENT')).toBe('success');
    expect(statusTone('FAILED')).toBe('error');
    expect(statusTone('SOMETHING_NEW')).toBe('neutral');
    expect(outcomeTone({ accepted: 0, failed: 2 })).toBe('error');
    expect(outcomeTone({ accepted: 1, failed: 1 })).toBe('warning');
    expect(outcomeTone({ accepted: 1, failed: 0 })).toBe('success');
  });
});
