import { BadRequestException } from '@nestjs/common';
import { isIP } from 'node:net';
import { settings } from '../config/config';
export function destinationUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new BadRequestException('Enter a valid HTTP or HTTPS destination');
  }
  if (
    raw.length > 2048 ||
    Array.from(raw).some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127) ||
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new BadRequestException(
      'Enter a valid public HTTP or HTTPS destination without credentials',
    );
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const blocked =
    ['localhost', 'localhost.localdomain'].includes(host) ||
    /\.(localhost|local|internal)$/.test(host);
  const local4 =
    isIP(host) === 4 &&
    ((p: number[]) =>
      p[0] === 0 ||
      p[0] === 10 ||
      p[0] === 127 ||
      p[0] >= 224 ||
      (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168) ||
      (p[0] === 100 && p[1] >= 64 && p[1] <= 127))(host.split('.').map(Number));
  const local6 =
    isIP(host) === 6 && (host === '::' || host === '::1' || /^(fc|fd|fe[89ab]|::ffff:)/.test(host));
  const self = url.origin === settings().publicBaseUrl && url.pathname.startsWith('/r/');
  if (blocked || local4 || local6 || self || (!host.includes('.') && !isIP(host)))
    throw new BadRequestException('Choose a public destination outside SignalHop redirects');
  return url.toString();
}
