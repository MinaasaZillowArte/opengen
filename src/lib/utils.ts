// lib/utils.ts

// Komentar awal:
// Fungsi utilitas untuk menghasilkan UUID v4 (Universally Unique Identifier).
// UUID digunakan untuk membuat ID yang unik secara global.
// Implementasi ini mengutamakan penggunaan crypto.getRandomValues() untuk keacakan
// yang lebih kuat jika tersedia, dengan fallback ke Math.random().
// Untuk kebutuhan produksi yang sangat kritis dan fitur UUID yang lebih lengkap (misalnya v1, v3, v5),
// pertimbangkan menggunakan pustaka UUID yang mapan dan teruji seperti 'uuid'.

// UUID adalah tentang *keunikan* ID, bukan *enkripsi* data.
// Jika Anda memerlukan enkripsi, gunakan mekanisme kriptografi yang sesuai secara terpisah.

// Helper untuk konversi byte ke string heksadesimal.
// Diinisialisasi sekali saat modul dimuat untuk efisiensi.
const byteToHex: string[] = [];
for (let i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substring(1);
}

export function uuidv4(): string {
  // Coba gunakan crypto.getRandomValues jika tersedia (lebih aman)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const rnds = crypto.getRandomValues(new Uint8Array(16));

    // Atur bit untuk versi 4 (sesuai RFC 4122)
    // rnds[6] = (rnds[6] & 0x0f) | 0x40;
    // eslint-disable-next-line no-bitwise
    rnds[6] = (rnds[6] & 0x0f) | 0x40; // version 4
    // Atur bit untuk varian RFC 4122 (10xx)
    // rnds[8] = (rnds[8] & 0x3f) | 0x80;
    // eslint-disable-next-line no-bitwise
    rnds[8] = (rnds[8] & 0x3f) | 0x80; // variant RFC4122

    return (
      byteToHex[rnds[0]] + byteToHex[rnds[1]] + byteToHex[rnds[2]] + byteToHex[rnds[3]] + '-' +
      byteToHex[rnds[4]] + byteToHex[rnds[5]] + '-' +
      byteToHex[rnds[6]] + byteToHex[rnds[7]] + '-' +
      byteToHex[rnds[8]] + byteToHex[rnds[9]] + '-' +
      byteToHex[rnds[10]] + byteToHex[rnds[11]] + byteToHex[rnds[12]] + byteToHex[rnds[13]] + byteToHex[rnds[14]] + byteToHex[rnds[15]]
    ).toLowerCase();
  }

  // Fallback ke Math.random() jika crypto API tidak tersedia
  // Implementasi ini sama dengan versi sederhana sebelumnya.
  console.warn('Crypto API tidak tersedia. Menggunakan Math.random() untuk generasi UUID (kurang aman untuk keacakan).');
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    // eslint-disable-next-line no-bitwise
    const r = (Math.random() * 16) | 0;
    // eslint-disable-next-line no-bitwise
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}