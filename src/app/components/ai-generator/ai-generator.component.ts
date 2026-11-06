import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RealityAIService, GeneratedProjectPlan } from '../../services/reality-ai.service';
import { ProjectStorageService } from '../../services/project-storage.service';
import { ThreeEngineService } from '../../services/three-engine.service';
import { I18nService } from '../../services/i18n.service';
import { StudioView, XRProject } from '../../models/xr.models';

@Component({
  selector: 'app-ai-generator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="h-[calc(100vh-65px)] bg-[#07090e] flex flex-col lg:flex-row overflow-hidden">
      <!-- Left Sidebar: 14 Master Roles & AI Settings -->
      <div class="w-full lg:w-80 bg-[#0c1017] border-b lg:border-b-0 lg:border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
        <div class="flex items-center gap-2.5 pb-2 border-b border-slate-800">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <mat-icon class="text-xl">psychology</mat-icon>
          </div>
          <div>
            <h2 class="font-extrabold text-sm text-white tracking-wide">
              REALITY MASTER AI
            </h2>
            <p class="text-[11px] text-cyan-400 font-mono font-medium">
              14 Master Roles Active
            </p>
          </div>
        </div>

        <!-- Role Selector -->
        <div class="space-y-1.5">
          <span class="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
            Select Active Specialist:
          </span>
          <div class="space-y-1">
            @for (role of realityAI.roles; track role.id) {
              <button
                (click)="realityAI.selectedRole.set(role.id)"
                [class.bg-gradient-to-r]="realityAI.selectedRole() === role.id"
                [class.from-cyan-950]="realityAI.selectedRole() === role.id"
                [class.to-purple-950]="realityAI.selectedRole() === role.id"
                [class.border-cyan-500/50]="realityAI.selectedRole() === role.id"
                [class.text-cyan-300]="realityAI.selectedRole() === role.id"
                [class.border-slate-800/80]="realityAI.selectedRole() !== role.id"
                [class.text-slate-300]="realityAI.selectedRole() !== role.id"
                class="w-full px-2.5 py-1.5 rounded-lg border text-left text-xs font-semibold flex items-center gap-2 hover:bg-[#131924] transition-all"
              >
                <mat-icon class="text-sm shrink-0" [class.text-cyan-400]="realityAI.selectedRole() === role.id">
                  {{ role.icon }}
                </mat-icon>
                <span class="truncate">
                  {{ i18n.currentLang() === 'fa' ? role.titleFa : role.titleEn }}
                </span>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Center & Right: Dual Mode Tabs (Consultation Chat vs Full Project Generator) -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Mode Switcher Tabs -->
        <div class="bg-[#090d14] border-b border-slate-800 px-6 py-2 flex items-center gap-4 text-xs">
          <button
            (click)="activeTab.set('chat')"
            [class.text-cyan-400]="activeTab() === 'chat'"
            [class.border-cyan-400]="activeTab() === 'chat'"
            class="py-2 border-b-2 font-bold flex items-center gap-1.5 transition-colors"
          >
            <mat-icon class="text-sm">forum</mat-icon>
            <span>Consultation & Architecture Chat</span>
          </button>

          <button
            (click)="activeTab.set('generator')"
            [class.text-cyan-400]="activeTab() === 'generator'"
            [class.border-cyan-400]="activeTab() === 'generator'"
            class="py-2 border-b-2 font-bold flex items-center gap-1.5 transition-colors"
          >
            <mat-icon class="text-sm text-purple-400">auto_awesome</mat-icon>
            <span>AI Project Generator (Prompt-to-XR)</span>
          </button>
        </div>

        <!-- Chat Consultation View -->
        @if (activeTab() === 'chat') {
          <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Messages Stream -->
            <div class="flex-1 p-4 lg:p-6 overflow-y-auto space-y-4">
              @for (msg of realityAI.messages(); track msg.id) {
                <div
                  class="flex gap-3 max-w-4xl"
                  [class.ml-auto]="msg.role === 'user'"
                  [class.flex-row-reverse]="msg.role === 'user'"
                >
                  <div
                    class="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold font-mono"
                    [class.bg-cyan-500]="msg.role === 'assistant'"
                    [class.text-black]="msg.role === 'assistant'"
                    [class.bg-purple-600]="msg.role === 'user'"
                    [class.text-white]="msg.role === 'user'"
                  >
                    {{ msg.role === 'assistant' ? 'AI' : 'YOU' }}
                  </div>

                  <div
                    class="p-4 rounded-2xl border space-y-2 text-xs leading-relaxed"
                    [class.bg-[#0c121d]]="msg.role === 'assistant'"
                    [class.border-cyan-500/20]="msg.role === 'assistant'"
                    [class.text-slate-200]="msg.role === 'assistant'"
                    [class.bg-[#1a1429]]="msg.role === 'user'"
                    [class.border-purple-500/30]="msg.role === 'user'"
                    [class.text-purple-100]="msg.role === 'user'"
                  >
                    @if (msg.roleSpecialization) {
                      <div class="text-[10px] uppercase font-mono font-bold text-cyan-400">
                        {{ msg.roleSpecialization }}
                      </div>
                    }

                    <div class="whitespace-pre-line font-sans">{{ msg.text }}</div>

                    <!-- Authoritative Citations -->
                    @if (msg.citations && msg.citations.length > 0) {
                      <div class="pt-2 border-t border-slate-800/80 space-y-1">
                        <span class="text-[10px] text-slate-400 font-mono font-bold">Authoritative Sources & Standards:</span>
                        <ul class="list-disc list-inside text-[11px] text-cyan-300/80 space-y-0.5">
                          @for (cit of msg.citations; track cit) {
                            <li>{{ cit }}</li>
                          }
                        </ul>
                      </div>
                    }

                    <span class="block text-[10px] text-slate-500 font-mono text-right">{{ msg.timestamp }}</span>
                  </div>
                </div>
              }

              @if (realityAI.isGenerating()) {
                <div class="flex items-center gap-2 text-xs font-mono text-cyan-400 p-4 bg-[#0c121d] rounded-xl border border-cyan-500/20 max-w-sm">
                  <mat-icon class="text-sm animate-spin">refresh</mat-icon>
                  <span>REALITY MASTER AI is analyzing XR requirements...</span>
                </div>
              }
            </div>

            <!-- Input Bar -->
            <div class="p-4 bg-[#0c1017] border-t border-slate-800 flex gap-2">
              <input
                #chatInput
                type="text"
                (keydown.enter)="onSendMessage(chatInput)"
                [placeholder]="i18n.t('ai.promptPlaceholder')"
                class="flex-1 bg-[#131924] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                (click)="onSendMessage(chatInput)"
                [disabled]="realityAI.isGenerating()"
                class="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <mat-icon class="text-sm">send</mat-icon>
                <span>{{ i18n.t('ai.sendBtn') }}</span>
              </button>
            </div>
          </div>
        }

        <!-- AI Project Generator Tab -->
        @if (activeTab() === 'generator') {
          <div class="flex-1 p-6 overflow-y-auto space-y-6 max-w-5xl">
            <div class="space-y-2">
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <mat-icon class="text-purple-400">auto_fix_high</mat-icon>
                Natural Language Project Specification
              </h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                Describe your desired XR experience in natural language (English or Persian). REALITY MASTER AI will analyze hardware targets, select the optimal 3D engine, generate architecture blueprints, write production Three.js/WebXR code, and prepare automated tests.
              </p>
            </div>

            <!-- Generator Controls -->
            <div class="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="targetHw" class="block text-xs font-bold text-slate-300 font-mono mb-1">TARGET HARDWARE:</label>
                  <select id="targetHw" #targetHw class="w-full bg-[#131924] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400">
                    <option value="WebXR (All Devices)">WebXR (Universal Browsers, Phones & Headsets)</option>
                    <option value="Meta Quest 3 / Pro">Meta Quest 3 & Pro (6-DOF Spatial Passthrough)</option>
                    <option value="Apple Vision Pro">Apple Vision Pro (visionOS Safari WebXR)</option>
                    <option value="Mobile AR (ARKit/ARCore)">Mobile AR (iOS QuickLook & Android ARCore)</option>
                  </select>
                </div>

                <div>
                  <label for="engineSelect" class="block text-xs font-bold text-slate-300 font-mono mb-1">ENGINE / GRAPHICS STACK:</label>
                  <select id="engineSelect" #engineSelect class="w-full bg-[#131924] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400">
                    <option value="Three.js (WebGL2 / WebXR)">Three.js (WebGL2 & WebXR r160+)</option>
                    <option value="WebXR Device API (Raw)">WebXR Device API (Raw WebGL2 pipeline)</option>
                    <option value="Unity OpenXR (C# Export)">Unity OpenXR Specification (C# Blueprint)</option>
                  </select>
                </div>
              </div>

              <div>
                <label for="promptInput" class="block text-xs font-bold text-slate-300 font-mono mb-1">EXPERIENCE PROMPT:</label>
                <textarea
                  id="promptInput"
                  #promptInput
                  rows="3"
                  placeholder="e.g. Build an interactive AR interior room designer where users place furniture models on real room floors using surface hit-testing and measure clearance."
                  class="w-full bg-[#131924] border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed"
                ></textarea>
              </div>

              <!-- Quick Prompt Suggestions -->
              <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span class="text-slate-500 font-mono">Suggestions:</span>
                <button
                  (click)="promptInput.value = 'Autonomous spatial drone with 6-DOF controls and LiDAR telemetry'"
                  class="px-2 py-0.5 rounded bg-[#131924] text-slate-300 hover:text-cyan-300 border border-slate-800"
                >
                  Spatial Drone
                </button>
                <button
                  (click)="promptInput.value = 'AR furniture viewer with real-time floor hit-testing and camera snapshot'"
                  class="px-2 py-0.5 rounded bg-[#131924] text-slate-300 hover:text-cyan-300 border border-slate-800"
                >
                  AR Furniture
                </button>
                <button
                  (click)="promptInput.value = 'Holodeck VR playground with dual controllers, grabbable tools and spatial audio'"
                  class="px-2 py-0.5 rounded bg-[#131924] text-slate-300 hover:text-cyan-300 border border-slate-800"
                >
                  VR Holodeck
                </button>
              </div>

              <button
                (click)="generateProject(promptInput.value, targetHw.value, engineSelect.value)"
                [disabled]="realityAI.isGenerating()"
                class="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                <mat-icon class="text-base">rocket_launch</mat-icon>
                <span>{{ realityAI.isGenerating() ? 'Architecting & Synthesizing XR Project...' : i18n.t('ai.generateBtn') }}</span>
              </button>
            </div>

            <!-- Generated Project Blueprint Card -->
            @if (generatedPlan()) {
              <div class="p-6 rounded-2xl bg-[#0c121d] border border-cyan-500/30 space-y-4 animate-fade-in shadow-2xl">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span class="text-[10px] font-mono text-cyan-400 uppercase font-bold">SYNTHESIZED ARCHITECTURE BLUEPRINT</span>
                    <h4 class="text-lg font-bold text-white">{{ generatedPlan()?.name }}</h4>
                    <p class="text-xs text-slate-400">{{ generatedPlan()?.description }}</p>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      (click)="loadIntoWorkspace()"
                      class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <mat-icon class="text-sm">terminal</mat-icon>
                      <span>{{ i18n.t('ai.loadToCode') }}</span>
                    </button>
                  </div>
                </div>

                <!-- Architecture Summary & Requirements -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div class="p-3 rounded-xl bg-[#131924] border border-slate-800 space-y-1">
                    <span class="font-bold text-slate-300 font-mono">Architecture Strategy:</span>
                    <p class="text-slate-400 leading-relaxed">{{ generatedPlan()?.architectureSummary }}</p>
                  </div>

                  <div class="p-3 rounded-xl bg-[#131924] border border-slate-800 space-y-1">
                    <span class="font-bold text-slate-300 font-mono">Hardware Constraints & Fallbacks:</span>
                    <p class="text-slate-400 leading-relaxed">{{ generatedPlan()?.limitationsAndFallbacks }}</p>
                  </div>
                </div>

                <!-- Generated File Structure -->
                <div class="space-y-1.5">
                  <span class="text-xs font-bold text-slate-300 font-mono">Modular File Blueprint:</span>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    @for (file of generatedPlan()?.fileStructure; track file.path) {
                      <div class="p-2 rounded-lg bg-[#131a26] border border-slate-800 text-[11px] font-mono">
                        <span class="text-cyan-400 font-bold block">{{ file.path }}</span>
                        <span class="text-slate-400">{{ file.purpose }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Runnable Code Snippet Preview -->
                <div class="space-y-1.5">
                  <span class="text-xs font-bold text-slate-300 font-mono">Runnable Three.js / WebXR Code:</span>
                  <pre class="p-3 rounded-xl bg-[#06080d] border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-56 leading-relaxed">{{ generatedPlan()?.runnableCode }}</pre>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class AiGeneratorComponent {
  realityAI = inject(RealityAIService);
  projectStorage = inject(ProjectStorageService);
  threeEngine = inject(ThreeEngineService);
  i18n = inject(I18nService);

  viewChange = output<StudioView>();

  activeTab = signal<'chat' | 'generator'>('chat');
  generatedPlan = signal<GeneratedProjectPlan | null>(null);

  onSendMessage(inputEl: HTMLInputElement) {
    const val = inputEl.value;
    if (!val.trim()) return;
    this.realityAI.sendMessage(val);
    inputEl.value = '';
  }

  async generateProject(prompt: string, hw: string, engine: string) {
    if (!prompt.trim()) {
      prompt = 'Spatial 3D room with interactive models and lighting';
    }
    const plan = await this.realityAI.generateProject(prompt, hw, engine);
    this.generatedPlan.set(plan);
  }

  loadIntoWorkspace() {
    const plan = this.generatedPlan();
    if (!plan) return;

    const engineType: XRProject['engine'] = plan.engine.includes('WebXR') ? 'WebXR' : 'Three.js';
    const platformType = (plan.targetHardware || 'WebXR (All Devices)') as XRProject['targetPlatform'];

    this.projectStorage.createProject({
      name: plan.name,
      description: plan.description,
      engine: engineType,
      targetPlatform: platformType,
      code: plan.runnableCode,
    });

    this.viewChange.emit('code-workspace');
  }
}
