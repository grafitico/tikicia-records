/* =====================================================================
   TIKICIA RECORDS — Main JS
   - Renderiza catálogo, artistas, releases
   - Reproductor de música funcional (play/pause/skip/seek/volume)
   - Animaciones de reveal con IntersectionObserver
   - Nav con efecto scrolled
   - Contador animado en stats del hero
   ===================================================================== */

(function () {
  "use strict";

  /* ---------- Utilidades ---------- */
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const safe = (fn, name) => { try { fn(); } catch (e) { console.warn("[init failed]", name, e); } };

  /* ---------- SVG cover generator (placeholder cuando no hay carátula) ---------- */
  function makeCoverSVG(colorA, colorB, title) {
    const initials = (title || "??").split(" ").map(s=>s[0]||"").join("").slice(0,2).toUpperCase();
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="g-${colorA.replace('#','')}-${colorB.replace('#','')}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${colorA}"/>
            <stop offset="100%" stop-color="${colorB}"/>
          </linearGradient>
          <radialGradient id="rg-${colorA.replace('#','')}" cx="0.3" cy="0.3" r="0.7">
            <stop offset="0%" stop-color="rgba(255,255,255,0.35)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        <rect width="200" height="200" fill="url(#g-${colorA.replace('#','')}-${colorB.replace('#','')})"/>
        <circle cx="60" cy="60" r="80" fill="url(#rg-${colorA.replace('#','')})"/>
        <text x="100" y="118" text-anchor="middle" font-family="Fraunces, serif" font-size="64" font-weight="500" font-style="italic" fill="rgba(255,255,255,0.95)">${initials}</text>
        <circle cx="170" cy="170" r="12" fill="rgba(0,0,0,0.25)"/>
        <circle cx="170" cy="170" r="4" fill="rgba(255,255,255,0.6)"/>
      </svg>
    `;
  }

  function makeArtistSVG(colorA, colorB, name) {
    const initials = (name || "?").split(" ").map(s=>s[0]||"").join("").slice(0,2).toUpperCase();
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="ag-${colorA.replace('#','')}" cx="0.5" cy="0.4" r="0.7">
            <stop offset="0%" stop-color="${colorA}"/>
            <stop offset="100%" stop-color="${colorB}"/>
          </radialGradient>
        </defs>
        <rect width="200" height="200" fill="url(#ag-${colorA.replace('#','')})"/>
        <text x="100" y="125" text-anchor="middle" font-family="Fraunces, serif" font-size="80" font-weight="400" font-style="italic" fill="rgba(255,255,255,0.92)">${initials}</text>
      </svg>
    `;
  }

  /* ---------- Render Track List ---------- */
  function initTrackList() {
    const list = $("#trackList");
    if (!list) return;
    const tracks = window.__TRACKS__ || [];
    if (list.children.length > 0) return; // idempotente

    list.innerHTML = tracks.map((t, i) => {
      const coverHTML = t.cover
        ? `<img src="${t.cover}" alt="${t.title}" />`
        : makeCoverSVG(t.colorA || "#ff5a1f", t.colorB || "#d63384", t.title);
      return `
        <div class="track" data-track-id="${t.id}" data-index="${i}">
          <div class="track-num">
            <span class="num">${String(i+1).padStart(2,'0')}</span>
            <span class="track-play">▶</span>
          </div>
          <div class="track-cover">${coverHTML}</div>
          <div class="track-info">
            <div class="track-title">${t.title}</div>
            <div class="track-artist">${t.artist}</div>
          </div>
          <div class="track-album">${t.album}</div>
          <button class="track-like" aria-label="Me gusta">♡</button>
          <div class="track-duration">${t.duration}</div>
        </div>
      `;
    }).join("");

    // Click handlers
    $$(".track", list).forEach((el) => {
      el.addEventListener("click", (ev) => {
        if (ev.target.classList.contains("track-like")) return;
        const idx = parseInt(el.dataset.index, 10);
        window.__PLAYER__.playIndex(idx);
      });
    });

    $$(".track-like", list).forEach((b) => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        b.classList.toggle("liked");
        b.textContent = b.classList.contains("liked") ? "♥" : "♡";
      });
    });
  }

  /* ---------- Render Artist Grid ---------- */
  function initArtistGrid() {
    const grid = $("#artistGrid");
    if (!grid) return;
    if (grid.children.length > 0) return;
    const artists = window.__ARTISTS__ || [];

    grid.innerHTML = artists.map((a) => {
      const imgHTML = a.photo
        ? `<img src="${a.photo}" alt="${a.name}" />`
        : makeArtistSVG(a.colorA || "#ff5a1f", a.colorB || "#d63384", a.name);
      return `
        <div class="artist-card io-reveal" data-artist-id="${a.id}">
          <div class="artist-img">${imgHTML}</div>
          <div class="artist-name">${a.name}</div>
          <div class="artist-genre">${a.genre}</div>
        </div>
      `;
    }).join("");
  }

  /* ---------- Render Release Bento ---------- */
  function initReleaseBento() {
    const bento = $("#releaseBento");
    if (!bento) return;
    if (bento.children.length > 0) return;
    const releases = window.__RELEASES__ || [];

    bento.innerHTML = releases.map((r) => {
      const coverHTML = r.cover
        ? `<img src="${r.cover}" alt="${r.title}" />`
        : makeCoverSVG(r.colorA || "#ff5a1f", r.colorB || "#d63384", r.title);
      return `
        <div class="release io-reveal ${r.large ? 'large' : ''}" data-release-id="${r.id}">
          <div class="release-cover">${coverHTML}</div>
          <div class="release-info">
            <div class="release-type">${r.type} · ${r.year}</div>
            <div class="release-title">${r.title}</div>
            <div class="release-artist">${r.artist}</div>
          </div>
          <div class="release-play" aria-label="Reproducir">▶</div>
        </div>
      `;
    }).join("");

    // Click: reproducir primera canción de ese artista
    $$(".release", bento).forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.releaseId;
        const release = (window.__RELEASES__ || []).find(r => r.id === id);
        if (!release) return;
        const idx = (window.__TRACKS__ || []).findIndex(t => t.album === release.title || t.artist === release.artist);
        if (idx >= 0) window.__PLAYER__.playIndex(idx);
      });
    });
  }

  /* ---------- Splash control ---------- */
  function initSplash() {
    const splash = $("#splash");
    if (!splash) return;
    setTimeout(() => splash.classList.add("gone"), 3400);
  }

  /* ---------- Nav scrolled ---------- */
  function initNavScroll() {
    const nav = $("#nav");
    if (!nav) return;
    const update = () => {
      if (window.scrollY > 30) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ---------- IntersectionObserver reveal ---------- */
  function initReveal() {
    const els = $$(".io-reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(e => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -40px 0px" });
    els.forEach(e => io.observe(e));

    // Safety net: reveal cualquier elemento aún oculto a los 6s
    setTimeout(() => {
      $$(".io-reveal:not(.in)").forEach(e => e.classList.add("in"));
    }, 6000);
  }

  /* ---------- Count up animation (hero stats) ---------- */
  function initCountUp() {
    const els = $$("[data-count-to]");
    if (!els.length) return;
    const animate = (el, target, isDecimal) => {
      const dur = 1500;
      const start = performance.now();
      const initial = 0;
      const step = (t) => {
        const p = Math.min((t - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const val = initial + (target - initial) * ease;
        el.textContent = isDecimal ? val.toFixed(1) : Math.floor(val).toString();
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = isDecimal ? target.toFixed(1) : String(target);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.countTo);
        const isDecimal = el.dataset.countTo.indexOf(".") !== -1;
        animate(el, target, isDecimal);
        io.unobserve(el);
      });
    }, { threshold: 0.05 });
    els.forEach(e => io.observe(e));
    // Safety: if not triggered in 6s, animate anyway
    setTimeout(() => {
      els.forEach(el => {
        if (el.textContent === "0") {
          const target = parseFloat(el.dataset.countTo);
          const isDecimal = el.dataset.countTo.indexOf(".") !== -1;
          animate(el, target, isDecimal);
        }
      });
    }, 6000);
  }

  /* =====================================================================
     PLAYER — reproductor de música funcional
     ===================================================================== */
  const Player = (function () {
    const state = {
      tracks: [],
      currentIndex: -1,
      isPlaying: false,
      isShuffle: false,
      isRepeat: false,
      isMuted: false,
      volume: 0.8,
      audio: null
    };

    let els = {};

    function init() {
      state.tracks = window.__TRACKS__ || [];
      els = {
        player: $("#player"),
        audio: $("#audioElement"),
        cover: $("#playerCover"),
        title: $("#playerTitle"),
        artist: $("#playerArtist"),
        like: $("#playerLike"),
        play: $("#ctrlPlay"),
        prev: $("#ctrlPrev"),
        next: $("#ctrlNext"),
        shuffle: $("#ctrlShuffle"),
        repeat: $("#ctrlRepeat"),
        mute: $("#ctrlMute"),
        progressBar: $("#progressBar"),
        progressFill: $("#progressFill"),
        progressThumb: $("#progressThumb"),
        timeCurrent: $("#timeCurrent"),
        timeTotal: $("#timeTotal"),
        volumeBar: $("#volumeBar"),
        volumeFill: $("#volumeFill")
      };
      state.audio = els.audio;
      state.audio.volume = state.volume;

      // Bindings
      els.play.addEventListener("click", togglePlay);
      els.prev.addEventListener("click", prev);
      els.next.addEventListener("click", next);
      els.shuffle.addEventListener("click", () => { state.isShuffle = !state.isShuffle; els.shuffle.classList.toggle("active", state.isShuffle); });
      els.repeat.addEventListener("click", () => { state.isRepeat = !state.isRepeat; els.repeat.classList.toggle("active", state.isRepeat); });
      els.mute.addEventListener("click", toggleMute);
      els.like.addEventListener("click", () => els.like.classList.toggle("liked"));

      // Progress seek
      els.progressBar.addEventListener("click", (e) => {
        const rect = els.progressBar.getBoundingClientRect();
        const p = (e.clientX - rect.left) / rect.width;
        if (state.audio.duration) state.audio.currentTime = p * state.audio.duration;
      });

      // Volume bar
      els.volumeBar.addEventListener("click", (e) => {
        const rect = els.volumeBar.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setVolume(p);
      });

      // Audio events
      state.audio.addEventListener("timeupdate", updateProgress);
      state.audio.addEventListener("loadedmetadata", () => {
        els.timeTotal.textContent = formatTime(state.audio.duration);
      });
      state.audio.addEventListener("ended", () => {
        if (state.isRepeat) {
          state.audio.currentTime = 0;
          state.audio.play();
        } else {
          next();
        }
      });
      state.audio.addEventListener("play", () => {
        state.isPlaying = true;
        els.play.classList.add("playing");
        markPlayingTrack();
      });
      state.audio.addEventListener("pause", () => {
        state.isPlaying = false;
        els.play.classList.remove("playing");
        markPlayingTrack();
      });
      state.audio.addEventListener("error", () => {
        // Fallback: si no hay audio, simular reproducción con duración estética
        console.info("[player] audio source unavailable for current track");
      });

      // Keyboard shortcut: spacebar play/pause
      document.addEventListener("keydown", (e) => {
        if (e.code === "Space" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
          e.preventDefault();
          togglePlay();
        }
      });

      updateVolumeUI();
    }

    function playIndex(i) {
      if (i < 0 || i >= state.tracks.length) return;
      state.currentIndex = i;
      const t = state.tracks[i];

      // Update UI
      els.title.textContent = t.title;
      els.artist.textContent = t.artist;
      els.cover.innerHTML = t.cover
        ? `<img src="${t.cover}" alt="${t.title}" />`
        : makeCoverSVG(t.colorA || "#ff5a1f", t.colorB || "#d63384", t.title);

      // Show player
      els.player.classList.add("active");

      // Load and play
      if (t.audio) {
        state.audio.src = t.audio;
        const playPromise = state.audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay block o archivo no encontrado — el usuario puede darle play manual
            state.isPlaying = false;
            els.play.classList.remove("playing");
          });
        }
      } else {
        // Modo demo: no hay archivo, mostrar info pero no reproducir
        state.audio.removeAttribute("src");
        state.audio.load();
        state.isPlaying = false;
        els.play.classList.remove("playing");
        els.timeTotal.textContent = t.duration || "0:00";
        els.timeCurrent.textContent = "0:00";
        els.progressFill.style.width = "0%";
        els.progressThumb.style.left = "0%";
      }
      markPlayingTrack();
    }

    function togglePlay() {
      if (state.currentIndex < 0) {
        playIndex(0);
        return;
      }
      if (state.audio.src) {
        if (state.audio.paused) state.audio.play();
        else state.audio.pause();
      }
    }

    function prev() {
      if (state.currentIndex <= 0) playIndex(state.tracks.length - 1);
      else playIndex(state.currentIndex - 1);
    }

    function next() {
      if (state.isShuffle) {
        let i;
        do { i = Math.floor(Math.random() * state.tracks.length); }
        while (i === state.currentIndex && state.tracks.length > 1);
        playIndex(i);
      } else {
        if (state.currentIndex >= state.tracks.length - 1) playIndex(0);
        else playIndex(state.currentIndex + 1);
      }
    }

    function toggleMute() {
      state.isMuted = !state.isMuted;
      state.audio.muted = state.isMuted;
      els.mute.classList.toggle("muted", state.isMuted);
    }

    function setVolume(v) {
      state.volume = v;
      state.audio.volume = v;
      state.audio.muted = false;
      state.isMuted = false;
      els.mute.classList.remove("muted");
      updateVolumeUI();
    }

    function updateVolumeUI() {
      els.volumeFill.style.width = (state.volume * 100) + "%";
    }

    function updateProgress() {
      if (!state.audio.duration) return;
      const p = (state.audio.currentTime / state.audio.duration) * 100;
      els.progressFill.style.width = p + "%";
      els.progressThumb.style.left = p + "%";
      els.timeCurrent.textContent = formatTime(state.audio.currentTime);
    }

    function formatTime(s) {
      if (!s || isNaN(s)) return "0:00";
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    function markPlayingTrack() {
      $$(".track").forEach((el, i) => {
        el.classList.toggle("playing", i === state.currentIndex && state.isPlaying);
      });
    }

    return { init, playIndex, togglePlay, prev, next };
  })();

  /* ---------- Contact form ---------- */
  function initContactForm() {
    const form = $("#contactForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = $("#formNote");
      const name = form.name.value.trim();
      const contact = form.contact.value.trim();
      if (!name || !contact) {
        note.textContent = "Falta el nombre o el contacto.";
        note.style.color = "#ff5a1f";
        return;
      }
      // Demo: solo muestra confirmación. Para conectar a un backend real,
      // reemplazar esto con un fetch() a tu API o usar Formspree/Netlify Forms.
      note.textContent = "¡Recibido! Te escribimos pronto. (modo demo)";
      note.style.color = "#b8d63a";
      form.reset();
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    safe(initSplash, "splash");
    safe(initNavScroll, "navScroll");
    safe(initTrackList, "trackList");
    safe(initArtistGrid, "artistGrid");
    safe(initReleaseBento, "releaseBento");
    safe(initReveal, "reveal");
    safe(initCountUp, "countUp");
    safe(initContactForm, "contactForm");

    // Player último, ya que depende de elementos del DOM y de __TRACKS__
    safe(() => {
      Player.init();
      window.__PLAYER__ = Player;
    }, "player");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
