/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'upload.wikimedia.org',
      'picsum.photos',
      'logo.clearbit.com',
      'companieslogo.com',
      'asset.brandfetch.io',
      'www.reuters.com',
      'www.bloomberg.com',
      'assets.bwbx.io',
      'www.ft.com',
      'images.wsj.net',
      'image.cnbcfm.com',
      'mms.businesswire.com',
      'www.marketwatch.com',
      'mms.prnewswire.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
  },
}

module.exports = nextConfig 