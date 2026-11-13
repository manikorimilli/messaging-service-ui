import { beforeEach, describe, expect, it } from 'vitest';
import * as mock from '../api/mockApi.js';
import { MOCK_PROVIDERS } from '../api/mockData.js';
import { PROVIDER_EXAMPLE } from '../utils/providerConfig.js';
import {
  BACKEND_BUILT_INS,
  UAAP_PARAMETERS,
  describeSendTimeParameter,
  detectParameters,
  isSendTimeParameter,
  missingParameters,
  parameterValue,
  placeholderProblems,
  toBackendPlaceholders,
  withParameterValues,
} from '../utils/providerParams.js';
import { validateProviderConfig } from '../utils/validation.js';

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

describe('parameters in the mock providers', () => {
  it('finds every provider parameter, each with a value in variables', () => {
    for (const provider of MOCK_PROVIDERS) {
      const { provider: names, sendTime } = detectParameters(provider);
      expect(names.length, provider.id).toBeGreaterThan(0);
      expect(missingParameters(names, {}, provider.variables), provider.id).toEqual([]);
      expect(sendTime.every(isSendTimeParameter), provider.id).toBe(true);
    }
    expect(detectParameters(MOCK_PROVIDERS.find((p) => p.id === 'TEXTLOCAL'))).toEqual({
      provider: ['api-token', 'sender'],
      sendTime: ['to_digits', 'text'],
    });
  });
});

describe('register flow with parameters', () => {
  beforeEach(() => {
    mock.setMockLatency(0);
    mock.resetMockStore();
  });

  const cfg = {
    id: 'demo',
    'display-name': 'Demo',
    channels: ['SMS'],
    request: {
      method: 'POST',
      url: 'https://api.example.com/{account}/send',
      auth: { type: 'bearer', token: '{{token}}' },
      body: { format: 'json', fields: { from: '{sender}', to: '{{to}}', text: '{uaap.message.text}' } },
    },
    response: { 'id-path': '$.id' },
  };

  it('blocks saving while a parameter is empty', () => {
    const { provider } = detectParameters(cfg);
    expect(provider).toEqual(['account', 'token', 'sender']);
    expect(missingParameters(provider, { account: 'A1', token: ' ' }, cfg.variables)).toEqual(['token', 'sender']);
  });

  it('saves the entered values and the backend form of every placeholder', async () => {
    const values = { account: 'A1', token: 'demo-token', sender: 'DEMO' };
    const { provider } = detectParameters(cfg);
    expect(missingParameters(provider, values, cfg.variables)).toEqual([]);
    const ready = withParameterValues(cfg, values);
    expect(validateProviderConfig(ready, { mode: 'create' }).problems).toEqual([]);

    await mock.registerProvider(toBackendPlaceholders(ready));
    const saved = await mock.getProvider('DEMO');
    expect(saved.variables).toEqual({ account: 'A1', token: '****', sender: 'DEMO' });
    expect(saved.request.url).toBe('https://api.example.com/{{account}}/send');
    expect(saved.request.body.fields).toEqual({ from: '{{sender}}', to: '{{to}}', text: '{{text}}' });
  });
});

describe('uaap parameters', () => {
  it('maps each uaap name to the backend built-in it stands for', () => {
    expect(describeSendTimeParameter('uaap.message.to')).toEqual({ uaap: 'uaap.message.to', builtIn: 'to', source: 'recipient number' });
    expect(describeSendTimeParameter('uaap.message.template')).toMatchObject({ builtIn: 'text' });
    expect(describeSendTimeParameter('to_digits')).toMatchObject({ uaap: 'uaap.message.to_digits' });
    expect(describeSendTimeParameter('uaap.message.unknown')).toBeNull();
    expect(Object.values(UAAP_PARAMETERS).every((name) => BACKEND_BUILT_INS.includes(name))).toBe(true);
  });

  it('rewrites placeholders to {{name}} and leaves variables, ${ENV} and unknown uaap names alone', () => {
    const before = {
      variables: { token: '{keep}' },
      request: {
        url: 'https://x/${HOST}/{account}',
        body: { fields: { a: '{uaap.message.to}', b: '{{ uaap.message.template }}', c: '{uaap.message.nope}', d: '{{to_digits}}' } },
      },
      response: { 'id-path': '$.id' },
    };
    expect(toBackendPlaceholders(before)).toEqual({
      variables: { token: '{keep}' },
      request: {
        url: 'https://x/${HOST}/{{account}}',
        body: { fields: { a: '{{to}}', b: '{{text}}', c: '{uaap.message.nope}', d: '{{to_digits}}' } },
      },
      response: { 'id-path': '$.id' },
    });
    expect(toBackendPlaceholders(null)).toBeNull();
  });

  it('reports what the backend would reject', () => {
    const problems = placeholderProblems({
      variables: { text: 'x', sender: 'S' },
      request: {
        url: 'https://x/{uaap.message.to}',
        body: { fields: { a: '{uaap.message.nope}', b: '{api.key}', c: '{sender}' } },
      },
    });
    expect(problems).toEqual([
      '{uaap.message.nope} is not a known uaap parameter. Use one of: uaap.message.to, uaap.message.to_digits, uaap.message.text, uaap.message.template',
      '{api.key} may contain only letters, digits, "_" and "-"',
      'request.url cannot use {uaap.message.to}. Message values are not allowed in the URL.',
      'variables.text clashes with the built-in {{text}}. Rename it.',
    ]);
    expect(placeholderProblems(PROVIDER_EXAMPLE)).toEqual([]);
  });

  it('requires a variables entry for every parameter unless the form reports it', () => {
    const cfg = { ...PROVIDER_EXAMPLE, variables: { 'auth-token': 't' } };
    expect(validateProviderConfig(cfg).problems).toEqual([
      '{auth-id} has no value. Add "auth-id" to variables.',
      '{from} has no value. Add "from" to variables.',
    ]);
    expect(validateProviderConfig(cfg, { requireVariables: false }).problems).toEqual([]);
  });
});
