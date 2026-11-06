import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TopBar } from './components/top-bar';
import { Sidebar } from './components/sidebar';
import { DashboardView } from './components/dashboard-view';
import { ProjectManagerView } from './components/project-manager-view';
import { ImportCenterView } from './components/import-center-view';
import { AnalyzerView } from './components/analyzer-view';
import { WasmCompilerView } from './components/wasm-compiler-view';
import { RuntimeManagerView } from './components/runtime-manager-view';
import { LivePreviewView } from './components/live-preview-view';
import { CodeEditorView } from './components/code-editor-view';
import { ConsoleView } from './components/console-view';
import { CostMonitorView } from './components/cost-monitor-view';
import { ExportCenterView } from './components/export-center-view';
import { SettingsView } from './components/settings-view';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TopBar,
    Sidebar,
    DashboardView,
    ProjectManagerView,
    ImportCenterView,
    AnalyzerView,
    WasmCompilerView,
    RuntimeManagerView,
    LivePreviewView,
    CodeEditorView,
    ConsoleView,
    CostMonitorView,
    ExportCenterView,
    SettingsView
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly activeTab = signal<string>('dashboard');

  onTabChange(newTab: string): void {
    this.activeTab.set(newTab);
  }
}
