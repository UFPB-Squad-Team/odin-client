/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.geojson$/i,
      type: "json",
    });

    return config;
  },
};

export default nextConfig;
