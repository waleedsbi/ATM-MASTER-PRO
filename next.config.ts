import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Suppress React key warnings during build
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'https://*.cloudworkstations.dev',
        ...(process.env.SERVER_ACTIONS_ALLOWED_ORIGINS 
          ? process.env.SERVER_ACTIONS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
          : []
        )
      ]
    },
  },
  // Suppress hydration warnings caused by browser extensions
  reactStrictMode: false,
  // Skip static optimization for error pages
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

export default nextConfig;
