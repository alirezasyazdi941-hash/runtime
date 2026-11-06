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
import { WebXRARService } from '../../services/webxr-ar.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-ar-studio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="relative w-full h-[calc(100vh-65px)] bg-[#030508] overflow-hidden flex flex-col">
      <!-- Hidden Video Element for Environmental Camera Passthrough -->
      <video
        #videoEl
        autoplay
        playsinline
        muted
        class="absolute inset-0 w-full h-full object-cover z-0"
      ></video>

      <!-- Three.js Overlay Canvas Container -->
      <div #canvasContainer class="absolute inset-0 w-full h-full z-10 pointer-events-auto"></div>

      <!-- Top AR Status Bar -->
      <div class="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div class="pointer-events-auto flex items-center gap-2 bg-[#0c1017]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 shadow-xl">
          <div class="w-3 h-3 rounded-full bg-cyan-400"></div>
          <div>
            <h2 class="text-xs font-bold text-white uppercase tracking-wider font-mono">
              {{ i18n.t('ar.title') }}
            </h2>
            <p class="text-[11px] text-slate-400">
              {{ arService.statusMessage() }}
            </p>
          </div>
        </div>

        <!-- Mode Indicator Badge -->
        <div class="pointer-events-auto flex items-center gap-2 bg-[#0c1017]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
          <span class="text-slate-400">Engine:</span>
          @if (arService.arMode() === 'webxr-native') {
            <span class="text-emerald-400 font-bold">W3C Native WebXR</span>
          } @else {
            <span class="text-cyan-400 font-bold">Camera Passthrough + Reticle</span>
          }
        </div>
      </div>

      <!-- AR Control Dock at Bottom -->
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-2xl pointer-events-auto">
        <div class="bg-[#0c1017]/95 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 shadow-2xl space-y-4">
          <!-- Model Selection Pills -->
          <div class="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <span class="text-xs font-bold text-slate-400 font-mono uppercase">Model:</span>
            <div class="flex items-center gap-1.5">
              <button
                (click)="selectModel('drone')"
                [class.bg-cyan-500]="arService.activeModelType() === 'drone'"
                [class.text-black]="arService.activeModelType() === 'drone'"
                [class.bg-[#131924]]="arService.activeModelType() !== 'drone'"
                [class.text-slate-300]="arService.activeModelType() !== 'drone'"
                class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
              >
                <mat-icon class="text-sm">flight</mat-icon>
                <span>Drone</span>
              </button>

              <button
                (click)="selectModel('rover')"
                [class.bg-cyan-500]="arService.activeModelType() === 'rover'"
                [class.text-black]="arService.activeModelType() === 'rover'"
                [class.bg-[#131924]]="arService.activeModelType() !== 'rover'"
                [class.text-slate-300]="arService.activeModelType() !== 'rover'"
                class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
              >
                <mat-icon class="text-sm">directions_car</mat-icon>
                <span>Rover</span>
              </button>

              <button
                (click)="selectModel('ar-chair')"
                [class.bg-cyan-500]="arService.activeModelType() === 'ar-chair'"
                [class.text-black]="arService.activeModelType() === 'ar-chair'"
                [class.bg-[#131924]]="arService.activeModelType() !== 'ar-chair'"
                [class.text-slate-300]="arService.activeModelType() !== 'ar-chair'"
                class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
              >
                <mat-icon class="text-sm">chair</mat-icon>
                <span>Chair</span>
              </button>
            </div>
          </div>

          <!-- Action Buttons: Place Hologram, Snapshot, Clear -->
          <div class="flex items-center gap-2 pt-1 border-t border-slate-800">
            <button
              (click)="onPlaceHologram()"
              class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/25 transition-all"
            >
              <mat-icon class="text-base">add_location_alt</mat-icon>
              <span>{{ i18n.t('ar.placeObject') }}</span>
            </button>

            <button
              (click)="onCaptureSnapshot()"
              class="px-4 py-2.5 rounded-xl bg-[#131924] hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
              title="Capture High-Res AR Photo"
            >
              <mat-icon class="text-base text-cyan-400">photo_camera</mat-icon>
              <span>{{ i18n.t('ar.capturePhoto') }}</span>
            </button>

            <button
              (click)="arService.clearAll()"
              class="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-400 transition-all"
              title="Clear all anchored objects"
            >
              <mat-icon class="text-base">delete_sweep</mat-icon>
            </button>
          </div>

          <!-- Placed Count -->
          <div class="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Anchored Holograms: <strong class="text-cyan-400">{{ arService.placedHolograms().length }}</strong></span>
            <span>Surface Reticle: <strong class="text-emerald-400">Tracking Active</strong></span>
          </div>
        </div>
      </div>

      <!-- Snapshot Preview Modal -->
      @if (capturedImage()) {
        <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-[#0c1017] border border-cyan-500/40 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-white text-sm flex items-center gap-2">
                <mat-icon class="text-cyan-400">photo</mat-icon>
                Captured AR Snapshot
              </h3>
              <button (click)="capturedImage.set(null)" class="text-slate-400 hover:text-white">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="rounded-xl overflow-hidden border border-slate-800 bg-black">
              <img [src]="capturedImage()" alt="AR Snapshot" class="w-full h-auto" />
            </div>

            <div class="flex justify-end gap-2">
              <button
                (click)="downloadSnapshot()"
                class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center gap-1.5"
              >
                <mat-icon class="text-sm">download</mat-icon>
                <span>Save Image</span>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ARStudioComponent implements OnInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('videoEl', { static: true }) videoEl!: ElementRef<HTMLVideoElement>;

  arService = inject(WebXRARService);
  i18n = inject(I18nService);

  capturedImage = signal<string | null>(null);

  ngOnInit() {
    if (this.canvasContainer && this.videoEl) {
      this.arService.startAR(this.canvasContainer.nativeElement, this.videoEl.nativeElement);
    }
  }

  ngOnDestroy() {
    this.arService.stopAR();
  }

  selectModel(type: 'drone' | 'rover' | 'ar-chair') {
    this.arService.activeModelType.set(type);
  }

  onPlaceHologram() {
    this.arService.placeObject();
  }

  onCaptureSnapshot() {
    const snap = this.arService.captureSnapshot();
    if (snap) {
      this.capturedImage.set(snap);
    }
  }

  downloadSnapshot() {
    const img = this.capturedImage();
    if (!img) return;
    const a = document.createElement('a');
    a.href = img;
    a.download = `reality-forge-ar-snap-${Date.now()}.png`;
    a.click();
  }
}
