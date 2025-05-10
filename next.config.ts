import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Di sini mungkin ada konfigurasi Next.js Anda yang lain
  // contoh: reactStrictMode: true,
  // contoh: images: { domains: ['example.com'] },

  // Ini bagian yang PENTING untuk menonaktifkan ESLint saat build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // PASTIKAN tidak ada `ignoreDuringBuilds: true,` yang berdiri sendiri di sini.
  // Jadi, JANGAN seperti ini (ini yang menyebabkan error "Unrecognized key"):
  // ignoreDuringBuilds: true, // <--- INI SALAH jika di luar blok eslint
};

export default nextConfig;