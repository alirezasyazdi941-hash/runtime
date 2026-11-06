import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProjectStorage } from '../services/project-storage';

@Component({
  selector: 'app-code-editor-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="h-full flex flex-row bg-[#080b10] overflow-hidden">
      <!-- Left File Explorer -->
      <div class="w-60 border-r border-[#1e293b] bg-[#0c1017] flex flex-col shrink-0">
        <!-- Header -->
        <div class="h-10 border-b border-[#1e293b] px-3 flex items-center justify-between">
          <span class="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-400">Project Files</span>
          <button
            type="button"
            (click)="showNewFileDialog.set(true)"
            class="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1e293b] transition-colors"
            title="Create New File"
          >
            <mat-icon class="!w-4 !h-4 !text-[16px]">note_add</mat-icon>
          </button>
        </div>

        <!-- Files list -->
        <div class="flex-1 overflow-y-auto p-2 space-y-0.5">
          @if (projectStorage.activeProject(); as proj) {
            @for (file of proj.files; track file.path) {
              <div
                class="group w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono transition-colors"
                [class.bg-[#1e293b]]="projectStorage.activeFile()?.path === file.path"
                [class.text-cyan-300]="projectStorage.activeFile()?.path === file.path"
                [class.text-slate-400]="projectStorage.activeFile()?.path !== file.path"
                [class.hover:text-slate-200]="projectStorage.activeFile()?.path !== file.path"
                [class.hover:bg-[#111722]]="projectStorage.activeFile()?.path !== file.path"
              >
                <button
                  type="button"
                  (click)="selectFile(file.path)"
                  class="flex items-center gap-2 truncate text-left flex-1 cursor-pointer"
                >
                  <mat-icon class="!w-3.5 !h-3.5 !text-[14px] shrink-0" [class.text-amber-400]="file.name.endsWith('.js')" [class.text-purple-400]="file.name.endsWith('.wat')" [class.text-orange-400]="file.name.endsWith('.html')">
                    description
                  </mat-icon>
                  <span class="truncate">{{ file.path }}</span>
                </button>

                <button
                  type="button"
                  (click)="onDeleteFile(file.path)"
                  class="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 transition-opacity shrink-0"
                  title="Delete File"
                >
                  <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">close</mat-icon>
                </button>
              </div>
            }
          }
        </div>
      </div>

      <!-- Right Code Viewport -->
      <div class="flex-1 flex flex-col min-w-0 bg-[#080b10]">
        @if (projectStorage.activeFile(); as file) {
          <!-- Tab & Action Bar -->
          <div class="h-10 border-b border-[#1e293b] bg-[#0c1017] px-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono text-cyan-300 font-semibold">{{ file.path }}</span>
              <span class="text-[10px] font-mono text-slate-500">({{ file.sizeBytes }} bytes · {{ file.language.toUpperCase() }})</span>
              @if (hasUnsavedChanges()) {
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400" title="Modified"></span>
              }
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="saveActiveFile()"
                class="px-3 py-1 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded transition-colors flex items-center gap-1 shadow-sm"
              >
                <mat-icon class="!w-3.5 !h-3.5 !text-[14px]">save</mat-icon>
                <span>Save File</span>
              </button>
            </div>
          </div>

          <!-- Editor Body with Line Numbers -->
          <div class="flex-1 flex overflow-hidden">
            <!-- Line numbers gutter -->
            <div class="w-12 bg-[#0c1017] border-r border-[#1e293b] py-3 text-right pr-3 font-mono text-[11px] text-slate-600 select-none overflow-hidden leading-5">
              @for (n of lineNumbers(); track n) {
                <div>{{ n }}</div>
              }
            </div>

            <!-- Code Textarea -->
            <textarea
              #codeArea
              [value]="editorContent()"
              (input)="onEditorInput($event)"
              (keydown.tab)="onTabPress($event)"
              class="flex-1 bg-[#080b10] text-slate-200 p-3 font-mono text-xs outline-none border-none resize-none leading-5 font-mono-numbers selection:bg-cyan-500/30 selection:text-cyan-100"
              spellcheck="false"
            ></textarea>
          </div>
        } @else {
          <div class="flex-1 flex items-center justify-center text-xs font-mono text-slate-500">
            Select a file from the explorer to begin editing.
          </div>
        }
      </div>

      <!-- New File Dialog Modal -->
      @if (showNewFileDialog()) {
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="w-full max-w-sm bg-[#0c1017] border border-[#1e293b] rounded-xl p-4 space-y-3">
            <h3 class="text-xs font-bold font-mono tracking-wider uppercase text-white">Add New Project File</h3>
            <input
              type="text"
              [value]="newFilePath()"
              (input)="newFilePath.set($any($event.target).value)"
              placeholder="e.g. src/kernel.wat or styles.css"
              class="w-full bg-[#080b10] border border-[#1e293b] text-white px-3 py-2 rounded text-xs font-mono outline-none focus:border-cyan-400"
            >
            <div class="flex items-center justify-end gap-2 pt-2 border-t border-[#1e293b]">
              <button
                type="button"
                (click)="showNewFileDialog.set(false)"
                class="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmCreateFile()"
                class="px-3 py-1 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded"
              >
                Add File
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CodeEditorView {
  readonly projectStorage = inject(ProjectStorage);

  readonly editorContent = signal<string>('');
  readonly hasUnsavedChanges = signal<boolean>(false);
  readonly showNewFileDialog = signal<boolean>(false);
  readonly newFilePath = signal<string>('src/algorithm.wat');

  private currentFilePath = '';

  constructor() {
    const f = this.projectStorage.activeFile();
    if (f) {
      this.editorContent.set(f.content);
      this.currentFilePath = f.path;
    }
  }

  readonly lineNumbers = computed(() => {
    const lines = this.editorContent().split('\n').length;
    return Array.from({ length: Math.max(1, lines) }, (_, i) => i + 1);
  });

  selectFile(path: string): void {
    if (this.hasUnsavedChanges()) {
      this.saveActiveFile();
    }
    this.projectStorage.setActiveFile(path);
    const f = this.projectStorage.activeFile();
    if (f) {
      this.editorContent.set(f.content);
      this.currentFilePath = f.path;
      this.hasUnsavedChanges.set(false);
    }
  }

  onEditorInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.editorContent.set(val);
    this.hasUnsavedChanges.set(true);
  }

  onTabPress(event: Event): void {
    event.preventDefault();
    const textarea = event.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    textarea.value = val.substring(0, start) + '  ' + val.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + 2;
    this.editorContent.set(textarea.value);
    this.hasUnsavedChanges.set(true);
  }

  saveActiveFile(): void {
    const f = this.projectStorage.activeFile();
    if (f) {
      this.projectStorage.updateFileContent(f.path, this.editorContent());
      this.hasUnsavedChanges.set(false);
    }
  }

  onDeleteFile(path: string): void {
    if (confirm(`Delete file "${path}"?`)) {
      this.projectStorage.deleteFile(path);
      const next = this.projectStorage.activeFile();
      if (next) {
        this.editorContent.set(next.content);
        this.currentFilePath = next.path;
      }
    }
  }

  confirmCreateFile(): void {
    const path = this.newFilePath().trim();
    if (path) {
      this.projectStorage.addFileToActiveProject(path, '');
      this.showNewFileDialog.set(false);
      this.selectFile(path);
    }
  }
}
