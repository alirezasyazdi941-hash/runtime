// Inspect an extracted project and decide how to install + run it.
import fsp from 'node:fs/promises';
import path from 'node:path';

const exists = async (p) => fsp.access(p).then(() => true, () => false);
const readJson = async (p) => { try { return JSON.parse(await fsp.readFile(p, 'utf8')); } catch { return null; } };
const readText = async (p) => { try { return await fsp.readFile(p, 'utf8'); } catch { return ''; } };

const STATIC_DIRS = ['dist/browser', 'dist', 'build', 'out', 'public', 'docs', 'www', 'site'];

export async function findStaticDir(dir) {
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

export async function detectProject(dir) {
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
