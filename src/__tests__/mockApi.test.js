import { beforeEach, describe, expect, it } from 'vitest';
import * as mock from '../api/mockApi.js';
import { PROVIDER_EXAMPLE, toWritePayload } from '../utils/providerConfig.js';

beforeEach(() => {
  mock.setMockLatency(0);
  mock.resetMockStore();
});

describe('mock providers', () => {
  it('lists providers sorted by id with secrets masked', async () => {
    const list = await mock.listProviders();
    expect(list.map((p) => p.id)).toEqual(['MSG91', 'TEXTLOCAL', 'TWILIO', 'VONAGE']);
    const twilio = list.find((p) => p.id === 'TWILIO');
    expect(twilio['read-only']).toBe(true);
    expect(twilio.variables['auth-token']).toBe('****');
    expect(twilio.variables.from).toBe('+15550001111');
  });

  it('looks up ids case-insensitively', async () => {
    await expect(mock.getProvider('twilio')).resolves.toMatchObject({ id: 'TWILIO' });
    await expect(mock.getProvider('nope')).rejects.toMatchObject({ status: 404, code: 'PROVIDER_NOT_FOUND' });
  });

  it('registers with uppercase id, rejects duplicates', async () => {
    const saved = await mock.registerProvider(PROVIDER_EXAMPLE);
    expect(saved).toMatchObject({ id: 'PLIVO', source: 'db.json', 'read-only': false });
    expect(saved.variables['auth-token']).toBe('****');
    await expect(mock.registerProvider(PROVIDER_EXAMPLE)).rejects.toMatchObject({ status: 409, code: 'PROVIDER_ALREADY_EXISTS' });
  });

  it('keeps the stored secret when an update sends ****', async () => {
    await mock.registerProvider(PROVIDER_EXAMPLE);
    const fetched = await mock.getProvider('PLIVO');
    await mock.updateProvider('PLIVO', toWritePayload({ ...fetched, 'display-name': 'Plivo 2' }));
    // Toggling resends the fetched config, masked secrets included, as the UI does.
    await mock.updateProvider('PLIVO', toWritePayload({ ...(await mock.getProvider('PLIVO')), enabled: false }));
    const after = await mock.getProvider('plivo');
    expect(after['display-name']).toBe('Plivo 2');
    expect(after.enabled).toBe(false);
    // "****" only works for a secret the server already has.
    await expect(
      mock.updateProvider('PLIVO', { ...toWritePayload(after), variables: { ...after.variables, 'new-secret': '****' } }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('protects read-only and in-use providers', async () => {
    const twilio = await mock.getProvider('TWILIO');
    await expect(mock.updateProvider('TWILIO', toWritePayload(twilio))).rejects.toMatchObject({ status: 409, code: 'PROVIDER_READ_ONLY' });
    await expect(mock.deleteProvider('TWILIO')).rejects.toMatchObject({ code: 'PROVIDER_READ_ONLY' });
    await expect(mock.deleteProvider('MSG91')).rejects.toMatchObject({ status: 409, code: 'PROVIDER_IN_USE' });
    await expect(mock.deleteProvider('TEXTLOCAL')).resolves.toBeNull();
  });
});

describe('mock sends', () => {
  it('uses the primary provider when provider is omitted', async () => {
    const res = await mock.sendSms({ type: 'SMS', to: '+919876543210', body: 'Hello' });
    expect(res).toMatchObject({ status: 'ACCEPTED', provider: 'TWILIO', providerStatus: 'queued' });
    expect(res.providerMessageId).toMatch(/^SM/);
  });

  it('rejects disabled providers with 503', async () => {
    await expect(
      mock.sendSms({ type: 'SMS', provider: 'textlocal', to: '+919876543210', body: 'Hello' }),
    ).rejects.toMatchObject({ status: 503, code: 'PROVIDER_UNAVAILABLE' });
  });

  it('returns partial success in a batch and removes duplicates', async () => {
    const res = await mock.sendBatchSms({
      type: 'SMS',
      provider: 'VONAGE',
      recipients: ['+919876543210', '+919876543000', '+919876543210'],
      body: 'Hello all',
    });
    expect(res).toMatchObject({ provider: 'VONAGE', total: 2, accepted: 1, failed: 1, duplicatesRemoved: 1 });
    expect(res.results[1]).toMatchObject({ status: 'FAILED', code: 'PROVIDER_REJECTED', providerErrorCode: '21211' });
  });
});
