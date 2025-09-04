/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal configuration to avoid hanging issues
  reactStrictMode: true,
  swcMinify: true,
  
  // Keep API routes enabled
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig