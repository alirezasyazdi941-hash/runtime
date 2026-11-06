import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NetworkCost } from '../services/network-cost';
import { RuntimeManager } from '../services/runtime-manager';

@Component({
  selector: 'app-cost-monitor-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Zero-Waste Financial Architecture</span>
            <span class="text-slate-600">·</span>
            <span class="text-xs font-mono text-slate-400">Scale-to-Zero Ledger</span>
          </div>
          <h1 class="text-xl font-bold text-white tracking-tight mt-0.5">On-Demand Cost &amp; Infrastructure Governance</h1>
        </div>

        <div class="flex items-center gap-2">
          <!-- Authorization toggle for external APIs -->
          <button
            type="button"
            (click)="toggleExternalAccess()"
            class="px-3.5 py-1.5 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1.5"
            [class.bg-emerald-950]="networkCost.costAccounting().externalAccessAllowed"
            [class.border-emerald-800]="networkCost.costAccounting().externalAccessAllowed"
            [class.text-emerald-300]="networkCost.costAccounting().externalAccessAllowed"
            [class.bg-slate-900]="!networkCost.costAccounting().externalAccessAllowed"
            [class.border-[#1e293b]]="!networkCost.costAccounting().externalAccessAllowed"
            [class.text-slate-400]="!networkCost.costAccounting().externalAccessAllowed"
          >
            <mat-icon class="!w-4 !h-4 !text-[16px]">
              {{ networkCost.costAccounting().externalAccessAllowed ? 'verified_user' : 'lock' }}
            </mat-icon>
            <span>External Network: {{ networkCost.costAccounting().externalAccessAllowed ? 'Authorized' : 'Blocked' }}</span>
          </button>
        </div>
      </div>

      <!-- Financial Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-4 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-1">
          <div class="text-[10px] font-mono text-slate-500 uppercase">Total Cloud Spend</div>
          <div class="text-2xl font-bold font-mono text-emerald-400 font-mono-numbers">
            <span>$</span>{{ networkCost.costAccounting().estimatedCloudCostUsd.toFixed(5) }}
          </div>
          <div class="text-[11px] text-slate-400">
            For {{ networkCost.costAccounting().totalOnDemandServerSeconds }}s on-demand compute
          </div>
        </div>

        <div class="p-4 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-1">
          <div class="text-[10px] font-mono text-slate-500 uppercase">Avoided Server Costs</div>
          <div class="text-2xl font-bold font-mono text-cyan-300 font-mono-numbers">
            <span>$</span>{{ networkCost.costAccounting().netSavingsUsd.toFixed(2) }}
          </div>
          <div class="text-[11px] text-slate-400">
            Saved by eliminating 24/7 idle servers
          </div>
        </div>

        <div class="p-4 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-1">
          <div class="text-[10px] font-mono text-slate-500 uppercase">Scale-to-Zero Events</div>
          <div class="text-2xl font-bold font-mono text-white font-mono-numbers">
            {{ networkCost.costAccounting().scaleToZeroCount }}
          </div>
          <div class="text-[11px] text-slate-400">
            Automatic deallocations when idle
          </div>
        </div>

        <div class="p-4 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-1">
          <div class="text-[10px] font-mono text-slate-500 uppercase">Hard Spending Cap</div>
          <div class="text-2xl font-bold font-mono text-purple-400 font-mono-numbers">
            <span>$</span>{{ networkCost.costAccounting().monthlyBudgetCapUsd.toFixed(2) }}
          </div>
          <div class="text-[11px] text-slate-400">
            Strict shutdown trigger if reached
          </div>
        </div>
      </div>

      <!-- Execution Modes Economic Comparison -->
      <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-4">
        <h3 class="text-xs font-bold font-mono tracking-wider uppercase text-white">Execution Workload Accounting</h3>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono">
            <thead class="text-slate-500 border-b border-[#1e293b]">
              <tr>
                <th class="pb-2">Execution Strategy</th>
                <th class="pb-2">Invocation Count</th>
                <th class="pb-2">Pricing Model</th>
                <th class="pb-2">Cumulative Cost</th>
                <th class="pb-2">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#1e293b] text-slate-300">
              <tr>
                <td class="py-3 text-white font-semibold flex items-center gap-2">
                  <mat-icon class="text-cyan-400 !w-4 !h-4 !text-[16px]">web</mat-icon>
                  <span>Mode A (Native Web / JS)</span>
                </td>
                <td class="py-3 font-mono-numbers">{{ networkCost.costAccounting().totalLocalExecutions }}</td>
                <td class="py-3 text-emerald-400 font-bold">$0.00 (Client-Side)</td>
                <td class="py-3 font-bold text-white font-mono-numbers">$0.00000</td>
                <td class="py-3"><span class="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px]">UNLIMITED</span></td>
              </tr>
              <tr>
                <td class="py-3 text-white font-semibold flex items-center gap-2">
                  <mat-icon class="text-purple-400 !w-4 !h-4 !text-[16px]">memory</mat-icon>
                  <span>Mode B (WebAssembly Virtual Machine)</span>
                </td>
                <td class="py-3 font-mono-numbers">{{ networkCost.costAccounting().totalWasmExecutions }}</td>
                <td class="py-3 text-emerald-400 font-bold">$0.00 (Hardware JIT)</td>
                <td class="py-3 font-bold text-white font-mono-numbers">$0.00000</td>
                <td class="py-3"><span class="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px]">UNLIMITED</span></td>
              </tr>
              <tr>
                <td class="py-3 text-white font-semibold flex items-center gap-2">
                  <mat-icon class="text-amber-400 !w-4 !h-4 !text-[16px]">cloud</mat-icon>
                  <span>Mode C (Ephemeral On-Demand Server)</span>
                </td>
                <td class="py-3 font-mono-numbers">{{ networkCost.costAccounting().totalServerRequests }}</td>
                <td class="py-3 text-slate-400">$0.0000166 / sec (Scale-to-Zero)</td>
                <td class="py-3 font-bold text-amber-300 font-mono-numbers"><span>$</span>{{ networkCost.costAccounting().estimatedCloudCostUsd.toFixed(5) }}</td>
                <td class="py-3"><span class="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px]">PAY-PER-USE</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cost Governance & Budget Cap Configuration -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-3">
          <h4 class="text-xs font-bold font-mono tracking-wider uppercase text-white">Monthly Spending Guardrail</h4>
          <p class="text-xs text-slate-400 leading-relaxed">
            Specify the maximum acceptable cloud compute budget. If this threshold is reached, all external on-demand servers will be immediately deallocated and the system will fall back strictly to offline/local WASM modes.
          </p>
          <div class="flex items-center gap-3 pt-2">
            <span class="text-xs font-mono text-slate-400">$</span>
            <input
              type="number"
              [value]="budgetCapInput()"
              (input)="budgetCapInput.set(+$any($event.target).value)"
              min="1"
              max="500"
              class="bg-[#080b10] border border-[#1e293b] text-white text-xs px-3 py-1.5 rounded-lg font-mono w-28 outline-none focus:border-cyan-400"
            >
            <button
              type="button"
              (click)="saveBudgetCap()"
              class="px-3.5 py-1.5 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
            >
              Update Cap
            </button>
          </div>
        </div>

        <div class="p-5 rounded-xl bg-[#0c1017] border border-[#1e293b] space-y-3">
          <h4 class="text-xs font-bold font-mono tracking-wider uppercase text-white">Offline Financial Invariant</h4>
          <p class="text-xs text-slate-400 leading-relaxed">
            NONONICK guarantees that software transformed to Level 1 Self-Contained executes with absolute zero recurring infrastructure fees. No monthly server bills, no subscription locks, and no egress telemetry penalties.
          </p>
          <div class="p-2.5 rounded bg-[#080b10] border border-emerald-900/60 text-xs font-mono text-emerald-400 flex items-center gap-2">
            <mat-icon class="!w-4 !h-4 !text-[16px]">verified</mat-icon>
            <span>Autonomous Execution: Guaranteed $0.00 / mo</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CostMonitorView {
  readonly networkCost = inject(NetworkCost);
  readonly runtimeManager = inject(RuntimeManager);

  readonly budgetCapInput = signal<number>(5.00);

  toggleExternalAccess(): void {
    const current = this.networkCost.costAccounting().externalAccessAllowed;
    this.networkCost.setExternalAccessAllowed(!current);
  }

  saveBudgetCap(): void {
    this.networkCost.setMonthlyBudgetCap(this.budgetCapInput());
    alert(`Monthly budget guardrail updated to $${this.budgetCapInput().toFixed(2)}.`);
  }
}
