export type SelfContainmentLevel = 1 | 2 | 3;

export type RuntimeMode = 'mode-a-web' | 'mode-b-wasm' | 'mode-c-server';

export interface ProjectFile {
  path: string;
  name: string;
  content: string;
  language: string;
  sizeBytes: number;
  isBinary?: boolean;
  binaryData?: Uint8Array;
}

export interface ProjectDependency {
  name: string;
  version: string;
  type: 'runtime' | 'dev' | 'peer' | 'system' | 'wasm';
  canBeBundledLocally: boolean;
  alternativeSuggestion?: string;
}

export interface NetworkCallDetection {
  file: string;
  line: number;
  url: string;
  method: string;
  isExternal: boolean;
  risk: 'low' | 'medium' | 'high';
}

export interface ArchitecturalAnalysis {
  detectedLanguages: { name: string; percentage: number; color: string }[];
  framework: string;
  entryPoints: string[];
  dependencies: ProjectDependency[];
  externalNetworkCalls: NetworkCallDetection[];
  selfContainmentLevel: SelfContainmentLevel;
  selfContainmentScore: number; // 0 - 100
  wasmFeasibility: {
    canCompileToWasm: boolean;
    compatibleComponents: string[];
    unsupportedComponents: string[];
    recommendedToolchain: 'WAT Assembler' | 'AssemblyScript' | 'Rust wasm-bindgen' | 'C/C++ Emscripten' | 'Go WASM' | 'Pyodide WASM' | 'None (Native Web)';
    reasoning: string;
  };
  serverRequirements: {
    requiresServer: boolean;
    reason?: string;
    canScaleToZero: boolean;
    idleTimeoutSeconds: number;
  };
  securityAudit: {
    isolationGrade: 'A+' | 'A' | 'B' | 'C';
    safeForOffline: boolean;
    fileSystemAccess: boolean;
    storageAccess: boolean;
    privilegeEscalationRisk: 'none' | 'low' | 'medium';
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  files: ProjectFile[];
  activeFilePath?: string;
  runtimeMode: RuntimeMode;
  analysis?: ArchitecturalAnalysis;
  wasmBytecode?: Uint8Array;
  wasmExportFunctions?: string[];
  tags: string[];
}
