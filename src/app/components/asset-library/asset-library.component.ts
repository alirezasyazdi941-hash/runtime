import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AssetLibraryService } from '../../services/asset-library.service';
import { ThreeEngineService } from '../../services/three-engine.service';
import { SpatialAudioService } from '../../services/spatial-audio.service';
import { I18nService } from '../../services/i18n.service';
import { StudioView, Asset3DItem } from '../../models/xr.models';

@Component({
  selector: 'app-asset-library',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 class="text-xl lg:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <mat-icon class="text-cyan-400">category</mat-icon>
            Spatial Asset Library
          </h1>
          <p class="text-xs text-slate-400 mt-1">
            Procedural 3D models, physical PBR materials, custom GLSL shaders & spatial HRTF audio.
          </p>
        </div>

        <!-- Search Bar -->
        <div class="w-full sm:w-72 relative">
          <mat-icon class="absolute left-3 top-2.5 text-slate-400 text-sm">search</mat-icon>
          <input
            type="text"
            [ngModel]="assetLib.searchQuery()"
            (ngModelChange)="assetLib.searchQuery.set($event)"
            placeholder="Search models, materials, shaders..."
            class="w-full bg-[#0c1017] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      <!-- Category Filter Tabs -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          (click)="assetLib.selectedCategory.set('all')"
          [class.bg-cyan-500]="assetLib.selectedCategory() === 'all'"
          [class.text-black]="assetLib.selectedCategory() === 'all'"
          [class.bg-[#0c1017]]="assetLib.selectedCategory() !== 'all'"
          [class.text-slate-300]="assetLib.selectedCategory() !== 'all'"
          class="px-3.5 py-1.5 rounded-xl border border-slate-800 font-bold text-xs transition-all"
        >
          All Assets
        </button>

        <button
          (click)="assetLib.selectedCategory.set('models')"
          [class.bg-cyan-500]="assetLib.selectedCategory() === 'models'"
          [class.text-black]="assetLib.selectedCategory() === 'models'"
          [class.bg-[#0c1017]]="assetLib.selectedCategory() !== 'models'"
          [class.text-slate-300]="assetLib.selectedCategory() !== 'models'"
          class="px-3.5 py-1.5 rounded-xl border border-slate-800 font-bold text-xs transition-all flex items-center gap-1"
        >
          <mat-icon class="text-sm">flight</mat-icon>
          <span>3D Models</span>
        </button>

        <button
          (click)="assetLib.selectedCategory.set('materials')"
          [class.bg-cyan-500]="assetLib.selectedCategory() === 'materials'"
          [class.text-black]="assetLib.selectedCategory() === 'materials'"
          [class.bg-[#0c1017]]="assetLib.selectedCategory() !== 'materials'"
          [class.text-slate-300]="assetLib.selectedCategory() !== 'materials'"
          class="px-3.5 py-1.5 rounded-xl border border-slate-800 font-bold text-xs transition-all flex items-center gap-1"
        >
          <mat-icon class="text-sm">palette</mat-icon>
          <span>PBR Materials</span>
        </button>

        <button
          (click)="assetLib.selectedCategory.set('shaders')"
          [class.bg-cyan-500]="assetLib.selectedCategory() === 'shaders'"
          [class.text-black]="assetLib.selectedCategory() === 'shaders'"
          [class.bg-[#0c1017]]="assetLib.selectedCategory() !== 'shaders'"
          [class.text-slate-300]="assetLib.selectedCategory() !== 'shaders'"
          class="px-3.5 py-1.5 rounded-xl border border-slate-800 font-bold text-xs transition-all flex items-center gap-1"
        >
          <mat-icon class="text-sm">shield</mat-icon>
          <span>GLSL Shaders</span>
        </button>

        <button
          (click)="assetLib.selectedCategory.set('audio')"
          [class.bg-cyan-500]="assetLib.selectedCategory() === 'audio'"
          [class.text-black]="assetLib.selectedCategory() === 'audio'"
          [class.bg-[#0c1017]]="assetLib.selectedCategory() !== 'audio'"
          [class.text-slate-300]="assetLib.selectedCategory() !== 'audio'"
          class="px-3.5 py-1.5 rounded-xl border border-slate-800 font-bold text-xs transition-all flex items-center gap-1"
        >
          <mat-icon class="text-sm">volume_up</mat-icon>
          <span>Spatial Audio</span>
        </button>
      </div>

      <!-- Assets Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (item of assetLib.filteredAssets(); track item.id) {
          <div class="p-5 rounded-2xl bg-[#0c1017] border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg group">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="w-10 h-10 rounded-xl bg-[#131924] border border-slate-700 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <mat-icon>{{ item.thumbnailIcon }}</mat-icon>
                </div>
                <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {{ item.type }}
                </span>
              </div>

              <div>
                <h3 class="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                  {{ item.name }}
                </h3>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed">
                  {{ i18n.currentLang() === 'fa' ? item.descriptionFa : item.descriptionEn }}
                </p>
              </div>
            </div>

            <!-- Action & License -->
            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span class="text-[10px] text-slate-500 font-mono">{{ item.license }}</span>

              @if (item.category === 'models') {
                <button
                  (click)="loadModel(item)"
                  class="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <mat-icon class="text-xs">view_in_ar</mat-icon>
                  <span>Insert to 3D</span>
                </button>
              } @else if (item.category === 'audio') {
                <button
                  (click)="playAudio(item)"
                  class="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <mat-icon class="text-xs">play_arrow</mat-icon>
                  <span>Play 3D Sound</span>
                </button>
              } @else {
                <button
                  (click)="applyMaterialOrShader(item)"
                  class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <mat-icon class="text-xs">check</mat-icon>
                  <span>Apply</span>
                </button>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AssetLibraryComponent {
  assetLib = inject(AssetLibraryService);
  threeEngine = inject(ThreeEngineService);
  audio = inject(SpatialAudioService);
  i18n = inject(I18nService);

  viewChange = output<StudioView>();

  loadModel(item: Asset3DItem) {
    if (item.id === 'ast-drone') this.threeEngine.addProceduralModel('drone');
    else if (item.id === 'ast-rover') this.threeEngine.addProceduralModel('rover');
    else if (item.id === 'ast-holo-table') this.threeEngine.addProceduralModel('holo-table');
    else if (item.id === 'ast-vr-headset') this.threeEngine.addProceduralModel('vr-headset');
    else if (item.id === 'ast-ar-chair') this.threeEngine.addProceduralModel('ar-chair');
    else this.threeEngine.addProceduralModel('bio-core');

    this.viewChange.emit('3d-workspace');
  }

  playAudio(item: Asset3DItem) {
    if (item.id === 'aud-teleport') this.audio.playSpatialSound('teleport');
    else this.audio.playSpatialSound('grab');
  }

  applyMaterialOrShader(item: Asset3DItem) {
    if (item.id === 'mat-titanium') {
      this.threeEngine.updateSelectedMaterial({ metalness: 0.95, roughness: 0.18, color: '#94a3b8' });
    } else if (item.id === 'mat-hologlass') {
      this.threeEngine.updateSelectedMaterial({ transmission: 0.92, roughness: 0.05, metalness: 0.0 });
    } else if (item.id === 'mat-neon-cyan') {
      this.threeEngine.updateSelectedMaterial({ emissive: '#00f0ff', color: '#00f0ff' });
    }
    this.viewChange.emit('3d-workspace');
  }
}
