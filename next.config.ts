import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Performance: optimize barrel-file imports for large icon/component libraries
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'recharts',
      'leaflet',
      'react-leaflet',
      '@tanstack/react-query',
      'sonner',
    ],
    staleTimes: {
      dynamic: 30,   // 30s — reduce server requests for dynamic routes
      static: 180,    // 3min — hold static pages in cache longer
    },
  },

  // Gzip/brotli compression
  compress: true,

  // Security & performance headers
  poweredByHeader: false,

  // Production optimizations
  productionBrowserSourceMaps: false,

  // Transpile problematic packages
  transpilePackages: ['jspdf', 'jspdf-autotable'],

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'chpfbsnouurelmfsdvsx.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },

  // Security headers for all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https://chpfbsnouurelmfsdvsx.supabase.co https://images.pexels.com data: blob:; connect-src 'self' https://chpfbsnouurelmfsdvsx.supabase.co https://api.deepseek.com https://graph.facebook.com;" },
          { key: 'Access-Control-Allow-Origin', value: 'https://marblemart.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },

  // Logging in dev only
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // Webpack: ignore supabase migration files from watch
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: ['**/supabase/**', '**/node_modules/**'],
      };
    }
    return config;
  },
};

export default nextConfig;
