import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import http from 'node:http';
import { extractZip } from '../lib/zip.mjs';
import { detectProject } from '../lib/detect.mjs';
import { createLauncher } from '../server.mjs';
import { makeZip } from './zip-fixture.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'nnk-'));
const get = (url, headers = {}) => new Promise((resolve, reject) => {
  http.get(url, { headers }, (r) => { let b = ''; r.on('data', (c) => (b += c)); r.on('end', () => resolve({ status: r.statusCode, body: b })); }).on('error', reject);
});
const until = async (fn, ms = 15000) => { const t0 = Date.now(); for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t0 > ms) throw new Error('timeout'); await new Promise((r) => setTimeout(r, 150)); } };

test('extractZip extracts files (deflate + stored)', async () => {
  const d = tmp(), z = path.join(d, 'a.zip');
  fs.writeFileSync(z, makeZip([['x/hello.txt', 'hello world'], ['x/s.txt', 'stored', 0]]));
  const r = await extractZip(z, path.join(d, 'out'));
  assert.equal(r.files, 2);
  assert.equal(fs.readFileSync(path.join(d, 'out/x/hello.txt'), 'utf8'), 'hello world');
});

test('extractZip rejects zip-slip paths', async () => {
  const d = tmp(), z = path.join(d, 'evil.zip');
  fs.writeFileSync(z, makeZip([['../../evil.txt', 'pwn']]));
  await assert.rejects(extractZip(z, path.join(d, 'out')), /Unsafe path/);
  assert.equal(fs.existsSync(path.join(d, '../evil.txt')), false);
});

test('detect: node, static, python, unknown', async () => {
  const mk = (files) => { const d = tmp(); for (const [k, v] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(d, k)), { recursive: true }); fs.writeFileSync(path.join(d, k), v); } return d; };
  const n = await detectProject(mk({ 'package.json': JSON.stringify({ scripts: { start: 'node s.js' }, dependencies: { express: '^5' } }) }));
  assert.equal(n.type, 'node'); assert.equal(n.steps[0].id, 'install'); assert.match(n.run.label, /start/);
  assert.equal((await detectProject(mk({ 'index.html': '<h1>x</h1>' }))).type, 'static');
  assert.equal((await detectProject(mk({ 'dist/index.html': 'x' }))).type, 'static');
  const py = await detectProject(mk({ 'requirements.txt': 'flask', 'app.py': 'from flask import Flask' }));
  assert.equal(py.type, 'python'); assert.equal(py.framework, 'Flask');
  assert.equal((await detectProject(mk({ 'notes.txt': 'x' }))).type, 'unknown');
});

test('launcher: upload zip → install → run → stop; rejects foreign Host', async () => {
  const ws = tmp();
  const app = createLauncher({ port: 0, workspace: ws });
  const port = await app.listen();
  const base = `http://127.0.0.1:${port}`;
  try {
    assert.equal((await get(base + '/api/system', { host: 'evil.example' })).status, 403);

    const zip = makeZip([
      ['demo/package.json', JSON.stringify({ name: 'demo', scripts: { start: 'node server.js' } })],
      ['demo/server.js', `require('http').createServer((q,s)=>s.end('hello-from-demo')).listen(process.env.PORT,'127.0.0.1',()=>console.log('http://localhost:'+process.env.PORT+'/'))`],
    ]);
    const res = await fetch(`${base}/api/projects?name=demo.zip`, { method: 'POST', body: zip, headers: { origin: base } });
    assert.equal(res.status, 201);
    const proj = await res.json();
    assert.equal(proj.type, 'node'); assert.equal(proj.runnable, true);

    const running = await until(async () => { const l = await (await fetch(`${base}/api/projects`)).json(); const p = l.find((x) => x.id === proj.id); return p.status === 'running' && p.url ? p : null; });
    const page = await get(running.url);
    assert.equal(page.body, 'hello-from-demo');

    await fetch(`${base}/api/projects/${proj.id}/stop`, { method: 'POST' });
    await until(async () => { try { await get(running.url); return false; } catch { return true; } }, 8000);
  } finally { await app.close(); }
});

test('launcher: static zip is served', async () => {
  const app = createLauncher({ port: 0, workspace: tmp() });
  const port = await app.listen(); const base = `http://127.0.0.1:${port}`;
  try {
    const res = await fetch(`${base}/api/projects?name=site.zip`, { method: 'POST', body: makeZip([['site/index.html', '<h1>static-ok</h1>']]) });
    const proj = await res.json();
    const p = await until(async () => { const l = await (await fetch(`${base}/api/projects`)).json(); const x = l.find((i) => i.id === proj.id); return x.status === 'running' ? x : null; });
    assert.match((await get(p.url)).body, /static-ok/);
  } finally { await app.close(); }
});
