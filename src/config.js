const env = import.meta.env;

export const config = {
  // Mock mode is the default. Set VITE_USE_MOCK_API=false to call the real backend.
  useMockApi: env.VITE_USE_MOCK_API !== 'false',
  // An empty value means "same origin", which is what the dev proxy needs.
  apiBaseUrl: (env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/+$/, ''),
  requestTimeoutMs: 30000,
};
