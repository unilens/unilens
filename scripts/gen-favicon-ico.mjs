// scripts/gen-favicon-ico.mjs
import { readFileSync, writeFileSync } from 'fs';

const buf = readFileSync('./src/favicon.ico'); // adjust path to your .ico file
const b64 = buf.toString('base64');
const ts = `// Auto-generated
const b64 = '${b64}';
export const faviconIco: Uint8Array = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
`;
writeFileSync('./src/favicon-ico.ts', ts);
console.log('Done.', buf.length, 'bytes');