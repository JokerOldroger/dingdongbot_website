import { createHash, randomBytes } from 'node:crypto';
import { argv } from 'node:process';

const code = argv[2];

if (!code) {
  console.error('Usage: node scripts/hash-invite-code.mjs <invite-code>');
  process.exit(1);
}

console.log(createHash('sha256').update(code, 'utf8').digest('hex'));
console.log(`Recommended INVITE_SESSION_SECRET: ${randomBytes(32).toString('hex')}`);
