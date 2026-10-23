import { describe, expect, it } from 'vitest';
import { PROVIDER_EXAMPLE, toWritePayload } from '../utils/providerConfig.js';
import {
  mergeRecipients,
  validateBody,
  validatePhone,
  validateProviderConfig,
  validateRecipients,
} from '../utils/validation.js';

describe('validatePhone', () => {
  it('accepts E.164 numbers', () => {
    expect(validatePhone('+919876543210')).toBeNull();
    expect(validatePhone(' +15550001111 ')).toBeNull();
  });
  it('rejects non E.164 numbers', () => {
    for (const bad of ['', '919876543210', '+0123456789', '+1234567', '+1234567890123456', '+91 98765 43210']) {
      expect(validatePhone(bad)).not.toBeNull();
    }
  });
});

describe('validateBody', () => {
  it('requires 1 to 1600 characters', () => {
    expect(validateBody('')).not.toBeNull();
    expect(validateBody('   ')).not.toBeNull();
    expect(validateBody('a'.repeat(1600))).toBeNull();
    expect(validateBody('a'.repeat(1601))).toMatch(/1 characters over/);
  });
});

describe('mergeRecipients', () => {
  it('adds valid numbers from a pasted list and reports the rest', () => {
    const result = mergeRecipients(['+919876543210'], '+919876543211\r\n+919876543210, bad;+919876543212');
    expect(result.recipients).toEqual(['+919876543210', '+919876543211', '+919876543212']);
    expect(result.duplicates).toEqual(['+919876543210']);
    expect(result.invalid).toEqual(['bad']);
    expect(result.overflow).toEqual([]);
  });
  it('stops at the recipient limit', () => {
    const result = mergeRecipients(['+919876543210'], '+919876543211 +919876543212', 2);
    expect(result.recipients).toHaveLength(2);
    expect(result.overflow).toEqual(['+919876543212']);
  });
});

describe('validateRecipients', () => {
  it('enforces 1 to 100 valid recipients', () => {
    expect(validateRecipients([])).toMatch(/at least one/);
    const many = Array.from({ length: 101 }, (_, i) => `+91987654${String(i).padStart(4, '0')}`);
    expect(validateRecipients(many)).toMatch(/limit is 100/);
    expect(validateRecipients(['+919876543210', 'nope'])).toMatch(/not valid/);
    expect(validateRecipients(['+919876543210'])).toBeNull();
  });
});

describe('validateProviderConfig', () => {
  it('accepts the documented registration example', () => {
    expect(validateProviderConfig(PROVIDER_EXAMPLE).problems).toEqual([]);
  });

  it('reports missing request and response like the backend', () => {
    const { problems } = validateProviderConfig({ id: 'X', 'display-name': 'X', channels: ['SMS'] });
    expect(problems).toContain('request is missing');
    expect(problems).toContain('response is missing');
  });

  it('rejects bad ids, env placeholders, auth types and body formats', () => {
    const cfg = {
      ...PROVIDER_EXAMPLE,
      id: 'bad id!',
      variables: { token: '${PLIVO_TOKEN}' },
      request: { url: 'https://x', auth: { type: 'oauth' }, body: { format: 'xml' } },
    };
    const { problems } = validateProviderConfig(cfg);
    expect(problems.some((p) => p.startsWith('id may contain'))).toBe(true);
    expect(problems.some((p) => p.includes('environment placeholder'))).toBe(true);
    expect(problems.some((p) => p.startsWith('request.auth.type'))).toBe(true);
    expect(problems.some((p) => p.startsWith('request.body.format'))).toBe(true);
  });

  it('allows masked secrets on update but not on create', () => {
    const cfg = { ...PROVIDER_EXAMPLE, variables: { 'auth-token': '****' } };
    expect(validateProviderConfig(cfg, { mode: 'create' }).problems.some((p) => p.includes('masked'))).toBe(true);
    expect(validateProviderConfig(cfg, { mode: 'update', pathId: 'PLIVO' }).problems).toEqual([]);
  });

  it('requires the update id to match the path id, case-insensitively, or be omitted', () => {
    expect(validateProviderConfig({ ...PROVIDER_EXAMPLE, id: 'plivo' }, { mode: 'update', pathId: 'PLIVO' }).problems).toEqual([]);
    const { id, ...withoutId } = PROVIDER_EXAMPLE;
    expect(id).toBe('plivo');
    expect(validateProviderConfig(withoutId, { mode: 'update', pathId: 'PLIVO' }).problems).toEqual([]);
    expect(validateProviderConfig(PROVIDER_EXAMPLE, { mode: 'update', pathId: 'OTHER' }).problems).toHaveLength(1);
  });

  it('warns about response-only metadata, which toWritePayload strips', () => {
    const cfg = { ...PROVIDER_EXAMPLE, source: 'db.json', 'read-only': false };
    expect(validateProviderConfig(cfg).warnings.some((w) => w.includes('response-only'))).toBe(true);
    const payload = toWritePayload(cfg);
    expect(payload).not.toHaveProperty('source');
    expect(payload).not.toHaveProperty('read-only');
    expect(payload.request.url).toContain('{{auth-id}}');
  });
});
