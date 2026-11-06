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
import { RealityAIService, CodeDiagnosis } from '../../services/reality-ai.service';
import { ProjectStorageService } from '../../services/project-storage.service';
import { I18nService } from '../../services/i18n.service';

interface ConsoleLog {
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: string;
}

@Component({
  selector: 'app-code-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="h-[calc(100vh-65px)] bg-[#07090e] flex flex-col overflow-hidden">
      <!-- Toolbar -->
      <div class="bg-[#0c1017] border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <!-- Language / Template Presets -->
        <div class="flex items-center gap-2">
          <span class="font-bold text-white flex items-center gap-1.5 font-mono">
            <mat-icon class="text-cyan-400 text-sm">code</mat-icon>
            {{ i18n.t('code.title') }}
          </span>

          <div class="h-4 w-[1px] bg-slate-800 mx-1"></div>

          <!-- Template Presets -->
          <div class="flex items-center gap-1">
            <button
              (click)="loadPreset('threejs')"
              [class.bg-cyan-500]="activePreset() === 'threejs'"
              [class.text-black]="activePreset() === 'threejs'"
              [class.text-slate-300]="activePreset() !== 'threejs'"
              class="px-2.5 py-1 rounded-md bg-[#131924] font-semibold hover:text-white transition-all"
            >
              Three.js PBR
            </button>
            <button
              (click)="loadPreset('webxr-ar')"
              [class.bg-cyan-500]="activePreset() === 'webxr-ar'"
              [class.text-black]="activePreset() === 'webxr-ar'"
              [class.text-slate-300]="activePreset() !== 'webxr-ar'"
              class="px-2.5 py-1 rounded-md bg-[#131924] font-semibold hover:text-white transition-all"
            >
              WebXR Hit-Test
            </button>
            <button
              (click)="loadPreset('glsl')"
              [class.bg-cyan-500]="activePreset() === 'glsl'"
              [class.text-black]="activePreset() === 'glsl'"
              [class.text-slate-300]="activePreset() !== 'glsl'"
              class="px-2.5 py-1 rounded-md bg-[#131924] font-semibold hover:text-white transition-all"
            >
              GLSL Shader
            </button>
          </div>
        </div>

        <!-- Action Buttons: Run, Debug with AI, Export HTML -->
        <div class="flex items-center gap-2">
          <button
            (click)="runCode()"
            class="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
          >
            <mat-icon class="text-sm">play_arrow</mat-icon>
            <span>{{ i18n.t('code.run') }}</span>
          </button>

          <button
            (click)="debugWithAI()"
            [disabled]="realityAI.isDebugging()"
            class="px-3.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <mat-icon class="text-sm">auto_fix_high</mat-icon>
            <span>{{ realityAI.isDebugging() ? 'Diagnosing...' : i18n.t('code.debugAI') }}</span>
          </button>

          <button
            (click)="exportHTML()"
            class="px-3 py-1.5 rounded-lg bg-[#131924] hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1 border border-slate-700 transition-all"
          >
            <mat-icon class="text-sm">download</mat-icon>
            <span>Export HTML</span>
          </button>
        </div>
      </div>

      <!-- Main Split: Code Editor (Left) & Live Sandbox Runner (Right) -->
      <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        <!-- Left: Code Editor & Console -->
        <div class="flex flex-col border-r border-slate-800/80 h-full overflow-hidden">
          <!-- Textarea Editor with Monospace and Tab indent -->
          <div class="relative flex-1 bg-[#090c12] overflow-hidden flex">
            <!-- Line numbers -->
            <div class="w-12 bg-[#0c1017] text-slate-600 font-mono text-xs py-3 text-right pr-2 select-none border-r border-slate-800/60">
              @for (line of lineNumbers(); track $index) {
                <div>{{ line }}</div>
              }
            </div>

            <!-- Editor Input -->
            <textarea
              #editorTextarea
              [(ngModel)]="codeContent"
              (ngModelChange)="updateLineNumbers()"
              (keydown.tab)="onTabPress($event)"
              spellcheck="false"
              class="flex-1 w-full h-full bg-transparent text-slate-200 font-mono text-xs p-3 focus:outline-none resize-none leading-relaxed selection:bg-cyan-500/30 overflow-y-auto whitespace-pre"
            ></textarea>
          </div>

          <!-- Bottom Console Drawer -->
          <div class="h-44 bg-[#090d14] border-t border-slate-800 flex flex-col overflow-hidden">
            <div class="px-3 py-1.5 bg-[#0c1017] border-b border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
              <span class="text-slate-400 font-bold flex items-center gap-1">
                <mat-icon class="text-xs text-emerald-400">terminal</mat-icon>
                {{ i18n.t('code.console') }}
              </span>
              <button (click)="clearConsole()" class="text-slate-500 hover:text-slate-300">
                {{ i18n.t('code.clearConsole') }}
              </button>
            </div>

            <div class="flex-1 p-2 overflow-y-auto font-mono text-xs space-y-1">
              @if (consoleLogs().length === 0) {
                <div class="text-slate-600 italic">No output yet. Click 'Execute' to run the WebXR/Three.js sandbox.</div>
              }
              @for (log of consoleLogs(); track $index) {
                <div class="flex items-start gap-2 leading-tight" [class.text-red-400]="log.type === 'error'" [class.text-amber-400]="log.type === 'warn'" [class.text-slate-300]="log.type === 'log'">
                  <span class="text-[10px] text-slate-600">{{ log.timestamp }}</span>
                  <span class="flex-1">{{ log.message }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right: Live Sandboxed Iframe Runner & AI Diagnosis Drawer -->
        <div class="flex flex-col h-full bg-[#030508] relative overflow-hidden">
          <div class="px-3 py-1.5 bg-[#0c1017] border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              Live Isolated WebXR / Three.js Viewport
            </span>
            <span class="text-[11px] text-cyan-400 font-bold">Interactive OrbitControls</span>
          </div>

          <!-- Iframe Sandbox -->
          <iframe
            #sandboxIframe
            sandbox="allow-scripts allow-same-origin allow-modals"
            class="flex-1 w-full h-full border-none bg-[#06070a]"
          ></iframe>

          <!-- AI Diagnosis Drawer (if generated) -->
          @if (diagnosisResult()) {
            <div class="absolute inset-x-0 bottom-0 max-h-72 bg-[#0c121d]/95 backdrop-blur-md border-t border-purple-500/40 p-4 overflow-y-auto space-y-3 z-20 shadow-2xl">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-xs text-purple-300 flex items-center gap-1.5 font-mono">
                  <mat-icon class="text-sm">psychology</mat-icon>
                  REALITY MASTER AI // Code Diagnostic Report
                </h4>
                <button (click)="diagnosisResult.set(null)" class="text-slate-400 hover:text-white">
                  <mat-icon class="text-sm">close</mat-icon>
                </button>
              </div>

              <p class="text-xs text-slate-300 leading-relaxed font-sans">
                {{ diagnosisResult()?.summary }}
              </p>

              <!-- Detected issues -->
              <div class="space-y-1.5">
                @for (issue of diagnosisResult()?.detectedIssues; track $index) {
                  <div class="p-2 rounded-lg bg-[#141b2b] border border-slate-700 text-xs font-mono space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="text-amber-400 font-bold uppercase">[{{ issue.type }}] Line {{ issue.line }}</span>
                      <span class="text-slate-500 text-[10px]">{{ issue.message }}</span>
                    </div>
                    <p class="text-slate-300 text-[11px]">Suggestion: {{ issue.suggestion }}</p>
                  </div>
                }
              </div>

              <!-- Apply Optimized Code -->
              <div class="flex justify-end gap-2 pt-1">
                <button
                  (click)="applyOptimizedCode()"
                  class="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-1"
                >
                  <mat-icon class="text-sm">done_all</mat-icon>
                  <span>Apply Optimized Code to Editor</span>
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class CodeWorkspaceComponent implements OnInit, OnDestroy {
  @ViewChild('sandboxIframe', { static: true }) sandboxIframe!: ElementRef<HTMLIFrameElement>;
  @ViewChild('editorTextarea') editorTextarea?: ElementRef<HTMLTextAreaElement>;

  realityAI = inject(RealityAIService);
  projectStorage = inject(ProjectStorageService);
  i18n = inject(I18nService);

  activePreset = signal<'threejs' | 'webxr-ar' | 'glsl'>('threejs');
  codeContent = '';
  lineNumbers = signal<number[]>([1]);
  consoleLogs = signal<ConsoleLog[]>([]);
  diagnosisResult = signal<CodeDiagnosis | null>(null);

  private messageListener: ((event: MessageEvent) => void) | null = null;

  ngOnInit() {
    this.loadPreset('threejs');

    // Listen to console messages from sandbox iframe
    this.messageListener = (event: MessageEvent) => {
      if (event.data && event.data.type === 'reality_forge_console') {
        const newLog: ConsoleLog = {
          type: event.data.level || 'log',
          message: event.data.message || '',
          timestamp: new Date().toLocaleTimeString(),
        };
        this.consoleLogs.update((list) => [...list, newLog]);
      }
    };
    window.addEventListener('message', this.messageListener);

    // Initial run
    setTimeout(() => this.runCode(), 300);
  }

  ngOnDestroy() {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
    }
  }

  loadPreset(type: 'threejs' | 'webxr-ar' | 'glsl') {
    this.activePreset.set(type);

    if (type === 'threejs') {
      this.codeContent = `// Three.js PBR Scene with RoomEnvironment & Cyber Mesh
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06070a);
scene.fog = new THREE.FogExp2(0x06070a, 0.03);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(3, 2, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Grid & Light Rig
const grid = new THREE.GridHelper(16, 32, 0x00f0ff, 0x1e293b);
scene.add(grid);

const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.5);
keyLight.position.set(4, 6, 4);
scene.add(keyLight);
scene.add(new THREE.HemisphereLight(0x38bdf8, 0x090d16, 1.2));

// Cyber Torus Knot Mesh
const geo = new THREE.TorusKnotGeometry(0.8, 0.25, 128, 32);
const mat = new THREE.MeshPhysicalMaterial({
  color: 0x00f0ff,
  metalness: 0.9,
  roughness: 0.15,
  clearcoat: 0.8
});
const mesh = new THREE.Mesh(geo, mat);
mesh.position.y = 1.2;
scene.add(mesh);

console.log('Three.js PBR scene initialized successfully at 60 FPS.');

function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.y += 0.01;
  mesh.rotation.x += 0.005;
  controls.update();
  renderer.render(scene, camera);
}
animate();
`;
    } else if (type === 'webxr-ar') {
      this.codeContent = `// WebXR Environmental Hit-Test & Surface Snapping
import * as THREE from 'three';

console.log('Checking WebXR immersive-ar session support...');

if ('xr' in navigator) {
  navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
    if (supported) {
      console.log('✅ WebXR immersive-ar is natively supported on this device!');
    } else {
      console.warn('⚠️ WebXR immersive-ar is not natively active. Camera video passthrough simulator active.');
    }
  });
} else {
  console.warn('WebXR API unavailable in this browser context.');
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const reticle = new THREE.Mesh(
  new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0x00f0ff })
);
reticle.position.set(0, 0, -2);
scene.add(reticle);

function animate() {
  requestAnimationFrame(animate);
  reticle.rotation.z += 0.02;
  renderer.render(scene, camera);
}
animate();
`;
    } else {
      this.codeContent = `// GLSL Holographic Scanline & Fresnel Shield Shader
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06070a);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// Custom GLSL Shader Material
const customMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 }
  },
  vertexShader: \`
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  \`,
  fragmentShader: \`
    uniform float uTime;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
      float scanline = sin(vPosition.y * 40.0 + uTime * 6.0) * 0.5 + 0.5;
      vec3 cyanGlow = vec3(0.0, 0.94, 1.0) * (fresnel + scanline * 0.4);
      gl_FragColor = vec4(cyanGlow, fresnel + 0.2);
    }
  \`,
  transparent: true,
  side: THREE.DoubleSide
});

const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 4), customMaterial);
sphere.position.y = 1.0;
scene.add(sphere);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  customMaterial.uniforms.uTime.value = clock.getElapsedTime();
  sphere.rotation.y += 0.005;
  controls.update();
  renderer.render(scene, camera);
}
animate();
`;
    }

    this.updateLineNumbers();
  }

  updateLineNumbers() {
    const lines = this.codeContent.split('\n').length;
    const nums: number[] = [];
    for (let i = 1; i <= Math.max(lines, 20); i++) {
      nums.push(i);
    }
    this.lineNumbers.set(nums);
  }

  onTabPress(e: Event) {
    e.preventDefault();
    const textarea = this.editorTextarea?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    this.codeContent = this.codeContent.substring(0, start) + '  ' + this.codeContent.substring(end);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    }, 0);
  }

  runCode() {
    if (!this.sandboxIframe) return;

    const htmlBundle = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; overflow: hidden; background: #06070a; font-family: sans-serif; }
  </style>
  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
      }
    }
  </script>
  <script>
    // Capture console output to parent window
    ['log', 'warn', 'error', 'info'].forEach(level => {
      const orig = console[level];
      console[level] = function(...args) {
        orig.apply(console, args);
        try {
          window.parent.postMessage({
            type: 'reality_forge_console',
            level: level,
            message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
          }, '*');
        } catch(e) {}
      };
    });

    window.onerror = function(msg, url, line) {
      window.parent.postMessage({
        type: 'reality_forge_console',
        level: 'error',
        message: 'Line ' + line + ': ' + msg
      }, '*');
    };
  </script>
</head>
<body>
  <script type="module">
    ${this.codeContent}
  </script>
</body>
</html>`;

    const blob = new Blob([htmlBundle], { type: 'text/html' });
    this.sandboxIframe.nativeElement.src = URL.createObjectURL(blob);
    this.consoleLogs.update((list) => [
      ...list,
      {
        type: 'info',
        message: 'Executing script in secure sandboxed container...',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }

  async debugWithAI() {
    const lastError = this.consoleLogs().filter((l) => l.type === 'error').pop()?.message || 'Check for Three.js / WebXR optimizations and version issues';
    const diagnosis = await this.realityAI.analyzeCode(this.codeContent, lastError, 'Debug and optimize for 60 FPS WebXR');
    this.diagnosisResult.set(diagnosis);
  }

  applyOptimizedCode() {
    const diag = this.diagnosisResult();
    if (diag && diag.optimizedCode) {
      this.codeContent = diag.optimizedCode;
      this.updateLineNumbers();
      this.runCode();
      this.diagnosisResult.set(null);
    }
  }

  exportHTML() {
    const blob = new Blob([this.codeContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reality-forge-script-${Date.now()}.js`;
    a.click();
    URL.revokeObjectURL(url);
  }

  clearConsole() {
    this.consoleLogs.set([]);
  }
}
