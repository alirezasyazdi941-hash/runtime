import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../services/i18n.service';
import { ProjectStorageService } from '../../services/project-storage.service';
import { DeviceAnalyzerService } from '../../services/device-analyzer.service';
import { StudioView } from '../../models/xr.models';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <!-- Hero Banner -->
      <section class="relative overflow-hidden rounded-2xl p-6 lg:p-8 bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-[#170e28] border border-cyan-500/20 shadow-2xl shadow-cyan-950/20">
        <div class="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div class="space-y-3 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              REALITY MASTER AI // ENGINE KERNEL READY
            </div>
            <h1 class="text-2xl lg:text-4xl font-extrabold text-white tracking-tight">
              {{ i18n.t('dash.welcome') }}
            </h1>
            <p class="text-slate-300 text-sm lg:text-base leading-relaxed">
              {{ i18n.t('dash.sub') }}
            </p>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              (click)="showNewProjectModal.set(true)"
              class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all"
            >
              <mat-icon class="text-lg">add_box</mat-icon>
              <span>{{ i18n.t('dash.createProject') }}</span>
            </button>

            <button
              (click)="viewChange.emit('ai-forge')"
              class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#131b2c] hover:bg-[#1a253c] border border-cyan-500/30 text-cyan-300 font-semibold text-sm transition-all"
            >
              <mat-icon class="text-lg text-purple-400">auto_awesome</mat-icon>
              <span>REALITY MASTER AI</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Grid of Quick Studio Launchers -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 3D Studio Card -->
        <button
          (click)="viewChange.emit('3d-workspace')"
          class="p-5 rounded-2xl bg-[#0c1017] hover:bg-[#111722] border border-slate-800 hover:border-cyan-500/50 transition-all text-left flex flex-col justify-between group h-44 shadow-md"
        >
          <div class="flex items-center justify-between w-full">
            <div class="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <mat-icon>view_in_ar</mat-icon>
            </div>
            <span class="text-xs font-mono text-slate-500">Three.js r160+</span>
          </div>
          <div>
            <h3 class="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
              {{ i18n.t('nav.viewport3d') }}
            </h3>
            <p class="text-xs text-slate-400 mt-1 line-clamp-2">
              PBR RoomEnvironment, scene hierarchy, material inspector & GLTF export.
            </p>
          </div>
        </button>

        <!-- AR Studio Card -->
        <button
          (click)="viewChange.emit('ar-studio')"
          class="p-5 rounded-2xl bg-[#0c1017] hover:bg-[#111722] border border-slate-800 hover:border-cyan-500/50 transition-all text-left flex flex-col justify-between group h-44 shadow-md"
        >
          <div class="flex items-center justify-between w-full">
            <div class="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <mat-icon>camera_alt</mat-icon>
            </div>
            <span class="text-xs font-mono text-emerald-400">Surface Reticle</span>
          </div>
          <div>
            <h3 class="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
              {{ i18n.t('nav.arStudio') }}
            </h3>
            <p class="text-xs text-slate-400 mt-1 line-clamp-2">
              Environmental camera passthrough, hit-testing, scaling, and snapshot photos.
            </p>
          </div>
        </button>

        <!-- VR Studio Card -->
        <button
          (click)="viewChange.emit('vr-studio')"
          class="p-5 rounded-2xl bg-[#0c1017] hover:bg-[#111722] border border-slate-800 hover:border-purple-500/50 transition-all text-left flex flex-col justify-between group h-44 shadow-md"
        >
          <div class="flex items-center justify-between w-full">
            <div class="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <mat-icon>vrpano</mat-icon>
            </div>
            <span class="text-xs font-mono text-purple-400">6-DOF Spatial</span>
          </div>
          <div>
            <h3 class="text-base font-bold text-white group-hover:text-purple-400 transition-colors">
              {{ i18n.t('nav.vrStudio') }}
            </h3>
            <p class="text-xs text-slate-400 mt-1 line-clamp-2">
              Dual virtual controllers, teleportation arc, grab physics & 3D HRTF audio.
            </p>
          </div>
        </button>

        <!-- XR Academy Card -->
        <button
          (click)="viewChange.emit('academy')"
          class="p-5 rounded-2xl bg-[#0c1017] hover:bg-[#111722] border border-slate-800 hover:border-amber-500/50 transition-all text-left flex flex-col justify-between group h-44 shadow-md"
        >
          <div class="flex items-center justify-between w-full">
            <div class="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <mat-icon>school</mat-icon>
            </div>
            <span class="text-xs font-mono text-amber-400">18 Lessons</span>
          </div>
          <div>
            <h3 class="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
              {{ i18n.t('nav.academy') }}
            </h3>
            <p class="text-xs text-slate-400 mt-1 line-clamp-2">
              From 3D math and shaders to WebXR and production spatial computing.
            </p>
          </div>
        </button>
      </div>

      <!-- Main Columns: Projects on Left, Hardware Diagnostic on Right -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Projects Column (2 cols) -->
        <div class="lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <mat-icon class="text-cyan-400">folder_special</mat-icon>
              {{ i18n.t('dash.recentProjects') }}
            </h2>
            <button
              (click)="showNewProjectModal.set(true)"
              class="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <mat-icon class="text-sm">add</mat-icon>
              <span>{{ i18n.t('header.newProject') }}</span>
            </button>
          </div>

          <div class="space-y-3">
            @for (proj of projectStorage.projects(); track proj.id) {
              <div
                class="p-4 rounded-xl bg-[#0c1017] border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                [class.border-cyan-500/60]="projectStorage.activeProjectId() === proj.id"
              >
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-white text-sm lg:text-base">{{ proj.name }}</span>
                    @if (projectStorage.activeProjectId() === proj.id) {
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                        ACTIVE
                      </span>
                    }
                  </div>
                  <p class="text-xs text-slate-400 line-clamp-1">{{ proj.description }}</p>
                  <div class="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 font-mono">
                    <span class="text-cyan-400 font-medium">{{ proj.engine }}</span>
                    <span>•</span>
                    <span>{{ proj.targetPlatform }}</span>
                    <span>•</span>
                    <span>v{{ proj.version }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    (click)="selectProject(proj.id)"
                    class="px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all flex items-center gap-1"
                  >
                    <mat-icon class="text-sm">play_arrow</mat-icon>
                    <span>Launch</span>
                  </button>
                  <button
                    (click)="projectStorage.exportStandaloneHTML(proj)"
                    class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                    title="Export HTML"
                  >
                    <mat-icon class="text-sm">download</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Hardware & XR Diagnostics Card (1 col) -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <mat-icon class="text-emerald-400">memory</mat-icon>
              {{ i18n.t('dash.hardwareOverview') }}
            </h2>
            <button
              (click)="deviceAnalyzer.runHardwareDiagnostic()"
              class="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1"
              [class.animate-spin]="deviceAnalyzer.isScanning()"
            >
              <mat-icon class="text-sm">refresh</mat-icon>
            </button>
          </div>

          <div class="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-4">
            <!-- Score Meter -->
            <div class="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <span class="text-xs text-slate-400">Compatibility Rating</span>
                <p class="text-2xl font-black text-emerald-400 font-mono">
                  {{ deviceAnalyzer.report().compatibilityScore }} / 100
                </p>
              </div>
              <div class="text-right">
                <span class="text-xs text-slate-400">Device Target</span>
                <p class="text-sm font-bold text-white font-mono">
                  {{ deviceAnalyzer.report().deviceType }}
                </p>
              </div>
            </div>

            <!-- Diagnostics List -->
            <div class="space-y-2.5 text-xs font-mono">
              <div class="flex justify-between items-center text-slate-300">
                <span class="text-slate-400">WebGL 2.0:</span>
                <span [class.text-emerald-400]="deviceAnalyzer.report().webgl2Supported" [class.text-amber-400]="!deviceAnalyzer.report().webgl2Supported">
                  {{ deviceAnalyzer.report().webgl2Supported ? 'Supported' : 'Disabled' }}
                </span>
              </div>
              <div class="flex justify-between items-center text-slate-300">
                <span class="text-slate-400">WebXR Device API:</span>
                <span [class.text-emerald-400]="deviceAnalyzer.report().webxrSupported" [class.text-slate-500]="!deviceAnalyzer.report().webxrSupported">
                  {{ deviceAnalyzer.report().webxrSupported ? 'Available' : 'Emulated' }}
                </span>
              </div>
              <div class="flex justify-between items-center text-slate-300">
                <span class="text-slate-400">GPU Renderer:</span>
                <span class="text-slate-300 truncate max-w-[150px]" [title]="deviceAnalyzer.report().gpuRenderer">
                  {{ deviceAnalyzer.report().gpuRenderer }}
                </span>
              </div>
              <div class="flex justify-between items-center text-slate-300">
                <span class="text-slate-400">Max Texture:</span>
                <span class="text-cyan-400 font-bold">{{ deviceAnalyzer.report().maxTextureSize }} px</span>
              </div>
              <div class="flex justify-between items-center text-slate-300">
                <span class="text-slate-400">Sensors (Gyro/Accel):</span>
                <span [class.text-emerald-400]="deviceAnalyzer.report().gyroscopeAvailable" [class.text-slate-500]="!deviceAnalyzer.report().gyroscopeAvailable">
                  {{ deviceAnalyzer.report().gyroscopeAvailable ? 'Ready' : 'Desktop / None' }}
                </span>
              </div>
            </div>

            <!-- Notes -->
            <div class="pt-2 border-t border-slate-800/60">
              <p class="text-[11px] text-slate-400 leading-relaxed">
                {{ deviceAnalyzer.report().notes[0] || 'Hardware diagnostic ready.' }}
              </p>
            </div>

            <button
              (click)="viewChange.emit('qa-test')"
              class="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <mat-icon class="text-sm text-emerald-400">verified</mat-icon>
              <span>Run Automated QA Suite</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Project Modal -->
    @if (showNewProjectModal()) {
      <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-[#0c121d] border border-cyan-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <mat-icon class="text-cyan-400">create_new_folder</mat-icon>
              {{ i18n.t('dash.createProject') }}
            </h3>
            <button (click)="showNewProjectModal.set(false)" class="text-slate-400 hover:text-white">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label for="projNameInput" class="block text-xs font-medium text-slate-300 mb-1">Project Name</label>
              <input
                id="projNameInput"
                #nameInput
                type="text"
                placeholder="e.g. Spatial Medical Simulation"
                class="w-full bg-[#131b2a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label for="projPlatformInput" class="block text-xs font-medium text-slate-300 mb-1">Target Platform</label>
              <select id="projPlatformInput" #platformInput class="w-full bg-[#131b2a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400">
                <option value="WebXR (All Devices)">WebXR (Universal Browsers & Headsets)</option>
                <option value="Meta Quest / Vision Pro">Meta Quest & Apple Vision Pro</option>
                <option value="iOS (ARKit/Safari)">iOS (Safari / ARKit USDZ)</option>
                <option value="Android (ARCore)">Android (Chrome ARCore)</option>
              </select>
            </div>

            <div>
              <label for="projEngineInput" class="block text-xs font-medium text-slate-300 mb-1">Primary Engine</label>
              <select id="projEngineInput" #engineInput class="w-full bg-[#131b2a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400">
                <option value="Three.js">Three.js (WebGL2 / WebXR)</option>
                <option value="WebXR">Native WebXR Device API</option>
                <option value="Unity-OpenXR">Unity OpenXR Specification</option>
              </select>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              (click)="showNewProjectModal.set(false)"
              class="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              (click)="createNewProject(nameInput.value, platformInput.value, engineInput.value)"
              class="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold"
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DashboardComponent {
  i18n = inject(I18nService);
  projectStorage = inject(ProjectStorageService);
  deviceAnalyzer = inject(DeviceAnalyzerService);

  viewChange = output<StudioView>();
  showNewProjectModal = signal<boolean>(false);

  selectProject(id: string) {
    this.projectStorage.setActiveProject(id);
    this.viewChange.emit('3d-workspace');
  }

  createNewProject(name: string, platform: string, engine: string) {
    if (!name.trim()) name = 'New Spatial Project';
    this.projectStorage.createProject({
      name,
      targetPlatform: platform as 'WebXR (All Devices)',
      engine: engine as 'Three.js',
    });
    this.showNewProjectModal.set(false);
    this.viewChange.emit('3d-workspace');
  }
}
