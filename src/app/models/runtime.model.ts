import { RuntimeMode } from './project.model';

export type LogLevel = 'info' | 'warn' | 'error' | 'wasm' | 'system' | 'network';

export interface ExecutionLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: 'browser' | 'wasm' | 'server' | 'compiler' | 'containment' | 'system';
  message: string;
  details?: unknown;
}

export interface WasmModuleInspection {
  magicNumberValid: boolean;
  version: number;
  sections: { id: number; name: string; sizeBytes: number }[];
  exportedFunctions: { name: string; signature: string }[];
  importedFunctions: { module: string; name: string }[];
  memoryInitialPages: number;
  memoryMaxPages?: number;
  wasiCompliant: boolean;
}

export interface WasmBenchmarkResult {
  functionName: string;
  iterations: number;
  wasmDurationMs: number;
  jsDurationMs: number;
  speedupFactor: number;
  memoryConsumedBytes: number;
}

export interface RuntimeState {
  status: 'idle' | 'starting' | 'running' | 'paused' | 'stopped' | 'error';
  mode: RuntimeMode;
  activeSessionId?: string;
  startedAt?: number;
  elapsedSeconds: number;
  idleSeconds: number;
  autoShutdownLimitSeconds: number;
  memoryUsageMb: number;
  requestCount: number;
  estimatedCostUsd: number;
  activeEndpointUrl?: string;
}

export interface CostAccounting {
  totalLocalExecutions: number;
  totalWasmExecutions: number;
  totalOnDemandServerSeconds: number;
  totalServerRequests: number;
  estimatedCloudCostUsd: number;
  estimatedEquivalent247CostUsd: number;
  netSavingsUsd: number;
  monthlyBudgetCapUsd: number;
  externalAccessAllowed: boolean;
  scaleToZeroCount: number;
}
