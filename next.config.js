/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
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
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}'
    }
  },
  webpack: (config, { isServer }) => {
    // Exclude MCP protocol directory from build
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    // Ignore MCP protocol files during build
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@modelcontextprotocol/sdk/server/index.js': 'commonjs @modelcontextprotocol/sdk/server/index.js',
        '@modelcontextprotocol/sdk/server/stdio.js': 'commonjs @modelcontextprotocol/sdk/server/stdio.js',
      });
    }
    
    return config;
  },
  // Exclude MCP directory from TypeScript checking
  typescript: {
    ignoreBuildErrors: false,
  },
  // Exclude MCP directory from ESLint
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'lib', 'pages'],
  }
};

module.exports = nextConfig; 