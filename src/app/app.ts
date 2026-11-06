import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { Viewport3DComponent } from './components/viewport3d/viewport3d.component';
import { ARStudioComponent } from './components/ar-studio/ar-studio.component';
import { VRStudioComponent } from './components/vr-studio/vr-studio.component';
import { CodeWorkspaceComponent } from './components/code-workspace/code-workspace.component';
import { AiGeneratorComponent } from './components/ai-generator/ai-generator.component';
import { AcademyComponent } from './components/academy/academy.component';
import { AssetLibraryComponent } from './components/asset-library/asset-library.component';
import { KnowledgeCenterComponent } from './components/knowledge-center/knowledge-center.component';
import { QATestingComponent } from './components/qa-testing/qa-testing.component';
import { I18nService } from './services/i18n.service';
import { StudioView } from './models/xr.models';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    HeaderComponent,
    DashboardComponent,
    Viewport3DComponent,
    ARStudioComponent,
    VRStudioComponent,
    CodeWorkspaceComponent,
    AiGeneratorComponent,
    AcademyComponent,
    AssetLibraryComponent,
    KnowledgeCenterComponent,
    QATestingComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  i18n = inject(I18nService);
  activeView = signal<StudioView>('dashboard');

  onViewChange(view: StudioView) {
    this.activeView.set(view);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
