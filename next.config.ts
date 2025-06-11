import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    scrollRestoration: true,
  },
  // Compression and caching
  compress: true,
  poweredByHeader: false,
  
  // Vercel-specific optimizations
  ...(process.env.VERCEL ? {
    output: 'standalone',
    generateBuildId: async () => {
      return process.env.VERCEL_GIT_COMMIT_SHA || 'local-build';
    },
  } : {}),
  
  // Disable Vercel toolbar and speed insights in production
  productionBrowserSourceMaps: false,
  
  // Environment variables to disable Vercel features
  env: {
    VERCEL_ANALYTICS_ID: '',
    VERCEL_SPEED_INSIGHTS_ID: '',
    NEXT_TELEMETRY_DISABLED: '1',
    DISABLE_VERCEL_TOOLBAR: '1',
  },
  
  // Image optimizations
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Bundle analyzer (optional)
  webpack: (config, { isServer }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Fix handlebars require.extensions warning
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });
    
    // Ignore handlebars dynamic require warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/handlebars/,
        message: /require\.extensions/,
      },
      {
        module: /node_modules\/@opentelemetry/,
      },
    ];
    
    // Tree shaking optimizations
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
    };
    
    return config;
  },
  
  // Headers to disable Vercel features
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Vercel-Speed-Insights',
            value: 'disabled',
          },
          {
            key: 'X-Vercel-Analytics',
            value: 'disabled',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
