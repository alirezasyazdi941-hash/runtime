import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NetworkCost } from '../services/network-cost';
import { ProjectStorage } from '../services/project-storage';
import { RuntimeManager } from '../services/runtime-manager';

@Component({
  selector: 'app-settings-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      <div class="border-b border-[#1e293b] pb-4">
        <h1 class="text-xl font-bold text-white tracking-tight">Platform Governance &amp; Configuration</h1>
        <p class="text-xs text-slate-400 mt-0.5">
          Configure offline isolation policies, scale-to-zero timeouts, security sandboxing, and runtime plugin adapters.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 1. Offline Mode & Network Isolation -->
        <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-4">
          <div class="flex items-center gap-2">
            <mat-icon class="text-cyan-400 !w-5 !h-5 !text-[20px]">airplanemode_active</mat-icon>
            <h3 class="text-xs font-bold font-mono tracking-wider uppercase text-white">Offline Mode Simulation</h3>
          </div>

          <p class="text-xs text-slate-400 leading-relaxed">
            Test and verify that Level 1 self-contained applications and pre-compiled WebAssembly modules execute completely offline without cloud dependencies.
          </p>

          <div class="p-3.5 rounded-lg bg-[#080b10] border border-[#1e293b] flex items-center justify-between">
            <div>
              <div class="text-xs font-mono font-bold text-white">Simulate Offline Environment</div>
              <div class="text-[11px] text-slate-500">Forces runtime to reject remote network traffic</div>
            </div>
            <button
              type="button"
              (click)="toggleOfflineSim()"
              class="px-3.5 py-1.5 text-xs font-mono font-semibold rounded-lg transition-colors"
              [class.bg-amber-400]="networkCost.forceOfflineSimulation()"
              [class.text-black]="networkCost.forceOfflineSimulation()"
              [class.bg-[#1e293b]]="!networkCost.forceOfflineSimulation()"
              [class.text-slate-300]="!networkCost.forceOfflineSimulation()"
            >
              {{ networkCost.forceOfflineSimulation() ? 'SIMULATION ACTIVE' : 'DISABLED' }}
            </button>
          </div>
        </div>

        <!-- 2. Scale-to-Zero Auto-Shutdown Policies -->
        <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-4">
          <div class="flex items-center gap-2">
            <mat-icon class="text-amber-400 !w-5 !h-5 !text-[20px]">timer</mat-icon>
            <h3 class="text-xs font-bold font-mono tracking-wider uppercase text-white">Scale-to-Zero Inactivity Timeout</h3>
          </div>

          <p class="text-xs text-slate-400 leading-relaxed">
            When an On-Demand server (Mode C) receives no traffic, it automatically terminates and releases memory to guarantee zero idle infrastructure costs.
          </p>

          <div class="space-y-2">
            <label for="idle-threshold" class="block text-xs font-mono text-slate-400">Idle Shutdown Threshold</label>
            <select
              id="idle-threshold"
              [value]="selectedTimeout()"
              (change)="onTimeoutChange($event)"
              class="w-full bg-[#080b10] border border-[#1e293b] text-white text-xs px-3 py-2 rounded-lg font-mono outline-none focus:border-cyan-400"
            >
              <option value="30">30 Seconds (Aggressive Zero-Cost)</option>
              <option value="60">60 Seconds (Recommended Standard)</option>
              <option value="120">120 Seconds (Moderate Ephemeral)</option>
              <option value="300">300 Seconds (Extended Debugging)</option>
            </select>
          </div>
        </div>

        <!-- 3. Security & Sandboxing Policies -->
        <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-4">
          <div class="flex items-center gap-2">
            <mat-icon class="text-emerald-400 !w-5 !h-5 !text-[20px]">security</mat-icon>
            <h3 class="text-xs font-bold font-mono tracking-wider uppercase text-white">Security &amp; Isolation Rules</h3>
          </div>

          <div class="space-y-2 text-xs font-mono">
            <div class="p-2.5 rounded bg-[#080b10] border border-[#1e293b] flex items-center justify-between">
              <span class="text-slate-300">Iframe Sandbox Attributes</span>
              <span class="text-cyan-400 font-bold">allow-scripts allow-modals</span>
            </div>
            <div class="p-2.5 rounded bg-[#080b10] border border-[#1e293b] flex items-center justify-between">
              <span class="text-slate-300">Path Traversal Guard</span>
              <span class="text-emerald-400 font-bold">Enforced (ZIP Extraction)</span>
            </div>
            <div class="p-2.5 rounded bg-[#080b10] border border-[#1e293b] flex items-center justify-between">
              <span class="text-slate-300">Operating System Privileges</span>
              <span class="text-emerald-400 font-bold">Zero Root / Isolated Origin</span>
            </div>
          </div>
        </div>

        <!-- 4. Plugin-Based Runtime Architecture Adapters -->
        <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-4">
          <div class="flex items-center gap-2">
            <mat-icon class="text-purple-400 !w-5 !h-5 !text-[20px]">extension</mat-icon>
            <h3 class="text-xs font-bold font-mono tracking-wider uppercase text-white">Installed Runtime Adapters</h3>
          </div>

          <div class="space-y-1.5 text-xs font-mono">
            <div class="p-2 rounded bg-[#080b10] border border-[#1e293b] flex items-center justify-between">
              <span class="text-slate-300">WAT / WASM Synthesizer</span>
              <span class="text-purple-400 font-bold">v1.0 (Built-In)</span>
            </div>
            <div class="p-2 rounded bg-[#080b10] border border-[#1e293b] flex items-center justify-between">
              <span class="text-slate-300">WASI POSIX preview1 Layer</span>
              <span class="text-purple-400 font-bold">Active (In-Browser)</span>
            </div>
            <div class="p-2 rounded bg-[#080b10] border border-[#1e293b] flex items-center justify-between">
              <span class="text-slate-300">Node.js Scale-to-Zero Proxy</span>
              <span class="text-amber-400 font-bold">Active (Express /api)</span>
            </div>
            <div class="p-2 rounded bg-[#080b10] border border-[#1e293b] flex items-center justify-between">
              <span class="text-slate-300">HTML5 Canvas / ES6 JIT</span>
              <span class="text-cyan-400 font-bold">Native Engine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsView {
  readonly networkCost = inject(NetworkCost);
  readonly runtimeManager = inject(RuntimeManager);
  readonly projectStorage = inject(ProjectStorage);

  readonly selectedTimeout = signal<number>(60);

  toggleOfflineSim(): void {
    const curr = this.networkCost.forceOfflineSimulation();
    this.networkCost.toggleForceOffline(!curr);
  }

  onTimeoutChange(event: Event): void {
    const val = parseInt((event.target as HTMLSelectElement).value, 10);
    this.selectedTimeout.set(val);
    this.runtimeManager.state.update(s => ({ ...s, autoShutdownLimitSeconds: val }));
  }
}
