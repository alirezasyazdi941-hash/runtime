import { Injectable, signal, computed } from '@angular/core';
import { CostAccounting } from '../models/runtime.model';

@Injectable({
  providedIn: 'root'
})
export class NetworkCost {
  // Live network connectivity
  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly forceOfflineSimulation = signal<boolean>(false);

  // Computed actual network state (accounting for simulation)
  readonly effectiveOnline = computed(() => {
    if (this.forceOfflineSimulation()) return false;
    return this.isOnline();
  });

  // Cost and usage accounting
  readonly costAccounting = signal<CostAccounting>({
    totalLocalExecutions: 142,
    totalWasmExecutions: 89,
    totalOnDemandServerSeconds: 47,
    totalServerRequests: 18,
    estimatedCloudCostUsd: 0.00078,
    estimatedEquivalent247CostUsd: 28.50, // Standard $0.04/hr t3.small or Cloud Run minimum instance for a month
    netSavingsUsd: 28.49922,
    monthlyBudgetCapUsd: 5.00,
    externalAccessAllowed: false,
    scaleToZeroCount: 14
  });

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.isOnline.set(true));
      window.addEventListener('offline', () => this.isOnline.set(false));
    }
  }

  toggleForceOffline(force: boolean): void {
    this.forceOfflineSimulation.set(force);
  }

  setExternalAccessAllowed(allowed: boolean): void {
    this.costAccounting.update(prev => ({
      ...prev,
      externalAccessAllowed: allowed
    }));
  }

  setMonthlyBudgetCap(cap: number): void {
    this.costAccounting.update(prev => ({
      ...prev,
      monthlyBudgetCapUsd: cap
    }));
  }

  recordLocalExecution(): void {
    this.costAccounting.update(prev => {
      const totalLocal = prev.totalLocalExecutions + 1;
      const savings = +(prev.netSavingsUsd + 0.015).toFixed(5);
      return {
        ...prev,
        totalLocalExecutions: totalLocal,
        netSavingsUsd: savings
      };
    });
  }

  recordWasmExecution(): void {
    this.costAccounting.update(prev => {
      const totalWasm = prev.totalWasmExecutions + 1;
      const savings = +(prev.netSavingsUsd + 0.025).toFixed(5);
      return {
        ...prev,
        totalWasmExecutions: totalWasm,
        netSavingsUsd: savings
      };
    });
  }

  recordServerUsage(durationSeconds: number, requestsCount: number): void {
    this.costAccounting.update(prev => {
      // Standard serverless: ~$0.000016667 per second (1GB RAM)
      const costAddition = durationSeconds * 0.000016667;
      const newCost = +(prev.estimatedCloudCostUsd + costAddition).toFixed(6);
      const newDuration = prev.totalOnDemandServerSeconds + durationSeconds;
      const newRequests = prev.totalServerRequests + requestsCount;
      return {
        ...prev,
        totalOnDemandServerSeconds: newDuration,
        totalServerRequests: newRequests,
        estimatedCloudCostUsd: newCost,
        scaleToZeroCount: prev.scaleToZeroCount + 1
      };
    });
  }
}
