const { createHash, createHmac, timingSafeEqual } = require('node:crypto');

const COOKIE_NAME = 'dingdong_invite';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function base64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function constantTimeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function isValidInviteCode(code) {
  const normalizedCode = String(code || '').trim();
  if (!normalizedCode) return false;

  const configuredHash = process.env.INVITE_CODE_HASH;
  if (configuredHash) {
    return constantTimeEqual(sha256(normalizedCode), configuredHash.trim().toLowerCase());
  }

  const configuredCode = process.env.INVITE_CODE;
  if (configuredCode) {
    return constantTimeEqual(normalizedCode, configuredCode.trim());
  }

  return false;
}

async function readBody(request) {
  const contentType = request.headers['content-type'] || '';
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (contentType.includes('application/json')) {
    return JSON.parse(rawBody || '{}');
  }

  return Object.fromEntries(new URLSearchParams(rawBody));
}

function createSessionCookie() {
  const secret = process.env.INVITE_SESSION_SECRET;
  if (!secret) {
    throw new Error('Missing INVITE_SESSION_SECRET');
  }

  const expiresAt = String(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const signature = base64Url(createHmac('sha256', secret).update(expiresAt).digest());
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  return [
    `${COOKIE_NAME}=${expiresAt}.${signature}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    secure,
  ].join('; ');
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ ok: false, message: 'Method not allowed' });
    return;
  }

  try {
    const body = await readBody(request);
    if (!isValidInviteCode(body.code)) {
      response.status(401).json({ ok: false, message: '邀请码不正确' });
      return;
    }

    response.setHeader('Set-Cookie', createSessionCookie());
    response.status(200).json({ ok: true });
  } catch (error) {
    response.status(500).json({ ok: false, message: '邀请码校验暂时不可用' });
  }
};
