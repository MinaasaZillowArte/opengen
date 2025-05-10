import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Opsi konfigurasi Anda yang lain...
  eslint: {
    // Peringatan: Ini akan menonaktifkan ESLint selama build.
    // Pastikan Anda hanya menggunakan ini untuk preview sementara.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
