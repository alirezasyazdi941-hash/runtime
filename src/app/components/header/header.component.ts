import { ChangeDetectionStrategy, Component, inject, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../services/i18n.service';
import { ProjectStorageService } from '../../services/project-storage.service';
import { DeviceAnalyzerService } from '../../services/device-analyzer.service';
import { StudioView } from '../../models/xr.models';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <header class="sticky top-0 z-50 bg-[#090d14]/90 backdrop-blur-md border-b border-slate-800/80 px-3 lg:px-6 py-2.5 flex items-center justify-between gap-4">
      <!-- Left: Logo & Title -->
      <div class="flex items-center gap-3">
        <button 
          (click)="viewChange.emit('dashboard')"
          class="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div class="w-full h-full bg-[#090d14] rounded-[10px] flex items-center justify-center">
              <mat-icon class="text-cyan-400 text-xl font-bold group-hover:scale-110 transition-transform">view_in_ar</mat-icon>
            </div>
          </div>
          <div class="hidden sm:block">
            <div class="flex items-center gap-2">
              <span class="font-extrabold text-sm lg:text-base tracking-wider bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                NONONICK REALITY FORGE
              </span>
              <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-semibold">
                XR v2.5
              </span>
            </div>
            <p class="text-[11px] text-slate-400 font-medium">
              {{ i18n.t('app.tagline') }}
            </p>
          </div>
        </button>
      </div>

      <!-- Center: Navigation Tabs (Desktop & Tablet) -->
      <nav class="hidden md:flex items-center gap-1 bg-[#0d121c] p-1 rounded-xl border border-slate-800/80 overflow-x-auto max-w-2xl">
        <button
          (click)="viewChange.emit('dashboard')"
          [class.bg-cyan-500]="activeView() === 'dashboard'"
          [class.text-black]="activeView() === 'dashboard'"
          [class.text-slate-300]="activeView() !== 'dashboard'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:text-white transition-all whitespace-nowrap"
        >
          <mat-icon class="text-base leading-none">dashboard</mat-icon>
          {{ i18n.t('nav.dashboard') }}
        </button>

        <button
          (click)="viewChange.emit('3d-workspace')"
          [class.bg-cyan-500]="activeView() === '3d-workspace'"
          [class.text-black]="activeView() === '3d-workspace'"
          [class.text-slate-300]="activeView() !== '3d-workspace'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:text-white transition-all whitespace-nowrap"
        >
          <mat-icon class="text-base leading-none">view_in_ar</mat-icon>
          {{ i18n.t('nav.viewport3d') }}
        </button>

        <button
          (click)="viewChange.emit('ar-studio')"
          [class.bg-cyan-500]="activeView() === 'ar-studio'"
          [class.text-black]="activeView() === 'ar-studio'"
          [class.text-slate-300]="activeView() !== 'ar-studio'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:text-white transition-all whitespace-nowrap"
        >
          <mat-icon class="text-base leading-none">camera_alt</mat-icon>
          {{ i18n.t('nav.arStudio') }}
        </button>

        <button
          (click)="viewChange.emit('vr-studio')"
          [class.bg-cyan-500]="activeView() === 'vr-studio'"
          [class.text-black]="activeView() === 'vr-studio'"
          [class.text-slate-300]="activeView() !== 'vr-studio'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:text-white transition-all whitespace-nowrap"
        >
          <mat-icon class="text-base leading-none">vrpano</mat-icon>
          {{ i18n.t('nav.vrStudio') }}
        </button>

        <button
          (click)="viewChange.emit('code-workspace')"
          [class.bg-cyan-500]="activeView() === 'code-workspace'"
          [class.text-black]="activeView() === 'code-workspace'"
          [class.text-slate-300]="activeView() !== 'code-workspace'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:text-white transition-all whitespace-nowrap"
        >
          <mat-icon class="text-base leading-none">terminal</mat-icon>
          {{ i18n.t('nav.codeWorkspace') }}
        </button>

        <button
          (click)="viewChange.emit('ai-forge')"
          [class.bg-gradient-to-r]="activeView() === 'ai-forge'"
          [class.from-cyan-500]="activeView() === 'ai-forge'"
          [class.to-purple-500]="activeView() === 'ai-forge'"
          [class.text-white]="activeView() === 'ai-forge'"
          [class.text-cyan-400]="activeView() !== 'ai-forge'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:text-cyan-300 transition-all whitespace-nowrap"
        >
          <mat-icon class="text-base leading-none">auto_awesome</mat-icon>
          {{ i18n.t('nav.aiForge') }}
        </button>

        <button
          (click)="viewChange.emit('academy')"
          [class.bg-cyan-500]="activeView() === 'academy'"
          [class.text-black]="activeView() === 'academy'"
          [class.text-slate-300]="activeView() !== 'academy'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:text-white transition-all whitespace-nowrap"
        >
          <mat-icon class="text-base leading-none">school</mat-icon>
          {{ i18n.t('nav.academy') }}
        </button>

        <button
          (click)="viewChange.emit('qa-test')"
          [class.bg-cyan-500]="activeView() === 'qa-test'"
          [class.text-black]="activeView() === 'qa-test'"
          [class.text-slate-300]="activeView() !== 'qa-test'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:text-white transition-all whitespace-nowrap"
        >
          <mat-icon class="text-base leading-none">verified</mat-icon>
          {{ i18n.t('nav.qaTest') }}
        </button>
      </nav>

      <!-- Right: Active Project, Device Badge & Language Switcher -->
      <div class="flex items-center gap-2 lg:gap-3">
        <!-- Active Project Dropdown -->
        <div class="hidden xl:flex items-center gap-1.5 bg-[#0d121c] border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
          <mat-icon class="text-cyan-400 text-sm leading-none">folder</mat-icon>
          <span class="text-slate-300 font-medium max-w-[120px] truncate">
            {{ projectStorage.getActiveProject()?.name || 'Default Project' }}
          </span>
        </div>

        <!-- Hardware Readiness Badge -->
        <button
          (click)="viewChange.emit('qa-test')"
          class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium hover:bg-emerald-900/40 transition-colors"
          title="Hardware Compatibility Score"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{{ deviceAnalyzer.report().compatibilityScore }}% XR Ready</span>
        </button>

        <!-- Standalone HTML Export Button -->
        <button
          (click)="onQuickExport()"
          class="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          title="Export Standalone HTML5"
        >
          <mat-icon class="text-sm leading-none text-cyan-400">download</mat-icon>
          <span>HTML5</span>
        </button>

        <!-- Language Toggle Button (FA / EN) -->
        <button
          (click)="i18n.toggleLanguage()"
          class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all"
          [title]="i18n.currentLang() === 'en' ? 'تغییر زبان به فارسی' : 'Switch to English'"
        >
          <mat-icon class="text-sm leading-none">language</mat-icon>
          <span>{{ i18n.currentLang() === 'en' ? 'فارسی' : 'English' }}</span>
        </button>
      </div>
    </header>

    <!-- Mobile Navigation Sub-bar -->
    <div class="md:hidden flex items-center justify-around bg-[#090d14] border-b border-slate-800 px-2 py-1.5 overflow-x-auto text-[11px] font-medium text-slate-300">
      <button (click)="viewChange.emit('dashboard')" [class.text-cyan-400]="activeView() === 'dashboard'" class="p-1 flex flex-col items-center">
        <mat-icon class="text-base">dashboard</mat-icon>
        <span>{{ i18n.t('nav.dashboard') }}</span>
      </button>
      <button (click)="viewChange.emit('3d-workspace')" [class.text-cyan-400]="activeView() === '3d-workspace'" class="p-1 flex flex-col items-center">
        <mat-icon class="text-base">view_in_ar</mat-icon>
        <span>3D</span>
      </button>
      <button (click)="viewChange.emit('ar-studio')" [class.text-cyan-400]="activeView() === 'ar-studio'" class="p-1 flex flex-col items-center">
        <mat-icon class="text-base">camera_alt</mat-icon>
        <span>AR</span>
      </button>
      <button (click)="viewChange.emit('vr-studio')" [class.text-cyan-400]="activeView() === 'vr-studio'" class="p-1 flex flex-col items-center">
        <mat-icon class="text-base">vrpano</mat-icon>
        <span>VR</span>
      </button>
      <button (click)="viewChange.emit('code-workspace')" [class.text-cyan-400]="activeView() === 'code-workspace'" class="p-1 flex flex-col items-center">
        <mat-icon class="text-base">terminal</mat-icon>
        <span>Code</span>
      </button>
      <button (click)="viewChange.emit('ai-forge')" [class.text-cyan-400]="activeView() === 'ai-forge'" class="p-1 flex flex-col items-center">
        <mat-icon class="text-base">auto_awesome</mat-icon>
        <span>AI</span>
      </button>
    </div>
  `,
})
export class HeaderComponent {
  i18n = inject(I18nService);
  projectStorage = inject(ProjectStorageService);
  deviceAnalyzer = inject(DeviceAnalyzerService);

  activeView = input<StudioView>('dashboard');
  viewChange = output<StudioView>();

  onQuickExport() {
    const proj = this.projectStorage.getActiveProject();
    if (proj) {
      this.projectStorage.exportStandaloneHTML(proj);
    }
  }
}
