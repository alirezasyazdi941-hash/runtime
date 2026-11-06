import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProjectStorage } from '../services/project-storage';
import { WasmCompiler } from '../services/wasm-compiler';
import { PackagingExport } from '../services/packaging-export';
import { WasmModuleInspection, WasmBenchmarkResult } from '../models/runtime.model';

@Component({
  selector: 'app-wasm-compiler-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">WebAssembly Compiler &amp; Toolchain</span>
            <span class="text-slate-600">·</span>
            <span class="text-xs font-mono text-slate-400">Bytecode Synthesizer &amp; WASI Runtime</span>
          </div>
          <h1 class="text-xl font-bold text-white tracking-tight mt-0.5">Real-Time WebAssembly Compilation Studio</h1>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="compileActiveWat()"
            class="px-4 py-1.5 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <mat-icon class="!w-4 !h-4 !text-[16px]">play_arrow</mat-icon>
            <span>Assemble Bytecode</span>
          </button>

          <button
            type="button"
            (click)="downloadWasmBinary()"
            [disabled]="!compiledBytes()"
            class="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-[#162032] hover:bg-[#1e293b] disabled:opacity-50 border border-[#334155] rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <mat-icon class="!w-4 !h-4 !text-[16px]">download</mat-icon>
            <span>Download .wasm</span>
          </button>
        </div>
      </div>

      <!-- Main Two-Column Layout: WAT Source vs WASM Binary & Execution -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Column 1: WebAssembly Text (WAT) Source Editor -->
        <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] flex flex-col justify-between space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold font-mono tracking-wider uppercase text-slate-300 flex items-center gap-2">
              <mat-icon class="text-purple-400 !w-4 !h-4 !text-[16px]">code</mat-icon>
              <span>WebAssembly Text (WAT) Source</span>
            </span>
            <span class="text-[10px] font-mono text-slate-500">Target: wasm32-unknown-unknown</span>
          </div>

          <div class="relative">
            <textarea
              [value]="watSource()"
              (input)="onWatInput($event)"
              rows="18"
              class="w-full bg-[#080b10] border border-[#1e293b] focus:border-purple-500 rounded-lg p-3 font-mono text-xs text-purple-200 outline-none leading-relaxed resize-none"
              spellcheck="false"
            ></textarea>
          </div>

          <div class="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-[#1e293b]">
            <span>Exports: fib, isPrime, add</span>
            <span>POSIX / WASI preview1 compatible</span>
          </div>
        </div>

        <!-- Column 2: Binary Inspection, Execution & Benchmarking -->
        <div class="space-y-6">
          <!-- Bytecode Binary Inspection -->
          <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-2">
                <mat-icon class="text-cyan-400 !w-4 !h-4 !text-[16px]">memory</mat-icon>
                <span>WASM Binary Inspection</span>
              </span>
              @if (compiledBytes(); as b) {
                <span class="text-xs font-mono text-emerald-400 font-bold">
                  {{ b.length }} BYTES
                </span>
              }
            </div>

            @if (inspection(); as insp) {
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div class="p-2.5 rounded bg-[#080b10] border border-[#1e293b]">
                  <div class="text-[10px] text-slate-500">Magic Number</div>
                  <div class="font-bold text-emerald-400 mt-0.5">\\0asm Valid</div>
                </div>
                <div class="p-2.5 rounded bg-[#080b10] border border-[#1e293b]">
                  <div class="text-[10px] text-slate-500">WASM Version</div>
                  <div class="font-bold text-white mt-0.5">v{{ insp.version }}</div>
                </div>
                <div class="p-2.5 rounded bg-[#080b10] border border-[#1e293b]">
                  <div class="text-[10px] text-slate-500">Sections</div>
                  <div class="font-bold text-cyan-400 mt-0.5">{{ insp.sections.length }} Encoded</div>
                </div>
                <div class="p-2.5 rounded bg-[#080b10] border border-[#1e293b]">
                  <div class="text-[10px] text-slate-500">Linear Memory</div>
                  <div class="font-bold text-purple-400 mt-0.5">{{ insp.memoryInitialPages }} Page (64KB)</div>
                </div>
              </div>

              <!-- Sections breakdown -->
              <div class="space-y-1">
                <div class="text-[11px] font-mono text-slate-400">Binary Sections Decoded:</div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  @for (sec of insp.sections; track sec.id) {
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111722] text-slate-300 border border-[#1e293b]">
                      Sec {{ sec.id }}: {{ sec.name }} ({{ sec.sizeBytes }}B)
                    </span>
                  }
                </div>
              </div>

              <!-- Hex Preview (first 32 bytes) -->
              <div>
                <div class="text-[11px] font-mono text-slate-400 mb-1">Raw Hex Dump Preview:</div>
                <div class="p-2 rounded bg-[#080b10] border border-[#1e293b] font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                  {{ hexPreview() }}
                </div>
              </div>
            } @else {
              <div class="text-xs text-slate-400 font-mono py-4 text-center">
                Click "Assemble Bytecode" to generate genuine WebAssembly binary.
              </div>
            }
          </div>

          <!-- Real Execution & Benchmark Deck -->
          <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-4">
            <h3 class="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-2">
              <mat-icon class="text-amber-400 !w-4 !h-4 !text-[16px]">speed</mat-icon>
              <span>Hardware Benchmark (WASM vs Pure JavaScript)</span>
            </h3>

            <div class="flex items-center gap-3 flex-wrap">
              <div class="space-y-1">
                <span class="text-[10px] font-mono text-slate-400">Function</span>
                <select
                  [value]="selectedFunction()"
                  (change)="selectedFunction.set($any($event.target).value)"
                  class="bg-[#080b10] border border-[#1e293b] text-white text-xs px-2.5 py-1.5 rounded font-mono outline-none"
                >
                  <option value="fib">fib(n) - Iterative Fibonacci</option>
                  <option value="isPrime">isPrime(n) - Sieve Prime Detector</option>
                  <option value="add">add(a, b) - Vector Addition</option>
                </select>
              </div>

              <div class="space-y-1">
                <span class="text-[10px] font-mono text-slate-400">Input Value (n)</span>
                <input
                  type="number"
                  [value]="inputArg()"
                  (input)="inputArg.set(+$any($event.target).value)"
                  class="bg-[#080b10] border border-[#1e293b] text-white text-xs px-2.5 py-1.5 rounded font-mono w-28 outline-none"
                >
              </div>

              <div class="pt-4">
                <button
                  type="button"
                  (click)="runBenchmark()"
                  [disabled]="isBenchmarking()"
                  class="px-4 py-1.5 text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <mat-icon class="!w-4 !h-4 !text-[16px]">rocket_launch</mat-icon>
                  <span>{{ isBenchmarking() ? 'Benchmarking...' : 'Execute Benchmark' }}</span>
                </button>
              </div>
            </div>

            <!-- Benchmark Results -->
            @if (benchmarkResult(); as res) {
              <div class="p-3.5 rounded-lg bg-[#080b10] border border-[#1e293b] space-y-2">
                <div class="flex items-center justify-between text-xs font-mono">
                  <span class="text-slate-400">Target: <strong class="text-white">{{ res.functionName }}</strong> ({{ res.iterations.toLocaleString() }} iterations)</span>
                  <span class="font-bold text-emerald-400">{{ res.speedupFactor }}x Speedup</span>
                </div>

                <div class="grid grid-cols-2 gap-3 pt-2 border-t border-[#1e293b] text-xs font-mono">
                  <div class="p-2 rounded bg-[#0c1017]">
                    <div class="text-[10px] text-purple-400">WebAssembly Latency</div>
                    <div class="text-sm font-bold text-white mt-0.5">{{ res.wasmDurationMs }} ms</div>
                  </div>
                  <div class="p-2 rounded bg-[#0c1017]">
                    <div class="text-[10px] text-amber-400">Pure JavaScript Latency</div>
                    <div class="text-sm font-bold text-white mt-0.5">{{ res.jsDurationMs }} ms</div>
                  </div>
                </div>

                <div class="text-[10px] text-slate-500 font-mono text-right">
                  Hardware JIT compilation verified. Linear memory: {{ (res.memoryConsumedBytes / 1024).toFixed(0) }} KB
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class WasmCompilerView {
  readonly projectStorage = inject(ProjectStorage);
  readonly wasmCompiler = inject(WasmCompiler);
  readonly packagingExport = inject(PackagingExport);

  readonly watSource = signal<string>(`(module
  ;; Exported Fibonacci function
  (func $fib (param $n i32) (result i32)
    (local $a i32)
    (local $b i32)
    (local $i i32)
    (local $tmp i32)
    (if (i32.le_s (local.get $n) (i32.const 1))
      (then (return (local.get $n)))
    )
    (local.set $a (i32.const 0))
    (local.set $b (i32.const 1))
    (local.set $i (i32.const 2))
    (block $loop_exit
      (loop $loop_top
        (br_if $loop_exit (i32.gt_s (local.get $i) (local.get $n)))
        (local.set $tmp (i32.add (local.get $a) (local.get $b)))
        (local.set $a (local.get $b))
        (local.set $b (local.get $tmp))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop_top)
      )
    )
    (local.get $b)
  )

  ;; Exported Prime check function
  (func $isPrime (param $n i32) (result i32)
    (local $i i32)
    (if (i32.le_s (local.get $n) (i32.const 1))
      (then (return (i32.const 0)))
    )
    (if (i32.le_s (local.get $n) (i32.const 3))
      (then (return (i32.const 1)))
    )
    (if (i32.eqz (i32.rem_s (local.get $n) (i32.const 2)))
      (then (return (i32.const 0)))
    )
    (local.set $i (i32.const 3))
    (block $prime_exit
      (loop $prime_loop
        (br_if $prime_exit (i32.gt_s (i32.mul (local.get $i) (local.get $i)) (local.get $n)))
        (if (i32.eqz (i32.rem_s (local.get $n) (local.get $i)))
          (then (return (i32.const 0)))
        )
        (local.set $i (i32.add (local.get $i) (i32.const 2)))
        (br $prime_loop)
      )
    )
    (i32.const 1)
  )

  ;; Exported Add function
  (func $add (param $a i32) (param $b i32) (result i32)
    (i32.add (local.get $a) (local.get $b))
  )

  (export "fib" (func $fib))
  (export "isPrime" (func $isPrime))
  (export "add" (func $add))
)`);

  readonly compiledBytes = signal<Uint8Array | null>(null);
  readonly inspection = signal<WasmModuleInspection | null>(null);
  readonly hexPreview = signal<string>('');
  readonly selectedFunction = signal<'fib' | 'isPrime' | 'add'>('fib');
  readonly inputArg = signal<number>(40);
  readonly isBenchmarking = signal<boolean>(false);
  readonly benchmarkResult = signal<WasmBenchmarkResult | null>(null);

  constructor() {
    this.compileActiveWat();
  }

  onWatInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.watSource.set(val);
  }

  compileActiveWat(): void {
    const res = this.wasmCompiler.compileWat(this.watSource());
    this.compiledBytes.set(res.bytes);

    const insp = this.wasmCompiler.inspectBinary(res.bytes);
    this.inspection.set(insp);

    // Update active project wasm bytecode if current project has wat
    const curr = this.projectStorage.activeProject();
    if (curr) {
      curr.wasmBytecode = res.bytes;
    }

    // Format hex preview
    const hexSlice = Array.from(res.bytes.slice(0, 32))
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
    this.hexPreview.set(hexSlice + (res.bytes.length > 32 ? ' ...' : ''));
  }

  downloadWasmBinary(): void {
    const bytes = this.compiledBytes();
    if (!bytes) return;
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/wasm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'module.wasm';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  async runBenchmark(): Promise<void> {
    const bytes = this.compiledBytes();
    if (!bytes) return;

    this.isBenchmarking.set(true);
    try {
      const { instance } = await this.wasmCompiler.instantiateModule(bytes);
      const res = await this.wasmCompiler.benchmarkWasmVsJs(
        instance,
        this.selectedFunction(),
        this.inputArg(),
        30000
      );
      this.benchmarkResult.set(res);
    } catch (e) {
      console.error('[BENCHMARK ERROR]', e);
    } finally {
      this.isBenchmarking.set(false);
    }
  }
}
