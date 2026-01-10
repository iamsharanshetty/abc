/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // This will still show warnings but won't fail the build
<<<<<<< HEAD
    ignoreDuringBuilds: true,
=======
    ignoreDuringBuilds: false,
>>>>>>> chat-backup
  },
  typescript: {
    // Ignore TypeScript errors during build (temporary)
    ignoreBuildErrors: true,
  },
  // Optimize for production
  reactStrictMode: true,
  // Suppress warnings about missing alt attributes temporarily
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
