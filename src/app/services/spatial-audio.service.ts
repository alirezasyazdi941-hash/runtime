import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SpatialAudioService {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const win = window as Window & { webkitAudioContext?: typeof AudioContext };
      const AudioCtx = window.AudioContext || win.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play synthesized 3D sound at a specific position (x, y, z)
  playSpatialSound(
    type: 'teleport' | 'grab' | 'release' | 'hologram' | 'chime' | 'laser',
    position: [number, number, number] = [0, 1.6, -2]
  ) {
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Create 3D Panner
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 100;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;

    if (panner.positionX) {
      panner.positionX.setValueAtTime(position[0], now);
      panner.positionY.setValueAtTime(position[1], now);
      panner.positionZ.setValueAtTime(position[2], now);
    } else {
      panner.setPosition(position[0], position[1], position[2]);
    }

    const masterGain = ctx.createGain();
    panner.connect(masterGain);
    masterGain.connect(ctx.destination);

    if (type === 'teleport') {
      // Whoosh sound: noise buffer + sweep lowpass
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(panner);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'grab') {
      // Crisp mechanical snap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(panner);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === 'release') {
      // Release hollow thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.1);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(panner);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === 'hologram') {
      // Sci-Fi resonant hum
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, now);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(panner);
      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } else if (type === 'laser') {
      // High-tech laser ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(panner);
      osc.start(now);
      osc.stop(now + 0.16);
    } else {
      // Confirmation chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(panner);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }
}
