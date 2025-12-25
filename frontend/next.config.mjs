/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
