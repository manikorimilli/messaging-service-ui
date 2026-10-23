// In-memory imitation of the backend for development and testing.
// State lives only in this module, so a page reload resets it. Nothing is
// written to browser storage.
//
// Simulated outcomes, by the last digits of the recipient number:
//   ...000  provider rejects the number (PROVIDER_REJECTED, code 21211)
//   ...999  provider times out (PROVIDER_TIMEOUT)
//   others  accepted
import { ApiError } from './ApiError.js';
import { MOCK_PRIMARY_PROVIDER, MOCK_PROVIDERS, MOCK_PROVIDERS_IN_USE } from './mockData.js';
import { MASKED_VALUE } from '../utils/providerConfig.js';
import {
  BODY_MAX_LENGTH,
  E164_PATTERN,
  MAX_RECIPIENTS,
  validateProviderConfig,
} from '../utils/validation.js';

const SECRET_NAME = /secret|token|password|key/i;

let store = new Map();
let latencyMs = 450;

export function resetMockStore() {
  store = new Map(MOCK_PROVIDERS.map((p) => [p.id, structuredClone(p)]));
}
resetMockStore();

export function setMockLatency(ms) {
  latencyMs = ms;
}

const wait = () =>
  latencyMs > 0
    ? new Promise((resolve) => setTimeout(resolve, latencyMs * (0.6 + Math.random() * 0.8)))
    : Promise.resolve();

function randomHex(length) {
  let out = '';
  while (out.length < length) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

function toResponse(stored) {
  const copy = structuredClone(stored);
  if (copy.variables) {
    for (const key of Object.keys(copy.variables)) {
      if (SECRET_NAME.test(key)) copy.variables[key] = MASKED_VALUE;
    }
  }
  // Same key order as the backend example.
  const { id, 'display-name': displayName, channels, source, enabled, variables, request, response, ...rest } = copy;
  return { id, 'display-name': displayName, channels, source, 'read-only': source === 'providers.json', enabled, variables, request, response, ...rest };
}

function problem(status, code, title, detail, extra = {}) {
  return new ApiError({ status, code, title, detail, ...extra });
}

function findStored(id) {
  const stored = store.get(String(id).toUpperCase());
  if (!stored) {
    throw problem(404, 'PROVIDER_NOT_FOUND', 'Provider not found', `No provider with id '${id}' exists.`);
  }
  return stored;
}

function assertWritable(stored) {
  if (stored.source === 'providers.json') {
    throw problem(409, 'PROVIDER_READ_ONLY', 'Provider is read-only',
      `Provider '${stored.id}' is defined in providers.json and cannot be modified through the API.`);
  }
}

function validationFailed(detail, problems) {
  return problem(400, 'VALIDATION_FAILED', 'Validation failed', detail, { problems });
}

export async function listProviders() {
  await wait();
  return [...store.values()].sort((a, b) => a.id.localeCompare(b.id)).map(toResponse);
}

export async function getProvider(id) {
  await wait();
  return toResponse(findStored(id));
}

export async function registerProvider(payload) {
  await wait();
  const { problems } = validateProviderConfig(payload, { mode: 'create' });
  if (problems.length) throw validationFailed('The provider configuration is invalid.', problems);

  const id = payload.id.toUpperCase();
  if (store.has(id)) {
    throw problem(409, 'PROVIDER_ALREADY_EXISTS', 'Provider already exists', `A provider with id '${id}' already exists.`);
  }
  const stored = { ...structuredClone(payload), id, enabled: payload.enabled ?? true, source: 'db.json' };
  store.set(id, stored);
  return toResponse(stored);
}

export async function updateProvider(id, payload) {
  await wait();
  const stored = findStored(id);
  assertWritable(stored);

  const { problems } = validateProviderConfig(payload, { mode: 'update', pathId: stored.id });
  const variables = structuredClone(payload.variables ?? {});
  for (const [key, value] of Object.entries(variables)) {
    if (value !== MASKED_VALUE) continue;
    // "****" means "keep the stored secret".
    if (stored.variables && key in stored.variables) variables[key] = stored.variables[key];
    else problems.push(`variables.${key} is masked but no stored value exists`);
  }
  if (problems.length) throw validationFailed('The provider configuration is invalid.', problems);

  const updated = {
    ...structuredClone(payload),
    id: stored.id,
    enabled: payload.enabled ?? stored.enabled,
    variables,
    source: stored.source,
  };
  store.set(stored.id, updated);
  return toResponse(updated);
}

export async function deleteProvider(id) {
  await wait();
  const stored = findStored(id);
  assertWritable(stored);
  if (MOCK_PROVIDERS_IN_USE.includes(stored.id)) {
    throw problem(409, 'PROVIDER_IN_USE', 'Provider in use',
      `Provider '${stored.id}' is referenced in server routing and cannot be deleted.`);
  }
  store.delete(stored.id);
  return null;
}

function checkMessage(payload) {
  if (payload.type !== 'SMS') {
    throw problem(400, 'UNSUPPORTED_MESSAGE_TYPE', 'Unsupported message type',
      `Message type '${payload.type}' is not supported. Only SMS is available.`);
  }
  const problems = [];
  if (typeof payload.body !== 'string' || payload.body.trim().length === 0) problems.push('body must not be blank');
  else if (payload.body.length > BODY_MAX_LENGTH) problems.push(`body must be at most ${BODY_MAX_LENGTH} characters`);
  return problems;
}

function resolveProvider(providerId) {
  const id = (providerId ?? MOCK_PRIMARY_PROVIDER).toUpperCase();
  const stored = store.get(id);
  if (!stored || !stored.channels?.includes('SMS')) {
    throw problem(400, 'UNSUPPORTED_PROVIDER', 'Unsupported provider', `Provider '${providerId}' is not available for SMS.`);
  }
  if (!stored.enabled) {
    throw problem(503, 'PROVIDER_UNAVAILABLE', 'Provider unavailable', `Provider '${stored.id}' is disabled.`);
  }
  return stored;
}

function simulateProvider(providerId, to) {
  if (to.endsWith('000')) {
    return { status: 'FAILED', code: 'PROVIDER_REJECTED', providerErrorCode: '21211', detail: 'Invalid number' };
  }
  if (to.endsWith('999')) {
    return { status: 'FAILED', code: 'PROVIDER_TIMEOUT', detail: 'Provider did not respond within 10 seconds' };
  }
  if (providerId === 'TWILIO') return { status: 'ACCEPTED', providerMessageId: `SM${randomHex(32)}`, providerStatus: 'queued' };
  if (providerId === 'VONAGE') return { status: 'ACCEPTED', providerMessageId: randomHex(16).toUpperCase(), providerStatus: '0' };
  return { status: 'ACCEPTED', providerMessageId: randomHex(24), providerStatus: 'accepted' };
}

export async function sendSms(payload) {
  await wait();
  const problems = checkMessage(payload);
  if (typeof payload.to !== 'string' || !E164_PATTERN.test(payload.to)) problems.push('to must be a valid E.164 phone number');
  if (problems.length) throw validationFailed('The message request is invalid.', problems);

  const provider = resolveProvider(payload.provider);
  const result = simulateProvider(provider.id, payload.to);
  if (result.code === 'PROVIDER_REJECTED') {
    throw problem(502, result.code, 'Provider rejected the message', result.detail, { providerErrorCode: result.providerErrorCode });
  }
  if (result.code === 'PROVIDER_TIMEOUT') {
    throw problem(504, result.code, 'Provider timed out', result.detail);
  }
  return {
    status: 'ACCEPTED',
    provider: provider.id,
    providerMessageId: result.providerMessageId,
    providerStatus: result.providerStatus,
    acceptedAt: new Date().toISOString(),
  };
}

export async function sendBatchSms(payload) {
  await wait();
  const problems = checkMessage(payload);
  const recipients = Array.isArray(payload.recipients) ? payload.recipients : [];
  if (recipients.length < 1 || recipients.length > MAX_RECIPIENTS) {
    problems.push(`recipients must contain between 1 and ${MAX_RECIPIENTS} numbers`);
  }
  recipients.forEach((to, i) => {
    if (typeof to !== 'string' || !E164_PATTERN.test(to)) problems.push(`recipients[${i}] must be a valid E.164 phone number`);
  });
  if (problems.length) throw validationFailed('The batch request is invalid.', problems);

  const provider = resolveProvider(payload.provider);
  const unique = [...new Set(recipients)];
  const results = unique.map((to) => ({ to, ...simulateProvider(provider.id, to) }));
  const accepted = results.filter((r) => r.status === 'ACCEPTED').length;
  return {
    provider: provider.id,
    total: unique.length,
    accepted,
    failed: results.length - accepted,
    duplicatesRemoved: recipients.length - unique.length,
    results,
  };
}
