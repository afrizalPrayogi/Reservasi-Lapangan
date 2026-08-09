import { networkInterfaces } from 'os';

type RequestLike = {
  headers?: Record<string, string | string[] | undefined>;
  protocol?: string;
  get?: (name: string) => string | undefined;
};

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

function getFirstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function isLocalOrPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

export function getRequestBaseUrl(req?: RequestLike): string {
  const forwardedProto = getFirstHeaderValue(req?.headers?.['x-forwarded-proto']);
  const forwardedHost = getFirstHeaderValue(req?.headers?.['x-forwarded-host']);
  const host = forwardedHost || req?.get?.('host') || getFirstHeaderValue(req?.headers?.host);
  const protocol = forwardedProto || req?.protocol || 'http';

  if (!host) {
    return getBaseUrl();
  }

  return `${protocol}://${host}`;
}

export function buildPublicUrl(baseUrl: string | undefined, path: string): string {
  const normalizedBase =
    (baseUrl || getBaseUrl()).replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function toDatabaseBytes(buffer: Buffer): Uint8Array<ArrayBuffer> {
  const start = buffer.byteOffset;
  const end = buffer.byteOffset + buffer.byteLength;
  return new Uint8Array(buffer.buffer.slice(start, end)) as Uint8Array<ArrayBuffer>;
}

export function normalizeAssetUrl(
  assetUrl?: string | null,
  baseUrl?: string,
): string | null {
  if (!assetUrl) {
    return null;
  }

  const url = assetUrl.trim();
  if (!url) {
    return null;
  }

  if (url === 'OFFLINE_PAYMENT') {
    return url;
  }

  const effectiveBaseUrl =
    baseUrl ||
    process.env.PUBLIC_BASE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.BASE_URL ||
    '';

  const normalizedBase = effectiveBaseUrl.replace(/\/+$/, '');

  if (url.startsWith('/uploads/')) {
    return normalizedBase ? `${normalizedBase}${url}` : url;
  }

  if (!/^https?:\/\//i.test(url)) {
    const path = url.startsWith('uploads/') ? `/${url}` : url;
    return normalizedBase ? `${normalizedBase}${path}` : path;
  }

  if (!normalizedBase) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const publicOrigin = new URL(normalizedBase).origin;
    if (parsed.origin === publicOrigin) {
      return url;
    }

    if (isLocalOrPrivateHost(parsed.hostname) || parsed.pathname.includes('/uploads/')) {
      return `${normalizedBase}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return url;
  }

  return url;
}
