import { Injectable, signal } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Scene3DObject } from '../models/xr.models';

@Injectable({
  providedIn: 'root',
})
export class ThreeEngineService {
  // Signals for UI bindings
  selectedObjectId = signal<string | null>(null);
  sceneGraph = signal<Scene3DObject[]>([]);
  transformMode = signal<'translate' | 'rotate' | 'scale'>('translate');
  cameraMode = signal<'perspective' | 'orthographic'>('perspective');
  fps = signal<number>(60);
  drawCalls = signal<number>(0);
  triangles = signal<number>(0);

  // Core Three.js instances
  public scene: THREE.Scene = new THREE.Scene();
  public renderer: THREE.WebGLRenderer | null = null;
  public cameraPerspective: THREE.PerspectiveCamera | null = null;
  public cameraOrthographic: THREE.OrthographicCamera | null = null;
  public activeCamera: THREE.Camera | null = null;
  public controls: OrbitControls | null = null;

  private container: HTMLElement | null = null;
  private animFrameId = 0;
  private isSoftwareGl = false;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private clock = new THREE.Clock();

  // Root interactive objects group
  public interactiveGroup: THREE.Group = new THREE.Group();
  private gridHelper: THREE.GridHelper | null = null;
  private axesHelper: THREE.AxesHelper | null = null;
  private keyLight: THREE.DirectionalLight | null = null;
  private fillLight: THREE.HemisphereLight | null = null;

  // Selected mesh reference
  public currentSelectedMesh: THREE.Object3D | null = null;
  private selectionBoxHelper: THREE.BoxHelper | null = null;

  constructor() {
    this.scene.name = 'RealityForgeScene';
    this.scene.add(this.interactiveGroup);
  }

  // Initialize Viewport inside an element
  init(container: HTMLElement) {
    this.container = container;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Detect software WebGL
    this.isSoftwareGl = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // Initialize WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    // Setup PMREM RoomEnvironment for real PBR metallic reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTexture;
    pmremGenerator.dispose();

    // Subtle dark scene background & fog
    this.scene.background = new THREE.Color(0x06070a);
    this.scene.fog = new THREE.FogExp2(0x06070a, 0.025);

    // Cameras
    const aspect = width / height;
    this.cameraPerspective = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    this.cameraPerspective.position.set(3.5, 2.5, 4.5);

    const frustumSize = 5;
    this.cameraOrthographic = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    this.cameraOrthographic.position.set(3.5, 2.5, 4.5);

    this.activeCamera = this.cameraPerspective;

    // Orbit Controls
    this.controls = new OrbitControls(this.activeCamera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0.8, 0);
    this.controls.maxPolarAngle = Math.PI / 2 - 0.01; // Keep above floor
    this.controls.update();

    // Lighting Rig (Key, Fill, Rim)
    this.setupLighting();

    // Studio Grid & Ground Shadow Plane
    this.setupGround();

    // Selection helper
    this.selectionBoxHelper = new THREE.BoxHelper(new THREE.Mesh(), 0x00f0ff);
    this.selectionBoxHelper.visible = false;
    this.scene.add(this.selectionBoxHelper);

    // Event listeners
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));

    // Spawn default hero model if empty
    if (this.interactiveGroup.children.length === 0) {
      this.addProceduralModel('drone');
    }

    // Start render loop
    this.animate();
    this.refreshSceneGraph();
  }

  private setupLighting() {
    // Warm key directional light
    this.keyLight = new THREE.DirectionalLight(0xfff5ea, 2.8);
    this.keyLight.position.set(5, 8, 4);
    this.keyLight.castShadow = !this.isSoftwareGl;
    if (this.keyLight.shadow) {
      this.keyLight.shadow.mapSize.width = 1024;
      this.keyLight.shadow.mapSize.height = 1024;
      this.keyLight.shadow.bias = -0.0005;
      this.keyLight.shadow.normalBias = 0.02;
      const d = 4;
      this.keyLight.shadow.camera.left = -d;
      this.keyLight.shadow.camera.right = d;
      this.keyLight.shadow.camera.top = d;
      this.keyLight.shadow.camera.bottom = -d;
    }
    this.scene.add(this.keyLight);

    // Cool hemisphere fill
    this.fillLight = new THREE.HemisphereLight(0x38bdf8, 0x090d16, 1.2);
    this.scene.add(this.fillLight);

    // Purple rim light
    const rimLight = new THREE.DirectionalLight(0xa855f7, 1.5);
    rimLight.position.set(-5, 4, -4);
    this.scene.add(rimLight);
  }

  private setupGround() {
    // Dark cyber grid
    this.gridHelper = new THREE.GridHelper(16, 32, 0x00f0ff, 0x1e293b);
    this.gridHelper.position.y = 0.001;
    (this.gridHelper.material as THREE.Material).transparent = true;
    (this.gridHelper.material as THREE.Material).opacity = 0.4;
    this.scene.add(this.gridHelper);

    // Coordinate Axes Helper
    this.axesHelper = new THREE.AxesHelper(1.2);
    this.axesHelper.position.set(-2.5, 0.01, -2.5);
    this.scene.add(this.axesHelper);

    // Ground contact shadow receiver
    const shadowGeo = new THREE.PlaneGeometry(16, 16);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.45 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0;
    shadowMesh.receiveShadow = true;
    this.scene.add(shadowMesh);
  }

  // Animation Loop
  private frameCount = 0;
  private lastTime = performance.now();

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    // Idle subtle rotation / animations on selected or dynamic parts
    this.interactiveGroup.children.forEach((child) => {
      if (child.userData['animateHover']) {
        child.position.y += Math.sin(performance.now() * 0.002) * 0.0008;
      }
      if (child.userData['rotorBlades']) {
        (child.userData['rotorBlades'] as THREE.Object3D[]).forEach((blade) => {
          blade.rotation.y += delta * 18;
        });
      }
    });

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.activeCamera) {
      this.renderer.render(this.scene, this.activeCamera);

      // Profiling
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastTime >= 1000) {
        this.fps.set(Math.round((this.frameCount * 1000) / (now - this.lastTime)));
        this.frameCount = 0;
        this.lastTime = now;
        this.drawCalls.set(this.renderer.info.render.calls);
        this.triangles.set(this.renderer.info.render.triangles);
      }
    }

    if (this.selectionBoxHelper && this.currentSelectedMesh) {
      this.selectionBoxHelper.update();
    }
  };

  private onPointerDown(event: PointerEvent) {
    if (!this.container || !this.activeCamera) return;
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.activeCamera);
    const intersects = this.raycaster.intersectObjects(this.interactiveGroup.children, true);

    if (intersects.length > 0) {
      // Find top-level child of interactiveGroup
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && obj.parent !== this.interactiveGroup && obj.parent !== this.scene) {
        obj = obj.parent;
      }
      if (obj) {
        this.selectObject(obj);
      }
    }
  }

  selectObject(obj: THREE.Object3D | null) {
    this.currentSelectedMesh = obj;
    if (obj) {
      this.selectedObjectId.set(obj.uuid);
      if (this.selectionBoxHelper) {
        this.selectionBoxHelper.setFromObject(obj);
        this.selectionBoxHelper.visible = true;
      }
    } else {
      this.selectedObjectId.set(null);
      if (this.selectionBoxHelper) {
        this.selectionBoxHelper.visible = false;
      }
    }
  }

  setCameraMode(mode: 'perspective' | 'orthographic') {
    this.cameraMode.set(mode);
    if (!this.container) return;

    if (mode === 'orthographic') {
      if (this.cameraPerspective && this.cameraOrthographic) {
        this.cameraOrthographic.position.copy(this.cameraPerspective.position);
        this.activeCamera = this.cameraOrthographic;
      }
    } else {
      if (this.cameraPerspective && this.cameraOrthographic) {
        this.cameraPerspective.position.copy(this.cameraOrthographic.position);
        this.activeCamera = this.cameraPerspective;
      }
    }

    if (this.controls && this.activeCamera) {
      this.controls.object = this.activeCamera;
      this.controls.update();
    }
  }

  setCameraAngle(angle: 'iso' | 'top' | 'front' | 'side' | 'first-person') {
    if (!this.activeCamera || !this.controls) return;
    switch (angle) {
      case 'iso':
        this.activeCamera.position.set(3.5, 2.5, 4.5);
        this.controls.target.set(0, 0.8, 0);
        break;
      case 'top':
        this.activeCamera.position.set(0, 7, 0.001);
        this.controls.target.set(0, 0, 0);
        break;
      case 'front':
        this.activeCamera.position.set(0, 1.2, 5);
        this.controls.target.set(0, 0.8, 0);
        break;
      case 'side':
        this.activeCamera.position.set(5, 1.2, 0);
        this.controls.target.set(0, 0.8, 0);
        break;
      case 'first-person':
        this.activeCamera.position.set(0, 1.6, 1.5);
        this.controls.target.set(0, 1.6, -2);
        break;
    }
    this.controls.update();
  }

  toggleGrid(visible: boolean) {
    if (this.gridHelper) this.gridHelper.visible = visible;
  }

  toggleAxes(visible: boolean) {
    if (this.axesHelper) this.axesHelper.visible = visible;
  }

  toggleShadows(enabled: boolean) {
    if (this.renderer) {
      this.renderer.shadowMap.enabled = enabled;
      this.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.needsUpdate = true;
        }
      });
    }
  }

  // Update selected object transform
  updateSelectedPosition(x: number, y: number, z: number) {
    if (this.currentSelectedMesh) {
      this.currentSelectedMesh.position.set(x, y, z);
      this.refreshSceneGraph();
    }
  }

  updateSelectedRotation(xDeg: number, yDeg: number, zDeg: number) {
    if (this.currentSelectedMesh) {
      this.currentSelectedMesh.rotation.set(
        THREE.MathUtils.degToRad(xDeg),
        THREE.MathUtils.degToRad(yDeg),
        THREE.MathUtils.degToRad(zDeg)
      );
      this.refreshSceneGraph();
    }
  }

  updateSelectedScale(s: number) {
    if (this.currentSelectedMesh) {
      this.currentSelectedMesh.scale.set(s, s, s);
      this.refreshSceneGraph();
    }
  }

  // Material updates
  updateSelectedMaterial(props: {
    color?: string;
    roughness?: number;
    metalness?: number;
    wireframe?: boolean;
    transmission?: number;
    emissive?: string;
  }) {
    if (!this.currentSelectedMesh) return;
    this.currentSelectedMesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshPhysicalMaterial;
        if (props.color !== undefined) mat.color.set(props.color);
        if (props.roughness !== undefined) mat.roughness = props.roughness;
        if (props.metalness !== undefined) mat.metalness = props.metalness;
        if (props.wireframe !== undefined) mat.wireframe = props.wireframe;
        if (props.transmission !== undefined) mat.transmission = props.transmission;
        if (props.emissive !== undefined) mat.emissive.set(props.emissive);
        mat.needsUpdate = true;
      }
    });
    this.refreshSceneGraph();
  }

  // Procedural Composite 3D Models (3-12 parts, zero external 404s)
  addProceduralModel(type: 'drone' | 'rover' | 'holo-table' | 'vr-headset' | 'ar-chair' | 'bio-core') {
    let group = new THREE.Group();

    if (type === 'drone') {
      group = this.createCyberpunkDrone();
    } else if (type === 'rover') {
      group = this.createSpatialRover();
    } else if (type === 'holo-table') {
      group = this.createHoloTable();
    } else if (type === 'vr-headset') {
      group = this.createVRHeadset();
    } else if (type === 'ar-chair') {
      group = this.createARChair();
    } else {
      group = this.createBioCore();
    }

    // Offset position so multiple models don't overlap directly
    const offsetIndex = this.interactiveGroup.children.length;
    group.position.x = (offsetIndex % 3) * 1.6 - 1.6;
    group.position.z = Math.floor(offsetIndex / 3) * 1.6;

    this.interactiveGroup.add(group);
    this.selectObject(group);
    this.refreshSceneGraph();
    return group;
  }

  private createCyberpunkDrone(): THREE.Group {
    const drone = new THREE.Group();
    drone.name = 'Cyberpunk XR Drone';
    drone.userData['animateHover'] = true;

    // 1. Central Hull (PBR Metallic)
    const hullGeo = new THREE.BoxGeometry(0.8, 0.25, 0.8);
    const hullMat = new THREE.MeshPhysicalMaterial({
      color: 0x111827,
      metalness: 0.9,
      roughness: 0.2,
      clearcoat: 0.5,
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 1.0;
    hull.castShadow = true;
    drone.add(hull);

    // 2. Cyan Sensor Visor
    const visorGeo = new THREE.BoxGeometry(0.5, 0.12, 0.15);
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.0, 0.42);
    drone.add(visor);

    // 3. Four Quad Arms & Propeller Rotors
    const armMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8, roughness: 0.3 });
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.2 });
    const rotors: THREE.Object3D[] = [];

    const armOffsets = [
      [-0.6, 0.6],
      [0.6, 0.6],
      [-0.6, -0.6],
      [0.6, -0.6],
    ];

    armOffsets.forEach(([ax, az]) => {
      // Carbon arm
      const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7);
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(ax * 0.6, 1.0, az * 0.6);
      arm.rotation.z = Math.PI / 4 * (ax > 0 ? -1 : 1);
      arm.castShadow = true;
      drone.add(arm);

      // Motor pod
      const podGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.18, 16);
      const pod = new THREE.Mesh(podGeo, armMat);
      pod.position.set(ax, 1.05, az);
      pod.castShadow = true;
      drone.add(pod);

      // Spinning rotor blade
      const rotorGeo = new THREE.BoxGeometry(0.7, 0.02, 0.08);
      const rotor = new THREE.Mesh(rotorGeo, rotorMat);
      rotor.position.set(ax, 1.16, az);
      rotor.castShadow = true;
      drone.add(rotor);
      rotors.push(rotor);
    });

    drone.userData['rotorBlades'] = rotors;
    return drone;
  }

  private createSpatialRover(): THREE.Group {
    const rover = new THREE.Group();
    rover.name = 'Spatial Autonomous Rover';

    // Chassis
    const chassisGeo = new THREE.BoxGeometry(1.4, 0.4, 0.9);
    const chassisMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.25,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    rover.add(chassis);

    // LiDAR Dome on top
    const lidarGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16);
    const lidarMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.8 });
    const lidar = new THREE.Mesh(lidarGeo, lidarMat);
    lidar.position.set(0, 0.85, 0);
    rover.add(lidar);

    // 6 Rugged All-Terrain Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, metalness: 0.9, roughness: 0.2 });

    const wheelX = [-0.55, 0, 0.55];
    const wheelZ = [-0.55, 0.55];

    wheelX.forEach((wx) => {
      wheelZ.forEach((wz) => {
        const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 16);
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.24, wz);
        wheel.castShadow = true;
        rover.add(wheel);

        const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16);
        const hub = new THREE.Mesh(hubGeo, rimMat);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(wx, 0.24, wz);
        rover.add(hub);
      });
    });

    return rover;
  }

  private createHoloTable(): THREE.Group {
    const table = new THREE.Group();
    table.name = 'Spatial Hologram Console';

    // Base column
    const baseGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.15, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.075;
    base.castShadow = true;
    table.add(base);

    // Pillar
    const pillarGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.7, 24);
    const pillar = new THREE.Mesh(pillarGeo, baseMat);
    pillar.position.y = 0.5;
    pillar.castShadow = true;
    table.add(pillar);

    // Tabletop glass rim
    const topGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.08, 32);
    const topMat = new THREE.MeshPhysicalMaterial({
      color: 0x0369a1,
      metalness: 0.4,
      roughness: 0.1,
      transmission: 0.85,
      thickness: 0.5,
      transparent: true,
      opacity: 0.9,
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.88;
    top.castShadow = true;
    table.add(top);

    // Holographic projected sphere in center
    const holoGeo = new THREE.IcosahedronGeometry(0.4, 2);
    const holoMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      wireframe: true,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.2,
    });
    const holo = new THREE.Mesh(holoGeo, holoMat);
    holo.position.y = 1.45;
    table.add(holo);

    return table;
  }

  private createVRHeadset(): THREE.Group {
    const headset = new THREE.Group();
    headset.name = 'Spatial VR/MR Headset';
    headset.userData['animateHover'] = true;

    // Visor Body
    const visorGeo = new THREE.BoxGeometry(0.5, 0.28, 0.35);
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: 0x0b0f19,
      metalness: 0.8,
      roughness: 0.15,
      clearcoat: 1.0,
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.y = 1.0;
    visor.castShadow = true;
    headset.add(visor);

    // Front reflective glass panel
    const frontGeo = new THREE.BoxGeometry(0.48, 0.24, 0.02);
    const frontMat = new THREE.MeshPhysicalMaterial({
      color: 0x818cf8,
      metalness: 0.9,
      roughness: 0.05,
      transmission: 0.6,
      transparent: true,
      opacity: 0.8,
    });
    const front = new THREE.Mesh(frontGeo, frontMat);
    front.position.set(0, 1.0, 0.18);
    headset.add(front);

    // Stereo Passthrough Cameras
    const camGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16);
    const camMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff });
    [-0.14, 0.14].forEach((cx) => {
      const cam = new THREE.Mesh(camGeo, camMat);
      cam.rotation.x = Math.PI / 2;
      cam.position.set(cx, 1.0, 0.19);
      headset.add(cam);
    });

    // Ergonomic Strap
    const strapGeo = new THREE.TorusGeometry(0.28, 0.03, 8, 24, Math.PI);
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const strap = new THREE.Mesh(strapGeo, strapMat);
    strap.position.set(0, 1.0, -0.15);
    headset.add(strap);

    return headset;
  }

  private createARChair(): THREE.Group {
    const chair = new THREE.Group();
    chair.name = 'Spatial Modern Chair';

    // Seat cushion
    const seatGeo = new THREE.BoxGeometry(0.7, 0.1, 0.7);
    const seatMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      roughness: 0.5,
      metalness: 0.1,
    });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.y = 0.5;
    seat.castShadow = true;
    chair.add(seat);

    // Backrest
    const backGeo = new THREE.BoxGeometry(0.7, 0.6, 0.1);
    const back = new THREE.Mesh(backGeo, seatMat);
    back.position.set(0, 0.82, -0.3);
    back.castShadow = true;
    chair.add(back);

    // Metal legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
    const legCoords = [
      [-0.3, -0.3],
      [0.3, -0.3],
      [-0.3, 0.3],
      [0.3, 0.3],
    ];

    legCoords.forEach(([lx, lz]) => {
      const legGeo = new THREE.CylinderGeometry(0.025, 0.02, 0.5, 12);
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, 0.25, lz);
      leg.castShadow = true;
      chair.add(leg);
    });

    return chair;
  }

  private createBioCore(): THREE.Group {
    const core = new THREE.Group();
    core.name = 'Bio-Holo Energy Core';
    core.userData['animateHover'] = true;

    // Glowing Inner Plasma Sphere
    const innerGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const innerMat = new THREE.MeshPhysicalMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 2.0,
      roughness: 0.1,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.position.y = 1.0;
    core.add(inner);

    // Outer Transmissive Glass Shell
    const shellGeo = new THREE.IcosahedronGeometry(0.55, 3);
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.92,
      thickness: 1.2,
      transparent: true,
      opacity: 0.85,
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    shell.position.y = 1.0;
    core.add(shell);

    // Orbiting rings
    const ringGeo = new THREE.TorusGeometry(0.75, 0.02, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.0 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    ring.position.y = 1.0;
    core.add(ring);

    return core;
  }

  // Export current scene or selected object as binary .GLB
  exportGLB(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const exporter = new GLTFExporter();
      const exportTarget = this.currentSelectedMesh || this.interactiveGroup;

      exporter.parse(
        exportTarget,
        (gltf) => {
          if (gltf instanceof ArrayBuffer) {
            const blob = new Blob([gltf], { type: 'model/gltf-binary' });
            resolve(blob);
          } else {
            const output = JSON.stringify(gltf, null, 2);
            const blob = new Blob([output], { type: 'model/gltf+json' });
            resolve(blob);
          }
        },
        (error) => {
          console.error('GLTF export error:', error);
          reject(error);
        },
        { binary: true }
      );
    });
  }

  // Import custom 3D file (.glb, .gltf) from user's local disk
  loadLocalModel(file: File): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const contents = e.target?.result;
        if (!contents) {
          reject(new Error('Empty file'));
          return;
        }

        const loader = new GLTFLoader();
        loader.parse(
          contents as ArrayBuffer,
          '',
          (gltf) => {
            const model = gltf.scene;
            model.name = file.name.replace(/\.[^/.]+$/, '');
            model.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            // Normalize scale and center
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxAxis = Math.max(size.x, size.y, size.z);
            if (maxAxis > 0) {
              const scale = 1.5 / maxAxis;
              model.scale.set(scale, scale, scale);
            }
            model.position.y = 0;

            this.interactiveGroup.add(model);
            this.selectObject(model);
            this.refreshSceneGraph();
            resolve(model);
          },
          (err) => reject(err)
        );
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  // Delete selected object
  deleteSelectedObject() {
    if (this.currentSelectedMesh) {
      this.interactiveGroup.remove(this.currentSelectedMesh);
      this.selectObject(null);
      this.refreshSceneGraph();
    }
  }

  // Refresh scene graph signal for UI
  refreshSceneGraph() {
    const list: Scene3DObject[] = [];
    this.interactiveGroup.children.forEach((obj) => {
      let materialProps: Scene3DObject['material'] | undefined = undefined;
      obj.traverse((c) => {
        if (c instanceof THREE.Mesh && c.material && !materialProps) {
          const m = c.material as THREE.MeshPhysicalMaterial;
          materialProps = {
            color: '#' + (m.color ? m.color.getHexString() : 'ffffff'),
            roughness: m.roughness ?? 0.5,
            metalness: m.metalness ?? 0.5,
            wireframe: m.wireframe ?? false,
            transmission: m.transmission ?? 0,
            emissive: '#' + (m.emissive ? m.emissive.getHexString() : '000000'),
          };
        }
      });

      list.push({
        id: obj.uuid,
        name: obj.name || 'Spatial Object',
        type: 'group',
        visible: obj.visible,
        position: [obj.position.x, obj.position.y, obj.position.z],
        rotation: [
          THREE.MathUtils.radToDeg(obj.rotation.x),
          THREE.MathUtils.radToDeg(obj.rotation.y),
          THREE.MathUtils.radToDeg(obj.rotation.z),
        ],
        scale: [obj.scale.x, obj.scale.y, obj.scale.z],
        material: materialProps,
        childrenCount: obj.children.length,
      });
    });
    this.sceneGraph.set(list);
  }

  private onResize() {
    if (!this.container || !this.renderer || !this.cameraPerspective || !this.cameraOrthographic) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;

    this.cameraPerspective.aspect = aspect;
    this.cameraPerspective.updateProjectionMatrix();

    const frustumSize = 5;
    this.cameraOrthographic.left = (-frustumSize * aspect) / 2;
    this.cameraOrthographic.right = (frustumSize * aspect) / 2;
    this.cameraOrthographic.top = frustumSize / 2;
    this.cameraOrthographic.bottom = -frustumSize / 2;
    this.cameraOrthographic.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  dispose() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  }
}
