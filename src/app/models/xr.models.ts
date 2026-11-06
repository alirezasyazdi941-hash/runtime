export type SupportedLanguage = 'en' | 'fa';

export type StudioView = 
  | 'dashboard'
  | '3d-workspace'
  | 'ar-studio'
  | 'vr-studio'
  | 'code-workspace'
  | 'ai-forge'
  | 'academy'
  | 'asset-library'
  | 'qa-test'
  | 'knowledge-center';

export interface XRProject {
  id: string;
  name: string;
  description: string;
  engine: 'Three.js' | 'WebXR' | 'Unity-OpenXR' | 'ARKit-RealityKit' | 'ARCore';
  targetPlatform: 'WebXR (All Devices)' | 'Meta Quest / Vision Pro' | 'iOS (ARKit/Safari)' | 'Android (ARCore)' | 'Desktop WebGL';
  version: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  code: string;
  sceneObjectsCount: number;
}

export interface HardwareReport {
  timestamp: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'XR Headset' | 'Unknown';
  os: string;
  browser: string;
  isHttps: boolean;
  webgl1Supported: boolean;
  webgl2Supported: boolean;
  gpuRenderer: string;
  gpuVendor: string;
  maxTextureSize: number;
  maxRenderBufferSize: number;
  webxrSupported: boolean;
  immersiveVrSupported: boolean;
  immersiveArSupported: boolean;
  inlineSupported: boolean;
  cameraAvailable: boolean;
  gyroscopeAvailable: boolean;
  accelerometerAvailable: boolean;
  estimatedFps: number;
  recommendedEngine: string;
  compatibilityScore: number; // 0 - 100
  notes: string[];
}

export interface Scene3DObject {
  id: string;
  name: string;
  type: 'mesh' | 'group' | 'light' | 'camera' | 'helper';
  visible: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  material?: {
    color: string;
    roughness: number;
    metalness: number;
    wireframe: boolean;
    transmission: number;
    emissive: string;
  };
  childrenCount?: number;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: 'WebXR' | 'Three.js' | 'OpenXR' | 'ARKit' | 'ARCore' | 'GLSL' | 'Math3D' | 'W3C';
  source: string;
  url: string;
  lastVerified: string;
  deprecatedNotice?: string;
  summaryEn: string;
  summaryFa: string;
  codeSnippet?: string;
  tags: string[];
}

export interface AcademyLesson {
  id: string;
  level: number;
  titleEn: string;
  titleFa: string;
  category: 'Fundamentals' | 'Mathematics' | 'Three.js' | 'Shaders' | 'AR' | 'VR' | 'Spatial' | 'WebXR';
  durationMinutes: number;
  summaryEn: string;
  summaryFa: string;
  theoryEn: string;
  theoryFa: string;
  codeSample: string;
  challengeEn: string;
  challengeFa: string;
  quiz: {
    questionEn: string;
    questionFa: string;
    optionsEn: string[];
    optionsFa: string[];
    correctIndex: number;
    explanationEn: string;
    explanationFa: string;
  };
}

export interface QATestResult {
  id: string;
  nameEn: string;
  nameFa: string;
  category: 'WebGL' | 'WebXR' | 'Performance' | 'Memory' | 'Security';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  messageEn: string;
  messageFa: string;
  durationMs: number;
  metrics?: Record<string, unknown>;
}

export interface Asset3DItem {
  id: string;
  name: string;
  category: 'models' | 'materials' | 'shaders' | 'audio' | 'prefabs';
  type: string;
  descriptionEn: string;
  descriptionFa: string;
  thumbnailIcon: string;
  license: 'MIT / OpenXR CC0' | 'Apache 2.0' | 'RealityForge Procedural';
}
