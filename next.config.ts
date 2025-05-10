import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // PERINGATAN: Ini akan membuat build produksi berhasil meskipun
    // proyek Anda memiliki error ESLint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
