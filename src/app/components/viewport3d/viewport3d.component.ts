import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ThreeEngineService } from '../../services/three-engine.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-viewport3d',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="relative w-full h-[calc(100vh-65px)] bg-[#06070a] overflow-hidden select-none flex flex-col">
      <!-- Top Floating Viewport Toolbar -->
      <div class="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-[#0c1017]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-xs shadow-xl">
        <!-- Camera Toggle -->
        <div class="flex items-center bg-[#131924] rounded-lg p-0.5 border border-slate-700">
          <button
            (click)="setCameraMode('perspective')"
            [class.bg-cyan-500]="engine.cameraMode() === 'perspective'"
            [class.text-black]="engine.cameraMode() === 'perspective'"
            [class.text-slate-300]="engine.cameraMode() !== 'perspective'"
            class="px-2.5 py-1 rounded-md font-semibold transition-all"
          >
            {{ i18n.t('vp.perspective') }}
          </button>
          <button
            (click)="setCameraMode('orthographic')"
            [class.bg-cyan-500]="engine.cameraMode() === 'orthographic'"
            [class.text-black]="engine.cameraMode() === 'orthographic'"
            [class.text-slate-300]="engine.cameraMode() !== 'orthographic'"
            class="px-2.5 py-1 rounded-md font-semibold transition-all"
          >
            {{ i18n.t('vp.orthographic') }}
          </button>
        </div>

        <div class="h-4 w-[1px] bg-slate-700 mx-1"></div>

        <!-- Camera Angles -->
        <button (click)="engine.setCameraAngle('iso')" class="p-1.5 rounded-lg bg-[#131924] hover:bg-slate-700 text-slate-200" title="Isometric View">
          <mat-icon class="text-sm">view_in_ar</mat-icon>
        </button>
        <button (click)="engine.setCameraAngle('top')" class="p-1.5 rounded-lg bg-[#131924] hover:bg-slate-700 text-slate-200" title="Top View">
          <mat-icon class="text-sm">vertical_align_top</mat-icon>
        </button>
        <button (click)="engine.setCameraAngle('front')" class="p-1.5 rounded-lg bg-[#131924] hover:bg-slate-700 text-slate-200" title="Front View">
          <mat-icon class="text-sm">crop_portrait</mat-icon>
        </button>

        <div class="h-4 w-[1px] bg-slate-700 mx-1"></div>

        <!-- Helper Toggles -->
        <button
          (click)="toggleGrid()"
          [class.text-cyan-400]="gridEnabled()"
          [class.text-slate-400]="!gridEnabled()"
          class="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#131924] hover:bg-slate-700 font-medium"
        >
          <mat-icon class="text-sm">grid_on</mat-icon>
          <span>Grid</span>
        </button>

        <button
          (click)="toggleAxes()"
          [class.text-cyan-400]="axesEnabled()"
          [class.text-slate-400]="!axesEnabled()"
          class="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#131924] hover:bg-slate-700 font-medium"
        >
          <mat-icon class="text-sm">straighten</mat-icon>
          <span>Axes</span>
        </button>

        <!-- FPS & Stats -->
        <div class="flex items-center gap-2 pl-2 font-mono text-[11px] text-slate-400">
          <span class="text-emerald-400 font-bold">{{ engine.fps() }} FPS</span>
          <span>•</span>
          <span>{{ engine.drawCalls() }} Calls</span>
          <span>•</span>
          <span>{{ engine.triangles() }} Tris</span>
        </div>
      </div>

      <!-- Top Right Floating Action: Import & Export GLB -->
      <div class="absolute top-4 right-4 z-20 flex items-center gap-2">
        <!-- Hidden file input for loading .glb -->
        <input #fileInput type="file" accept=".glb,.gltf" (change)="onFileSelected($event)" class="hidden" />

        <button
          (click)="fileInput.click()"
          class="px-3 py-1.5 rounded-xl bg-[#0c1017]/90 hover:bg-[#131a26] backdrop-blur-md border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all"
        >
          <mat-icon class="text-sm text-cyan-400">upload_file</mat-icon>
          <span>{{ i18n.t('vp.importFile') }}</span>
        </button>

        <button
          (click)="exportGLB()"
          [disabled]="isExporting()"
          class="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
        >
          <mat-icon class="text-sm">download</mat-icon>
          <span>{{ isExporting() ? 'Exporting...' : i18n.t('vp.exportGlb') }}</span>
        </button>

        <!-- Side Panels Toggle -->
        <button
          (click)="toggleSidebar()"
          class="p-2 rounded-xl bg-[#0c1017]/90 hover:bg-[#131a26] border border-slate-700 text-slate-200 shadow-lg"
          title="Toggle Hierarchy & Material Inspector"
        >
          <mat-icon class="text-base">{{ showSidebar() ? 'menu_open' : 'menu' }}</mat-icon>
        </button>
      </div>

      <!-- Main Canvas Container -->
      <div #canvasContainer class="w-full h-full cursor-grab active:cursor-grabbing"></div>

      <!-- Ergonomic Bottom Dock (Zero Viewport Occlusion, as requested by Three.js skill) -->
      <div class="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-4xl">
        <!-- Toggle button on top of dock -->
        <div class="flex justify-center mb-1">
          <button
            (click)="toggleDock()"
            class="px-3 py-0.5 rounded-t-lg bg-[#0c1017]/95 border border-b-0 border-slate-800 text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1"
          >
            <mat-icon class="text-xs">{{ dockExpanded() ? 'expand_more' : 'expand_less' }}</mat-icon>
            <span>{{ dockExpanded() ? 'Hide Tools' : 'Show Procedural Models & Inspector' }}</span>
          </button>
        </div>

        @if (dockExpanded()) {
          <div class="bg-[#0c1017]/95 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3 shadow-2xl space-y-3">
            <!-- Add Procedural Preset Models -->
            <div class="flex items-center justify-between flex-wrap gap-2">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                {{ i18n.t('vp.addPreset') }}:
              </span>
              <div class="flex flex-wrap items-center gap-1.5">
                <button
                  (click)="addModel('drone')"
                  class="px-2.5 py-1 rounded-lg bg-[#131924] hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/40 text-xs text-slate-200 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-all"
                >
                  <mat-icon class="text-sm text-cyan-400">flight</mat-icon>
                  <span>Cyber Drone</span>
                </button>

                <button
                  (click)="addModel('rover')"
                  class="px-2.5 py-1 rounded-lg bg-[#131924] hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/40 text-xs text-slate-200 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-all"
                >
                  <mat-icon class="text-sm text-purple-400">directions_car</mat-icon>
                  <span>Spatial Rover</span>
                </button>

                <button
                  (click)="addModel('holo-table')"
                  class="px-2.5 py-1 rounded-lg bg-[#131924] hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/40 text-xs text-slate-200 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-all"
                >
                  <mat-icon class="text-sm text-sky-400">table_restaurant</mat-icon>
                  <span>Holo Console</span>
                </button>

                <button
                  (click)="addModel('vr-headset')"
                  class="px-2.5 py-1 rounded-lg bg-[#131924] hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/40 text-xs text-slate-200 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-all"
                >
                  <mat-icon class="text-sm text-emerald-400">vrpano</mat-icon>
                  <span>VR Headset</span>
                </button>

                <button
                  (click)="addModel('ar-chair')"
                  class="px-2.5 py-1 rounded-lg bg-[#131924] hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/40 text-xs text-slate-200 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-all"
                >
                  <mat-icon class="text-sm text-blue-400">chair</mat-icon>
                  <span>AR Chair</span>
                </button>

                <button
                  (click)="addModel('bio-core')"
                  class="px-2.5 py-1 rounded-lg bg-[#131924] hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/40 text-xs text-slate-200 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-all"
                >
                  <mat-icon class="text-sm text-purple-400">hub</mat-icon>
                  <span>Bio Core</span>
                </button>
              </div>
            </div>

            <!-- Transform Numeric Controls for Selected Object -->
            @if (engine.currentSelectedMesh) {
              <div class="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                <div class="flex items-center gap-2">
                  <span class="text-cyan-400 font-bold uppercase truncate max-w-[140px]">
                    {{ engine.currentSelectedMesh.name }}
                  </span>
                  <button
                    (click)="deleteSelected()"
                    class="p-1 rounded bg-red-950/60 border border-red-500/30 text-red-400 hover:bg-red-900/60"
                    title="Delete Object"
                  >
                    <mat-icon class="text-xs">delete</mat-icon>
                  </button>
                </div>

                <!-- Position X, Y, Z -->
                <div class="flex items-center gap-2">
                  <span class="text-slate-500">POS:</span>
                  <label class="flex items-center gap-1">
                    <span class="text-red-400">X</span>
                    <input
                      type="number"
                      step="0.1"
                      [ngModel]="engine.currentSelectedMesh.position.x"
                      (ngModelChange)="onPosChange($event, 'x')"
                      class="w-14 bg-[#131924] border border-slate-700 rounded px-1.5 py-0.5 text-white"
                    />
                  </label>
                  <label class="flex items-center gap-1">
                    <span class="text-emerald-400">Y</span>
                    <input
                      type="number"
                      step="0.1"
                      [ngModel]="engine.currentSelectedMesh.position.y"
                      (ngModelChange)="onPosChange($event, 'y')"
                      class="w-14 bg-[#131924] border border-slate-700 rounded px-1.5 py-0.5 text-white"
                    />
                  </label>
                  <label class="flex items-center gap-1">
                    <span class="text-blue-400">Z</span>
                    <input
                      type="number"
                      step="0.1"
                      [ngModel]="engine.currentSelectedMesh.position.z"
                      (ngModelChange)="onPosChange($event, 'z')"
                      class="w-14 bg-[#131924] border border-slate-700 rounded px-1.5 py-0.5 text-white"
                    />
                  </label>
                </div>

                <!-- Uniform Scale Slider -->
                <div class="flex items-center gap-2">
                  <span class="text-slate-500">SCALE:</span>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.05"
                    [ngModel]="engine.currentSelectedMesh.scale.x"
                    (ngModelChange)="engine.updateSelectedScale($event)"
                    class="w-24 accent-cyan-400 cursor-pointer"
                  />
                  <span class="text-cyan-400 w-8">{{ engine.currentSelectedMesh.scale.x.toFixed(1) }}x</span>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Collapsible Right Sidebar: Scene Graph & PBR Material Editor -->
      @if (showSidebar()) {
        <div class="absolute top-16 right-4 z-30 w-80 max-h-[calc(100vh-140px)] bg-[#0c1017]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-4 overflow-y-auto">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 class="font-bold text-sm text-white flex items-center gap-2">
              <mat-icon class="text-cyan-400 text-base">account_tree</mat-icon>
              {{ i18n.t('vp.sceneGraph') }}
            </h3>
            <button (click)="showSidebar.set(false)" class="text-slate-400 hover:text-white">
              <mat-icon class="text-sm">close</mat-icon>
            </button>
          </div>

          <!-- Scene Objects List -->
          <div class="space-y-1.5 max-h-48 overflow-y-auto">
            @for (item of engine.sceneGraph(); track item.id) {
              <button
                type="button"
                (click)="onSelectById(item.id)"
                class="w-full px-2.5 py-1.5 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-all text-left"
                [class.bg-cyan-500]="engine.selectedObjectId() === item.id"
                [class.text-black]="engine.selectedObjectId() === item.id"
                [class.bg-[#131924]]="engine.selectedObjectId() !== item.id"
                [class.text-slate-300]="engine.selectedObjectId() !== item.id"
              >
                <div class="flex items-center gap-1.5 truncate">
                  <mat-icon class="text-sm">category</mat-icon>
                  <span class="font-medium truncate">{{ item.name }}</span>
                </div>
                <span class="text-[10px] opacity-75 font-mono">({{ item.childrenCount }} pts)</span>
              </button>
            }
          </div>

          <!-- PBR Material Inspector -->
          <div class="border-t border-slate-800 pt-3 space-y-3">
            <h4 class="font-bold text-xs text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <mat-icon class="text-purple-400 text-sm">palette</mat-icon>
              {{ i18n.t('vp.materialInspector') }}
            </h4>

            <div class="space-y-2.5 text-xs">
              <!-- Color Picker -->
              <div class="flex items-center justify-between">
                <span class="text-slate-400">Base Albedo:</span>
                <input
                  type="color"
                  [ngModel]="activeColor()"
                  (ngModelChange)="onColorChange($event)"
                  class="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
              </div>

              <!-- Roughness -->
              <div class="space-y-1">
                <div class="flex justify-between text-slate-400 text-[11px]">
                  <span>Roughness (Microfacet)</span>
                  <span class="text-cyan-400 font-mono">{{ (activeRoughness() * 100).toFixed(0) }}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  [ngModel]="activeRoughness()"
                  (ngModelChange)="onRoughnessChange($event)"
                  class="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <!-- Metalness -->
              <div class="space-y-1">
                <div class="flex justify-between text-slate-400 text-[11px]">
                  <span>Metalness (Conductor)</span>
                  <span class="text-purple-400 font-mono">{{ (activeMetalness() * 100).toFixed(0) }}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  [ngModel]="activeMetalness()"
                  (ngModelChange)="onMetalnessChange($event)"
                  class="w-full accent-purple-400 cursor-pointer"
                />
              </div>

              <!-- Transmission (Optical Glass) -->
              <div class="space-y-1">
                <div class="flex justify-between text-slate-400 text-[11px]">
                  <span>Transmission (Glass Refract)</span>
                  <span class="text-sky-400 font-mono">{{ (activeTransmission() * 100).toFixed(0) }}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  [ngModel]="activeTransmission()"
                  (ngModelChange)="onTransmissionChange($event)"
                  class="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              <!-- Wireframe toggle -->
              <div class="flex items-center justify-between pt-1">
                <span class="text-slate-400">Wireframe Mesh</span>
                <input
                  type="checkbox"
                  [ngModel]="activeWireframe()"
                  (ngModelChange)="onWireframeChange($event)"
                  class="accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class Viewport3DComponent implements OnInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLDivElement>;

  engine = inject(ThreeEngineService);
  i18n = inject(I18nService);

  gridEnabled = signal<boolean>(true);
  axesEnabled = signal<boolean>(true);
  dockExpanded = signal<boolean>(true);
  showSidebar = signal<boolean>(false);
  isExporting = signal<boolean>(false);

  // Material state
  activeColor = signal<string>('#00f0ff');
  activeRoughness = signal<number>(0.2);
  activeMetalness = signal<number>(0.8);
  activeTransmission = signal<number>(0);
  activeWireframe = signal<boolean>(false);

  ngOnInit() {
    if (this.canvasContainer) {
      this.engine.init(this.canvasContainer.nativeElement);
    }
  }

  ngOnDestroy() {
    this.engine.dispose();
  }

  toggleSidebar() {
    this.showSidebar.update((v) => !v);
  }

  toggleDock() {
    this.dockExpanded.update((v) => !v);
  }

  setCameraMode(mode: 'perspective' | 'orthographic') {
    this.engine.setCameraMode(mode);
  }

  toggleGrid() {
    this.gridEnabled.update((v) => !v);
    this.engine.toggleGrid(this.gridEnabled());
  }

  toggleAxes() {
    this.axesEnabled.update((v) => !v);
    this.engine.toggleAxes(this.axesEnabled());
  }

  addModel(type: 'drone' | 'rover' | 'holo-table' | 'vr-headset' | 'ar-chair' | 'bio-core') {
    this.engine.addProceduralModel(type);
  }

  deleteSelected() {
    this.engine.deleteSelectedObject();
  }

  onPosChange(val: number, axis: 'x' | 'y' | 'z') {
    if (!this.engine.currentSelectedMesh) return;
    const p = this.engine.currentSelectedMesh.position;
    if (axis === 'x') this.engine.updateSelectedPosition(val, p.y, p.z);
    if (axis === 'y') this.engine.updateSelectedPosition(p.x, val, p.z);
    if (axis === 'z') this.engine.updateSelectedPosition(p.x, p.y, val);
  }

  onColorChange(hex: string) {
    this.activeColor.set(hex);
    this.engine.updateSelectedMaterial({ color: hex });
  }

  onRoughnessChange(val: number) {
    this.activeRoughness.set(val);
    this.engine.updateSelectedMaterial({ roughness: val });
  }

  onMetalnessChange(val: number) {
    this.activeMetalness.set(val);
    this.engine.updateSelectedMaterial({ metalness: val });
  }

  onTransmissionChange(val: number) {
    this.activeTransmission.set(val);
    this.engine.updateSelectedMaterial({ transmission: val });
  }

  onWireframeChange(val: boolean) {
    this.activeWireframe.set(val);
    this.engine.updateSelectedMaterial({ wireframe: val });
  }

  onSelectById(id: string) {
    const obj = this.engine.interactiveGroup.children.find((c) => c.uuid === id);
    if (obj) {
      this.engine.selectObject(obj);
    }
  }

  async exportGLB() {
    this.isExporting.set(true);
    try {
      const blob = await this.engine.exportGLB();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reality-forge-model-${Date.now()}.glb`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      this.isExporting.set(false);
    }
  }

  async onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      try {
        await this.engine.loadLocalModel(file);
      } catch (err) {
        console.error('Failed to load local model:', err);
      }
    }
  }
}
