/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false,
  images: {
    domains: ['localhost', 'via.placeholder.com'],
  },
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3005',
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3002',
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005',
    // WebSocket environment variables for Docker HMR
    WDS_SOCKET_HOST: process.env.WDS_SOCKET_HOST,
    WDS_SOCKET_PORT: process.env.WDS_SOCKET_PORT,
    WATCHPACK_POLLING: process.env.WATCHPACK_POLLING,
  },
  // WebSocket configuration for Docker environments
  webpackDevMiddleware: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config
  },
  // Configure WebSocket hostname for Docker
  experimental: {
    forceSwcTransforms: true,
  },
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS ? 
    process.env.ALLOWED_DEV_ORIGINS.split(',') : 
    [
      process.env.HOST_IP ? `${process.env.HOST_IP}:3002` : 'localhost:3002',
      'localhost:3002',
      '127.0.0.1:3002'
    ],
  webpack: (config, { isServer }) => {
    // Exclude backend dependencies from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      }
    }
    
    return config
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:3005'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;