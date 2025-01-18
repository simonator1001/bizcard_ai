/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'logo.clearbit.com',
      'picsum.photos',
      'images.unsplash.com',
      'source.unsplash.com',
      'placehold.co',
      'api.perplexity.ai',
      'api.llama-api.com',
      'news.google.com',
      'www.reuters.com',
      'www.bloomberg.com',
      'www.cnbc.com',
      'www.bbc.co.uk',
      'www.ft.com',
    ],
    unoptimized: true,
  },
  env: {
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    LLAMA_API_KEY: process.env.LLAMA_API_KEY,
  },
  publicRuntimeConfig: {
    NEXT_PUBLIC_PERPLEXITY_API_KEY: process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY,
  },
};

module.exports = nextConfig; 