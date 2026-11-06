import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { ProjectStorage } from '../services/project-storage';
import { RuntimeManager } from '../services/runtime-manager';

@Component({
  selector: 'app-live-preview-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="h-full flex flex-col bg-[#05070a]">
      <!-- Technical Browser Control Bar -->
      <div class="h-12 border-b border-[#1e293b] bg-[#0c1017] px-4 flex items-center justify-between gap-4 shrink-0">
        <!-- Navigation controls & URL -->
        <div class="flex items-center gap-2 flex-1 max-w-xl">
          <button
            type="button"
            (click)="reloadPreview()"
            class="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors"
            title="Reload Preview"
          >
            <mat-icon class="!w-4 !h-4 !text-[16px]">refresh</mat-icon>
          </button>

          <!-- Mock URL bar -->
          <div class="flex-1 flex items-center gap-2 px-3 py-1 bg-[#080b10] border border-[#1e293b] rounded-lg text-xs font-mono text-slate-300">
            <mat-icon class="text-emerald-400 !w-3.5 !h-3.5 !text-[14px]">lock</mat-icon>
            <span class="text-slate-500">runtime://sandbox/</span>
            <span class="text-cyan-300">{{ activePath() }}</span>
          </div>
        </div>

        <!-- Viewport Switchers -->
        <div class="flex items-center gap-1 bg-[#080b10] border border-[#1e293b] p-1 rounded-lg">
          <button
            type="button"
            (click)="viewportMode.set('desktop')"
            class="px-2.5 py-1 text-xs font-mono rounded transition-colors flex items-center gap-1"
            [class.bg-[#1e293b]]="viewportMode() === 'desktop'"
            [class.text-white]="viewportMode() === 'desktop'"
            [class.text-slate-400]="viewportMode() !== 'desktop'"
            title="Desktop View (1440px baseline)"
          >
            <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">desktop_windows</mat-icon>
            <span>Desktop</span>
          </button>

          <button
            type="button"
            (click)="viewportMode.set('tablet')"
            class="px-2.5 py-1 text-xs font-mono rounded transition-colors flex items-center gap-1"
            [class.bg-[#1e293b]]="viewportMode() === 'tablet'"
            [class.text-white]="viewportMode() === 'tablet'"
            [class.text-slate-400]="viewportMode() !== 'tablet'"
            title="Tablet View (768px)"
          >
            <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">tablet_mac</mat-icon>
            <span>Tablet</span>
          </button>

          <button
            type="button"
            (click)="viewportMode.set('mobile')"
            class="px-2.5 py-1 text-xs font-mono rounded transition-colors flex items-center gap-1"
            [class.bg-[#1e293b]]="viewportMode() === 'mobile'"
            [class.text-white]="viewportMode() === 'mobile'"
            [class.text-slate-400]="viewportMode() !== 'mobile'"
            title="iPhone / Mobile View (390px)"
          >
            <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">smartphone</mat-icon>
            <span>iPhone</span>
          </button>
        </div>

        <!-- Console toggle button -->
        <button
          type="button"
          (click)="showConsoleDrawer.set(!showConsoleDrawer())"
          class="px-2.5 py-1 text-xs font-mono rounded transition-colors flex items-center gap-1.5"
          [class.bg-cyan-950]="showConsoleDrawer()"
          [class.text-cyan-300]="showConsoleDrawer()"
          [class.border]="showConsoleDrawer()"
          [class.border-cyan-800]="showConsoleDrawer()"
          [class.text-slate-400]="!showConsoleDrawer()"
        >
          <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">terminal</mat-icon>
          <span>Console ({{ runtimeManager.logs().length }})</span>
        </button>
      </div>

      <!-- Iframe Container Canvas -->
      <div class="flex-1 overflow-auto bg-[#05070a] flex items-center justify-center p-4">
        <div
          class="h-full bg-black border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden transition-all flex flex-col"
          [style.width]="viewportWidth()"
        >
          <iframe
            #previewIframe
            [srcdoc]="safePreviewHtml()"
            sandbox="allow-scripts allow-modals allow-forms"
            class="w-full h-full border-none bg-black"
          ></iframe>
        </div>
      </div>

      <!-- Bottom Console Overlay Drawer (Toggleable) -->
      @if (showConsoleDrawer()) {
        <div class="h-44 border-t border-[#1e293b] bg-[#080b10] flex flex-col shrink-0">
          <div class="h-8 border-b border-[#1e293b] bg-[#0c1017] px-4 flex items-center justify-between text-xs font-mono">
            <div class="flex items-center gap-2">
              <span class="text-slate-400">Execution Console Stream</span>
              <span class="text-[10px] text-slate-500">Intercepting iframe console &amp; WASM logs</span>
            </div>
            <button
              type="button"
              (click)="runtimeManager.clearLogs()"
              class="text-[11px] text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1">
            @for (log of runtimeManager.logs(); track log.id) {
              <div class="flex items-start gap-2 leading-relaxed">
                <span class="text-slate-500 shrink-0 text-[10px]">{{ log.timestamp }}</span>
                <span
                  class="text-[10px] uppercase font-bold shrink-0 px-1 rounded"
                  [class.text-cyan-400]="log.source === 'browser'"
                  [class.text-purple-400]="log.source === 'wasm'"
                  [class.text-amber-400]="log.source === 'server'"
                  [class.text-emerald-400]="log.source === 'system'"
                >
                  [{{ log.source }}]
                </span>
                <span
                  [class.text-rose-400]="log.level === 'error'"
                  [class.text-amber-300]="log.level === 'warn'"
                  [class.text-purple-300]="log.level === 'wasm'"
                  [class.text-slate-300]="log.level === 'info'"
                >
                  {{ log.message }}
                </span>
              </div>
            } @empty {
              <div class="text-slate-600 italic">No execution logs emitted yet.</div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class LivePreviewView {
  readonly projectStorage = inject(ProjectStorage);
  readonly runtimeManager = inject(RuntimeManager);
  private readonly sanitizer = inject(DomSanitizer);

  readonly viewportMode = signal<'desktop' | 'tablet' | 'mobile'>('desktop');
  readonly showConsoleDrawer = signal<boolean>(false);
  readonly refreshTrigger = signal<number>(0);

  readonly activePath = computed(() => {
    const proj = this.projectStorage.activeProject();
    return proj?.analysis?.entryPoints[0] || 'index.html';
  });

  readonly viewportWidth = computed(() => {
    const mode = this.viewportMode();
    if (mode === 'mobile') return '390px';
    if (mode === 'tablet') return '768px';
    return '100%';
  });

  readonly safePreviewHtml = computed(() => {
    // depend on refresh trigger and project files
    this.refreshTrigger();
    const proj = this.projectStorage.activeProject();
    if (!proj) return '';

    const rawDoc = this.runtimeManager.buildModeAPreviewHtml(proj);
    return rawDoc;
  });

  reloadPreview(): void {
    this.refreshTrigger.update(n => n + 1);
    const proj = this.projectStorage.activeProject();
    if (proj) {
      this.runtimeManager.addLog('browser', `Reloaded sandbox view for "${proj.name}".`);
    }
  }
}
