/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.geojson$/i,
      type: "json",
    });

    return config;
  },

  // Configuração para desenvolvimento local

  // A variável NEXT_PUBLIC_API_URL será usada no frontend

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },

  images: {
    domains: [
      'odin-backend-xdfx.onrender.com',
      'localhost',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.onrender.com',
      },
    ],
  },

  output: 'standalone',
  
  crossOrigin: 'anonymous',
};

export default nextConfig;
