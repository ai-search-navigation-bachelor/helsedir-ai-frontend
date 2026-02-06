import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const apiBaseUrl = env.VITE_API_BASE_URL
  const proxyTarget = env.VITE_API_PROXY_TARGET

  const shouldProxy =
    typeof apiBaseUrl === 'string' && apiBaseUrl.startsWith('/') && !!proxyTarget

  return {
    plugins: [react(), tailwindcss()],
    server: shouldProxy
      ? {
          proxy: {
            [apiBaseUrl]: {
              target: proxyTarget,
              changeOrigin: true,
              // Typical backend routes are mounted at root; strip the prefix (e.g. /api)
              rewrite: (path) => path.replace(new RegExp(`^${apiBaseUrl}`), ''),
            },
          },
        }
      : undefined,
  }
})
