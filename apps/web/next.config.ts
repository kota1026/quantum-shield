import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

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

  // Headers for security
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
      // Governance → QS Hub
      {
        source: '/:locale/governance',
        destination: '/:locale/qs-hub/dashboard',
        permanent: true,
      },
      {
        source: '/:locale/governance/landing',
        destination: '/:locale/qs-hub/dashboard',
        permanent: true,
      },
      {
        source: '/:locale/governance/dashboard',
        destination: '/:locale/qs-hub/dashboard',
        permanent: true,
      },
      {
        source: '/:locale/governance/proposals',
        destination: '/:locale/qs-hub/vote/proposals',
        permanent: true,
      },
      {
        source: '/:locale/governance/proposals/:id',
        destination: '/:locale/qs-hub/vote/proposals/:id',
        permanent: true,
      },
      {
        source: '/:locale/governance/council',
        destination: '/:locale/qs-hub/council',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
