import { Injectable, signal, computed, inject } from '@angular/core';
import JSZip from 'jszip';
import { Project, ProjectFile } from '../models/project.model';
import { SAMPLE_PROJECTS } from './sample-projects';
import { AnalysisEngine } from './analysis-engine';
import { WasmCompiler } from './wasm-compiler';

@Injectable({
  providedIn: 'root'
})
export class ProjectStorage {
  private readonly analysisEngine = inject(AnalysisEngine);
  private readonly wasmCompiler = inject(WasmCompiler);

  private readonly STORAGE_KEY = 'nononick_projects_v1';
  private readonly ACTIVE_ID_KEY = 'nononick_active_project_id';

  readonly projects = signal<Project[]>([]);
  readonly activeProjectId = signal<string>('');

  readonly activeProject = computed(() => {
    const list = this.projects();
    const id = this.activeProjectId();
    return list.find(p => p.id === id) || list[0] || null;
  });

  readonly activeFile = computed<ProjectFile | null>(() => {
    const proj = this.activeProject();
    if (!proj || !proj.files.length) return null;
    if (proj.activeFilePath) {
      const found = proj.files.find(f => f.path === proj.activeFilePath);
      if (found) return found;
    }
    // Default to index.html or first file
    return proj.files.find(f => f.path.endsWith('.html')) || proj.files[0];
  });

  constructor() {
    this.initStorage();
  }

  private initStorage(): void {
    let initialList: Project[] = [];

    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            initialList = parsed;
          }
        }
      } catch (e) {
        console.warn('[STORAGE] Local storage load error, resetting to defaults', e);
      }
    }

    if (initialList.length === 0) {
      // Seed with deep benchmark projects
      initialList = [...SAMPLE_PROJECTS];
    }

    // Run deep architectural analysis & WASM compilation on initial projects
    for (const p of initialList) {
      if (!p.analysis) {
        p.analysis = this.analysisEngine.analyzeProject(p);
      }
      if (!p.wasmBytecode && p.analysis.wasmFeasibility.canCompileToWasm) {
        const watFile = p.files.find(f => f.path.endsWith('.wat'));
        if (watFile) {
          const compiled = this.wasmCompiler.compileWat(watFile.content);
          p.wasmBytecode = compiled.bytes;
        }
      }
    }

    this.projects.set(initialList);

    // Set initial active project
    let activeId = '';
    if (typeof localStorage !== 'undefined') {
      activeId = localStorage.getItem(this.ACTIVE_ID_KEY) || '';
    }
    if (!activeId || !initialList.some(p => p.id === activeId)) {
      activeId = initialList[0]?.id || '';
    }
    this.activeProjectId.set(activeId);
  }

  private persist(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        // Strip out large Uint8Array from localstorage stringify to avoid quota exceptions, keep raw text
        const serializable = this.projects().map(p => ({
          ...p,
          wasmBytecode: undefined
        }));
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializable));
        localStorage.setItem(this.ACTIVE_ID_KEY, this.activeProjectId());
      } catch (e) {
        console.warn('[STORAGE] Persist error', e);
      }
    }
  }

  setActiveProject(id: string): void {
    this.activeProjectId.set(id);
    this.persist();
  }

  setActiveFile(path: string): void {
    const curr = this.activeProject();
    if (!curr) return;

    this.projects.update(list =>
      list.map(p => (p.id === curr.id ? { ...p, activeFilePath: path } : p))
    );
  }

  updateFileContent(path: string, newContent: string): void {
    const curr = this.activeProject();
    if (!curr) return;

    const updatedFiles = curr.files.map(f => {
      if (f.path === path) {
        return {
          ...f,
          content: newContent,
          sizeBytes: newContent.length
        };
      }
      return f;
    });

    const updatedProject: Project = {
      ...curr,
      files: updatedFiles,
      updatedAt: Date.now()
    };

    // Re-run analysis
    updatedProject.analysis = this.analysisEngine.analyzeProject(updatedProject);

    // If WAT file edited, recompile WASM
    if (path.endsWith('.wat')) {
      const compiled = this.wasmCompiler.compileWat(newContent);
      updatedProject.wasmBytecode = compiled.bytes;
    }

    this.projects.update(list =>
      list.map(p => (p.id === curr.id ? updatedProject : p))
    );
    this.persist();
  }

  addFileToActiveProject(path: string, initialContent = ''): void {
    const curr = this.activeProject();
    if (!curr) return;

    const ext = path.split('.').pop()?.toLowerCase() || '';
    const newFile: ProjectFile = {
      path,
      name: path.split('/').pop() || path,
      content: initialContent,
      language: ext,
      sizeBytes: initialContent.length
    };

    const updatedProject: Project = {
      ...curr,
      files: [...curr.files.filter(f => f.path !== path), newFile],
      activeFilePath: path,
      updatedAt: Date.now()
    };

    updatedProject.analysis = this.analysisEngine.analyzeProject(updatedProject);

    this.projects.update(list =>
      list.map(p => (p.id === curr.id ? updatedProject : p))
    );
    this.persist();
  }

  deleteFile(path: string): void {
    const curr = this.activeProject();
    if (!curr) return;

    const filtered = curr.files.filter(f => f.path !== path);
    const updatedProject: Project = {
      ...curr,
      files: filtered,
      activeFilePath: filtered[0]?.path,
      updatedAt: Date.now()
    };
    updatedProject.analysis = this.analysisEngine.analyzeProject(updatedProject);

    this.projects.update(list =>
      list.map(p => (p.id === curr.id ? updatedProject : p))
    );
    this.persist();
  }

  createNewProject(name: string, description: string, templateType: 'html5' | 'wasm-wat' | 'node-ondemand' | 'empty'): Project {
    const id = 'proj_' + Math.random().toString(36).substring(2, 9);
    let files: ProjectFile[] = [];

    if (templateType === 'html5') {
      files = [
        {
          path: 'index.html',
          name: 'index.html',
          language: 'html',
          sizeBytes: 420,
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${name}</title>
  <style>
    body { background: #080b10; color: #f8fafc; font-family: -apple-system, monospace; padding: 32px; }
    h1 { color: #38bdf8; font-size: 20px; }
  </style>
</head>
<body>
  <h1>${name}</h1>
  <p>Self-contained application running in NONONICK Runtime.</p>
</body>
</html>`
        }
      ];
    } else if (templateType === 'wasm-wat') {
      files = [
        {
          path: 'src/math.wat',
          name: 'math.wat',
          language: 'wat',
          sizeBytes: 310,
          content: `(module
  (func $add (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add
  )
  (export "add" (func $add))
)`
        },
        {
          path: 'index.html',
          name: 'index.html',
          language: 'html',
          sizeBytes: 600,
          content: `<!DOCTYPE html>
<html>
<head><title>${name}</title></head>
<body style="background:#080b10;color:#38bdf8;font-family:monospace;padding:24px;">
  <h2>${name} (WASM Execution)</h2>
  <div id="out">Compiling WebAssembly...</div>
</body>
</html>`
        }
      ];
    } else if (templateType === 'node-ondemand') {
      files = [
        {
          path: 'server.js',
          name: 'server.js',
          language: 'javascript',
          sizeBytes: 400,
          content: `console.log("[SERVER] Ephemeral server worker active.");
function process(input) {
  return { status: "OK", timestamp: Date.now(), input };
}
return process({ requested: true });`
        },
        {
          path: 'package.json',
          name: 'package.json',
          language: 'json',
          sizeBytes: 150,
          content: `{\n  "name": "${name.toLowerCase().replace(/\\s+/g, '-')}",\n  "main": "server.js"\n}`
        }
      ];
    }

    const newProject: Project = {
      id,
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      files,
      activeFilePath: files[0]?.path,
      runtimeMode: templateType === 'wasm-wat' ? 'mode-b-wasm' : templateType === 'node-ondemand' ? 'mode-c-server' : 'mode-a-web',
      tags: ['Custom', templateType.toUpperCase()]
    };

    newProject.analysis = this.analysisEngine.analyzeProject(newProject);
    if (templateType === 'wasm-wat') {
      const compiled = this.wasmCompiler.compileWat(files[0].content);
      newProject.wasmBytecode = compiled.bytes;
    }

    this.projects.update(list => [newProject, ...list]);
    this.activeProjectId.set(id);
    this.persist();
    return newProject;
  }

  async importZipFile(file: File): Promise<Project> {
    const zip = await JSZip.loadAsync(file);
    const files: ProjectFile[] = [];

    const fileEntries = Object.entries(zip.files);
    for (const [relativePath, zipEntry] of fileEntries) {
      if (zipEntry.dir) continue;
      // skip git metadata and OS cruft
      if (relativePath.includes('__MACOSX') || relativePath.includes('.git/')) continue;

      const ext = relativePath.split('.').pop()?.toLowerCase() || '';
      const isBin = ['wasm', 'png', 'jpg', 'jpeg', 'webp', 'ico', 'woff', 'woff2', 'ttf'].includes(ext);

      if (isBin) {
        const binData = await zipEntry.async('uint8array');
        files.push({
          path: relativePath,
          name: relativePath.split('/').pop() || relativePath,
          content: '',
          language: ext,
          sizeBytes: binData.byteLength,
          isBinary: true,
          binaryData: binData
        });
      } else {
        const textContent = await zipEntry.async('string');
        files.push({
          path: relativePath,
          name: relativePath.split('/').pop() || relativePath,
          content: textContent,
          language: ext,
          sizeBytes: textContent.length,
          isBinary: false
        });
      }
    }

    const projectName = file.name.replace(/\.zip$/i, '') || 'Imported Archive';
    const id = 'proj_' + Math.random().toString(36).substring(2, 9);

    const project: Project = {
      id,
      name: projectName,
      description: `Imported from ZIP archive (${file.name}) containing ${files.length} files.`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      files,
      activeFilePath: files.find(f => f.path.endsWith('.html'))?.path || files[0]?.path,
      runtimeMode: 'mode-a-web',
      tags: ['ZIP Import', 'Preserved Source']
    };

    project.analysis = this.analysisEngine.analyzeProject(project);

    // Check for WAT/WASM
    const watFile = files.find(f => f.path.endsWith('.wat'));
    if (watFile) {
      const compiled = this.wasmCompiler.compileWat(watFile.content);
      project.wasmBytecode = compiled.bytes;
      project.runtimeMode = 'mode-b-wasm';
    } else if (project.analysis.serverRequirements.requiresServer) {
      project.runtimeMode = 'mode-c-server';
    }

    this.projects.update(list => [project, ...list]);
    this.activeProjectId.set(id);
    this.persist();
    return project;
  }

  async importFolderFiles(fileList: FileList): Promise<Project> {
    const files: ProjectFile[] = [];
    const filesArray = Array.from(fileList);

    for (const f of filesArray) {
      // relative path from webkitRelativePath
      const fileWithRelative = f as File & { webkitRelativePath?: string };
      const path = fileWithRelative.webkitRelativePath || f.name;
      const ext = path.split('.').pop()?.toLowerCase() || '';
      const isBin = ['wasm', 'png', 'jpg', 'jpeg', 'webp', 'ico'].includes(ext);

      if (isBin) {
        const buf = await f.arrayBuffer();
        const binData = new Uint8Array(buf);
        files.push({
          path,
          name: f.name,
          content: '',
          language: ext,
          sizeBytes: binData.byteLength,
          isBinary: true,
          binaryData: binData
        });
      } else {
        const text = await f.text();
        files.push({
          path,
          name: f.name,
          content: text,
          language: ext,
          sizeBytes: text.length,
          isBinary: false
        });
      }
    }

    const firstFileWithRelative = filesArray[0] as (File & { webkitRelativePath?: string }) | undefined;
    const folderName = firstFileWithRelative?.webkitRelativePath
      ? firstFileWithRelative.webkitRelativePath.split('/')[0]
      : 'Imported Project';

    const id = 'proj_' + Math.random().toString(36).substring(2, 9);
    const project: Project = {
      id,
      name: folderName,
      description: `Imported from local project directory with ${files.length} files.`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      files,
      activeFilePath: files.find(f => f.path.endsWith('.html'))?.path || files[0]?.path,
      runtimeMode: 'mode-a-web',
      tags: ['Directory Import']
    };

    project.analysis = this.analysisEngine.analyzeProject(project);

    if (project.analysis.serverRequirements.requiresServer) {
      project.runtimeMode = 'mode-c-server';
    } else if (project.analysis.wasmFeasibility.canCompileToWasm) {
      project.runtimeMode = 'mode-b-wasm';
    }

    this.projects.update(list => [project, ...list]);
    this.activeProjectId.set(id);
    this.persist();
    return project;
  }

  deleteProject(id: string): void {
    const remaining = this.projects().filter(p => p.id !== id);
    if (remaining.length === 0) {
      // Re-seed with samples if empty
      this.projects.set([...SAMPLE_PROJECTS]);
      this.activeProjectId.set(SAMPLE_PROJECTS[0].id);
    } else {
      this.projects.set(remaining);
      if (this.activeProjectId() === id) {
        this.activeProjectId.set(remaining[0].id);
      }
    }
    this.persist();
  }

  resetToDefaultSamples(): void {
    this.projects.set([...SAMPLE_PROJECTS]);
    this.activeProjectId.set(SAMPLE_PROJECTS[0].id);
    this.persist();
  }
}
