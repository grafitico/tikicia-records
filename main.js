/* =====================================================================
   TIKICIA RECORDS — main.js
   Player, catalog rendering, animations.
   ===================================================================== */
(function () {
  'use strict';

  // ─── safe init wrapper ───────────────────────────────────────────────
  function safe(name, fn) {
    try { fn(); } catch (e) { console.warn('[TIKICIA]', name, e); }
  }

  // ─── DOM helpers ─────────────────────────────────────────────────────
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // ─── Helper: obtiene la foto de un artista por nombre ────────────────
  function artistPhoto(name) {
    return (window.__ARTISTS__ || []).find(a => a.name === name)?.photo || '';
  }

  // ─── Helper: cover src con fallback a foto de artista ────────────────
  function coverSrc(item) {
    return item.cover || artistPhoto(item.artist) || '';
  }

  // ─── SVG cover generator ─────────────────────────────────────────────
  function makeCover(colorA, colorB, label, size = 200) {
    const id = 'g' + Math.random().toString(36).slice(2);
    const initials = (label || 'TR')
      .split(/[\s\-_]/)
      .map(w => w[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colorA}"/>
      <stop offset="100%" stop-color="${colorB}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="${colorA}22"/>
  <rect width="${size}" height="${size}" fill="url(#${id})" opacity="0.35"/>
  <text x="${size/2}" y="${size * 0.62}" text-anchor="middle" dominant-baseline="middle"
    font-family="serif" font-size="${size * 0.36}" fill="${colorB}" opacity="0.9"
    font-weight="300">${initials}</text>
  <line x1="${size*0.2}" y1="${size*0.78}" x2="${size*0.8}" y2="${size*0.78}"
    stroke="${colorA}" stroke-width="1" opacity="0.4"/>
</svg>`;
  }

  // ─── SPLASH ──────────────────────────────────────────────────────────
  safe('splash', function () {
    const splash = $('#splash');
    if (!splash) return;
    setTimeout(() => splash.classList.add('gone'), 3500);
  });

  // ─── NAV SCROLL ──────────────────────────────────────────────────────
  safe('nav', function () {
    const nav = $('#nav');
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  });

  // ─── INTERSECTION OBSERVER (reveal) ──────────────────────────────────
  safe('io-reveal', function () {
    const items = $$('.io-reveal');
    if (!items.length) return;
    if (!window.IntersectionObserver) {
      items.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    items.forEach(el => io.observe(el));
  });

  // ─── ANIMATED COUNTERS ───────────────────────────────────────────────
  safe('counters', function () {
    const nums = $$('[data-count-to]');
    if (!nums.length) return;
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.dataset.countTo);
        const isDecimal = target % 1 !== 0;
        const dur = 1600;
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min((now - start) / dur, 1);
          const v = target * easeOut(t);
          el.textContent = isDecimal ? v.toFixed(1) : Math.round(v);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach(n => io.observe(n));
  });

  // ─── TRACK LIST ──────────────────────────────────────────────────────
  safe('tracks', function () {
    const list = $('#trackList');
    const tracks = window.__TRACKS__;
    if (!list || !tracks?.length) return;

    list.innerHTML = tracks.map((t, i) => {
      const src = coverSrc(t);
      const coverHtml = src
        ? `<img src="${src}" alt="${t.title}" loading="lazy" onerror="this.outerHTML='${makeCover(t.colorA||'#e8520f', t.colorB||'#d08e30', t.title)}'"/>`
        : makeCover(t.colorA || '#e8520f', t.colorB || '#d08e30', t.title);
      return `<div class="track" data-id="${t.id}" role="row" tabindex="0" aria-label="${t.title} · ${t.artist}">
  <div class="track-num" role="cell">
    <span>${i + 1}</span>
    <span class="track-play">▶</span>
  </div>
  <div class="track-cover" role="cell">${coverHtml}</div>
  <div class="track-info" role="cell">
    <div class="track-title">${t.title}</div>
    <div class="track-artist">${t.artist}</div>
  </div>
  <div class="track-album" role="cell">${t.album || ''}</div>
  <div class="track-duration" role="cell">${t.duration || '—'}</div>
  <button class="track-like" data-id="${t.id}" aria-label="Me gusta ${t.title}">♡</button>
</div>`;
    }).join('');

    // Likes
    const likedKey = 'tikicia_likes';
    const liked = new Set(JSON.parse(localStorage.getItem(likedKey) || '[]'));
    $$('.track-like', list).forEach(btn => {
      if (liked.has(btn.dataset.id)) btn.classList.add('liked');
      btn.addEventListener('click', e => {
        e.stopPropagation();
        btn.classList.toggle('liked');
        liked[btn.classList.contains('liked') ? 'add' : 'delete'](btn.dataset.id);
        localStorage.setItem(likedKey, JSON.stringify([...liked]));
      });
    });

    $$('.track', list).forEach(row => {
      row.addEventListener('click', () => playTrack(row.dataset.id));
      row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playTrack(row.dataset.id); } });
    });
  });

  // ─── ARTIST GRID ─────────────────────────────────────────────────────
  safe('artists', function () {
    const grid = $('#artistGrid');
    const artists = window.__ARTISTS__;
    if (!grid || !artists?.length) return;

    grid.innerHTML = artists.map(a => {
      const imgHtml = a.photo
        ? `<img src="${a.photo}" alt="${a.name}" loading="lazy" onerror="this.outerHTML='${makeCover(a.colorA||'#e8520f', a.colorB||'#d08e30', a.name, 300)}'"/>`
        : makeCover(a.colorA || '#e8520f', a.colorB || '#d08e30', a.name, 300);
      return `<div class="artist-card io-reveal">
  <div class="artist-img">${imgHtml}</div>
  <div class="artist-name">${a.name}</div>
  <div class="artist-genre">${a.genre}</div>
</div>`;
    }).join('');

    // Re-observe new io-reveal elements
    $$('.artist-card.io-reveal', grid).forEach(el => {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.1 });
      io.observe(el);
    });
  });

  // ─── RELEASE BENTO ───────────────────────────────────────────────────
  safe('releases', function () {
    const bento = $('#releaseBento');
    const releases = window.__RELEASES__;
    if (!bento || !releases?.length) return;

    bento.innerHTML = releases.map(r => {
      const src = coverSrc(r);
      const coverHtml = src
        ? `<img src="${src}" alt="${r.title}" loading="lazy" onerror="this.outerHTML='${makeCover(r.colorA||'#e8520f', r.colorB||'#d08e30', r.title, 400)}'"/>`
        : makeCover(r.colorA || '#e8520f', r.colorB || '#d08e30', r.title, 400);
      const cls = r.large ? 'release large' : 'release';
      // Find first track of this release
      const firstTrack = (window.__TRACKS__ || []).find(t => t.album === r.title);
      return `<div class="${cls}" data-release="${r.id}" ${firstTrack ? `data-track="${firstTrack.id}"` : ''} tabindex="0">
  <div class="release-cover">${coverHtml}</div>
  <div class="release-info">
    <div class="release-type">${r.type} · ${r.year}</div>
    <div class="release-title">${r.title}</div>
    <div class="release-artist">${r.artist}</div>
  </div>
  <div class="release-play">▶</div>
</div>`;
    }).join('');

    $$('.release[data-track]', bento).forEach(el => {
      el.addEventListener('click', () => playTrack(el.dataset.track));
      el.addEventListener('keydown', e => { if (e.key === 'Enter') playTrack(el.dataset.track); });
    });
  });

  // ─── MUSIC PLAYER ────────────────────────────────────────────────────
  const player = {
    el: null, audio: null,
    current: null, queue: [], queueIndex: -1,
    shuffle: false, repeat: false,
    _init: false,
  };

  function initPlayer() {
    if (player._init) return;
    player._init = true;

    player.el = $('#player');
    player.audio = $('#audioElement');
    if (!player.el || !player.audio) return;

    const cover   = $('#playerCover');
    const title   = $('#playerTitle');
    const artist  = $('#playerArtist');
    const like    = $('#playerLike');
    const play    = $('#ctrlPlay');
    const prev    = $('#ctrlPrev');
    const next    = $('#ctrlNext');
    const shuffle = $('#ctrlShuffle');
    const repeat  = $('#ctrlRepeat');
    const mute    = $('#ctrlMute');
    const progBar = $('#progressBar');
    const progFill= $('#progressFill');
    const progThumb = $('#progressThumb');
    const timeCur = $('#timeCurrent');
    const timeTot = $('#timeTotal');
    const volBar  = $('#volumeBar');
    const volFill = $('#volumeFill');

    // Format time
    const fmt = s => {
      s = Math.floor(s) || 0;
      return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
    };

    // Update display
    function updateDisplay(t) {
      if (!t) return;
      title.textContent  = t.title;
      artist.textContent = t.artist;
      const covSrc = t.cover || artistPhoto(t.artist);
      if (covSrc) {
        cover.innerHTML = `<img src="${covSrc}" alt="${t.title}" onerror="this.outerHTML='${makeCover(t.colorA||'#e8520f', t.colorB||'#d08e30', t.title)}'">`;
      } else {
        cover.innerHTML = makeCover(t.colorA || '#e8520f', t.colorB || '#d08e30', t.title);
      }
      // Highlight track in list
      $$('.track').forEach(r => r.classList.toggle('playing', r.dataset.id === t.id));
    }

    // Play track
    window.playTrack = function (id) {
      const tracks = window.__TRACKS__ || [];
      const t = tracks.find(x => x.id === id);
      if (!t) return;

      player.current = t;
      player.queue = tracks;
      player.queueIndex = tracks.indexOf(t);

      updateDisplay(t);
      player.el.classList.add('active');

      if (t.audio) {
        player.audio.src = t.audio;
        player.audio.play().catch(() => {
          title.textContent = t.title + ' (Demo)';
        });
      } else {
        player.audio.src = '';
        title.textContent = t.title + ' — Demo';
      }
    };

    // Play/Pause
    play.addEventListener('click', () => {
      if (!player.current) {
        const first = (window.__TRACKS__ || [])[0];
        if (first) window.playTrack(first.id);
        return;
      }
      if (player.audio.paused) { player.audio.play().catch(() => {}); }
      else { player.audio.pause(); }
    });

    player.audio.addEventListener('play',  () => play.classList.add('playing'));
    player.audio.addEventListener('pause', () => play.classList.remove('playing'));
    player.audio.addEventListener('ended', () => {
      play.classList.remove('playing');
      if (player.repeat) { player.audio.currentTime = 0; player.audio.play(); return; }
      skipNext();
    });

    // Progress
    player.audio.addEventListener('timeupdate', () => {
      const dur = player.audio.duration || 0;
      const cur = player.audio.currentTime || 0;
      const pct = dur ? (cur / dur) * 100 : 0;
      if (progFill)  progFill.style.width  = pct + '%';
      if (progThumb) progThumb.style.left  = pct + '%';
      if (timeCur)   timeCur.textContent   = fmt(cur);
      if (timeTot)   timeTot.textContent   = fmt(dur);
    });

    if (progBar) {
      const seek = e => {
        const rect = progBar.getBoundingClientRect();
        const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (player.audio.duration) player.audio.currentTime = pct * player.audio.duration;
      };
      let dragging = false;
      progBar.addEventListener('mousedown', e => { dragging = true; seek(e); });
      document.addEventListener('mousemove', e => { if (dragging) seek(e); });
      document.addEventListener('mouseup',   () => { dragging = false; });
    }

    // Prev / Next
    function skipPrev() {
      if (!player.queue.length) return;
      if (player.audio.currentTime > 3) { player.audio.currentTime = 0; return; }
      player.queueIndex = (player.queueIndex - 1 + player.queue.length) % player.queue.length;
      window.playTrack(player.queue[player.queueIndex].id);
    }
    function skipNext() {
      if (!player.queue.length) return;
      if (player.shuffle) {
        let idx;
        do { idx = Math.floor(Math.random() * player.queue.length); } while (idx === player.queueIndex && player.queue.length > 1);
        player.queueIndex = idx;
      } else {
        player.queueIndex = (player.queueIndex + 1) % player.queue.length;
      }
      window.playTrack(player.queue[player.queueIndex].id);
    }

    if (prev) prev.addEventListener('click', skipPrev);
    if (next) next.addEventListener('click', skipNext);

    // Shuffle
    if (shuffle) shuffle.addEventListener('click', () => {
      player.shuffle = !player.shuffle;
      shuffle.classList.toggle('active', player.shuffle);
    });

    // Repeat
    if (repeat) repeat.addEventListener('click', () => {
      player.repeat = !player.repeat;
      repeat.classList.toggle('active', player.repeat);
    });

    // Like
    if (like) like.addEventListener('click', () => {
      like.classList.toggle('liked');
      like.textContent = like.classList.contains('liked') ? '♥' : '♡';
    });

    // Volume
    if (volBar) {
      const setVol = e => {
        const rect = volBar.getBoundingClientRect();
        const v = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        player.audio.volume = v;
        if (volFill) volFill.style.width = (v * 100) + '%';
        if (mute) mute.classList.toggle('muted', v === 0);
      };
      let volDrag = false;
      volBar.addEventListener('mousedown', e => { volDrag = true; setVol(e); });
      document.addEventListener('mousemove', e => { if (volDrag) setVol(e); });
      document.addEventListener('mouseup', () => { volDrag = false; });
    }

    // Mute
    if (mute) mute.addEventListener('click', () => {
      player.audio.muted = !player.audio.muted;
      mute.classList.toggle('muted', player.audio.muted);
    });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === ' ') { e.preventDefault(); play.click(); }
      if (e.key === 'ArrowRight') { if (player.audio.duration) player.audio.currentTime = Math.min(player.audio.currentTime + 10, player.audio.duration); }
      if (e.key === 'ArrowLeft')  { player.audio.currentTime = Math.max(player.audio.currentTime - 10, 0); }
    });
  }

  // ─── CONTACT FORM ────────────────────────────────────────────────────
  safe('form', function () {
    const form = $('#contactForm');
    const note = $('#formNote');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(form);
      note.textContent = '¡Gracias! Te contactamos pronto. 🎵';
      form.reset();
    });
  });

  // ─── ADMIN DATA SYNC: load localStorage catalog if it exists ─────────
  safe('admin-data-sync', function () {
    const saved = localStorage.getItem('tikicia_catalog');
    if (!saved) return;
    try {
      const d = JSON.parse(saved);
      if (d.tracks?.length)   window.__TRACKS__   = d.tracks;
      if (d.artists?.length)  window.__ARTISTS__  = d.artists;
      if (d.releases?.length) window.__RELEASES__ = d.releases;
    } catch (e) { /* ignore */ }
  });

  // ─── BOOT ────────────────────────────────────────────────────────────
  function boot() {
    initPlayer();
    safe('tracks-render', function() {
      // Re-run if data was loaded from localStorage
      const list = $('#trackList');
      if (list && list.children.length === 0) {
        // Trigger renders
        const evt = new Event('DOMContentLoaded');
        document.dispatchEvent(evt);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Re-init after data.js loads (defer order)
  window.addEventListener('load', function () {
    safe('tracks-init',   () => { if (!$('#trackList')?.children.length)  { const e = document.createEvent('Event'); e.initEvent('DOMContentLoaded', true, true); document.dispatchEvent(e); } });
    safe('artists-init',  () => { $('#artistGrid') && !$('#artistGrid').children.length  && safe('artists',  () => {}) });
    safe('releases-init', () => { $('#releaseBento') && !$('#releaseBento').children.length && safe('releases', () => {}) });

    // Re-run everything with correct data
    safe('tracks-reload', function() {
      const list = $('#trackList');
      if (!list) return;
      // clear and re-render using the safe wrapper which calls the tracks fn
      list.innerHTML = '';
      safe('tracks', function() {
        const tracks = window.__TRACKS__;
        if (!list || !tracks?.length) return;
        list.innerHTML = tracks.map((t, i) => {
          const s = coverSrc(t);
          const coverHtml = s
            ? `<img src="${s}" alt="${t.title}" loading="lazy" onerror="this.outerHTML='${makeCover(t.colorA||'#e8520f',t.colorB||'#d08e30',t.title)}'"/>`
            : makeCover(t.colorA || '#e8520f', t.colorB || '#d08e30', t.title);
          return `<div class="track" data-id="${t.id}" role="row" tabindex="0">
  <div class="track-num"><span>${i + 1}</span><span class="track-play">▶</span></div>
  <div class="track-cover">${coverHtml}</div>
  <div class="track-info"><div class="track-title">${t.title}</div><div class="track-artist">${t.artist}</div></div>
  <div class="track-album">${t.album || ''}</div>
  <div class="track-duration">${t.duration || '—'}</div>
  <button class="track-like" data-id="${t.id}">♡</button>
</div>`;
        }).join('');
        $$('.track', list).forEach(row => row.addEventListener('click', () => window.playTrack(row.dataset.id)));
        $$('.track-like', list).forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); btn.classList.toggle('liked'); }));
      });
    });
  });

})();
