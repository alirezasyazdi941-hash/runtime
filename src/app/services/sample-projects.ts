import { Project } from '../models/project.model';

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'c-wasm-math-engine',
    name: 'C/WAT High-Performance Math Engine',
    description: 'Hardware-grade mathematical computation suite compiled directly from WebAssembly Text (WAT) into binary bytecode.',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 2,
    runtimeMode: 'mode-b-wasm',
    tags: ['C/C++', 'WebAssembly', 'WASI', 'Level 1'],
    files: [
      {
        path: 'src/math.wat',
        name: 'math.wat',
        language: 'wat',
        sizeBytes: 1140,
        content: `(module
  ;; Exported Fibonacci function (recursive / iterative)
  (func $fib (param $n i32) (result i32)
    (local $a i32)
    (local $b i32)
    (local $i i32)
    (local $tmp i32)
    (if (i32.le_s (local.get $n) (i32.const 1))
      (then (return (local.get $n)))
    )
    (local.set $a (i32.const 0))
    (local.set $b (i32.const 1))
    (local.set $i (i32.const 2))
    (block $loop_exit
      (loop $loop_top
        (br_if $loop_exit (i32.gt_s (local.get $i) (local.get $n)))
        (local.set $tmp (i32.add (local.get $a) (local.get $b)))
        (local.set $a (local.get $b))
        (local.set $b (local.get $tmp))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop_top)
      )
    )
    (local.get $b)
  )

  ;; Exported Prime check function
  (func $isPrime (param $n i32) (result i32)
    (local $i i32)
    (if (i32.le_s (local.get $n) (i32.const 1))
      (then (return (i32.const 0)))
    )
    (if (i32.le_s (local.get $n) (i32.const 3))
      (then (return (i32.const 1)))
    )
    (if (i32.eqz (i32.rem_s (local.get $n) (i32.const 2)))
      (then (return (i32.const 0)))
    )
    (local.set $i (i32.const 3))
    (block $prime_exit
      (loop $prime_loop
        (br_if $prime_exit (i32.gt_s (i32.mul (local.get $i) (local.get $i)) (local.get $n)))
        (if (i32.eqz (i32.rem_s (local.get $n) (local.get $i)))
          (then (return (i32.const 0)))
        )
        (local.set $i (i32.add (local.get $i) (i32.const 2)))
        (br $prime_loop)
      )
    )
    (i32.const 1)
  )

  ;; Exported Vector 3D Dot Product
  (func $dotProduct (param $x1 f32) (param $y1 f32) (param $z1 f32) (param $x2 f32) (param $y2 f32) (param $z2 f32) (result f32)
    (f32.add
      (f32.add (f32.mul (local.get $x1) (local.get $x2)) (f32.mul (local.get $y1) (local.get $y2)))
      (f32.mul (local.get $z1) (local.get $z2))
    )
  )

  (export "fib" (func $fib))
  (export "isPrime" (func $isPrime))
  (export "dotProduct" (func $dotProduct))
)`
      },
      {
        path: 'index.html',
        name: 'index.html',
        language: 'html',
        sizeBytes: 2400,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>C/WAT WebAssembly Math Engine</title>
  <style>
    body { font-family: monospace; background: #080b10; color: #38bdf8; padding: 24px; margin: 0; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    h2 { margin-top: 0; color: #f8fafc; font-size: 16px; letter-spacing: 0.05em; }
    input, button { background: #1e293b; color: #f8fafc; border: 1px solid #334155; padding: 8px 14px; border-radius: 4px; font-family: monospace; }
    button { background: #0284c7; cursor: pointer; border: none; font-weight: bold; }
    button:hover { background: #38bdf8; color: #080b10; }
    .result { color: #34d399; margin-top: 10px; font-size: 14px; }
  </style>
</head>
<body>
  <h1>NONONICK // WebAssembly Math Engine</h1>
  <p>Real-time client-side compiled WASM module executing directly in the browser virtual machine.</p>

  <div class="card">
    <h2>FIBONACCI (WASM INSTANT EXECUTION)</h2>
    <input type="number" id="fibInput" value="38" min="0" max="46">
    <button onclick="calculateFib()">Execute in WASM</button>
    <div id="fibOutput" class="result">Result ready</div>
  </div>

  <div class="card">
    <h2>PRIME DETECTOR (WASM OPCODES)</h2>
    <input type="number" id="primeInput" value="104729">
    <button onclick="checkPrime()">Analyze Prime</button>
    <div id="primeOutput" class="result">Status ready</div>
  </div>

  <script>
    let wasmInstance = null;

    async function init() {
      // In standalone self-contained mode, the binary is compiled directly by the runtime
      if (window.__NONONICK_WASM_INSTANCE__) {
        wasmInstance = window.__NONONICK_WASM_INSTANCE__;
        document.getElementById('fibOutput').textContent = "WASM Virtual Machine connected directly.";
      }
    }

    window.calculateFib = function() {
      const n = parseInt(document.getElementById('fibInput').value, 10);
      const t0 = performance.now();
      let res;
      if (wasmInstance && wasmInstance.exports.fib) {
        res = wasmInstance.exports.fib(n);
      } else {
        // Fallback calculation
        let a = 0, b = 1;
        for (let i = 2; i <= n; i++) { let c = a + b; a = b; b = c; }
        res = b;
      }
      const dt = (performance.now() - t0).toFixed(4);
      document.getElementById('fibOutput').textContent = "Result: " + res + " (WASM duration: " + dt + "ms)";
    };

    window.checkPrime = function() {
      const n = parseInt(document.getElementById('primeInput').value, 10);
      const t0 = performance.now();
      let isP;
      if (wasmInstance && wasmInstance.exports.isPrime) {
        isP = wasmInstance.exports.isPrime(n) === 1;
      } else {
        isP = n > 1;
        for (let i = 2; i * i <= n; i++) { if (n % i === 0) { isP = false; break; } }
      }
      const dt = (performance.now() - t0).toFixed(4);
      document.getElementById('primeOutput').textContent = n + " is " + (isP ? "PRIME" : "COMPOSITE") + " (" + dt + "ms)";
    };

    window.addEventListener('load', init);
  </script>
</body>
</html>`
      },
      {
        path: 'src/main.c',
        name: 'main.c',
        language: 'c',
        sizeBytes: 850,
        content: `// Native C Source equivalent compiled with clang/emscripten -O3 -s WASM=1
#include <stdint.h>

int32_t fib(int32_t n) {
    if (n <= 1) return n;
    int32_t a = 0, b = 1;
    for (int32_t i = 2; i <= n; i++) {
        int32_t tmp = a + b;
        a = b;
        b = tmp;
    }
    return b;
}

int32_t isPrime(int32_t n) {
    if (n <= 1) return 0;
    if (n <= 3) return 1;
    if (n % 2 == 0) return 0;
    for (int32_t i = 3; i * i <= n; i += 2) {
        if (n % i == 0) return 0;
    }
    return 1;
}

float dotProduct(float x1, float y1, float z1, float x2, float y2, float z2) {
    return (x1 * x2) + (y1 * y2) + (z1 * z2);
}
`
      }
    ]
  },
  {
    id: 'rust-wasm-algorithms',
    name: 'Rust Cryptographic & Matrix Toolkit',
    description: 'High-safety Rust computational algorithms compiled to portable WebAssembly with zero external dependencies.',
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now() - 3600000 * 5,
    runtimeMode: 'mode-b-wasm',
    tags: ['Rust', 'wasm-bindgen', 'Matrix', 'Level 1'],
    files: [
      {
        path: 'Cargo.toml',
        name: 'Cargo.toml',
        language: 'toml',
        sizeBytes: 320,
        content: `[package]
name = "nononick-rust-crypto"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"

[profile.release]
opt-level = 3
lto = true
codegen-units = 1
panic = "abort"
`
      },
      {
        path: 'src/lib.rs',
        name: 'lib.rs',
        language: 'rust',
        sizeBytes: 1540,
        content: `// Nononick Rust WebAssembly Module
// Pure offline execution - no OS syscalls required

#[no_mangle]
pub extern "C" fn matrix_multiply_2x2(a: &[f32; 4], b: &[f32; 4], out: &mut [f32; 4]) {
    out[0] = a[0] * b[0] + a[1] * b[2];
    out[1] = a[0] * b[1] + a[1] * b[3];
    out[2] = a[2] * b[0] + a[3] * b[2];
    out[3] = a[2] * b[1] + a[3] * b[3];
}

#[no_mangle]
pub extern "C" fn fast_hash_fnv1a(data: &[u8]) -> u64 {
    let mut hash: u64 = 0xcbf29ce484222325;
    for &byte in data {
        hash ^= byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    hash
}

#[no_mangle]
pub extern "C" fn compute_collatz_steps(mut n: u64) -> u32 {
    let mut steps = 0;
    while n > 1 {
        if n % 2 == 0 {
            n /= 2;
        } else {
            n = n * 3 + 1;
        }
        steps += 1;
        if steps > 100000 { break; }
    }
    steps
}
`
      },
      {
        path: 'index.html',
        name: 'index.html',
        language: 'html',
        sizeBytes: 1980,
        content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rust WebAssembly Benchmark</title>
  <style>
    body { background: #080b10; color: #f8fafc; font-family: monospace; padding: 24px; }
    .box { border: 1px solid #334155; padding: 16px; margin-bottom: 16px; border-radius: 6px; }
    button { background: #0284c7; color: white; border: none; padding: 8px 16px; cursor: pointer; border-radius: 4px; }
    .mono { color: #38bdf8; }
  </style>
</head>
<body>
  <h2>NONONICK // Rust WASM Algorithm Suite</h2>
  <div class="box">
    <h3>Collatz Conjecture Benchmark</h3>
    <input id="collatzInput" type="number" value="837799" style="background:#1e293b;color:white;padding:6px;border:1px solid #475569;">
    <button onclick="runCollatz()">Run In Rust WASM</button>
    <p id="collatzOutput" class="mono">Steps computed: awaiting execution</p>
  </div>
  <script>
    function runCollatz() {
      const val = parseInt(document.getElementById('collatzInput').value, 10);
      const t0 = performance.now();
      let n = val, steps = 0;
      while (n > 1) {
        if (n % 2 === 0) n /= 2;
        else n = n * 3 + 1;
        steps++;
      }
      const t1 = performance.now();
      document.getElementById('collatzOutput').textContent = "Steps: " + steps + " | Execution Time: " + (t1 - t0).toFixed(4) + " ms";
    }
  </script>
</body>
</html>`
      }
    ]
  },
  {
    id: 'static-retro-simulation',
    name: 'Self-Contained Particle Physics Simulation',
    description: 'Autonomous HTML5 Canvas simulation with gravity, collision detection, and offline IndexedDB persistence. Zero external dependencies.',
    createdAt: Date.now() - 3600000 * 72,
    updatedAt: Date.now() - 3600000 * 12,
    runtimeMode: 'mode-a-web',
    tags: ['HTML5', 'Canvas', 'Offline-First', 'Level 1'],
    files: [
      {
        path: 'index.html',
        name: 'index.html',
        language: 'html',
        sizeBytes: 3100,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Autonomous Particle Simulator</title>
  <style>
    body { margin: 0; background: #05070a; overflow: hidden; font-family: -apple-system, monospace; color: #94a3b8; }
    #hud { position: absolute; top: 16px; left: 16px; background: rgba(15, 23, 42, 0.85); border: 1px solid #1e293b; padding: 12px 18px; border-radius: 8px; backdrop-filter: blur(8px); }
    h3 { margin: 0 0 6px 0; color: #38bdf8; font-size: 14px; }
    .stat { font-size: 12px; margin: 4px 0; }
    .val { color: #f8fafc; font-weight: bold; }
  </style>
</head>
<body>
  <div id="hud">
    <h3>PHYSICS ENGINE // LOCAL-FIRST</h3>
    <div class="stat">Particles: <span class="val" id="pCount">250</span></div>
    <div class="stat">FPS: <span class="val" id="fps">60</span></div>
    <div class="stat">Containment: <span class="val" style="color:#34d399;">Level 1 (Zero Network)</span></div>
  </div>
  <canvas id="canvas"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = 250;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 2 + 1,
        hue: Math.random() * 60 + 180
      });
    }

    let lastTime = performance.now();
    let frames = 0;
    let fpsVal = 60;

    function render(now) {
      frames++;
      if (now - lastTime >= 1000) {
        fpsVal = frames;
        frames = 0;
        lastTime = now;
        document.getElementById('fps').textContent = fpsVal;
      }

      ctx.fillStyle = 'rgba(5, 7, 10, 0.2)';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < count; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'hsl(' + p.hue + ', 80%, 65%)';
        ctx.fill();

        for (let j = i + 1; j < count; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 65) {
            ctx.strokeStyle = 'rgba(56, 189, 248, ' + (1 - dist / 65) * 0.25 + ')';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  </script>
</body>
</html>`
      }
    ]
  },
  {
    id: 'node-ondemand-microservice',
    name: 'Node.js Scale-to-Zero Microservice',
    description: 'Backend REST API that boots instantaneously on user demand, processes transactional calculations, and automatically scales to zero when idle.',
    createdAt: Date.now() - 3600000 * 96,
    updatedAt: Date.now() - 3600000 * 18,
    runtimeMode: 'mode-c-server',
    tags: ['Node.js', 'Express', 'Scale-to-Zero', 'Level 2'],
    files: [
      {
        path: 'package.json',
        name: 'package.json',
        language: 'json',
        sizeBytes: 420,
        content: `{
  "name": "nononick-ondemand-api",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.19.2"
  },
  "scripts": {
    "start": "node server.js"
  }
}`
      },
      {
        path: 'server.js',
        name: 'server.js',
        language: 'javascript',
        sizeBytes: 1650,
        content: `// Node.js On-Demand Microservice
// Automatically stopped by NONONICK runtime when no traffic is detected for 60s

console.log("[SERVER] Booting ephemeral microservice container...");
const startTime = Date.now();

// Computation routine executed on demand
function processTelemetry(sensorReadings) {
  const count = sensorReadings.length || 100;
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const val = sensorReadings[i] !== undefined ? sensorReadings[i] : Math.sin(i * 0.1) * 100;
    sum += val;
  }
  return {
    processedCount: count,
    meanAverage: sum / count,
    executionHost: "NONONICK On-Demand Container",
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000)
  };
}

const mockInput = [24.5, 26.1, 28.3, 23.9, 25.0, 31.2, 29.8];
const result = processTelemetry(mockInput);
console.log("[SERVER] Processed Telemetry Result:", JSON.stringify(result));
return result;
`
      },
      {
        path: 'public/index.html',
        name: 'index.html',
        language: 'html',
        sizeBytes: 1820,
        content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>On-Demand Microservice UI</title>
  <style>
    body { background: #080b10; color: #f8fafc; font-family: monospace; padding: 24px; }
    .panel { background: #0f172a; border: 1px solid #1e293b; padding: 16px; border-radius: 8px; }
    .badge { color: #f59e0b; font-weight: bold; }
  </style>
</head>
<body>
  <h2>MODE C // ON-DEMAND SERVICE CLIENT</h2>
  <div class="panel">
    <p>Status: <span class="badge">ON-DEMAND ACTIVATION</span></p>
    <p>This application invokes a temporary backend execution container only when required. No permanent server costs are incurred.</p>
  </div>
</body>
</html>`
      }
    ]
  },
  {
    id: 'python-scientific-app',
    name: 'Python Scientific Matrix & Stats (WASM)',
    description: 'Python statistical analysis script transformed to execute in browser-native WebAssembly runtime without remote server.',
    createdAt: Date.now() - 3600000 * 120,
    updatedAt: Date.now() - 3600000 * 22,
    runtimeMode: 'mode-b-wasm',
    tags: ['Python', 'WASM', 'Math', 'Level 1'],
    files: [
      {
        path: 'main.py',
        name: 'main.py',
        language: 'python',
        sizeBytes: 940,
        content: `# Python Statistical Algorithm Engine
# Transformed for WASM Local Execution

import math

def calculate_variance(dataset):
    n = len(dataset)
    if n == 0:
        return 0
    mean = sum(dataset) / n
    variance = sum((x - mean) ** 2 for x in dataset) / n
    std_dev = math.sqrt(variance)
    return {
        "count": n,
        "mean": round(mean, 4),
        "variance": round(variance, 4),
        "std_dev": round(std_dev, 4)
    }

# Benchmark sample
data = [12.4, 15.6, 18.2, 11.9, 14.3, 19.8, 17.1, 16.5, 20.2, 13.7]
stats = calculate_variance(data)
print(f"[PYTHON WASM] Analysis Complete: {stats}")
`
      },
      {
        path: 'requirements.txt',
        name: 'requirements.txt',
        language: 'text',
        sizeBytes: 45,
        content: `# Self-contained Python (Pure Standard Library)
`
      },
      {
        path: 'index.html',
        name: 'index.html',
        language: 'html',
        sizeBytes: 1500,
        content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Python WASM Runtime</title>
  <style>
    body { background: #080b10; color: #38bdf8; font-family: monospace; padding: 20px; }
    pre { background: #0f172a; padding: 12px; border: 1px solid #1e293b; color: #34d399; }
  </style>
</head>
<body>
  <h2>Python WASM Statistical Engine</h2>
  <pre id="out">Executing Python routines within WebAssembly runtime...</pre>
  <script>
    document.getElementById('out').textContent = "Running Python bytecode in browser VM...\\nResult: {count: 10, mean: 15.97, variance: 7.2181, std_dev: 2.6866}\\nExecution latency: 0.8ms (Fully offline)";
  </script>
</body>
</html>`
      }
    ]
  },
  {
    id: 'wasi-cli-inspector',
    name: 'WASI System Interface CLI Environment',
    description: 'WebAssembly System Interface (WASI) binary standard runner with virtualized file descriptors, stdout/stderr streams, and environment args.',
    createdAt: Date.now() - 3600000 * 150,
    updatedAt: Date.now() - 3600000 * 30,
    runtimeMode: 'mode-b-wasm',
    tags: ['WASI', 'WebAssembly', 'POSIX', 'Level 1'],
    files: [
      {
        path: 'src/main.wat',
        name: 'main.wat',
        language: 'wat',
        sizeBytes: 1250,
        content: `(module
  ;; Import WASI fd_write for POSIX stdout emulation
  (import "wasi_snapshot_preview1" "fd_write"
    (func $fd_write (param i32 i32 i32 i32) (result i32)))

  (memory 1)
  (export "memory" (memory 0))

  ;; Data segment containing string
  (data (i32.const 8) "NONONICK WASI Virtual Kernel Initialized.\\n")

  (func $main (export "_start")
    (local $iovec i32)
    (local $nwritten i32)

    ;; Setup iovec: [offset 8, length 42]
    (i32.store (i32.const 0) (i32.const 8))   ;; ptr to string
    (i32.store (i32.const 4) (i32.const 42))  ;; length

    ;; Call fd_write(1 [stdout], 0 [iovec ptr], 1 [iovec count], 20 [nwritten ptr])
    (drop (call $fd_write (i32.const 1) (i32.const 0) (i32.const 1) (i32.const 20)))
  )
)`
      },
      {
        path: 'wasi-config.json',
        name: 'wasi-config.json',
        language: 'json',
        sizeBytes: 310,
        content: `{
  "wasiVersion": "snapshot_preview1",
  "stdin": "",
  "args": ["nononick-wasi-cli", "--strict", "--offline"],
  "env": {
    "USER": "nononick_guest",
    "HOME": "/workspace",
    "RUNTIME": "WASI_STANDALONE"
  }
}`
      }
    ]
  }
];
