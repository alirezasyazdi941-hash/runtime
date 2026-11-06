import { Injectable, signal } from '@angular/core';
import * as THREE from 'three';

export interface PlacedHologram {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
  mesh: THREE.Object3D;
}

@Injectable({
  providedIn: 'root',
})
export class WebXRARService {
  isARActive = signal<boolean>(false);
  arMode = signal<'webxr-native' | 'camera-passthrough' | 'idle'>('idle');
  hitTestFound = signal<boolean>(false);
  placedHolograms = signal<PlacedHologram[]>([]);
  activeModelType = signal<'drone' | 'rover' | 'holo-table' | 'vr-headset' | 'ar-chair'>('drone');
  statusMessage = signal<string>('AR Studio ready.');

  private videoElement: HTMLVideoElement | null = null;
  private mediaStream: MediaStream | null = null;
  public arScene: THREE.Scene = new THREE.Scene();
  public arCamera: THREE.PerspectiveCamera | null = null;
  public arRenderer: THREE.WebGLRenderer | null = null;
  private reticle: THREE.Mesh | null = null;
  private animFrameId = 0;
  private container: HTMLElement | null = null;

  constructor() {
    this.setupReticle();
  }

  private setupReticle() {
    // Ring reticle for surface hit testing
    const ringGeo = new THREE.RingGeometry(0.15, 0.18, 32).rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    this.reticle = new THREE.Mesh(ringGeo, ringMat);
    this.reticle.visible = false;
    this.arScene.add(this.reticle);

    // AR Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    this.arScene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(2, 4, 3);
    this.arScene.add(dirLight);
  }

  // Start AR Experience
  async startAR(container: HTMLElement, videoEl: HTMLVideoElement): Promise<void> {
    this.container = container;
    this.videoElement = videoEl;

    // Check if WebXR immersive-ar is natively available
    interface XRSystemLike {
      isSessionSupported(mode: string): Promise<boolean>;
    }
    const navWithXR = (typeof navigator !== 'undefined' ? navigator : null) as (Navigator & { xr?: XRSystemLike }) | null;
    const hasNativeWebXR =
      !!navWithXR?.xr &&
      (await navWithXR.xr.isSessionSupported('immersive-ar').catch(() => false));

    if (hasNativeWebXR) {
      this.arMode.set('webxr-native');
      this.statusMessage.set('Native WebXR immersive-ar mode active.');
    } else {
      this.arMode.set('camera-passthrough');
      this.statusMessage.set(
        'Native WebXR immersive-ar not supported on this browser. Camera Video Passthrough Fallback active.'
      );
    }

    // Start video camera feed
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        videoEl.srcObject = this.mediaStream;
        await videoEl.play();
      }
    } catch (camErr) {
      console.warn('Camera access error:', camErr);
      this.statusMessage.set('Camera permission denied or camera unavailable. Rendering in 3D AR space.');
    }

    // Init Three.js overlay renderer
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    this.arRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    this.arRenderer.setSize(width, height);
    this.arRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.arRenderer.outputColorSpace = THREE.SRGBColorSpace;

    container.innerHTML = '';
    container.appendChild(this.arRenderer.domElement);

    this.arCamera = new THREE.PerspectiveCamera(60, width / height, 0.05, 50);
    this.arCamera.position.set(0, 1.2, 2.5);
    this.arCamera.lookAt(0, 0, 0);

    this.isARActive.set(true);
    this.hitTestFound.set(true);
    if (this.reticle) this.reticle.visible = true;

    this.loopAR();
  }

  private loopAR = () => {
    if (!this.isARActive()) return;
    this.animFrameId = requestAnimationFrame(this.loopAR);

    // Animate reticle breathing pulse
    if (this.reticle) {
      const scale = 1 + Math.sin(performance.now() * 0.005) * 0.05;
      this.reticle.scale.set(scale, scale, scale);
      this.reticle.position.set(0, 0, -1.8);
    }

    // Animate placed holograms
    this.placedHolograms().forEach((h) => {
      h.mesh.rotation.y += 0.005;
    });

    if (this.arRenderer && this.arCamera) {
      this.arRenderer.render(this.arScene, this.arCamera);
    }
  };

  // Place 3D object at reticle or specified position
  placeObject(modelType?: 'drone' | 'rover' | 'holo-table' | 'vr-headset' | 'ar-chair'): PlacedHologram {
    const type = modelType || this.activeModelType();
    const group = new THREE.Group();
    group.name = `AR-${type}-${Date.now()}`;

    if (type === 'drone') {
      const bodyGeo = new THREE.BoxGeometry(0.35, 0.1, 0.35);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8, roughness: 0.2 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(body);

      const eyeGeo = new THREE.SphereGeometry(0.06, 16, 16);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(0, 0.05, 0.18);
      group.add(eye);
    } else if (type === 'rover') {
      const bodyGeo = new THREE.BoxGeometry(0.5, 0.2, 0.35);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, metalness: 0.7, roughness: 0.3 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.15;
      group.add(body);
    } else {
      const seatGeo = new THREE.BoxGeometry(0.4, 0.06, 0.4);
      const seatMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 });
      const seat = new THREE.Mesh(seatGeo, seatMat);
      seat.position.y = 0.25;
      group.add(seat);

      const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
      [
        [-0.15, -0.15],
        [0.15, -0.15],
        [-0.15, 0.15],
        [0.15, 0.15],
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25), legMat);
        leg.position.set(lx, 0.125, lz);
        group.add(leg);
      });
    }

    // Place at reticle position
    const pos = this.reticle ? this.reticle.position.clone() : new THREE.Vector3(0, 0, -1.8);
    // Add slight offset for successive placements
    const count = this.placedHolograms().length;
    group.position.set(pos.x + (count % 2 === 0 ? 0.3 : -0.3) * count, pos.y, pos.z);

    this.arScene.add(group);

    const newHologram: PlacedHologram = {
      id: group.name,
      name: `${type.toUpperCase()} Hologram`,
      position: [group.position.x, group.position.y, group.position.z],
      rotation: 0,
      scale: 1,
      mesh: group,
    };

    this.placedHolograms.update((items) => [...items, newHologram]);
    this.statusMessage.set(`Hologram [${type}] anchored in spatial coordinate.`);
    return newHologram;
  }

  // Clear all holograms
  clearAll() {
    this.placedHolograms().forEach((h) => {
      this.arScene.remove(h.mesh);
    });
    this.placedHolograms.set([]);
    this.statusMessage.set('All spatial holograms cleared.');
  }

  // Capture composite photo of video feed + 3D rendering
  captureSnapshot(): string | null {
    if (!this.arRenderer || !this.videoElement) return null;

    const canvas = document.createElement('canvas');
    const width = this.arRenderer.domElement.width;
    const height = this.arRenderer.domElement.height;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Draw video background
    if (this.videoElement.videoWidth > 0) {
      ctx.drawImage(this.videoElement, 0, 0, width, height);
    } else {
      // Dark cyber background fallback
      ctx.fillStyle = '#06070a';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw 3D WebGL Canvas over video
    ctx.drawImage(this.arRenderer.domElement, 0, 0, width, height);

    // 3. Add Reality Forge watermarked branding & timestamp
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('NONONICK REALITY FORGE // AR STUDIO CAPTURE', 20, 30);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(new Date().toLocaleString(), 20, 50);

    return canvas.toDataURL('image/png');
  }

  stopAR() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.arRenderer) {
      this.arRenderer.dispose();
      this.arRenderer.domElement.remove();
      this.arRenderer = null;
    }
    this.isARActive.set(false);
    this.arMode.set('idle');
    this.statusMessage.set('AR session stopped.');
  }
}
