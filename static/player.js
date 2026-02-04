// player.js
import { LyricSync } from "./lyricsync.js";

const audio = document.getElementById("exp-audio");
const stage = document.getElementById("lyric-stage");
const circle = document.getElementById("ff-logo-circle");

let lyrics = [];
let orbs = [];
let sync = null;
let currentIndex = -1;

// ------------------------
// Lyrics helpers
// ------------------------
async function loadLyricsText(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch lyrics: ${res.status}`);
  }
  const txt = await res.text();
  return txt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function showMessage(msg) {
  if (!stage) return;
  stage.innerHTML = "";
  const field = document.createElement("div");
  field.id = "lyrics-field";
  stage.appendChild(field);

  const div = document.createElement("div");
  div.className = "lyric-orb current";
  div.style.left = "50%";
  div.style.top = "50%";
  div.style.transform = "translate(-50%, -50%)";
  div.style.animation = "none";
  div.textContent = msg;
  field.appendChild(div);

  orbs = [div];
  currentIndex = 0;
}

function buildOrbs() {
  if (!stage) return;
  stage.innerHTML = "";

  const field = document.createElement("div");
  field.id = "lyrics-field";
  stage.appendChild(field);

  const palette = [
    {
      color: "#7dd3fc",
      glow:
        "0 0 10px rgba(125,211,252,0.9), 0 0 26px rgba(37,99,235,0.9), 0 0 42px rgba(15,23,42,1)"
    },
    {
      color: "#a5b4fc",
      glow:
        "0 0 10px rgba(165,180,252,0.9), 0 0 26px rgba(79,70,229,0.95), 0 0 42px rgba(15,23,42,1)"
    },
    {
      color: "#f9a8d4",
      glow:
        "0 0 10px rgba(249,168,212,0.95), 0 0 28px rgba(236,72,153,0.95), 0 0 46px rgba(15,23,42,1)"
    },
    {
      color: "#6ee7b7",
      glow:
        "0 0 10px rgba(110,231,183,0.9), 0 0 26px rgba(22,163,74,0.95), 0 0 40px rgba(15,23,42,1)"
    },
    {
      color: "#fde68a",
      glow:
        "0 0 10px rgba(253,230,138,0.9), 0 0 26px rgba(234,179,8,0.9), 0 0 40px rgba(15,23,42,1)"
    }
  ];

  orbs = lyrics.map((line, idx) => {
    const orb = document.createElement("div");
    orb.className = "lyric-orb";
    orb.textContent = line;

    // Random position
    const x = 15 + Math.random() * 10; // 15–85%
    const y = 10 + Math.random() * 10; // 10–90%
    orb.style.left = `${x}%`;
    orb.style.top = `${y}%`;

    // Random drift timing
    const dur = 9 + Math.random() * 9; // 9–19s
    const delay = -Math.random() * dur; // negative so phases are offset
    orb.style.animationDuration = `${dur.toFixed(2)}s`;
    orb.style.animationDelay = `${delay.toFixed(2)}s`;

    // Color palette
    const swatch = palette[idx % palette.length];
    orb.style.color = swatch.color;
    orb.style.textShadow = swatch.glow;

    field.appendChild(orb);
    return orb;
  });

  currentIndex = -1;
}

function showLine(index) {
  if (!orbs.length) return;

  // Clear highlight if out of range
  if (index < 0 || index >= orbs.length) {
    if (currentIndex >= 0 && currentIndex < orbs.length) {
      orbs[currentIndex].classList.remove("current");
    }
    currentIndex = -1;
    return;
  }

  if (index === currentIndex) return;

  if (currentIndex >= 0 && currentIndex < orbs.length) {
    orbs[currentIndex].classList.remove("current");
  }

  orbs[index].classList.add("current");
  currentIndex = index;
}

async function initLyrics() {
  if (!audio || !stage) return;

  const url = window.lyricsUrl;
  if (!url) {
    showMessage("No lyrics configured for this Experience.");
    return;
  }

  try {
    lyrics = await loadLyricsText(url);

    if (!lyrics.length) {
      showMessage("No lyrics found.");
      return;
    }

    buildOrbs();

    sync = new LyricSync(audio, lyrics, showLine);
    await sync.init();
    sync.update();
  } catch (err) {
    console.error("Failed to init lyrics:", err);
    showMessage("Unable to load lyrics.");
  }
}

// ------------------------
// Audio → lyric sync wiring
// ------------------------
if (audio) {
  audio.addEventListener("timeupdate", () => {
    if (sync) sync.update();
  });

  audio.addEventListener("seeked", () => {
    if (sync) sync.update();
  });

  audio.addEventListener("play", () => {
    if (sync) sync.update();
    if (circle) circle.classList.add("is-playing");
  });

  audio.addEventListener("pause", () => {
    if (circle) circle.classList.remove("is-playing");
  });

  audio.addEventListener("loadedmetadata", () => {
    if (sync) sync.update();
  });

  audio.addEventListener("ended", () => {
    if (sync) sync.update();
    if (circle) circle.classList.remove("is-playing");
  });
}

initLyrics();

// ------------------------
// Logo circle controls
// ------------------------
function attachCircleControls() {
  if (!audio || !circle) return;

  const sectors = circle.querySelectorAll("[data-action]");
  if (!sectors.length) return;

  sectors.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = e.currentTarget.dataset.action;

      if (action === "play") {
        if (audio.paused) {
          audio
            .play()
            .then(() => circle.classList.add("is-playing"))
            .catch((err) => console.error("Audio play failed:", err));
        } else {
          audio.pause();
          circle.classList.remove("is-playing");
        }
      } else if (action === "ffwd") {
        const jump = 10;
        if (Number.isFinite(audio.duration)) {
          audio.currentTime = Math.min(
            audio.duration,
            audio.currentTime + jump
          );
        } else {
          audio.currentTime += jump;
        }
      } else if (action === "rew") {
        const jump = 10;
        audio.currentTime = Math.max(0, audio.currentTime - jump);
      } else if (action === "next") {
        const nextUrl = window.nextExperienceUrl || "/";
        window.location.href = nextUrl;
      }
    });
  });
}

attachCircleControls();
