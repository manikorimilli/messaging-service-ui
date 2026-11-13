// Parameters are the {name} or {{name}} placeholders inside a provider config.
// "${NAME}" environment placeholders are not parameters and are skipped.
const PLACEHOLDER = /(?<!\$)\{\{\s*([\w.-]+)\s*\}\}|(?<![${])\{([\w.-]+)\}(?!\})/g;

// The backend fills these three from each message: {{to}} and {{to_digits}}
// from the recipient, {{text}} from the message body.
export const BACKEND_BUILT_INS = ['to', 'to_digits', 'text'];

// uaap.* parameters are the same per-message values under the names the
// requirement uses. The backend only understands its built-ins, so saving a
// provider rewrites each uaap name to the built-in it stands for.
export const UAAP_PARAMETERS = {
  'uaap.message.to': 'to',
  'uaap.message.to_digits': 'to_digits',
  'uaap.message.text': 'text',
  'uaap.message.template': 'text',
};

// The uaap name shown for each built-in, for providers saved in backend form.
const UAAP_NAME_FOR_BUILT_IN = { to: 'uaap.message.to', to_digits: 'uaap.message.to_digits', text: 'uaap.message.text' };

// What each built-in is filled from, in words.
const BUILT_IN_SOURCE = { to: 'recipient number', to_digits: 'recipient number without "+"', text: 'message' };

// The backend only recognises {{name}} with these characters in the name.
const BACKEND_NAME = /^[A-Za-z0-9_-]+$/;

const isUaap = (name) => name.startsWith('uaap.');

// Filled in when a message is sent, so nobody types them at registration.
export const isSendTimeParameter = (name) => isUaap(name) || BACKEND_BUILT_INS.includes(name);

const builtInFor = (name) => (BACKEND_BUILT_INS.includes(name) ? name : UAAP_PARAMETERS[name]);

// For a send-time parameter: its uaap name and what fills it, or null if unknown.
export function describeSendTimeParameter(name) {
  const builtIn = builtInFor(name);
  if (!builtIn) return null;
  return { uaap: isUaap(name) ? name : UAAP_NAME_FOR_BUILT_IN[builtIn], builtIn, source: BUILT_IN_SOURCE[builtIn] };
}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// Applies `fn` to every string in a JSON value, keeping its shape.
function mapStrings(value, fn) {
  if (typeof value === 'string') return fn(value);
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, fn));
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapStrings(v, fn)]));
  return value;
}

// Rewrites placeholders into the only form the backend fills: {name} becomes
// {{name}} and known uaap names become the built-in they stand for. Unknown uaap
// names are left alone for validation to report. "variables" holds raw values
// and is copied unchanged.
export function toBackendPlaceholders(cfg) {
  if (!isObject(cfg)) return cfg;
  const { variables, ...templates } = cfg;
  const rewritten = mapStrings(templates, (text) =>
    text.replace(PLACEHOLDER, (match, doubled, single) => {
      const name = doubled ?? single;
      if (isUaap(name)) return UAAP_PARAMETERS[name] ? `{{${UAAP_PARAMETERS[name]}}}` : match;
      return `{{${name}}}`;
    }),
  );
  return variables === undefined ? rewritten : { ...rewritten, variables };
}

// Placeholder problems the backend would reject at registration, or that would
// leave a placeholder unfilled when sending.
export function placeholderProblems(cfg) {
  if (!isObject(cfg)) return [];
  const problems = [];
  const { provider, sendTime } = detectParameters(cfg);
  for (const name of sendTime) {
    if (!describeSendTimeParameter(name)) {
      problems.push(`{${name}} is not a known uaap parameter. Use one of: ${Object.keys(UAAP_PARAMETERS).join(', ')}`);
    }
  }
  for (const name of provider) {
    if (!BACKEND_NAME.test(name)) problems.push(`{${name}} may contain only letters, digits, "_" and "-"`);
  }
  const url = cfg.request?.url;
  if (typeof url === 'string') {
    for (const name of collect(url, new Set())) {
      if (isSendTimeParameter(name)) problems.push(`request.url cannot use {${name}}. Message values are not allowed in the URL.`);
    }
  }
  if (isObject(cfg.variables)) {
    for (const name of BACKEND_BUILT_INS) {
      if (name in cfg.variables) problems.push(`variables.${name} clashes with the built-in {{${name}}}. Rename it.`);
    }
  }
  return problems;
}

function collect(value, found) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(PLACEHOLDER)) found.add(match[1] ?? match[2]);
  } else if (Array.isArray(value)) {
    for (const item of value) collect(item, found);
  } else if (isObject(value)) {
    for (const item of Object.values(value)) collect(item, found);
  }
  return found;
}

// Every placeholder name in the config, in order of first appearance, split into
// the ones to ask for now and the ones filled at send time. "variables" holds
// raw values, not templates, so it is not scanned.
export function detectParameters(cfg) {
  if (!isObject(cfg)) return { provider: [], sendTime: [] };
  const { variables: _values, ...templates } = cfg;
  const names = [...collect(templates, new Set())];
  return {
    provider: names.filter((name) => !isSendTimeParameter(name)),
    sendTime: names.filter(isSendTimeParameter),
  };
}

// The value a parameter box shows: what was typed, else the "variables" value.
export function parameterValue(name, values, variables) {
  if (name in values) return values[name];
  const fallback = isObject(variables) ? variables[name] : undefined;
  return fallback === undefined || fallback === null ? '' : String(fallback);
}

// Parameter names whose box is empty or only spaces.
export function missingParameters(names, values, variables) {
  return names.filter((name) => !parameterValue(name, values, variables).trim());
}

// Writes the entered parameter values into "variables", where the service looks
// them up. Blank entries are skipped so they never overwrite an existing value.
export function withParameterValues(cfg, values) {
  const entered = Object.entries(values).filter(([, value]) => value !== '');
  if (!isObject(cfg) || entered.length === 0) return cfg;
  const variables = isObject(cfg.variables) ? cfg.variables : {};
  return { ...cfg, variables: { ...variables, ...Object.fromEntries(entered) } };
}
