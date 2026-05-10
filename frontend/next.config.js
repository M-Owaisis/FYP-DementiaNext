/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  onDemandEntries: {
    maxInactiveAge: 1000 * 60 * 60,
    pagesBufferLength: 20,
  },
  async headers() {
    return [
      {
        // Google Identity Services renders sign-in inside a popup that needs
        // postMessage back to the opener. Vercel's default COOP=`same-origin`
        // blocks it; relax to `same-origin-allow-popups` so the GSI popup can
        // talk to the page.
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
