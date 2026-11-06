import { Injectable, signal, computed } from '@angular/core';
import { Asset3DItem } from '../models/xr.models';

@Injectable({
  providedIn: 'root',
})
export class AssetLibraryService {
  selectedCategory = signal<'all' | 'models' | 'materials' | 'shaders' | 'audio' | 'prefabs'>('all');
  searchQuery = signal<string>('');

  assets = signal<Asset3DItem[]>([
    // Models
    {
      id: 'ast-drone',
      name: 'Cyberpunk 6-DOF Drone',
      category: 'models',
      type: 'Procedural 3D Mesh',
      descriptionEn: 'Autonomous quad-rotor spatial vehicle with metallic hull, sensor visor, and spinning blades.',
      descriptionFa: 'پهپاد فضایی خودمختار با بدنه متالیک، سنسورهای بینایی و پره‌های چرخان.',
      thumbnailIcon: 'flight',
      license: 'RealityForge Procedural',
    },
    {
      id: 'ast-rover',
      name: 'Spatial Autonomous Rover',
      category: 'models',
      type: 'Procedural 3D Mesh',
      descriptionEn: '6-wheel all-terrain exploration rover with rotating LiDAR dome and chassis suspension.',
      descriptionFa: 'کاوشگر ۶ چرخ مناسب تمامی سطوح به همراه گنبد چرخان سنسور لایدار.',
      thumbnailIcon: 'directions_car',
      license: 'RealityForge Procedural',
    },
    {
      id: 'ast-holo-table',
      name: 'Holographic Tactical Console',
      category: 'models',
      type: 'Procedural 3D Mesh',
      descriptionEn: 'Futuristic command console with circular base, glass top, and wireframe hologram core.',
      descriptionFa: 'میز فرماندهی هولوگرافیک با پایه استوانه‌ای، رویه شیشه‌ای و هسته شناور سیمی.',
      thumbnailIcon: 'table_restaurant',
      license: 'RealityForge Procedural',
    },
    {
      id: 'ast-vr-headset',
      name: 'Spatial XR Headset Rig',
      category: 'models',
      type: 'Procedural 3D Mesh',
      descriptionEn: 'Next-gen spatial computing headset with stereoscopic passthrough sensors and ergonomic strap.',
      descriptionFa: 'هدست رایانش فضایی مجهز به سنسورهای تصویربرداری استریوسکوپیک و بند نگه‌دارنده ارگونومیک.',
      thumbnailIcon: 'vrpano',
      license: 'RealityForge Procedural',
    },
    {
      id: 'ast-ar-chair',
      name: 'Nordic Spatial Armchair',
      category: 'models',
      type: 'Procedural 3D Mesh',
      descriptionEn: 'Minimalist interior armchair tailored for AR room layout and hit-testing dimension testing.',
      descriptionFa: 'صندلی راحتی مدرن مناسب آزمایش اندازه‌گیری و چیدمان در واقعیت افزوده.',
      thumbnailIcon: 'chair',
      license: 'RealityForge Procedural',
    },
    {
      id: 'ast-bio-core',
      name: 'Bio-Holo Energy Reactor',
      category: 'models',
      type: 'Procedural 3D Mesh',
      descriptionEn: 'Plasma core encased in optical glass with orbiting planetary rings and glow emission.',
      descriptionFa: 'هسته رآکتور پلاسما در داخل حباب شیشه‌ای با حلقه‌های مداری درخشان.',
      thumbnailIcon: 'hub',
      license: 'RealityForge Procedural',
    },

    // Materials
    {
      id: 'mat-titanium',
      name: 'Brushed Aerospace Titanium',
      category: 'materials',
      type: 'PBR Physical Material',
      descriptionEn: 'High metalness (0.95), low roughness (0.18), with anisotropic surface reflections.',
      descriptionFa: 'تیتانیوم هوافضا با متالیک ۰.۹۵، زبری ۰.۱۸ و بازتاب‌های نور نامتقارن.',
      thumbnailIcon: 'gradient',
      license: 'RealityForge Procedural',
    },
    {
      id: 'mat-hologlass',
      name: 'Optical Transmissive Crystal',
      category: 'materials',
      type: 'PBR Physical Material',
      descriptionEn: 'Clearcoat 1.0, transmission 0.92, index of refraction (IOR) 1.52 with zero opacity.',
      descriptionFa: 'شیشه کریستالی اپتیکال با ضریب شکست نور ۱.۵۲ و عبور نور ۹۲ درصد.',
      thumbnailIcon: 'auto_awesome',
      license: 'RealityForge Procedural',
    },
    {
      id: 'mat-neon-cyan',
      name: 'Cyberpunk Emissive Cyan',
      category: 'materials',
      type: 'PBR Physical Material',
      descriptionEn: 'High intensity emissive glow (2.5) with deep electric cyan bloom wavelength.',
      descriptionFa: 'درخشش نئونی سیان با شدت بازتاب ۲.۵ مخصوص نمایشگرها و سنسورها.',
      thumbnailIcon: 'lightbulb',
      license: 'RealityForge Procedural',
    },

    // Shaders
    {
      id: 'shd-shield',
      name: 'Holographic Forcefield Shield',
      category: 'shaders',
      type: 'GLSL Custom Shader',
      descriptionEn: 'Vertex displacement with procedural hexagonal Fresnel edge glow and scanlines.',
      descriptionFa: 'سایه‌زن شیلد محافظتی با درخشش لبه‌های فرنل شش‌ضلعی و خطوط اسکن نوری.',
      thumbnailIcon: 'shield',
      license: 'MIT / OpenXR CC0',
    },
    {
      id: 'shd-grid',
      name: 'Spatial Infinite Floor Grid',
      category: 'shaders',
      type: 'GLSL Custom Shader',
      descriptionEn: 'Anti-aliased procedural grid shader with exponential camera distance fading.',
      descriptionFa: 'شبکه کف نامحدود بدون لرزش پیکسل با محو شدن تدریجی در افق.',
      thumbnailIcon: 'grid_4x4',
      license: 'MIT / OpenXR CC0',
    },

    // Audio
    {
      id: 'aud-teleport',
      name: 'Spatial Teleportation Whoosh',
      category: 'audio',
      type: 'Web Audio Procedural',
      descriptionEn: 'Frequency sweep oscillator through HRTF panner node with resonant low-pass filter.',
      descriptionFa: 'افکت صوتی فرکانسی تلپورت با فیلتر پایین‌گذر بر بستر پردازش فضایی HRTF.',
      thumbnailIcon: 'volume_up',
      license: 'RealityForge Procedural',
    },
    {
      id: 'aud-grab',
      name: 'Controller Mechanical Snap',
      category: 'audio',
      type: 'Web Audio Procedural',
      descriptionEn: 'Instantaneous transient click indicating 6-DOF raycaster object acquisition.',
      descriptionFa: 'صدای مکانیکی کوتاه نشان‌دهنده جذب شیء توسط پرتو کنترلر ۶ درجه آزادی.',
      thumbnailIcon: 'touch_app',
      license: 'RealityForge Procedural',
    },
  ]);

  filteredAssets = computed(() => {
    const cat = this.selectedCategory();
    const q = this.searchQuery().toLowerCase().trim();

    return this.assets().filter((a) => {
      const matchCat = cat === 'all' || a.category === cat;
      const matchQ =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.descriptionEn.toLowerCase().includes(q) ||
        a.descriptionFa.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  });
}
