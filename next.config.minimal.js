/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal config for fast builds
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  
  // Skip validation for speed
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Basic image optimization
  images: {
    domains: ['localhost', 'directorybolt.com'],
    formats: ['image/webp'],
  },
  
  // Minimal webpack optimization
  webpack: (config, { isServer, dev }) => {
    // Disable source maps for faster builds
    config.devtool = false;
    
    // Disable performance hints
    config.performance = {
      hints: false,
    };
    
    // Basic optimizations only
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Basic headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig