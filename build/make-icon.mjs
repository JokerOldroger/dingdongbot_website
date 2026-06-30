import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pngToIco from 'png-to-ico';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const sourceIcon = path.join(projectRoot, 'public/assets/home/video/logo-mark-purple.png');
const squareIcon = path.join(projectRoot, 'build/icon-source.png');
const targetIcon = path.join(projectRoot, 'build/icon.ico');

await execFileAsync('sips', [
  '-p',
  '147',
  '147',
  '--padColor',
  'FFFFFF',
  sourceIcon,
  '--out',
  squareIcon,
]);

const pngBuffer = await readFile(squareIcon);
const icoBuffer = await pngToIco(pngBuffer);

await writeFile(targetIcon, icoBuffer);
console.log(`Generated ${targetIcon}`);
