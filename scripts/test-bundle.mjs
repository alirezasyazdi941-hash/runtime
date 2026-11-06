// Smoke test of dist/nononick-launcher.mjs: start it, upload a ZIP, expect it to run.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { makeZip } from '../launcher/test/zip-fixture.mjs';

const port = 4000 + Math.floor(Math.random() * 900);
const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'nnk-bundle-'));
const child = spawn(process.execPath, ['dist/nononick-launcher.mjs'], { env: { ...process.env, LAUNCHER_PORT: String(port), LAUNCHER_WORKSPACE: ws }, stdio: 'inherit' });
const base = `http://127.0.0.1:${port}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = false;
try {
  for (let i = 0; i < 40; i++) { try { await fetch(base + '/api/system'); break; } catch { await sleep(150); } }
  const ui = await (await fetch(base + '/')).text();
  if (!ui.includes('NONONICK Launcher')) throw new Error('UI not embedded');
  const proj = await (await fetch(`${base}/api/projects?name=t.zip`, { method: 'POST', body: makeZip([['t/index.html', '<h1>bundle-ok</h1>']]) })).json();
  let url = null;
  for (let i = 0; i < 60 && !url; i++) { await sleep(150); url = (await (await fetch(base + '/api/projects')).json()).find((p) => p.id === proj.id)?.url; }
  if (!url) throw new Error('project did not start');
  const html = await (await fetch(url)).text();
  ok = html.includes('bundle-ok');
  console.log(ok ? '✓ bundle smoke test passed' : '✗ unexpected content');
} catch (e) { console.error('✗', e.message); }
finally { child.kill('SIGTERM'); await sleep(300); fs.rmSync(ws, { recursive: true, force: true }); process.exit(ok ? 0 : 1); }
