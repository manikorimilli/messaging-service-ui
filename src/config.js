const env = import.meta.env;

export const config = {
  // Mock mode is the default. Set VITE_USE_MOCK_API=false to call the real backend.
  useMockApi: env.VITE_USE_MOCK_API !== 'false',
  // Same origin by default: the dev proxy (DEV_PROXY_TARGET) and the Vercel rewrite forward /api/*.
  // Set VITE_API_BASE_URL only to call a backend on another address directly.
  apiBaseUrl: (env.VITE_API_BASE_URL ?? '').replace(/\/+$/, ''),
  requestTimeoutMs: 30000,
};
