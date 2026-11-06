import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RuntimeManager } from '../services/runtime-manager';

@Component({
  selector: 'app-console-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">System Event Stream</span>
            <span class="text-slate-600">·</span>
            <span class="text-xs font-mono text-slate-400">Standard Out &amp; Telemetry</span>
          </div>
          <h1 class="text-xl font-bold text-white tracking-tight mt-0.5">Unified Execution Console</h1>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="exportLogs()"
            class="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-[#162032] hover:bg-[#1e293b] border border-[#334155] rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <mat-icon class="!w-4 !h-4 !text-[16px]">file_download</mat-icon>
            <span>Export Log File</span>
          </button>

          <button
            type="button"
            (click)="runtimeManager.clearLogs()"
            class="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-[#0c1017] hover:bg-[#1e293b] border border-[#1e293b] rounded-lg transition-colors"
          >
            Clear Stream
          </button>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0c1017] p-2 rounded-xl border border-[#1e293b]">
        <!-- Source Filter -->
        <div class="flex items-center gap-1 flex-wrap text-xs font-medium">
          <button
            type="button"
            (click)="sourceFilter.set('all')"
            class="px-2.5 py-1 rounded transition-colors"
            [class.bg-[#1e293b]]="sourceFilter() === 'all'"
            [class.text-white]="sourceFilter() === 'all'"
            [class.text-slate-400]="sourceFilter() !== 'all'"
          >
            All Logs ({{ runtimeManager.logs().length }})
          </button>

          <button
            type="button"
            (click)="sourceFilter.set('wasm')"
            class="px-2.5 py-1 rounded transition-colors"
            [class.bg-[#1e293b]]="sourceFilter() === 'wasm'"
            [class.text-purple-300]="sourceFilter() === 'wasm'"
            [class.text-slate-400]="sourceFilter() !== 'wasm'"
          >
            WASM Stdout
          </button>

          <button
            type="button"
            (click)="sourceFilter.set('browser')"
            class="px-2.5 py-1 rounded transition-colors"
            [class.bg-[#1e293b]]="sourceFilter() === 'browser'"
            [class.text-cyan-300]="sourceFilter() === 'browser'"
            [class.text-slate-400]="sourceFilter() !== 'browser'"
          >
            Browser
          </button>

          <button
            type="button"
            (click)="sourceFilter.set('server')"
            class="px-2.5 py-1 rounded transition-colors"
            [class.bg-[#1e293b]]="sourceFilter() === 'server'"
            [class.text-amber-300]="sourceFilter() === 'server'"
            [class.text-slate-400]="sourceFilter() !== 'server'"
          >
            On-Demand Server
          </button>
        </div>

        <!-- Search in logs -->
        <div class="relative w-full sm:w-64">
          <input
            type="text"
            [value]="filterText()"
            (input)="filterText.set($any($event.target).value)"
            placeholder="Search log messages..."
            class="w-full bg-[#080b10] border border-[#1e293b] text-white text-xs px-3 py-1.5 rounded-lg outline-none font-mono placeholder:text-slate-500"
          >
        </div>
      </div>

      <!-- Logs Terminal Output Window -->
      <div class="rounded-xl bg-[#05070a] border border-[#1e293b] p-4 font-mono text-xs overflow-y-auto max-h-[600px] space-y-1.5 shadow-2xl">
        @for (log of filteredLogs(); track log.id) {
          <div class="flex items-start gap-3 py-1 border-b border-white/[0.03] leading-relaxed">
            <span class="text-slate-500 shrink-0 text-[11px]">{{ log.timestamp }}</span>
            <span
              class="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider"
              [class.bg-purple-950]="log.source === 'wasm'"
              [class.text-purple-300]="log.source === 'wasm'"
              [class.bg-cyan-950]="log.source === 'browser'"
              [class.text-cyan-300]="log.source === 'browser'"
              [class.bg-amber-950]="log.source === 'server'"
              [class.text-amber-300]="log.source === 'server'"
              [class.bg-slate-800]="log.source === 'system' || log.source === 'compiler'"
              [class.text-slate-300]="log.source === 'system' || log.source === 'compiler'"
            >
              {{ log.source }}
            </span>
            <div
              class="flex-1 whitespace-pre-wrap break-all"
              [class.text-rose-400]="log.level === 'error'"
              [class.text-amber-300]="log.level === 'warn'"
              [class.text-purple-300]="log.level === 'wasm'"
              [class.text-slate-300]="log.level === 'info'"
            >
              {{ log.message }}
            </div>
          </div>
        } @empty {
          <div class="text-slate-600 text-center py-12 italic">
            No matching log events recorded in active session.
          </div>
        }
      </div>
    </div>
  `
})
export class ConsoleView {
  readonly runtimeManager = inject(RuntimeManager);

  readonly sourceFilter = signal<string>('all');
  readonly filterText = signal<string>('');

  readonly filteredLogs = computed(() => {
    const list = this.runtimeManager.logs();
    const source = this.sourceFilter();
    const query = this.filterText().toLowerCase().trim();

    return list.filter(l => {
      if (source !== 'all' && l.source !== source) return false;
      if (query && !l.message.toLowerCase().includes(query)) return false;
      return true;
    });
  });

  exportLogs(): void {
    const content = this.runtimeManager.logs()
      .map(l => `[${l.timestamp}] [${l.source.toUpperCase()}] [${l.level.toUpperCase()}]: ${l.message}`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nononick-execution-${Date.now()}.log`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }
}
