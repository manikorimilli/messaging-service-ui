const toCamel = (key) => key.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

// Converts kebab-case object keys to camelCase, recursively.
// Job-run responses use "run-id", "provider-error-code", ...; the rest of the UI uses camelCase.
export function camelizeKeys(value) {
  if (Array.isArray(value)) return value.map(camelizeKeys);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [toCamel(k), camelizeKeys(v)]));
}
