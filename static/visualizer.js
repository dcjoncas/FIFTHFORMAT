/* ============================================================
   FIFTH FORMAT – VISUAL ENGINE (Canvas Edition v2)
   10 Visual Modes • Palettes • Bloom • Drift • Reactive Boost
============================================================ */

window.addEventListener("DOMContentLoaded", () => {

const canvas = document.getElementById("ff-visualizer");
const ctx = canvas.getContext("2d");

let w, h;
function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// AUDIO SETUP =================================================
let audio = document.getElementById("exp-audio");
let audioCtx = null;
let analyser = null;
let freq = null;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new AudioContext();
  const src = audioCtx.createMediaElementSource(audio);

  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  freq = new Uint8Array(analyser.frequencyBinCount);

  src.connect(analyser);
  analyser.connect(audioCtx.destination);
}

audio.addEventListener("play", initAudio);

/* ============================================================
   COLOR PALETTES
============================================================ */
const palettes = [
  ["#0ea5e9", "#38bdf8", "#60a5fa"],
  ["#a855f7", "#d946ef", "#f472b6"],
  ["#1e3a8a", "#3b82f6", "#06b6d4"],
  ["#ec4899", "#f59e0b", "#f43f5e"],
  ["#14b8a6", "#a3e635", "#06d6a0"],
  ["#f97316", "#ef4444", "#eab308"],
  ["#7dd3fc", "#0ea5e9", "#0284c7"],
  ["#f87171", "#fb923c", "#facc15"]
];
let paletteIndex = 0;

document.querySelectorAll(".palette-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    paletteIndex = Number(btn.dataset.p);
  });
});

/* ============================================================
   VISUAL MODE HANDLING
============================================================ */
let mode = "swirl";
let targetMode = mode;
let transition = 0;
let transitioning = false;

const visualSelect = document.getElementById("visual-mode");
visualSelect.addEventListener("change", () => {
  targetMode = visualSelect.value;
  beginTransition();
});

function beginTransition() {
  transition = 0;
  transitioning = true;
}

/* ============================================================
   TOGGLES
============================================================ */
let autoCycle = false;
let hypnotic = false;
let reactive = false;

document.getElementById("auto-cycle").addEventListener("change", e => {
  autoCycle = e.target.checked;
});
document.getElementById("hypnotic").addEventListener("change", e => {
  hypnotic = e.target.checked;
});
document.getElementById("reactive").addEventListener("change", e => {
  reactive = e.target.checked;
});

/* ============================================================
   AUTO CYCLE
============================================================ */
setInterval(() => {
  if (!autoCycle) return;

  const modes = [
    "swirl","nebula","rings","particles","grid",
    "vortex","fractal","aurora","rain","matrix"
  ];

  let idx = modes.indexOf(mode);
  idx = (idx + 1) % modes.length;

  visualSelect.value = modes[idx];
  targetMode = modes[idx];
  beginTransition();
}, 20000);

/* ============================================================
   CAMERA
============================================================ */
let t = 0;
let cameraShake = 0;
let driftOffsetX = 0;
let driftOffsetY = 0;

function addShake(strength) {
  cameraShake = strength;
}

function updateCamera() {
  if (hypnotic) {
    driftOffsetX = Math.sin(t * 0.002) * 40;
    driftOffsetY = Math.cos(t * 0.002) * 40;
  } else {
    driftOffsetX = 0;
    driftOffsetY = 0;
  }

  cameraShake *= 0.9;

  let sx = driftOffsetX + (Math.random() - 0.5) * cameraShake;
  let sy = driftOffsetY + (Math.random() - 0.5) * cameraShake;

  ctx.translate(sx, sy);
}

/* ============================================================
   UTILITY
============================================================ */
function avgVolume(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i];
  return sum / arr.length;
}



/* ============================================================
   VISUAL MODES (10)
============================================================ */

/* 1. Swirl Burst v2 */
function swirl() {
  const cx = w / 2;
  const cy = h / 2;

  for (let i = 0; i < 160; i++) {
    const ang = (i / 160) * Math.PI * 2 + t * 0.015;
    const vol = freq[i % freq.length] / 255;
    const r = 80 + vol * 260;

    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;

    ctx.strokeStyle = palettes[paletteIndex][i % 3];
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

/* 2. Nebula Waves v4 – softer & bigger "ocean hair" */
function nebula() {
  const lineGap = 115;           // fewer lines = clearer, bigger strands
  const maxAmp = 1170;           // bigger vertical motion

  ctx.lineWidth = 1.8;
  ctx.globalAlpha = 10.6;       // softer, more ethereal

  for (let y = 0; y < h; y += lineGap) {
    const audioVal = freq[Math.floor((y / 2) % freq.length)] / 255;
    const amp = maxAmp * (0.35 + audioVal * 0.9); // more energy = taller, but always flowing

    ctx.strokeStyle = palettes[paletteIndex][(y >> 3) % 3];

    ctx.beginPath();

    for (let x = 0; x <= w + 60; x += 8) {
      // Slower, smoother waves (less "sharp" frequency)
      const wave1 = Math.sin(x * 0.01 + t * 0.015 + y * 0.004) * amp * 10.75;
      const wave2 = Math.sin(x * 0.02 - t * 0.01  + y * 0.008) * amp * 10.25;

      const yy = y + wave1 + wave2;

      if (x === 0) {
        ctx.moveTo(x - 30, yy);
      } else {
        ctx.lineTo(x, yy);
      }
    }

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}



/* 3. Pulse Rings v2 */
function rings() {
  const cx = w / 2;
  const cy = h / 2;

  const base = avgVolume(freq);
  const baseR = 80 + base * 0.9;

  for (let i = 0; i < 6; i++) {
    const r = baseR + i * 35 + Math.sin(t * 0.02 + i) * 10;
    ctx.strokeStyle = palettes[paletteIndex][i % 3];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/* 4. Particle Field v2 */
let particles = [];
for (let i = 0; i < 250; i++) {
  particles.push({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8
  });
}

function particlesMode() {
  const boost = avgVolume(freq) / 255;

  particles.forEach(p => {
    p.x += p.vx * (reactive ? boost * 8 : 1);
    p.y += p.vy * (reactive ? boost * 8 : 1);

    if (p.x < 0) p.x = w;
    if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h;
    if (p.y > h) p.y = 0;

    ctx.fillStyle = palettes[paletteIndex][Math.floor(Math.random() * 3)];
    ctx.fillRect(p.x, p.y, 2.2, 2.2);
  });
}

/* 5. Laser Grid v2 */
function grid() {
  const base = avgVolume(freq) / 255;
  const spacing = 50 + Math.sin(t * 0.01) * 10 + base * 40;

  for (let x = 0; x < w; x += spacing) {
    ctx.strokeStyle = palettes[paletteIndex][0];
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += spacing) {
    ctx.strokeStyle = palettes[paletteIndex][1];
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

/* 6. Energy Vortex v2 */
function vortex() {
  const cx = w / 2;
  const cy = h / 2;

  for (let i = 0; i < 220; i++) {
    const ang = (i / 220) * Math.PI * 2 + t * 0.02;
    const r = 50 + Math.sin(t * 0.015 + i * 0.05) * 40 + (freq[i % freq.length] / 255) * 120;
    ctx.fillStyle = palettes[paletteIndex][i % 3];
    ctx.beginPath();
    ctx.arc(cx + Math.cos(ang)*r, cy + Math.sin(ang)*r, 2, 0, Math.PI*2);
    ctx.fill();
  }
}

/* 7. Fractal Bloom (Canvas Only) */
function fractal() {
  const base = avgVolume(freq) / 255;
  for (let i = 0; i < 90; i++) {
    const x = (Math.sin(i * 0.15 + t * 0.02) * 0.5 + 0.5) * w;
    const y = (Math.cos(i * 0.12 + t * 0.015) * 0.5 + 0.5) * h;
    ctx.fillStyle = palettes[paletteIndex][i % 3];
    ctx.globalAlpha = 0.12 + base * 0.4;
    ctx.beginPath();
    ctx.arc(x, y, 50 + base * 200, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/* 8. Aurora Drift */
function aurora() {
  for (let x = 0; x < w; x += 6) {
    const v = freq[(x >> 2) % freq.length] / 255;
    const y = h/2 + Math.sin(t*0.015 + x*0.01) * 120 * v;
    ctx.fillStyle = palettes[paletteIndex][(x >> 3) % 3];
    ctx.fillRect(x, y, 4, 240 * v);
  }
}

/* 9. Rainfall Lines */
function rain() {
  for (let x = 0; x < w; x += 10) {
    const speed = (freq[(x >> 2) % freq.length] / 255) * 10 + 4;
    const y = (t * speed) % h;
    ctx.strokeStyle = palettes[paletteIndex][x % 3];
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 30);
    ctx.stroke();
  }
}

/* 10. Matrix Dust */
let matrixDrops = [];
for (let i = 0; i < 200; i++)
  matrixDrops.push({ x: Math.random()*w, y: Math.random()*h });

function matrix() {
  const base = avgVolume(freq) / 255;

  matrixDrops.forEach(d => {
    d.y += (4 + base * 20);
    if (d.y > h) {
      d.y = 0;
      d.x = Math.random() * w;
    }
    ctx.fillStyle = palettes[paletteIndex][Math.floor(Math.random()*3)];
    ctx.fillRect(d.x, d.y, 3, 12);
  });
}

/* ============================================================
   MAIN LOOP
============================================================ */
function render() {
  requestAnimationFrame(render);

  if (!analyser) return;

  analyser.getByteFrequencyData(freq);
  const volume = avgVolume(freq);

  if (reactive && volume > 200) addShake(20);

  ctx.fillStyle = hypnotic
    ? "rgba(0,0,0,0.08)"
    : "rgba(0,0,0,0.22)";
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  updateCamera();

  if (transitioning) {
    transition += 0.03;
    if (transition >= 1) {
      mode = targetMode;
      transitioning = false;
    }
  }

  ctx.globalAlpha = transitioning ? 1 - transition : 1;
  drawMode(mode);

  if (transitioning) {
    ctx.globalAlpha = transition;
    drawMode(targetMode);
  }

  ctx.restore();

  t += 1;
}

function drawMode(m) {
  switch(m) {
    case "swirl": swirl(); break;
    case "nebula": nebula(); break;
    case "rings": rings(); break;
    case "particles": particlesMode(); break;
    case "grid": grid(); break;
    case "vortex": vortex(); break;
    case "fractal": fractal(); break;
    case "aurora": aurora(); break;
    case "rain": rain(); break;
    case "matrix": matrix(); break;
  }
}

render();

}); // END DOMContentLoaded WRAPPER
