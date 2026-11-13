import { describe, expect, it } from 'vitest';
import { PROVIDER_EXAMPLE } from '../utils/providerConfig.js';
import {
  detectParameters,
  isSendTimeParameter,
  missingParameters,
  parameterValue,
  withParameterValues,
} from '../utils/providerParams.js';

describe('parameterValue and missingParameters', () => {
  it('prefers the typed value, then the variables value', () => {
    expect(parameterValue('from', { from: 'typed' }, { from: 'saved' })).toBe('typed');
    expect(parameterValue('from', {}, { from: 'saved' })).toBe('saved');
    expect(parameterValue('port', {}, { port: 443 })).toBe('443');
    expect(parameterValue('from', {}, undefined)).toBe('');
  });

  it('lists parameters that are empty or only spaces, even when variables has a value', () => {
    const names = ['a', 'b', 'c', 'd'];
    expect(missingParameters(names, { b: '  ', c: 'x' }, { a: 'saved', b: 'saved' })).toEqual(['b', 'd']);
    expect(missingParameters([], {}, {})).toEqual([]);
  });
});

describe('detectParameters', () => {
  it('finds {x} and {{x}} placeholders anywhere in the config, once each, in order', () => {
    const cfg = {
      id: 'demo',
      request: {
        url: 'https://api.example.com/{accountId}/messages?key={{ apiKey }}',
        auth: { type: 'bearer', token: '{{apiToken}}' },
        body: { format: 'json', fields: { from: '{senderId}', copy: ['{accountId}'] } },
      },
    };
    expect(detectParameters(cfg)).toEqual({ provider: ['accountId', 'apiKey', 'apiToken', 'senderId'], sendTime: [] });
  });

  it('puts uaap.* and the recipient and message placeholders under send time', () => {
    const cfg = { request: { body: { fields: { a: '{uaap.message.to}', b: '{{to_digits}}', c: '{{text}}', d: '{{to}}', e: '{key}' } } } };
    expect(detectParameters(cfg)).toEqual({ provider: ['key'], sendTime: ['uaap.message.to', 'to_digits', 'text', 'to'] });
  });

  it('skips ${ENV} placeholders, JSON paths and the variables section', () => {
    const cfg = {
      variables: { token: '{notAParameter}' },
      request: { url: 'https://x/${HOST}/{path}' },
      response: { 'id-path': '$.message_uuid[0]' },
    };
    expect(detectParameters(cfg)).toEqual({ provider: ['path'], sendTime: [] });
  });

  it('handles the built-in example and non-objects', () => {
    expect(detectParameters(PROVIDER_EXAMPLE)).toEqual({ provider: ['auth-id', 'auth-token', 'from'], sendTime: ['to_digits', 'text'] });
    expect(detectParameters(null)).toEqual({ provider: [], sendTime: [] });
    expect(detectParameters([])).toEqual({ provider: [], sendTime: [] });
  });
});

describe('isSendTimeParameter', () => {
  it('matches only the uaap prefix and the known send-time names', () => {
    expect(isSendTimeParameter('uaap.sms.to')).toBe(true);
    expect(isSendTimeParameter('text')).toBe(true);
    expect(isSendTimeParameter('uaapKey')).toBe(false);
    expect(isSendTimeParameter('from')).toBe(false);
  });
});

describe('withParameterValues', () => {
  it('writes entered values into variables and keeps existing ones', () => {
    const cfg = { id: 'demo', variables: { from: 'OLD', other: 'keep' } };
    expect(withParameterValues(cfg, { from: 'NEW', token: 'abc' })).toEqual({
      id: 'demo',
      variables: { from: 'NEW', other: 'keep', token: 'abc' },
    });
  });

  it('skips blank values and leaves the config untouched when nothing was entered', () => {
    const cfg = { id: 'demo', variables: { from: 'OLD' } };
    expect(withParameterValues(cfg, { from: '' })).toBe(cfg);
    expect(withParameterValues({ id: 'demo' }, { token: 'abc' })).toEqual({ id: 'demo', variables: { token: 'abc' } });
  });
});
