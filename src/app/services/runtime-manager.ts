import { Injectable, signal, inject } from '@angular/core';
import { Project } from '../models/project.model';
import { ExecutionLog, RuntimeState } from '../models/runtime.model';
import { WasmCompiler } from './wasm-compiler';
import { NetworkCost } from './network-cost';

@Injectable({
  providedIn: 'root'
})
export class RuntimeManager {
  private readonly wasmCompiler = inject(WasmCompiler);
  private readonly networkCost = inject(NetworkCost);

  readonly state = signal<RuntimeState>({
    status: 'idle',
    mode: 'mode-a-web',
    elapsedSeconds: 0,
    idleSeconds: 0,
    autoShutdownLimitSeconds: 60,
    memoryUsageMb: 12.4,
    requestCount: 0,
    estimatedCostUsd: 0
  });

  readonly logs = signal<ExecutionLog[]>([]);
  readonly wasmInstance = signal<WebAssembly.Instance | null>(null);

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.addLog('system', 'NONONICK Universal Execution Engine initialized. Ready for sandboxed workloads.');

    // Listen to iframe sandbox messages
    if (typeof window !== 'undefined') {
      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'nononick-console') {
          const { level, args } = event.data;
          this.addLog(
            'browser',
            args.join(' '),
            level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info'
          );
        }
      });
    }
  }

  addLog(source: ExecutionLog['source'], message: string, level: ExecutionLog['level'] = 'info', details?: unknown): void {
    const entry: ExecutionLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
      source,
      level,
      message,
      details
    };
    this.logs.update(list => [entry, ...list.slice(0, 499)]);
  }

  clearLogs(): void {
    this.logs.set([]);
  }

  /**
   * Prepares the complete sandboxed HTML srcdoc for Mode A
   */
  buildModeAPreviewHtml(project: Project): string {
    const htmlFile = project.files.find(f => f.name.endsWith('.html')) || {
      content: '<!DOCTYPE html><html><body><h1>Project loaded</h1></body></html>'
    };

    let doc = htmlFile.content;

    // Inject console interceptor script
    const consoleInterceptor = `
<script>
  (function() {
    const send = (level, args) => {
      try {
        window.parent.postMessage({
          type: 'nononick-console',
          level: level,
          args: Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a))
        }, '*');
      } catch(e) {}
    };
    const origLog = console.log;
    const origWarn = console.warn;
    const origErr = console.error;
    console.log = function(...args) { send('info', args); origLog.apply(console, args); };
    console.warn = function(...args) { send('warn', args); origWarn.apply(console, args); };
    console.error = function(...args) { send('error', args); origErr.apply(console, args); };
    window.onerror = function(msg, url, line) {
      send('error', ['Uncaught Error: ' + msg + ' (' + url + ':' + line + ')']);
    };
  })();
</script>
`;

    // Inline CSS
    const cssFiles = project.files.filter(f => f.name.endsWith('.css'));
    let inlinedCss = '';
    for (const c of cssFiles) {
      inlinedCss += `\n/* ${c.path} */\n${c.content}\n`;
    }

    // Inline JavaScript
    const jsFiles = project.files.filter(f => f.name.endsWith('.js') && !f.path.includes('server.js'));
    let inlinedJs = '';
    for (const j of jsFiles) {
      inlinedJs += `\n// ${j.path}\n${j.content}\n`;
    }

    // Combine into doc
    if (inlinedCss) {
      const tag = `<style>${inlinedCss}</style>`;
      doc = doc.includes('</head>') ? doc.replace('</head>', `${tag}\n</head>`) : tag + doc;
    }

    const scriptBlock = `${consoleInterceptor}\n<script>${inlinedJs}</script>`;
    doc = doc.includes('</body>') ? doc.replace('</body>', `${scriptBlock}\n</body>`) : doc + scriptBlock;

    return doc;
  }

  /**
   * Starts Mode A: Native Web Execution
   */
  startModeA(project: Project): void {
    this.stopActiveRuntimes();
    this.state.update(s => ({
      ...s,
      status: 'running',
      mode: 'mode-a-web',
      startedAt: Date.now(),
      elapsedSeconds: 0,
      idleSeconds: 0,
      requestCount: s.requestCount + 1,
      memoryUsageMb: +(14 + Math.random() * 3).toFixed(1)
    }));

    this.addLog('browser', `Mode A (Native Web) initiated for "${project.name}". Running within sandboxed iframe.`);
    this.networkCost.recordLocalExecution();
    this.startLocalTimer();
  }

  /**
   * Starts Mode B: WebAssembly Execution
   */
  async startModeB(project: Project): Promise<void> {
    this.stopActiveRuntimes();
    this.addLog('compiler', `Mode B (WebAssembly) activating. Inspecting WASM bytecode for "${project.name}"...`);

    let bytecode = project.wasmBytecode;
    if (!bytecode || bytecode.length === 0) {
      const watFile = project.files.find(f => f.path.endsWith('.wat'));
      if (watFile) {
        const compiled = this.wasmCompiler.compileWat(watFile.content);
        bytecode = compiled.bytes;
        project.wasmBytecode = bytecode;
        this.addLog('compiler', compiled.log);
      } else {
        // synthesize base math module
        const compiled = this.wasmCompiler.compileWat('(module)');
        bytecode = compiled.bytes;
      }
    }

    try {
      const { instance } = await this.wasmCompiler.instantiateModule(
        bytecode,
        (stdout) => this.addLog('wasm', stdout, 'wasm')
      );

      this.wasmInstance.set(instance);
      this.state.update(s => ({
        ...s,
        status: 'running',
        mode: 'mode-b-wasm',
        startedAt: Date.now(),
        elapsedSeconds: 0,
        idleSeconds: 0,
        requestCount: s.requestCount + 1,
        memoryUsageMb: 16.0
      }));

      this.addLog('wasm', `WebAssembly module instantiated successfully. Exported functions: ${Object.keys(instance.exports).join(', ')}`);
      this.networkCost.recordWasmExecution();
      this.startLocalTimer();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.addLog('compiler', `WASM instantiation error: ${msg}`, 'error');
      this.state.update(s => ({ ...s, status: 'error' }));
    }
  }

  /**
   * Executes a function inside the active WASM instance
   */
  runWasmFunction(fnName: string, ...args: number[]): number | null {
    const inst = this.wasmInstance();
    if (!inst) {
      this.addLog('wasm', 'Cannot execute: WASM instance not loaded.', 'error');
      return null;
    }

    const exportsMap = inst.exports as Record<string, unknown>;
    const fn = exportsMap[fnName];
    if (typeof fn !== 'function') {
      this.addLog('wasm', `Function "${fnName}" is not exported by this WASM module.`, 'error');
      return null;
    }

    const t0 = performance.now();
    try {
      const result = (fn as (...a: number[]) => number)(...args);
      const dt = +(performance.now() - t0).toFixed(4);
      this.addLog('wasm', `Exported call: ${fnName}(${args.join(', ')}) => ${result} [Execution latency: ${dt}ms]`);
      this.state.update(s => ({ ...s, requestCount: s.requestCount + 1, idleSeconds: 0 }));
      this.networkCost.recordWasmExecution();
      return result;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.addLog('wasm', `Error running ${fnName}: ${msg}`, 'error');
      return null;
    }
  }

  /**
   * Starts Mode C: On-Demand Server Execution
   */
  async startModeC(project: Project): Promise<void> {
    this.stopActiveRuntimes();
    this.addLog('server', `Mode C (On-Demand Server) requested for "${project.name}". Checking ephemeral backend availability...`);

    try {
      const resp = await fetch('/api/runtime/ondemand-server/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.name,
          maxDurationSeconds: 120
        })
      });

      const data = await resp.json();
      if (data.success) {
        const session = data.session;
        this.state.update(s => ({
          ...s,
          status: 'running',
          mode: 'mode-c-server',
          activeSessionId: session.id,
          startedAt: session.startedAt,
          elapsedSeconds: 0,
          idleSeconds: 0,
          autoShutdownLimitSeconds: 120,
          memoryUsageMb: 38.5,
          requestCount: 1,
          activeEndpointUrl: `/api/runtime/ondemand-server/execute`
        }));

        this.addLog('server', `Ephemeral container started [ID: ${session.id}]. Scale-to-Zero policy active (auto-stop in 120s idle).`);

        // Start heartbeat poll
        this.startServerHeartbeat(session.id);
        this.startLocalTimer();
      } else {
        throw new Error(data.error || 'Server rejected start request');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.addLog('server', `On-demand server connection error: ${msg}. Ensure backend is reachable.`, 'error');
      this.state.update(s => ({ ...s, status: 'error' }));
    }
  }

  /**
   * Sends an execution request to the on-demand container
   */
  async executeOnDemandServer(code: string, language = 'javascript'): Promise<void> {
    const sessionId = this.state().activeSessionId;
    if (!sessionId) {
      this.addLog('server', 'No active on-demand server session found. Start Mode C first.', 'warn');
      return;
    }

    this.addLog('server', `Dispatching on-demand ${language} execution request to container [${sessionId}]...`);

    try {
      const resp = await fetch('/api/runtime/ondemand-server/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          code,
          language,
          input: { timestamp: Date.now() }
        })
      });

      const data = await resp.json();
      if (data.success) {
        this.addLog('server', `Container execution completed in ${data.durationMs}ms: \n${data.output}`);
        this.state.update(s => ({
          ...s,
          idleSeconds: 0,
          requestCount: s.requestCount + 1,
          estimatedCostUsd: +(s.estimatedCostUsd + (data.estimatedCostUsd || 0.000002)).toFixed(7)
        }));
        this.networkCost.recordServerUsage(data.durationMs / 1000, 1);
      } else {
        this.addLog('server', `Container execution error: ${data.error}`, 'error');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.addLog('server', `Execution failed: ${msg}`, 'error');
    }
  }

  /**
   * Terminates active on-demand or local runtime and releases all resources
   */
  async stopActiveRuntimes(): Promise<void> {
    const current = this.state();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (current.activeSessionId) {
      try {
        await fetch('/api/runtime/ondemand-server/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: current.activeSessionId })
        });
        this.addLog('server', `On-demand session ${current.activeSessionId} terminated. Server resources released (Scale-to-Zero).`);
      } catch {
        // silent
      }
    }

    this.wasmInstance.set(null);
    this.state.update(s => ({
      ...s,
      status: 'idle',
      activeSessionId: undefined,
      elapsedSeconds: 0,
      idleSeconds: 0,
      memoryUsageMb: 0
    }));

    this.addLog('system', 'All active execution services stopped. Zero resource consumption mode engaged.');
  }

  private startLocalTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.state.update(s => {
        if (s.status !== 'running') return s;
        const newElapsed = s.elapsedSeconds + 1;
        const newIdle = s.idleSeconds + 1;

        // Auto shutdown check for on-demand server
        if (s.mode === 'mode-c-server' && newIdle >= s.autoShutdownLimitSeconds) {
          setTimeout(() => {
            this.addLog('server', `Container reached ${s.autoShutdownLimitSeconds}s idle threshold. Auto-terminating to prevent idle costs (Scale-to-Zero).`, 'warn');
            this.stopActiveRuntimes();
          }, 0);
        }

        return {
          ...s,
          elapsedSeconds: newElapsed,
          idleSeconds: newIdle
        };
      });
    }, 1000);
  }

  private startServerHeartbeat(sessionId: string): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(async () => {
      try {
        const resp = await fetch('/api/runtime/ondemand-server/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
        const res = await resp.json();
        if (!res.success) {
          this.stopActiveRuntimes();
        }
      } catch {
        // stop if server disconnected
        this.stopActiveRuntimes();
      }
    }, 15000);
  }
}
