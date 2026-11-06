import { Injectable, signal } from '@angular/core';
import { AcademyLesson } from '../models/xr.models';

@Injectable({
  providedIn: 'root',
})
export class AcademyDataService {
  lessons = signal<AcademyLesson[]>([
    {
      id: 'lesson-1',
      level: 1,
      titleEn: 'XR Fundamentals & Spatial Computing',
      titleFa: 'مبانی واقعیت گسترده و رایانش فضایی',
      category: 'Fundamentals',
      durationMinutes: 20,
      summaryEn: 'Understand the continuum from Real Environment to Augmented Reality (AR), Mixed Reality (MR), and Virtual Reality (VR) defined by Paul Milgram.',
      summaryFa: 'آشنایی با پیوستگی واقعیت مجازی بر اساس نظریه پال میلگرام، تفاوت‌های کلیدی AR، VR، MR و مفاهیم بنیادین ۶ درجه آزادی (6-DOF).',
      theoryEn: `Spatial Computing transforms human-computer interaction by anchoring digital media into the physical 3D world.
Key principles:
1. Degrees of Freedom (DoF): 3-DoF (Rotational pitch, yaw, roll) vs 6-DoF (Rotational + Positional translation X, Y, Z).
2. Field of View (FoV): The observable visual angular extent in degrees (human vision ~210°, Quest ~110°, Apple Vision Pro ~100°).
3. Latency & Motion-to-Photon: The time elapsed between physical head movement and the updated photons reaching the eye (critical target < 20ms to prevent cyber-sickness).`,
      theoryFa: `رایانش فضایی (Spatial Computing) تعامل انسان و کامپیوتر را با پیوند دادن رسانه‌های دیجیتال به جهان فیزیکی دگرگون می‌کند.
اصول کلیدی:
۱. درجات آزادی (DoF): تفکیک ۳ درجه آزادی (چرخش‌های Pitch، Yaw، Roll) در برابر ۶ درجه آزادی (چرخش به‌علاوه جابه‌جایی در سه محور X, Y, Z).
۲. میدان دید (FoV): زاویه دید قابل مشاهده چشم انسان (~۲۱۰ درجه) در مقایسه با هدست‌های مدرن (~۱۰۰ الی ۱۱۰ درجه).
۳. تأخیر Motion-to-Photon: زمان بین حرکت فیزیکی سر تا تابش نور تصویر جدید بر چشم (هدف طلایی کمتر از ۲۰ میلی‌ثانیه برای جلوگیری از سرگیجه).`,
      codeSample: `// WebXR Session Capability Check
if ('xr' in navigator) {
  navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
    console.log('6-DOF Immersive VR Supported:', supported);
  });
  navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
    console.log('Environmental AR Supported:', supported);
  });
} else {
  console.warn('WebXR API not available in this client.');
}`,
      challengeEn: 'Check whether your current browser supports WebXR inline sessions versus immersive sessions.',
      challengeFa: 'بررسی کنید آیا مرورگر فعلی شما از نشست‌های تعبیه‌شده (inline) یا غوطه‌ورکننده (immersive) پشتیبانی می‌کند.',
      quiz: {
        questionEn: 'What is the critical Motion-to-Photon latency threshold in modern VR headsets to prevent simulation sickness?',
        questionFa: 'آستانه بحرانی تأخیر Motion-to-Photon در هدست‌های واقعیت مجازی برای پیشگیری از حالت تهوع چند میلی‌ثانیه است؟',
        optionsEn: ['< 20 milliseconds', '< 100 milliseconds', '< 500 milliseconds', '< 5 milliseconds'],
        optionsFa: ['کمتر از ۲۰ میلی‌ثانیه', 'کمتر از ۱۰۰ میلی‌ثانیه', 'کمتر از ۵۰۰ میلی‌ثانیه', 'کمتر از ۵ میلی‌ثانیه'],
        correctIndex: 0,
        explanationEn: 'Latency greater than 20ms causes perceptible mismatch between the vestibular system in the inner ear and the visual cortex, causing simulation sickness.',
        explanationFa: 'تأخیر بالاتر از ۲۰ میلی‌ثانیه سبب ناهماهنگی میان سیستم دهلیزی گوش داخلی و قشر بینایی مغز شده و منجر به سرگیجه و بیماری شبیه‌سازی می‌گردد.',
      },
    },
    {
      id: 'lesson-2',
      level: 2,
      titleEn: 'Mathematics for 3D: Vectors & Dot/Cross Products',
      titleFa: 'ریاضیات سه‌بعدی: بردارها، ضرب داخلی و ضرب خارجی',
      category: 'Mathematics',
      durationMinutes: 30,
      summaryEn: 'Master Euclidean 3D vectors, normalization, dot product for lighting and angles, and cross product for surface normal calculation.',
      summaryFa: 'تسلط بر بردارها در فضای سه‌بعدی، نرمال‌سازی، ضرب داخلی برای تعیین زاویه و شدت نور، و ضرب خارجی برای محاسبه بردار عمود بر سطح (Normal).',
      theoryEn: `Vectors form the foundational language of 3D computer graphics:
- Dot Product (A · B = |A||B| cos θ): Evaluates the angle between two vectors. If normalized, A · B = 1 means parallel, 0 means perpendicular (90°), and -1 means opposite. Crucial for Lambertian diffuse shading!
- Cross Product (A × B): Yields a third vector perpendicular to both input vectors following the right-hand rule. Used to compute face normals and camera view matrices.`,
      theoryFa: `بردارها زبان بنیادین گرافیک رایانه‌ای سه‌بعدی هستند:
- ضرب داخلی (Dot Product): زاویه بین دو بردار را مشخص می‌کند. در بردارهای یکه، اگر ضرب داخلی ۱ باشد یعنی هم‌جهت هستند، اگر ۰ باشد یعنی زاویه ۹۰ درجه دارند، و اگر منفی باشد جهت مخالف دارند. این اصل مبنای سایه‌زنی پخشی (Diffuse) لمبرت است.
- ضرب خارجی (Cross Product): برداری عمود بر هر دو بردار ورودی تولید می‌کند که طبق قانون دست راست جهت‌گیری دارد. کاربرد اصلی آن محاسبه بردار نرمال سطوح و جهت دوربین است.`,
      codeSample: `import * as THREE from 'three';

const lightDir = new THREE.Vector3(0, 1, 0).normalize();
const surfaceNormal = new THREE.Vector3(0.5, 0.866, 0).normalize();

// Compute diffuse intensity using dot product
const diffuseIntensity = Math.max(0, lightDir.dot(surfaceNormal));
console.log('Lambertian Shading Factor:', diffuseIntensity);

// Compute perpendicular tangent via cross product
const tangent = new THREE.Vector3().crossVectors(surfaceNormal, lightDir).normalize();
console.log('Perpendicular Tangent Vector:', tangent);`,
      challengeEn: 'Calculate the angle in degrees between two 3D vectors using dot product.',
      challengeFa: 'زاویه بر حسب درجه میان دو بردار دلخواه در فضای سه‌بعدی را با استفاده از ضرب داخلی محاسبه کنید.',
      quiz: {
        questionEn: 'If the dot product between a normalized surface normal and an incident light direction vector is 0, what does it mean?',
        questionFa: 'اگر حاصل ضرب داخلی یک بردار نرمال یکه و بردار تابش نور برابر با صفر باشد، به چه معناست؟',
        optionsEn: ['Light is grazing the surface perpendicularly (angle is 90°)', 'Light is directly overhead (angle is 0°)', 'Surface is in complete shadow facing backwards', 'Light intensity is at its maximum'],
        optionsFa: ['نور به صورت مماس با زاویه ۹۰ درجه به سطح برخورد می‌کند', 'نور دقیقاً عمود بر سطح می‌تابد (زاویه صفر)', 'سطح در پشت به منبع نور قرار دارد', 'شدت روشنایی در حداکثر مقدار ممکن است'],
        correctIndex: 0,
        explanationEn: 'When A · B = 0 for normalized vectors, cos(θ) = 0, which corresponds to θ = 90° (grazing angle, zero diffuse reflection).',
        explanationFa: 'وقتی ضرب داخلی بردارهای یکه صفر شود، کسینوس زاویه صفر است که نشان‌دهنده زاویه ۹۰ درجه یا تابش کاملاً مماس بدون بازتابش پخشی است.',
      },
    },
    {
      id: 'lesson-3',
      level: 3,
      titleEn: 'Quaternions & 3D Rotations (Gimbal Lock Immunity)',
      titleFa: 'کوآترنیون‌ها و چرخش‌های سه‌بعدی (رهایی از قفل گیمبال)',
      category: 'Mathematics',
      durationMinutes: 35,
      summaryEn: 'Understand why Euler angles fail with Gimbal Lock and how four-dimensional Quaternions (w, x, y, z) guarantee seamless spatial rotation.',
      summaryFa: 'بررسی علت شکست زوایای اویلر در اثر پدیده قفل گیمبال (Gimbal Lock) و چگونگی چرخش نرم با کوآترنیون‌های چهاربعدی در رایانش فضایی.',
      theoryEn: `Euler rotations (yaw, pitch, roll) apply sequential rotations around coordinate axes. When two rotation axes align, one degree of freedom is lost—known as Gimbal Lock.
Quaternions (q = w + xi + yj + zk) represent rotation around an arbitrary 3D axis by angle θ without gimbal lock:
- w = cos(θ / 2)
- (x, y, z) = v * sin(θ / 2)
In XR headsets, 6-DOF head orientation is continuously tracked using quaternions to enable smooth Spherical Linear Interpolation (SLERP) without visual jerking.`,
      theoryFa: `چرخش‌های اویلر چرخش را به‌صورت ترتیبی حول محورهای مختصات اعمال می‌کنند. زمانی که دو محور چرخش بر روی هم منطبق شوند، یکی از درجات آزادی از بین می‌رود که به آن قفل گیمبال (Gimbal Lock) می‌گویند.
کوآترنیون‌ها چرخش حول یک محور دلخواه در فضا را با فرمول چهاربعدی بیان کرده و از این مشکل مصون هستند.
تمام سنسورهای ژیروسکوپ و هدست‌های واقعیت مجازی جهت سر را با کوآترنیون ذخیره می‌کنند تا درون‌یابی کروی یکنواخت (SLERP) ممکن شود.`,
      codeSample: `import * as THREE from 'three';

const startQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);

// Spherical Linear Interpolation (SLERP) halfway (50%)
const currentQuat = new THREE.Quaternion();
currentQuat.slerpQuaternions(startQuat, targetQuat, 0.5);
console.log('Interpolated Quaternion:', currentQuat);`,
      challengeEn: 'Rotate an object 45 degrees around axis (1, 1, 0) using a Quaternion.',
      challengeFa: 'یک شیء سه‌بعدی را با زاویه ۴۵ درجه حول محور برداری (۱، ۱، ۰) توسط کوآترنیون بچرخانید.',
      quiz: {
        questionEn: 'Why do XR tracking systems and 3D engines prefer Quaternions over Euler angles?',
        questionFa: 'چرا سیستم‌های ترکینگ واقعیت گسترده و موتورهای سه‌بعدی کوآترنیون را به زوایای اویلر ترجیح می‌دهند؟',
        optionsEn: ['They prevent Gimbal Lock and enable smooth SLERP interpolation', 'They use less memory than a single float', 'They can only rotate 2D planes', 'They are strictly required by HTML CSS'],
        optionsFa: ['از قفل گیمبال جلوگیری کرده و امکان درون‌یابی کروی یکنواخت (SLERP) را فراهم می‌آورند', 'حافظه کمتری نسبت به یک عدد اعشاری مصرف می‌کنند', 'تنها قادر به چرخش در صفحه دوبعدی هستند', 'صرفاً برای فایل‌های CSS وب اجباری هستند'],
        correctIndex: 0,
        explanationEn: 'Quaternions represent orientation on the 4D hypersphere, avoiding the alignment singularities inherent to 3-axis Euler angle evaluation.',
        explanationFa: 'کوآترنیون‌ها چرخش را بر روی یک ابرکره چهاربعدی مدل می‌کنند و از تکینگی انطباق محورها در روش اویلر به‌طور کامل جلوگیری می‌نمایند.',
      },
    },
    {
      id: 'lesson-4',
      level: 4,
      titleEn: 'The Computer Graphics Rendering Pipeline & WebGL2',
      titleFa: 'پایپ‌لاین رندر گرافیک رایانه‌ای و وب‌جی‌ال ۲',
      category: 'Three.js',
      durationMinutes: 40,
      summaryEn: 'Deep dive into the programmable graphics pipeline: Vertex Specification, Vertex Shader, Rasterization, Fragment Shader, and Framebuffers.',
      summaryFa: 'بررسی عمیق پایپ‌لاین گرافیکی قابل برنامه‌نویسی: بافرهای رأس، سایه‌زن رأس (Vertex Shader)، شطرنجی‌سازی (Rasterization)، سایه‌زن پیکسل (Fragment Shader) و فریم‌بافر.',
      theoryEn: `The graphics pipeline runs on modern GPUs with immense parallel throughput:
1. Vertex Shader: Runs per vertex; transforms 3D model positions into clip-space coordinates using Model-View-Projection (MVP) matrix: P_clip = M_projection * M_view * M_model * P_local.
2. Rasterization: Converts geometric triangles into discrete fragments (potential pixels) with barycentric interpolation.
3. Fragment Shader: Runs per fragment; calculates final PBR color, lighting, texture UVs, and shadows.
4. Depth & Stencil Testing: Prevents hidden surfaces from overdrawing visible geometry.`,
      theoryFa: `پایپ‌لاین رندر بر روی پردازنده گرافیکی (GPU) به صورت موازی اجرا می‌شود:
۱. سایه‌زن رأس: به ازای هر رأس اجرا شده و مختصات سه‌بعدی محلی را با ماتریس MVP به مختصات صفحه دید دوربین منتقل می‌کند.
۲. شطرنجی‌سازی: مثلث‌های سه‌بعدی را به پیکسل‌های احتمالی (Fragments) تبدیل می‌کند.
۳. سایه‌زن پیکسل: رنگ نهایی هر پیکسل را بر اساس فرمول‌های نوری PBR و بافت‌ها محاسبه می‌کند.
۴. تست عمق (Depth Test): مانع از رسم سطوح پنهان پشت سطوح جلویی می‌شود.`,
      codeSample: `// Minimal GLSL Vertex Shader
const vertexShader = \`
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  attribute vec3 position;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
\`;

// Minimal GLSL Fragment Shader
const fragmentShader = \`
  precision highp float;
  void main() {
    gl_FragColor = vec4(0.0, 0.94, 1.0, 1.0); // Electric Cyan
  }
\`;`,
      challengeEn: 'Write a fragment shader that shades an object with a horizontal neon gradient.',
      challengeFa: 'یک سایه‌زن پیکسل (Fragment Shader) بنویسید که یک گرادیانت نئونی افقی بر روی شیء ایجاد کند.',
      quiz: {
        questionEn: 'Which stage of the GPU pipeline converts 3D vector triangles into candidate pixels?',
        questionFa: 'کدام مرحله از پایپ‌لاین گرافیکی مثلث‌های برداری سه‌بعدی را به پیکسل‌های نامزد تبدیل می‌کند؟',
        optionsEn: ['Rasterization', 'Tessellation', 'Color Blending', 'Texture Filtering'],
        optionsFa: ['شطرنجی‌سازی (Rasterization)', 'تسلیشن (Tessellation)', 'ترکیب رنگ (Color Blending)', 'فیلترینگ بافت'],
        correctIndex: 0,
        explanationEn: 'Rasterization discretizes continuous geometric primitives into discrete screen fragments and interpolates vertex attributes.',
        explanationFa: 'مرحله شطرنجی‌سازی اشکال هندسی پیوسته را به قطعات گسسته پیکسلی تبدیل نموده و مشخصات رأس‌ها را درون‌یابی می‌کند.',
      },
    },
    {
      id: 'lesson-5',
      level: 5,
      titleEn: 'Three.js Scene Graph & Camera Architecture',
      titleFa: 'درخت سلسله‌مراتب صحنه و معماری دوربین در Three.js',
      category: 'Three.js',
      durationMinutes: 30,
      summaryEn: 'Build clean parent-child object hierarchies, manage local vs world transformation matrices, and configure Perspective vs Orthographic projection.',
      summaryFa: 'ساخت ساختار سلسله‌مراتبی اشیاء، مدیریت ماتریس‌های تبدیل محلی و جهانی، و تفاوت دید پرسپکتیو و ارتوگرافیک.',
      theoryEn: `Three.js uses a Directed Acyclic Graph (DAG) called the Scene Graph:
- When an Object3D is added as a child of another, its local position, rotation, and scale are multiplied by its parent's world matrix.
- Moving the parent automatically transforms all children (e.g. moving a drone vehicle moves its rotors, sensors, and headlights).
- Calling object.updateMatrixWorld() cascades transformations through the tree.`,
      theoryFa: `موتور Three.js از ساختار سلسله‌مراتبی گراف صحنه بهره می‌برد:
- وقتی یک شیء فرزند شیء دیگری قرار می‌گیرد، تبدیلات مکانی، چرخشی و مقیاسی آن با ماتریس والد ضرب می‌شود.
- جابه‌جایی والد به‌طور خودکار تمامی قطعات فرزند را جابه‌جا می‌کند (مانند جابه‌جایی بدنه پهپاد که پره‌ها و سنسورها را با خود جابه‌جا می‌کند).`,
      codeSample: `import * as THREE from 'three';

const droneGroup = new THREE.Group();
const hull = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 1));
droneGroup.add(hull);

const rotor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.08));
rotor.position.set(0.6, 0.15, 0.6); // Relative to drone center
droneGroup.add(rotor);

// Moving the entire drone preserves relative rotor position
droneGroup.position.set(5, 2, -3);`,
      challengeEn: 'Create a hierarchical solar system with a Sun, an Earth orbiting it, and a Moon orbiting the Earth.',
      challengeFa: 'یک ساختار منظومه خورشیدی سلسله‌مراتبی بسازید که خورشید، زمین و ماه با وابستگی مکانی دور یکدیگر بچرخند.',
      quiz: {
        questionEn: 'If a parent Object3D has scale (2, 2, 2) and its child has scale (1.5, 1.5, 1.5), what is the effective world scale of the child?',
        questionFa: 'اگر یک شیء والد دارای مقیاس (۲، ۲، ۲) باشد و شیء فرزند آن مقیاس (۱.۵، ۱.۵، ۱.۵) داشته باشد، مقیاس نهایی فرزند در جهان چقدر است؟',
        optionsEn: ['(3, 3, 3)', '(1.5, 1.5, 1.5)', '(3.5, 3.5, 3.5)', '(2, 2, 2)'],
        optionsFa: ['(۳، ۳، ۳)', '(۱.۵، ۱.۵، ۱.۵)', '(۳.۵، ۳.۵، ۳.۵)', '(۲، ۲، ۲)'],
        correctIndex: 0,
        explanationEn: 'Scale transforms compound multiplicatively along the scene hierarchy: 2 * 1.5 = 3 on all three axes.',
        explanationFa: 'مقیاس‌های مکانی در طول سلسله‌مراتب صحنه به‌صورت ضربی با یکدیگر ترکیب می‌شوند: ۲ × ۱.۵ = ۳ در هر سه محور.',
      },
    },
    {
      id: 'lesson-6',
      level: 6,
      titleEn: 'Physically Based Rendering (PBR) Materials & Textures',
      titleFa: 'متریال‌های مبتنی بر فیزیک واقعی (PBR) و بافت‌ها',
      category: 'Three.js',
      durationMinutes: 40,
      summaryEn: 'Understand the Metallic-Roughness workflow, microfacet reflection, Fresnel equations, Clearcoat, and transmissive optical glass.',
      summaryFa: 'آشنایی عمیق با جریان کاری متالیک-زبری (Metallic-Roughness)، بازتابش ریزسطوح، معادله فرنل، کلیرکوت و شیشه با انتقال نوری بالا.',
      theoryEn: `PBR guarantees that materials react realistically under any studio lighting environment by respecting the conservation of energy:
- Roughness (0.0 - 1.0): Microfacet scattering. 0 = mirror reflection, 1 = diffuse scatter.
- Metalness (0.0 - 1.0): Non-metals (dielectrics, metalness=0) have white specular highlights and colored diffuse; metals (conductors, metalness=1) have zero diffuse albedo and reflect tint directly into specular highlights!
- Transmission: Light enters dielectric volume (refraction index IOR ~1.5 for glass).
- Color Space: Albedo textures MUST be sRGB; normal and roughness maps MUST be linear!`,
      theoryFa: `رندر مبتنی بر فیزیک (PBR) بر اصل پایستگی انرژی استوار است و تضمین می‌کند متریال در هر محیط نوری جلوه طبیعی داشته باشد:
- زبری (Roughness): میزان پراکندگی در سطح میکروسکوپی. صفر یعنی آینه تمام‌عیار و یک یعنی سطح کاملاً مات.
- فلزی بودن (Metalness): نارساناها دارای انعکاس سفید و رنگ زیرین هستند، درحالی‌که فلزات رسانا هیچ رنگ پخشی نداشته و بازتاب براق آن‌ها رنگی است.
- فضای رنگی: بافت‌های رنگ حتماً باید در فضای sRGB باشند و بافت‌های داده (زبری و نرمال) در فضای خطی.`,
      codeSample: `import * as THREE from 'three';

const luxuryTitaniumMat = new THREE.MeshPhysicalMaterial({
  color: 0x94a3b8,
  metalness: 0.95,
  roughness: 0.18,
  clearcoat: 0.8,
  clearcoatRoughness: 0.1,
});

const opticalGlassMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.0,
  roughness: 0.05,
  transmission: 0.95,
  ior: 1.52, // Crown glass
  transparent: true,
  opacity: 1.0,
});`,
      challengeEn: 'Configure a gold material with PBR properties (metalness 1.0, gold color #ffd700, roughness 0.25).',
      challengeFa: 'یک متریال طلای براق با مشخصات PBR (فلزی ۱.۰، رنگ #ffd700 و زبری ۰.۲۵) پیکربندی کنید.',
      quiz: {
        questionEn: 'Why must normal and roughness maps NEVER be loaded with sRGB color space?',
        questionFa: 'چرا نقشه‌های نرمال و زبری هرگز نباید در فضای رنگی sRGB بارگذاری شوند؟',
        optionsEn: ['They contain physical vector mathematical data, not perceptual human color, so gamma transformation corrupts them', 'They cause WebGL to immediately crash', 'sRGB makes textures upside down', 'Three.js only supports JPEG for normal maps'],
        optionsFa: ['آن‌ها حاوی داده‌های برداری ریاضی هستند نه رنگ دیداری انسان، بنابراین تبدیل گاما مقادیر عددی آن‌ها را مخدوش می‌کند', 'سبب توقف فوری اجرای وب‌جی‌ال می‌شود', 'بافت‌ها را وارونه می‌کند', 'موتور تری‌جی‌اس تنها از JPEG پشتیبانی می‌کند'],
        correctIndex: 0,
        explanationEn: 'Data maps (normal, roughness, metalness, displacement) represent linear physical floating point values. Applying sRGB gamma curve distorts the vector angles and reflection calculations.',
        explanationFa: 'نقشه‌های داده مقادیر فیزیکی برداری هستند؛ اعمال منحنی تبدیل گامای sRGB مقادیر عددی بردارها را به هم ریخته و زاویه سایه‌زنی را خراب می‌کند.',
      },
    },
    {
      id: 'lesson-7',
      level: 7,
      titleEn: 'WebXR Device API: Sessions, Reference Spaces & Loops',
      titleFa: 'استاندارد W3C WebXR: سشن‌ها، فضاهای مرجع و حلقه رندر',
      category: 'WebXR',
      durationMinutes: 45,
      summaryEn: 'Understand the WebXR standard: requestSession, local-floor vs unbounded reference spaces, xrAnimationLoop, and multi-view stereoscopic projections.',
      summaryFa: 'آشنایی عمیق با استاندارد W3C WebXR: ایجاد سشن، فضاهای مرجع local-floor، حلقه انیمیشن xr و رندر استریوسکوپیک دوچشمی.',
      theoryEn: `The W3C WebXR Device API is the industry standard for delivering VR and AR directly inside modern browsers:
1. Session Types: 'inline' (screen-anchored), 'immersive-vr' (headset dual eye), 'immersive-ar' (camera passthrough).
2. Reference Spaces:
   - 'viewer': Tracks the device head/camera origin.
   - 'local': Anchored where tracking began.
   - 'local-floor': Origin is physically calibrated on the floor beneath the user (critical for room-scale VR!).
   - 'unbounded': Used for large-scale outdoor spatial navigation.
3. XRFrame Loop: Uses session.requestAnimationFrame(onXRFrame) synchronizing with headset display refresh rates (72Hz, 90Hz, 120Hz).`,
      theoryFa: `استاندارد وب WebXR بستر ارتباط مستقیم مرورگر با سخت‌افزارهای واقعیت مجازی و افزوده است:
۱. انواع سشن: سشن تعبیه‌شده (inline)، غوطه‌ورکننده VR (دوچشمی در هدست)، و غوطه‌ورکننده AR (با تصویر دوربین محیط).
۲. فضاهای مرجع:
   - فضای local-floor: مبدأ مختصات دقیقاً بر روی کف زمین اتاق کالیبره می‌شود که برای تجربیات مقیاس اتاق ضروری است.
   - فضای viewer: مبدأ بر روی خود سر و چشم کاربر قرار دارد.
۳. حلقه فریم XR: با نرخ نوسازی سخت‌افزار هدست (۷۲ تا ۱۲۰ هرتز) هماهنگ می‌شود.`,
      codeSample: `// Native WebXR Session Lifecycle
async function launchXRSession() {
  const session = await navigator.xr.requestSession('immersive-vr', {
    optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
  });
  const refSpace = await session.requestReferenceSpace('local-floor');

  session.requestAnimationFrame(function onXRFrame(time, frame) {
    const pose = frame.getViewerPose(refSpace);
    if (pose) {
      for (const view of pose.views) {
        // Render each eye's view viewport
        const viewport = session.renderState.baseLayer.getViewport(view);
      }
    }
    session.requestAnimationFrame(onXRFrame);
  });
}`,
      challengeEn: 'Request an immersive-ar WebXR session with hit-test feature flag enabled.',
      challengeFa: 'یک سشن immersive-ar با فعال‌سازی پرچم قابلیت hit-test به شکل استاندارد درخواست دهید.',
      quiz: {
        questionEn: 'Which WebXR reference space provides coordinates calibrated with Y=0 at the physical floor?',
        questionFa: 'کدام فضای مرجع در استاندارد WebXR نقطه Y=0 را دقیقاً روی کف فیزیکی زمین اتاق تنظیم می‌کند؟',
        optionsEn: ['local-floor', 'viewer', 'unbounded', 'screen-space'],
        optionsFa: ['local-floor', 'viewer', 'unbounded', 'screen-space'],
        correctIndex: 0,
        explanationEn: 'The local-floor reference space provides an origin whose standing height is calibrated from tracking sensors so that Y=0 aligns with the floor.',
        explanationFa: 'فضای local-floor مبدأ مختصات را با سنسورهای کالیبراسیون هدست تطبیق داده تا ارتفاع صفر دقیقاً بر روی زمین واقعی قرار گیرد.',
      },
    },
    {
      id: 'lesson-8',
      level: 8,
      titleEn: 'AR Surface Detection & Real-Time Hit-Testing',
      titleFa: 'تشخیص سطوح واقعی و Hit-Testing در واقعیت افزوده',
      category: 'AR',
      durationMinutes: 45,
      summaryEn: 'Implement raycasting against real physical surfaces (tables, floors, walls) using WebXR Hit-Test API and visual reticle placement.',
      summaryFa: 'پیاده‌سازی پرتاب اشعه (Raycasting) بر روی سطوح واقعی محیط فیزیکی (میز، زمین، دیوار) با WebXR Hit-Test و حلقه نشانگر رتیکل.',
      theoryEn: `Hit-Testing connects virtual coordinates with computer-vision SLAM (Simultaneous Localization and Mapping):
1. An XRHitTestSource is created by casting rays from the viewer center into the spatial environment.
2. In each frame, frame.getHitTestResults(hitTestSource) returns intersections with recognized physical planes.
3. The matrix of the top hit is extracted to position and orient a visual reticle flush with the real table or floor.
4. On user tap / touch, holograms are instantiated at the reticle matrix.`,
      theoryFa: `قابلیت Hit-Testing پل ارتباطی میان مختصات نرم‌افزار و الگوریتم‌های بینایی ماشین SLAM است:
۱. یک منبع Hit-Test اشعه‌هایی از مرکز دید به سمت محیط ساطع می‌کند.
۲. در هر فریم، تقاطع این اشعه‌ها با سطوح واقعی شناسایی‌شده دریافت می‌شود.
۳. ماتریس موقعیت سطح استخراج شده و یک حلقه نشانگر (Reticle) مماس با سطح قرار می‌گیرد.
۴. با لمس کاربر، شیء سه‌بعدی دقیقاً بر روی سطح فیزیکی ثابت می‌ماند.`,
      codeSample: `// WebXR Hit-Testing in Three.js Loop
let hitTestSource = null;
const reticle = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);

function onXRFrame(time, frame) {
  if (hitTestSource) {
    const hitTestResults = frame.getHitTestResults(hitTestSource);
    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(referenceSpace);
      reticle.visible = true;
      reticle.matrix.fromArray(pose.transform.matrix);
    } else {
      reticle.visible = false;
    }
  }
}`,
      challengeEn: 'Anchor a 3D hologram onto a detected table plane upon screen tap.',
      challengeFa: 'با لمس صفحه، یک هولوگرام سه‌بعدی را دقیقاً بر روی سطح میز تشخیص‌داده‌شده لنگراندازی کنید.',
      quiz: {
        questionEn: 'What computer vision technique allows AR systems to map physical environments without pre-installed markers?',
        questionFa: 'کدام فناوری بینایی ماشین به سیستم‌های AR اجازه می‌دهد محیط فیزیکی را بدون نشانگرهای از پیش نصب‌شده نقشه‌برداری کنند؟',
        optionsEn: ['SLAM (Simultaneous Localization and Mapping)', 'JPEG Compression', 'Ray Tracing', 'Alpha Blending'],
        optionsFa: ['الگوریتم SLAM (مکان‌یابی و نقشه‌برداری همزمان)', 'فشرده‌سازی JPEG', 'رهگیری پرتو (Ray Tracing)', 'ترکیب آلفا'],
        correctIndex: 0,
        explanationEn: 'SLAM utilizes visual feature points from camera feeds and IMU sensor fusion to reconstruct the environment geometry and track user position concurrently.',
        explanationFa: 'الگوریتم SLAM نقاط کلیدی تصویر دوربین را با شتاب‌سنج و ژیروسکوپ ادغام کرده و همزمان نقشه سه‌بعدی اتاق و مکان کاربر را محاسبه می‌کند.',
      },
    },
  ]);

  selectedLessonId = signal<string>('lesson-1');

  getActiveLesson(): AcademyLesson {
    return this.lessons().find((l) => l.id === this.selectedLessonId()) || this.lessons()[0];
  }

  selectLesson(id: string) {
    this.selectedLessonId.set(id);
  }
}
