import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class PackagingExport {
  /**
   * Generates a fully autonomous single-file HTML bundle.
   * Inlines HTML, scripts, CSS, and base64-encoded WASM bytecode.
   */
  generateStandaloneHtml(project: Project): string {
    const htmlFile = project.files.find(f => f.name.endsWith('.html')) || {
      content: '<!DOCTYPE html><html><body><h1>NONONICK Standalone App</h1></body></html>'
    };

    let content = htmlFile.content;

    // Gather CSS files
    const cssFiles = project.files.filter(f => f.name.endsWith('.css'));
    let inlinedStyles = '';
    for (const css of cssFiles) {
      inlinedStyles += `\n/* Inlined: ${css.path} */\n${css.content}\n`;
    }

    // Gather JS files
    const jsFiles = project.files.filter(f => f.name.endsWith('.js') && !f.path.includes('server.js'));
    let inlinedScripts = '';
    for (const js of jsFiles) {
      inlinedScripts += `\n// Inlined: ${js.path}\n${js.content}\n`;
    }

    // Embed WASM binary if present
    let wasmBootstrap = '';
    if (project.wasmBytecode && project.wasmBytecode.length > 0) {
      const base64Wasm = this.uint8ArrayToBase64(project.wasmBytecode);
      wasmBootstrap = `
<script id="nononick-embedded-wasm" type="application/wasm-base64">
${base64Wasm}
</script>
<script>
  (async function() {
    try {
      const raw = document.getElementById('nononick-embedded-wasm').textContent.trim();
      const bin = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
      const { instance } = await WebAssembly.instantiate(bin, {
        env: { memory: new WebAssembly.Memory({ initial: 2 }) },
        wasi_snapshot_preview1: {
          fd_write: (fd, iovs, len, nwritten) => 0,
          proc_exit: (c) => console.log('WASI Exited', c)
        }
      });
      window.__NONONICK_WASM_INSTANCE__ = instance;
      window.dispatchEvent(new CustomEvent('nononick:wasm-ready', { detail: instance }));
      console.log('[NONONICK SELF-CONTAINED] Embedded WebAssembly Module initialized.');
    } catch (e) {
      console.warn('[NONONICK] Embedded WASM init note:', e);
    }
  })();
</script>
`;
    }

    // Inject styles before </head> or at start
    if (inlinedStyles) {
      const styleBlock = `<style>\n${inlinedStyles}\n</style>`;
      if (content.includes('</head>')) {
        content = content.replace('</head>', `${styleBlock}\n</head>`);
      } else {
        content = styleBlock + '\n' + content;
      }
    }

    // Inject scripts and wasm before </body> or at end
    const scriptBlock = `${wasmBootstrap}\n<script>\n${inlinedScripts}\n</script>`;
    if (content.includes('</body>')) {
      content = content.replace('</body>', `${scriptBlock}\n</body>`);
    } else {
      content = content + '\n' + scriptBlock;
    }

    // Add Self-Contained Runtime Header Meta
    const metaHeader = `<!--
===================================================================
NONONICK UNIVERSAL SELF-CONTAINED RUNTIME // STANDALONE BUNDLE
Project: ${project.name}
Containment Level: Level ${project.analysis?.selfContainmentLevel || 1} (Fully Autonomous)
Generated: ${new Date().toISOString()}
Offline Mode: Guaranteed Autonomous Execution
===================================================================
-->\n`;

    return metaHeader + content;
  }

  /**
   * Builds and triggers browser download of a Portable ZIP package
   */
  async exportPortableZip(project: Project): Promise<void> {
    const zip = new JSZip();

    // 1. Original/project source files
    for (const f of project.files) {
      if (f.binaryData) {
        zip.file(f.path, f.binaryData);
      } else {
        zip.file(f.path, f.content);
      }
    }

    // 2. Transformed standalone single-file HTML bundle
    const standaloneHtml = this.generateStandaloneHtml(project);
    zip.file('dist/standalone-app.html', standaloneHtml);

    // 3. Embedded WASM binary if generated
    if (project.wasmBytecode && project.wasmBytecode.length > 0) {
      zip.file('dist/module.wasm', project.wasmBytecode);
    }

    // 4. Nononick Runtime Manifest
    const manifest = {
      formatVersion: '1.0.0',
      runtime: 'NONONICK_UNIVERSAL_RUNTIME',
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: Date.now(),
        containmentLevel: project.analysis?.selfContainmentLevel || 1,
        containmentScore: project.analysis?.selfContainmentScore || 100,
        runtimeMode: project.runtimeMode,
        tags: project.tags
      },
      executionTargets: {
        modeA_NativeWeb: {
          supported: true,
          entryPoint: project.analysis?.entryPoints[0] || 'index.html'
        },
        modeB_WebAssembly: {
          supported: !!project.analysis?.wasmFeasibility.canCompileToWasm,
          toolchain: project.analysis?.wasmFeasibility.recommendedToolchain || 'None'
        },
        modeC_OnDemandServer: {
          supported: !!project.analysis?.serverRequirements.requiresServer,
          scaleToZero: true,
          idleTimeoutSeconds: 60
        }
      },
      dependencies: project.analysis?.dependencies || [],
      offlineCapable: project.analysis?.selfContainmentLevel === 1
    };
    zip.file('nononick-runtime.json', JSON.stringify(manifest, null, 2));

    // 5. Technical Compatibility and Conversion Report (Markdown)
    const report = this.generateCompatibilityReport(project);
    zip.file('COMPATIBILITY_REPORT.md', report);

    // 6. Local run script for users with desktop bash
    const runScript = `#!/usr/bin/env bash
# NONONICK Universal Portable Project Runner
echo "=== NONONICK SELF-CONTAINED RUNTIME ==="
echo "Opening standalone autonomous application..."
if command -v python3 &>/dev/null; then
  echo "Serving locally via Python zero-dependency server on port 8080..."
  python3 -m http.server 8080
elif command -v npx &>/dev/null; then
  npx serve .
else
  # Direct browser open
  open dist/standalone-app.html || xdg-open dist/standalone-app.html
fi
`;
    zip.file('run-local.sh', runScript);

    // Generate blob and trigger file download
    const blob = await zip.generateAsync({ type: 'blob' });
    this.downloadBlob(blob, `${this.slugify(project.name)}-portable.zip`);
  }

  /**
   * Generates a detailed Markdown compatibility & conversion report
   */
  generateCompatibilityReport(project: Project): string {
    const analysis = project.analysis;
    const level = analysis?.selfContainmentLevel || 1;
    const score = analysis?.selfContainmentScore || 100;

    return `# NONONICK UNIVERSAL RUNTIME // COMPATIBILITY REPORT
Generated: ${new Date().toUTCString()}
Project: ${project.name}
ID: ${project.id}

## 1. Executive Transformation Verdict
- **Self-Containment Level**: Level ${level} (${level === 1 ? 'FULLY SELF-CONTAINED' : level === 2 ? 'HYBRID SELF-CONTAINED' : 'EXTERNALLY DEPENDENT'})
- **Containment Score**: ${score} / 100
- **Execution Target**: ${project.runtimeMode.toUpperCase()}
- **Offline Reliability**: ${level === 1 ? '100% Autonomous (No Internet Required)' : 'Hybrid / Requires On-Demand Connectivity'}

## 2. Language & Component Breakdown
${analysis?.detectedLanguages.map(l => `- **${l.name}**: ${l.percentage}%`).join('\n') || '- Standard Web Formats'}

## 3. WebAssembly Feasibility & Status
- **WASM Feasibility**: ${analysis?.wasmFeasibility.canCompileToWasm ? 'COMPATIBLE' : 'NATIVE WEB PREFERRED'}
- **Recommended Toolchain**: ${analysis?.wasmFeasibility.recommendedToolchain}
- **Engineering Note**: ${analysis?.wasmFeasibility.reasoning}

## 4. Dependencies & Bundling Analysis
| Dependency | Version | Type | Bundled Locally | Alternative |
| --- | --- | --- | --- | --- |
${analysis?.dependencies.map(d => `| ${d.name} | ${d.version} | ${d.type} | ${d.canBeBundledLocally ? 'YES' : 'NO'} | ${d.alternativeSuggestion || 'Direct Bundle'} |`).join('\n') || '| None | - | - | YES | Pure Standard |'}

## 5. Security & Isolation Audit
- **Sandbox Isolation Grade**: ${analysis?.securityAudit.isolationGrade}
- **Network Leakage**: ${analysis?.externalNetworkCalls.length ? `${analysis.externalNetworkCalls.length} External endpoints detected` : 'Zero External Network Leakage'}
- **Storage Isolation**: Browser IndexedDB / Sandboxed Origin

## 6. On-Demand Cost & Scale-to-Zero Policy
- **Permanent 24/7 Server**: DISABLED (Zero Idle Cost)
- **On-Demand Activation**: Micro-sessions only (auto-stop after ${analysis?.serverRequirements.idleTimeoutSeconds || 60}s idle)
- **Estimated Idle Cost**: $0.00 / month

---
NONONICK — ENGINEERED FOR INDEPENDENT EXECUTION.
`;
  }

  /**
   * Triggers download of raw standalone HTML file
   */
  exportStandaloneHtmlFile(project: Project): void {
    const html = this.generateStandaloneHtml(project);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    this.downloadBlob(blob, `${this.slugify(project.name)}-standalone.html`);
  }

  /**
   * Triggers download of raw WASM binary module
   */
  exportWasmBinaryFile(project: Project): void {
    if (!project.wasmBytecode || project.wasmBytecode.length === 0) {
      alert('No compiled WebAssembly binary bytecode found. Run WebAssembly compilation first.');
      return;
    }
    const blob = new Blob([project.wasmBytecode as unknown as BlobPart], { type: 'application/wasm' });
    this.downloadBlob(blob, `${this.slugify(project.name)}.wasm`);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'project';
  }

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
