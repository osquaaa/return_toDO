import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep DOMPurify/jsdom out of the webpack bundle so its filesystem-relative
  // resources (e.g. default-stylesheet.css) resolve correctly at runtime.
  serverExternalPackages: ['isomorphic-dompurify', 'jsdom'],
};

export default nextConfig;
