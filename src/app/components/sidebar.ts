import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProjectStorage } from '../services/project-storage';
import { RuntimeManager } from '../services/runtime-manager';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  section: 'core' | 'execution' | 'system';
}

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <aside class="w-64 border-r border-[#1e293b] bg-[#080b10] flex flex-col justify-between shrink-0 h-[calc(100vh-3.5rem)] select-none">
      <div class="p-3 overflow-y-auto space-y-6">
        <!-- Active Project Card -->
        @if (projectStorage.activeProject(); as proj) {
          <div class="p-3 rounded-lg bg-[#0c1017] border border-[#1e293b] space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono tracking-wider uppercase text-slate-500">Active Workload</span>
              <span
                class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                [class.bg-emerald-950]="proj.analysis?.selfContainmentLevel === 1"
                [class.text-emerald-400]="proj.analysis?.selfContainmentLevel === 1"
                [class.bg-amber-950]="proj.analysis?.selfContainmentLevel === 2"
                [class.text-amber-400]="proj.analysis?.selfContainmentLevel === 2"
                [class.bg-rose-950]="proj.analysis?.selfContainmentLevel === 3"
                [class.text-rose-400]="proj.analysis?.selfContainmentLevel === 3"
              >
                LEVEL {{ proj.analysis?.selfContainmentLevel || 1 }}
              </span>
            </div>
            <div class="text-xs font-semibold text-white truncate" [title]="proj.name">
              {{ proj.name }}
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{{ proj.files.length }} files</span>
              <span class="text-cyan-400">{{ proj.runtimeMode.replace('mode-', '').toUpperCase() }}</span>
            </div>
          </div>
        }

        <!-- 1. Core Workflow Section -->
        <div>
          <div class="px-3 mb-1.5 text-[10px] font-mono tracking-wider uppercase text-slate-500">Workspace</div>
          <div class="space-y-0.5">
            @for (item of coreNav; track item.id) {
              <button
                type="button"
                (click)="tabChange.emit(item.id)"
                class="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left"
                [class.bg-cyan-950]="activeTab() === item.id"
                [class.text-cyan-300]="activeTab() === item.id"
                [class.border]="activeTab() === item.id"
                [class.border-cyan-800]="activeTab() === item.id"
                [class.text-slate-400]="activeTab() !== item.id"
                [class.hover:text-slate-200]="activeTab() !== item.id"
                [class.hover:bg-[#0f172a]]="activeTab() !== item.id"
              >
                <div class="flex items-center gap-2.5 truncate">
                  <mat-icon class="text-base leading-none !w-4 !h-4 !text-[16px]">{{ item.icon }}</mat-icon>
                  <span class="truncate">{{ item.label }}</span>
                </div>
                @if (item.id === 'console' && runtimeManager.logs().length > 0) {
                  <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1e293b] text-slate-300">
                    {{ runtimeManager.logs().length }}
                  </span>
                }
              </button>
            }
          </div>
        </div>

        <!-- 2. Execution & Engines Section -->
        <div>
          <div class="px-3 mb-1.5 text-[10px] font-mono tracking-wider uppercase text-slate-500">Execution & Compilers</div>
          <div class="space-y-0.5">
            @for (item of executionNav; track item.id) {
              <button
                type="button"
                (click)="tabChange.emit(item.id)"
                class="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left"
                [class.bg-cyan-950]="activeTab() === item.id"
                [class.text-cyan-300]="activeTab() === item.id"
                [class.border]="activeTab() === item.id"
                [class.border-cyan-800]="activeTab() === item.id"
                [class.text-slate-400]="activeTab() !== item.id"
                [class.hover:text-slate-200]="activeTab() !== item.id"
                [class.hover:bg-[#0f172a]]="activeTab() !== item.id"
              >
                <div class="flex items-center gap-2.5 truncate">
                  <mat-icon class="text-base leading-none !w-4 !h-4 !text-[16px]">{{ item.icon }}</mat-icon>
                  <span class="truncate">{{ item.label }}</span>
                </div>
                @if (item.badge) {
                  <span class="text-[9px] font-mono uppercase px-1 py-0.5 rounded bg-[#1e293b] text-cyan-400 border border-[#334155]">
                    {{ item.badge }}
                  </span>
                }
              </button>
            }
          </div>
        </div>

        <!-- 3. Operations & Export Section -->
        <div>
          <div class="px-3 mb-1.5 text-[10px] font-mono tracking-wider uppercase text-slate-500">Distribution & Cost</div>
          <div class="space-y-0.5">
            @for (item of systemNav; track item.id) {
              <button
                type="button"
                (click)="tabChange.emit(item.id)"
                class="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left"
                [class.bg-cyan-950]="activeTab() === item.id"
                [class.text-cyan-300]="activeTab() === item.id"
                [class.border]="activeTab() === item.id"
                [class.border-cyan-800]="activeTab() === item.id"
                [class.text-slate-400]="activeTab() !== item.id"
                [class.hover:text-slate-200]="activeTab() !== item.id"
                [class.hover:bg-[#0f172a]]="activeTab() !== item.id"
              >
                <div class="flex items-center gap-2.5 truncate">
                  <mat-icon class="text-base leading-none !w-4 !h-4 !text-[16px]">{{ item.icon }}</mat-icon>
                  <span class="truncate">{{ item.label }}</span>
                </div>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Footer Telemetry -->
      <div class="p-3 border-t border-[#1e293b] bg-[#05070a]/60 text-[11px] font-mono text-slate-400 space-y-1">
        <div class="flex items-center justify-between">
          <span>Engine Status</span>
          <span class="text-cyan-400 font-semibold">
            {{ runtimeManager.state().status.toUpperCase() }}
          </span>
        </div>
        <div class="flex items-center justify-between text-[10px] text-slate-500">
          <span>Idle Policy</span>
          <span>Scale-to-Zero</span>
        </div>
      </div>
    </aside>
  `
})
export class Sidebar {
  readonly activeTab = input.required<string>();
  readonly tabChange = output<string>();

  readonly projectStorage = inject(ProjectStorage);
  readonly runtimeManager = inject(RuntimeManager);

  readonly coreNav: NavItem[] = [
    { id: 'dashboard', label: '1. Dashboard', icon: 'dashboard', section: 'core' },
    { id: 'projects', label: '2. Project Manager', icon: 'folder_open', section: 'core' },
    { id: 'import', label: '3. Import Center', icon: 'cloud_upload', section: 'core' },
    { id: 'analyzer', label: '4. Analyzer', icon: 'psychology', section: 'core' },
    { id: 'editor', label: '8. Code Editor', icon: 'code', section: 'core' },
    { id: 'preview', label: '7. Live Preview', icon: 'play_circle_outline', section: 'core' },
    { id: 'console', label: '9. Console Logs', icon: 'terminal', section: 'core' }
  ];

  readonly executionNav: NavItem[] = [
    { id: 'wasm', label: '5. WebAssembly Compiler', icon: 'memory', badge: 'WASM', section: 'execution' },
    { id: 'runtime', label: '6. Runtime Manager', icon: 'precision_manufacturing', badge: 'Modes A/B/C', section: 'execution' }
  ];

  readonly systemNav: NavItem[] = [
    { id: 'cost', label: '10. Cost Monitor', icon: 'savings', section: 'system' },
    { id: 'export', label: '11. Export Center', icon: 'archive', section: 'system' },
    { id: 'settings', label: '12. Settings', icon: 'tune', section: 'system' }
  ];
}
