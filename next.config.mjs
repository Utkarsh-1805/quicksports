/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "@prisma/engines",
    "pg",
    "pg-native",
  ],
};

export default nextConfig;
