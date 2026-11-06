import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { KnowledgeCenterService } from '../../services/knowledge-center.service';
import { I18nService } from '../../services/i18n.service';
import { StudioView } from '../../models/xr.models';

@Component({
  selector: 'app-knowledge-center',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 class="text-xl lg:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <mat-icon class="text-cyan-400">menu_book</mat-icon>
            {{ i18n.t('nav.knowledge') }}
          </h1>
          <p class="text-xs text-slate-400 mt-1">
            Authoritative W3C, Khronos, OpenXR, Three.js & Apple/Google standards with deprecation warnings.
          </p>
        </div>

        <!-- Search Bar -->
        <div class="w-full sm:w-80 relative">
          <mat-icon class="absolute left-3 top-2.5 text-slate-400 text-sm">search</mat-icon>
          <input
            type="text"
            [ngModel]="knowledge.searchQuery()"
            (ngModelChange)="knowledge.searchQuery.set($event)"
            placeholder="Search API specs, shaders, WebXR, glTF..."
            class="w-full bg-[#0c1017] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      <!-- Categories Filter Tabs -->
      <div class="flex flex-wrap items-center gap-2">
        @for (cat of categories; track cat.id) {
          <button
            (click)="knowledge.selectedCategory.set(cat.id)"
            [class.bg-cyan-500]="knowledge.selectedCategory() === cat.id"
            [class.text-black]="knowledge.selectedCategory() === cat.id"
            [class.bg-[#0c1017]]="knowledge.selectedCategory() !== cat.id"
            [class.text-slate-300]="knowledge.selectedCategory() !== cat.id"
            class="px-3.5 py-1.5 rounded-xl border border-slate-800 font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <mat-icon class="text-sm">{{ cat.icon }}</mat-icon>
            <span>{{ cat.label }}</span>
          </button>
        }
      </div>

      <!-- Documentation & Knowledge Cards -->
      <div class="space-y-4">
        @for (item of knowledge.filteredItems(); track item.id) {
          <div class="p-5 rounded-2xl bg-[#0c1017] border border-slate-800/80 hover:border-cyan-500/40 transition-all space-y-3 shadow-lg">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                    {{ item.category }}
                  </span>
                  <h3 class="font-bold text-white text-base">{{ item.title }}</h3>
                </div>
                <div class="flex items-center gap-2 text-slate-500 text-xs font-mono">
                  <span>Source: {{ item.source }}</span>
                  <span>•</span>
                  <span>Verified: {{ item.lastVerified }}</span>
                </div>
              </div>

              <!-- Official Doc Link -->
              <a
                [href]="item.url"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-1.5 rounded-lg bg-[#131924] hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-slate-700"
              >
                <span>Official W3C / Docs</span>
                <mat-icon class="text-xs">open_in_new</mat-icon>
              </a>
            </div>

            <!-- Deprecation Warning Alert (if any) -->
            @if (item.deprecatedNotice) {
              <div class="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-start gap-2">
                <mat-icon class="text-red-400 text-sm mt-0.5">warning</mat-icon>
                <div class="flex-1">{{ item.deprecatedNotice }}</div>
              </div>
            }

            <p class="text-xs text-slate-300 leading-relaxed font-sans">
              {{ i18n.currentLang() === 'fa' ? item.summaryFa : item.summaryEn }}
            </p>

            <!-- Code Snippet -->
            @if (item.codeSnippet) {
              <div class="space-y-1">
                <span class="text-[10px] font-mono text-slate-400 font-bold uppercase">Standard Specification Code:</span>
                <pre class="p-3 rounded-xl bg-[#06080d] border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">{{ item.codeSnippet }}</pre>
              </div>
            }

            <!-- Tags -->
            <div class="flex flex-wrap items-center gap-1.5 pt-1">
              @for (tag of item.tags; track tag) {
                <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-[#131924] text-slate-400">
                  #{{ tag }}
                </span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class KnowledgeCenterComponent {
  knowledge = inject(KnowledgeCenterService);
  i18n = inject(I18nService);

  viewChange = output<StudioView>();

  readonly categories = [
    { id: 'all', label: 'All Knowledge', icon: 'auto_stories' },
    { id: 'WebXR', label: 'W3C WebXR', icon: 'vrpano' },
    { id: 'Three.js', label: 'Three.js PBR', icon: 'view_in_ar' },
    { id: 'OpenXR', label: 'Khronos OpenXR', icon: 'hub' },
    { id: 'ARKit', label: 'Apple RealityKit', icon: 'phone_iphone' },
    { id: 'ARCore', label: 'Google ARCore', icon: 'android' },
    { id: 'W3C', label: 'Spatial Audio', icon: 'volume_up' },
  ];
}
