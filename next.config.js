/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Enable static export for Apache deployment
  images: {
    unoptimized: true, // Required for static export
  },
  // Next.js uses SWC by default, not Babel
  // Babel config is in .babel/ directory for CLI builds only
}

export default nextConfig
