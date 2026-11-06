import { ChangeDetectionStrategy, Component, output, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProjectStorage } from '../services/project-storage';
import { PackagingExport } from '../services/packaging-export';
import { Project } from '../models/project.model';

@Component({
  selector: 'app-export-center-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      @if (projectStorage.activeProject(); as proj) {
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">Independent Distribution</span>
              <span class="text-slate-600">·</span>
              <span class="text-xs font-mono text-slate-400">{{ proj.name }}</span>
            </div>
            <h1 class="text-xl font-bold text-white tracking-tight mt-0.5">Software Export &amp; Packaging Center</h1>
            <p class="text-xs text-slate-400 mt-1">
              Produce fully autonomous, self-contained packages with real usable files, zero server dependencies, and cross-platform runtime configs.
            </p>
          </div>
        </div>

        <!-- Export Options Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- 1. Portable ZIP Package (Complete Suite) -->
          <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] flex flex-col justify-between space-y-4 hover:border-cyan-500/50 transition-all">
            <div class="space-y-2">
              <div class="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-300 flex items-center justify-center">
                <mat-icon class="!w-5 !h-5 !text-[20px]">folder_zip</mat-icon>
              </div>
              <h3 class="text-sm font-bold text-white tracking-tight">Portable Project ZIP Package</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                Contains original sources, inlined standalone HTML, runtime manifest, local run scripts, and compatibility report in a single archive.
              </p>
            </div>

            <div class="pt-3 border-t border-[#1e293b] space-y-2">
              <div class="text-[10px] font-mono text-slate-500">Includes nononick-runtime.json &amp; run-local.sh</div>
              <button
                type="button"
                (click)="packagingExport.exportPortableZip(proj)"
                class="w-full py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <mat-icon class="!w-4 !h-4 !text-[16px]">download</mat-icon>
                <span>Download Portable ZIP</span>
              </button>
            </div>
          </div>

          <!-- 2. Autonomous Single-File Standalone HTML -->
          <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition-all">
            <div class="space-y-2">
              <div class="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center justify-center">
                <mat-icon class="!w-5 !h-5 !text-[20px]">html</mat-icon>
              </div>
              <h3 class="text-sm font-bold text-white tracking-tight">Autonomous Single-File HTML</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                Fully autonomous single <code class="text-emerald-300 font-mono">.html</code> file with inlined styles, scripts, and base64-embedded WebAssembly modules. Runs double-clicked offline!
              </p>
            </div>

            <div class="pt-3 border-t border-[#1e293b] space-y-2">
              <div class="text-[10px] font-mono text-slate-500">Zero external network requests required</div>
              <button
                type="button"
                (click)="packagingExport.exportStandaloneHtmlFile(proj)"
                class="w-full py-2 text-xs font-semibold text-slate-200 bg-[#162032] hover:bg-[#1e293b] border border-[#334155] rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <mat-icon class="!w-4 !h-4 !text-[16px]">download</mat-icon>
                <span>Download Standalone HTML</span>
              </button>
            </div>
          </div>

          <!-- 3. WebAssembly Binary (.wasm) Module -->
          <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] flex flex-col justify-between space-y-4 hover:border-purple-500/50 transition-all">
            <div class="space-y-2">
              <div class="w-10 h-10 rounded-lg bg-purple-950/60 border border-purple-800 text-purple-300 flex items-center justify-center">
                <mat-icon class="!w-5 !h-5 !text-[20px]">memory</mat-icon>
              </div>
              <h3 class="text-sm font-bold text-white tracking-tight">WebAssembly Binary (.wasm)</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                Compiled raw hardware WebAssembly bytecode buffer. Can be loaded by Wasmtime, Node.js, Cloudflare Workers, or browser runtimes.
              </p>
            </div>

            <div class="pt-3 border-t border-[#1e293b] space-y-2">
              <div class="text-[10px] font-mono text-slate-500">
                {{ proj.wasmBytecode ? (proj.wasmBytecode.length + ' bytes compiled') : 'Compile in WASM view first' }}
              </div>
              <button
                type="button"
                (click)="packagingExport.exportWasmBinaryFile(proj)"
                [disabled]="!proj.wasmBytecode"
                class="w-full py-2 text-xs font-semibold text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 disabled:opacity-40 border border-purple-800 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <mat-icon class="!w-4 !h-4 !text-[16px]">download</mat-icon>
                <span>Download .wasm Binary</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Generated Runtime Manifest Preview -->
        <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold font-mono tracking-wider uppercase text-white">Generated nononick-runtime.json Manifest</h3>
            <span class="text-[10px] font-mono text-cyan-400">Spec Version 1.0.0</span>
          </div>

          <div class="p-4 rounded-lg bg-[#080b10] border border-[#1e293b] font-mono text-xs text-slate-300 overflow-x-auto max-h-64 leading-relaxed">
            <pre>{{ manifestPreview(proj) }}</pre>
          </div>
        </div>
      }
    </div>
  `
})
export class ExportCenterView {
  readonly navChange = output<string>();

  readonly projectStorage = inject(ProjectStorage);
  readonly packagingExport = inject(PackagingExport);

  manifestPreview(proj: Project): string {
    const manifest = {
      formatVersion: '1.0.0',
      runtime: 'NONONICK_UNIVERSAL_RUNTIME',
      project: {
        id: proj.id,
        name: proj.name,
        containmentLevel: proj.analysis?.selfContainmentLevel || 1,
        containmentScore: proj.analysis?.selfContainmentScore || 100,
        runtimeMode: proj.runtimeMode
      },
      executionTargets: {
        modeA_NativeWeb: { supported: true, entryPoint: proj.analysis?.entryPoints[0] || 'index.html' },
        modeB_WebAssembly: { supported: !!proj.analysis?.wasmFeasibility.canCompileToWasm, toolchain: proj.analysis?.wasmFeasibility.recommendedToolchain },
        modeC_OnDemandServer: { supported: !!proj.analysis?.serverRequirements.requiresServer, scaleToZero: true }
      },
      offlineCapable: proj.analysis?.selfContainmentLevel === 1
    };
    return JSON.stringify(manifest, null, 2);
  }
}
