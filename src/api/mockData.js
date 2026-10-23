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

// Same rule as the backend: COMPLETED when every group was sent and every number
// accepted, FAILED when none was accepted, PARTIAL otherwise.
function mockRun(id, minutes, groups) {
  const total = groups.reduce((n, g) => n + g.total, 0);
  const accepted = groups.reduce((n, g) => n + g.accepted, 0);
  const everyGroupSent = groups.every((g) => g.status === 'SENT');
  return {
    'run-id': id,
    'started-at': minutesAgo(minutes),
    'finished-at': minutesAgo(minutes, 700 + total * 90),
    status: everyGroupSent && accepted === total ? 'COMPLETED' : accepted === 0 ? 'FAILED' : 'PARTIAL',
    'targets-version': '2026-10-20',
    total,
    accepted,
    failed: total - accepted,
    groups,
  };
}

const FAILURES = {
  TWILIO: {
    status: 'FAILED',
    code: 'PROVIDER_REJECTED',
    'provider-error-code': '572006',
    detail: 'Twilio rejected the message: Invalid template name. Trial accounts can only use predefined SMS templates.',
  },
  VONAGE: { status: 'FAILED', code: 'PROVIDER_TIMEOUT', detail: 'Provider did not respond within 10 seconds' },
};

// One provider group: the first `failed` numbers fail and the rest are accepted.
// skipped=true imitates a disabled provider: nothing is sent and the group has an error.
function mockGroup(provider, total, failed, seed, skipped = false) {
  if (skipped) {
    return {
      provider,
      status: 'SKIPPED',
      total: 0,
      accepted: 0,
      failed: 0,
      'duplicates-removed': 0,
      error: { code: 'PROVIDER_UNAVAILABLE', message: `Provider '${provider}' is disabled.` },
      results: [],
    };
  }
  const results = Array.from({ length: total }, (_, i) => {
    const to = `+9198765${String(43210 + i).padStart(5, '0')}`;
    if (i < failed) return { to, ...FAILURES[provider] };
    const id = `mock-${(seed * 977 + i * 131).toString(16).padStart(8, '0')}`;
    return { to, status: 'ACCEPTED', 'provider-message-id': id, 'provider-status': provider === 'VONAGE' ? '0' : 'queued' };
  });
  return {
    provider,
    status: 'SENT',
    total,
    accepted: total - failed,
    failed,
    'duplicates-removed': seed % 3 === 0 ? 1 : 0,
    results,
  };
}

// One run a day, newest first: [provider, numbers, failed, skipped] per group.
const RUN_PLAN = [
  [['TWILIO', 2, 2], ['VONAGE', 1, 0]],
  [['TWILIO', 3, 0], ['VONAGE', 2, 0]],
  [['TWILIO', 3, 0], ['VONAGE', 2, 0]],
  [['TWILIO', 3, 1], ['VONAGE', 2, 0]],
  [['TWILIO', 0, 0, true], ['VONAGE', 2, 0]],
  [['TWILIO', 3, 0], ['VONAGE', 1, 0]],
  [['TWILIO', 2, 2], ['VONAGE', 1, 1]],
  [['TWILIO', 3, 0], ['VONAGE', 2, 0]],
  [['TWILIO', 2, 0], ['VONAGE', 2, 1]],
];

export function createMockJobRuns() {
  return RUN_PLAN.map((plan, i) =>
    mockRun(
      `mock-run-${String(RUN_PLAN.length - i).padStart(4, '0')}`,
      60 + i * 1440,
      plan.map(([provider, total, failed, skipped], g) => mockGroup(provider, total, failed, i * 2 + g, skipped)),
    ),
  );
}
