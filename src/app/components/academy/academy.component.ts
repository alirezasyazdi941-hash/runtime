import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AcademyDataService } from '../../services/academy-data.service';
import { I18nService } from '../../services/i18n.service';
import { StudioView } from '../../models/xr.models';

@Component({
  selector: 'app-academy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="h-[calc(100vh-65px)] bg-[#07090e] flex flex-col lg:flex-row overflow-hidden">
      <!-- Left: Lessons Curriculum Sidebar -->
      <div class="w-full lg:w-80 bg-[#0c1017] border-b lg:border-b-0 lg:border-r border-slate-800 p-4 flex flex-col gap-3 overflow-y-auto shrink-0">
        <div class="pb-2 border-b border-slate-800">
          <h2 class="font-bold text-sm text-white flex items-center gap-2">
            <mat-icon class="text-amber-400 text-base">school</mat-icon>
            {{ i18n.t('acad.title') }}
          </h2>
          <p class="text-[11px] text-slate-400 mt-1">
            Zero to Production XR Engineering
          </p>
        </div>

        <div class="space-y-1.5 overflow-y-auto">
          @for (lesson of academy.lessons(); track lesson.id) {
            <button
              (click)="selectLesson(lesson.id)"
              [class.bg-amber-950]="academy.selectedLessonId() === lesson.id"
              [class.border-amber-500/50]="academy.selectedLessonId() === lesson.id"
              [class.text-amber-300]="academy.selectedLessonId() === lesson.id"
              [class.border-slate-800/80]="academy.selectedLessonId() !== lesson.id"
              [class.text-slate-300]="academy.selectedLessonId() !== lesson.id"
              class="w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between gap-2 hover:bg-[#131924] transition-all"
            >
              <div class="flex items-center gap-2 truncate">
                <span class="w-5 h-5 rounded-md bg-[#131924] border border-slate-700 text-[10px] font-mono flex items-center justify-center font-bold text-slate-400 shrink-0">
                  {{ lesson.level }}
                </span>
                <span class="truncate">
                  {{ i18n.currentLang() === 'fa' ? lesson.titleFa : lesson.titleEn }}
                </span>
              </div>
              <span class="text-[10px] font-mono text-slate-500 shrink-0">{{ lesson.durationMinutes }}m</span>
            </button>
          }
        </div>
      </div>

      <!-- Center & Right: Active Lesson Study Guide & Interactive Quiz -->
      <div class="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6 max-w-5xl">
        <!-- Lesson Header -->
        <div class="space-y-2 border-b border-slate-800 pb-4">
          <div class="flex items-center gap-2 text-xs font-mono text-amber-400">
            <span class="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30">LEVEL {{ activeLesson().level }}</span>
            <span>•</span>
            <span>{{ activeLesson().category }}</span>
            <span>•</span>
            <span>{{ activeLesson().durationMinutes }} MIN STUDY</span>
          </div>

          <h1 class="text-xl lg:text-3xl font-extrabold text-white">
            {{ i18n.currentLang() === 'fa' ? activeLesson().titleFa : activeLesson().titleEn }}
          </h1>

          <p class="text-sm text-slate-300 leading-relaxed">
            {{ i18n.currentLang() === 'fa' ? activeLesson().summaryFa : activeLesson().summaryEn }}
          </p>
        </div>

        <!-- Deep Theory Section -->
        <div class="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-3">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <mat-icon class="text-cyan-400 text-base">menu_book</mat-icon>
            Engineering Theory & Mathematical Foundations
          </h3>
          <div class="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
            {{ i18n.currentLang() === 'fa' ? activeLesson().theoryFa : activeLesson().theoryEn }}
          </div>
        </div>

        <!-- Runnable Code Sample -->
        <div class="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <mat-icon class="text-emerald-400 text-base">code</mat-icon>
              Runnable Technical Implementation
            </h3>
            <button
              (click)="openInCodeWorkspace()"
              class="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1 transition-all"
            >
              <mat-icon class="text-xs">play_arrow</mat-icon>
              <span>{{ i18n.t('acad.runSample') }}</span>
            </button>
          </div>
          <pre class="p-3 rounded-xl bg-[#06080d] border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">{{ activeLesson().codeSample }}</pre>
        </div>

        <!-- Interactive Challenge & Quiz -->
        <div class="p-6 rounded-2xl bg-gradient-to-br from-[#0c121d] to-[#120e20] border border-amber-500/30 space-y-4">
          <div class="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
            <mat-icon class="text-sm">quiz</mat-icon>
            Knowledge Checkpoint & Quiz
          </div>

          <h4 class="text-sm lg:text-base font-bold text-white">
            {{ i18n.currentLang() === 'fa' ? activeLesson().quiz.questionFa : activeLesson().quiz.questionEn }}
          </h4>

          <!-- Multiple choice options -->
          <div class="space-y-2">
            @for (opt of (i18n.currentLang() === 'fa' ? activeLesson().quiz.optionsFa : activeLesson().quiz.optionsEn); track $index) {
              <button
                (click)="selectedAnswer.set($index)"
                [class.border-cyan-500]="selectedAnswer() === $index"
                [class.bg-[#162133]]="selectedAnswer() === $index"
                [class.border-slate-800]="selectedAnswer() !== $index"
                [class.bg-[#0f1420]]="selectedAnswer() !== $index"
                class="w-full p-3 rounded-xl border text-left text-xs font-medium text-slate-200 hover:border-slate-600 transition-all flex items-center gap-3"
              >
                <span
                  class="w-5 h-5 rounded-full border text-[11px] font-mono flex items-center justify-center font-bold shrink-0"
                  [class.border-cyan-400]="selectedAnswer() === $index"
                  [class.text-cyan-400]="selectedAnswer() === $index"
                  [class.border-slate-600]="selectedAnswer() !== $index"
                  [class.text-slate-500]="selectedAnswer() !== $index"
                >
                  {{ $index + 1 }}
                </span>
                <span>{{ opt }}</span>
              </button>
            }
          </div>

          <div class="flex items-center justify-between pt-2">
            <button
              (click)="checkAnswer()"
              [disabled]="selectedAnswer() === null"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-40"
            >
              {{ i18n.t('acad.submitQuiz') }}
            </button>

            @if (quizFeedback()) {
              <span
                class="text-xs font-bold font-mono px-3 py-1 rounded-lg"
                [class.bg-emerald-950]="quizFeedback() === 'correct'"
                [class.text-emerald-400]="quizFeedback() === 'correct'"
                [class.border-emerald-500/40]="quizFeedback() === 'correct'"
                [class.bg-red-950]="quizFeedback() === 'incorrect'"
                [class.text-red-400]="quizFeedback() === 'incorrect'"
                [class.border-red-500/40]="quizFeedback() === 'incorrect'"
              >
                {{ quizFeedback() === 'correct' ? '✅ Correct! Master level unlocked.' : '❌ Incorrect. Review explanation below.' }}
              </span>
            }
          </div>

          @if (quizFeedback()) {
            <div class="p-3 rounded-xl bg-[#090d14] border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
              <strong class="text-amber-400 block mb-1">Scientific Explanation:</strong>
              {{ i18n.currentLang() === 'fa' ? activeLesson().quiz.explanationFa : activeLesson().quiz.explanationEn }}
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AcademyComponent {
  academy = inject(AcademyDataService);
  i18n = inject(I18nService);

  viewChange = output<StudioView>();

  selectedAnswer = signal<number | null>(null);
  quizFeedback = signal<'correct' | 'incorrect' | null>(null);

  activeLesson() {
    return this.academy.getActiveLesson();
  }

  selectLesson(id: string) {
    this.academy.selectLesson(id);
    this.selectedAnswer.set(null);
    this.quizFeedback.set(null);
  }

  checkAnswer() {
    const ans = this.selectedAnswer();
    if (ans === null) return;
    const isCorrect = ans === this.activeLesson().quiz.correctIndex;
    this.quizFeedback.set(isCorrect ? 'correct' : 'incorrect');
  }

  openInCodeWorkspace() {
    this.viewChange.emit('code-workspace');
  }
}
