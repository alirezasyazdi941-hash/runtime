import { Injectable, signal, computed } from '@angular/core';
import { KnowledgeItem } from '../models/xr.models';

@Injectable({
  providedIn: 'root',
})
export class KnowledgeCenterService {
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');

  items = signal<KnowledgeItem[]>([
    {
      id: 'k-1',
      title: 'W3C WebXR Device API Specification',
      category: 'WebXR',
      source: 'W3C Immersive Web Working Group',
      url: 'https://www.w3.org/TR/webxr/',
      lastVerified: '2026-10-15',
      summaryEn: 'Official W3C specification defining access to virtual reality (VR) and augmented reality (AR) devices, reference spaces, poses, and input sources.',
      summaryFa: 'مستندات رسمی کنسرسیوم وب W3C که دسترسی به دستگاه‌های واقعیت مجازی و افزوده، فضاهای مرجع، موقعیت سر و کنترلرها را تعریف می‌کند.',
      codeSnippet: `const session = await navigator.xr.requestSession('immersive-vr');
const refSpace = await session.requestReferenceSpace('local-floor');`,
      tags: ['W3C', 'WebXR', 'Specification', 'Immersive Web', 'Standard'],
    },
    {
      id: 'k-2',
      title: 'Khronos OpenXR 1.1 Standard',
      category: 'OpenXR',
      source: 'Khronos Group',
      url: 'https://www.khronos.org/openxr/',
      lastVerified: '2026-09-20',
      summaryEn: 'Cross-platform, royalty-free standard providing high-performance access to XR platforms and devices across Meta Quest, Apple Vision Pro, SteamVR, and Windows Mixed Reality.',
      summaryFa: 'استاندارد بین‌پلتفرمی گروه کرونوس برای دسترسی با کارایی بالا به سخت‌افزارهای واقعیت گسترده در متا کوئست، ویژن پرو و استیم‌وی‌آر.',
      codeSnippet: `XrInstance instance;
XrInstanceCreateInfo createInfo = { XR_TYPE_INSTANCE_CREATE_INFO };
xrCreateInstance(&createInfo, &instance);`,
      tags: ['Khronos', 'OpenXR', 'C++', 'Native', 'Cross-Platform'],
    },
    {
      id: 'k-3',
      title: 'Three.js Modern Color Pipeline & SRGBColorSpace',
      category: 'Three.js',
      source: 'Three.js Official Documentation (r160+)',
      url: 'https://threejs.org/docs/#api/en/renderers/WebGLRenderer.outputColorSpace',
      lastVerified: '2026-11-01',
      deprecatedNotice: 'renderer.outputEncoding is DEPRECATED in r152+. Use renderer.outputColorSpace = THREE.SRGBColorSpace.',
      summaryEn: 'Modern physical color pipeline configuration for photorealistic PBR rendering and ACESFilmicToneMapping.',
      summaryFa: 'تنظیمات خط لوله رنگی مدرن تری‌جی‌اس برای رندر واقع‌گرایانه فیزیکی PBR و نگاشت تنالیته ACESFilmic.',
      codeSnippet: `renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;`,
      tags: ['Three.js', 'PBR', 'Color Management', 'sRGB', 'ACESFilmic'],
    },
    {
      id: 'k-4',
      title: 'Apple RealityKit 4 & visionOS Spatial Computing',
      category: 'ARKit',
      source: 'Apple Developer Documentation',
      url: 'https://developer.apple.com/augmented-reality/',
      lastVerified: '2026-08-30',
      summaryEn: 'Apple spatial engine built for visionOS, iOS, and iPadOS with photorealistic rendering, spatial audio, and Swift concurrency.',
      summaryFa: 'موتور قدرتمند اپل برای ساخت تجربیات محاسبات فضایی در visionOS و iOS با پشتیبانی از فیزیک و صدای فضایی سه‌بعدی.',
      codeSnippet: `import RealityKit
let entity = try await ModelEntity(named: "drone")
entity.components.set(SpatialAudioComponent())`,
      tags: ['Apple', 'ARKit', 'RealityKit', 'visionOS', 'Swift'],
    },
    {
      id: 'k-5',
      title: 'Google ARCore & Geospatial API',
      category: 'ARCore',
      source: 'Google Android Developers',
      url: 'https://developers.google.com/ar',
      lastVerified: '2026-10-01',
      summaryEn: 'Environmental understanding, motion tracking, light estimation, and global street-view VPS anchoring through Google ARCore.',
      summaryFa: 'سیستم ترکینگ حرکت، تخمین نور محیط و لنگراندازی جهانی با استفاده از سیستم موقعیت‌یابی دیداری گوگل.',
      codeSnippet: `val session = Session(context)
val config = Config(session).apply {
    geospatialMode = Config.GeospatialMode.ENABLED
}
session.configure(config)`,
      tags: ['Google', 'ARCore', 'Android', 'Geospatial', 'VPS'],
    },
    {
      id: 'k-6',
      title: 'Khronos glTF 2.0 (The JPEG of 3D)',
      category: 'Three.js',
      source: 'Khronos Group Specification',
      url: 'https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html',
      lastVerified: '2026-10-18',
      summaryEn: 'Extensible runtime 3D asset transmission format with binary buffers (.glb), Draco compression, and standardized PBR material definitions.',
      summaryFa: 'فرمت استاندارد بین‌المللی انتقال فایل‌های سه‌بعدی بهینه برای وب با پشتیبانی از فشرده‌سازی دراکو و متریال‌های PBR.',
      codeSnippet: `import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const loader = new GLTFLoader();
loader.load('model.glb', (gltf) => scene.add(gltf.scene));`,
      tags: ['glTF', 'GLB', 'Khronos', '3D Asset', 'PBR'],
    },
    {
      id: 'k-7',
      title: 'Legacy WebVR API Deprecation Alert',
      category: 'WebXR',
      source: 'W3C & MDN Web Docs',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebVR_API',
      lastVerified: '2026-07-12',
      deprecatedNotice: 'CRITICAL: The old WebVR API (navigator.getVRDisplays) has been completely removed from all modern browsers. Always use navigator.xr (WebXR Device API).',
      summaryEn: 'Historic record detailing the sunset of WebVR and why WebXR Device API is required for modern headset compatibility.',
      summaryFa: 'هشدار امنیتی و سازگاری: استاندارد قدیمی WebVR به‌طور کامل منسوخ و حذف شده است؛ همواره از استاندارد جدید WebXR استفاده کنید.',
      codeSnippet: `// ❌ DO NOT USE (DEPRECATED):
// navigator.getVRDisplays()

// ✅ CORRECT MODERN STANDARD:
if (navigator.xr) {
  navigator.xr.requestSession('immersive-vr');
}`,
      tags: ['Deprecated', 'WebVR', 'Security', 'Migration', 'WebXR'],
    },
    {
      id: 'k-8',
      title: 'Web Audio API: 3D Positional HRTF Spatial Audio',
      category: 'W3C',
      source: 'W3C Audio Working Group',
      url: 'https://www.w3.org/TR/webaudio/',
      lastVerified: '2026-10-25',
      summaryEn: 'High-fidelity Head-Related Transfer Function (HRTF) spatial panner nodes for realistic 3D distance attenuation and binaural listening in headsets.',
      summaryFa: 'پردازش صدای فضایی ۳ بعدی با الگوریتم HRTF در استاندارد وب برای شبیه‌سازی دقیق جهت و فاصله صدا در گوش کاربر.',
      codeSnippet: `const panner = audioContext.createPanner();
panner.panningModel = 'HRTF';
panner.setPosition(x, y, z);`,
      tags: ['Web Audio', 'HRTF', 'Spatial Audio', 'Binaural', 'Sound'],
    },
  ]);

  filteredItems = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.items().filter((item) => {
      const matchCat = cat === 'all' || item.category === cat;
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summaryEn.toLowerCase().includes(q) ||
        item.summaryFa.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  });
}
