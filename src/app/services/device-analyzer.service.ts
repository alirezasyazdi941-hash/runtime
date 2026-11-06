import { Injectable, signal } from '@angular/core';
import { HardwareReport } from '../models/xr.models';

@Injectable({
  providedIn: 'root',
})
export class DeviceAnalyzerService {
  report = signal<HardwareReport>({
    timestamp: new Date().toISOString(),
    deviceType: 'Unknown',
    os: 'Unknown',
    browser: 'Unknown',
    isHttps: false,
    webgl1Supported: false,
    webgl2Supported: false,
    gpuRenderer: 'Detecting...',
    gpuVendor: 'Detecting...',
    maxTextureSize: 0,
    maxRenderBufferSize: 0,
    webxrSupported: false,
    immersiveVrSupported: false,
    immersiveArSupported: false,
    inlineSupported: false,
    cameraAvailable: false,
    gyroscopeAvailable: false,
    accelerometerAvailable: false,
    estimatedFps: 60,
    recommendedEngine: 'Three.js (WebGL2 / WebXR)',
    compatibilityScore: 0,
    notes: [],
  });

  isScanning = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined') {
      this.runHardwareDiagnostic();
    }
  }

  async runHardwareDiagnostic(): Promise<HardwareReport> {
    this.isScanning.set(true);

    const ua = navigator.userAgent;
    const isHttps = typeof window !== 'undefined' ? window.location.protocol === 'https:' : false;

    // Detect Device & OS
    let deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'XR Headset' | 'Unknown' = 'Desktop';
    if (/Quest|Oculus|Pico|Vive|Vision/i.test(ua)) {
      deviceType = 'XR Headset';
    } else if (/iPad|Tablet/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua))) {
      deviceType = 'Tablet';
    } else if (/Mobi|Android|iPhone/i.test(ua)) {
      deviceType = 'Mobile';
    }

    let os = 'Unknown OS';
    if (/iPhone|iPad|iPod/i.test(ua)) os = 'Apple iOS / iPadOS';
    else if (/Android/i.test(ua)) os = 'Android OS';
    else if (/Windows/i.test(ua)) os = 'Microsoft Windows';
    else if (/Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';
    else if (/Oculus|Quest/i.test(ua)) os = 'Horizon OS (Meta Quest)';
    else if (/Vision/i.test(ua)) os = 'visionOS (Apple)';

    let browser = 'Unknown Browser';
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Google Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
    else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';
    else if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
    else if (/OculusBrowser/i.test(ua)) browser = 'Meta Quest Browser';

    // Check WebGL 1 & WebGL 2 Contexts
    let webgl1Supported = false;
    let webgl2Supported = false;
    let gpuRenderer = 'Unavailable';
    let gpuVendor = 'Unavailable';
    let maxTextureSize = 0;
    let maxRenderBufferSize = 0;

    try {
      const canvas = document.createElement('canvas');
      const gl2 = canvas.getContext('webgl2');
      if (gl2) {
        webgl2Supported = true;
        webgl1Supported = true;
        const dbgExt = gl2.getExtension('WEBGL_debug_renderer_info');
        if (dbgExt) {
          gpuRenderer = gl2.getParameter(dbgExt.UNMASKED_RENDERER_WEBGL) || 'Standard WebGL2';
          gpuVendor = gl2.getParameter(dbgExt.UNMASKED_VENDOR_WEBGL) || 'GPU Vendor';
        } else {
          gpuRenderer = gl2.getParameter(gl2.RENDERER) || 'WebGL2';
          gpuVendor = gl2.getParameter(gl2.VENDOR) || 'WebGL2';
        }
        maxTextureSize = gl2.getParameter(gl2.MAX_TEXTURE_SIZE) || 4096;
        maxRenderBufferSize = gl2.getParameter(gl2.MAX_RENDERBUFFER_SIZE) || 4096;
        gl2.getExtension('WEBGL_lose_context')?.loseContext();
      } else {
        const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl1) {
          const gl1Ctx = gl1 as WebGLRenderingContext;
          webgl1Supported = true;
          maxTextureSize = gl1Ctx.getParameter(gl1Ctx.MAX_TEXTURE_SIZE) || 2048;
        }
      }
    } catch (e) {
      console.warn('Error querying WebGL context:', e);
    }

    // Check WebXR
    let webxrSupported = false;
    let immersiveVrSupported = false;
    let immersiveArSupported = false;
    let inlineSupported = false;

    interface XRSystemLike {
      isSessionSupported(mode: string): Promise<boolean>;
    }
    const navWithXR = (typeof navigator !== 'undefined' ? navigator : null) as (Navigator & { xr?: XRSystemLike }) | null;

    if (navWithXR && navWithXR.xr) {
      webxrSupported = true;
      const xr = navWithXR.xr;
      try {
        if (xr.isSessionSupported) {
          inlineSupported = await xr.isSessionSupported('inline').catch(() => false);
          immersiveVrSupported = await xr.isSessionSupported('immersive-vr').catch(() => false);
          immersiveArSupported = await xr.isSessionSupported('immersive-ar').catch(() => false);
        }
      } catch (xrErr) {
        console.warn('WebXR query error:', xrErr);
      }
    }

    // Check Camera
    let cameraAvailable = false;
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      cameraAvailable = true;
    }

    // Check Motion Sensors
    const gyroscopeAvailable = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
    const accelerometerAvailable = typeof window !== 'undefined' && 'DeviceMotionEvent' in window;

    // Estimate FPS
    let estimatedFps = 60;
    try {
      estimatedFps = await this.sampleFps();
    } catch {
      estimatedFps = 60;
    }

    // Notes & Specific Limitations
    const notes: string[] = [];
    if (!isHttps && window.location.hostname !== 'localhost') {
      notes.push('WebXR & Camera require an HTTPS secure context or localhost.');
    }
    if (/iPhone|iPad/i.test(ua)) {
      notes.push('iOS Safari restricts native WebXR immersive sessions; WebXR Viewer or camera video feed fallback is active.');
      notes.push('QuickLook USDZ is available for iOS AR model viewing.');
    }
    if (webxrSupported && (immersiveVrSupported || immersiveArSupported)) {
      notes.push('Full immersive WebXR hardware runtime detected with 6-DOF support.');
    } else {
      notes.push('Standard WebXR not active; In-Browser XR Simulator & Camera Passthrough Mode activated.');
    }

    // Calculate score
    let score = 20;
    if (webgl1Supported) score += 20;
    if (webgl2Supported) score += 20;
    if (webxrSupported) score += 15;
    if (immersiveArSupported || immersiveVrSupported) score += 15;
    if (cameraAvailable) score += 5;
    if (gyroscopeAvailable) score += 5;

    const finalReport: HardwareReport = {
      timestamp: new Date().toISOString(),
      deviceType,
      os,
      browser,
      isHttps,
      webgl1Supported,
      webgl2Supported,
      gpuRenderer,
      gpuVendor,
      maxTextureSize,
      maxRenderBufferSize,
      webxrSupported,
      immersiveVrSupported,
      immersiveArSupported,
      inlineSupported,
      cameraAvailable,
      gyroscopeAvailable,
      accelerometerAvailable,
      estimatedFps,
      recommendedEngine: webgl2Supported ? 'Three.js (WebGL2 / WebXR r160+)' : 'Three.js (WebGL1 Fallback)',
      compatibilityScore: Math.min(100, score),
      notes,
    };

    this.report.set(finalReport);
    this.isScanning.set(false);
    return finalReport;
  }

  private sampleFps(): Promise<number> {
    return new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      const count = () => {
        frames++;
        if (performance.now() - start < 300) {
          requestAnimationFrame(count);
        } else {
          const elapsed = (performance.now() - start) / 1000;
          const fps = Math.round(frames / elapsed);
          resolve(Math.min(120, Math.max(30, fps)));
        }
      };
      requestAnimationFrame(count);
    });
  }
}
