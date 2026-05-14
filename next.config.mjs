/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    allowedDevOrigins: [
      "http://192.168.1.135:3000",
      "http://192.168.1.135",
    ],
  },
}

export default nextConfig
