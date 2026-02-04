// ==========================================================================
// CURRENT SCRIPT – ACTIVE
// Fifth Format: Index + Forge + Packages + Per-artist themes
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // ----------------------------------------------------------
  // MAIN EXPERIENCES PAGE LOGIC (safe if elements missing)
  // ----------------------------------------------------------
  const expCards = Array.from(document.querySelectorAll(".exp-card"));
  const globalAudio = document.getElementById("global-audio");
  const npTitle = document.getElementById("np-title");
  const npSub = document.getElementById("np-sub");
  const npPlay = document.getElementById("np-play");
  const npStop = document.getElementById("np-stop");
  const heroPlayFirst = document.getElementById("hero-play-first");

  const expDetail = document.getElementById("exp-detail");
  const expDetailTitle = document.getElementById("exp-detail-title");
  const expDetailId = document.getElementById("exp-detail-id");
  const expDetailAuthor = document.getElementById("exp-detail-author");
  const expDetailVoice = document.getElementById("exp-detail-voice");
  const expDetailVibe = document.getElementById("exp-detail-vibe");
  const expDetailClose = document.getElementById("exp-detail-close");
  const expDetailPlay = document.getElementById("exp-detail-play");
  const progressRing = document.getElementById("exp-progress-ring");
  const lyricsContainer = document.getElementById("exp-lyrics");

  const authorFilter = document.getElementById("author-filter");
  const voiceFilter = document.getElementById("voice-filter");
  const searchFilter = document.getElementById("search-filter");

  let currentSrc = null;
  let currentCard = null;
  let currentLyrics = [];
  let currentLyricsIndex = 0;

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (ch) => {
      switch (ch) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#39;";
        default:
          return ch;
      }
    });
  }

  function setNowPlaying(card) {
    if (!globalAudio || !npTitle || !npSub) return;
    const title = card.dataset.title;
    const id = card.dataset.id;
    const author = card.dataset.author;
    const voice = card.dataset.voice;
    const src = card.dataset.src;

    if (currentSrc !== src) {
      globalAudio.src = src;
      currentSrc = src;
    }

    npTitle.textContent = title;
    npSub.textContent = `${id} · ${author} · Voice: ${voice}`;
    currentCard = card;
  }

  function openDetail(card) {
    if (!expDetail) return;
    const title = card.dataset.title;
    const id = card.dataset.id;
    const author = card.dataset.author;
    const voice = card.dataset.voice;
    const vibe = card.dataset.vibe;

    if (expDetailTitle) expDetailTitle.textContent = title;
    if (expDetailId) expDetailId.textContent = id;
    if (expDetailAuthor) expDetailAuthor.textContent = `Written by ${author}`;
    if (expDetailVoice) expDetailVoice.textContent = `Voice: ${voice}`;
    if (expDetailVibe) expDetailVibe.textContent = vibe;

    loadLyrics(card);
    expDetail.classList.add("open");
  }

  function closeDetail() {
    if (!expDetail) return;
    expDetail.classList.remove("open");
  }

  function loadLyrics(card) {
    if (!lyricsContainer) return;

    const url = card.dataset.lyrics;
    lyricsContainer.innerHTML =
      '<p class="exp-lyric-placeholder">Loading lyrics…</p>';
    currentLyrics = [];
    currentLyricsIndex = 0;

    if (!url) {
      lyricsContainer.innerHTML =
        '<p class="exp-lyric-placeholder">No lyrics file found for this Experience yet.</p>';
      return;
    }

    fetch(url)
      .then((res) => (res.ok ? res.text() : null))
      .then((text) => {
        if (!text) {
          lyricsContainer.innerHTML =
            '<p class="exp-lyric-placeholder">No lyrics available.</p>';
          return;
        }

        currentLyrics = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (!currentLyrics.length) {
          lyricsContainer.innerHTML =
            '<p class="exp-lyric-placeholder">No lyrics to display.</p>';
          return;
        }

        renderLyricsAtIndex(0);
      })
      .catch(() => {
        lyricsContainer.innerHTML =
          '<p class="exp-lyric-placeholder">Unable to load lyrics.</p>';
      });
  }

  function renderLyricsAtIndex(index) {
    if (!lyricsContainer || !currentLyrics.length) return;

    const total = currentLyrics.length;
    const clamped = Math.max(0, Math.min(total - 1, index));
    currentLyricsIndex = clamped;

    const before = 2;
    const after = 3;
    const start = Math.max(0, clamped - before);
    const end = Math.min(total, clamped + after);

    let html = "";
    for (let i = start; i < end; i++) {
      let cls = "exp-lyric-line";
      if (i < clamped) cls += " past";
      else if (i === clamped) cls += " active";
      else cls += " future";

      html += `<p class="${cls}">${escapeHtml(currentLyrics[i])}</p>`;
    }

    lyricsContainer.innerHTML = html;
  }

  function updateLyricsProgress() {
    if (!globalAudio || !currentLyrics.length || !globalAudio.duration) return;
    const ratio = globalAudio.currentTime / globalAudio.duration;
    const idx = Math.floor(ratio * (currentLyrics.length - 1));
    if (idx !== currentLyricsIndex) {
      renderLyricsAtIndex(idx);
    }
  }

  if (expCards.length && globalAudio && npTitle && npSub) {
    expCards.forEach((card) => {
      const btn = card.querySelector(".play-exp");

      if (btn) {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          setNowPlaying(card);
          openDetail(card);
          globalAudio.play().catch(() => {});
        });
      }

      card.addEventListener("click", () => {
        setNowPlaying(card);
        openDetail(card);
      });
    });

    if (heroPlayFirst && expCards.length) {
      heroPlayFirst.addEventListener("click", () => {
        const firstVisible =
          expCards.find((c) => c.style.display !== "none") || expCards[0];
        setNowPlaying(firstVisible);
        openDetail(firstVisible);
        globalAudio.play().catch(() => {});
      });
    }

    if (npPlay) {
      npPlay.addEventListener("click", () => {
        if (!currentSrc && currentCard) {
          setNowPlaying(currentCard);
        }
        if (!currentSrc) return;

        if (globalAudio.paused) {
          globalAudio.play().catch(() => {});
        } else {
          globalAudio.pause();
        }
      });
    }

    if (npStop) {
      npStop.addEventListener("click", () => {
        if (!currentSrc) return;
        globalAudio.pause();
        globalAudio.currentTime = 0;
        if (progressRing) {
          progressRing.style.setProperty("--progress", "0deg");
        }
      });
    }

    if (expDetailClose) {
      expDetailClose.addEventListener("click", () => {
        closeDetail();
      });
    }

    if (expDetail) {
      expDetail.addEventListener("click", (e) => {
        if (e.target === expDetail) {
          closeDetail();
        }
      });
    }

    if (expDetailPlay) {
      expDetailPlay.addEventListener("click", () => {
        if (!currentSrc && currentCard) {
          setNowPlaying(currentCard);
        }
        if (!currentSrc) return;

        if (globalAudio.paused) {
          globalAudio.play().catch(() => {});
        } else {
          globalAudio.pause();
        }
      });
    }

    if (globalAudio) {
      globalAudio.addEventListener("timeupdate", () => {
        if (progressRing && globalAudio.duration) {
          const ratio = globalAudio.currentTime / globalAudio.duration;
          const degrees = Math.min(360, Math.max(0, ratio * 360));
          progressRing.style.setProperty("--progress", `${degrees}deg`);
        }
        updateLyricsProgress();
      });

      globalAudio.addEventListener("ended", () => {
        if (progressRing) {
          progressRing.style.setProperty("--progress", "0deg");
        }
      });
    }

    function applyFilters() {
      if (!authorFilter || !voiceFilter || !searchFilter) return;

      const aVal = authorFilter.value.toLowerCase();
      const vVal = voiceFilter.value.toLowerCase();
      const sVal = searchFilter.value.toLowerCase();

      expCards.forEach((card) => {
        const author = card.dataset.author.toLowerCase();
        const voice = card.dataset.voice.toLowerCase();
        const title = card.dataset.title.toLowerCase();
        const vibe = card.dataset.vibe.toLowerCase();
        const id = card.dataset.id.toLowerCase();

        const matchAuthor = !aVal || author === aVal;
        const matchVoice = !vVal || voice === vVal;
        const matchSearch =
          !sVal ||
          title.includes(sVal) ||
          vibe.includes(sVal) ||
          id.includes(sVal);

        const visible = matchAuthor && matchVoice && matchSearch;
        card.style.display = visible ? "block" : "none";
      });
    }

    if (authorFilter && voiceFilter && searchFilter) {
      authorFilter.addEventListener("change", applyFilters);
      voiceFilter.addEventListener("change", applyFilters);
      searchFilter.addEventListener("input", applyFilters);
      applyFilters();
    }
  }

  // ----------------------------------------------------------
  // FORGE PAGE LOGIC + VISUALIZER
  // ----------------------------------------------------------
  const forgeLayout = document.querySelector(".forge-layout");
  const forgeExportBtn = document.getElementById("forge-export-btn");

  if (forgeLayout) {
    // Toggle tag selection
    const forgeTags = forgeLayout.querySelectorAll(".forge-tag");
    forgeTags.forEach((tag) => {
      tag.addEventListener("click", () => {
        tag.classList.toggle("selected");
        updateVizStateFromUI();
      });
    });

    // Timeline step selection
    const timelineSteps = forgeLayout.querySelectorAll(".forge-timeline-step");
    timelineSteps.forEach((step) => {
      step.addEventListener("click", () => {
        timelineSteps.forEach((s) => s.classList.remove("active"));
        step.classList.add("active");
        updateVizStateFromUI();
      });
    });

    // Visualizer elements
    const canvas = document.getElementById("ff-viz-canvas");
    const ctx = canvas ? canvas.getContext("2d") : null;
    const vizThemeLabel = document.getElementById("viz-theme-label");
    const vizEnergyVal = document.getElementById("viz-energy-val");
    const vizTensionVal = document.getElementById("viz-tension-val");
    const vizWarmthVal = document.getElementById("viz-warmth-val");
    const vizSurrealVal = document.getElementById("viz-surreal-val");

    const bpmEl = document.getElementById("forge-bpm");
    const rhythmEl = document.getElementById("forge-rhythm-density");
    const overallIntensityEl = document.getElementById(
      "forge-overall-intensity"
    );

    const dialInputs = forgeLayout.querySelectorAll("[data-dial]");
    const switchInputs = forgeLayout.querySelectorAll("[data-switch]");
    const instrumentInputs = forgeLayout.querySelectorAll("[data-instrument]");

    const vizState = {
      baseHue: 180,
      baseSat: 0.6,
      baseLight: 0.12,
      energy: 0,
      tension: 0,
      warmth: 0.5,
      surreal: 0,
      bpm: 60,
      rhythmDensity: 0,
      intensity: 0,
      pattern: "Soft intro",
      emotions: [],
      tones: [],
      instruments: [],
      creativeSwitches: {},
      dials: {},
    };

    const particles = [];
    let lastTime = 0;
    let t = 0;

    function hslToRgba(h, s, l, a) {
      let c = (1 - Math.abs(2 * l - 1)) * s;
      let hp = h / 60;
      let x = c * (1 - Math.abs((hp % 2) - 1));
      let r1, g1, b1;
      if (hp >= 0 && hp < 1) {
        [r1, g1, b1] = [c, x, 0];
      } else if (hp >= 1 && hp < 2) {
        [r1, g1, b1] = [x, c, 0];
      } else if (hp >= 2 && hp < 3) {
        [r1, g1, b1] = [0, c, x];
      } else if (hp >= 3 && hp < 4) {
        [r1, g1, b1] = [0, x, c];
      } else if (hp >= 4 && hp < 5) {
        [r1, g1, b1] = [x, 0, c];
      } else {
        [r1, g1, b1] = [c, 0, x];
      }
      const m = l - c / 2;
      const r = Math.round((r1 + m) * 255);
      const g = Math.round((g1 + m) * 255);
      const b = Math.round((b1 + m) * 255);
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    function resizeCanvas() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initParticles() {
      if (!canvas) return;
      particles.length = 0;
      const rect = canvas.getBoundingClientRect();
      const count = 80;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: 1 + Math.random() * 2,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function readSelectedTags(groupName) {
      const group = forgeLayout.querySelector(
        `.forge-group[data-group="${groupName}"]`
      );
      if (!group) return [];
      return Array.from(group.querySelectorAll(".forge-tag.selected")).map(
        (el) => el.textContent.trim()
      );
    }

    function updateVizStateFromUI() {
      vizState.emotions = readSelectedTags("emotions");
      vizState.tones = readSelectedTags("tone");

      vizState.bpm = bpmEl ? Number(bpmEl.value || 60) : 60;
      vizState.rhythmDensity = rhythmEl ? Number(rhythmEl.value || 0) : 0;
      vizState.intensity = overallIntensityEl
        ? Number(overallIntensityEl.value || 0)
        : 0;

      const activePattern = forgeLayout.querySelector(
        ".forge-timeline-step.active"
      );
      vizState.pattern = activePattern
        ? activePattern.textContent.trim()
        : "Soft intro";

      vizState.instruments = [];
      instrumentInputs.forEach((input) => {
        if (input.checked) {
          vizState.instruments.push(input.dataset.instrument);
        }
      });

      vizState.creativeSwitches = {};
      switchInputs.forEach((input) => {
        vizState.creativeSwitches[input.dataset.switch] = !!input.checked;
      });

      vizState.dials = {};
      dialInputs.forEach((input) => {
        vizState.dials[input.dataset.dial] = Number(input.value || 0);
      });

      // Derive base hue from emotions
      const emotionHueMap = {
        Calm: 180,
        Melancholy: 220,
        Hopeful: 120,
        Bittersweet: 35,
        Triumphant: 50,
        Haunted: 260,
        Nostalgic: 30,
        Fragile: 330,
        Angry: 0,
        Euphoric: 300,
        Detached: 210,
        Intimate: 330,
      };

      if (vizState.emotions.length) {
        let sum = 0;
        let count = 0;
        vizState.emotions.forEach((e) => {
          const h = emotionHueMap[e];
          if (typeof h === "number") {
            sum += h;
            count++;
          }
        });
        if (count > 0) {
          vizState.baseHue = sum / count;
        } else {
          vizState.baseHue = 180;
        }
      } else {
        vizState.baseHue = 180;
      }

      // Tone: adjust lightness and saturation
      vizState.baseLight = 0.12;
      vizState.baseSat = 0.6;
      if (vizState.tones.includes("Dark")) {
        vizState.baseLight = 0.09;
      }
      if (vizState.tones.includes("Bright")) {
        vizState.baseLight = 0.18;
      }
      if (vizState.tones.includes("Minimal")) {
        vizState.baseSat = 0.4;
      }
      if (vizState.tones.includes("Cinematic")) {
        vizState.baseSat = 0.8;
      }

      // Derived scalars 0–1
      const intensityN = vizState.intensity / 100;
      const bpmN = (vizState.bpm - 60) / (180 - 60); // 0–1
      const rhythmN = vizState.rhythmDensity / 100;
      const adrenalineN = (vizState.dials.adrenaline || 0) / 100;
      const emotionalLevelN = (vizState.dials.emotional_level || 0) / 100;
      const surrealN = (vizState.dials.surrealism || 0) / 100;
      const glitchN = (vizState.dials.glitch_spirit || 0) / 100;
      const tranceN = (vizState.dials.trance_depth || 0) / 100;
      const hypnoticN = (vizState.dials.hypnotic_pull || 0) / 100;

      // Energy: how hard everything moves
      vizState.energy = Math.min(
        1,
        (bpmN + intensityN + adrenalineN + rhythmN) / 4
      );

      // Tension: spikes
      const fearN = (vizState.dials.fear || 0) / 100;
      const angerN = (vizState.dials.anger || 0) / 100;
      const anxietyN = (vizState.dials.anxiety || 0) / 100;
      const stressN = (vizState.dials.stress || 0) / 100;
      vizState.tension = Math.min(
        1,
        (fearN + angerN + anxietyN + stressN + adrenalineN) / 5
      );

      // Warmth: based on certain emotions + "Organic" / "Dreamlike"
      let warmth = 0.5;
      const warmWords = ["Hopeful", "Intimate", "Nostalgic", "Calm"];
      const coolWords = ["Haunted", "Detached", "Industrial"];
      vizState.emotions.forEach((e) => {
        if (warmWords.includes(e)) warmth += 0.1;
        if (coolWords.includes(e)) warmth -= 0.1;
      });
      if (vizState.tones.includes("Organic")) warmth += 0.1;
      if (vizState.tones.includes("Dreamlike")) warmth += 0.05;
      if (vizState.tones.includes("Industrial")) warmth -= 0.1;
      vizState.warmth = Math.max(0, Math.min(1, warmth));

      // Surrealism
      vizState.surreal = Math.max(
        0,
        Math.min(
          1,
          (surrealN + glitchN + tranceN + hypnoticN) / 4 +
            (vizState.creativeSwitches.micro_glitches ? 0.15 : 0)
        )
      );

      // Legend labels
      if (vizThemeLabel) {
        if (!vizState.emotions.length && !vizState.tones.length) {
          vizThemeLabel.textContent = "Neutral field · waiting for input…";
        } else {
          const mainEmo = vizState.emotions.slice(0, 2).join(" / ") || "—";
          const mainTone = vizState.tones.slice(0, 2).join(" / ") || "—";
          vizThemeLabel.textContent = `${mainEmo} · ${mainTone}`;
        }
      }
      if (vizEnergyVal)
        vizEnergyVal.textContent = vizState.energy.toFixed(2);
      if (vizTensionVal)
        vizTensionVal.textContent = vizState.tension.toFixed(2);
      if (vizWarmthVal)
        vizWarmthVal.textContent = vizState.warmth.toFixed(2);
      if (vizSurrealVal)
        vizSurrealVal.textContent = vizState.surreal.toFixed(2);
    }

    // Hook UI -> viz state
    if (bpmEl) bpmEl.addEventListener("input", updateVizStateFromUI);
    if (rhythmEl) rhythmEl.addEventListener("input", updateVizStateFromUI);
    if (overallIntensityEl)
      overallIntensityEl.addEventListener("input", updateVizStateFromUI);
    dialInputs.forEach((input) =>
      input.addEventListener("input", updateVizStateFromUI)
    );
    switchInputs.forEach((input) =>
      input.addEventListener("change", updateVizStateFromUI)
    );
    instrumentInputs.forEach((input) =>
      input.addEventListener("change", updateVizStateFromUI)
    );

    // Initial canvas setup
    if (canvas && ctx) {
      resizeCanvas();
      initParticles();
      updateVizStateFromUI();
      window.addEventListener("resize", () => {
        resizeCanvas();
        initParticles();
      });

      requestAnimationFrame(animate);
    }

    function animate(timestamp) {
      if (!canvas || !ctx) return;
      if (!lastTime) lastTime = timestamp;
      const dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;
      t += dt;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Background gradient
      const bgGrad = ctx.createRadialGradient(
        w * 0.5,
        h * 0.25,
        0,
        w * 0.5,
        h * 0.5,
        Math.max(w, h)
      );
      const baseHue = vizState.baseHue;
      const baseSat = vizState.baseSat;
      const baseLight = vizState.baseLight;
      const intensityN = vizState.intensity / 100;
      const warmthShift = (vizState.warmth - 0.5) * 40;

      bgGrad.addColorStop(
        0,
        hslToRgba(
          baseHue + warmthShift,
          baseSat,
          baseLight + 0.15 * intensityN,
          1
        )
      );
      bgGrad.addColorStop(
        0.7,
        hslToRgba(baseHue - 10, baseSat * 0.8, baseLight, 1)
      );
      bgGrad.addColorStop(1, "rgba(0,0,0,1)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // Central pulsing core
      const heartbeatN = (vizState.dials.heartbeat || 0) / 100;
      const coreBase = 25 + 40 * intensityN;
      const corePulse =
        Math.sin(t * (1.5 + heartbeatN * 3)) * (8 + 20 * heartbeatN);
      const coreRadius = coreBase + corePulse;

      const coreColor = hslToRgba(
        baseHue + warmthShift * 0.5,
        0.9,
        0.55 + 0.25 * intensityN,
        0.9
      );
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreColor;
      ctx.shadowColor = coreColor;
      ctx.shadowBlur = 40 + 80 * intensityN;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Waves (tempo / rhythm)
      const bpmN = (vizState.bpm - 60) / (180 - 60);
      const rhythmN = vizState.rhythmDensity / 100;
      const waveCount = 1 + Math.floor(2 + 3 * rhythmN);
      const waveAmplitude = 10 + 30 * intensityN;
      const waveSpeed = 0.8 + 2.2 * bpmN;

      ctx.lineWidth = 1.2;
      for (let i = 0; i < waveCount; i++) {
        const offsetY = (i - (waveCount - 1) / 2) * 14;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const phaseShift = i * 0.7;
          const y =
            cy +
            offsetY +
            Math.sin((x / w) * Math.PI * 4 + t * waveSpeed + phaseShift) *
              (waveAmplitude + 20 * rhythmN);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const waveColor = hslToRgba(
          baseHue + 10 * (i / waveCount),
          0.7,
          0.4 + 0.2 * intensityN,
          0.5
        );
        ctx.strokeStyle = waveColor;
        ctx.stroke();
      }

      // Spikes (tension / fear / anger)
      const spikeCount = 8 + Math.floor(20 * vizState.tension);
      const maxSpikeLen = 40 + 80 * vizState.tension;
      ctx.lineWidth = 1.5 + 2 * vizState.tension;
      const spikeColor = hslToRgba(
        baseHue - 40,
        0.9,
        0.55 + 0.2 * vizState.tension,
        0.8
      );
      ctx.strokeStyle = spikeColor;
      for (let i = 0; i < spikeCount; i++) {
        const angle =
          ((Math.PI * 2) / spikeCount) * i +
          t * (0.4 + vizState.tension * 1.2);
        const inner = coreRadius + 5;
        const len =
          inner +
          maxSpikeLen *
            (0.3 +
              0.7 *
                (0.4 +
                  0.6 * Math.sin(t * 2 + i * 1.5 + vizState.tension * 5)));
        const x1 = cx + inner * Math.cos(angle);
        const y1 = cy + inner * Math.sin(angle);
        const x2 = cx + len * Math.cos(angle);
        const y2 = cy + len * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Instrument orbiters
      const orbitBase = coreRadius + 20;
      const orbitStep = 18;
      const instrumentCount = vizState.instruments.length;
      const orbitSpeedBase = 0.4 + vizState.energy * 1.6;
      vizState.instruments.forEach((inst, idx) => {
        const radius = orbitBase + idx * orbitStep;
        const angle =
          t * (orbitSpeedBase + idx * 0.15) +
          (idx * Math.PI * 2) / Math.max(1, instrumentCount);
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);

        // orbit path
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = hslToRgba(
          baseHue + idx * 15,
          0.5,
          0.2 + 0.15 * intensityN,
          0.35
        );
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // symbol
        const symbolSize = 5 + (vizState.dials.instrument_blend || 0) / 20;
        ctx.fillStyle = hslToRgba(
          baseHue + idx * 20,
          0.9,
          0.55 + 0.2 * intensityN,
          0.9
        );
        ctx.beginPath();
        if (inst.includes("Piano")) {
          // square
          ctx.rect(
            x - symbolSize,
            y - symbolSize,
            symbolSize * 2,
            symbolSize * 2
          );
        } else if (inst.includes("Guitar")) {
          // triangle
          ctx.moveTo(x, y - symbolSize);
          ctx.lineTo(x + symbolSize, y + symbolSize);
          ctx.lineTo(x - symbolSize, y + symbolSize);
          ctx.closePath();
        } else if (inst.includes("Drums")) {
          ctx.arc(x, y, symbolSize + 2, 0, Math.PI * 2);
        } else if (inst.includes("Bass")) {
          ctx.arc(x, y, symbolSize, 0, Math.PI * 2);
        } else if (inst.includes("Strings")) {
          ctx.moveTo(x, y - symbolSize);
          ctx.lineTo(x, y + symbolSize);
        } else if (inst.includes("Synths")) {
          ctx.arc(x, y, symbolSize * 0.7, 0, Math.PI * 2);
        } else {
          ctx.rect(
            x - symbolSize * 0.7,
            y - symbolSize * 0.7,
            symbolSize * 1.4,
            symbolSize * 1.4
          );
        }
        ctx.fill();
      });

      // Particles (emotion / surrealism field)
      const energySpeed = 0.4 + vizState.energy * 2.5;
      const surrealJitter = vizState.surreal * 2.5;
      const particleColor = hslToRgba(
        baseHue + warmthShift,
        0.8,
        0.6 + 0.25 * intensityN,
        0.7
      );
      ctx.fillStyle = particleColor;
      particles.forEach((p) => {
        p.x += p.vx * (1 + energySpeed) + Math.sin(t + p.phase) * surrealJitter;
        p.y +=
          p.vy * (1 + energySpeed) +
          Math.cos(t * 0.8 + p.phase) * surrealJitter;
        const rectWidth = w;
        const rectHeight = h;
        if (p.x < 0) p.x += rectWidth;
        if (p.x > rectWidth) p.x -= rectWidth;
        if (p.y < 0) p.y += rectHeight;
        if (p.y > rectHeight) p.y -= rectHeight;

        ctx.beginPath();
        const shapeRoll = (p.phase * 1000) % 3;
        if (shapeRoll < 1) {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        } else if (shapeRoll < 2) {
          ctx.rect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        } else {
          ctx.moveTo(p.x, p.y - p.size);
          ctx.lineTo(p.x + p.size, p.y + p.size);
          ctx.lineTo(p.x - p.size, p.y + p.size);
          ctx.closePath();
        }
        ctx.fill();
      });

      // Glitch / micro accents
      if (vizState.creativeSwitches.micro_glitches || vizState.surreal > 0.5) {
        const glitchLines = 4 + Math.floor(16 * vizState.surreal);
        ctx.strokeStyle = hslToRgba(
          baseHue + 120,
          1,
          0.7,
          0.6 * vizState.surreal
        );
        ctx.lineWidth = 0.8;
        for (let i = 0; i < glitchLines; i++) {
          const gx = Math.random() * w;
          const gy = Math.random() * h;
          const len = 10 + Math.random() * 40;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx + len, gy + (Math.random() - 0.5) * 10);
          ctx.stroke();
        }
      }

      // "Broken radio" bars
      if (vizState.creativeSwitches.broken_radio) {
        const bars = 3 + Math.floor(10 * vizState.tension);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        for (let i = 0; i < bars; i++) {
          const x = (w / bars) * i + (Math.random() - 0.5) * 20;
          const barW = 4 + Math.random() * 4;
          ctx.fillRect(x, 0, barW, h);
        }
      }

      requestAnimationFrame(animate);
    }

    // ------------------------------------------------------
    // EXPORT HANDLER (same structured payload as before)
    // ------------------------------------------------------
    if (forgeExportBtn) {
      forgeExportBtn.addEventListener("click", () => {
        const lyricsEl = document.getElementById("forge-lyrics-text");
        const instructionEl = document.getElementById(
          "experience-instruction"
        );

        const lyrics = lyricsEl ? lyricsEl.value.trim() : "";
        const experienceInstruction = instructionEl
          ? instructionEl.value.trim()
          : "";

        function getSelectedTagsForGroup(groupName) {
          const group = forgeLayout.querySelector(
            `.forge-group[data-group="${groupName}"]`
          );
          if (!group) return [];
          return Array.from(
            group.querySelectorAll(".forge-tag.selected")
          ).map((el) => el.textContent.trim());
        }

        const emotions = getSelectedTagsForGroup("emotions");
        const toneTags = getSelectedTagsForGroup("tone");

        const bpm = bpmEl ? bpmEl.value : null;
        const rhythmDensity = rhythmEl ? rhythmEl.value : null;
        const overallIntensity = overallIntensityEl
          ? overallIntensityEl.value
          : null;

        const grooveInput = forgeLayout.querySelector(
          'input[name="groove"]:checked'
        );
        const groove = grooveInput ? grooveInput.value : null;

        const activePattern = forgeLayout.querySelector(
          ".forge-timeline-step.active"
        );
        const intensityPattern = activePattern
          ? activePattern.textContent.trim()
          : null;

        const instruments = [];
        instrumentInputs.forEach((input) => {
          if (input.checked) {
            instruments.push(input.dataset.instrument);
          }
        });

        const creativeSwitches = [];
        switchInputs.forEach((input) => {
          creativeSwitches.push({
            name: input.dataset.switch,
            enabled: !!input.checked,
          });
        });

        const dials = {};
        dialInputs.forEach((input) => {
          dials[input.dataset.dial] = input.value;
        });

        const musicProviderEl = document.getElementById("music-provider");
        const musicModelEl = document.getElementById("music-model");
        const musicMaxLengthEl = document.getElementById("music-max-length");

        const voiceProviderEl = document.getElementById("voice-provider");
        const voiceModelEl = document.getElementById("voice-model");
        const voiceProfileEl = document.getElementById("voice-profile-id");
        const voiceStyleEl = document.getElementById("voice-style-preset");
        const voiceSeedEl = document.getElementById("voice-seed");

        const sampleRateEl = document.getElementById("audio-sample-rate");
        const audioFormatEl = document.getElementById("audio-format");

        const modelStack = {
          music: {
            provider: musicProviderEl ? musicProviderEl.value || null : null,
            model: musicModelEl ? musicModelEl.value.trim() || null : null,
            maxLengthSeconds: musicMaxLengthEl
              ? musicMaxLengthEl.value || null
              : null,
          },
          voice: {
            provider: voiceProviderEl ? voiceProviderEl.value || null : null,
            model: voiceModelEl ? voiceModelEl.value.trim() || null : null,
            profileId: voiceProfileEl
              ? voiceProfileEl.value.trim() || null
              : null,
            stylePreset: voiceStyleEl
              ? voiceStyleEl.value.trim() || null
              : null,
            seed: voiceSeedEl ? voiceSeedEl.value || null : null,
          },
          output: {
            sampleRateHz: sampleRateEl ? sampleRateEl.value || null : null,
            format: audioFormatEl ? audioFormatEl.value || null : null,
          },
        };

        const payload = {
          lyrics,
          emotions,
          tone: toneTags,
          tempo: {
            bpm,
            rhythmDensity,
            groove,
          },
          intensity: {
            overallIntensity,
            pattern: intensityPattern,
          },
          instruments,
          dials,
          creativeSwitches,
          experienceInstruction,
          modelStack,
        };

        const lines = [];
        lines.push("FIFTH FORMAT EXPERIENCE INSTRUCTION");
        lines.push(`Generated: ${new Date().toISOString()}`);
        lines.push("");
        lines.push("== LYRICS ==");
        lines.push(lyrics || "<empty>");
        lines.push("");
        lines.push("== EMOTION PALETTE ==");
        lines.push(emotions.length ? emotions.join(", ") : "<none>");
        lines.push("");
        lines.push("== TONE & ATMOSPHERE ==");
        lines.push(toneTags.length ? toneTags.join(", ") : "<none>");
        lines.push("");
        lines.push("== TEMPO & RHYTHM ==");
        lines.push(`BPM: ${bpm || "—"}`);
        lines.push(`Rhythm Density: ${rhythmDensity || "—"} (0–100)`);
        lines.push(`Groove: ${groove || "—"}`);
        lines.push("");
        lines.push("== INTENSITY CURVE ==");
        lines.push(`Overall Intensity: ${overallIntensity || "—"} (0–100)`);
        lines.push(`Pattern: ${intensityPattern || "—"}`);
        lines.push("");
        lines.push("== INSTRUMENT LAYERS ==");
        lines.push(instruments.length ? instruments.join(", ") : "<none>");
        lines.push("");
        lines.push("== MODEL & VOICE STACK ==");
        lines.push(
          `Music provider: ${modelStack.music.provider || "—"} | Model: ${
            modelStack.music.model || "—"
          } | Max length (sec): ${
            modelStack.music.maxLengthSeconds || "—"
          }`
        );
        lines.push(
          `Voice provider: ${modelStack.voice.provider || "—"} | Model: ${
            modelStack.voice.model || "—"
          }`
        );
        lines.push(
          `Voice profile ID: ${
            modelStack.voice.profileId || "—"
          } | Style preset: ${
            modelStack.voice.stylePreset || "—"
          } | Seed: ${modelStack.voice.seed || "—"}`
        );
        lines.push(
          `Output: ${modelStack.output.sampleRateHz || "—"} Hz, ${
            modelStack.output.format || "—"
          }`
        );
        lines.push("");
        lines.push("== GLOBAL DIALS (including knobs & mixer) ==");
        const dialKeys = Object.keys(dials);
        if (dialKeys.length) {
          dialKeys.forEach((key) => {
            lines.push(`${key}: ${dials[key]} (0–100)`);
          });
        } else {
          lines.push("<none>");
        }
        lines.push("");
        lines.push("== CREATIVE / REAL-WORLD SWITCHES ==");
        creativeSwitches.forEach((sw) => {
          lines.push(`${sw.name}: ${sw.enabled ? "ON" : "OFF"}`);
        });
        if (!creativeSwitches.length) {
          lines.push("<none>");
        }
        lines.push("");
        lines.push("== EXPERIENCE INSTRUCTION (FREE TEXT) ==");
        lines.push(experienceInstruction || "<empty>");
        lines.push("");
        lines.push("== RAW JSON PAYLOAD (for AI) ==");
        lines.push(JSON.stringify(payload, null, 2));

        const blob = new Blob([lines.join("\n")], {
          type: "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "fifth-format-experience.txt";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          URL.revokeObjectURL(url);
          a.remove();
        }, 0);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Package triangle toggle – works for ALL packages now
// ---------------------------------------------------------------------------
(function () {
  const headers = document.querySelectorAll(".exp-package-header");

  headers.forEach((header) => {
    header.addEventListener("click", (e) => {
      // Don't toggle when clicking links/buttons inside header (future-proof)
      if (e.target.closest("a") || e.target.closest("button")) return;

      const section = header.closest(".exp-package");
      if (!section) return;

      if (section.classList.contains("is-open")) {
        section.classList.remove("is-open");
        section.classList.add("is-collapsed");
      } else {
        section.classList.add("is-open");
        section.classList.remove("is-collapsed");
      }
    });
  });
})();

// ---------------------------------------------------------------------------
// Per-package color + pattern themes for triangles & track areas
// ---------------------------------------------------------------------------
(function () {
  // Each palette is a color scheme + subtle pattern
  const palettes = [
    {
      // Teal + diagonal stripes
      bg: `
        repeating-linear-gradient(
          135deg,
          rgba(34, 197, 167, 0.09) 0px,
          rgba(34, 197, 167, 0.09) 2px,
          transparent 2px,
          transparent 8px
        ),
        radial-gradient(circle at top left, #0f172a, #022c22)
      `,
      border: "rgba(45, 212, 191, 0.55)",
      triangle: "rgba(45, 212, 191, 0.95)",
      glow: "rgba(45, 212, 191, 0.9)",
      trackBg: `
        repeating-linear-gradient(
          0deg,
          rgba(34, 197, 167, 0.06) 0px,
          rgba(34, 197, 167, 0.06) 3px,
          transparent 3px,
          transparent 9px
        ),
        radial-gradient(circle at top, #022c22, #020617)
      `,
      trackBorder: "rgba(45, 212, 191, 0.45)",
    },
    {
      // Purple + concentric rings
      bg: `
        radial-gradient(circle at 10% 0%, rgba(236, 72, 153, 0.15), transparent 55%),
        radial-gradient(circle at 90% 120%, rgba(129, 140, 248, 0.18), transparent 60%),
        radial-gradient(circle at top left, #1f1335, #020617)
      `,
      border: "rgba(168, 85, 247, 0.55)",
      triangle: "rgba(192, 132, 252, 0.95)",
      glow: "rgba(217, 70, 239, 0.9)",
      trackBg: `
        radial-gradient(circle at 0% 0%, rgba(236, 72, 153, 0.12), transparent 55%),
        radial-gradient(circle at top, #1f1335, #020617)
      `,
      trackBorder: "rgba(168, 85, 247, 0.5)",
    },
    {
      // Deep blue + scanlines
      bg: `
        repeating-linear-gradient(
          180deg,
          rgba(59, 130, 246, 0.08) 0px,
          rgba(59, 130, 246, 0.08) 1px,
          transparent 1px,
          transparent 4px
        ),
        radial-gradient(circle at top left, #0b1120, #020617)
      `,
      border: "rgba(59, 130, 246, 0.6)",
      triangle: "rgba(59, 130, 246, 0.95)",
      glow: "rgba(96, 165, 250, 0.9)",
      trackBg: `
        repeating-linear-gradient(
          90deg,
          rgba(37, 99, 235, 0.08) 0px,
          rgba(37, 99, 235, 0.08) 2px,
          transparent 2px,
          transparent 7px
        ),
        radial-gradient(circle at top, #0b1120, #020617)
      `,
      trackBorder: "rgba(59, 130, 246, 0.55)",
    },
    {
      // Amber + soft grid
      bg: `
        linear-gradient(
          135deg,
          rgba(245, 158, 11, 0.12),
          transparent 60%
        ),
        repeating-linear-gradient(
          90deg,
          rgba(248, 250, 252, 0.03) 0px,
          rgba(248, 250, 252, 0.03) 1px,
          transparent 1px,
          transparent 6px
        ),
        radial-gradient(circle at top left, #1f1305, #020617)
      `,
      border: "rgba(245, 158, 11, 0.6)",
      triangle: "rgba(251, 191, 36, 0.95)",
      glow: "rgba(251, 191, 36, 0.9)",
      trackBg: `
        repeating-linear-gradient(
          135deg,
          rgba(251, 191, 36, 0.08) 0px,
          rgba(251, 191, 36, 0.08) 2px,
          transparent 2px,
          transparent 8px
        ),
        radial-gradient(circle at top, #1f1305, #020617)
      `,
      trackBorder: "rgba(245, 158, 11, 0.55)",
    },
    {
      // Rose / red + diagonal weave
      bg: `
        repeating-linear-gradient(
          45deg,
          rgba(244, 63, 94, 0.12) 0px,
          rgba(244, 63, 94, 0.12) 3px,
          transparent 3px,
          transparent 9px
        ),
        radial-gradient(circle at top left, #2b0b16, #020617)
      `,
      border: "rgba(244, 63, 94, 0.6)",
      triangle: "rgba(244, 63, 94, 0.95)",
      glow: "rgba(251, 113, 133, 0.9)",
      trackBg: `
        repeating-linear-gradient(
          -45deg,
          rgba(248, 113, 113, 0.08) 0px,
          rgba(248, 113, 113, 0.08) 2px,
          transparent 2px,
          transparent 7px
        ),
        radial-gradient(circle at top, #2b0b16, #020617)
      `,
      trackBorder: "rgba(244, 63, 94, 0.55)",
    },
    {
      // Electric cyan + noise-like speckles
      bg: `
        radial-gradient(circle at 15% 0%, rgba(45, 212, 191, 0.2), transparent 55%),
        radial-gradient(circle at 80% 100%, rgba(56, 189, 248, 0.25), transparent 60%),
        radial-gradient(circle at top left, #020617, #020617)
      `,
      border: "rgba(34, 211, 238, 0.7)",
      triangle: "rgba(34, 211, 238, 0.98)",
      glow: "rgba(56, 189, 248, 0.95)",
      trackBg: `
        radial-gradient(circle at 0% 0%, rgba(56, 189, 248, 0.18), transparent 55%),
        radial-gradient(circle at top, #020617, #000000)
      `,
      trackBorder: "rgba(34, 211, 238, 0.6)",
    },
    {
      // Indigo + subtle checker
      bg: `
        repeating-linear-gradient(
          0deg,
          rgba(129, 140, 248, 0.09) 0px,
          rgba(129, 140, 248, 0.09) 3px,
          transparent 3px,
          transparent 6px
        ),
        repeating-linear-gradient(
          90deg,
          rgba(79, 70, 229, 0.06) 0px,
          rgba(79, 70, 229, 0.06) 3px,
          transparent 3px,
          transparent 6px
        ),
        radial-gradient(circle at top left, #020617, #020617)
      `,
      border: "rgba(129, 140, 248, 0.65)",
      triangle: "rgba(129, 140, 248, 0.98)",
      glow: "rgba(165, 180, 252, 0.9)",
      trackBg: `
        repeating-linear-gradient(
          135deg,
          rgba(129, 140, 248, 0.08) 0px,
          rgba(129, 140, 248, 0.08) 2px,
          transparent 2px,
          transparent 7px
        ),
        radial-gradient(circle at top, #020617, #020617)
      `,
      trackBorder: "rgba(129, 140, 248, 0.6)",
    },
    {
      // Emerald + soft radial mesh
      bg: `
        radial-gradient(circle at 0% 20%, rgba(16, 185, 129, 0.2), transparent 55%),
        radial-gradient(circle at 100% 80%, rgba(52, 211, 153, 0.18), transparent 60%),
        radial-gradient(circle at top left, #022c22, #020617)
      `,
      border: "rgba(16, 185, 129, 0.7)",
      triangle: "rgba(16, 185, 129, 0.98)",
      glow: "rgba(52, 211, 153, 0.9)",
      trackBg: `
        radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.18), transparent 60%),
        radial-gradient(circle at top, #022c22, #020617)
      `,
      trackBorder: "rgba(16, 185, 129, 0.6)",
    },
  ];

  const pkgSections = document.querySelectorAll(".exp-package");
  let paletteIndex = 0;

  pkgSections.forEach((section) => {
    // Sequential assignment so each package looks distinct
    const palette = palettes[paletteIndex % palettes.length];
    paletteIndex++;

    const card = section.querySelector(".exp-package-card");
    if (!card) return;

    section.style.setProperty("--pkg-bg", palette.bg);
    section.style.setProperty("--pkg-border", palette.border);
    section.style.setProperty("--pkg-triangle", palette.triangle);
    section.style.setProperty("--pkg-glow", palette.glow);
    section.style.setProperty("--pkg-track-bg", palette.trackBg);
    section.style.setProperty("--pkg-track-border", palette.trackBorder);
  });
})();



// ==========================================================================
// LEGACY EXPERIENCE VISUALIZER – COMMENTED OUT
// Paste your previous visualizer logic here if you want it available.
// Only one DOMContentLoaded handler should be active at a time.
// ==========================================================================

/*
document.addEventListener("DOMContentLoaded", () => {
  // Example structure – replace with your old visualizer code:

  const expAudio = document.getElementById("exp-audio");
  const vizCanvas = document.getElementById("ff-visualizer");
  if (!expAudio || !vizCanvas) return;

  const ctx = vizCanvas.getContext("2d");

  function resizeViz() {
    const rect = vizCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    vizCanvas.width = rect.width * dpr;
    vizCanvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resizeViz();
  window.addEventListener("resize", resizeViz);

  // If you were using Web Audio API:
  // const audioCtx = new AudioContext();
  // const source = audioCtx.createMediaElementSource(expAudio);
  // const analyser = audioCtx.createAnalyser();
  // analyser.fftSize = 256;
  // source.connect(analyser);
  // analyser.connect(audioCtx.destination);

  // const bufferLength = analyser.frequencyBinCount;
  // const dataArray = new Uint8Array(bufferLength);

  let lastTime = 0;

  function draw(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    const w = vizCanvas.width;
    const h = vizCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // If you're using analyser:
    // analyser.getByteFrequencyData(dataArray);

    // Simple placeholder: radial pulse based on currentTime
    const t = expAudio.currentTime || 0;
    const cx = w / 2;
    const cy = h / 2;
    const radius = 60 + Math.sin(t * 2) * 30;

    const gradient = ctx.createRadialGradient(
      cx,
      cy,
      0,
      cx,
      cy,
      Math.max(w, h) / 2
    );
    gradient.addColorStop(0, "rgba(56,189,248,0.9)");
    gradient.addColorStop(0.4, "rgba(88,28,135,0.6)");
    gradient.addColorStop(1, "rgba(15,23,42,1)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(248,250,252,0.9)";
    ctx.lineWidth = 4;
    ctx.stroke();

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
});
*/

