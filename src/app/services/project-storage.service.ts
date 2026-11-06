import { Injectable, signal } from '@angular/core';
import { XRProject } from '../models/xr.models';

const STORAGE_KEY = 'reality_forge_projects';
const ACTIVE_PROJ_KEY = 'reality_forge_active_project_id';

@Injectable({
  providedIn: 'root',
})
export class ProjectStorageService {
  projects = signal<XRProject[]>([]);
  activeProjectId = signal<string>('proj-cyber-drone');

  constructor() {
    this.loadProjects();
  }

  private loadProjects() {
    if (typeof window === 'undefined') return;

    let loaded: XRProject[] = [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        loaded = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to parse saved projects:', e);
    }

    if (loaded.length === 0) {
      // Seed initial high-quality engineering projects
      loaded = [
        {
          id: 'proj-cyber-drone',
          name: 'Cyberpunk Drone & Spatial Sensor',
          description:
            'A 6-DOF autonomous spatial surveillance drone featuring real-time quad-rotor physics, LiDAR sensor simulation, and PBR metallic clearcoat shaders.',
          engine: 'Three.js',
          targetPlatform: 'WebXR (All Devices)',
          version: '1.2.0',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['Three.js', 'PBR', 'Drone', 'Spatial Computing', 'WebXR'],
          sceneObjectsCount: 9,
          code: `import * as THREE from 'three';\n// Cyberpunk Drone Spatial Rig\nconst scene = new THREE.Scene();\nconst camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);`,
        },
        {
          id: 'proj-ar-furniture',
          name: 'AR Surface Reticle & Furniture Lab',
          description:
            'Interactive augmented reality furniture visualizer with real-time floor hit-testing, surface reticle snapping, and high-res photo capture.',
          engine: 'WebXR',
          targetPlatform: 'iOS (ARKit/Safari)',
          version: '2.0.4',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['AR', 'Hit-Test', 'WebXR', 'Spatial Reticle', 'Furniture'],
          sceneObjectsCount: 5,
          code: `// WebXR AR Surface Reticle Hit Testing\nsession.requestHitTestSource({ space: viewerSpace });`,
        },
        {
          id: 'proj-vr-holodeck',
          name: 'Holodeck VR & Dual 6-DOF Controllers',
          description:
            'Immersive virtual reality training room with dual controller raycasting, grabbable physical objects, teleportation arcs, and 3D positional HRTF spatial audio.',
          engine: 'Three.js',
          targetPlatform: 'Meta Quest / Vision Pro',
          version: '1.0.0',
          createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['VR', 'Meta Quest', 'Controllers', 'Physics', 'HRTF Audio'],
          sceneObjectsCount: 8,
          code: `// VR Dual Controller Grab & Teleport Arc\nconst leftController = renderer.xr.getController(0);`,
        },
      ];
      this.saveProjectsToStorage(loaded);
    }

    this.projects.set(loaded);

    const savedActive = localStorage.getItem(ACTIVE_PROJ_KEY);
    if (savedActive && loaded.some((p) => p.id === savedActive)) {
      this.activeProjectId.set(savedActive);
    } else if (loaded.length > 0) {
      this.activeProjectId.set(loaded[0].id);
    }
  }

  getActiveProject(): XRProject | undefined {
    return this.projects().find((p) => p.id === this.activeProjectId());
  }

  setActiveProject(id: string) {
    this.activeProjectId.set(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_PROJ_KEY, id);
    }
  }

  createProject(newProj: Partial<XRProject>): XRProject {
    const project: XRProject = {
      id: `proj-${Date.now()}`,
      name: newProj.name || 'Untitled Spatial Project',
      description: newProj.description || 'New WebXR spatial project created in Reality Forge.',
      engine: newProj.engine || 'Three.js',
      targetPlatform: newProj.targetPlatform || 'WebXR (All Devices)',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: newProj.tags || ['WebXR', 'Three.js'],
      sceneObjectsCount: newProj.sceneObjectsCount || 1,
      code:
        newProj.code ||
        `import * as THREE from 'three';\n// Welcome to your new Spatial Project\nconst scene = new THREE.Scene();`,
    };

    const updated = [project, ...this.projects()];
    this.projects.set(updated);
    this.saveProjectsToStorage(updated);
    this.setActiveProject(project.id);
    return project;
  }

  deleteProject(id: string) {
    const filtered = this.projects().filter((p) => p.id !== id);
    this.projects.set(filtered);
    this.saveProjectsToStorage(filtered);
    if (this.activeProjectId() === id && filtered.length > 0) {
      this.setActiveProject(filtered[0].id);
    }
  }

  private saveProjectsToStorage(items: XRProject[]) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (err) {
        console.warn('Storage save failed:', err);
      }
    }
  }

  // Export current project as single-file standalone runnable HTML5 package
  exportStandaloneHTML(project: XRProject): void {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${project.name} - NONONICK REALITY FORGE</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; overflow: hidden; background: #06070a; font-family: sans-serif; }
    #hud { position: absolute; top: 16px; left: 16px; color: #00f0ff; background: rgba(9,12,18,0.8); padding: 12px 18px; border-radius: 8px; border: 1px solid #1e293b; }
    #hud h1 { margin: 0 0 6px 0; font-size: 16px; font-weight: 700; }
    #hud p { margin: 0; font-size: 12px; color: #94a3b8; }
  </style>
  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
      }
    }
  </script>
</head>
<body>
  <div id="hud">
    <h1>${project.name}</h1>
    <p>${project.description}</p>
    <p>Target: ${project.targetPlatform} | Engine: ${project.engine}</p>
  </div>
  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06070a);
    scene.fog = new THREE.FogExp2(0x06070a, 0.03);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(3, 2, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Grid
    const grid = new THREE.GridHelper(16, 32, 0x00f0ff, 0x1e293b);
    scene.add(grid);

    // Hero Object
    const geo = new THREE.IcosahedronGeometry(0.8, 2);
    const mat = new THREE.MeshPhysicalMaterial({ color: 0x00f0ff, metalness: 0.8, roughness: 0.2, wireframe: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 1;
    scene.add(mesh);

    // Lights
    const dir = new THREE.DirectionalLight(0xffffff, 2);
    dir.position.set(4, 6, 4);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0x1e293b, 1.2));

    function animate() {
      requestAnimationFrame(animate);
      mesh.rotation.y += 0.01;
      mesh.rotation.x += 0.005;
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id}-standalone.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
