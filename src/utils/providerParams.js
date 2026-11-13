// Parameters are the {name} or {{name}} placeholders inside a provider config.
// "${NAME}" environment placeholders are not parameters and are skipped.
const PLACEHOLDER = /(?<!\$)\{\{\s*([\w.-]+)\s*\}\}|(?<![${])\{([\w.-]+)\}(?!\})/g;

// Filled in by the service when a message is sent, so nobody types them at
// registration: uaap.* parameters, plus the recipient and message placeholders
// the existing provider configs use.
const SEND_TIME_NAMES = ['to', 'to_digits', 'text'];

export const isSendTimeParameter = (name) => name.startsWith('uaap.') || SEND_TIME_NAMES.includes(name);

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

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
