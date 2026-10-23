export const MASKED_VALUE = '****';
export const RESPONSE_ONLY_FIELDS = ['source', 'read-only'];
export const AUTH_TYPES = ['basic', 'bearer', 'header', 'none'];
export const BODY_FORMATS = ['form', 'json'];

// Strip response-only metadata before a POST or PUT. Everything else,
// including masked secrets and {{...}} placeholders, is sent unchanged.
export function toWritePayload(cfg) {
  const payload = { ...cfg };
  for (const field of RESPONSE_ONLY_FIELDS) delete payload[field];
  return payload;
}

export const isReadOnly = (provider) => provider?.['read-only'] === true;

export const supportsSms = (provider) =>
  Array.isArray(provider?.channels) &&
  provider.channels.some((c) => String(c).toUpperCase() === 'SMS');

export const providerLabel = (provider) =>
  provider?.['display-name'] ? `${provider['display-name']} (${provider.id})` : provider?.id ?? '';

export const PROVIDER_EXAMPLE = {
  id: 'plivo',
  'display-name': 'Plivo',
  channels: ['SMS'],
  enabled: true,
  variables: {
    'auth-id': 'MA123',
    'auth-token': 'your-token',
    from: '+15550001111',
  },
  request: {
    method: 'POST',
    url: 'https://api.plivo.com/v1/Account/{{auth-id}}/Message/',
    auth: { type: 'basic', username: '{{auth-id}}', password: '{{auth-token}}' },
    body: {
      format: 'json',
      fields: { src: '{{from}}', dst: '{{to_digits}}', text: '{{text}}' },
    },
  },
  response: {
    'id-path': '$.message_uuid[0]',
    error: { 'message-path': '$.error' },
  },
};
