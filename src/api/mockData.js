// Sample providers for mock mode. Secret values here are fake and are
// never returned to the UI: the mock API masks them as "****", like the backend.
export const MOCK_PRIMARY_PROVIDER = 'TWILIO';

// Providers the mock server pretends are referenced in routing (cannot be deleted).
export const MOCK_PROVIDERS_IN_USE = ['MSG91'];

export const MOCK_PROVIDERS = [
  {
    id: 'TWILIO',
    'display-name': 'Twilio',
    channels: ['SMS'],
    source: 'providers.json',
    enabled: true,
    variables: {
      'account-sid': 'AC00000000000000000000000000000000',
      'auth-token': 'mock-twilio-token',
      from: '+15550001111',
    },
    request: {
      method: 'POST',
      url: 'https://api.twilio.com/2010-04-01/Accounts/{{account-sid}}/Messages.json',
      auth: { type: 'basic', username: '{{account-sid}}', password: '{{auth-token}}' },
      body: { format: 'form', fields: { To: '{{to}}', From: '{{from}}', Body: '{{text}}' } },
    },
    response: {
      'id-path': '$.sid',
      'status-path': '$.status',
      error: { 'message-path': '$.message', 'code-path': '$.code' },
    },
  },
  {
    id: 'VONAGE',
    'display-name': 'Vonage',
    channels: ['SMS'],
    source: 'providers.json',
    enabled: true,
    variables: {
      'api-key': 'mock-vonage-key',
      'api-secret': 'mock-vonage-secret',
      from: 'Innoridge',
    },
    request: {
      method: 'POST',
      url: 'https://rest.nexmo.com/sms/json',
      auth: { type: 'none' },
      body: {
        format: 'form',
        fields: {
          api_key: '{{api-key}}',
          api_secret: '{{api-secret}}',
          from: '{{from}}',
          to: '{{to_digits}}',
          text: '{{text}}',
        },
      },
    },
    response: {
      'id-path': '$.messages[0].message-id',
      'status-path': '$.messages[0].status',
      error: { 'message-path': '$.messages[0].error-text' },
    },
  },
  {
    id: 'MSG91',
    'display-name': 'MSG91',
    channels: ['SMS'],
    source: 'db.json',
    enabled: true,
    variables: {
      'auth-key': 'mock-msg91-key',
      sender: 'INNRDG',
    },
    request: {
      method: 'POST',
      url: 'https://control.msg91.com/api/v5/flow/',
      auth: { type: 'header', name: 'authkey', value: '{{auth-key}}' },
      body: {
        format: 'json',
        fields: { sender: '{{sender}}', mobiles: '{{to_digits}}', message: '{{text}}' },
      },
    },
    response: { 'id-path': '$.request_id', error: { 'message-path': '$.message' } },
  },
  {
    id: 'TEXTLOCAL',
    'display-name': 'Textlocal',
    channels: ['SMS'],
    source: 'db.json',
    enabled: false,
    variables: {
      'api-token': 'mock-textlocal-token',
      sender: 'TXTLCL',
    },
    request: {
      method: 'POST',
      url: 'https://api.textlocal.in/send/',
      auth: { type: 'bearer', token: '{{api-token}}' },
      body: { format: 'form', fields: { sender: '{{sender}}', numbers: '{{to_digits}}', message: '{{text}}' } },
    },
    response: { 'id-path': '$.messages[0].id', error: { 'message-path': '$.errors[0].message' } },
  },
];

// Sample scheduled-job runs, in the backend's kebab-case shape (detail form,
// with per-recipient results). Times are relative to page load.
function minutesAgo(minutes, extraMs = 0) {
  return new Date(Date.now() - minutes * 60000 + extraMs).toISOString();
}

function mockRun(id, minutes, groups) {
  const total = groups.reduce((n, g) => n + g.total, 0);
  const accepted = groups.reduce((n, g) => n + g.accepted, 0);
  return {
    'run-id': id,
    'started-at': minutesAgo(minutes),
    'finished-at': minutesAgo(minutes, 1200),
    status: 'PARTIAL',
    'targets-version': '2026-10-20',
    total,
    accepted,
    failed: total - accepted,
    groups,
  };
}

const TWILIO_REJECTED = {
  status: 'FAILED',
  code: 'PROVIDER_REJECTED',
  'provider-error-code': '572006',
  detail: 'Twilio rejected the message: Invalid template name. Trial accounts can only use predefined SMS templates.',
};

function mockGroups() {
  return [
    {
      provider: 'TWILIO',
      status: 'SENT',
      total: 2,
      accepted: 0,
      failed: 2,
      'duplicates-removed': 0,
      results: [
        { to: '+919876543210', ...TWILIO_REJECTED },
        { to: '+919876543211', ...TWILIO_REJECTED },
      ],
    },
    {
      provider: 'VONAGE',
      status: 'SENT',
      total: 1,
      accepted: 1,
      failed: 0,
      'duplicates-removed': 0,
      results: [{ to: '+919876543212', status: 'ACCEPTED', 'provider-message-id': 'mock-6bfdbd7f', 'provider-status': '0' }],
    },
  ];
}

export function createMockJobRuns() {
  return [
    mockRun('mock-run-0003', 1, mockGroups()),
    mockRun('mock-run-0002', 2, mockGroups()),
    mockRun('mock-run-0001', 3, mockGroups()),
  ];
}
