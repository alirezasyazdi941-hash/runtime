import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WebXRVRService } from '../../services/webxr-vr.service';
import { SpatialAudioService } from '../../services/spatial-audio.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-vr-studio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="relative w-full h-[calc(100vh-65px)] bg-[#030508] overflow-hidden flex flex-col select-none">
      <!-- Top HUD Toolbar -->
      <div class="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div class="pointer-events-auto flex items-center gap-2 bg-[#0c1017]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 shadow-xl">
          <div class="w-3 h-3 rounded-full bg-purple-500"></div>
          <div>
            <h2 class="text-xs font-bold text-white uppercase tracking-wider font-mono">
              {{ i18n.t('vr.title') }}
            </h2>
            <p class="text-[11px] text-slate-400">
              {{ vrService.statusMessage() }}
            </p>
          </div>
        </div>

        <!-- Environments & Camera View Mode -->
        <div class="pointer-events-auto flex items-center gap-2 bg-[#0c1017]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <!-- First vs Third Person Camera -->
          <button
            (click)="vrService.toggleViewPerspective()"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#131924] hover:bg-slate-700 text-slate-200 font-semibold"
          >
            <mat-icon class="text-sm text-cyan-400">
              {{ vrService.viewPerspective() === 'first-person' ? 'person' : 'videocam' }}
            </mat-icon>
            <span class="capitalize">{{ vrService.viewPerspective() }}</span>
          </button>

          <div class="h-4 w-[1px] bg-slate-700"></div>

          <!-- Environment Selector -->
          <div class="flex items-center gap-1 bg-[#131924] p-0.5 rounded-lg border border-slate-700">
            <button
              (click)="vrService.buildEnvironment('holodeck')"
              [class.bg-purple-600]="vrService.activeEnvironment() === 'holodeck'"
              [class.text-white]="vrService.activeEnvironment() === 'holodeck'"
              [class.text-slate-400]="vrService.activeEnvironment() !== 'holodeck'"
              class="px-2 py-0.5 rounded text-[11px] font-semibold"
            >
              Holodeck
            </button>
            <button
              (click)="vrService.buildEnvironment('martian')"
              [class.bg-purple-600]="vrService.activeEnvironment() === 'martian'"
              [class.text-white]="vrService.activeEnvironment() === 'martian'"
              [class.text-slate-400]="vrService.activeEnvironment() !== 'martian'"
              class="px-2 py-0.5 rounded text-[11px] font-semibold"
            >
              Martian
            </button>
            <button
              (click)="vrService.buildEnvironment('deep-space')"
              [class.bg-purple-600]="vrService.activeEnvironment() === 'deep-space'"
              [class.text-white]="vrService.activeEnvironment() === 'deep-space'"
              [class.text-slate-400]="vrService.activeEnvironment() !== 'deep-space'"
              class="px-2 py-0.5 rounded text-[11px] font-semibold"
            >
              Deep Space
            </button>
          </div>
        </div>
      </div>

      <!-- Main Canvas Container -->
      <div #canvasContainer class="w-full h-full cursor-crosshair"></div>

      <!-- VR Interactive Bottom Dock -->
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-2xl pointer-events-auto">
        <div class="bg-[#0c1017]/95 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 shadow-2xl space-y-3">
          <!-- 6-DOF Controller Action Bar -->
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-400 font-mono">6-DOF CONTROLLERS:</span>
              <button
                (click)="vrService.toggleGrabRight()"
                [class.bg-purple-600]="vrService.rightHandGrabbed()"
                [class.bg-[#131924]]="!vrService.rightHandGrabbed()"
                class="px-3 py-1.5 rounded-lg border border-purple-500/40 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md"
              >
                <mat-icon class="text-sm">pan_tool</mat-icon>
                <span>{{ vrService.rightHandGrabbed() ? 'Release Object' : 'Grab / Raycast Object' }}</span>
              </button>
            </div>

            <!-- Teleport Buttons -->
            <div class="flex items-center gap-2">
              <button
                (click)="vrService.teleport(-2)"
                class="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <mat-icon class="text-sm">arrow_upward</mat-icon>
                <span>Teleport Forward</span>
              </button>
              <button
                (click)="vrService.teleport(2)"
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <mat-icon class="text-sm">arrow_downward</mat-icon>
                <span>Backward</span>
              </button>
            </div>
          </div>

          <!-- Positional Audio Test Buttons -->
          <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span class="text-slate-400">Spatial Audio Synthesis:</span>
            <div class="flex items-center gap-2">
              <button
                (click)="audio.playSpatialSound('laser', [0, 1.6, -2])"
                class="px-2 py-1 rounded bg-[#131924] hover:bg-slate-700 text-cyan-400 text-[11px] font-semibold flex items-center gap-1"
              >
                <mat-icon class="text-xs">bolt</mat-icon>
                <span>Laser Ping</span>
              </button>

              <button
                (click)="audio.playSpatialSound('hologram', [0, 1.6, -2])"
                class="px-2 py-1 rounded bg-[#131924] hover:bg-slate-700 text-purple-400 text-[11px] font-semibold flex items-center gap-1"
              >
                <mat-icon class="text-xs">graphic_eq</mat-icon>
                <span>Holo Hum</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class VRStudioComponent implements OnInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLDivElement>;

  vrService = inject(WebXRVRService);
  audio = inject(SpatialAudioService);
  i18n = inject(I18nService);

  ngOnInit() {
    if (this.canvasContainer) {
      this.vrService.startVR(this.canvasContainer.nativeElement);
    }
  }

  ngOnDestroy() {
    this.vrService.stopVR();
  }
}
