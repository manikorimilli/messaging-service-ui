import { AUTH_TYPES, BODY_FORMATS, MASKED_VALUE, RESPONSE_ONLY_FIELDS } from './providerConfig.js';

export const E164_PATTERN = /^\+[1-9]\d{7,14}$/;
export const PROVIDER_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
export const BODY_MAX_LENGTH = 1600;
export const MAX_RECIPIENTS = 100;
const ENV_PLACEHOLDER = /\$\{[^}]*\}/;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function validatePhone(value) {
  const v = value.trim();
  if (!v) return 'Enter a phone number.';
  if (!E164_PATTERN.test(v)) {
    return 'Use E.164 format: "+", country code, then number, no spaces. Example: +919876543210';
  }
  return null;
}

// String length counts UTF-16 code units, the same way the Java backend counts.
export function validateBody(value) {
  if (!value.trim()) return 'Enter a message.';
  if (value.length > BODY_MAX_LENGTH) {
    return `Message is ${value.length - BODY_MAX_LENGTH} characters over the ${BODY_MAX_LENGTH} limit.`;
  }
  return null;
}

// Adds the numbers found in `text` to `existing`, keeping order. Valid new numbers
// are added; everything else is reported so the UI can explain it.
export function mergeRecipients(existing, text, max = MAX_RECIPIENTS) {
  const recipients = [...existing];
  const invalid = [];
  const duplicates = [];
  const overflow = [];
  for (const token of text.split(/[\s,;]+/).filter(Boolean)) {
    if (!E164_PATTERN.test(token)) invalid.push(token);
    else if (recipients.includes(token)) duplicates.push(token);
    else if (recipients.length >= max) overflow.push(token);
    else recipients.push(token);
  }
  return { recipients, invalid, duplicates, overflow };
}

export function validateRecipients(recipients) {
  if (recipients.length === 0) return 'Add at least one phone number.';
  if (recipients.length > MAX_RECIPIENTS) {
    return `${recipients.length} numbers added. The limit is ${MAX_RECIPIENTS} per request.`;
  }
  const invalid = recipients.filter((n) => !E164_PATTERN.test(n));
  if (invalid.length) {
    return `${invalid.length} ${invalid.length === 1 ? 'number is' : 'numbers are'} not valid E.164.`;
  }
  return null;
}

export function parseJson(text) {
  if (!text.trim()) return { error: 'Paste or upload a JSON configuration first.' };
  try {
    return { value: JSON.parse(text) };
  } catch (err) {
    return { error: `Invalid JSON: ${err.message}` };
  }
}

// Client-side checks that mirror the backend's provider rules.
// "problems" block submission; "warnings" are informational.
export function validateProviderConfig(cfg, { mode = 'create', pathId } = {}) {
  const problems = [];
  const warnings = [];
  if (!isObject(cfg)) return { problems: ['The configuration must be a JSON object.'], warnings };

  const { id } = cfg;
  if (id === undefined || id === null || id === '') {
    if (mode === 'create') problems.push('id is missing');
  } else if (typeof id !== 'string' || !PROVIDER_ID_PATTERN.test(id)) {
    problems.push('id may contain only letters, digits, "_" and "-"');
  } else if (mode === 'update' && pathId && id.toUpperCase() !== pathId.toUpperCase()) {
    problems.push(`id "${id}" must match the provider being edited (${pathId}), or be left out`);
  } else if (mode === 'create' && id !== id.toUpperCase()) {
    warnings.push(`id will be stored in uppercase as ${id.toUpperCase()}.`);
  }

  if (typeof cfg['display-name'] !== 'string' || !cfg['display-name'].trim()) {
    problems.push('display-name is missing');
  }

  if (!Array.isArray(cfg.channels) || cfg.channels.length === 0) {
    problems.push('channels must be a non-empty array, for example ["SMS"]');
  } else if (cfg.channels.some((c) => typeof c !== 'string')) {
    problems.push('channels must contain only strings');
  } else {
    const other = cfg.channels.filter((c) => c.toUpperCase() !== 'SMS');
    if (other.length) warnings.push(`Only SMS is supported today. ${other.join(', ')} will not be usable yet.`);
  }

  if (cfg.enabled !== undefined && typeof cfg.enabled !== 'boolean') {
    problems.push('enabled must be true or false');
  }

  if (cfg.variables !== undefined) {
    if (!isObject(cfg.variables)) {
      problems.push('variables must be an object of name/value pairs');
    } else {
      for (const [key, value] of Object.entries(cfg.variables)) {
        if (!['string', 'number', 'boolean'].includes(typeof value)) {
          problems.push(`variables.${key} must be a raw value (text or number)`);
        } else if (typeof value === 'string' && ENV_PLACEHOLDER.test(value)) {
          problems.push(`variables.${key} uses an environment placeholder ("\${...}"). Enter the raw value instead.`);
        } else if (value === MASKED_VALUE && mode === 'create') {
          problems.push(`variables.${key} is masked (${MASKED_VALUE}). Enter the real value for a new provider.`);
        }
      }
    }
  }

  const { request } = cfg;
  if (request === undefined || request === null) {
    problems.push('request is missing');
  } else if (!isObject(request)) {
    problems.push('request must be an object');
  } else {
    if (typeof request.url !== 'string' || !request.url.trim()) problems.push('request.url is missing');
    if (request.method !== undefined && typeof request.method !== 'string') {
      problems.push('request.method must be a string such as "POST"');
    }
    if (request.auth !== undefined) {
      if (!isObject(request.auth)) problems.push('request.auth must be an object');
      else if (!AUTH_TYPES.includes(request.auth.type)) {
        problems.push(`request.auth.type must be one of: ${AUTH_TYPES.join(', ')}`);
      }
    }
    if (request.body !== undefined) {
      if (!isObject(request.body)) problems.push('request.body must be an object');
      else if (!BODY_FORMATS.includes(request.body.format)) {
        problems.push(`request.body.format must be one of: ${BODY_FORMATS.join(', ')}`);
      }
    }
  }

  if (cfg.response === undefined || cfg.response === null) problems.push('response is missing');
  else if (!isObject(cfg.response)) problems.push('response must be an object');

  const metadata = RESPONSE_ONLY_FIELDS.filter((f) => f in cfg);
  if (metadata.length) {
    warnings.push(`${metadata.join(' and ')} ${metadata.length === 1 ? 'is a response-only field' : 'are response-only fields'} and will be left out of the request.`);
  }

  return { problems, warnings };
}
