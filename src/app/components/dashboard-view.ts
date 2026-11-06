import { ChangeDetectionStrategy, Component, output, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProjectStorage } from '../services/project-storage';
import { RuntimeManager } from '../services/runtime-manager';
import { NetworkCost } from '../services/network-cost';
import { PackagingExport } from '../services/packaging-export';
import { Project } from '../models/project.model';

@Component({
  selector: 'app-dashboard-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      <!-- Philosophy Header Banner -->
      <div class="p-4 rounded-xl bg-gradient-to-r from-[#0c1017] via-[#0f172a] to-[#0c1017] border border-[#1e293b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="text-[11px] font-mono tracking-wider text-cyan-400 uppercase font-semibold">Universal Software Transformation &amp; Runtime</div>
          <h1 class="text-xl font-bold text-white tracking-tight mt-0.5">NONONICK Execution Control Center</h1>
          <p class="text-xs text-slate-400 mt-1 max-w-2xl">
            Autonomous software transformation engine. Compile compatible components into WebAssembly, execute locally offline, and engage on-demand cloud runtimes only when strictly necessary.
          </p>
        </div>
        <!-- Pipeline Sequence Indicator -->
        <div class="flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono text-slate-400 py-1 px-2.5 rounded-lg bg-[#080b10] border border-[#1e293b] shrink-0">
          <span class="text-white font-semibold">IMPORT</span>
          <span>→</span>
          <span class="text-cyan-400 font-semibold">ANALYZE</span>
          <span>→</span>
          <span class="text-purple-400 font-semibold">COMPILE</span>
          <span>→</span>
          <span class="text-amber-400 font-semibold">EXECUTE</span>
          <span>→</span>
          <span class="text-emerald-400 font-semibold">EXPORT</span>
        </div>
      </div>

      <!-- 4 Key Telemetry Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-4 rounded-xl bg-[#0c1017] border border-[#1e293b] flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Workload Projects</span>
            <mat-icon class="text-slate-500 !w-4 !h-4 !text-[16px]">folder_copy</mat-icon>
          </div>
          <div class="mt-3">
            <div class="text-2xl font-bold font-mono text-white">{{ projectStorage.projects().length }}</div>
            <div class="text-[11px] text-slate-400 mt-0.5">Persisted in local browser storage</div>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-[#0c1017] border border-[#1e293b] flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Containment Level</span>
            <mat-icon class="text-cyan-400 !w-4 !h-4 !text-[16px]">shield</mat-icon>
          </div>
          <div class="mt-3">
            @if (projectStorage.activeProject(); as proj) {
              <div class="text-2xl font-bold font-mono text-cyan-300">
                Level {{ proj.analysis?.selfContainmentLevel || 1 }}
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5">
                {{ proj.analysis?.selfContainmentLevel === 1 ? '100% Fully Self-Contained' : 'Hybrid On-Demand Services' }}
              </div>
            } @else {
              <div class="text-2xl font-bold font-mono text-slate-400">Level 1</div>
              <div class="text-[11px] text-slate-400 mt-0.5">Autonomous local-first</div>
            }
          </div>
        </div>

        <div class="p-4 rounded-xl bg-[#0c1017] border border-[#1e293b] flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Active Runtime</span>
            <mat-icon class="text-purple-400 !w-4 !h-4 !text-[16px]">memory</mat-icon>
          </div>
          <div class="mt-3">
            <div class="text-2xl font-bold font-mono text-purple-300">
              {{ runtimeManager.state().status === 'running' ? runtimeManager.state().mode.replace('mode-', '').toUpperCase() : 'STANDBY' }}
            </div>
            <div class="text-[11px] text-slate-400 mt-0.5">
              {{ runtimeManager.state().status === 'running' ? 'Active ' + runtimeManager.state().elapsedSeconds + 's' : 'Scale-to-Zero Engaged' }}
            </div>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-[#0c1017] border border-[#1e293b] flex flex-col justify-between">
          <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Infrastructure Saved</span>
            <mat-icon class="text-emerald-400 !w-4 !h-4 !text-[16px]">savings</mat-icon>
          </div>
          <div class="mt-3">
            <div class="text-2xl font-bold font-mono text-emerald-400">
              <span>$</span>{{ networkCost.costAccounting().netSavingsUsd.toFixed(2) }}
            </div>
            <div class="text-[11px] text-slate-400 mt-0.5">vs traditional 24/7 cloud servers</div>
          </div>
        </div>
      </div>

      <!-- Active Workload Spotlight -->
      @if (projectStorage.activeProject(); as proj) {
        <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">Active Workload</span>
                <span class="text-slate-600">·</span>
                <span class="text-xs font-mono text-slate-400">{{ proj.id }}</span>
              </div>
              <h2 class="text-lg font-bold text-white mt-1">{{ proj.name }}</h2>
              <p class="text-xs text-slate-400 mt-0.5">{{ proj.description }}</p>
            </div>

            <!-- Action shortcuts -->
            <div class="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                (click)="onRunPreview(proj)"
                class="px-3.5 py-1.5 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <mat-icon class="!w-4 !h-4 !text-[16px]">play_arrow</mat-icon>
                <span>Run Preview</span>
              </button>

              <button
                type="button"
                (click)="onOpenTab('wasm')"
                class="px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/80 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <mat-icon class="!w-4 !h-4 !text-[16px]">memory</mat-icon>
                <span>Compile WASM</span>
              </button>

              <button
                type="button"
                (click)="onOpenTab('analyzer')"
                class="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#162032] hover:bg-[#1e293b] border border-[#334155] rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <mat-icon class="!w-4 !h-4 !text-[16px]">insights</mat-icon>
                <span>Analyze</span>
              </button>

              <button
                type="button"
                (click)="packagingExport.exportPortableZip(proj)"
                class="px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#162032] hover:bg-[#1e293b] border border-[#334155] rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <mat-icon class="!w-4 !h-4 !text-[16px]">archive</mat-icon>
                <span>Export ZIP</span>
              </button>
            </div>
          </div>

          <!-- Architecture & Language Strip -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <!-- Language Bar -->
            <div>
              <div class="text-xs font-mono text-slate-400 mb-2">Language Composition</div>
              <div class="h-2.5 w-full rounded-full bg-[#1e293b] overflow-hidden flex">
                @for (lang of proj.analysis?.detectedLanguages; track lang.name) {
                  <div
                    [style.width.%]="lang.percentage"
                    [style.background-color]="lang.color"
                    [title]="lang.name + ': ' + lang.percentage + '%'"
                  ></div>
                }
              </div>
              <div class="flex items-center gap-3 flex-wrap mt-2 text-[11px] font-mono text-slate-400">
                @for (lang of proj.analysis?.detectedLanguages?.slice(0, 4); track lang.name) {
                  <span class="flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full" [style.background-color]="lang.color"></span>
                    <span>{{ lang.name }} ({{ lang.percentage }}%)</span>
                  </span>
                }
              </div>
            </div>

            <!-- Containment & Dependencies -->
            <div>
              <div class="text-xs font-mono text-slate-400 mb-1.5">Self-Containment Rating</div>
              <div class="flex items-center gap-2">
                <span class="text-xl font-bold font-mono text-white">{{ proj.analysis?.selfContainmentScore || 100 }}</span>
                <span class="text-xs text-slate-500">/ 100 score</span>
              </div>
              <div class="text-[11px] text-slate-400 mt-1">
                {{ proj.analysis?.dependencies?.length || 0 }} external dependencies detected ·
                {{ proj.analysis?.externalNetworkCalls?.length || 0 }} remote HTTP calls
              </div>
            </div>

            <!-- Execution Target -->
            <div>
              <div class="text-xs font-mono text-slate-400 mb-1.5">Selected Runtime Adapter</div>
              <div class="text-xs font-mono text-cyan-300 font-semibold uppercase">
                {{ proj.runtimeMode === 'mode-a-web' ? 'Mode A: Native Browser Web' : proj.runtimeMode === 'mode-b-wasm' ? 'Mode B: WebAssembly Virtual Machine' : 'Mode C: On-Demand Ephemeral Server' }}
              </div>
              <div class="text-[11px] text-slate-400 mt-1">
                {{ proj.analysis?.serverRequirements?.requiresServer ? 'Serverless On-Demand with auto scale-to-zero' : 'Pure client-side offline execution supported' }}
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Three Execution Modes Showcase -->
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-white tracking-wide uppercase font-mono">Hybrid Execution Strategy</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Mode A Card -->
          <div class="p-4 rounded-xl bg-[#0c1017] border border-[#1e293b] flex flex-col justify-between space-y-3 hover:border-cyan-500/40 transition-colors">
            <div>
              <div class="flex items-center justify-between text-xs font-mono text-slate-400">
                <span class="font-bold text-cyan-400">MODE A</span>
                <span class="text-slate-500">Browser Native</span>
              </div>
              <h4 class="text-sm font-semibold text-white mt-1">Native Web Execution</h4>
              <p class="text-xs text-slate-400 mt-1">
                For HTML5, CSS3, ES6 JavaScript, and browser APIs. Runs immediately in a hardened sandboxed iframe with zero server reliance.
              </p>
            </div>
            <div class="pt-2 border-t border-[#1e293b] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span class="text-emerald-400">100% Offline Capable</span>
              <span class="text-slate-500">$0.00 / mo</span>
            </div>
          </div>

          <!-- Mode B Card -->
          <div class="p-4 rounded-xl bg-[#0c1017] border border-[#1e293b] flex flex-col justify-between space-y-3 hover:border-purple-500/40 transition-colors">
            <div>
              <div class="flex items-center justify-between text-xs font-mono text-slate-400">
                <span class="font-bold text-purple-400">MODE B</span>
                <span class="text-slate-500">WASM / WASI</span>
              </div>
              <h4 class="text-sm font-semibold text-white mt-1">WebAssembly Execution</h4>
              <p class="text-xs text-slate-400 mt-1">
                Executes compiled WebAssembly binary bytecode using the browser WASM engine and WASI POSIX preview1 system-call layer.
              </p>
            </div>
            <div class="pt-2 border-t border-[#1e293b] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span class="text-emerald-400">Hardware Speed</span>
              <span class="text-slate-500">$0.00 / mo</span>
            </div>
          </div>

          <!-- Mode C Card -->
          <div class="p-4 rounded-xl bg-[#0c1017] border border-[#1e293b] flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-colors">
            <div>
              <div class="flex items-center justify-between text-xs font-mono text-slate-400">
                <span class="font-bold text-amber-400">MODE C</span>
                <span class="text-slate-500">Scale-to-Zero</span>
              </div>
              <h4 class="text-sm font-semibold text-white mt-1">On-Demand Server Execution</h4>
              <p class="text-xs text-slate-400 mt-1">
                For backend Node/Python apps. Never runs continuously 24/7. Activates only when requested, releases memory after idle.
              </p>
            </div>
            <div class="pt-2 border-t border-[#1e293b] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span class="text-amber-400">Zero Idle Cost</span>
              <span class="text-slate-500">Pay-per-Request</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardView {
  readonly navChange = output<string>();

  readonly projectStorage = inject(ProjectStorage);
  readonly runtimeManager = inject(RuntimeManager);
  readonly networkCost = inject(NetworkCost);
  readonly packagingExport = inject(PackagingExport);

  onOpenTab(tab: string): void {
    this.navChange.emit(tab);
  }

  onRunPreview(proj: Project): void {
    if (proj.runtimeMode === 'mode-b-wasm') {
      this.runtimeManager.startModeB(proj);
    } else if (proj.runtimeMode === 'mode-c-server') {
      this.runtimeManager.startModeC(proj);
    } else {
      this.runtimeManager.startModeA(proj);
    }
    this.navChange.emit('preview');
  }
}
