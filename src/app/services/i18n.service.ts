import { Injectable, signal, effect, computed } from '@angular/core';
import { SupportedLanguage } from '../models/xr.models';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  currentLang = signal<SupportedLanguage>('en');

  isRtl = computed(() => this.currentLang() === 'fa');

  constructor() {
    // Check saved language or browser preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('reality_forge_lang') as SupportedLanguage;
      if (saved === 'fa' || saved === 'en') {
        this.currentLang.set(saved);
      }
    }

    effect(() => {
      const lang = this.currentLang();
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
        if (lang === 'fa') {
          document.body.classList.add('rtl-active');
        } else {
          document.body.classList.remove('rtl-active');
        }
        localStorage.setItem('reality_forge_lang', lang);
      }
    });
  }

  setLanguage(lang: SupportedLanguage) {
    this.currentLang.set(lang);
  }

  toggleLanguage() {
    this.currentLang.update((curr) => (curr === 'en' ? 'fa' : 'en'));
  }

  // Translation lookup helper
  t(key: string): string {
    const lang = this.currentLang();
    const entry = this.dictionary[key];
    if (!entry) return key;
    return entry[lang] || entry['en'] || key;
  }

  private dictionary: Record<string, { en: string; fa: string }> = {
    // App Brand
    'app.title': { en: 'NONONICK REALITY FORGE', fa: 'نانونیک ریلیتی فورج' },
    'app.tagline': { en: 'Spatial Computing & XR Studio', fa: 'استودیوی توسعه رایانش فضایی و واقعیت گسترده' },
    
    // Navigation Modes
    'nav.dashboard': { en: 'Dashboard', fa: 'داشبورد' },
    'nav.viewport3d': { en: '3D Studio', fa: 'استودیوی سه‌بعدی' },
    'nav.arStudio': { en: 'AR Studio', fa: 'استودیوی واقعیت افزوده' },
    'nav.vrStudio': { en: 'VR Studio', fa: 'استودیوی واقعیت مجازی' },
    'nav.codeWorkspace': { en: 'Code & Run', fa: 'کدنویسی و اجرا' },
    'nav.aiForge': { en: 'REALITY MASTER AI', fa: 'هوش مصنوعی ریلیتی مستر' },
    'nav.academy': { en: 'XR Academy', fa: 'آکادمی آموزش' },
    'nav.assetLibrary': { en: 'Assets', fa: 'دارایی‌ها' },
    'nav.qaTest': { en: 'QA & Diagnostic', fa: 'تست و عیب‌یابی' },
    'nav.knowledge': { en: 'Knowledge Center', fa: 'مرکز دانش' },

    // Header actions
    'header.activeProject': { en: 'Active Project', fa: 'پروژه فعال' },
    'header.newProject': { en: 'New Project', fa: 'پروژه جدید' },
    'header.export': { en: 'Export GLB / Code', fa: 'خروجی GLB و کد' },
    'header.deviceReady': { en: 'Device Status', fa: 'وضعیت دستگاه' },
    'header.lang': { en: 'Language', fa: 'زبان' },

    // Dashboard
    'dash.welcome': { en: 'Spatial Computing Engineering Environment', fa: 'محیط مهندسی و توسعه رایانش فضایی' },
    'dash.sub': { en: 'Design, simulate, debug, and ship production-grade AR/VR/WebXR applications.', fa: 'طراحی، شبیه‌سازی، دیباگ و انتشار نرم‌افزارهای استاندارد واقعیت مجازی و افزوده.' },
    'dash.createProject': { en: 'Create New XR Project', fa: 'ایجاد پروژه XR جدید' },
    'dash.recentProjects': { en: 'Recent Projects', fa: 'پروژه‌های اخیر' },
    'dash.hardwareOverview': { en: 'Hardware & WebXR Readiness', fa: 'آمادگی سخت‌افزار و WebXR' },
    'dash.quickTools': { en: 'Fast Tooling', fa: 'ابزارهای سریع' },
    'dash.activeEngines': { en: 'Active Engines & Runtimes', fa: 'موتورهای رندر فعال' },
    'dash.systemHealth': { en: 'System Integrity', fa: 'سلامت سیستم' },

    // 3D Viewport
    'vp.perspective': { en: 'Perspective', fa: 'پرسپکتیو' },
    'vp.orthographic': { en: 'Orthographic', fa: 'ارتوگرافیک' },
    'vp.translate': { en: 'Move', fa: 'انتقال' },
    'vp.rotate': { en: 'Rotate', fa: 'چرخش' },
    'vp.scale': { en: 'Scale', fa: 'اندازه' },
    'vp.exportGlb': { en: 'Export .GLB', fa: 'دانلود فایل .GLB' },
    'vp.importFile': { en: 'Import 3D Model', fa: 'بارگذاری مدل سه‌بعدی' },
    'vp.sceneGraph': { en: 'Scene Hierarchy', fa: 'درخت سلسله‌مراتب صحنه' },
    'vp.materialInspector': { en: 'PBR Material Inspector', fa: 'تنظیمات متریال PBR' },
    'vp.addPreset': { en: 'Add Procedural 3D Model', fa: 'افزودن مدل سه‌بعدی محاسباتی' },
    'vp.cameraViews': { en: 'Camera Angle', fa: 'زاویه دوربین' },
    'vp.resetCamera': { en: 'Reset View', fa: 'بازنشانی دید' },
    'vp.grid': { en: 'Grid Helper', fa: 'شبکه راهنما' },
    'vp.axes': { en: 'Axes Helper', fa: 'محورهای مختصات' },
    'vp.shadows': { en: 'Soft Shadows', fa: 'سایه‌های نرم' },

    // AR Studio
    'ar.title': { en: 'Augmented Reality Lab', fa: 'آزمایشگاه واقعیت افزوده' },
    'ar.sub': { en: 'Real-time camera passthrough, surface reticle hit-testing & spatial anchoring.', fa: 'تصویر زنده دوربین محیط، تشخیص سطوح با رتیکل و لنگراندازی فضایی.' },
    'ar.startCamera': { en: 'Activate Reality Camera', fa: 'فعال‌سازی دوربین واقعی' },
    'ar.stopCamera': { en: 'Pause Camera', fa: 'توقف دوربین' },
    'ar.placeObject': { en: 'Place Hologram', fa: 'قرار دادن هولوگرام' },
    'ar.clearPlaced': { en: 'Clear Objects', fa: 'پاکسازی اشیاء' },
    'ar.capturePhoto': { en: 'Capture AR Snapshot', fa: 'ثبت عکس از صحنه AR' },
    'ar.hitTestActive': { en: 'Hit-Testing Surface Ready', fa: 'سطح رتیکل آماده جایگذاری است' },
    'ar.modelScale': { en: 'Model Scale', fa: 'مقیاس مدل' },
    'ar.modelRotation': { en: 'Rotation', fa: 'زاویه چرخش' },
    'ar.deviceNote': { en: 'WebXR / MediaDevices Environment Passthrough Engine', fa: 'موتور انطباق دوربین محیط و سنسورهای حرکتی' },

    // VR Studio
    'vr.title': { en: 'Virtual Reality & Spatial Simulation', fa: 'شبیه‌سازی واقعیت مجازی و محاسبات فضایی' },
    'vr.sub': { en: '6-DOF Controller emulation, teleportation arcs, ray grab physics & 3D audio.', fa: 'شبیه‌سازی کنترلرهای ۶ درجه آزادی، قوس تلپورت، فیزیک جذب اشعه و صدای فضایی سه‌بعدی.' },
    'vr.enterWebXR': { en: 'Launch Headset Session (WebXR)', fa: 'شروع سشن هدست (WebXR)' },
    'vr.simulator': { en: 'In-Browser VR Simulator', fa: 'شبیه‌ساز تعاملی VR در مرورگر' },
    'vr.leftHand': { en: 'Left Controller', fa: 'کنترلر دست چپ' },
    'vr.rightHand': { en: 'Right Controller', fa: 'کنترلر دست راست' },
    'vr.teleport': { en: 'Teleport to Point', fa: 'انتقال آنی به نقطه' },
    'vr.spatialAudio': { en: 'Play 3D Positional Audio', fa: 'پخش صدای فضایی سه‌بعدی' },
    'vr.fps': { en: 'Render FPS', fa: 'نرخ فریم رندر' },
    'vr.drawCalls': { en: 'Draw Calls', fa: 'فراخوانی‌های رسم' },
    'vr.memory': { en: 'GPU Memory', fa: 'حافظه گرافیکی' },

    // AI
    'ai.agentTitle': { en: 'REALITY MASTER AI', fa: 'ایجنت ارشد REALITY MASTER AI' },
    'ai.agentRole': { en: '14-in-1 Senior XR Architect & Mentor', fa: 'معمار ارشد ۱۴گانه XR و مربی مهندسی' },
    'ai.promptPlaceholder': { en: 'Ask architectural questions, debug WebXR/Three.js code, or specify an XR app to generate...', fa: 'سؤالات معماری بپرسید، کد WebXR و Three.js را دیباگ کنید، یا ایده پروژه XR خود را شرح دهید...' },
    'ai.generateBtn': { en: 'Generate XR Project', fa: 'تولید کامل پروژه XR' },
    'ai.sendBtn': { en: 'Consult AI', fa: 'مشاوره با ایجنت' },
    'ai.targetHardware': { en: 'Target Hardware', fa: 'سخت‌افزار هدف' },
    'ai.selectedEngine': { en: 'Engine', fa: 'موتور انتخابی' },
    'ai.loadToCode': { en: 'Open in Code Workspace', fa: 'انتقال به محیط کدنویسی' },
    'ai.loadTo3D': { en: 'Load into 3D Viewport', fa: 'نمایش در استودیوی سه‌بعدی' },

    // Academy
    'acad.title': { en: 'XR Engineering Academy', fa: 'آکادمی مهندسی واقعیت گسترده' },
    'acad.sub': { en: 'Master 3D Math, WebGL, Three.js, Shaders, WebXR, and Spatial Computing from zero to production.', fa: 'آموزش عمیق ریاضیات سه‌بعدی، وب‌جی‌ال، تری‌جی‌اس، سایه‌زن‌ها، وب‌ایکس‌آر و رایانش فضایی از مبانی تا ساخت پروژه واقعی.' },
    'acad.runSample': { en: 'Run Code in Sandbox', fa: 'اجرای کد در محیط زنده' },
    'acad.submitQuiz': { en: 'Check Answer', fa: 'بررسی پاسخ آزمون' },
    'acad.nextLesson': { en: 'Next Lesson', fa: 'درس بعدی' },
    'acad.prevLesson': { en: 'Previous Lesson', fa: 'درس قبلی' },

    // Code Workspace
    'code.title': { en: 'Code Studio & Live WebXR Sandbox', fa: 'استودیوی کد و سندباکس زنده WebXR' },
    'code.run': { en: 'Execute / Refresh Preview', fa: 'اجرا و بروزرسانی پیش‌نمایش' },
    'code.debugAI': { en: 'AI Debug & Optimize', fa: 'دیباگ و بهینه‌سازی با هوش مصنوعی' },
    'code.exportHtml': { en: 'Export Standalone HTML5', fa: 'خروجی فایل مستقل HTML5' },
    'code.console': { en: 'Runtime Console & Diagnostics', fa: 'کنسول خروجی و عیب‌یابی' },
    'code.clearConsole': { en: 'Clear Logs', fa: 'پاکسازی گزارش‌ها' },

    // QA
    'qa.title': { en: 'XR Quality Assurance & Hardware Diagnostics', fa: 'تضمین کیفیت XR و عیب‌یابی سخت‌افزار' },
    'qa.sub': { en: 'Real-time WebGL, WebXR, frame rate stability, memory leaks and security verification.', fa: 'بررسی زنده WebGL، WebXR، پایداری نرخ فریم، نشت حافظه و اعتبارسنجی امنیتی بدون شبیه‌سازی کذب.' },
    'qa.runAll': { en: 'Run Full Test Suite', fa: 'اجرای تمام آزمون‌های کیفی' },
  };
}
