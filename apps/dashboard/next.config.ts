import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

// Content Security Policy without nonces for Next.js compatibility
// 'unsafe-inline' for scripts is required for Next.js hydration without nonces
// 'unsafe-inline' for styles is required for Tailwind/CSS-in-JS
// 'unsafe-eval' only in dev for HMR/debugging
// Local Supabase (127.0.0.1:54321) needs http/ws in dev, prod uses https/wss
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://js.stripe.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.stripe.com https://cdn.shadcnstudio.com",
  "font-src 'self'",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com${isDev ? ' http://127.0.0.1:* ws://127.0.0.1:*' : ''}`,
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  isDev ? '' : 'upgrade-insecure-requests',
]
  .filter(Boolean)
  .join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspDirectives,
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'credentialless', // More permissive than require-corp, allows images/scripts
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin',
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // Remove X-Powered-By header
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
