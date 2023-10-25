import staticAdapter from '@sveltejs/adapter-static'
import cfAdapter from '@sveltejs/adapter-cloudflare'
import preprocess from 'svelte-preprocess'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import cspDirectives from './directives.js'

const isSSR = process.env.BUILD_MODE != 'static'
const isDev = process.env.NODE_ENV == 'dev'

console.log(
  'svelte in',
  isSSR ? 'ssr' : 'static',
  'build mode; csp enabled',
  isDev,
)

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: preprocess({
    postcss: true,
  }),

  kit: {
    // csp: isDev
    //   ? undefined
    //   : {
    //       mode: 'hash',
    //       directives,
    //     },
    serviceWorker: {
      register: false,
    },
    files: {
      assets: 'static',
      hooks: {
        server: './hooks/server.hooks.ts',
      },
    },
    adapter: isSSR
      ? cfAdapter()
      : staticAdapter({
          fallback: 'index.html',
        }),
  },
}

export default config
