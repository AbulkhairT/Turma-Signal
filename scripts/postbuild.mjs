import { mkdirSync, existsSync, writeFileSync } from 'node:fs';

if (!existsSync('public')) {
  mkdirSync('public', { recursive: true });
}

writeFileSync('public/vercel-build-marker.txt', 'signal build marker\n');
