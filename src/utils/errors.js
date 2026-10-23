// Plain-language help for each error code the backend (or client) can produce.
export const ERROR_HELP = {
  VALIDATION_FAILED: 'The request did not pass validation. Fix the problems listed and try again.',
  UNSUPPORTED_PROVIDER: 'The selected provider cannot handle this request. Choose another provider or use the primary provider.',
  UNSUPPORTED_MESSAGE_TYPE: 'Only SMS messages are supported right now.',
  PROVIDER_NOT_FOUND: 'No provider has this ID. It may have been unregistered. Refresh the provider list.',
  PROVIDER_ALREADY_EXISTS: 'A provider with this ID already exists. IDs are not case-sensitive, so pick a different ID or edit the existing provider.',
  PROVIDER_READ_ONLY: 'This is a built-in provider from providers.json. It can be viewed but not changed or removed through the API.',
  PROVIDER_IN_USE: 'This provider is referenced in the server routing configuration, so it cannot be deleted. Remove it from routing on the server first, or disable it instead.',
  PROVIDER_REJECTED: 'The provider received the request but rejected it. See the provider error code and details.',
  PROVIDER_UNAVAILABLE: 'The provider is disabled or currently unavailable. Enable it on the Providers page or choose another provider.',
  PROVIDER_TIMEOUT: 'The provider did not answer in time. The message may or may not have been accepted, so check the provider dashboard before retrying to avoid duplicates.',
  INTERNAL_ERROR: 'The server hit an unexpected error. Try again later or check the server logs.',
  NETWORK_ERROR: 'Check the base URL, that the backend is running, and that it allows requests from this site (CORS). The README explains the dev proxy option.',
  CLIENT_TIMEOUT: 'The server took too long to answer. The request may still have been processed.',
};

const STATUS_HELP = {
  400: 'The request was rejected as invalid.',
  404: 'The requested item was not found.',
  409: 'The request conflicts with the current state on the server.',
  500: ERROR_HELP.INTERNAL_ERROR,
  502: ERROR_HELP.PROVIDER_REJECTED,
  503: ERROR_HELP.PROVIDER_UNAVAILABLE,
  504: ERROR_HELP.PROVIDER_TIMEOUT,
};

export function errorHelp(error) {
  return ERROR_HELP[error?.code] || STATUS_HELP[error?.status] || null;
}
