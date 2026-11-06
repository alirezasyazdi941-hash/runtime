import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NetworkCost } from '../services/network-cost';
import { ProjectStorage } from '../services/project-storage';

@Component({
  selector: 'app-top-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <header class="h-14 border-b border-[#1e293b] bg-[#05070a]/90 backdrop-blur-md px-6 flex items-center justify-between gap-8 sticky top-0 z-50">
      <!-- Zone 1: Single-element Brand Wordmark -->
      <div class="flex items-center gap-3 shrink-0">
        <a href="#" (click)="$event.preventDefault(); onSelectNav('dashboard')" class="text-base font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2">
          <span class="w-6 h-6 rounded bg-gradient-to-br from-cyan-400 to-sky-600 flex items-center justify-center text-black text-xs font-black">N</span>
          <span>NONONICK <span class="text-cyan-400 font-mono text-xs font-normal">RUNTIME</span></span>
        </a>
      </div>

      <!-- Zone 2: 4-5 concise single-line text nav links -->
      <nav class="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400 whitespace-nowrap shrink-0">
        <button
          type="button"
          (click)="onSelectNav('dashboard')"
          class="transition-colors hover:text-white"
          [class.text-cyan-400]="activeTab() === 'dashboard'"
        >
          Dashboard
        </button>
        <button
          type="button"
          (click)="onSelectNav('analyzer')"
          class="transition-colors hover:text-white"
          [class.text-cyan-400]="activeTab() === 'analyzer'"
        >
          Architecture
        </button>
        <button
          type="button"
          (click)="onSelectNav('wasm')"
          class="transition-colors hover:text-white"
          [class.text-cyan-400]="activeTab() === 'wasm'"
        >
          WebAssembly
        </button>
        <button
          type="button"
          (click)="onSelectNav('runtime')"
          class="transition-colors hover:text-white"
          [class.text-cyan-400]="activeTab() === 'runtime'"
        >
          Runtimes
        </button>
        <button
          type="button"
          (click)="onSelectNav('preview')"
          class="transition-colors hover:text-white"
          [class.text-cyan-400]="activeTab() === 'preview'"
        >
          Live Preview
        </button>
      </nav>

      <!-- Zone 3: 1 primary action + connectivity status -->
      <div class="flex items-center gap-3 shrink-0">
        <div class="flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded bg-[#0c1017] border border-[#1e293b]">
          <span
            class="w-2 h-2 rounded-full"
            [class.bg-emerald-400]="networkCost.effectiveOnline()"
            [class.bg-amber-400]="!networkCost.effectiveOnline()"
          ></span>
          <span class="text-slate-300">
            {{ networkCost.effectiveOnline() ? 'Online Ready' : 'Autonomous Offline' }}
          </span>
        </div>

        <button
          type="button"
          (click)="onSelectNav('import')"
          class="px-3.5 py-1.5 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 transition-colors rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
        >
          <mat-icon class="text-sm leading-none !w-4 !h-4 !text-[16px]">file_upload</mat-icon>
          <span>Import Project</span>
        </button>
      </div>
    </header>
  `
})
export class TopBar {
  readonly activeTab = input.required<string>();
  readonly tabChange = output<string>();

  readonly networkCost = inject(NetworkCost);
  readonly projectStorage = inject(ProjectStorage);

  onSelectNav(tab: string): void {
    this.tabChange.emit(tab);
  }
}
