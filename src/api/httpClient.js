import { config } from '../config.js';
import { ApiError } from './ApiError.js';

function serverLabel() {
  return config.apiBaseUrl || globalThis.location?.origin || 'this site';
}

// Provider validation returns `problems: string[]`; message validation returns
// `errors: [{ field, message }]`. Show both the same way.
function collectProblems(problem) {
  const problems = Array.isArray(problem.problems) ? [...problem.problems] : [];
  if (Array.isArray(problem.errors)) {
    for (const e of problem.errors) {
      if (typeof e === 'string') problems.push(e);
      else if (e && typeof e === 'object') problems.push([e.field, e.message].filter(Boolean).join(': '));
    }
  }
  return problems;
}

export async function request(method, path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  const headers = { Accept: 'application/json, application/problem+json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  try {
    let response;
    try {
      response = await fetch(`${config.apiBaseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new ApiError({
          code: 'CLIENT_TIMEOUT',
          title: 'Request timed out',
          detail: `No response from ${serverLabel()} within ${config.requestTimeoutMs / 1000} seconds.`,
        });
      }
      throw new ApiError({
        code: 'NETWORK_ERROR',
        title: 'Cannot reach the server',
        detail: `Could not connect to ${serverLabel()}. Check that the backend is running and accepts requests from this origin (CORS).`,
      });
    }

    // 204 No Content (for example DELETE) has no body to parse.
    if (response.status === 204) return null;

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const problem = data && typeof data === 'object' ? data : {};
      throw new ApiError({
        status: response.status,
        code: problem.code,
        title: problem.title || response.statusText || `HTTP ${response.status}`,
        detail: problem.detail || (data ? null : text.slice(0, 300) || null),
        problems: collectProblems(problem),
        providerErrorCode: problem.providerErrorCode,
      });
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}
