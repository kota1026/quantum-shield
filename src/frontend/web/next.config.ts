import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Environment variables (defaults for production)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://quantum-shield-production-8f2b.up.railway.app',
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.quantumshield.io',
      },
    ],
  },

  // Webpack customization
  webpack: (config) => {
    // Support for WASM (for Dilithium/Kyber)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },

  // Headers for security (OWASP recommended)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
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
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.quantum-shield.io https://*.vercel.app https://*.up.railway.app http://localhost:* wss: https://rpc.sepolia.org https://*.infura.io https://*.alchemyapi.io",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Redirects for legacy URLs (Token Hub, Governance → QS Hub統合)
  async redirects() {
    return [
      // Token Hub → QS Hub
      {
        source: '/:locale/token-hub',
        destination: '/:locale/qs-hub/dashboard',
        permanent: true,
      },
      {
        source: '/:locale/token-hub/dashboard',
        destination: '/:locale/qs-hub/dashboard',
        permanent: true,
      },
      {
        source: '/:locale/token-hub/lock',
        destination: '/:locale/qs-hub/stake/lock',
        permanent: true,
      },
      {
        source: '/:locale/token-hub/unlock',
        destination: '/:locale/qs-hub/stake/unlock',
        permanent: true,
      },
      {
        source: '/:locale/token-hub/delegate',
        destination: '/:locale/qs-hub/vote/delegates',
        permanent: true,
      },
      {
        source: '/:locale/token-hub/rewards',
        destination: '/:locale/qs-hub/dashboard',
        permanent: true,
      },
      // Governance → QS Hub (only for ja/en locales, not qs-admin)
      {
        source: '/ja/governance',
        destination: '/ja/qs-hub/dashboard',
        permanent: true,
      },
      {
        source: '/en/governance',
        destination: '/en/qs-hub/dashboard',
        permanent: true,
      },
      {
        source: '/ja/governance/landing',
        destination: '/ja/qs-hub/dashboard',
        permanent: true,
      },
      {
        source: '/en/governance/landing',
        destination: '/en/qs-hub/dashboard',
        permanent: true,
      },
      {
        source: '/ja/governance/dashboard',
        destination: '/ja/qs-hub/dashboard',
        permanent: true,
      },
      {
        source: '/en/governance/dashboard',
        destination: '/en/qs-hub/dashboard',
        permanent: true,
      },
      {
        source: '/ja/governance/proposals',
        destination: '/ja/qs-hub/vote/proposals',
        permanent: true,
      },
      {
        source: '/en/governance/proposals',
        destination: '/en/qs-hub/vote/proposals',
        permanent: true,
      },
      {
        source: '/ja/governance/proposals/:id',
        destination: '/ja/qs-hub/vote/proposals/:id',
        permanent: true,
      },
      {
        source: '/en/governance/proposals/:id',
        destination: '/en/qs-hub/vote/proposals/:id',
        permanent: true,
      },
      {
        source: '/ja/governance/council',
        destination: '/ja/qs-hub/council',
        permanent: true,
      },
      {
        source: '/en/governance/council',
        destination: '/en/qs-hub/council',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
