import { networkInterfaces } from 'os';

/**
 * Auto-detect IP jaringan lokal perangkat.
 * Mencari IPv4 address non-internal pertama dari network interfaces.
 * Berguna untuk generate URL yang bisa diakses dari perangkat lain di jaringan yang sama.
 *
 * @returns IP address string (misal: '192.168.1.15') atau 'localhost' jika tidak ditemukan
 */
export function getLocalIp(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      // Hanya ambil IPv4 non-internal (bukan 127.0.0.1)
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

/**
 * Dapatkan BASE_URL dari environment variable, atau auto-detect dari IP jaringan.
 * Prioritas: process.env.BASE_URL > auto-detect IP
 *
 * @returns Base URL string (misal: 'http://192.168.1.15:3333')
 */
export function getBaseUrl(): string {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  const port = process.env.PORT || '3333';
  return `http://${getLocalIp()}:${port}`;
}
