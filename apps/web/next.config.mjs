const config = {
  poweredByHeader: false,
  devIndicators: false,
  async rewrites() {
    const api = process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000';
    return [
      { source: '/health/:path*', destination: api + '/health/:path*' },
      { source: '/docs/:path*', destination: api + '/docs/:path*' },
      { source: '/docs-json', destination: api + '/docs-json' },
    ];
  },
};
export default config;
