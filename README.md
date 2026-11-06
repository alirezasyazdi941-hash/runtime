# NONONICK Universal Runtime

Two parts in one repo:

1. **Launcher** (`launcher/`) — drag & drop a `.zip` into the browser; it is extracted, analysed, its dependencies are installed and it is started. Zero dependencies, only Node ≥ 18.
2. **Angular analysis workbench** (`src/`) — the original Angular 21 app (WASM compiler hub, analyzer, cost monitor…). It already has its own in‑browser ZIP import (Import Center); it analyses code but does not execute it.

## Self-contained: one file, no install

```bash
npm run bundle        # → dist/nononick-launcher.mjs  (UI embedded, zero dependencies)
node nononick-launcher.mjs
```
Copy that single file anywhere with Node ≥ 18 and it works. CI publishes it as the `nononick-launcher` artifact on every push.

## Phone only? Use GitHub Codespaces
Repo → **Code ▸ Codespaces ▸ Create codespace**. `.devcontainer/` installs Node + Python and starts the launcher; the browser opens on port 4000. Dropped projects get forwarded URLs automatically (`https://<codespace>-<port>.app.github.dev/`). Custom proxies: set `LAUNCHER_PUBLIC_URL_TEMPLATE=https://host-{PORT}.example.com/` and `LAUNCHER_ALLOWED_HOSTS`.

## Quick start

| OS | Command |
|---|---|
| macOS / Linux | `./run.sh` |
| Windows | double‑click `run.bat` |
| Any (Node already installed) | `npm start` (or `npx nononick-launcher`) |
| Angular workbench instead | `npm run app:start` |

`run.sh` / `run.bat` first check for Node.js ≥ 20 and **install it if missing** (Homebrew or [fnm](https://github.com/Schniz/fnm) on macOS/Linux; winget/choco on Windows), then start the launcher at <http://localhost:4000>.

## What it can run

| Detected by | Install | Run |
|---|---|---|
| `package.json` | `npm install` (uses `bun`/`pnpm`/`yarn` if their lockfile exists *and* the tool is installed, otherwise npm) | first of `dev`, `start`, `serve`, `preview`; else `main`/`server.js`/`index.js`; else `build` + serve the output |
| `index.html` (root, `dist/`, `build/`, `docs/`, `public/`…) | – | built‑in static server (SPA fallback) |
| `requirements.txt` / `manage.py` / `app.py` / `main.py` | isolated `.venv` + `pip install` | Django `runserver`, FastAPI via `uvicorn`, or `python app.py` |
| single `.js` / `.py` / `.html` file | – | `node` / `python` / static |

A free port in 4100‑4999 is passed as `PORT`/`HOST`; the launcher also reads the real URL from the program's output (Vite, Angular, Next… print their own port). Logs stream live; projects survive restarts (`.nononick-workspace/`).

## Security — read this

The launcher **executes code from the archives you drop** (including npm `postinstall` scripts). Only drop things you trust.

* Listens on `127.0.0.1` only; requests with a foreign `Host`/`Origin` are rejected (DNS‑rebinding/CSRF guard).
* Binding to another address is refused unless `LAUNCHER_TOKEN` is set; open the UI once with `/?token=…`.
* ZIP extraction blocks path traversal (zip‑slip), symlinks, encrypted/ZIP64 archives, and caps entries/size (`LAUNCHER_MAX_MB`, default 1024).
* Install/build steps are killed after `LAUNCHER_STEP_TIMEOUT_MIN` (default 20).

Environment: `LAUNCHER_HOST`, `LAUNCHER_PORT`, `LAUNCHER_WORKSPACE`, `LAUNCHER_TOKEN`, `LAUNCHER_MAX_MB`, `LAUNCHER_STEP_TIMEOUT_MIN`.

### Docker
```bash
docker build -t nononick-launcher .
docker run --rm -p 127.0.0.1:4000:4000 -p 127.0.0.1:4100-4199:4100-4199 \
  -e LAUNCHER_TOKEN=change-me -v nononick-data:/data nononick-launcher
# open http://localhost:4000/?token=change-me
```

## Angular app
```bash
npm install
cp .env.example .env.local   # set GEMINI_API_KEY if you use the AI parts
npm run dev                  # http://localhost:3000
npm run build                # SSR build into dist/app
npm run serve:ssr:app
```
The build uses `outputMode: "server"` (SSR), so it needs a Node host — it cannot be published as‑is on GitHub Pages.

## Tests / CI
`npm run test:launcher` (ZIP safety, detection, end‑to‑end upload → run → stop). `.github/workflows/ci.yml` runs them on Linux/Windows/macOS × Node 20/22 and builds the Angular app.

---

## فارسی (خلاصه)
* `./run.sh` (مک/لینوکس) یا `run.bat` (ویندوز) را اجرا کنید؛ اگر Node.js نصب نباشد خودش نصب می‌کند و صفحه‌ی <http://localhost:4000> باز می‌شود.
* فایل `.zip` را داخل مرورگر بکشید و رها کنید: پروژه استخراج، نوع آن (Node / پایتون / سایت استاتیک) تشخیص، وابستگی‌ها نصب و برنامه اجرا می‌شود؛ آدرس و لاگ زنده نمایش داده می‌شود.
* ⚠️ کد داخل زیپ اجرا می‌شود؛ فقط فایل‌های مطمئن را رها کنید.
