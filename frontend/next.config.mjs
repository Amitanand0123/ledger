import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Required for monorepo: tells Next.js to trace dependencies from the monorepo root
  outputFileTracingRoot: join(dirname(fileURLToPath(import.meta.url)), '..'),
  reactStrictMode: true,
  eslint: {
    // Linting is handled in CI — skip during production builds
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.google.com',
        port: '',
        pathname: '/s2/favicons/**'
      }
    ]
  }
};

export default nextConfig;
