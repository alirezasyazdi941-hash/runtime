import { Injectable, signal, inject } from '@angular/core';
import * as THREE from 'three';
import { SpatialAudioService } from './spatial-audio.service';

export interface InteractiveVRObject {
  id: string;
  name: string;
  mesh: THREE.Mesh;
  isGrabbed: boolean;
  initialPos: [number, number, number];
}

@Injectable({
  providedIn: 'root',
})
export class WebXRVRService {
  private audio = inject(SpatialAudioService);

  isVRActive = signal<boolean>(false);
  isNativeWebXR = signal<boolean>(false);
  activeEnvironment = signal<'holodeck' | 'martian' | 'deep-space'>('holodeck');
  viewPerspective = signal<'first-person' | 'third-person'>('first-person');
  leftHandGrabbed = signal<boolean>(false);
  rightHandGrabbed = signal<boolean>(false);
  teleportTarget = signal<[number, number, number]>([0, 0, -3]);
  statusMessage = signal<string>('VR Studio ready.');

  // Three.js VR scene references
  public vrScene: THREE.Scene = new THREE.Scene();
  public vrCamera: THREE.PerspectiveCamera | null = null;
  public vrRenderer: THREE.WebGLRenderer | null = null;
  private animFrameId = 0;
  private container: HTMLElement | null = null;

  // VR Controllers & Rigs
  public userRig: THREE.Group = new THREE.Group();
  public leftControllerMesh: THREE.Group = new THREE.Group();
  public rightControllerMesh: THREE.Group = new THREE.Group();
  private leftRay: THREE.Line | null = null;
  private rightRay: THREE.Line | null = null;
  private teleportMarker: THREE.Mesh | null = null;

  // Interactive Grabbable Objects
  private grabbableObjects: InteractiveVRObject[] = [];
  private grabbedByRight: InteractiveVRObject | null = null;

  constructor() {
    this.setupScene();
  }

  private setupScene() {
    this.vrScene.add(this.userRig);
    this.userRig.position.set(0, 0, 0);

    // Setup Dual Controllers
    this.setupControllers();

    // Teleportation Target Marker
    const markerGeo = new THREE.RingGeometry(0.25, 0.35, 32).rotateX(-Math.PI / 2);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide });
    this.teleportMarker = new THREE.Mesh(markerGeo, markerMat);
    this.teleportMarker.position.set(0, 0.01, -3);
    this.vrScene.add(this.teleportMarker);

    // Default Holodeck Environment
    this.buildEnvironment('holodeck');
  }

  private setupControllers() {
    // Left Hand (Cyan)
    const leftBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.02, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8, roughness: 0.2 })
    );
    leftBody.rotation.x = Math.PI / 4;
    this.leftControllerMesh.add(leftBody);
    this.leftControllerMesh.position.set(-0.35, 1.1, -0.6);

    // Left Ray Line
    const leftLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -3),
    ]);
    this.leftRay = new THREE.Line(
      leftLineGeo,
      new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.6 })
    );
    this.leftControllerMesh.add(this.leftRay);

    // Right Hand (Purple)
    const rightBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.02, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, metalness: 0.8, roughness: 0.2 })
    );
    rightBody.rotation.x = Math.PI / 4;
    this.rightControllerMesh.add(rightBody);
    this.rightControllerMesh.position.set(0.35, 1.1, -0.6);

    // Right Ray Line
    const rightLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -3),
    ]);
    this.rightRay = new THREE.Line(
      rightLineGeo,
      new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.7 })
    );
    this.rightControllerMesh.add(this.rightRay);

    this.userRig.add(this.leftControllerMesh);
    this.userRig.add(this.rightControllerMesh);
  }

  buildEnvironment(type: 'holodeck' | 'martian' | 'deep-space') {
    this.activeEnvironment.set(type);

    // Remove existing environment props
    const toRemove: THREE.Object3D[] = [];
    this.vrScene.children.forEach((c) => {
      if (c !== this.userRig && c !== this.teleportMarker && !(c instanceof THREE.Light)) {
        toRemove.push(c);
      }
    });
    toRemove.forEach((c) => this.vrScene.remove(c));

    // Clear grabbables
    this.grabbableObjects = [];

    if (type === 'holodeck') {
      this.vrScene.background = new THREE.Color(0x06070a);
      this.vrScene.fog = new THREE.FogExp2(0x06070a, 0.03);

      // Cyber Grid Room
      const grid = new THREE.GridHelper(24, 48, 0x00f0ff, 0x1e293b);
      this.vrScene.add(grid);

      // Ambient & Directional Lights
      const amb = new THREE.AmbientLight(0xffffff, 0.8);
      this.vrScene.add(amb);
      const dir = new THREE.DirectionalLight(0x00f0ff, 1.5);
      dir.position.set(4, 8, 4);
      this.vrScene.add(dir);

      // Spawn interactive grabbable cubes
      this.spawnGrabbables();
    } else if (type === 'martian') {
      this.vrScene.background = new THREE.Color(0x3b1109);
      this.vrScene.fog = new THREE.FogExp2(0x451a03, 0.04);

      // Red terrain plane
      const planeGeo = new THREE.PlaneGeometry(30, 30, 20, 20);
      const planeMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.9 });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.rotation.x = -Math.PI / 2;
      this.vrScene.add(plane);

      const sun = new THREE.DirectionalLight(0xfdba74, 2.0);
      sun.position.set(5, 7, 3);
      this.vrScene.add(sun);

      this.spawnGrabbables();
    } else {
      this.vrScene.background = new THREE.Color(0x020408);
      this.vrScene.fog = new THREE.FogExp2(0x020408, 0.015);

      // Deep space stars particle field
      const starsGeo = new THREE.BufferGeometry();
      const count = 1200;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 80;
      }
      starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const starsMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.15 });
      const stars = new THREE.Points(starsGeo, starsMat);
      this.vrScene.add(stars);

      const spaceGrid = new THREE.GridHelper(20, 20, 0xa855f7, 0x3b0764);
      this.vrScene.add(spaceGrid);

      this.spawnGrabbables();
    }
  }

  private spawnGrabbables() {
    const colors = [0x00f0ff, 0xa855f7, 0x10b981, 0xf59e0b];
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i],
        metalness: 0.6,
        roughness: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const x = (i - 1.5) * 0.5;
      mesh.position.set(x, 0.9, -1.8);
      this.vrScene.add(mesh);

      this.grabbableObjects.push({
        id: `grabbable-${i}`,
        name: `Physics Cube #${i + 1}`,
        mesh,
        isGrabbed: false,
        initialPos: [x, 0.9, -1.8],
      });
    }

    // Pedestal table
    const tableGeo = new THREE.BoxGeometry(2.4, 0.8, 0.6);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, 0.4, -1.8);
    this.vrScene.add(table);
  }

  // Start VR inside container
  async startVR(container: HTMLElement): Promise<void> {
    this.container = container;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    this.vrRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.vrRenderer.setSize(width, height);
    this.vrRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.vrRenderer.outputColorSpace = THREE.SRGBColorSpace;

    container.innerHTML = '';
    container.appendChild(this.vrRenderer.domElement);

    this.vrCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    this.userRig.add(this.vrCamera);
    this.updateCameraPerspective();

    this.isVRActive.set(true);

    // Attempt native WebXR immersive-vr session if headset detected
    interface XRSystemLike {
      isSessionSupported(mode: string): Promise<boolean>;
    }
    const navWithXR = (typeof navigator !== 'undefined' ? navigator : null) as (Navigator & { xr?: XRSystemLike }) | null;

    if (navWithXR && navWithXR.xr) {
      try {
        const supported = await navWithXR.xr.isSessionSupported('immersive-vr');
        if (supported) {
          this.isNativeWebXR.set(true);
          this.statusMessage.set('WebXR Immersive-VR Session Ready. Headset tracking enabled.');
        } else {
          this.isNativeWebXR.set(false);
          this.statusMessage.set('In-Browser 6-DOF VR Simulation Mode active.');
        }
      } catch {
        this.isNativeWebXR.set(false);
      }
    }

    this.loopVR();
  }

  private loopVR = () => {
    if (!this.isVRActive()) return;
    this.animFrameId = requestAnimationFrame(this.loopVR);

    // Subtle breathing animation on controllers
    const t = performance.now() * 0.003;
    this.leftControllerMesh.position.y = 1.1 + Math.sin(t) * 0.015;
    this.rightControllerMesh.position.y = 1.1 + Math.cos(t) * 0.015;

    // Follow grabbed object to right controller
    if (this.grabbedByRight) {
      const worldPos = new THREE.Vector3();
      this.rightControllerMesh.getWorldPosition(worldPos);
      this.grabbedByRight.mesh.position.copy(worldPos).add(new THREE.Vector3(0, 0, -0.2));
      this.grabbedByRight.mesh.rotation.y += 0.02;
    }

    if (this.vrRenderer && this.vrCamera) {
      this.vrRenderer.render(this.vrScene, this.vrCamera);
    }
  };

  // Toggle Viewpoint: First Person vs Third Person
  toggleViewPerspective() {
    this.viewPerspective.update((curr) => (curr === 'first-person' ? 'third-person' : 'first-person'));
    this.updateCameraPerspective();
  }

  private updateCameraPerspective() {
    if (!this.vrCamera) return;
    if (this.viewPerspective() === 'first-person') {
      this.vrCamera.position.set(0, 1.6, 0);
      this.vrCamera.lookAt(0, 1.6, -5);
    } else {
      this.vrCamera.position.set(0, 2.5, 3.2);
      this.vrCamera.lookAt(0, 1.4, -1);
    }
  }

  // Teleportation Action
  teleport(offsetZ = -2) {
    const curPos = this.userRig.position;
    const newPos: [number, number, number] = [curPos.x, curPos.y, curPos.z + offsetZ];
    this.userRig.position.set(newPos[0], newPos[1], newPos[2]);
    this.teleportTarget.set(newPos);
    this.audio.playSpatialSound('teleport', newPos);
    this.statusMessage.set(`Teleported to spatial coordinates [${newPos[0]}, ${newPos[1]}, ${newPos[2].toFixed(1)}]`);
  }

  // Grab or Release nearest object
  toggleGrabRight() {
    if (this.grabbedByRight) {
      // Release
      const released = this.grabbedByRight;
      this.grabbedByRight = null;
      this.rightHandGrabbed.set(false);
      this.audio.playSpatialSound('release', [
        released.mesh.position.x,
        released.mesh.position.y,
        released.mesh.position.z,
      ]);
      this.statusMessage.set(`Released object: ${released.name}`);
    } else {
      // Find closest grabbable
      const rightPos = new THREE.Vector3();
      this.rightControllerMesh.getWorldPosition(rightPos);

      let closest: InteractiveVRObject | null = null;
      let minDist = 4.0;

      this.grabbableObjects.forEach((obj) => {
        const dist = obj.mesh.position.distanceTo(rightPos);
        if (dist < minDist) {
          minDist = dist;
          closest = obj;
        }
      });

      if (closest) {
        this.grabbedByRight = closest;
        this.rightHandGrabbed.set(true);
        this.audio.playSpatialSound('grab', [
          (closest as InteractiveVRObject).mesh.position.x,
          (closest as InteractiveVRObject).mesh.position.y,
          (closest as InteractiveVRObject).mesh.position.z,
        ]);
        this.statusMessage.set(`Grabbed object: ${(closest as InteractiveVRObject).name}`);
      } else {
        this.statusMessage.set('No object within grab range.');
      }
    }
  }

  stopVR() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.vrRenderer) {
      this.vrRenderer.dispose();
      this.vrRenderer.domElement.remove();
      this.vrRenderer = null;
    }
    this.isVRActive.set(false);
    this.statusMessage.set('VR Studio stopped.');
  }
}
