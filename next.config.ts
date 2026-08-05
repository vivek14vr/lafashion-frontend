import type { NextConfig } from 'next'

/** Used at build time for rewrites — set the same var on Render for build + runtime. */
const PAYLOAD_BACKEND_URL = (
  process.env.PAYLOAD_BACKEND_URL || 'http://localhost:3001'
).replace(/\/$/, '')

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/**',
        search: '?prefix=lafashioncloset',
      },
    ],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/api/media/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lafashion-backend.onrender.com',
        pathname: '/api/media/**',
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${PAYLOAD_BACKEND_URL}/api/:path*`,
        },
      ],
    }
  },
}

export default nextConfig
