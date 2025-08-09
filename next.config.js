/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost', 'via.placeholder.com'],
  },
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://192.168.0.148:3005',
  },
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
        destination: `${process.env.BACKEND_URL || 'http://192.168.0.148:3005'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;