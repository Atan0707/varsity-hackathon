/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    domains: ['raw.githubusercontent.com', 'ipfs.io', 'dweb.link', 'gateway.pinata.cloud'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_SUBGRAPH_URL: process.env.NEXT_PUBLIC_SUBGRAPH_URL || "https://api.studio.thegraph.com/query/105196/vhackv2/version/latest"
  }
};

module.exports = nextConfig; 