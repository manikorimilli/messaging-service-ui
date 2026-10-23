import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildBatchRequest, buildSmsRequest } from '../api/index.js';
import { request } from '../api/httpClient.js';

describe('request builders', () => {
  it('omits provider when using the primary provider', () => {
    expect(buildSmsRequest({ provider: '', to: '+919876543210', body: 'Hi' })).toEqual({
      type: 'SMS',
      to: '+919876543210',
      body: 'Hi',
    });
    expect(buildBatchRequest({ provider: '', recipients: ['+919876543210'], body: 'Hi' })).not.toHaveProperty('provider');
  });
  it('includes provider when one is selected', () => {
    expect(buildSmsRequest({ provider: 'TWILIO', to: '+919876543210', body: 'Hi' })).toEqual({
      type: 'SMS',
      provider: 'TWILIO',
      to: '+919876543210',
      body: 'Hi',
    });
  });
});

describe('httpClient.request', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns null for 204 without reading the body', async () => {
    const text = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 204, ok: true, text }));
    await expect(request('DELETE', '/api/v1/providers/X')).resolves.toBeNull();
    expect(text).not.toHaveBeenCalled();
  });

  it('sends JSON with the right content type', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 202, ok: true, text: async () => '{"status":"ACCEPTED"}' });
    vi.stubGlobal('fetch', fetchMock);
    await expect(request('POST', '/api/v1/messages', { a: 1 })).resolves.toEqual({ status: 'ACCEPTED' });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"a":1}');
  });

  it('turns a problem response into an ApiError with detail, problems and providerErrorCode', async () => {
    const body = {
      title: 'Provider rejected the message',
      status: 502,
      detail: 'Invalid number',
      code: 'PROVIDER_REJECTED',
      providerErrorCode: '21211',
      problems: ['to is invalid'],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 502, ok: false, text: async () => JSON.stringify(body) }));
    await expect(request('POST', '/api/v1/messages', {})).rejects.toMatchObject({
      name: 'ApiError',
      status: 502,
      code: 'PROVIDER_REJECTED',
      detail: 'Invalid number',
      providerErrorCode: '21211',
      problems: ['to is invalid'],
    });
  });

  it('shows field errors from message validation as problems', async () => {
    // Shape returned by the real backend for POST /api/v1/messages.
    const body = {
      title: 'Validation failed',
      status: 400,
      detail: 'The request has invalid fields.',
      code: 'VALIDATION_FAILED',
      errors: [
        { field: 'body', message: 'must not be blank' },
        { field: 'to', message: 'must be in E.164 format, for example +919876543210' },
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 400, ok: false, text: async () => JSON.stringify(body) }));
    await expect(request('POST', '/api/v1/messages', {})).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      problems: ['body: must not be blank', 'to: must be in E.164 format, for example +919876543210'],
    });
  });

  it('reports network failures as NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(request('GET', '/api/v1/providers')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});
