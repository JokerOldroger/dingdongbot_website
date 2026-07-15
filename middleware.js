const COOKIE_NAME = 'dingdong_invite';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const PUBLIC_PATHS = new Set([
  '/invite.html',
  '/api/verify-invite',
]);

function isPublicPath(pathname) {
  return PUBLIC_PATHS.has(pathname);
}

function parseCookies(header) {
  return Object.fromEntries(
    (header || '')
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const separator = item.indexOf('=');
        if (separator === -1) return [item, ''];
        return [item.slice(0, separator), decodeURIComponent(item.slice(separator + 1))];
      }),
  );
}

function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmacSha256(message, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

function timingSafeEqualBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index];
  }
  return diff === 0;
}

async function hasValidSession(request) {
  const secret = process.env.INVITE_SESSION_SECRET;
  if (!secret) return false;

  const session = parseCookies(request.headers.get('cookie'))[COOKIE_NAME];
  if (!session) return false;

  const [expiresAt, signature] = session.split('.');
  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return false;

  const expected = await hmacSha256(expiresAt, secret);
  const received = base64UrlToBytes(signature || '');
  return timingSafeEqualBytes(expected, received);
}

export default async function middleware(request) {
  const url = new URL(request.url);

  if (isPublicPath(url.pathname) || await hasValidSession(request)) {
    return;
  }

  const inviteUrl = new URL('/invite.html', request.url);
  inviteUrl.searchParams.set('next', `${url.pathname}${url.search}`);

  return Response.redirect(inviteUrl, 307);
}

export const config = {
  matcher: '/((?!_vercel/insights|favicon.ico).*)',
};

export { COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
