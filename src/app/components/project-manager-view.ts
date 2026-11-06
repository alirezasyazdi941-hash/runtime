import { ChangeDetectionStrategy, Component, signal, output, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProjectStorage } from '../services/project-storage';
import { PackagingExport } from '../services/packaging-export';

@Component({
  selector: 'app-project-manager-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <h1 class="text-xl font-bold text-white tracking-tight">Project Workload Manager</h1>
          <p class="text-xs text-slate-400 mt-0.5">Manage, switch, clone, and configure isolated local project environments.</p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="showNewModal.set(true)"
            class="px-3.5 py-1.5 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <mat-icon class="!w-4 !h-4 !text-[16px]">add</mat-icon>
            <span>Create Project</span>
          </button>

          <button
            type="button"
            (click)="projectStorage.resetToDefaultSamples()"
            class="px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#0c1017] hover:bg-[#162032] border border-[#1e293b] rounded-lg flex items-center gap-1.5 transition-colors"
            title="Reset to official benchmark projects"
          >
            <mat-icon class="!w-4 !h-4 !text-[16px]">restore</mat-icon>
            <span>Restore Samples</span>
          </button>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="flex flex-col sm:flex-row items-center gap-3">
        <div class="relative w-full sm:w-80">
          <mat-icon class="absolute left-3 top-2.5 text-slate-500 !w-4 !h-4 !text-[16px]">search</mat-icon>
          <input
            type="text"
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
            placeholder="Search projects, tags, or languages..."
            class="w-full bg-[#0c1017] border border-[#1e293b] focus:border-cyan-400 text-xs text-white pl-9 pr-3 py-2 rounded-lg outline-none font-mono placeholder:text-slate-500"
          >
        </div>

        <!-- Filter tabs -->
        <div class="flex items-center gap-1 p-1 bg-[#0c1017] border border-[#1e293b] rounded-lg text-xs font-medium">
          <button
            type="button"
            (click)="activeFilter.set('all')"
            class="px-3 py-1 rounded-md transition-colors"
            [class.bg-[#1e293b]]="activeFilter() === 'all'"
            [class.text-white]="activeFilter() === 'all'"
            [class.text-slate-400]="activeFilter() !== 'all'"
          >
            All ({{ projectStorage.projects().length }})
          </button>
          <button
            type="button"
            (click)="activeFilter.set('wasm')"
            class="px-3 py-1 rounded-md transition-colors"
            [class.bg-[#1e293b]]="activeFilter() === 'wasm'"
            [class.text-cyan-300]="activeFilter() === 'wasm'"
            [class.text-slate-400]="activeFilter() !== 'wasm'"
          >
            WebAssembly
          </button>
          <button
            type="button"
            (click)="activeFilter.set('self-contained')"
            class="px-3 py-1 rounded-md transition-colors"
            [class.bg-[#1e293b]]="activeFilter() === 'self-contained'"
            [class.text-emerald-300]="activeFilter() === 'self-contained'"
            [class.text-slate-400]="activeFilter() !== 'self-contained'"
          >
            Level 1 Autonomous
          </button>
        </div>
      </div>

      <!-- Project Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (project of filteredProjects(); track project.id) {
          <div
            class="p-4 rounded-xl bg-[#0c1017] border transition-all flex flex-col justify-between space-y-4"
            [class.border-cyan-500]="projectStorage.activeProjectId() === project.id"
            [class.border-[#1e293b]]="projectStorage.activeProjectId() !== project.id"
            [class.hover:border-[#334155]]="projectStorage.activeProjectId() !== project.id"
          >
            <div class="space-y-2">
              <div class="flex items-start justify-between gap-2">
                <span
                  class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                  [class.bg-emerald-950]="project.analysis?.selfContainmentLevel === 1"
                  [class.text-emerald-400]="project.analysis?.selfContainmentLevel === 1"
                  [class.bg-amber-950]="project.analysis?.selfContainmentLevel === 2"
                  [class.text-amber-400]="project.analysis?.selfContainmentLevel === 2"
                  [class.bg-rose-950]="project.analysis?.selfContainmentLevel === 3"
                  [class.text-rose-400]="project.analysis?.selfContainmentLevel === 3"
                >
                  LEVEL {{ project.analysis?.selfContainmentLevel || 1 }}
                </span>

                <span class="text-[11px] font-mono text-slate-500">
                  {{ project.files.length }} files
                </span>
              </div>

              <div>
                <h3 class="text-sm font-bold text-white tracking-tight line-clamp-1">{{ project.name }}</h3>
                <p class="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{{ project.description }}</p>
              </div>

              <!-- Tags -->
              <div class="flex items-center gap-1.5 flex-wrap pt-1">
                @for (tag of project.tags; track tag) {
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111722] text-slate-300 border border-[#1e293b]">
                    {{ tag }}
                  </span>
                }
              </div>
            </div>

            <!-- Bottom Actions -->
            <div class="pt-3 border-t border-[#1e293b] flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                @if (projectStorage.activeProjectId() === project.id) {
                  <span class="text-[11px] font-mono text-cyan-400 font-semibold flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Active
                  </span>
                } @else {
                  <button
                    type="button"
                    (click)="projectStorage.setActiveProject(project.id)"
                    class="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-[#111722] hover:bg-[#1e293b] rounded transition-colors"
                  >
                    Select
                  </button>
                }
              </div>

              <div class="flex items-center gap-1">
                <button
                  type="button"
                  (click)="packagingExport.exportPortableZip(project)"
                  class="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors"
                  title="Export Portable ZIP"
                >
                  <mat-icon class="!w-4 !h-4 !text-[16px]">download</mat-icon>
                </button>

                <button
                  type="button"
                  (click)="projectStorage.deleteProject(project.id)"
                  class="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-[#1e293b] transition-colors"
                  title="Delete Project"
                >
                  <mat-icon class="!w-4 !h-4 !text-[16px]">delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Create New Project Modal -->
      @if (showNewModal()) {
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="w-full max-w-md bg-[#0c1017] border border-[#1e293b] rounded-xl p-5 space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h3 class="text-sm font-bold text-white tracking-wide uppercase font-mono">Create New Workload</h3>
              <button type="button" (click)="showNewModal.set(false)" class="text-slate-400 hover:text-white">
                <mat-icon class="!w-4 !h-4 !text-[16px]">close</mat-icon>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label for="new-proj-name" class="block text-slate-400 font-mono mb-1">Project Name</label>
                <input
                  id="new-proj-name"
                  type="text"
                  [value]="newProjectName()"
                  (input)="newProjectName.set($any($event.target).value)"
                  placeholder="e.g. Algorithmic Wasm Engine"
                  class="w-full bg-[#080b10] border border-[#1e293b] text-white px-3 py-2 rounded-lg font-mono outline-none focus:border-cyan-400"
                >
              </div>

              <div>
                <label for="new-proj-desc" class="block text-slate-400 font-mono mb-1">Description</label>
                <textarea
                  id="new-proj-desc"
                  [value]="newProjectDesc()"
                  (input)="newProjectDesc.set($any($event.target).value)"
                  rows="2"
                  placeholder="Brief summary of architecture..."
                  class="w-full bg-[#080b10] border border-[#1e293b] text-white px-3 py-2 rounded-lg font-mono outline-none focus:border-cyan-400 resize-none"
                ></textarea>
              </div>

              <div>
                <label for="new-proj-template" class="block text-slate-400 font-mono mb-1">Runtime Architecture Template</label>
                <select
                  id="new-proj-template"
                  [value]="newProjectTemplate()"
                  (change)="newProjectTemplate.set($any($event.target).value)"
                  class="w-full bg-[#080b10] border border-[#1e293b] text-white px-3 py-2 rounded-lg font-mono outline-none focus:border-cyan-400"
                >
                  <option value="wasm-wat">WebAssembly Text (WAT) Engine</option>
                  <option value="html5">HTML5 Autonomous Local Web</option>
                  <option value="node-ondemand">Node.js On-Demand Microservice (Mode C)</option>
                  <option value="empty">Empty Project</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-[#1e293b]">
              <button
                type="button"
                (click)="showNewModal.set(false)"
                class="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmCreateProject()"
                class="px-4 py-1.5 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
              >
                Initialize Workload
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ProjectManagerView {
  readonly navChange = output<string>();

  readonly projectStorage = inject(ProjectStorage);
  readonly packagingExport = inject(PackagingExport);

  readonly searchQuery = signal<string>('');
  readonly activeFilter = signal<'all' | 'wasm' | 'self-contained'>('all');
  readonly showNewModal = signal<boolean>(false);

  readonly newProjectName = signal<string>('My Autonomous Workload');
  readonly newProjectDesc = signal<string>('Self-contained application running in NONONICK Runtime.');
  readonly newProjectTemplate = signal<'html5' | 'wasm-wat' | 'node-ondemand' | 'empty'>('wasm-wat');

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  filteredProjects() {
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.activeFilter();
    let list = this.projectStorage.projects();

    if (filter === 'wasm') {
      list = list.filter(p => p.runtimeMode === 'mode-b-wasm' || p.analysis?.wasmFeasibility.canCompileToWasm);
    } else if (filter === 'self-contained') {
      list = list.filter(p => p.analysis?.selfContainmentLevel === 1);
    }

    if (query) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    return list;
  }

  confirmCreateProject(): void {
    this.projectStorage.createNewProject(
      this.newProjectName().trim() || 'Untitled Workload',
      this.newProjectDesc().trim(),
      this.newProjectTemplate()
    );
    this.showNewModal.set(false);
  }
}
