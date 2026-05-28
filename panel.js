/* =====================================================================
   TIKICIA RECORDS — Panel de Administración Integrado v2
   Cargá canciones directamente desde el sitio, sin GitHub.
   ===================================================================== */
(function () {
  'use strict';

  const PASS    = 'tikicia2024';   // ← cambiá esto por tu contraseña
  const LS_KEY  = 'tikicia_v2';
  const DB_NAME = 'tikicia_media';

  /* ──────────────────────────────────────────────────────────────
     INDEXEDDB  (guarda los archivos MP3 y carátulas en el navegador)
  ────────────────────────────────────────────────────────────── */
  let _db = null;

  function openDB() {
    if (_db) return Promise.resolve(_db);
    return new Promise((ok, fail) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = e => {
        const d = e.target.result;
        ['audio','covers'].forEach(s => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s); });
      };
      r.onsuccess = e => { _db = e.target.result; ok(_db); };
      r.onerror   = e => fail(e.target.error);
    });
  }
  async function dbPut(store, key, val)  { const d = await openDB(); return new Promise((ok,f) => { const t = d.transaction(store,'readwrite'); t.objectStore(store).put(val,key); t.oncomplete=ok; t.onerror=e=>f(e.target.error); }); }
  async function dbGet(store, key)       { const d = await openDB(); return new Promise((ok,f) => { const t = d.transaction(store,'readonly'); const r = t.objectStore(store).get(key); r.onsuccess=e=>ok(e.target.result||null); r.onerror=e=>f(e.target.error); }); }
  async function dbDel(store, key)       { const d = await openDB(); return new Promise((ok,f) => { const t = d.transaction(store,'readwrite'); t.objectStore(store).delete(key); t.oncomplete=ok; t.onerror=e=>f(e.target.error); }); }
  async function blobUrl(store, key)     { const b = await dbGet(store,key); return b ? URL.createObjectURL(b) : null; }

  /* ──────────────────────────────────────────────────────────────
     CATÁLOGO  (metadatos en localStorage)
  ────────────────────────────────────────────────────────────── */
  let cat = { tracks:[], artists:[], releases:[] };

  function loadCat() {
    try {
      const s = localStorage.getItem(LS_KEY);
      if (s) {
        cat = JSON.parse(s);
      } else {
        cat.tracks   = (window.__TRACKS__   || []).map(t => ({...t}));
        cat.artists  = (window.__ARTISTS__  || []).map(a => ({...a}));
        cat.releases = (window.__RELEASES__ || []).map(r => ({...r}));
      }
    } catch(e) {
      cat = { tracks: window.__TRACKS__||[], artists: window.__ARTISTS__||[], releases: window.__RELEASES__||[] };
    }
    applyToGlobal();
  }

  function saveCat() {
    localStorage.setItem(LS_KEY, JSON.stringify(cat));
    applyToGlobal();
  }

  function applyToGlobal() {
    if (cat.tracks.length)   window.__TRACKS__   = cat.tracks;
    if (cat.artists.length)  window.__ARTISTS__  = cat.artists;
    if (cat.releases.length) window.__RELEASES__ = cat.releases;
  }

  /* ──────────────────────────────────────────────────────────────
     ESTADO DEL FORMULARIO
  ────────────────────────────────────────────────────────────── */
  let editing      = null;   // track being edited
  let pAudioFile   = null;
  let pCoverFile   = null;
  let pAudioUrl    = null;
  let pCoverUrl    = null;

  /* ──────────────────────────────────────────────────────────────
     ESTILOS
  ────────────────────────────────────────────────────────────── */
  function css() {
    const el = document.createElement('style');
    el.textContent = `
/* ── Floating trigger ── */
#adm-fab {
  position:fixed; bottom:calc(var(--player-h,88px) + 14px); right:16px;
  z-index:800; width:40px; height:40px; border-radius:50%;
  background:rgba(8,6,4,.88); border:1px solid rgba(240,232,210,.14);
  color:rgba(240,232,210,.35); font-size:.95rem; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:all .3s; backdrop-filter:blur(8px);
}
#adm-fab:hover { color:rgba(240,232,210,.9); border-color:rgba(240,232,210,.28); transform:scale(1.08); }

/* ── Login modal ── */
#adm-login {
  position:fixed; inset:0; background:rgba(0,0,0,.92); z-index:900;
  display:none; align-items:center; justify-content:center;
}
#adm-login.open { display:flex; }
.adm-login-box {
  background:#0f0b08; border:1px solid rgba(240,232,210,.12);
  padding:2rem; width:min(340px,92vw); display:flex; flex-direction:column; gap:1rem;
}
.adm-login-box h3 { font-family:'Fraunces',serif; font-size:.95rem; font-weight:400;
  color:#c8b896; text-transform:uppercase; letter-spacing:.12em; }
.adm-login-err { font-size:.75rem; color:#c0392b; display:none; }

/* ── Main panel ── */
#adm-panel {
  position:fixed; inset:0; background:#0a0806; z-index:901;
  display:flex; flex-direction:column; overflow:hidden;
  transform:translateY(100%); transition:transform .4s cubic-bezier(.16,1,.3,1);
}
#adm-panel.open { transform:translateY(0); }

.adm-bar {
  display:flex; align-items:center; justify-content:space-between;
  padding:.85rem 1.4rem; border-bottom:1px solid rgba(240,232,210,.08);
  background:#080604; flex-shrink:0; gap:1rem;
}
.adm-bar-brand { font-family:'Fraunces',serif; font-size:.95rem; font-weight:600;
  background:linear-gradient(135deg,#c8341a,#e8520f,#d08e30,#8e2d9a,#2c56c0);
  -webkit-background-clip:text; background-clip:text; color:transparent; letter-spacing:.08em; }
.adm-bar-right { display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; }

.adm-scroll { flex:1; overflow-y:auto; padding:1.4rem; }
.adm-scroll::-webkit-scrollbar { width:4px; }
.adm-scroll::-webkit-scrollbar-thumb { background:rgba(240,232,210,.1); border-radius:2px; }

/* ── Buttons ── */
.ab {
  display:inline-flex; align-items:center; gap:.35rem;
  padding:.42rem .9rem; font:inherit; font-size:.74rem; font-weight:500;
  text-transform:uppercase; letter-spacing:.07em;
  border-radius:2px; cursor:pointer; border:1px solid transparent; transition:all .2s;
}
.ab-primary { background:#e8520f; color:#f0e8d2; border-color:#e8520f; }
.ab-primary:hover { background:#c8341a; }
.ab-outline { background:transparent; color:#c8b896; border-color:rgba(240,232,210,.15); }
.ab-outline:hover { border-color:rgba(240,232,210,.3); color:#f0e8d2; }
.ab-ghost  { background:transparent; color:#8a7660; border-color:transparent; font-size:.95rem; padding:.35rem .55rem; }
.ab-ghost:hover { color:#f0e8d2; }
.ab-danger { background:transparent; color:#c0392b; border-color:rgba(192,57,43,.3); }
.ab-danger:hover { background:rgba(192,57,43,.1); }
.ab-green  { background:transparent; color:#25d366; border-color:rgba(37,211,102,.3); }
.ab-green:hover { background:rgba(37,211,102,.07); }
.ab-sm { padding:.22rem .55rem; font-size:.66rem; }

/* ── Section header ── */
.adm-sec { display:flex; align-items:center; justify-content:space-between; margin-bottom:.9rem; }
.adm-sec h2 { font-family:'Fraunces',serif; font-size:1.1rem; font-weight:300; color:#f0e8d2; }
.adm-sec h2 em { font-style:italic; color:#d08e30; }

/* ── Track table ── */
.adm-tbl { border:1px solid rgba(240,232,210,.08); width:100%; }
.adm-row {
  display:grid; grid-template-columns:48px 1fr auto;
  gap:.8rem; align-items:center; padding:.7rem .9rem;
  border-bottom:1px solid rgba(240,232,210,.06); transition:background .15s;
}
.adm-row:last-child { border-bottom:none; }
.adm-row:hover { background:rgba(240,232,210,.03); }
.adm-thumb {
  width:48px; height:48px; border-radius:2px; overflow:hidden;
  background:#17110a; flex-shrink:0; display:flex; align-items:center;
  justify-content:center; color:rgba(240,232,210,.18); font-size:1.1rem;
}
.adm-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
.adm-info strong { display:block; font-size:.88rem; font-weight:500; color:#f0e8d2; margin-bottom:.1rem; }
.adm-info span { font-size:.74rem; color:#8a7660; }
.adm-row-actions { display:flex; gap:.3rem; align-items:center; }
.adm-dot-on  { width:7px; height:7px; border-radius:50%; background:#25d366; box-shadow:0 0 6px #25d366; }
.adm-dot-off { width:7px; height:7px; border-radius:50%; background:#4a3c2a; }

/* ── Empty ── */
.adm-empty { text-align:center; padding:3rem 1rem; color:#4a3c2a; }
.adm-empty .ei { font-size:2.5rem; margin-bottom:.8rem; opacity:.35; }
.adm-empty p { font-size:.85rem; line-height:1.6; }

/* ── Drawer ── */
.adm-drawer {
  position:fixed; top:0; right:0; bottom:0;
  width:min(500px,100vw); background:#0f0b08;
  border-left:1px solid rgba(240,232,210,.12);
  z-index:902; display:flex; flex-direction:column;
  transform:translateX(110%); transition:transform .35s cubic-bezier(.16,1,.3,1);
  overflow:hidden;
}
.adm-drawer.open { transform:translateX(0); }
.adm-dhead { display:flex; align-items:center; justify-content:space-between;
  padding:.9rem 1.2rem; border-bottom:1px solid rgba(240,232,210,.08); flex-shrink:0; }
.adm-dhead h3 { font-family:'Fraunces',serif; font-size:1rem; font-weight:400; color:#f0e8d2; }
.adm-dbody { flex:1; overflow-y:auto; padding:1.2rem; display:flex; flex-direction:column; gap:.95rem; }
.adm-dbody::-webkit-scrollbar { width:4px; }
.adm-dbody::-webkit-scrollbar-thumb { background:rgba(240,232,210,.1); border-radius:2px; }
.adm-dfoot { padding:.9rem 1.2rem; border-top:1px solid rgba(240,232,210,.08);
  display:flex; gap:.5rem; justify-content:flex-end; flex-shrink:0; }

/* ── Form fields ── */
.af { display:flex; flex-direction:column; gap:.32rem; }
.af label { font-family:'JetBrains Mono',monospace; font-size:.6rem;
  text-transform:uppercase; letter-spacing:.15em; color:#8a7660; }
.af input,.af textarea,.af select {
  background:#17110a; border:1px solid rgba(240,232,210,.1);
  color:#f0e8d2; padding:.62rem .8rem;
  font-family:inherit; font-size:.9rem; border-radius:2px; width:100%;
  transition:border-color .2s, box-shadow .2s;
}
.af input:focus,.af textarea:focus,.af select:focus {
  outline:none; border-color:#e8520f; box-shadow:0 0 0 3px rgba(232,82,15,.1); }
.af select option { background:#17110a; }
.af textarea { resize:vertical; min-height:75px; }
.af-row { display:grid; grid-template-columns:1fr 1fr; gap:.8rem; }
.af-hint { font-size:.68rem; color:#4a3c2a; margin-top:.12rem; }

/* ── Drop zone ── */
.adm-drop {
  border:2px dashed rgba(240,232,210,.13); border-radius:4px;
  padding:1.8rem 1rem; text-align:center; cursor:pointer;
  transition:all .25s; background:rgba(240,232,210,.02);
  position:relative;
}
.adm-drop:hover,.adm-drop.over { border-color:#e8520f; background:rgba(232,82,15,.05); }
.adm-drop.done { border-color:#25d366; border-style:solid; background:rgba(37,211,102,.04); }
.adm-drop-ico { font-size:2.2rem; margin-bottom:.5rem; }
.adm-drop-txt { font-size:.85rem; color:#8a7660; line-height:1.5; }
.adm-drop-txt strong { color:#c8b896; }
.adm-drop-fn { font-size:.75rem; color:#25d366; margin-top:.4rem;
  font-family:'JetBrains Mono',monospace; }

/* ── Audio preview mini ── */
.adm-aprev { background:#17110a; border:1px solid rgba(240,232,210,.08);
  border-radius:2px; padding:.65rem; }
.adm-aprev-lbl { font-size:.65rem; color:#8a7660; margin-bottom:.35rem;
  font-family:'JetBrains Mono',monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.adm-aprev audio { width:100%; height:30px; display:block; }

/* ── Cover picker ── */
.adm-cov-row { display:flex; gap:.75rem; align-items:flex-start; }
.adm-cov-thumb {
  width:72px; height:72px; border-radius:2px; flex-shrink:0;
  border:1px solid rgba(240,232,210,.1); background:#17110a;
  overflow:hidden; display:flex; align-items:center;
  justify-content:center; color:rgba(240,232,210,.18);
  font-size:1.6rem; cursor:pointer; transition:border-color .2s;
}
.adm-cov-thumb:hover { border-color:rgba(240,232,210,.25); }
.adm-cov-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
.adm-cov-right { flex:1; display:flex; flex-direction:column; gap:.4rem; }

/* ── Info box ── */
.adm-info-box { border:1px solid rgba(240,232,210,.08);
  border-left:3px solid #d08e30; padding:.9rem 1.1rem;
  font-size:.8rem; color:#8a7660; line-height:1.65; margin-top:.5rem; }
.adm-info-box strong { color:#d08e30; }
.adm-info-box code { font-family:'JetBrains Mono',monospace; font-size:.78em;
  background:#17110a; padding:.1em .32em; color:#c8b896; }

/* ── Toast ── */
#adm-toast {
  position:fixed; bottom:calc(var(--player-h,88px) + 12px); left:50%;
  transform:translateX(-50%) translateY(16px);
  background:#1a1208; border:1px solid rgba(240,232,210,.15);
  padding:.6rem 1.1rem; font-size:.8rem; color:#c8b896;
  z-index:9999; opacity:0; transition:all .3s; pointer-events:none;
  white-space:nowrap; border-radius:2px;
}
#adm-toast.show { opacity:1; transform:translateX(-50%) translateY(0); }
#adm-toast.ok  { border-left:3px solid #25d366; }
#adm-toast.err { border-left:3px solid #c0392b; }
#adm-toast.inf { border-left:3px solid #d08e30; }
`;
    document.head.appendChild(el);
  }

  /* ──────────────────────────────────────────────────────────────
     HTML
  ────────────────────────────────────────────────────────────── */
  function html() {
    // Floating button
    const fab = Object.assign(document.createElement('button'), {
      id:'adm-fab', title:'Admin', innerHTML:'⚙',
    });
    fab.addEventListener('click', openLogin);
    document.body.appendChild(fab);

    // Login
    ins(`
<div id="adm-login">
  <div class="adm-login-box">
    <h3>⚙ Panel Admin</h3>
    <div class="af"><label>Contraseña</label>
      <input type="password" id="adm-pw" placeholder="••••••••" autocomplete="current-password">
    </div>
    <div class="adm-login-err" id="adm-err">Contraseña incorrecta</div>
    <button class="ab ab-primary" id="adm-login-btn">Entrar →</button>
    <div style="font-size:.7rem;color:#4a3c2a;text-align:center">Contraseña: <code style="color:#8a7660">tikicia2024</code></div>
  </div>
</div>`);

    // Panel
    ins(`
<div id="adm-panel">
  <div class="adm-bar">
    <span class="adm-bar-brand">TIKICIA · Admin</span>
    <div class="adm-bar-right">
      <button class="ab ab-green" id="adm-export-btn">⬇ Exportar data.js</button>
      <button class="ab ab-ghost" id="adm-close-btn" title="Cerrar">✕</button>
    </div>
  </div>
  <div class="adm-scroll" id="adm-scroll">
    <div class="adm-sec">
      <h2>Mis <em>canciones</em></h2>
      <button class="ab ab-primary" id="adm-add-btn">+ Nueva canción</button>
    </div>
    <div id="adm-list"></div>
    <div class="adm-info-box" style="margin-top:1rem">
      <strong>¿Cómo publicar en el sitio web?</strong><br>
      Las canciones se guardan en este navegador y suenan de inmediato.
      Para que aparezcan en otros dispositivos o en tu hosting:<br>
      1. Subí los MP3 a <code>assets/audio/</code> en GitHub / Hostinger<br>
      2. Clic en <strong>⬇ Exportar data.js</strong> y subí ese archivo también
    </div>
  </div>
</div>`);

    // Drawer (form)
    ins(`
<div class="adm-drawer" id="adm-drawer">
  <div class="adm-dhead">
    <h3 id="adm-drawer-title">Nueva canción</h3>
    <button class="ab ab-ghost" id="adm-dclose">✕</button>
  </div>
  <div class="adm-dbody" id="adm-dbody"></div>
  <div class="adm-dfoot">
    <button class="ab ab-outline" id="adm-dcancel">Cancelar</button>
    <button class="ab ab-primary" id="adm-dsave">Guardar canción ◆</button>
  </div>
</div>`);

    // File inputs + toast
    ins(`
<input type="file" id="adm-fi-audio" accept=".mp3,.wav,.ogg,.m4a,.flac" style="display:none">
<input type="file" id="adm-fi-cover" accept="image/*" style="display:none">
<div id="adm-toast"></div>`);

    // Events
    $('adm-login-btn').addEventListener('click', doLogin);
    $('adm-pw').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
    $('adm-close-btn').addEventListener('click', closePanel);
    $('adm-export-btn').addEventListener('click', exportDataJs);
    $('adm-add-btn').addEventListener('click', () => openForm(null));
    $('adm-dclose').addEventListener('click', closeForm);
    $('adm-dcancel').addEventListener('click', closeForm);
    $('adm-dsave').addEventListener('click', saveTrack);
    $('adm-fi-audio').addEventListener('change', e => handleAudioFile(e.target.files[0]));
    $('adm-fi-cover').addEventListener('change', e => handleCoverFile(e.target.files[0]));
  }

  function ins(h) { document.body.insertAdjacentHTML('beforeend', h); }
  function $(id) { return document.getElementById(id); }

  /* ──────────────────────────────────────────────────────────────
     AUTH
  ────────────────────────────────────────────────────────────── */
  function openLogin() {
    $('adm-login').classList.add('open');
    setTimeout(() => $('adm-pw')?.focus(), 80);
  }

  function doLogin() {
    const pw = $('adm-pw').value;
    if (pw === PASS) {
      $('adm-login').classList.remove('open');
      $('adm-pw').value = '';
      $('adm-err').style.display = 'none';
      openPanel();
    } else {
      $('adm-err').style.display = 'block';
      $('adm-pw').value = '';
      $('adm-pw').focus();
    }
  }

  /* ──────────────────────────────────────────────────────────────
     PANEL
  ────────────────────────────────────────────────────────────── */
  function openPanel() {
    $('adm-panel').classList.add('open');
    document.body.style.overflow = 'hidden';
    renderList();
  }

  function closePanel() {
    $('adm-panel').classList.remove('open');
    document.body.style.overflow = '';
    closeForm();
  }

  /* ──────────────────────────────────────────────────────────────
     TRACK LIST RENDER
  ────────────────────────────────────────────────────────────── */
  async function renderList() {
    const el = $('adm-list');
    if (!el) return;
    if (!cat.tracks.length) {
      el.innerHTML = `<div class="adm-empty">
        <div class="ei">🎵</div>
        <p>Todavía no hay canciones.<br>
        Hacé clic en <strong>"+ Nueva canción"</strong>,<br>
        arrastrá tu MP3 y completá los datos.</p>
      </div>`;
      return;
    }

    const rows = await Promise.all(cat.tracks.map(async t => {
      const hasBlob  = !!(await dbGet('audio', t.id).catch(()=>null));
      const hasAudio = hasBlob || !!t.audio;
      const covBlob  = await dbGet('covers', t.id).catch(()=>null);
      const covUrl   = covBlob ? URL.createObjectURL(covBlob) : t.cover || '';
      const genreTag = t.genre ? ` · ${t.genre}` : '';
      const yearTag  = t.year  ? ` · ${t.year}`  : '';

      return `<div class="adm-row">
        <div class="adm-thumb">${covUrl ? `<img src="${covUrl}" alt="">` : '◆'}</div>
        <div class="adm-info">
          <strong>${x(t.title)}</strong>
          <span>${x(t.artist)}${t.album?' · '+x(t.album):''}${yearTag}${genreTag}</span>
        </div>
        <div class="adm-row-actions">
          <div class="${hasAudio?'adm-dot-on':'adm-dot-off'}" title="${hasAudio?'🔊 Tiene audio':'Sin audio aún'}"></div>
          <button class="ab ab-outline ab-sm" onclick="window.__adm.openForm('${t.id}')">✎ Editar</button>
          <button class="ab ab-danger  ab-sm" onclick="window.__adm.deleteTrack('${t.id}')">✕</button>
        </div>
      </div>`;
    }));

    el.innerHTML = `<div class="adm-tbl">${rows.join('')}</div>`;
  }

  /* ──────────────────────────────────────────────────────────────
     FORM DRAWER
  ────────────────────────────────────────────────────────────── */
  function openForm(id) {
    editing   = id ? (cat.tracks.find(t => t.id === id) || null) : null;
    pAudioFile = pCoverFile = null;
    if (pAudioUrl) { URL.revokeObjectURL(pAudioUrl); pAudioUrl = null; }
    if (pCoverUrl) { URL.revokeObjectURL(pCoverUrl); pCoverUrl = null; }

    $('adm-drawer-title').textContent = editing ? 'Editar canción' : 'Nueva canción';
    buildForm();
    $('adm-drawer').classList.add('open');

    // Pre-load existing blobs for editing
    if (editing) {
      dbGet('audio', editing.id).then(b => {
        if (b) {
          pAudioUrl = URL.createObjectURL(b);
          showAudioPreview(editing.audio || 'audio guardado', pAudioUrl);
        }
      }).catch(()=>{});
      dbGet('covers', editing.id).then(b => {
        if (b) {
          pCoverUrl = URL.createObjectURL(b);
          showCoverThumb(pCoverUrl);
        }
      }).catch(()=>{});
    }
  }

  function closeForm() {
    $('adm-drawer').classList.remove('open');
    editing = null;
    pAudioFile = pCoverFile = null;
    if (pAudioUrl) { URL.revokeObjectURL(pAudioUrl); pAudioUrl = null; }
    if (pCoverUrl) { URL.revokeObjectURL(pCoverUrl); pCoverUrl = null; }
  }

  /* ──────────────────────────────────────────────────────────────
     FORM BUILD
  ────────────────────────────────────────────────────────────── */
  function buildForm() {
    const t = editing;
    const genres = ['Cumbia','Chichamera','Norteña','Tropical','Sonidero','Vallenato','Ranchera','Pop Latino','Otro'];
    const gOpts  = genres.map(g => `<option value="${g}" ${t?.genre===g?'selected':''}>${g}</option>`).join('');
    const artOpts = cat.artists.map(a => `<option value="${x(a.name)}" ${t?.artist===a.name?'selected':''}>${x(a.name)}</option>`).join('');
    const albOpts = cat.releases.map(r => `<option value="${x(r.title)}" ${t?.album===r.title?'selected':''}>${x(r.title)}</option>`).join('');

    $('adm-dbody').innerHTML = `

<!-- ════ DROP ZONE ════ -->
<div class="adm-drop ${t?.audio?'done':''}" id="adm-drop"
     onclick="document.getElementById('adm-fi-audio').click()"
     ondragover="event.preventDefault();this.classList.add('over')"
     ondragleave="this.classList.remove('over')"
     ondrop="window.__adm.onDrop(event)">
  <div class="adm-drop-ico">🎵</div>
  <div class="adm-drop-txt">
    <strong>Arrastrá tu MP3 aquí</strong> o tocá para buscar<br>
    <span style="font-size:.72rem;color:#4a3c2a">MP3 · WAV · OGG · M4A</span>
  </div>
  <div class="adm-drop-fn" id="adm-fn">${t?.audio ? '✓ '+t.audio.split('/').pop() : ''}</div>
</div>

<!-- Audio preview -->
<div id="adm-aprev" style="${t?.audio?'':'display:none'}" class="adm-aprev">
  <div class="adm-aprev-lbl" id="adm-aprev-lbl">${t?.audio||''}</div>
  <audio id="adm-audio" controls src="${t?.audio||''}" style="width:100%;height:30px"></audio>
</div>

<!-- ════ DATOS BÁSICOS ════ -->
<div class="af-row">
  <div class="af"><label>Título de la canción *</label>
    <input id="f-title" value="${x(t?.title||'')}" placeholder="Nombre de la canción">
  </div>
  <div class="af"><label>Nombre del artista *</label>
    <input id="f-artist" value="${x(t?.artist||'')}" placeholder="Artista" list="adm-art-list">
    <datalist id="adm-art-list">${artOpts}</datalist>
  </div>
</div>

<div class="af-row">
  <div class="af"><label>Álbum o Single</label>
    <input id="f-album" value="${x(t?.album||'')}" placeholder="Nombre del álbum" list="adm-alb-list">
    <datalist id="adm-alb-list">${albOpts}</datalist>
  </div>
  <div class="af"><label>Año de lanzamiento</label>
    <input id="f-year" type="number" value="${t?.year||new Date().getFullYear()}" min="2000" max="2099">
  </div>
</div>

<div class="af-row">
  <div class="af"><label>Género musical</label>
    <select id="f-genre"><option value="">— Elegir —</option>${gOpts}</select>
  </div>
  <div class="af"><label>Duración</label>
    <input id="f-dur" value="${x(t?.duration||'')}" placeholder="3:42">
    <span class="af-hint">Se detecta automático del MP3</span>
  </div>
</div>

<!-- ════ CARÁTULA ════ -->
<div class="af"><label>Carátula del álbum</label>
  <div class="adm-cov-row">
    <div class="adm-cov-thumb" id="adm-cov-thumb"
         onclick="document.getElementById('adm-fi-cover').click()" title="Cambiar imagen">
      ${t?.cover ? `<img src="${x(t.cover)}" alt="">` : '🖼'}
    </div>
    <div class="adm-cov-right">
      <button class="ab ab-outline" style="width:100%" onclick="document.getElementById('adm-fi-cover').click()">
        📷 Elegir imagen
      </button>
      <span class="af-hint">JPG, PNG, WebP — aparece en el reproductor y la lista</span>
    </div>
  </div>
</div>

<!-- ════ LINKS PROMOCIONALES ════ -->
<div class="af"><label>🎧 Link de Spotify</label>
  <input id="f-spotify" type="url" value="${x(t?.spotify||'')}" placeholder="https://open.spotify.com/track/...">
</div>
<div class="af"><label>▶ Link de YouTube</label>
  <input id="f-youtube" type="url" value="${x(t?.youtube||'')}" placeholder="https://youtube.com/watch?v=...">
</div>

<!-- ════ DESCRIPCIÓN ════ -->
<div class="af"><label>Historia / Descripción de la canción</label>
  <textarea id="f-desc" placeholder="Contá la historia detrás de esta canción, de qué trata, quién la compuso, para qué momento es especial…">${x(t?.description||'')}</textarea>
</div>

<!-- ════ NOTAS DE PRODUCCIÓN (datos útiles para booking) ════ -->
<div class="af-row">
  <div class="af"><label>BPM (tempo)</label>
    <input id="f-bpm" type="number" value="${t?.bpm||''}" placeholder="120">
  </div>
  <div class="af"><label>Clave / Tono</label>
    <input id="f-key" value="${x(t?.key||'')}" placeholder="Do mayor, La menor…">
  </div>
</div>

<input type="hidden" id="f-audio-path" value="${x(t?.audio||'')}">
<input type="hidden" id="f-cover-path" value="${x(t?.cover||'')}">
    `;
  }

  /* ──────────────────────────────────────────────────────────────
     FILE HANDLERS
  ────────────────────────────────────────────────────────────── */
  function handleAudioFile(file) {
    if (!file) return;
    pAudioFile = file;
    if (pAudioUrl) URL.revokeObjectURL(pAudioUrl);
    pAudioUrl = URL.createObjectURL(file);

    const path = 'assets/audio/' + file.name;
    const fpi  = $('f-audio-path'); if (fpi) fpi.value = path;
    const drop = $('adm-drop');     if (drop) { drop.classList.add('done'); drop.classList.remove('over'); }
    const fn   = $('adm-fn');       if (fn)  fn.textContent = '✓ ' + file.name;

    showAudioPreview(path, pAudioUrl);

    // Auto-detect duration
    const tmp = new Audio(pAudioUrl);
    tmp.addEventListener('loadedmetadata', () => {
      const d   = Math.floor(tmp.duration);
      const dur = `${Math.floor(d/60)}:${String(d%60).padStart(2,'0')}`;
      const df  = $('f-dur');
      if (df && !df.value) df.value = dur;
    }, { once:true });

    // Auto-fill title from filename
    const tf = $('f-title');
    if (tf && !tf.value) {
      tf.value = file.name.replace(/\.[^/.]+$/,'').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    }
  }

  function showAudioPreview(label, src) {
    const prev  = $('adm-aprev');
    const lbl   = $('adm-aprev-lbl');
    const audio = $('adm-audio');
    if (prev)  prev.style.display = 'block';
    if (lbl)   lbl.textContent    = label;
    if (audio) audio.src          = src;
  }

  function handleCoverFile(file) {
    if (!file) return;
    pCoverFile = file;
    if (pCoverUrl) URL.revokeObjectURL(pCoverUrl);
    pCoverUrl = URL.createObjectURL(file);

    const path = 'assets/covers/' + file.name;
    const fpi  = $('f-cover-path'); if (fpi) fpi.value = path;
    showCoverThumb(pCoverUrl);
  }

  function showCoverThumb(src) {
    const thumb = $('adm-cov-thumb');
    if (thumb) thumb.innerHTML = `<img src="${src}" alt="">`;
  }

  function onDrop(e) {
    e.preventDefault();
    $('adm-drop')?.classList.remove('over');
    const file = e.dataTransfer?.files[0];
    if (file && (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(file.name))) {
      handleAudioFile(file);
    }
  }

  /* ──────────────────────────────────────────────────────────────
     SAVE TRACK
  ────────────────────────────────────────────────────────────── */
  async function saveTrack() {
    const title  = $('f-title')?.value.trim();
    const artist = $('f-artist')?.value.trim();
    if (!title)  { toast('err','El título es obligatorio'); return; }
    if (!artist) { toast('err','El nombre del artista es obligatorio'); return; }

    const id = editing?.id || 'tr' + Date.now();

    const track = {
      id,
      title,
      artist,
      album:       $('f-album')?.value.trim()   || '',
      year:        parseInt($('f-year')?.value)  || new Date().getFullYear(),
      genre:       $('f-genre')?.value           || '',
      duration:    $('f-dur')?.value.trim()      || '',
      audio:       $('f-audio-path')?.value      || '',
      cover:       $('f-cover-path')?.value      || '',
      spotify:     $('f-spotify')?.value.trim()  || '',
      youtube:     $('f-youtube')?.value.trim()  || '',
      description: $('f-desc')?.value.trim()     || '',
      bpm:         parseInt($('f-bpm')?.value)   || null,
      key:         $('f-key')?.value.trim()      || '',
      colorA:      editing?.colorA || randomColor(artist),
      colorB:      editing?.colorB || randomColor(title),
    };

    // Persist files to IndexedDB
    if (pAudioFile) {
      try { await dbPut('audio', id, pAudioFile); } catch(e) { console.warn(e); }
    }
    if (pCoverFile) {
      try { await dbPut('covers', id, pCoverFile); } catch(e) { console.warn(e); }
    }

    // Update catalog
    if (editing) {
      const i = cat.tracks.findIndex(t => t.id === editing.id);
      if (i > -1) cat.tracks[i] = track; else cat.tracks.push(track);
    } else {
      cat.tracks.push(track);
    }

    saveCat();
    closeForm();
    renderList();
    refreshSite(id, track);
    toast('ok', `"${title}" guardada ✓`);
  }

  /* ──────────────────────────────────────────────────────────────
     DELETE TRACK
  ────────────────────────────────────────────────────────────── */
  async function deleteTrack(id) {
    const t = cat.tracks.find(x => x.id === id);
    if (!confirm(`¿Eliminar "${t?.title||id}"?`)) return;
    cat.tracks = cat.tracks.filter(x => x.id !== id);
    await dbDel('audio', id).catch(()=>{});
    await dbDel('covers', id).catch(()=>{});
    saveCat();
    renderList();
    refreshSite();
    toast('inf', 'Canción eliminada');
  }

  /* ──────────────────────────────────────────────────────────────
     REFRESH MAIN SITE TRACK LIST
  ────────────────────────────────────────────────────────────── */
  function refreshSite(newId, newTrack) {
    const list = document.getElementById('trackList');
    if (!list) return;

    // Re-render using SVG cover generator from main.js
    const makeCov = window.__makeCover || function(a,b,lbl) {
      const id2 = 'g'+Math.random().toString(36).slice(2);
      const ini = (lbl||'TR').split(/\s/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
      return `<svg viewBox="0 0 100 100"><defs><linearGradient id="${id2}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/></linearGradient></defs>
        <rect width="100" height="100" fill="${a}22"/>
        <rect width="100" height="100" fill="url(#${id2})" opacity=".3"/>
        <text x="50" y="60" text-anchor="middle" font-family="serif" font-size="36" fill="${b}" opacity=".9">${ini}</text>
      </svg>`;
    };

    list.innerHTML = cat.tracks.map((t,i) => {
      const cov = t.cover
        ? `<img src="${t.cover}" alt="${t.title}" loading="lazy" onerror="this.outerHTML='${makeCov(t.colorA||'#e8520f',t.colorB||'#d08e30',t.title).replace(/'/g,"&#39;")}'"/>`
        : makeCov(t.colorA||'#e8520f', t.colorB||'#d08e30', t.title);
      return `<div class="track" data-id="${t.id}" tabindex="0">
        <div class="track-num"><span>${i+1}</span><span class="track-play">▶</span></div>
        <div class="track-cover">${cov}</div>
        <div class="track-info">
          <div class="track-title">${t.title}</div>
          <div class="track-artist">${t.artist}</div>
        </div>
        <div class="track-album">${t.album||''}</div>
        <div class="track-duration">${t.duration||'—'}</div>
        <button class="track-like" data-id="${t.id}">♡</button>
      </div>`;
    }).join('');

    list.querySelectorAll('.track').forEach(row => {
      row.addEventListener('click', () => window.__adm.playSong(row.dataset.id));
      row.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){e.preventDefault();window.__adm.playSong(row.dataset.id);} });
    });
    list.querySelectorAll('.track-like').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); btn.classList.toggle('liked'); });
    });
  }

  /* ──────────────────────────────────────────────────────────────
     PLAY WITH INDEXEDDB FALLBACK
  ────────────────────────────────────────────────────────────── */
  async function playSong(id) {
    if (!window.playTrack) return;
    // Check IndexedDB first
    const blob = await dbGet('audio', id).catch(()=>null);
    if (blob) {
      const url  = URL.createObjectURL(blob);
      const t    = cat.tracks.find(t => t.id === id);
      if (t) {
        const orig = t.audio;
        t.audio    = url;
        window.playTrack(id);
        setTimeout(() => { t.audio = orig; URL.revokeObjectURL(url); }, 500);
        return;
      }
    }
    window.playTrack(id);
  }

  /* ──────────────────────────────────────────────────────────────
     EXPORT data.js
  ────────────────────────────────────────────────────────────── */
  function exportDataJs() {
    const js = `// ================================================================
//  TIKICIA RECORDS — Catálogo (exportado ${new Date().toLocaleDateString('es-CR')})
//  Para editar: abrí el panel admin en el sitio (ícono ⚙)
// ================================================================
(function () { "use strict";
window.__TRACKS__   = ${JSON.stringify(cat.tracks,  null, 2)};
window.__ARTISTS__  = ${JSON.stringify(cat.artists, null, 2)};
window.__RELEASES__ = ${JSON.stringify(cat.releases,null, 2)};
})();`;
    const b = new Blob([js],{type:'text/javascript'});
    const u = URL.createObjectURL(b);
    const a = Object.assign(document.createElement('a'),{href:u,download:'data.js'});
    a.click(); URL.revokeObjectURL(u);
    toast('ok','data.js descargado ✓');
  }

  /* ──────────────────────────────────────────────────────────────
     UTILS
  ────────────────────────────────────────────────────────────── */
  function randomColor(s) {
    const palette = ['#c8341a','#e8520f','#d08e30','#8e2d9a','#2c56c0'];
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h*31 + s.charCodeAt(i)) | 0;
    return palette[Math.abs(h) % palette.length];
  }

  let _toast;
  function toast(type, msg) {
    const el = $('adm-toast'); if(!el) return;
    el.textContent = msg; el.className = `show ${type}`;
    clearTimeout(_toast); _toast = setTimeout(()=>el.classList.remove('show'), 3000);
  }

  function x(s) { return String(s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ──────────────────────────────────────────────────────────────
     INIT
  ────────────────────────────────────────────────────────────── */
  function init() {
    loadCat();
    css();
    html();

    // Expose public API for inline handlers
    window.__adm = { openForm, deleteTrack, playSong, exportDataJs, onDrop, renderList };

    // Load catalog into site on startup
    setTimeout(() => refreshSite(), 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
