#!/usr/bin/env node
// Builds dist/nononick-launcher.mjs — ONE file with the UI embedded. Run it anywhere with: node nononick-launcher.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'launcher');
const order = ['lib/zip.mjs', 'lib/static-server.mjs', 'lib/detect.mjs', 'lib/manager.mjs', 'server.mjs'];
const imports = new Map(); // exact import line -> kept once
let body = '';

for (const rel of order) {
  let src = fs.readFileSync(path.join(root, rel), 'utf8').replace(/^#!.*\n/, '');
  // multi-line-safe: imports in these files are single statements ending with ';'
  src = src.replace(/^import\s[^;]*?from\s+'([^']+)';\n/gm, (line, spec) => {
    if (spec.startsWith('node:')) imports.set(line.trim(), true);
    return '';
  });
  src = src.replace(/^export\s+(async\s+function|function|class|const|let)\s/gm, '$1 ');
  if (/^export\s/m.test(src)) throw new Error(`unhandled export in ${rel}`);
  body += `\n// ───── ${rel}\n${src}`;
}

const ui = fs.readFileSync(path.join(root, 'ui.html'), 'utf8');
body = body.replace("const ui = () => fs.readFileSync(path.join(here, 'ui.html'));", 'const ui = () => Buffer.from(UI_HTML);');
if (!body.includes('UI_HTML')) throw new Error('ui hook not found');

const out = `#!/usr/bin/env node\n// NONONICK Launcher — single-file build. Zero dependencies, Node >= 18.\n${[...imports.keys()].join('\n')}\n\nconst UI_HTML = ${JSON.stringify(ui)};\n${body}`;
const dist = path.resolve(root, '..', 'dist');
fs.mkdirSync(dist, { recursive: true });
const file = path.join(dist, 'nononick-launcher.mjs');
fs.writeFileSync(file, out, { mode: 0o755 });
console.log(`✓ ${path.relative(process.cwd(), file)}  (${(out.length / 1024).toFixed(1)} KB)`);
