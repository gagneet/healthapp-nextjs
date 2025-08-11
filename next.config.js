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
  // Configure WebSocket hostname for Docker
  experimental: {
    forceSwcTransforms: true,
  },
  // WebSocket configuration moved to webpack config for polling in Docker
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
        // Add database-specific exclusions
        pg: false,
        'pg-hstore': false,
        sequelize: false,
        redis: false,
      }
    }

    // Optimize API route imports for server-side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        // Mark certain modules as external for server builds
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }
    
    return config
  },
  // Removed rewrites - Now using native Next.js API routes
  // This allows /app/api routes to work instead of proxying to Express
  // For legacy support, specific routes can still be proxied if needed
  async rewrites() {
    // Only proxy specific legacy routes if needed during transition
    const legacyRoutes = process.env.PROXY_LEGACY_ROUTES === 'true' ? [
      {
        source: '/api/legacy/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:3005'}/api/:path*`,
      },
    ] : [];
    
    return legacyRoutes;
  },
};

export default nextConfig;