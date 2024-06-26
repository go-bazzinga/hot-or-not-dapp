//@ts-ignore
import { sentrySvelteKit } from '@sentry/sveltekit'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
const dfxViteConfig = (await import('./vite.config.dfx')).default

export default defineConfig(() => ({
  build: {
    sourcemap: true,
  },
  define: {
    ...dfxViteConfig.define,
    'import.meta.env.ENABLE_SSR': process.env.BUILD_MODE !== 'static',
    'import.meta.env.PRODUCTION': process.env.PRODUCTION === 'true',
  },
  server: {
    fs: {
      allow: ['../'],
    },
    hmr: process.env.CI ? false : undefined,
    proxy: dfxViteConfig.proxy,
  },

  plugins: [
    sentrySvelteKit({
      sourceMapsUploadOptions: {
        org: 'gobazzinga',
        project: 'hot-or-not',
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
      autoInstrument: false,
    }),
    sveltekit(),
    ...dfxViteConfig.plugins,
  ],
  optimizeDeps: {
    esbuildOptions: dfxViteConfig.optimizeDeps.esbuildOptions,
    include: [
      '@dfinity/principal',
      'clsx',
      'svelte-local-storage-store',
      '@dfinity/auth-client',
      '@dfinity/agent',
      '@sentry/sveltekit',
      'throttle-debounce',
      'idb',
    ],
  },
}))

console.log(
  '\x1b[36m%s\x1b[0m',
  `\nℹ️ Starting app in ${process.env.NODE_ENV} mode`,
)
