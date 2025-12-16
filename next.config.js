/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // For sprite sheets and static assets
  },
  // Next.js uses SWC by default, not Babel
  // Babel config is in .babel/ directory for CLI builds only
}

export default nextConfig
