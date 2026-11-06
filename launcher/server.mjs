#!/usr/bin/env node
// NONONICK Launcher — drag & drop a ZIP (or a single file), it installs and runs it.
// Zero dependencies. Node >= 18.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Manager, systemInfo, publicUrlFor } from './lib/manager.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const isLoopback = (h) => ['127.0.0.1', 'localhost', '::1'].includes(h);

export function createLauncher({
  host = process.env.LAUNCHER_HOST || '127.0.0.1',
  port = Number(process.env.LAUNCHER_PORT || 4000),
  workspace = process.env.LAUNCHER_WORKSPACE || path.resolve(here, '..', '.nononick-workspace'),
  token = process.env.LAUNCHER_TOKEN || '',
  maxMb = Number(process.env.LAUNCHER_MAX_MB || 1024),
} = {}) {
  if (!isLoopback(host) && !token && process.env.LAUNCHER_INSECURE !== '1') {
    throw new Error('Refusing to listen on a non-loopback address without LAUNCHER_TOKEN (this tool executes uploaded code). Set LAUNCHER_TOKEN, or LAUNCHER_INSECURE=1 to override.');
  }
  const manager = new Manager({ workspace, host });
  const clients = new Set();
  const broadcast = (obj) => { const d = `data: ${JSON.stringify(obj)}\n\n`; for (const c of clients) c.write(d); };
  manager.on('project', (p) => broadcast({ type: 'project', project: p }));
  manager.on('log', (id, entry) => broadcast({ type: 'log', id, entry }));
  manager.on('removed', (id) => broadcast({ type: 'removed', id }));

  const json = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
  const ui = () => fs.readFileSync(path.join(here, 'ui.html'));

  function authorised(req, url) {
    // DNS-rebinding / CSRF guard: only accept our own Host, and same-origin Origin.
    const hostHdr = (req.headers.host || '').toLowerCase();
    const bound = server.address()?.port ?? port;
    const extra = (process.env.LAUNCHER_ALLOWED_HOSTS || '').split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);
    try { extra.push(new URL(publicUrlFor(bound)).host.toLowerCase()); } catch { /* ignore */ }
    if (isLoopback(host) && ![`localhost:${bound}`, `127.0.0.1:${bound}`, `[::1]:${bound}`, ...extra].includes(hostHdr)) return false;
    const origin = req.headers.origin;
    if (origin) { try { if (new URL(origin).host.toLowerCase() !== hostHdr) return false; } catch { return false; } }
    if (token) {
      const given = req.headers['x-launcher-token'] || url.searchParams.get('token') || '';
      const a = Buffer.from(String(given)), b = Buffer.from(token);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    }
    return true;
  }

  function receiveUpload(req) {
    const limit = maxMb * 1024 * 1024;
    const tmp = path.join(manager.workspace, 'tmp', crypto.randomBytes(6).toString('hex'));
    return new Promise((resolve, reject) => {
      let size = 0;
      const out = fs.createWriteStream(tmp);
      req.on('data', (c) => {
        size += c.length;
        if (size > limit) { req.destroy(); out.destroy(); fs.rmSync(tmp, { force: true }); reject(Object.assign(new Error(`Upload exceeds ${maxMb} MB`), { status: 413 })); }
      });
      req.pipe(out);
      out.on('finish', () => resolve(tmp));
      out.on('error', reject);
      req.on('error', reject);
    });
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    try {
      if (!authorised(req, url)) return json(res, 403, { error: 'Forbidden' });
      const p = url.pathname;
      if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'x-frame-options': 'DENY' });
        return res.end(ui());
      }
      if (req.method === 'GET' && p === '/api/system') return json(res, 200, systemInfo());
      if (req.method === 'GET' && p === '/api/projects') return json(res, 200, manager.list());
      if (req.method === 'GET' && p === '/api/events') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
        res.write(': hi\n\n'); clients.add(res);
        const ka = setInterval(() => res.write(': ka\n\n'), 25000);
        req.on('close', () => { clearInterval(ka); clients.delete(res); });
        return;
      }
      if (req.method === 'POST' && p === '/api/projects') {
        const name = url.searchParams.get('name') || 'upload.zip';
        const tmp = await receiveUpload(req);
        const project = await manager.create(name, tmp);
        const auto = url.searchParams.get('autostart') !== '0';
        if (auto && project.runnable) manager.start(project.id).catch(() => {});
        return json(res, 201, project);
      }
      const m = p.match(/^\/api\/projects\/([a-f0-9]+)(?:\/(start|stop|logs))?$/);
      if (m) {
        const [, id, action] = m;
        if (req.method === 'GET' && action === 'logs') return json(res, 200, manager.logs(id));
        if (req.method === 'POST' && action === 'start') { manager.start(id).catch(() => {}); return json(res, 202, manager.view(manager.get(id))); }
        if (req.method === 'POST' && action === 'stop') return json(res, 200, await manager.stop(id));
        if (req.method === 'DELETE' && !action) { await manager.remove(id); return json(res, 200, { ok: true }); }
      }
      json(res, 404, { error: 'Not found' });
    } catch (e) {
      json(res, e.status || 500, { error: e.message });
    }
  });

  return {
    server, manager,
    listen: () => new Promise((resolve) => server.listen(port, host, () => resolve(server.address().port))),
    close: async () => { await manager.shutdown(); for (const c of clients) c.end(); server.closeAllConnections?.(); await new Promise((r) => server.close(r)); },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let app;
  try { app = createLauncher(); } catch (e) { console.error(e.message); process.exit(1); }
  const port = await app.listen();
  const tokenQ = process.env.LAUNCHER_TOKEN ? `/?token=${encodeURIComponent(process.env.LAUNCHER_TOKEN)}` : '/';
  console.log(`\n  NONONICK Launcher  →  ${publicUrlFor(port).replace(/\/$/, '')}${tokenQ}\n  Workspace: ${app.manager.workspace}\n  Drop a .zip in the browser to install and run it. Ctrl+C to quit.\n`);
  const bye = async () => { await app.close(); process.exit(0); };
  process.on('SIGINT', bye); process.on('SIGTERM', bye);
}
