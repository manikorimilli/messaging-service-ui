// One error type for everything the UI shows: backend problem responses,
// network failures, and errors raised by the mock API.
export class ApiError extends Error {
  constructor({ status = 0, code, title, detail, problems, providerErrorCode } = {}) {
    super(detail || title || 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.code = code || null;
    this.title = title || null;
    this.detail = detail || null;
    this.problems = Array.isArray(problems) ? problems : [];
    this.providerErrorCode = providerErrorCode || null;
  }
}
