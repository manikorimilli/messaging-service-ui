import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // DEV_PROXY_TARGET has no VITE_ prefix on purpose: it is only read here and never shipped to the browser.
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.DEV_PROXY_TARGET;

  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: proxyTarget
      ? { proxy: { '/api': { target: proxyTarget, changeOrigin: true, secure: true } } }
      : {},
    test: { environment: 'node' },
  };
});
