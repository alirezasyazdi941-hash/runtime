import { ChangeDetectionStrategy, Component, signal, output, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RuntimeManager } from '../services/runtime-manager';
import { ProjectStorage } from '../services/project-storage';
import { NetworkCost } from '../services/network-cost';

@Component({
  selector: 'app-runtime-manager-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">Hybrid Execution Controller</span>
            <span class="text-slate-600">·</span>
            <span class="text-xs font-mono text-slate-400">Ephemeral Lifecycle Management</span>
          </div>
          <h1 class="text-xl font-bold text-white tracking-tight mt-0.5">Runtime Architecture &amp; Scale-to-Zero Deck</h1>
        </div>

        <div class="flex items-center gap-2">
          @if (runtimeManager.state().status === 'running') {
            <button
              type="button"
              (click)="runtimeManager.stopActiveRuntimes()"
              class="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <mat-icon class="!w-4 !h-4 !text-[16px]">power_settings_new</mat-icon>
              <span>Stop Runtime (Scale-to-Zero)</span>
            </button>
          } @else {
            <span class="text-xs font-mono text-slate-400 px-3 py-1.5 rounded bg-[#0c1017] border border-[#1e293b] flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-slate-500"></span>
              <span>All Runtimes Idle (Zero Waste)</span>
            </span>
          }
        </div>
      </div>

      <!-- Real-Time Telemetry Bar -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-4 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-1">
          <div class="text-[10px] font-mono text-slate-500 uppercase">Process Status</div>
          <div class="text-xl font-bold font-mono" [class.text-emerald-400]="runtimeManager.state().status === 'running'" [class.text-slate-400]="runtimeManager.state().status !== 'running'">
            {{ runtimeManager.state().status.toUpperCase() }}
          </div>
          <div class="text-[11px] text-slate-400">
            {{ runtimeManager.state().status === 'running' ? 'Active workload attached' : 'No background processes' }}
          </div>
        </div>

        <div class="p-4 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-1">
          <div class="text-[10px] font-mono text-slate-500 uppercase">Active Mode</div>
          <div class="text-xl font-bold font-mono text-cyan-300">
            {{ runtimeManager.state().mode.replace('mode-', '').toUpperCase() }}
          </div>
          <div class="text-[11px] text-slate-400">
            {{ runtimeManager.state().mode === 'mode-a-web' ? 'Native Web Sandbox' : runtimeManager.state().mode === 'mode-b-wasm' ? 'WASM Hardware JIT' : 'On-Demand Server' }}
          </div>
        </div>

        <div class="p-4 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-1">
          <div class="text-[10px] font-mono text-slate-500 uppercase">Execution Duration</div>
          <div class="text-xl font-bold font-mono text-white">
            {{ runtimeManager.state().elapsedSeconds }}s
          </div>
          <div class="text-[11px] text-slate-400">
            Idle: {{ runtimeManager.state().idleSeconds }}s / {{ runtimeManager.state().autoShutdownLimitSeconds }}s max
          </div>
        </div>

        <div class="p-4 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-1">
          <div class="text-[10px] font-mono text-slate-500 uppercase">Resource Consumption</div>
          <div class="text-xl font-bold font-mono text-purple-300">
            {{ runtimeManager.state().memoryUsageMb }} MB
          </div>
          <div class="text-[11px] text-slate-400">
            Requests handled: {{ runtimeManager.state().requestCount }}
          </div>
        </div>
      </div>

      <!-- Three Execution Modes Interactive Switcher -->
      <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-4">
        <h3 class="text-xs font-bold font-mono tracking-wider uppercase text-white">Active Execution Strategy</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Mode A Button -->
          <div
            class="p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3"
            [class.border-cyan-400]="runtimeManager.state().mode === 'mode-a-web' && runtimeManager.state().status === 'running'"
            [class.bg-cyan-950/20]="runtimeManager.state().mode === 'mode-a-web' && runtimeManager.state().status === 'running'"
            [class.border-[#1e293b]]="runtimeManager.state().mode !== 'mode-a-web' || runtimeManager.state().status !== 'running'"
            [class.bg-[#080b10]]="runtimeManager.state().mode !== 'mode-a-web' || runtimeManager.state().status !== 'running'"
          >
            <div>
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="font-bold text-cyan-400">MODE A</span>
                <span class="text-slate-500">Local Browser</span>
              </div>
              <h4 class="text-sm font-bold text-white mt-1">Native Web Execution</h4>
              <p class="text-xs text-slate-400 mt-1">Direct HTML5, CSS3, ES6 JavaScript, Web Workers, IndexedDB. Zero server overhead.</p>
            </div>
            <button
              type="button"
              (click)="selectModeA()"
              class="w-full py-1.5 text-xs font-semibold rounded bg-[#111722] hover:bg-[#1e293b] text-cyan-300 border border-[#334155] transition-colors"
            >
              Engage Mode A
            </button>
          </div>

          <!-- Mode B Button -->
          <div
            class="p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3"
            [class.border-purple-400]="runtimeManager.state().mode === 'mode-b-wasm' && runtimeManager.state().status === 'running'"
            [class.bg-purple-950/20]="runtimeManager.state().mode === 'mode-b-wasm' && runtimeManager.state().status === 'running'"
            [class.border-[#1e293b]]="runtimeManager.state().mode !== 'mode-b-wasm' || runtimeManager.state().status !== 'running'"
            [class.bg-[#080b10]]="runtimeManager.state().mode !== 'mode-b-wasm' || runtimeManager.state().status !== 'running'"
          >
            <div>
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="font-bold text-purple-400">MODE B</span>
                <span class="text-slate-500">WASM / WASI</span>
              </div>
              <h4 class="text-sm font-bold text-white mt-1">WebAssembly Execution</h4>
              <p class="text-xs text-slate-400 mt-1">Executes compiled C, Rust, Go, or WAT binaries using client-side WASI POSIX preview1 emulation.</p>
            </div>
            <button
              type="button"
              (click)="selectModeB()"
              class="w-full py-1.5 text-xs font-semibold rounded bg-[#111722] hover:bg-[#1e293b] text-purple-300 border border-[#334155] transition-colors"
            >
              Engage Mode B
            </button>
          </div>

          <!-- Mode C Button -->
          <div
            class="p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3"
            [class.border-amber-400]="runtimeManager.state().mode === 'mode-c-server' && runtimeManager.state().status === 'running'"
            [class.bg-amber-950/20]="runtimeManager.state().mode === 'mode-c-server' && runtimeManager.state().status === 'running'"
            [class.border-[#1e293b]]="runtimeManager.state().mode !== 'mode-c-server' || runtimeManager.state().status !== 'running'"
            [class.bg-[#080b10]]="runtimeManager.state().mode !== 'mode-c-server' || runtimeManager.state().status !== 'running'"
          >
            <div>
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="font-bold text-amber-400">MODE C</span>
                <span class="text-slate-500">On-Demand Cloud</span>
              </div>
              <h4 class="text-sm font-bold text-white mt-1">On-Demand Server Execution</h4>
              <p class="text-xs text-slate-400 mt-1">Spawns an ephemeral micro-container only when required. Automatically shuts down after idle timeout.</p>
            </div>
            <button
              type="button"
              (click)="selectModeC()"
              class="w-full py-1.5 text-xs font-semibold rounded bg-[#111722] hover:bg-[#1e293b] text-amber-300 border border-[#334155] transition-colors"
            >
              Engage Mode C
            </button>
          </div>
        </div>
      </div>

      <!-- On-Demand Server Live Control Box (Mode C) -->
      @if (runtimeManager.state().mode === 'mode-c-server') {
        <div class="p-5 rounded-xl bg-[#0c1017] border border-amber-900/60 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold font-mono tracking-wider uppercase text-amber-300 flex items-center gap-2">
              <mat-icon class="!w-4 !h-4 !text-[16px]">cloud_sync</mat-icon>
              <span>Mode C // On-Demand Ephemeral Backend Tester</span>
            </span>
            <span class="text-xs font-mono text-slate-400">
              Container ID: {{ runtimeManager.state().activeSessionId || 'Provisioning...' }}
            </span>
          </div>

          <p class="text-xs text-slate-400">
            This module dispatches execution tasks to our real server-side scale-to-zero container (<code>/api/runtime/ondemand-server/execute</code>). If no requests are made for 120s, the server automatically stops and releases memory.
          </p>

          <div class="space-y-2">
            <span class="text-[11px] font-mono text-slate-400">Server Execution Code Snippet</span>
            <textarea
              [value]="serverCodeSnippet()"
              (input)="serverCodeSnippet.set($any($event.target).value)"
              rows="4"
              class="w-full bg-[#080b10] border border-[#1e293b] rounded-lg p-3 font-mono text-xs text-amber-200 outline-none leading-relaxed resize-none"
            ></textarea>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="runServerTask()"
              class="px-4 py-2 text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <mat-icon class="!w-4 !h-4 !text-[16px]">send</mat-icon>
              <span>Dispatch Server Workload</span>
            </button>

            <button
              type="button"
              (click)="runtimeManager.stopActiveRuntimes()"
              class="px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#162032] hover:bg-[#1e293b] border border-[#334155] rounded-lg transition-colors"
            >
              Release Container Immediately
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class RuntimeManagerView {
  readonly navChange = output<string>();

  readonly runtimeManager = inject(RuntimeManager);
  readonly projectStorage = inject(ProjectStorage);
  readonly networkCost = inject(NetworkCost);

  readonly serverCodeSnippet = signal<string>(`// On-demand server computation
const sensorReadings = [28.4, 29.1, 31.0, 27.8, 30.2];
const average = sensorReadings.reduce((a, b) => a + b, 0) / sensorReadings.length;
console.log("[SERVER PROCESSOR] Processed sensor metrics. Mean average:", average);
return { status: "PROCESSED", average, executionTime: new Date().toISOString() };`);

  selectModeA(): void {
    const proj = this.projectStorage.activeProject();
    if (proj) this.runtimeManager.startModeA(proj);
  }

  selectModeB(): void {
    const proj = this.projectStorage.activeProject();
    if (proj) this.runtimeManager.startModeB(proj);
  }

  selectModeC(): void {
    const proj = this.projectStorage.activeProject();
    if (proj) this.runtimeManager.startModeC(proj);
  }

  async runServerTask(): Promise<void> {
    await this.runtimeManager.executeOnDemandServer(this.serverCodeSnippet(), 'javascript');
  }
}
