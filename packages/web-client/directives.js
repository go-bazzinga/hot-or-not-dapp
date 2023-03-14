/** @type {import("@sveltejs/kit/types/private").CspDirectives} */
const cspDirectives = {
  'connect-src': [
    'self',
    'ws://localhost:*',
    'https://ic0.app',
    'https://*.ic0.app',
    'https://*.sentry.io',
    'https://*.lr-in-prod.com',
    'https://*.google-analytics.com',
  ],
  'img-src': [
    'self',
    'https://hotornot.wtf',
    'https://customer-2p3jflss4r4hmpnz.cloudflarestream.com',
    'https://imagedelivery.net',
    'https://images.unsplash.com',
  ],
  'media-src': [
    'self',
    'blob:',
    'data:',
    'https://customer-2p3jflss4r4hmpnz.cloudflarestream.com',
  ],
  'font-src': ['self', 'data:', 'https://fonts.gstatic.com'],
  'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
  'default-src': ['self'],
  'base-uri': ['self'],
  'child-src': ['self'],
  'form-action': ['self'],
  'frame-src': ['self'],
  'manifest-src': ['self'],
  'object-src': ['none'],
}

export default cspDirectives
