import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["localhost:3000", "127.0.0.1:3000"],
  serverExternalPackages: ["discord.js", "@discordjs/ws", "zlib-sync"],
};

export default nextConfig;
