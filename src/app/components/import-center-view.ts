import { ChangeDetectionStrategy, Component, signal, output, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProjectStorage } from '../services/project-storage';
import { SAMPLE_PROJECTS } from '../services/sample-projects';
import { Project } from '../models/project.model';

@Component({
  selector: 'app-import-center-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      <div class="border-b border-[#1e293b] pb-4">
        <h1 class="text-xl font-bold text-white tracking-tight">Universal Input Engine</h1>
        <p class="text-xs text-slate-400 mt-0.5">
          Ingest ZIP packages, folders, single files, or load reference benchmark suites. Original source files are preserved verbatim.
        </p>
      </div>

      <!-- Drag & Drop Zone -->
      <div
        (dragover)="$event.preventDefault(); isDragging.set(true)"
        (dragleave)="isDragging.set(false)"
        (drop)="onFileDrop($event)"
        class="border-2 border-dashed rounded-2xl p-8 text-center transition-all bg-[#0c1017]/50 flex flex-col items-center justify-center space-y-4"
        [class.border-cyan-400]="isDragging()"
        [class.bg-cyan-950/20]="isDragging()"
        [class.border-[#1e293b]]="!isDragging()"
      >
        <div class="w-12 h-12 rounded-xl bg-[#111722] border border-[#1e293b] flex items-center justify-center text-cyan-400 shadow-inner">
          <mat-icon class="!w-6 !h-6 !text-[24px]">cloud_upload</mat-icon>
        </div>

        <div class="max-w-md">
          <h3 class="text-sm font-bold text-white tracking-wide uppercase font-mono">Drag &amp; Drop Software Package</h3>
          <p class="text-xs text-slate-400 mt-1">
            Accepts <span class="text-cyan-300 font-mono">.zip</span> archives, uncompressed source trees, or individual files (HTML, JS, TS, Rust, C/C++, Python, WAT, WASM).
          </p>
        </div>

        <div class="flex items-center gap-3 flex-wrap justify-center pt-2">
          <!-- ZIP Upload -->
          <label class="px-4 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg cursor-pointer transition-colors shadow-sm flex items-center gap-1.5">
            <mat-icon class="!w-4 !h-4 !text-[16px]">folder_zip</mat-icon>
            <span>Import ZIP Archive</span>
            <input type="file" accept=".zip" (change)="onZipSelected($event)" class="hidden">
          </label>

          <!-- Folder Upload -->
          <label class="px-4 py-2 text-xs font-medium text-slate-200 bg-[#162032] hover:bg-[#1e293b] border border-[#334155] rounded-lg cursor-pointer transition-colors flex items-center gap-1.5">
            <mat-icon class="!w-4 !h-4 !text-[16px]">folder</mat-icon>
            <span>Import Project Folder</span>
            <input type="file" webkitdirectory directory multiple (change)="onFolderSelected($event)" class="hidden">
          </label>
        </div>

        @if (statusMessage()) {
          <div class="text-xs font-mono text-cyan-400 mt-2 bg-[#080b10] px-3 py-1.5 rounded border border-[#1e293b]">
            {{ statusMessage() }}
          </div>
        }
      </div>

      <!-- Curated Architectural Benchmark Presets -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-white tracking-wide uppercase font-mono">Reference Benchmark Presets</h3>
          <span class="text-xs text-slate-500 font-mono">Real-world production test cases</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (sample of samplePresets; track sample.id) {
            <div class="p-4 rounded-xl bg-[#0c1017] border border-[#1e293b] flex flex-col justify-between space-y-3 hover:border-[#334155] transition-all">
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span
                    class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                    [class.bg-emerald-950]="sample.tags.includes('Level 1')"
                    [class.text-emerald-400]="sample.tags.includes('Level 1')"
                    [class.bg-amber-950]="sample.tags.includes('Level 2')"
                    [class.text-amber-400]="sample.tags.includes('Level 2')"
                  >
                    {{ sample.tags[0] }}
                  </span>
                  <span class="text-[10px] font-mono text-cyan-400 uppercase">{{ sample.runtimeMode.replace('mode-', '') }}</span>
                </div>
                <h4 class="text-xs font-bold text-white tracking-tight">{{ sample.name }}</h4>
                <p class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{{ sample.description }}</p>
              </div>

              <div class="pt-2 border-t border-[#1e293b] flex items-center justify-between">
                <span class="text-[10px] font-mono text-slate-500">{{ sample.files.length }} files</span>
                <button
                  type="button"
                  (click)="loadPreset(sample)"
                  class="px-2.5 py-1 text-xs font-medium text-cyan-300 hover:text-white bg-[#111722] hover:bg-[#1e293b] rounded transition-colors flex items-center gap-1"
                >
                  <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">file_download</mat-icon>
                  <span>Load Workload</span>
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ImportCenterView {
  readonly navChange = output<string>();

  readonly projectStorage = inject(ProjectStorage);
  readonly isDragging = signal<boolean>(false);
  readonly statusMessage = signal<string>('');

  readonly samplePresets = SAMPLE_PROJECTS;

  async onFileDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    if (files.length === 1 && files[0].name.endsWith('.zip')) {
      await this.processZip(files[0]);
    } else {
      await this.processFileList(files);
    }
  }

  async onZipSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      await this.processZip(input.files[0]);
    }
  }

  async onFolderSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      await this.processFileList(input.files);
    }
  }

  private async processZip(file: File): Promise<void> {
    this.statusMessage.set(`Extracting ZIP package "${file.name}"...`);
    try {
      const p = await this.projectStorage.importZipFile(file);
      this.statusMessage.set(`Successfully imported "${p.name}" (${p.files.length} files).`);
      setTimeout(() => this.navChange.emit('analyzer'), 500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.statusMessage.set(`ZIP import failed: ${msg}`);
    }
  }

  private async processFileList(files: FileList): Promise<void> {
    this.statusMessage.set(`Importing ${files.length} project files...`);
    try {
      const p = await this.projectStorage.importFolderFiles(files);
      this.statusMessage.set(`Successfully imported "${p.name}" (${p.files.length} files).`);
      setTimeout(() => this.navChange.emit('analyzer'), 500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.statusMessage.set(`Folder import failed: ${msg}`);
    }
  }

  loadPreset(sample: Project): void {
    // Check if already in projects list
    const existing = this.projectStorage.projects().find(p => p.id === sample.id);
    if (existing) {
      this.projectStorage.setActiveProject(existing.id);
    } else {
      this.projectStorage.projects.update(list => [sample, ...list]);
      this.projectStorage.setActiveProject(sample.id);
    }
    this.navChange.emit('dashboard');
  }
}
