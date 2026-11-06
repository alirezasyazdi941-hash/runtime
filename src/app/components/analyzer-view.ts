import { ChangeDetectionStrategy, Component, output, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProjectStorage } from '../services/project-storage';
import { PackagingExport } from '../services/packaging-export';
import { Project } from '../models/project.model';

@Component({
  selector: 'app-analyzer-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      @if (projectStorage.activeProject(); as proj) {
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">Deep Architectural Analysis</span>
              <span class="text-slate-600">·</span>
              <span class="text-xs font-mono text-slate-400">{{ proj.name }}</span>
            </div>
            <h1 class="text-xl font-bold text-white tracking-tight mt-0.5">Static Inspection &amp; Containment Verdict</h1>
          </div>

          <button
            type="button"
            (click)="exportReport(proj)"
            class="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-[#162032] hover:bg-[#1e293b] border border-[#334155] rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <mat-icon class="!w-4 !h-4 !text-[16px]">description</mat-icon>
            <span>Download Report (MD)</span>
          </button>
        </div>

        @if (proj.analysis; as analysis) {
          <!-- Verdict Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Containment Level Banner -->
            <div
              class="p-5 rounded-xl border flex flex-col justify-between"
              [class.bg-emerald-950/20]="analysis.selfContainmentLevel === 1"
              [class.border-emerald-800/80]="analysis.selfContainmentLevel === 1"
              [class.bg-amber-950/20]="analysis.selfContainmentLevel === 2"
              [class.border-amber-800/80]="analysis.selfContainmentLevel === 2"
              [class.bg-rose-950/20]="analysis.selfContainmentLevel === 3"
              [class.border-rose-800/80]="analysis.selfContainmentLevel === 3"
            >
              <div>
                <span class="text-[10px] font-mono tracking-wider uppercase text-slate-400">Containment Verdict</span>
                <div class="text-lg font-bold text-white mt-1">
                  LEVEL {{ analysis.selfContainmentLevel }} —
                  {{ analysis.selfContainmentLevel === 1 ? 'FULLY SELF-CONTAINED' : analysis.selfContainmentLevel === 2 ? 'HYBRID AUTONOMOUS' : 'EXTERNALLY DEPENDENT' }}
                </div>
                <p class="text-xs text-slate-300 mt-1 leading-relaxed">
                  @if (analysis.selfContainmentLevel === 1) {
                    All required execution components can be bundled and run locally without any external servers or continuous internet access.
                  } @else if (analysis.selfContainmentLevel === 2) {
                    Runs predominantly in local browser/WASM environments, invoking on-demand scale-to-zero server functions when needed.
                  } @else {
                    Requires continuous remote infrastructure, active databases, or external network APIs.
                  }
                </p>
              </div>

              <div class="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span class="text-slate-400">Containment Index:</span>
                <span class="font-bold text-white">{{ analysis.selfContainmentScore }}%</span>
              </div>
            </div>

            <!-- WASM Feasibility -->
            <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-mono tracking-wider uppercase text-slate-500">WebAssembly Feasibility</span>
                  <span
                    class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                    [class.bg-purple-950]="analysis.wasmFeasibility.canCompileToWasm"
                    [class.text-purple-300]="analysis.wasmFeasibility.canCompileToWasm"
                    [class.bg-slate-800]="!analysis.wasmFeasibility.canCompileToWasm"
                    [class.text-slate-400]="!analysis.wasmFeasibility.canCompileToWasm"
                  >
                    {{ analysis.wasmFeasibility.canCompileToWasm ? 'COMPATIBLE' : 'NATIVE WEB' }}
                  </span>
                </div>
                <div class="text-sm font-bold text-white mt-1">
                  Toolchain: {{ analysis.wasmFeasibility.recommendedToolchain }}
                </div>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed">
                  {{ analysis.wasmFeasibility.reasoning }}
                </p>
              </div>

              <div class="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Hardware Acceleration</span>
                <span class="text-cyan-400">{{ analysis.wasmFeasibility.canCompileToWasm ? 'Enabled' : 'Standard JIT' }}</span>
              </div>
            </div>

            <!-- Security & Isolation -->
            <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-mono tracking-wider uppercase text-slate-500">Security Isolation</span>
                  <span class="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400">
                    Grade {{ analysis.securityAudit.isolationGrade }}
                  </span>
                </div>
                <div class="text-sm font-bold text-white mt-1">
                  {{ analysis.securityAudit.safeForOffline ? 'Air-Gapped & Offline Ready' : 'Network Controlled' }}
                </div>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed">
                  Runs in an isolated origin sandbox with no elevated OS filesystem privileges or unverified outbound network sockets.
                </p>
              </div>

              <div class="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Privilege Risk:</span>
                <span class="text-emerald-400 font-bold uppercase">{{ analysis.securityAudit.privilegeEscalationRisk }}</span>
              </div>
            </div>
          </div>

          <!-- Language & Structure Details -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Languages & Entry Points -->
            <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-4">
              <h3 class="text-xs font-bold font-mono tracking-wider uppercase text-white">Language Composition &amp; Entry Points</h3>

              <!-- Language Breakdown -->
              <div class="space-y-2">
                @for (lang of analysis.detectedLanguages; track lang.name) {
                  <div>
                    <div class="flex items-center justify-between text-xs font-mono text-slate-300 mb-1">
                      <span>{{ lang.name }}</span>
                      <span class="text-slate-500">{{ lang.percentage }}%</span>
                    </div>
                    <div class="h-2 w-full rounded-full bg-[#111722] overflow-hidden">
                      <div class="h-full rounded-full" [style.width.%]="lang.percentage" [style.background-color]="lang.color"></div>
                    </div>
                  </div>
                }
              </div>

              <!-- Entry Points List -->
              <div class="pt-3 border-t border-[#1e293b]">
                <div class="text-[11px] font-mono text-slate-400 mb-2">Detected Entry Points:</div>
                <div class="space-y-1">
                  @for (ep of analysis.entryPoints; track ep) {
                    <div class="text-xs font-mono text-cyan-300 bg-[#080b10] px-2.5 py-1.5 rounded border border-[#1e293b] flex items-center justify-between">
                      <span>{{ ep }}</span>
                      <span class="text-[10px] text-slate-500">PRIMARY</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Dependencies & Network Auditing -->
            <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-4">
              <h3 class="text-xs font-bold font-mono tracking-wider uppercase text-white">Dependencies &amp; Network Auditing</h3>

              @if (analysis.dependencies.length > 0) {
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs font-mono">
                    <thead class="text-slate-500 border-b border-[#1e293b]">
                      <tr>
                        <th class="pb-2">Package</th>
                        <th class="pb-2">Type</th>
                        <th class="pb-2">Bundling</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[#1e293b] text-slate-300">
                      @for (dep of analysis.dependencies; track dep.name) {
                        <tr>
                          <td class="py-2 text-white">{{ dep.name }} ({{ dep.version }})</td>
                          <td class="py-2 text-slate-400">{{ dep.type }}</td>
                          <td class="py-2">
                            <span
                              class="text-[10px] px-1.5 py-0.5 rounded font-bold"
                              [class.bg-emerald-950]="dep.canBeBundledLocally"
                              [class.text-emerald-400]="dep.canBeBundledLocally"
                              [class.bg-amber-950]="!dep.canBeBundledLocally"
                              [class.text-amber-400]="!dep.canBeBundledLocally"
                            >
                              {{ dep.canBeBundledLocally ? 'LOCAL BUNDLE' : 'EXTERNAL' }}
                            </span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <div class="text-xs text-slate-400 font-mono py-4 text-center bg-[#080b10] rounded-lg border border-[#1e293b]">
                  Zero external runtime packages required. Autonomous self-contained codebase.
                </div>
              }

              <!-- Network Call Scanner -->
              <div class="pt-2">
                <div class="text-[11px] font-mono text-slate-400 mb-2">Remote Network Calls Detected:</div>
                @if (analysis.externalNetworkCalls.length > 0) {
                  <div class="space-y-1.5">
                    @for (call of analysis.externalNetworkCalls; track call.url) {
                      <div class="text-xs font-mono p-2 rounded bg-[#080b10] border border-[#1e293b] space-y-0.5">
                        <div class="flex items-center justify-between text-rose-400">
                          <span>{{ call.method.toUpperCase() }} {{ call.url }}</span>
                          <span class="text-[10px] px-1 rounded bg-rose-950 text-rose-300 uppercase">{{ call.risk }} RISK</span>
                        </div>
                        <div class="text-[10px] text-slate-500">File: {{ call.file }}:{{ call.line }}</div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="text-xs text-emerald-400 font-mono py-2.5 px-3 rounded bg-emerald-950/20 border border-emerald-900/60 flex items-center gap-2">
                    <mat-icon class="!w-4 !h-4 !text-[16px]">check_circle</mat-icon>
                    <span>Zero outbound network calls detected. Guaranteed offline capable.</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      } @else {
        <div class="p-12 text-center text-slate-400 font-mono">
          No active project selected. Import or create a project to inspect its architecture.
        </div>
      }
    </div>
  `
})
export class AnalyzerView {
  readonly navChange = output<string>();

  readonly projectStorage = inject(ProjectStorage);
  readonly packagingExport = inject(PackagingExport);

  exportReport(proj: Project): void {
    const md = this.packagingExport.generateCompatibilityReport(proj);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${proj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-compatibility-report.md`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }
}
