import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { QATestingService } from '../../services/qa-testing.service';
import { DeviceAnalyzerService } from '../../services/device-analyzer.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-qa-testing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 class="text-xl lg:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <mat-icon class="text-emerald-400">verified</mat-icon>
            {{ i18n.t('qa.title') }}
          </h1>
          <p class="text-xs text-slate-400 mt-1">
            {{ i18n.t('qa.sub') }}
          </p>
        </div>

        <button
          (click)="qa.runAllTests()"
          [disabled]="qa.isRunningAll()"
          class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          <mat-icon class="text-sm" [class.animate-spin]="qa.isRunningAll()">refresh</mat-icon>
          <span>{{ qa.isRunningAll() ? 'Executing Real Tests...' : i18n.t('qa.runAll') }}</span>
        </button>
      </div>

      <!-- Live Hardware Card -->
      <div class="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-4">
        <h2 class="font-bold text-sm text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <mat-icon class="text-cyan-400 text-base">memory</mat-icon>
          Live Device & GPU Profile
        </h2>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div class="p-3 rounded-xl bg-[#131924] border border-slate-800">
            <span class="text-slate-400 block text-[10px]">DEVICE / OS:</span>
            <span class="font-bold text-white text-xs">{{ deviceAnalyzer.report().os }}</span>
          </div>
          <div class="p-3 rounded-xl bg-[#131924] border border-slate-800">
            <span class="text-slate-400 block text-[10px]">GPU ACCELERATION:</span>
            <span class="font-bold text-emerald-400 text-xs truncate block" [title]="deviceAnalyzer.report().gpuRenderer">
              {{ deviceAnalyzer.report().gpuRenderer }}
            </span>
          </div>
          <div class="p-3 rounded-xl bg-[#131924] border border-slate-800">
            <span class="text-slate-400 block text-[10px]">MEASURED FPS:</span>
            <span class="font-bold text-cyan-400 text-sm">{{ deviceAnalyzer.report().estimatedFps }} FPS</span>
          </div>
          <div class="p-3 rounded-xl bg-[#131924] border border-slate-800">
            <span class="text-slate-400 block text-[10px]">XR READINESS SCORE:</span>
            <span class="font-bold text-purple-400 text-sm">{{ deviceAnalyzer.report().compatibilityScore }} / 100</span>
          </div>
        </div>
      </div>

      <!-- Test Suites Table -->
      <div class="space-y-3">
        <h2 class="font-bold text-sm text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <mat-icon class="text-emerald-400 text-base">checklist</mat-icon>
          Automated Quality & Integrity Test Suites
        </h2>

        <div class="space-y-3">
          @for (test of qa.testResults(); track test.id) {
            <div class="p-4 rounded-xl bg-[#0c1017] border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div class="flex items-start gap-3">
                <div class="mt-0.5">
                  @if (test.status === 'passed') {
                    <mat-icon class="text-emerald-400 text-lg">check_circle</mat-icon>
                  } @else if (test.status === 'warning') {
                    <mat-icon class="text-amber-400 text-lg">warning</mat-icon>
                  } @else if (test.status === 'failed') {
                    <mat-icon class="text-red-400 text-lg">error</mat-icon>
                  } @else {
                    <mat-icon class="text-slate-500 text-lg">radio_button_unchecked</mat-icon>
                  }
                </div>

                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-white text-xs lg:text-sm">
                      {{ i18n.currentLang() === 'fa' ? test.nameFa : test.nameEn }}
                    </span>
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#131924] text-slate-400">
                      {{ test.category }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-400 leading-relaxed font-mono">
                    {{ i18n.currentLang() === 'fa' ? test.messageFa : test.messageEn }}
                  </p>
                </div>
              </div>

              <!-- Duration / Status pill -->
              <div class="flex items-center gap-2 shrink-0 self-end sm:self-auto font-mono text-xs">
                @if (test.durationMs > 0) {
                  <span class="text-slate-500 text-[11px]">{{ test.durationMs }}ms</span>
                }
                <span
                  class="px-2.5 py-1 rounded-lg text-xs font-bold uppercase"
                  [class.bg-emerald-950]="test.status === 'passed'"
                  [class.text-emerald-400]="test.status === 'passed'"
                  [class.border]="test.status === 'passed'"
                  [class.border-emerald-500/40]="test.status === 'passed'"
                  [class.bg-amber-950]="test.status === 'warning'"
                  [class.text-amber-400]="test.status === 'warning'"
                  [class.border-amber-500/40]="test.status === 'warning'"
                  [class.bg-red-950]="test.status === 'failed'"
                  [class.text-red-400]="test.status === 'failed'"
                  [class.border-red-500/40]="test.status === 'failed'"
                  [class.bg-slate-800]="test.status === 'pending'"
                  [class.text-slate-400]="test.status === 'pending'"
                >
                  {{ test.status }}
                </span>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class QATestingComponent implements OnInit {
  qa = inject(QATestingService);
  deviceAnalyzer = inject(DeviceAnalyzerService);
  i18n = inject(I18nService);

  ngOnInit() {
    this.qa.runAllTests();
  }
}
