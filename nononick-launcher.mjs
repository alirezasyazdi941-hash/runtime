#!/usr/bin/env node
// NONONICK Launcher — single-file build. Zero dependencies, Node >= 18.
import fsp from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { promisify } from 'node:util';
import http from 'node:http';
import fs from 'node:fs';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { fileURLToPath } from 'node:url';

const UI_HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>NONONICK Launcher</title>\n<style>\n:root{--bg:#080b10;--panel:#0c1017;--line:#1e293b;--fg:#e2e8f0;--mut:#94a3b8;--acc:#22d3ee;--ok:#34d399;--err:#f87171;--warn:#fbbf24}\n@media (prefers-color-scheme: light){:root{--bg:#f8fafc;--panel:#fff;--line:#e2e8f0;--fg:#0f172a;--mut:#64748b;--acc:#0891b2;--ok:#059669;--err:#dc2626;--warn:#d97706}}\n*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,Segoe UI,Vazirmatn,sans-serif}\nmain{max-width:1000px;margin:0 auto;padding:20px}\nheader{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:12px}\nh1{font-size:18px;margin:0}small,.mut{color:var(--mut)}\nbutton{font:inherit;cursor:pointer;border:1px solid var(--line);background:var(--panel);color:var(--fg);padding:4px 10px;border-radius:8px}\nbutton.pri{background:var(--acc);color:#001018;border-color:var(--acc);font-weight:600}button:disabled{opacity:.5;cursor:default}\n#drop{margin:16px 0;border:2px dashed var(--line);border-radius:16px;padding:32px 16px;text-align:center;background:var(--panel);transition:.15s}\n#drop.over{border-color:var(--acc);background:color-mix(in srgb,var(--acc) 10%,var(--panel))}\n#sys{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0;font:12px ui-monospace,monospace}\n.chip{border:1px solid var(--line);border-radius:999px;padding:1px 8px}.chip.bad{color:var(--err);border-color:var(--err)}\n.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px;margin:10px 0;display:grid;gap:6px}\n.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:space-between}\n.badge{font:11px ui-monospace,monospace;padding:1px 8px;border-radius:6px;border:1px solid var(--line)}\n.running{color:var(--ok)}.error{color:var(--err)}.installing,.building,.starting{color:var(--warn)}\na{color:var(--acc)}#log{height:260px;overflow:auto;background:#05070b;color:#cbd5e1;border:1px solid var(--line);border-radius:10px;padding:8px;font:12px/1.5 ui-monospace,monospace;white-space:pre-wrap;direction:ltr;text-align:left}\n#log .err{color:#f87171}#log .sys{color:#22d3ee}\nlabel.chk{display:inline-flex;gap:6px;align-items:center}\n</style>\n</head>\n<body>\n<main>\n<header>\n  <div><h1>NONONICK Launcher</h1><small id=\"sub\"></small></div>\n  <div><button id=\"lang\">فارسی</button></div>\n</header>\n<div id=\"sys\"></div>\n<div id=\"drop\">\n  <div style=\"font-size:15px;font-weight:600\" id=\"t_drop\"></div>\n  <p class=\"mut\" id=\"t_hint\"></p>\n  <input id=\"file\" type=\"file\" multiple hidden>\n  <button class=\"pri\" id=\"pick\"></button>\n  <p><label class=\"chk\"><input type=\"checkbox\" id=\"auto\" checked><span id=\"t_auto\"></span></label></p>\n  <div id=\"msg\" class=\"mut\"></div>\n</div>\n<div id=\"list\"></div>\n<h3 id=\"t_logs\"></h3>\n<div id=\"log\"></div>\n</main>\n<script>\nconst T={en:{sub:'Drop a ZIP — it gets installed and run.',drop:'Drag & drop a .zip here',hint:'Node.js, Python or static sites. A single .js / .py / .html file works too.',pick:'Choose files',auto:'Install & run automatically after drop',logs:'Logs',start:'Start',stop:'Stop',del:'Delete',open:'Open',uploading:'Uploading',folder:'Folders must be zipped first.',empty:'No projects yet.',norun:'Nothing runnable detected',missing:'missing'},\nfa:{sub:'یک زیپ بیندازید؛ نصب و اجرا می‌شود.',drop:'فایل .zip را اینجا رها کنید',hint:'پروژه Node.js، پایتون یا سایت استاتیک. یک فایل .js / .py / .html هم کار می‌کند.',pick:'انتخاب فایل',auto:'بعد از رها کردن، خودکار نصب و اجرا شود',logs:'لاگ‌ها',start:'اجرا',stop:'توقف',del:'حذف',open:'باز کردن',uploading:'در حال آپلود',folder:'پوشه‌ها را اول زیپ کنید.',empty:'هنوز پروژه‌ای نیست.',norun:'چیزی برای اجرا پیدا نشد',missing:'نصب نیست'}};\nlet lang=localStorage.getItem('lang')||(navigator.language||'').startsWith('fa')?'fa':'en';\nif(localStorage.getItem('lang'))lang=localStorage.getItem('lang');\nconst $=id=>document.getElementById(id), t=k=>T[lang][k];\nconst tok=new URLSearchParams(location.search).get('token')||sessionStorage.getItem('tk')||'';if(tok)sessionStorage.setItem('tk',tok);\nconst api=(p,o={})=>fetch(p+(tok?(p.includes('?')?'&':'?')+'token='+encodeURIComponent(tok):''),o).then(async r=>{const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||r.status);return j});\nconst projects=new Map(),logs=new Map();let sel=null;\nfunction applyLang(){document.documentElement.lang=lang;document.documentElement.dir=lang==='fa'?'rtl':'ltr';\n $('sub').textContent=t('sub');$('t_drop').textContent=t('drop');$('t_hint').textContent=t('hint');$('pick').textContent=t('pick');$('t_auto').textContent=t('auto');$('t_logs').textContent=t('logs');$('lang').textContent=lang==='fa'?'English':'فارسی';render();}\n$('lang').onclick=()=>{lang=lang==='fa'?'en':'fa';localStorage.setItem('lang',lang);applyLang()};\nfunction render(){const box=$('list');box.textContent='';\n if(!projects.size){const p=document.createElement('p');p.className='mut';p.textContent=t('empty');box.append(p)}\n for(const p of [...projects.values()].sort((a,b)=>b.createdAt-a.createdAt)){\n  const c=document.createElement('div');c.className='card';\n  const top=document.createElement('div');top.className='row';\n  const h=document.createElement('strong');h.textContent=p.name;\n  const st=document.createElement('span');st.className='badge '+p.status;st.textContent=p.status;\n  top.append(h,st);\n  const meta=document.createElement('div');meta.className='mut';meta.textContent=`${p.framework} · ${p.files} files · ${p.runLabel||t('norun')}`;\n  const act=document.createElement('div');act.className='row';const l=document.createElement('div');\n  if(p.url){const a=document.createElement('a');a.href=p.url;a.target='_blank';a.rel='noopener';a.textContent=p.url;l.append(a)}\n  if(p.error){const e=document.createElement('span');e.className='error';e.textContent=p.error;l.append(e)}\n  const b=document.createElement('div');\n  const mk=(txt,fn,cls,dis)=>{const x=document.createElement('button');x.textContent=txt;if(cls)x.className=cls;x.disabled=!!dis;x.onclick=fn;b.append(x,' ');return x};\n  const busy=['installing','building','starting','running'].includes(p.status);\n  mk(t('start'),()=>api(`/api/projects/${p.id}/start`,{method:'POST'}),'pri',busy||!p.runnable);\n  mk(t('stop'),()=>api(`/api/projects/${p.id}/stop`,{method:'POST'}),'',!busy);\n  mk(t('logs'),()=>{sel=p.id;renderLog()});\n  mk(t('del'),()=>api(`/api/projects/${p.id}`,{method:'DELETE'}));\n  act.append(l,b);c.append(top,meta,act);box.append(c)}\n }\nfunction renderLog(){const el=$('log');el.textContent='';for(const e of logs.get(sel)||[])addLine(e);el.scrollTop=1e9}\nfunction addLine(e){const s=document.createElement('div');if(e.s!=='out')s.className=e.s;s.textContent=e.m;$('log').append(s)}\nasync function upload(files){\n for(const f of files){\n  $('msg').textContent=`${t('uploading')} ${f.name}…`;\n  try{const p=await api(`/api/projects?name=${encodeURIComponent(f.name)}&autostart=${$('auto').checked?1:0}`,{method:'POST',body:f,headers:{'content-type':'application/octet-stream'}});\n   projects.set(p.id,p);sel=p.id;logs.set(p.id,await api(`/api/projects/${p.id}/logs`));$('msg').textContent='';}\n  catch(e){$('msg').textContent=e.message}\n }render();renderLog()}\nconst drop=$('drop');\n['dragenter','dragover'].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.classList.add('over')}));\n['dragleave','drop'].forEach(n=>drop.addEventListener(n,e=>{e.preventDefault();drop.classList.remove('over')}));\ndrop.addEventListener('drop',e=>{const items=[...e.dataTransfer.items||[]];\n if(items.some(i=>i.webkitGetAsEntry?.()?.isDirectory)){$('msg').textContent=t('folder');return}\n upload([...e.dataTransfer.files])});\n$('pick').onclick=()=>$('file').click();$('file').onchange=e=>{upload([...e.target.files]);e.target.value=''};\nwindow.addEventListener('dragover',e=>e.preventDefault());window.addEventListener('drop',e=>e.preventDefault());\n(async()=>{\n const sys=await api('/api/system').catch(()=>({}));\n for(const [k,v] of Object.entries(sys)){if(!v&&!['bun','pnpm','yarn'].includes(k)){}\n  if(!v&&['bun','pnpm','yarn'].includes(k))continue;\n  const c=document.createElement('span');c.className='chip'+(v?'':' bad');c.textContent=`${k}: ${v||t('missing')}`;$('sys').append(c)}\n for(const p of await api('/api/projects')){projects.set(p.id,p);logs.set(p.id,await api(`/api/projects/${p.id}/logs`))}\n sel=[...projects.keys()][0]||null;applyLang();renderLog();\n const es=new EventSource('/api/events'+(tok?'?token='+encodeURIComponent(tok):''));\n es.onmessage=m=>{const d=JSON.parse(m.data);\n  if(d.type==='project'){projects.set(d.project.id,d.project);render()}\n  if(d.type==='removed'){projects.delete(d.id);logs.delete(d.id);render()}\n  if(d.type==='log'){const a=logs.get(d.id)||[];a.push(d.entry);logs.set(d.id,a.slice(-3000));if(d.id===sel){const el=$('log');const near=el.scrollHeight-el.scrollTop-el.clientHeight<40;addLine(d.entry);if(near)el.scrollTop=1e9}}};\n})();\n</script>\n</body>\n</html>\n";

// ───── lib/zip.mjs
// Zero-dependency ZIP extractor (stored + deflate) with zip-slip and zip-bomb protection.

const inflateRaw = promisify(zlib.inflateRaw);

const LIMITS = {
  maxEntries: 50_000,
  maxEntryBytes: 1024 ** 3,
  maxTotalBytes: 2 * 1024 ** 3,
};

const SKIP = (name) =>
  name.startsWith('__MACOSX/') || name.endsWith('.DS_Store') || name === '.git' || name.startsWith('.git/');

function safeEntryPath(destDir, rawName) {
  const name = rawName.replace(/\\/g, '/').replace(/^\/+/, '');
  if (/^[a-zA-Z]:/.test(name) || name.split('/').includes('..') || name.includes('\0')) {
    throw new Error(`Unsafe path in archive: ${rawName}`);
  }
  const root = path.resolve(destDir);
  const target = path.resolve(root, name);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error(`Unsafe path in archive: ${rawName}`);
  }
  return { name, target };
}

async function extractZip(zipPath, destDir, limits = LIMITS) {
  const fh = await fsp.open(zipPath, 'r');
  try {
    const { size } = await fh.stat();
    if (size < 22) throw new Error('Not a valid ZIP file (too small)');
    const tailLen = Math.min(size, 65_557);
    const tail = Buffer.alloc(tailLen);
    await fh.read(tail, 0, tailLen, size - tailLen);
    let eocd = -1;
    for (let i = tailLen - 22; i >= 0; i--) {
      if (tail.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Not a valid ZIP file (central directory not found)');

    const total = tail.readUInt16LE(eocd + 10);
    const cdSize = tail.readUInt32LE(eocd + 12);
    const cdOffset = tail.readUInt32LE(eocd + 16);
    if (total === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
      throw new Error('ZIP64 archives are not supported. Re-zip with a standard tool.');
    }
    if (total > limits.maxEntries) throw new Error(`Archive has too many entries (${total})`);

    const cd = Buffer.alloc(cdSize);
    await fh.read(cd, 0, cdSize, cdOffset);

    await fsp.mkdir(destDir, { recursive: true });
    let pos = 0, files = 0, bytes = 0;

    for (let n = 0; n < total; n++) {
      if (cd.readUInt32LE(pos) !== 0x02014b50) throw new Error('Corrupt ZIP central directory');
      const flags = cd.readUInt16LE(pos + 8);
      const method = cd.readUInt16LE(pos + 10);
      const crc = cd.readUInt32LE(pos + 16);
      const compSize = cd.readUInt32LE(pos + 20);
      const rawSize = cd.readUInt32LE(pos + 24);
      const nameLen = cd.readUInt16LE(pos + 28);
      const extraLen = cd.readUInt16LE(pos + 30);
      const commentLen = cd.readUInt16LE(pos + 32);
      const extAttr = cd.readUInt32LE(pos + 38);
      const localOffset = cd.readUInt32LE(pos + 42);
      const rawName = cd.toString('utf8', pos + 46, pos + 46 + nameLen);
      pos += 46 + nameLen + extraLen + commentLen;

      if (SKIP(rawName.replace(/\\/g, '/'))) continue;
      if (flags & 1) throw new Error('Encrypted ZIP entries are not supported');
      const { name, target } = safeEntryPath(destDir, rawName);
      if (name === '' ) continue;
      if (name.endsWith('/')) { await fsp.mkdir(target, { recursive: true }); continue; }
      if (((extAttr >>> 16) & 0xf000) === 0xa000) continue; // never materialise symlinks
      if (rawSize > limits.maxEntryBytes) throw new Error(`Entry too large: ${name}`);
      bytes += rawSize;
      if (bytes > limits.maxTotalBytes) throw new Error('Archive exceeds the maximum extracted size');

      const lh = Buffer.alloc(30);
      await fh.read(lh, 0, 30, localOffset);
      if (lh.readUInt32LE(0) !== 0x04034b50) throw new Error('Corrupt ZIP local header');
      const dataStart = localOffset + 30 + lh.readUInt16LE(26) + lh.readUInt16LE(28);
      const comp = Buffer.alloc(compSize);
      if (compSize) await fh.read(comp, 0, compSize, dataStart);

      let data;
      if (method === 0) data = comp;
      else if (method === 8) data = await inflateRaw(comp, { maxOutputLength: rawSize + 1 });
      else throw new Error(`Unsupported compression method ${method} for ${name}`);
      if (data.length !== rawSize) throw new Error(`Size mismatch for ${name}`);
      if (typeof zlib.crc32 === 'function' && zlib.crc32(data) !== crc) throw new Error(`CRC mismatch for ${name}`);

      await fsp.mkdir(path.dirname(target), { recursive: true });
      await fsp.writeFile(target, data, { mode: (extAttr >>> 16) & 0o100 ? 0o755 : 0o644 });
      files++;
    }
    return { files, bytes };
  } finally {
    await fh.close();
  }
}

/** If dir contains exactly one directory (and nothing meaningful else), hoist its content up. */
async function flattenSingleRoot(dir) {
  const entries = (await fsp.readdir(dir)).filter((e) => e !== '__MACOSX' && e !== '.DS_Store');
  if (entries.length !== 1) return;
  const inner = path.join(dir, entries[0]);
  if (!(await fsp.stat(inner)).isDirectory()) return;
  const tmp = `${dir}.__flat`;
  await fsp.rename(inner, tmp);
  for (const e of await fsp.readdir(dir)) await fsp.rm(path.join(dir, e), { recursive: true, force: true });
  for (const e of await fsp.readdir(tmp)) await fsp.rename(path.join(tmp, e), path.join(dir, e));
  await fsp.rm(tmp, { recursive: true, force: true });
}

// ───── lib/static-server.mjs
// Tiny static file server (SPA fallback, traversal-safe) built on node:http only.

const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg',
  '.pdf': 'application/pdf', '.xml': 'application/xml', '.csv': 'text/csv; charset=utf-8',
};

function createStaticServer(rootDir) {
  const root = path.resolve(rootDir);
  return http.createServer((req, res) => {
    try {
      let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let file = path.resolve(root, '.' + rel);
      if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end('Forbidden'); return; }
      let st = fs.existsSync(file) ? fs.statSync(file) : null;
      if (st?.isDirectory()) { file = path.join(file, 'index.html'); st = fs.existsSync(file) ? fs.statSync(file) : null; }
      if (!st && !path.extname(rel)) { file = path.join(root, 'index.html'); st = fs.existsSync(file) ? fs.statSync(file) : null; }
      if (!st) { res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found'); return; }
      res.writeHead(200, {
        'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'content-length': st.size, 'cache-control': 'no-cache',
      });
      if (req.method === 'HEAD') { res.end(); return; }
      fs.createReadStream(file).pipe(res);
    } catch { res.writeHead(400).end('Bad request'); }
  });
}

// ───── lib/detect.mjs
// Inspect an extracted project and decide how to install + run it.

const exists = async (p) => fsp.access(p).then(() => true, () => false);
const readJson = async (p) => { try { return JSON.parse(await fsp.readFile(p, 'utf8')); } catch { return null; } };
const readText = async (p) => { try { return await fsp.readFile(p, 'utf8'); } catch { return ''; } };

const STATIC_DIRS = ['dist/browser', 'dist', 'build', 'out', 'public', 'docs', 'www', 'site'];

async function findStaticDir(dir) {
  if (await exists(path.join(dir, 'index.html'))) return dir;
  for (const d of STATIC_DIRS) if (await exists(path.join(dir, d, 'index.html'))) return path.join(dir, d);
  // dist/<name>/browser (Angular) and dist/<name> (Vite-style subfolders)
  for (const base of ['dist', 'build']) {
    const b = path.join(dir, base);
    if (!(await exists(b))) continue;
    for (const e of await fsp.readdir(b, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      for (const sub of [path.join(b, e.name, 'browser'), path.join(b, e.name)])
        if (await exists(path.join(sub, 'index.html'))) return sub;
    }
  }
  return null;
}

async function detectNode(dir, pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const scripts = pkg.scripts || {};
  const pm = (await exists(path.join(dir, 'bun.lock'))) || (await exists(path.join(dir, 'bun.lockb'))) ? 'bun'
    : (await exists(path.join(dir, 'pnpm-lock.yaml'))) ? 'pnpm'
    : (await exists(path.join(dir, 'yarn.lock'))) ? 'yarn' : 'npm';
  const framework = deps['@angular/core'] ? 'Angular' : deps.next ? 'Next.js' : deps.vite ? 'Vite'
    : deps.nuxt ? 'Nuxt' : deps.express ? 'Express' : deps.react ? 'React' : deps.vue ? 'Vue' : 'Node.js';
  const nvmrc = (await readText(path.join(dir, '.nvmrc'))).trim();
  const engine = pkg.engines?.node || nvmrc || null;

  const hasDeps = Object.keys(deps).length > 0;
  const steps = [];
  if (hasDeps) steps.push({ id: 'install', label: `Install dependencies (${pm})`, cmd: { pm, args: 'install' }, skipIf: 'node_modules' });

  const pick = ['dev', 'start', 'serve', 'preview'].find((s) => scripts[s]);
  let run;
  if (pick) {
    run = { kind: 'server', label: `${pm === 'npm' ? 'npm run' : pm + ' run'} ${pick}`, cmd: { pm, args: `run ${pick}` } };
  } else {
    let entry = null;
    for (const f of [pkg.main, 'server.js', 'index.js', 'app.js', 'main.js', 'server.mjs', 'index.mjs'])
      if (f && /^[\w./-]+$/.test(f) && (await exists(path.join(dir, f)))) { entry = f; break; }
    if (entry) run = { kind: 'server', label: `node ${entry}`, cmd: { raw: `node "${entry}"` } };
    else if (scripts.build) {
      steps.push({ id: 'build', label: `Build (${pm})`, cmd: { pm, args: 'run build' } });
      run = { kind: 'static', label: 'Serve build output', dir: null };
    } else if (await findStaticDir(dir)) run = { kind: 'static', label: 'Serve static files', dir: null };
    else run = null;
  }
  return { type: 'node', framework, packageManager: pm, engine, steps, run,
    notes: [hasDeps ? 'Dependencies are installed from the npm registry (postinstall scripts run).' : 'No dependencies to install.'] };
}

async function detectPython(dir) {
  const req = await readText(path.join(dir, 'requirements.txt'));
  const hasReq = req.trim().length > 0;
  const steps = [{ id: 'venv', label: 'Create virtualenv', cmd: { raw: '"{PY}" -m venv .venv' }, skipIf: '.venv' }];
  if (hasReq) steps.push({ id: 'install', label: 'pip install -r requirements.txt', cmd: { raw: '"{VPY}" -m pip install -r requirements.txt' }, skipIf: '.venv/.installed' });
  let framework = 'Python', run = null;
  if (await exists(path.join(dir, 'manage.py'))) {
    framework = 'Django';
    run = { kind: 'server', label: 'manage.py runserver', cmd: { raw: '"{VPY}" manage.py runserver {HOST}:{PORT}' } };
  } else {
    for (const f of ['app.py', 'main.py', 'server.py', 'run.py']) {
      if (!(await exists(path.join(dir, f)))) continue;
      const src = await readText(path.join(dir, f));
      const mod = f.replace(/\.py$/, '');
      if (/fastapi|FastAPI/i.test(req + src)) {
        framework = 'FastAPI';
        if (!/uvicorn/i.test(req)) steps.push({ id: 'uvicorn', label: 'pip install uvicorn', cmd: { raw: '"{VPY}" -m pip install uvicorn' }, skipIf: '.venv/.uvicorn' });
        run = { kind: 'server', label: `uvicorn ${mod}:app`, cmd: { raw: `"{VPY}" -m uvicorn ${mod}:app --host {HOST} --port {PORT}` } };
      } else {
        if (/flask/i.test(req + src)) framework = 'Flask';
        run = { kind: 'server', label: `python ${f}`, cmd: { raw: `"{VPY}" ${f}` } };
      }
      break;
    }
  }
  return { type: 'python', framework, steps, run, notes: ['Runs inside an isolated .venv.'] };
}

async function detectProject(dir) {
  const pkg = await readJson(path.join(dir, 'package.json'));
  if (pkg) return detectNode(dir, pkg);
  if ((await exists(path.join(dir, 'requirements.txt'))) || (await exists(path.join(dir, 'manage.py')))
    || (await exists(path.join(dir, 'app.py'))) || (await exists(path.join(dir, 'main.py')))) return detectPython(dir);
  if (await findStaticDir(dir)) {
    return { type: 'static', framework: 'Static site', steps: [], run: { kind: 'static', label: 'Serve static files', dir: null }, notes: [] };
  }
  const top = (await fsp.readdir(dir)).filter((f) => !f.startsWith('.'));
  const js = top.find((f) => /^[\w.-]+\.(m|c)?js$/.test(f));
  if (js) return { type: 'node', framework: 'Node.js script', steps: [], run: { kind: 'server', label: `node ${js}`, cmd: { raw: `node "${js}"` } }, notes: [] };
  const py = top.find((f) => /^[\w.-]+\.py$/.test(f));
  if (py) return { type: 'python', framework: 'Python script', steps: [], run: { kind: 'server', label: `python ${py}`, cmd: { raw: `"{PY}" "${py}"` } }, notes: [] };
  return { type: 'unknown', framework: 'Unknown', steps: [], run: null, notes: ['No package.json, requirements.txt, index.html or script found.'] };
}

// ───── lib/manager.mjs
// Project workspace: extract, plan, install, run, stop. Node built-ins only.

const WIN = process.platform === 'win32';
const MAX_LOG_LINES = 3000;
const URL_RE = /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1?\]):(\d{2,5})\/?/i;

const which = (cmd) => spawnSync(WIN ? 'where' : 'which', [cmd], { stdio: 'ignore' }).status === 0;

function systemInfo() {
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

/** URL a browser should use for a port. Codespaces and custom templates are supported. */
function publicUrlFor(port, env = process.env) {
  const tpl = env.LAUNCHER_PUBLIC_URL_TEMPLATE
    || (env.CODESPACE_NAME && env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
      ? `https://${env.CODESPACE_NAME}-{PORT}.${env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/` : '');
  return tpl ? tpl.replace('{PORT}', String(port)) : `http://localhost:${port}/`;
}

class Manager extends EventEmitter {
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
      if (m) this.#update(p, { port: +m[1], url: publicUrlFor(m[1]), status: 'running' });
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
        this.#log(p, `Serving ${path.relative(dir, root) || '.'} on ${publicUrlFor(port)}`, 'sys');
        this.#update(p, { status: 'running', port, url: publicUrlFor(port) });
        return this.view(p);
      }

      this.#update(p, { status: 'starting', port });
      const env = { PORT: String(port), HOST: this.host, HOSTNAME: this.host };
      const done = this.#exec(p, this.#resolve(plan.run.cmd, tokens), { env, track: true });
      // Fallback if the program never prints a URL
      const timer = setTimeout(() => {
        if (p.meta.status === 'starting') this.#update(p, { status: 'running', url: publicUrlFor(port) });
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

// ───── server.mjs
// NONONICK Launcher — drag & drop a ZIP (or a single file), it installs and runs it.
// Zero dependencies. Node >= 18.

const here = path.dirname(fileURLToPath(import.meta.url));
const isLoopback = (h) => ['127.0.0.1', 'localhost', '::1'].includes(h);

function createLauncher({
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
  const ui = () => Buffer.from(UI_HTML);

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
