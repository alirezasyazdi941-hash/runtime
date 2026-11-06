// Project workspace: extract, plan, install, run, stop. Node built-ins only.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { extractZip, flattenSingleRoot } from './zip.mjs';
import { detectProject, findStaticDir } from './detect.mjs';
import { createStaticServer } from './static-server.mjs';

const WIN = process.platform === 'win32';
const MAX_LOG_LINES = 3000;
const URL_RE = /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1?\]):(\d{2,5})\/?/i;

export const which = (cmd) => spawnSync(WIN ? 'where' : 'which', [cmd], { stdio: 'ignore' }).status === 0;

export function systemInfo() {
  const ver = (cmd, args = ['--version']) => {
    const r = spawnSync(cmd, args, { encoding: 'utf8', shell: WIN });
    return r.status === 0 ? (r.stdout || r.stderr).trim().split('\n')[0] : null;
  };
  const py = which('python3') ? 'python3' : which('python') ? 'python' : null;
  return {
    platform: `${process.platform}/${process.arch}`,
    node: process.version,
    npm: ver('npm'),
    python: py ? ver(py) : null,
    git: ver('git'),
    bun: ver('bun'), pnpm: ver('pnpm'), yarn: ver('yarn'),
  };
}

async function freePort(start, end) {
  for (let p = start; p <= end; p++) {
    const ok = await new Promise((resolve) => {
      const s = net.createServer();
      s.once('error', () => resolve(false));
      s.listen(p, '127.0.0.1', () => s.close(() => resolve(true)));
    });
    if (ok) return p;
  }
  throw new Error('No free port available');
}

const sanitizeName = (n) => (String(n || 'project').replace(/\.zip$/i, '').replace(/[^\w.\- ]+/g, '_').trim().slice(0, 60) || 'project');

export class Manager extends EventEmitter {
  constructor({ workspace, host = '127.0.0.1', portStart = 4100, portEnd = 4999 }) {
    super();
    this.workspace = path.resolve(workspace);
    this.host = host;
    this.portStart = portStart;
    this.portEnd = portEnd;
    this.projects = new Map(); // id -> { meta, logs, proc, staticServer }
    fs.mkdirSync(path.join(this.workspace, 'projects'), { recursive: true });
    fs.mkdirSync(path.join(this.workspace, 'tmp'), { recursive: true });
    this.#load();
  }

  dirOf(id) { return path.join(this.workspace, 'projects', id); }

  #load() {
    for (const id of fs.readdirSync(path.join(this.workspace, 'projects'))) {
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(this.workspace, 'projects', id, '.nononick.json'), 'utf8'));
        meta.status = 'stopped'; meta.url = null; meta.port = null;
        this.projects.set(id, { meta, logs: [], proc: null, staticServer: null });
      } catch { /* ignore foreign folders */ }
    }
  }

  async #save(p) { await fsp.writeFile(path.join(this.dirOf(p.meta.id), '.nononick.json'), JSON.stringify(p.meta, null, 2)); }

  #update(p, patch) { Object.assign(p.meta, patch); this.emit('project', this.view(p)); }

  view(p) { return { ...p.meta }; }
  list() { return [...this.projects.values()].map((p) => this.view(p)).sort((a, b) => b.createdAt - a.createdAt); }
  get(id) { const p = this.projects.get(id); if (!p) throw Object.assign(new Error('Project not found'), { status: 404 }); return p; }
  logs(id) { return this.get(id).logs; }

  #log(p, line, stream = 'out') {
    const entry = { t: Date.now(), s: stream, m: line };
    p.logs.push(entry);
    if (p.logs.length > MAX_LOG_LINES) p.logs.splice(0, p.logs.length - MAX_LOG_LINES);
    this.emit('log', p.meta.id, entry);
  }

  /** Create a project from an uploaded file path (zip or single file). */
  async create(originalName, uploadedPath) {
    const id = crypto.randomBytes(5).toString('hex');
    const dir = this.dirOf(id);
    await fsp.mkdir(dir, { recursive: true });
    const isZip = /\.zip$/i.test(originalName);
    let info = { files: 1, bytes: 0 };
    try {
      if (isZip) {
        info = await extractZip(uploadedPath, dir);
        await flattenSingleRoot(dir);
      } else {
        const safe = path.basename(originalName).replace(/[^\w.\- ]+/g, '_') || 'file';
        await fsp.copyFile(uploadedPath, path.join(dir, safe));
        info.bytes = (await fsp.stat(uploadedPath)).size;
        if (/\.html?$/i.test(safe) && safe.toLowerCase() !== 'index.html') await fsp.rename(path.join(dir, safe), path.join(dir, 'index.html'));
      }
      if (info.files === 0) throw new Error('The archive contains no files');
    } catch (e) {
      await fsp.rm(dir, { recursive: true, force: true });
      throw Object.assign(e, { status: 400 });
    } finally {
      await fsp.rm(uploadedPath, { force: true });
    }
    const plan = await detectProject(dir);
    const meta = {
      id, name: sanitizeName(originalName), createdAt: Date.now(), files: info.files, bytes: info.bytes,
      type: plan.type, framework: plan.framework, packageManager: plan.packageManager || null, engine: plan.engine || null,
      steps: plan.steps.map((s) => ({ id: s.id, label: s.label })), runLabel: plan.run?.label || null,
      runnable: !!plan.run, notes: plan.notes, plan, status: 'ready', url: null, port: null, error: null,
    };
    const p = { meta, logs: [], proc: null, staticServer: null };
    this.projects.set(id, p);
    await this.#save(p);
    this.#log(p, `Detected: ${plan.framework} (${plan.type}) — ${info.files} files`, 'sys');
    if (meta.engine) {
      const need = parseInt(String(meta.engine).replace(/^\D+/, ''), 10);
      if (need && need > parseInt(process.versions.node, 10)) {
        this.#log(p, `This project asks for Node ${meta.engine}, you have ${process.version}. Run scripts/setup to install a newer Node.`, 'err');
      }
    }
    if (!plan.run) this.#log(p, 'Nothing runnable found in this package.', 'err');
    this.emit('project', this.view(p));
    return this.view(p);
  }

  #resolve(cmd, tokens) {
    let str;
    if (cmd.raw) str = cmd.raw;
    else {
      const { pm, args } = cmd;
      const extra = pm === 'npm' && args === 'install' ? ' --no-audit --no-fund' : '';
      const tool = pm === 'npm' || which(pm) ? pm : 'npm'; // bun/pnpm/yarn missing → fall back to npm
      str = `${tool} ${args}${tool === 'npm' && args === 'install' ? ' --no-audit --no-fund' : extra}`;
    }
    return str.replace(/\{(\w+)\}/g, (_, k) => tokens[k] ?? '');
  }

  #exec(p, command, { env = {}, track = false } = {}) {
    const dir = this.dirOf(p.meta.id);
    this.#log(p, `$ ${command}`, 'sys');
    const child = spawn(command, { cwd: dir, shell: true, detached: !WIN, env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', BROWSER: 'none', ...env } });
    if (track) p.proc = child;
    const feed = (stream) => {
      let buf = '';
      child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
      (stream === 'out' ? child.stdout : child.stderr).on('data', (d) => {
        buf += d;
        const lines = buf.split(/\r?\n/); buf = lines.pop();
        for (const l of lines) { if (l.trim()) this.#onLine(p, l, stream, track); }
      });
    };
    feed('out'); feed('err');
    const limitMs = Number(process.env.LAUNCHER_STEP_TIMEOUT_MIN || 20) * 60_000;
    const killer = track ? null : setTimeout(() => {
      this.#log(p, `Step timed out after ${limitMs / 60000} min — killing.`, 'err');
      if (WIN) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      else { try { process.kill(-child.pid, 'SIGKILL'); } catch { /* gone */ } }
    }, limitMs);
    return new Promise((resolve) => {
      child.on('close', () => clearTimeout(killer));
      child.on('error', (e) => { this.#log(p, `spawn error: ${e.message}`, 'err'); resolve(127); });
      child.on('close', (code) => resolve(code ?? 1));
    });
  }

  #onLine(p, line, stream, track) {
    const clean = line.replace(/\u001b\[[0-9;]*[A-Za-z]/g, '');
    this.#log(p, clean, stream);
    if (track && !p.meta.url) {
      const m = URL_RE.exec(clean);
      if (m) this.#update(p, { port: +m[1], url: `http://localhost:${m[1]}/`, status: 'running' });
    }
  }

  async start(id) {
    const p = this.get(id);
    if (['installing', 'building', 'running', 'starting'].includes(p.meta.status)) return this.view(p);
    const { plan } = p.meta;
    if (!plan.run) throw Object.assign(new Error('Nothing to run in this project'), { status: 400 });
    const dir = this.dirOf(id);
    const py = which('python3') ? 'python3' : 'python';
    const vpy = WIN ? '.venv\\Scripts\\python.exe' : '.venv/bin/python';
    const tokens = { PY: py, VPY: vpy, HOST: this.host };

    this.#update(p, { status: 'installing', error: null, url: null, port: null });
    try {
      if (plan.type === 'node' && plan.steps.length && !which('npm')) {
        throw new Error('npm was not found. Install Node.js (run scripts/setup.sh or scripts/setup.ps1) and retry.');
      }
      if (plan.type === 'python' && plan.steps.length && !which(py)) {
        throw new Error('Python was not found. Install Python 3 and retry.');
      }
      for (const step of plan.steps) {
        if (step.skipIf && fs.existsSync(path.join(dir, step.skipIf))) { this.#log(p, `skip: ${step.label} (already done)`, 'sys'); continue; }
        this.#update(p, { status: step.id === 'build' ? 'building' : 'installing' });
        this.#log(p, `▶ ${step.label}`, 'sys');
        const code = await this.#exec(p, this.#resolve(step.cmd, tokens));
        if (code !== 0) throw new Error(`"${step.label}" failed (exit ${code})`);
        if (step.skipIf?.startsWith('.venv/')) await fsp.writeFile(path.join(dir, step.skipIf), '');
      }
      const port = await freePort(this.portStart, this.portEnd);
      tokens.PORT = String(port);
      this.#log(p, `▶ ${plan.run.label}`, 'sys');

      if (plan.run.kind === 'static') {
        const root = plan.run.dir ? path.join(dir, plan.run.dir) : await findStaticDir(dir);
        if (!root) throw new Error('No index.html found to serve (the build produced no static output).');
        const srv = createStaticServer(root);
        await new Promise((res, rej) => { srv.once('error', rej); srv.listen(port, this.host, res); });
        p.staticServer = srv;
        this.#log(p, `Serving ${path.relative(dir, root) || '.'} on http://localhost:${port}/`, 'sys');
        this.#update(p, { status: 'running', port, url: `http://localhost:${port}/` });
        return this.view(p);
      }

      this.#update(p, { status: 'starting', port });
      const env = { PORT: String(port), HOST: this.host, HOSTNAME: this.host };
      const done = this.#exec(p, this.#resolve(plan.run.cmd, tokens), { env, track: true });
      // Fallback if the program never prints a URL
      const timer = setTimeout(() => {
        if (p.meta.status === 'starting') this.#update(p, { status: 'running', url: `http://localhost:${port}/` });
      }, 20000);
      done.then((code) => {
        clearTimeout(timer); p.proc = null;
        if (p.meta.status === 'stopped') return;
        this.#log(p, `Process exited with code ${code}`, code === 0 ? 'sys' : 'err');
        this.#update(p, { status: code === 0 ? 'exited' : 'error', error: code === 0 ? null : `Exited with code ${code}`, url: null });
      });
    } catch (e) {
      this.#log(p, e.message, 'err');
      this.#update(p, { status: 'error', error: e.message });
    }
    return this.view(p);
  }

  async stop(id) {
    const p = this.get(id);
    this.#update(p, { status: 'stopped', url: null, port: null });
    if (p.staticServer) { p.staticServer.close(); p.staticServer.closeAllConnections?.(); p.staticServer = null; }
    const child = p.proc;
    if (child?.pid) {
      if (WIN) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      else {
        try { process.kill(-child.pid, 'SIGTERM'); } catch { /* gone */ }
        setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch { /* gone */ } }, 3000).unref();
      }
      p.proc = null;
    }
    this.#log(p, 'Stopped.', 'sys');
    return this.view(p);
  }

  async remove(id) {
    const p = this.get(id);
    await this.stop(id);
    this.projects.delete(id);
    await fsp.rm(this.dirOf(id), { recursive: true, force: true });
    this.emit('removed', id);
  }

  async shutdown() { for (const id of [...this.projects.keys()]) await this.stop(id).catch(() => {}); }
}
