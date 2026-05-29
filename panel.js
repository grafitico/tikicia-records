/* =====================================================================
   TIKICIA RECORDS — Super Panel Admin v3
   Gestiona canciones, artistas y lanzamientos directo desde el sitio.
   Cambios se reflejan al instante sin recargar la página.
   ===================================================================== */
(function () {
  'use strict';

  const PASS    = 'tikicia2024';
  const LS_KEY  = 'tikicia_v2';
  const GH_KEY  = 'tikicia_gh';
  const DB_NAME = 'tikicia_media';

  /* ──────────────────────────────────────────────────────────────
     INDEXEDDB  (guarda MP3, fotos de artistas y portadas en el browser)
     Claves:  tracks  → track.id
              artists → 'a_' + artist.id
              releases→ 'r_' + release.id
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
  async function dbPut(store, key, val) {
    const d = await openDB();
    return new Promise((ok,f) => { const t=d.transaction(store,'readwrite'); t.objectStore(store).put(val,key); t.oncomplete=ok; t.onerror=e=>f(e.target.error); });
  }
  async function dbGet(store, key) {
    const d = await openDB();
    return new Promise((ok,f) => { const t=d.transaction(store,'readonly'); const r=t.objectStore(store).get(key); r.onsuccess=e=>ok(e.target.result||null); r.onerror=e=>f(e.target.error); });
  }
  async function dbDel(store, key) {
    const d = await openDB();
    return new Promise((ok,f) => { const t=d.transaction(store,'readwrite'); t.objectStore(store).delete(key); t.oncomplete=ok; t.onerror=e=>f(e.target.error); });
  }

  /* ──────────────────────────────────────────────────────────────
     CATÁLOGO  (metadatos en localStorage)
  ────────────────────────────────────────────────────────────── */
  let cat = { tracks:[], artists:[], releases:[] };

  function loadCat() {
    try {
      const s = localStorage.getItem(LS_KEY);
      if (s) {
        cat = JSON.parse(s);
        if (!cat.tracks)   cat.tracks   = [];
        if (!cat.artists)  cat.artists  = [];
        if (!cat.releases) cat.releases = [];
      } else {
        cat.tracks   = (window.__TRACKS__   || []).map(t => ({...t}));
        cat.artists  = (window.__ARTISTS__  || []).map(a => ({...a}));
        cat.releases = (window.__RELEASES__ || []).map(r => ({...r}));
      }
    } catch(e) {
      cat = { tracks:(window.__TRACKS__||[]).slice(), artists:(window.__ARTISTS__||[]).slice(), releases:(window.__RELEASES__||[]).slice() };
    }
    applyToGlobal();
  }
  function saveCat()       { localStorage.setItem(LS_KEY, JSON.stringify(cat)); applyToGlobal(); pushToGitHub(); }
  function applyToGlobal() { window.__TRACKS__=cat.tracks; window.__ARTISTS__=cat.artists; window.__RELEASES__=cat.releases; }

  /* ──────────────────────────────────────────────────────────────
     ESTADO
  ────────────────────────────────────────────────────────────── */
  let currentTab  = 'tracks';
  let editSection = null;   // 'track' | 'artist' | 'release'
  let editing     = null;
  let pAudioFile  = null;
  let pCoverFile  = null;
  let pAudioUrl   = null;
  let pCoverUrl   = null;

  /* ──────────────────────────────────────────────────────────────
     SVG PLACEHOLDER
  ────────────────────────────────────────────────────────────── */
  function mkSvg(a, b, lbl, sz) {
    sz = sz || 100;
    const id  = 'g' + Math.random().toString(36).slice(2);
    const ini = (lbl||'TR').split(/[\s\-_]/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
    return `<svg viewBox="0 0 ${sz} ${sz}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/></linearGradient></defs><rect width="${sz}" height="${sz}" fill="${a}22"/><rect width="${sz}" height="${sz}" fill="url(#${id})" opacity=".35"/><text x="${sz/2}" y="${sz*.62}" text-anchor="middle" font-family="serif" font-size="${sz*.36}" fill="${b}" opacity=".9" font-weight="300">${ini}</text></svg>`;
  }

  /* ──────────────────────────────────────────────────────────────
     CSS
  ────────────────────────────────────────────────────────────── */
  function css() {
    const el = document.createElement('style');
    el.textContent = `
#adm-fab{position:fixed;bottom:calc(var(--player-h,88px) + 14px);right:16px;z-index:800;width:42px;height:42px;border-radius:50%;background:rgba(8,6,4,.9);border:1px solid rgba(240,232,210,.15);color:rgba(240,232,210,.4);font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .3s;backdrop-filter:blur(8px);}
#adm-fab:hover{color:rgba(240,232,210,.95);border-color:rgba(232,82,15,.6);transform:scale(1.1);box-shadow:0 0 14px rgba(232,82,15,.25);}

#adm-login{position:fixed;inset:0;background:rgba(0,0,0,.93);z-index:900;display:none;align-items:center;justify-content:center;}
#adm-login.open{display:flex;}
.adm-login-box{background:#0f0b08;border:1px solid rgba(240,232,210,.12);padding:2.2rem;width:min(360px,94vw);display:flex;flex-direction:column;gap:1.1rem;}
.adm-login-box h3{font-family:'Fraunces',serif;font-size:1rem;font-weight:400;color:#c8b896;text-transform:uppercase;letter-spacing:.12em;}
.adm-login-err{font-size:.75rem;color:#c0392b;display:none;}

#adm-panel{position:fixed;inset:0;background:#09070400;z-index:901;display:flex;flex-direction:column;overflow:hidden;transform:translateY(100%);transition:transform .4s cubic-bezier(.16,1,.3,1);}
#adm-panel.open{transform:translateY(0);}

.adm-bar{display:flex;align-items:center;justify-content:space-between;padding:.75rem 1.3rem;border-bottom:1px solid rgba(240,232,210,.08);background:#080604;flex-shrink:0;gap:.8rem;flex-wrap:wrap;}
.adm-bar-brand{font-family:'Fraunces',serif;font-size:.95rem;font-weight:600;background:linear-gradient(135deg,#c8341a,#e8520f,#d08e30,#8e2d9a,#2c56c0);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:.08em;flex-shrink:0;}
.adm-bar-right{display:flex;gap:.4rem;align-items:center;}

.adm-tabs{display:flex;border-bottom:1px solid rgba(240,232,210,.08);background:#080604;flex-shrink:0;padding:0 1.3rem;overflow-x:auto;}
.adm-tabs::-webkit-scrollbar{display:none;}
.adm-tab{padding:.7rem 1.1rem;font:inherit;font-size:.74rem;font-weight:500;text-transform:uppercase;letter-spacing:.09em;color:#4a3c2a;background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;transition:all .2s;white-space:nowrap;}
.adm-tab:hover{color:#c8b896;}
.adm-tab.active{color:#f0e8d2;border-bottom-color:#e8520f;}

.adm-scroll{flex:1;overflow-y:auto;background:#0a0806;padding:1.4rem;}
.adm-scroll::-webkit-scrollbar{width:4px;}
.adm-scroll::-webkit-scrollbar-thumb{background:rgba(240,232,210,.1);border-radius:2px;}

.adm-pane{display:none;}
.adm-pane.active{display:block;}

.adm-sec{display:flex;align-items:center;justify-content:space-between;margin-bottom:.9rem;}
.adm-sec h2{font-family:'Fraunces',serif;font-size:1.05rem;font-weight:300;color:#f0e8d2;}
.adm-sec h2 em{font-style:italic;color:#d08e30;}

.ab{display:inline-flex;align-items:center;gap:.35rem;padding:.44rem .95rem;font:inherit;font-size:.74rem;font-weight:500;text-transform:uppercase;letter-spacing:.07em;border-radius:2px;cursor:pointer;border:1px solid transparent;transition:all .2s;}
.ab-primary{background:#e8520f;color:#f0e8d2;border-color:#e8520f;}
.ab-primary:hover{background:#c8341a;}
.ab-outline{background:transparent;color:#c8b896;border-color:rgba(240,232,210,.16);}
.ab-outline:hover{border-color:rgba(240,232,210,.32);color:#f0e8d2;}
.ab-ghost{background:transparent;color:#8a7660;border:none;font-size:.95rem;padding:.35rem .6rem;}
.ab-ghost:hover{color:#f0e8d2;}
.ab-danger{background:transparent;color:#c0392b;border-color:rgba(192,57,43,.32);}
.ab-danger:hover{background:rgba(192,57,43,.1);}
.ab-green{background:transparent;color:#25d366;border-color:rgba(37,211,102,.32);}
.ab-green:hover{background:rgba(37,211,102,.07);}
.ab-sm{padding:.22rem .55rem;font-size:.66rem;}

.adm-tbl{border:1px solid rgba(240,232,210,.08);width:100%;border-radius:2px;overflow:hidden;}
.adm-row{display:grid;grid-template-columns:54px 1fr auto;gap:.85rem;align-items:center;padding:.75rem .95rem;border-bottom:1px solid rgba(240,232,210,.05);transition:background .15s;}
.adm-row:last-child{border-bottom:none;}
.adm-row:hover{background:rgba(240,232,210,.03);}
.adm-thumb{width:54px;height:54px;border-radius:2px;overflow:hidden;background:#17110a;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:rgba(240,232,210,.18);font-size:1.2rem;}
.adm-thumb img,.adm-thumb svg{width:100%;height:100%;object-fit:cover;display:block;}
.adm-info strong{display:block;font-size:.88rem;font-weight:500;color:#f0e8d2;margin-bottom:.12rem;}
.adm-info span{font-size:.73rem;color:#8a7660;}
.adm-row-actions{display:flex;gap:.3rem;align-items:center;}
.adm-dot-on{width:7px;height:7px;border-radius:50%;background:#25d366;box-shadow:0 0 6px #25d366;flex-shrink:0;}
.adm-dot-off{width:7px;height:7px;border-radius:50%;background:#2a1f14;flex-shrink:0;}

.adm-empty{text-align:center;padding:3.5rem 1rem;color:#4a3c2a;}
.adm-empty .ei{font-size:2.8rem;margin-bottom:.9rem;opacity:.3;}
.adm-empty p{font-size:.85rem;line-height:1.7;}

.adm-drawer{position:fixed;top:0;right:0;bottom:0;width:min(520px,100vw);background:#0d0908;border-left:1px solid rgba(240,232,210,.1);z-index:902;display:flex;flex-direction:column;transform:translateX(110%);transition:transform .36s cubic-bezier(.16,1,.3,1);overflow:hidden;}
.adm-drawer.open{transform:translateX(0);}
.adm-dhead{display:flex;align-items:center;justify-content:space-between;padding:.95rem 1.3rem;border-bottom:1px solid rgba(240,232,210,.08);flex-shrink:0;}
.adm-dhead h3{font-family:'Fraunces',serif;font-size:1rem;font-weight:400;color:#f0e8d2;}
.adm-dbody{flex:1;overflow-y:auto;padding:1.3rem;display:flex;flex-direction:column;gap:1rem;}
.adm-dbody::-webkit-scrollbar{width:4px;}
.adm-dbody::-webkit-scrollbar-thumb{background:rgba(240,232,210,.1);border-radius:2px;}
.adm-dfoot{padding:.95rem 1.3rem;border-top:1px solid rgba(240,232,210,.08);display:flex;gap:.5rem;justify-content:flex-end;flex-shrink:0;}

.af{display:flex;flex-direction:column;gap:.34rem;}
.af label{font-family:'JetBrains Mono',monospace;font-size:.59rem;text-transform:uppercase;letter-spacing:.15em;color:#8a7660;}
.af input,.af textarea,.af select{background:#17110a;border:1px solid rgba(240,232,210,.1);color:#f0e8d2;padding:.64rem .85rem;font-family:inherit;font-size:.9rem;border-radius:2px;width:100%;transition:border-color .2s,box-shadow .2s;}
.af input:focus,.af textarea:focus,.af select:focus{outline:none;border-color:#e8520f;box-shadow:0 0 0 3px rgba(232,82,15,.1);}
.af select option{background:#17110a;}
.af textarea{resize:vertical;min-height:80px;}
.af-row{display:grid;grid-template-columns:1fr 1fr;gap:.85rem;}
.af-hint{font-size:.67rem;color:#4a3c2a;margin-top:.1rem;}
.af-check{display:flex;flex-direction:row;align-items:center;gap:.55rem;cursor:pointer;padding:.5rem 0;}
.af-check input[type=checkbox]{width:16px;height:16px;accent-color:#e8520f;cursor:pointer;flex-shrink:0;}
.af-check span{font-size:.83rem;color:#c8b896;}

.adm-drop{border:2px dashed rgba(240,232,210,.12);border-radius:4px;padding:1.9rem 1rem;text-align:center;cursor:pointer;transition:all .25s;background:rgba(240,232,210,.02);}
.adm-drop:hover,.adm-drop.over{border-color:#e8520f;background:rgba(232,82,15,.05);}
.adm-drop.done{border-color:#25d366;border-style:solid;background:rgba(37,211,102,.04);}
.adm-drop-ico{font-size:2.4rem;margin-bottom:.5rem;}
.adm-drop-txt{font-size:.85rem;color:#8a7660;line-height:1.5;}
.adm-drop-txt strong{color:#c8b896;}
.adm-drop-fn{font-size:.75rem;color:#25d366;margin-top:.4rem;font-family:'JetBrains Mono',monospace;}

.adm-aprev{background:#17110a;border:1px solid rgba(240,232,210,.08);border-radius:2px;padding:.7rem;}
.adm-aprev-lbl{font-size:.65rem;color:#8a7660;margin-bottom:.38rem;font-family:'JetBrains Mono',monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.adm-aprev audio{width:100%;height:30px;display:block;}

.adm-cov-row{display:flex;gap:.8rem;align-items:flex-start;}
.adm-cov-thumb{width:84px;height:84px;border-radius:3px;flex-shrink:0;border:1px solid rgba(240,232,210,.1);background:#17110a;overflow:hidden;display:flex;align-items:center;justify-content:center;color:rgba(240,232,210,.18);font-size:1.8rem;cursor:pointer;transition:border-color .2s;}
.adm-cov-thumb:hover{border-color:rgba(240,232,210,.3);}
.adm-cov-thumb img,.adm-cov-thumb svg{width:100%;height:100%;object-fit:cover;display:block;}
.adm-cov-right{flex:1;display:flex;flex-direction:column;gap:.4rem;}

#adm-toast{position:fixed;bottom:calc(var(--player-h,88px) + 14px);left:50%;transform:translateX(-50%) translateY(16px);background:#1a1208;border:1px solid rgba(240,232,210,.15);padding:.65rem 1.2rem;font-size:.8rem;color:#c8b896;z-index:9999;opacity:0;transition:all .3s;pointer-events:none;white-space:nowrap;border-radius:2px;}
#adm-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
#adm-toast.ok {border-left:3px solid #25d366;}
#adm-toast.err{border-left:3px solid #c0392b;}
#adm-toast.inf{border-left:3px solid #d08e30;}
`;
    document.head.appendChild(el);
  }

  /* ──────────────────────────────────────────────────────────────
     HTML
  ────────────────────────────────────────────────────────────── */
  function html() {
    const fab = Object.assign(document.createElement('button'), { id:'adm-fab', title:'Panel Admin', innerHTML:'⚙' });
    fab.addEventListener('click', openLogin);
    document.body.appendChild(fab);

    ins(`
<div id="adm-login">
  <div class="adm-login-box">
    <h3>⚙ Panel Admin · Tikicia</h3>
    <div class="af">
      <label>Contraseña</label>
      <input type="password" id="adm-pw" placeholder="••••••••" autocomplete="current-password">
    </div>
    <div class="adm-login-err" id="adm-err">Contraseña incorrecta</div>
    <button class="ab ab-primary" id="adm-login-btn" style="width:100%">Entrar al panel →</button>
  </div>
</div>

<div id="adm-panel">
  <div class="adm-bar">
    <span class="adm-bar-brand">✦ TIKICIA · Super Panel</span>
    <div class="adm-bar-right">
      <button class="ab ab-green" id="adm-export-btn">⬇ Exportar data.js</button>
      <button class="ab ab-ghost" id="adm-close-btn" title="Cerrar panel">✕</button>
    </div>
  </div>
  <div class="adm-tabs">
    <button class="adm-tab active" data-tab="tracks">🎵 Canciones</button>
    <button class="adm-tab" data-tab="artists">👤 Artistas</button>
    <button class="adm-tab" data-tab="releases">💿 Lanzamientos</button>
    <button class="adm-tab" data-tab="github">⚙ GitHub</button>
  </div>
  <div class="adm-scroll">
    <div class="adm-pane active" id="adm-pane-tracks">
      <div class="adm-sec">
        <h2>Mis <em>canciones</em></h2>
        <button class="ab ab-primary" id="adm-add-track">+ Nueva canción</button>
      </div>
      <div id="adm-list-tracks"></div>
    </div>
    <div class="adm-pane" id="adm-pane-artists">
      <div class="adm-sec">
        <h2>Nuestros <em>artistas</em></h2>
        <button class="ab ab-primary" id="adm-add-artist">+ Nuevo artista</button>
      </div>
      <div id="adm-list-artists"></div>
    </div>
    <div class="adm-pane" id="adm-pane-releases">
      <div class="adm-sec">
        <h2>Álbumes y <em>lanzamientos</em></h2>
        <button class="ab ab-primary" id="adm-add-release">+ Nuevo lanzamiento</button>
      </div>
      <div id="adm-list-releases"></div>
    </div>
    <div class="adm-pane" id="adm-pane-github">
      <div class="adm-sec"><h2>Sync automático con <em>GitHub</em></h2></div>
      <div style="display:flex;flex-direction:column;gap:1rem;max-width:500px">
        <p style="font-size:.82rem;color:#8a7660;line-height:1.6">Con esto, cada vez que guardes una canción, artista o lanzamiento, <strong style="color:#c8b896">se actualiza data.js en GitHub automáticamente</strong> y el sitio se ve igual en todos los dispositivos.</p>
        <div class="af">
          <label>Token de GitHub (Personal Access Token)</label>
          <input type="password" id="gh-token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx">
          <span class="af-hint">Necesita permiso <strong>Contents (write)</strong> &nbsp;·&nbsp; <a href="https://github.com/settings/tokens/new?scopes=public_repo&description=Tikicia+Records+Admin" target="_blank" rel="noopener" style="color:#d08e30">Crear token →</a></span>
        </div>
        <div class="af-row">
          <div class="af"><label>Usuario / Organización</label><input id="gh-owner" value="grafitico" placeholder="grafitico"></div>
          <div class="af"><label>Repositorio</label><input id="gh-repo" value="tikicia-records" placeholder="tikicia-records"></div>
        </div>
        <div class="af">
          <label>Rama (branch)</label>
          <input id="gh-branch" value="main" placeholder="main">
          <span class="af-hint">La rama donde está publicado el sitio (generalmente "main")</span>
        </div>
        <div style="display:flex;gap:.6rem;flex-wrap:wrap">
          <button class="ab ab-primary" id="gh-save-btn">Guardar config ◆</button>
          <button class="ab ab-outline" id="gh-test-btn">Probar conexión</button>
        </div>
        <div id="gh-status" style="font-size:.78rem;line-height:1.6"></div>
        <p style="font-size:.72rem;color:#4a3c2a;line-height:1.5;border-top:1px solid rgba(240,232,210,.06);padding-top:.8rem">⚠ El token se guarda solo en este navegador. No lo compartás.</p>
      </div>
    </div>
  </div>
</div>

<div class="adm-drawer" id="adm-drawer">
  <div class="adm-dhead">
    <h3 id="adm-drawer-title">—</h3>
    <button class="ab ab-ghost" id="adm-dclose">✕</button>
  </div>
  <div class="adm-dbody" id="adm-dbody"></div>
  <div class="adm-dfoot">
    <button class="ab ab-outline" id="adm-dcancel">Cancelar</button>
    <button class="ab ab-primary" id="adm-dsave">Guardar ◆</button>
  </div>
</div>

<input type="file" id="adm-fi-audio" accept=".mp3,.wav,.ogg,.m4a,.flac" style="display:none">
<input type="file" id="adm-fi-cover" accept="image/*" style="display:none">
<div id="adm-toast"></div>`);

    $('adm-login-btn').addEventListener('click', doLogin);
    $('adm-pw').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
    $('adm-close-btn').addEventListener('click', closePanel);
    $('adm-export-btn').addEventListener('click', exportDataJs);
    $('adm-add-track').addEventListener('click', () => openForm('track', null));
    $('adm-add-artist').addEventListener('click', () => openForm('artist', null));
    $('adm-add-release').addEventListener('click', () => openForm('release', null));
    $('adm-dclose').addEventListener('click', closeForm);
    $('adm-dcancel').addEventListener('click', closeForm);
    $('adm-dsave').addEventListener('click', saveForm);
    $('adm-fi-audio').addEventListener('change', e => handleAudioFile(e.target.files[0]));
    $('adm-fi-cover').addEventListener('change', e => handleCoverFile(e.target.files[0]));
    document.querySelectorAll('.adm-tab').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

    $('gh-save-btn').addEventListener('click', () => {
      saveGhCfg({ token: $('gh-token').value.trim(), owner: $('gh-owner').value.trim(), repo: $('gh-repo').value.trim(), branch: $('gh-branch').value.trim() || 'main' });
      toast('ok', 'Configuración de GitHub guardada ✓');
    });
    $('gh-test-btn').addEventListener('click', async () => {
      const c = ghCfg();
      if (!c.token) { toast('err', 'Primero ingresá el token'); return; }
      const st = $('gh-status'); st.style.color = '#8a7660'; st.textContent = 'Probando conexión…';
      try {
        const r = await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}/contents/data.js`, { headers: { 'Authorization': 'token ' + c.token, 'Accept': 'application/vnd.github.v3+json' } });
        if (r.ok) { st.style.color = '#25d366'; st.textContent = '✓ Conexión exitosa · Token válido y repositorio accesible'; }
        else { st.style.color = '#c0392b'; st.textContent = '✕ Error ' + r.status + ' · Verificá el token y el nombre del repositorio'; }
      } catch (e) { st.style.color = '#c0392b'; st.textContent = '✕ Sin conexión a internet'; }
    });
  }

  function ins(h) { document.body.insertAdjacentHTML('beforeend', h); }
  function $(id)  { return document.getElementById(id); }

  /* ──────────────────────────────────────────────────────────────
     TABS
  ────────────────────────────────────────────────────────────── */
  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.adm-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.adm-pane').forEach(p => p.classList.toggle('active', p.id === 'adm-pane-' + tab));
    if (tab === 'tracks')   renderTracks();
    if (tab === 'artists')  renderArtists();
    if (tab === 'releases') renderReleases();
    if (tab === 'github')   renderGhSettings();
  }

  /* ──────────────────────────────────────────────────────────────
     AUTH
  ────────────────────────────────────────────────────────────── */
  function openLogin() { $('adm-login').classList.add('open'); setTimeout(()=>$('adm-pw')?.focus(),80); }

  function doLogin() {
    if ($('adm-pw').value === PASS) {
      $('adm-login').classList.remove('open'); $('adm-pw').value=''; $('adm-err').style.display='none';
      openPanel();
    } else {
      $('adm-err').style.display='block'; $('adm-pw').value=''; $('adm-pw').focus();
    }
  }

  /* ──────────────────────────────────────────────────────────────
     PANEL
  ────────────────────────────────────────────────────────────── */
  function openPanel() { $('adm-panel').classList.add('open'); document.body.style.overflow='hidden'; renderTracks(); }
  function closePanel(){ $('adm-panel').classList.remove('open'); document.body.style.overflow=''; closeForm(); }

  /* ──────────────────────────────────────────────────────────────
     RENDER LISTAS ADMIN
  ────────────────────────────────────────────────────────────── */
  async function renderTracks() {
    const el = $('adm-list-tracks'); if (!el) return;
    if (!cat.tracks.length) {
      el.innerHTML = `<div class="adm-empty"><div class="ei">🎵</div><p>Sin canciones aún.<br>Tocá <strong>+ Nueva canción</strong> para agregar.</p></div>`;
      return;
    }
    const rows = await Promise.all(cat.tracks.map(async t => {
      const hasAudio = !!(await dbGet('audio', t.id).catch(()=>null)) || !!t.audio;
      const covBlob  = await dbGet('covers', t.id).catch(()=>null);
      const artPh    = cat.artists.find(a=>a.name===t.artist)?.photo||'';
      const covSrc   = covBlob ? URL.createObjectURL(covBlob) : (t.cover||artPh||'');
      const meta     = [t.artist, t.album, t.year, t.genre].filter(Boolean).join(' · ');
      const thumb    = covSrc ? `<img src="${covSrc}" alt="">` : mkSvg(t.colorA||'#e8520f',t.colorB||'#d08e30',t.title);
      return `<div class="adm-row">
        <div class="adm-thumb">${thumb}</div>
        <div class="adm-info"><strong>${x(t.title)}</strong><span>${x(meta)}</span></div>
        <div class="adm-row-actions">
          <div class="${hasAudio?'adm-dot-on':'adm-dot-off'}" title="${hasAudio?'✔ Tiene audio':'Sin audio'}"></div>
          <button class="ab ab-outline ab-sm" onclick="window.__adm.openForm('track','${t.id}')">✎</button>
          <button class="ab ab-danger  ab-sm" onclick="window.__adm.deleteItem('track','${t.id}')">✕</button>
        </div>
      </div>`;
    }));
    el.innerHTML = `<div class="adm-tbl">${rows.join('')}</div>`;
  }

  async function renderArtists() {
    const el = $('adm-list-artists'); if (!el) return;
    if (!cat.artists.length) {
      el.innerHTML = `<div class="adm-empty"><div class="ei">👤</div><p>Sin artistas aún.<br>Tocá <strong>+ Nuevo artista</strong> para agregar.</p></div>`;
      return;
    }
    const rows = await Promise.all(cat.artists.map(async a => {
      const blob   = await dbGet('covers','a_'+a.id).catch(()=>null);
      const imgSrc = blob ? URL.createObjectURL(blob) : (a.photo||'');
      const thumb  = imgSrc ? `<img src="${imgSrc}" alt="">` : mkSvg(a.colorA||'#e8520f',a.colorB||'#d08e30',a.name);
      return `<div class="adm-row">
        <div class="adm-thumb">${thumb}</div>
        <div class="adm-info"><strong>${x(a.name)}</strong><span>${x(a.genre||'—')}</span></div>
        <div class="adm-row-actions">
          <button class="ab ab-outline ab-sm" onclick="window.__adm.openForm('artist','${a.id}')">✎</button>
          <button class="ab ab-danger  ab-sm" onclick="window.__adm.deleteItem('artist','${a.id}')">✕</button>
        </div>
      </div>`;
    }));
    el.innerHTML = `<div class="adm-tbl">${rows.join('')}</div>`;
  }

  async function renderReleases() {
    const el = $('adm-list-releases'); if (!el) return;
    if (!cat.releases.length) {
      el.innerHTML = `<div class="adm-empty"><div class="ei">💿</div><p>Sin lanzamientos aún.<br>Tocá <strong>+ Nuevo lanzamiento</strong> para agregar.</p></div>`;
      return;
    }
    const rows = await Promise.all(cat.releases.map(async r => {
      const blob   = await dbGet('covers','r_'+r.id).catch(()=>null);
      const artPh  = cat.artists.find(a=>a.name===r.artist)?.photo||'';
      const covSrc = blob ? URL.createObjectURL(blob) : (r.cover||artPh||'');
      const thumb  = covSrc ? `<img src="${covSrc}" alt="">` : mkSvg(r.colorA||'#e8520f',r.colorB||'#d08e30',r.title);
      const meta   = [r.type, r.year, r.large?'⭐ Destacado':''].filter(Boolean).join(' · ');
      return `<div class="adm-row">
        <div class="adm-thumb">${thumb}</div>
        <div class="adm-info"><strong>${x(r.title)}</strong><span>${x(r.artist)} · ${x(meta)}</span></div>
        <div class="adm-row-actions">
          <button class="ab ab-outline ab-sm" onclick="window.__adm.openForm('release','${r.id}')">✎</button>
          <button class="ab ab-danger  ab-sm" onclick="window.__adm.deleteItem('release','${r.id}')">✕</button>
        </div>
      </div>`;
    }));
    el.innerHTML = `<div class="adm-tbl">${rows.join('')}</div>`;
  }

  /* ──────────────────────────────────────────────────────────────
     FORM OPEN / CLOSE
  ────────────────────────────────────────────────────────────── */
  function openForm(section, id) {
    editSection = section;
    pAudioFile = pCoverFile = null;
    if (pAudioUrl){ URL.revokeObjectURL(pAudioUrl); pAudioUrl=null; }
    if (pCoverUrl){ URL.revokeObjectURL(pCoverUrl); pCoverUrl=null; }

    if (section==='track') {
      editing = id ? (cat.tracks.find(t=>t.id===id)||null) : null;
      $('adm-drawer-title').textContent = editing ? 'Editar canción' : 'Nueva canción';
      $('adm-dsave').textContent = (editing?'Guardar cambios':'Guardar canción')+' ◆';
      buildTrackForm();
      if (editing) {
        dbGet('audio',editing.id).then(b=>{if(b){pAudioUrl=URL.createObjectURL(b);showAudioPreview(editing.audio||'audio guardado',pAudioUrl);}}).catch(()=>{});
        dbGet('covers',editing.id).then(b=>{if(b){pCoverUrl=URL.createObjectURL(b);showCoverThumb(pCoverUrl);}}).catch(()=>{});
      }
    } else if (section==='artist') {
      editing = id ? (cat.artists.find(a=>a.id===id)||null) : null;
      $('adm-drawer-title').textContent = editing ? 'Editar artista' : 'Nuevo artista';
      $('adm-dsave').textContent = (editing?'Guardar cambios':'Guardar artista')+' ◆';
      buildArtistForm();
      if (editing) dbGet('covers','a_'+editing.id).then(b=>{if(b){pCoverUrl=URL.createObjectURL(b);showCoverThumb(pCoverUrl);}}).catch(()=>{});
    } else if (section==='release') {
      editing = id ? (cat.releases.find(r=>r.id===id)||null) : null;
      $('adm-drawer-title').textContent = editing ? 'Editar lanzamiento' : 'Nuevo lanzamiento';
      $('adm-dsave').textContent = (editing?'Guardar cambios':'Guardar lanzamiento')+' ◆';
      buildReleaseForm();
      if (editing) dbGet('covers','r_'+editing.id).then(b=>{if(b){pCoverUrl=URL.createObjectURL(b);showCoverThumb(pCoverUrl);}}).catch(()=>{});
    }
    $('adm-drawer').classList.add('open');
  }

  function closeForm() {
    $('adm-drawer').classList.remove('open');
    editing=editSection=null; pAudioFile=pCoverFile=null;
    if(pAudioUrl){URL.revokeObjectURL(pAudioUrl);pAudioUrl=null;}
    if(pCoverUrl){URL.revokeObjectURL(pCoverUrl);pCoverUrl=null;}
    const fa=$('adm-fi-audio'); if(fa) fa.value='';
    const fc=$('adm-fi-cover'); if(fc) fc.value='';
  }

  /* ──────────────────────────────────────────────────────────────
     FORMULARIO: CANCIÓN
  ────────────────────────────────────────────────────────────── */
  function buildTrackForm() {
    const t = editing;
    const genres = ['Cumbia','Chichamera','Norteña','Tropical','Sonidero','Vallenato','Ranchera','Pop Latino','Reggae Dancehall','Banda','Otro'];
    const gOpts  = genres.map(g=>`<option value="${g}"${t?.genre===g?' selected':''}>${g}</option>`).join('');
    const artOpts = cat.artists.map(a=>`<option value="${x(a.name)}">${x(a.name)}</option>`).join('');
    const albOpts = cat.releases.map(r=>`<option value="${x(r.title)}">${x(r.title)}</option>`).join('');
    $('adm-dbody').innerHTML = `
<div class="adm-drop ${t?.audio?'done':''}" id="adm-drop"
     onclick="document.getElementById('adm-fi-audio').click()"
     ondragover="event.preventDefault();this.classList.add('over')"
     ondragleave="this.classList.remove('over')"
     ondrop="window.__adm.onDrop(event)">
  <div class="adm-drop-ico">🎵</div>
  <div class="adm-drop-txt"><strong>Arrastrá tu MP3 aquí</strong> o tocá para buscar<br><span style="font-size:.72rem;color:#4a3c2a">MP3 · WAV · OGG · M4A · FLAC</span></div>
  <div class="adm-drop-fn" id="adm-fn">${t?.audio?'✓ '+t.audio.split('/').pop():''}</div>
</div>
<div id="adm-aprev" style="${t?.audio?'':'display:none'}" class="adm-aprev">
  <div class="adm-aprev-lbl" id="adm-aprev-lbl">${t?.audio||''}</div>
  <audio id="adm-audio" controls src="${t?.audio||''}" style="width:100%;height:30px"></audio>
</div>
<div class="af-row">
  <div class="af"><label>Título *</label><input id="f-title" value="${x(t?.title||'')}" placeholder="Nombre de la canción"></div>
  <div class="af"><label>Artista *</label><input id="f-artist" value="${x(t?.artist||'')}" placeholder="Artista" list="adm-art-list"><datalist id="adm-art-list">${artOpts}</datalist></div>
</div>
<div class="af-row">
  <div class="af"><label>Álbum / Single</label><input id="f-album" value="${x(t?.album||'')}" placeholder="Nombre del álbum" list="adm-alb-list"><datalist id="adm-alb-list">${albOpts}</datalist></div>
  <div class="af"><label>Año</label><input id="f-year" type="number" value="${t?.year||new Date().getFullYear()}" min="2000" max="2099"></div>
</div>
<div class="af-row">
  <div class="af"><label>Género</label><select id="f-genre"><option value="">— Elegir —</option>${gOpts}</select></div>
  <div class="af"><label>Duración</label><input id="f-dur" value="${x(t?.duration||'')}" placeholder="3:42"><span class="af-hint">Se detecta automático del MP3</span></div>
</div>
<div class="af"><label>Carátula de la canción</label>
  <div class="adm-cov-row">
    <div class="adm-cov-thumb" id="adm-cov-thumb" onclick="document.getElementById('adm-fi-cover').click()">${t?.cover?`<img src="${x(t.cover)}" alt="">`:'🖼'}</div>
    <div class="adm-cov-right">
      <button class="ab ab-outline" style="width:100%" onclick="document.getElementById('adm-fi-cover').click()">📷 Subir imagen</button>
      <span class="af-hint">JPG · PNG · WebP — aparece en lista y reproductor</span>
    </div>
  </div>
</div>
<div class="af"><label>🎧 Link Spotify</label><input id="f-spotify" type="url" value="${x(t?.spotify||'')}" placeholder="https://open.spotify.com/track/..."></div>
<div class="af"><label>▶ Link YouTube</label><input id="f-youtube" type="url" value="${x(t?.youtube||'')}" placeholder="https://youtube.com/watch?v=..."></div>
<div class="af"><label>Historia / Descripción</label><textarea id="f-desc" placeholder="La historia detrás de esta canción…">${x(t?.description||'')}</textarea></div>
<div class="af-row">
  <div class="af"><label>BPM</label><input id="f-bpm" type="number" value="${t?.bpm||''}" placeholder="120"></div>
  <div class="af"><label>Clave / Tono</label><input id="f-key" value="${x(t?.key||'')}" placeholder="Do mayor, La menor…"></div>
</div>
<input type="hidden" id="f-audio-path" value="${x(t?.audio||'')}">
<input type="hidden" id="f-cover-path" value="${x(t?.cover||'')}">`;
  }

  /* ──────────────────────────────────────────────────────────────
     FORMULARIO: ARTISTA
  ────────────────────────────────────────────────────────────── */
  function buildArtistForm() {
    const a = editing;
    const genres = ['Cumbia','Chichamera','Norteña','Tropical','Sonidero','Vallenato','Ranchera','Pop Latino','Reggae Dancehall','Banda','Otro'];
    const gOpts  = genres.map(g=>`<option value="${g}"${a?.genre===g?' selected':''}>${g}</option>`).join('');
    $('adm-dbody').innerHTML = `
<div class="af-row">
  <div class="af"><label>Nombre artístico *</label><input id="f-art-name" value="${x(a?.name||'')}" placeholder="Nombre del artista"></div>
  <div class="af"><label>Género musical</label><select id="f-art-genre"><option value="">— Elegir —</option>${gOpts}</select></div>
</div>
<div class="af"><label>Foto del artista</label>
  <div class="adm-cov-row">
    <div class="adm-cov-thumb" id="adm-cov-thumb" onclick="document.getElementById('adm-fi-cover').click()">${a?.photo?`<img src="${x(a.photo)}" alt="">`:'📷'}</div>
    <div class="adm-cov-right">
      <button class="ab ab-outline" style="width:100%" onclick="document.getElementById('adm-fi-cover').click()">📷 Subir foto</button>
      <span class="af-hint">Se muestra en la sección Artistas del sitio</span>
    </div>
  </div>
</div>
<input type="hidden" id="f-art-photo" value="${x(a?.photo||'')}">`;
  }

  /* ──────────────────────────────────────────────────────────────
     FORMULARIO: LANZAMIENTO
  ────────────────────────────────────────────────────────────── */
  function buildReleaseForm() {
    const r = editing;
    const types  = ['Single','EP','Álbum'];
    const tOpts  = types.map(t=>`<option value="${t}"${r?.type===t?' selected':''}>${t}</option>`).join('');
    const artOpts= cat.artists.map(a=>`<option value="${x(a.name)}"${r?.artist===a.name?' selected':''}>${x(a.name)}</option>`).join('');
    $('adm-dbody').innerHTML = `
<div class="af-row">
  <div class="af"><label>Título del lanzamiento *</label><input id="f-rel-title" value="${x(r?.title||'')}" placeholder="Nombre del álbum o sencillo"></div>
  <div class="af"><label>Artista *</label><input id="f-rel-artist" value="${x(r?.artist||'')}" list="adm-rel-art" placeholder="Artista"><datalist id="adm-rel-art">${artOpts}</datalist></div>
</div>
<div class="af-row">
  <div class="af"><label>Tipo</label><select id="f-rel-type"><option value="">— Elegir —</option>${tOpts}</select></div>
  <div class="af"><label>Año</label><input id="f-rel-year" type="number" value="${r?.year||new Date().getFullYear()}" min="2000" max="2099"></div>
</div>
<div class="af"><label>Portada del lanzamiento</label>
  <div class="adm-cov-row">
    <div class="adm-cov-thumb" id="adm-cov-thumb" onclick="document.getElementById('adm-fi-cover').click()">${r?.cover?`<img src="${x(r.cover)}" alt="">`:'🖼'}</div>
    <div class="adm-cov-right">
      <button class="ab ab-outline" style="width:100%" onclick="document.getElementById('adm-fi-cover').click()">📷 Subir portada</button>
      <span class="af-hint">Aparece en la sección Lanzamientos</span>
    </div>
  </div>
</div>
<label class="af-check">
  <input type="checkbox" id="f-rel-large" ${r?.large?'checked':''}>
  <span>⭐ Destacado — aparece más grande en la grilla</span>
</label>
<input type="hidden" id="f-rel-cover" value="${x(r?.cover||'')}">`;
  }

  /* ──────────────────────────────────────────────────────────────
     FILE HANDLERS
  ────────────────────────────────────────────────────────────── */
  function handleAudioFile(file) {
    if (!file) return;
    pAudioFile = file;
    if (pAudioUrl) URL.revokeObjectURL(pAudioUrl);
    pAudioUrl = URL.createObjectURL(file);
    const path = 'audio/' + file.name;
    const fpi=$('f-audio-path'); if(fpi) fpi.value=path;
    const drop=$('adm-drop');    if(drop){drop.classList.add('done');drop.classList.remove('over');}
    const fn=$('adm-fn');        if(fn)  fn.textContent='✓ '+file.name;
    showAudioPreview(path, pAudioUrl);
    const tmp = new Audio(pAudioUrl);
    tmp.addEventListener('loadedmetadata',()=>{
      const d=Math.floor(tmp.duration); const df=$('f-dur');
      if(df&&!df.value) df.value=`${Math.floor(d/60)}:${String(d%60).padStart(2,'0')}`;
    },{once:true});
    const tf=$('f-title');
    if(tf&&!tf.value) tf.value=file.name.replace(/\.[^/.]+$/,'').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  }

  function showAudioPreview(label, src) {
    const prev=$('adm-aprev'),lbl=$('adm-aprev-lbl'),audio=$('adm-audio');
    if(prev) prev.style.display='block'; if(lbl) lbl.textContent=label; if(audio) audio.src=src;
  }

  function handleCoverFile(file) {
    if (!file) return;
    pCoverFile = file;
    if (pCoverUrl) URL.revokeObjectURL(pCoverUrl);
    pCoverUrl = URL.createObjectURL(file);
    const path = 'assets/covers/' + file.name;
    if(editSection==='track')  { const f=$('f-cover-path');  if(f) f.value=path; }
    if(editSection==='artist') { const f=$('f-art-photo');   if(f) f.value=path; }
    if(editSection==='release'){ const f=$('f-rel-cover');   if(f) f.value=path; }
    showCoverThumb(pCoverUrl);
  }

  function showCoverThumb(src) { const t=$('adm-cov-thumb'); if(t) t.innerHTML=`<img src="${src}" alt="">`; }

  function onDrop(e) {
    e.preventDefault(); $('adm-drop')?.classList.remove('over');
    const file=e.dataTransfer?.files[0];
    if(file&&(file.type.startsWith('audio/')||/\.(mp3|wav|ogg|m4a|flac)$/i.test(file.name))) handleAudioFile(file);
  }

  /* ──────────────────────────────────────────────────────────────
     SAVE DISPATCHER
  ────────────────────────────────────────────────────────────── */
  function saveForm() {
    if(editSection==='track')   saveTrack();
    if(editSection==='artist')  saveArtist();
    if(editSection==='release') saveRelease();
  }

  /* ──────────────────────────────────────────────────────────────
     GUARDAR CANCIÓN
  ────────────────────────────────────────────────────────────── */
  async function saveTrack() {
    const title=$('f-title')?.value.trim(), artist=$('f-artist')?.value.trim();
    if(!title)  { toast('err','El título es obligatorio'); return; }
    if(!artist) { toast('err','El artista es obligatorio'); return; }
    const id = editing?.id || 'tr'+Date.now();
    const track = {
      id, title, artist,
      album:       $('f-album')?.value.trim()   ||'',
      year:        parseInt($('f-year')?.value)  ||new Date().getFullYear(),
      genre:       $('f-genre')?.value           ||'',
      duration:    $('f-dur')?.value.trim()      ||'',
      audio:       $('f-audio-path')?.value      ||'',
      cover:       $('f-cover-path')?.value      ||'',
      spotify:     $('f-spotify')?.value.trim()  ||'',
      youtube:     $('f-youtube')?.value.trim()  ||'',
      description: $('f-desc')?.value.trim()     ||'',
      bpm:         parseInt($('f-bpm')?.value)   ||null,
      key:         $('f-key')?.value.trim()      ||'',
      colorA:      editing?.colorA||randomColor(artist),
      colorB:      editing?.colorB||randomColor(title),
    };
    if(pAudioFile) await dbPut('audio',  id, pAudioFile).catch(console.warn);
    if(pCoverFile) await dbPut('covers', id, pCoverFile).catch(console.warn);
    // Subir archivos a GitHub para que se reproduzcan en todos los dispositivos
    if (ghCfg().token) {
      if (pAudioFile) {
        toast('inf', `Subiendo MP3 a GitHub (${(pAudioFile.size/1024/1024).toFixed(1)} MB)…`);
        const p = await pushFileToGitHub('audio/' + pAudioFile.name, pAudioFile);
        if (p) { track.audio = p; } else { toast('err', 'Error al subir MP3 — quedó guardado localmente'); await new Promise(r=>setTimeout(r,1500)); }
      }
      if (pCoverFile) {
        const p = await pushFileToGitHub('assets/covers/' + pCoverFile.name, pCoverFile);
        if (p) track.cover = p;
      }
    }
    if(editing){ const i=cat.tracks.findIndex(t=>t.id===editing.id); if(i>-1) cat.tracks[i]=track; else cat.tracks.push(track); }
    else cat.tracks.push(track);
    saveCat(); closeForm(); renderTracks(); refreshSite();
    toast('ok',`"${title}" guardada ✓`);
  }

  /* ──────────────────────────────────────────────────────────────
     GUARDAR ARTISTA
  ────────────────────────────────────────────────────────────── */
  async function saveArtist() {
    const name=$('f-art-name')?.value.trim();
    if(!name){ toast('err','El nombre es obligatorio'); return; }
    const id = editing?.id || 'a'+Date.now();
    const artist = {
      id, name,
      genre:  $('f-art-genre')?.value||editing?.genre||'',
      photo:  $('f-art-photo')?.value||editing?.photo||'',
      colorA: editing?.colorA||randomColor(name),
      colorB: editing?.colorB||randomColor(name+'2'),
    };
    if(pCoverFile) await dbPut('covers','a_'+id, pCoverFile).catch(console.warn);
    if (pCoverFile && ghCfg().token) {
      const p = await pushFileToGitHub('assets/covers/' + pCoverFile.name, pCoverFile);
      if (p) artist.photo = p;
    }
    if(editing){ const i=cat.artists.findIndex(a=>a.id===editing.id); if(i>-1) cat.artists[i]=artist; else cat.artists.push(artist); }
    else cat.artists.push(artist);
    saveCat(); closeForm(); renderArtists(); refreshSite();
    toast('ok',`"${name}" guardado ✓`);
  }

  /* ──────────────────────────────────────────────────────────────
     GUARDAR LANZAMIENTO
  ────────────────────────────────────────────────────────────── */
  async function saveRelease() {
    const title=$('f-rel-title')?.value.trim(), artist=$('f-rel-artist')?.value.trim();
    if(!title)  { toast('err','El título es obligatorio'); return; }
    if(!artist) { toast('err','El artista es obligatorio'); return; }
    const id = editing?.id || 'r'+Date.now();
    const release = {
      id, title, artist,
      type:  $('f-rel-type')?.value                       ||'Single',
      year:  parseInt($('f-rel-year')?.value)             ||new Date().getFullYear(),
      large: $('f-rel-large')?.checked                    ||false,
      cover: $('f-rel-cover')?.value||editing?.cover      ||'',
      colorA: editing?.colorA||randomColor(artist),
      colorB: editing?.colorB||randomColor(title),
    };
    if(pCoverFile) await dbPut('covers','r_'+id, pCoverFile).catch(console.warn);
    if (pCoverFile && ghCfg().token) {
      const p = await pushFileToGitHub('assets/covers/' + pCoverFile.name, pCoverFile);
      if (p) release.cover = p;
    }
    if(editing){ const i=cat.releases.findIndex(r=>r.id===editing.id); if(i>-1) cat.releases[i]=release; else cat.releases.push(release); }
    else cat.releases.push(release);
    saveCat(); closeForm(); renderReleases(); refreshSite();
    toast('ok',`"${title}" guardado ✓`);
  }

  /* ──────────────────────────────────────────────────────────────
     ELIMINAR
  ────────────────────────────────────────────────────────────── */
  async function deleteItem(section, id) {
    const labels = { track:'canción', artist:'artista', release:'lanzamiento' };
    const item   = section==='track' ? cat.tracks.find(t=>t.id===id) : section==='artist' ? cat.artists.find(a=>a.id===id) : cat.releases.find(r=>r.id===id);
    if(!confirm(`¿Eliminar "${item?.title||item?.name||id}"?`)) return;
    if(section==='track')  { cat.tracks  =cat.tracks.filter(t=>t.id!==id);  await dbDel('audio',id).catch(()=>{}); await dbDel('covers',id).catch(()=>{}); renderTracks(); }
    if(section==='artist') { cat.artists =cat.artists.filter(a=>a.id!==id); await dbDel('covers','a_'+id).catch(()=>{}); renderArtists(); }
    if(section==='release'){ cat.releases=cat.releases.filter(r=>r.id!==id);await dbDel('covers','r_'+id).catch(()=>{}); renderReleases(); }
    saveCat(); refreshSite();
    toast('inf',`${labels[section]} eliminado`);
  }

  /* ──────────────────────────────────────────────────────────────
     REFRESH SITIO — Catálogo de canciones
  ────────────────────────────────────────────────────────────── */
  async function refreshTrackList() {
    const list = document.getElementById('trackList'); if(!list) return;
    if(refreshTrackList._urls) refreshTrackList._urls.forEach(u=>URL.revokeObjectURL(u));
    refreshTrackList._urls=[];
    const covMap={};
    await Promise.all(cat.tracks.map(async t=>{
      const b=await dbGet('covers',t.id).catch(()=>null);
      if(b){const u=URL.createObjectURL(b);covMap[t.id]=u;refreshTrackList._urls.push(u);}
    }));
    const artPh={};
    cat.artists.forEach(a=>{artPh[a.name]=a.photo||'';});
    list.innerHTML=cat.tracks.map((t,i)=>{
      const src=covMap[t.id]||t.cover||artPh[t.artist]||'';
      const cov=src?`<img src="${src}" alt="${x(t.title)}" loading="lazy" onerror="this.style.display='none'">`:mkSvg(t.colorA||'#e8520f',t.colorB||'#d08e30',t.title);
      return `<div class="track" data-id="${t.id}" tabindex="0">
        <div class="track-num"><span>${i+1}</span><span class="track-play">▶</span></div>
        <div class="track-cover">${cov}</div>
        <div class="track-info"><div class="track-title">${x(t.title)}</div><div class="track-artist">${x(t.artist)}</div></div>
        <div class="track-album">${x(t.album||'')}</div>
        <div class="track-duration">${x(t.duration||'—')}</div>
        <button class="track-like" data-id="${t.id}">♡</button>
      </div>`;
    }).join('');
    list.querySelectorAll('.track').forEach(r=>{ r.addEventListener('click',()=>window.__adm.playSong(r.dataset.id)); r.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();window.__adm.playSong(r.dataset.id);}}); });
    list.querySelectorAll('.track-like').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();btn.classList.toggle('liked');}));
  }

  /* ──────────────────────────────────────────────────────────────
     REFRESH SITIO — Grilla de artistas
  ────────────────────────────────────────────────────────────── */
  async function refreshArtistGrid() {
    const grid=document.getElementById('artistGrid'); if(!grid) return;
    if(refreshArtistGrid._urls) refreshArtistGrid._urls.forEach(u=>URL.revokeObjectURL(u));
    refreshArtistGrid._urls=[];
    const pMap={};
    await Promise.all(cat.artists.map(async a=>{
      const b=await dbGet('covers','a_'+a.id).catch(()=>null);
      if(b){const u=URL.createObjectURL(b);pMap[a.id]=u;refreshArtistGrid._urls.push(u);}
    }));
    grid.innerHTML=cat.artists.map(a=>{
      const src=pMap[a.id]||a.photo||'';
      const img=src?`<img src="${src}" alt="${x(a.name)}" loading="lazy" onerror="this.style.display='none'">`:mkSvg(a.colorA||'#e8520f',a.colorB||'#d08e30',a.name,300);
      return `<div class="artist-card io-reveal in"><div class="artist-img">${img}</div><div class="artist-name">${x(a.name)}</div><div class="artist-genre">${x(a.genre||'')}</div></div>`;
    }).join('');
  }

  /* ──────────────────────────────────────────────────────────────
     REFRESH SITIO — Bento de lanzamientos
  ────────────────────────────────────────────────────────────── */
  async function refreshReleaseBento() {
    const bento=document.getElementById('releaseBento'); if(!bento) return;
    if(refreshReleaseBento._urls) refreshReleaseBento._urls.forEach(u=>URL.revokeObjectURL(u));
    refreshReleaseBento._urls=[];
    const covMap={};
    await Promise.all(cat.releases.map(async r=>{
      const b=await dbGet('covers','r_'+r.id).catch(()=>null);
      if(b){const u=URL.createObjectURL(b);covMap[r.id]=u;refreshReleaseBento._urls.push(u);}
    }));
    const artPh={};
    cat.artists.forEach(a=>{artPh[a.name]=a.photo||'';});
    bento.innerHTML=cat.releases.map(r=>{
      const src=covMap[r.id]||r.cover||artPh[r.artist]||'';
      const img=src?`<img src="${src}" alt="${x(r.title)}" loading="lazy" onerror="this.style.display='none'">`:mkSvg(r.colorA||'#e8520f',r.colorB||'#d08e30',r.title,400);
      const cls=r.large?'release large':'release';
      const ft=cat.tracks.find(t=>t.album===r.title);
      return `<div class="${cls}" data-release="${r.id}" ${ft?`data-track="${ft.id}"`:''} tabindex="0">
        <div class="release-cover">${img}</div>
        <div class="release-info">
          <div class="release-type">${x(r.type)} · ${r.year}</div>
          <div class="release-title">${x(r.title)}</div>
          <div class="release-artist">${x(r.artist)}</div>
        </div>
        <div class="release-play">▶</div>
      </div>`;
    }).join('');
    bento.querySelectorAll('.release[data-track]').forEach(el=>{
      el.addEventListener('click',()=>window.__adm.playSong(el.dataset.track));
      el.addEventListener('keydown',e=>{if(e.key==='Enter')window.__adm.playSong(el.dataset.track);});
    });
  }

  /* ──────────────────────────────────────────────────────────────
     REFRESH TODO EL SITIO
  ────────────────────────────────────────────────────────────── */
  async function refreshSite() {
    await Promise.all([ refreshTrackList(), refreshArtistGrid(), refreshReleaseBento() ]);
  }

  /* ──────────────────────────────────────────────────────────────
     REPRODUCIR con fallback a IndexedDB
  ────────────────────────────────────────────────────────────── */
  async function playSong(id) {
    if(!window.playTrack) return;
    const t=cat.tracks.find(t=>t.id===id);
    if(!t){ window.playTrack(id); return; }
    const [aBlob,cBlob]=await Promise.all([dbGet('audio',id).catch(()=>null),dbGet('covers',id).catch(()=>null)]);
    const origA=t.audio, origC=t.cover;
    let aUrl,cUrl;
    if(aBlob){aUrl=URL.createObjectURL(aBlob);t.audio=aUrl;}
    if(cBlob){cUrl=URL.createObjectURL(cBlob);t.cover=cUrl;}
    if(!t.cover){ const artPh=cat.artists.find(a=>a.name===t.artist)?.photo; if(artPh) t.cover=artPh; }
    window.playTrack(id);
    setTimeout(()=>{ t.audio=origA; t.cover=origC; if(aUrl)URL.revokeObjectURL(aUrl); if(cUrl)URL.revokeObjectURL(cUrl); },3000);
  }

  /* ──────────────────────────────────────────────────────────────
     EXPORTAR data.js
  ────────────────────────────────────────────────────────────── */
  function exportDataJs() {
    const d=new Date().toLocaleDateString('es-CR');
    const js=`// ================================================================
//  TIKICIA RECORDS — Catálogo (exportado ${d})
//  Para editar: abrí el panel admin ⚙ en el sitio
// ================================================================
(function () { "use strict";
window.__TRACKS__   = ${JSON.stringify(cat.tracks,  null,2)};
window.__ARTISTS__  = ${JSON.stringify(cat.artists, null,2)};
window.__RELEASES__ = ${JSON.stringify(cat.releases,null,2)};
})();`;
    const u=URL.createObjectURL(new Blob([js],{type:'text/javascript'}));
    Object.assign(document.createElement('a'),{href:u,download:'data.js'}).click();
    URL.revokeObjectURL(u);
    toast('ok','data.js descargado ✓');
  }

  /* ──────────────────────────────────────────────────────────────
     UTILS
  ────────────────────────────────────────────────────────────── */
  function randomColor(s){
    const p=['#c8341a','#e8520f','#d08e30','#8e2d9a','#2c56c0'];
    let h=0; for(let i=0;i<(s||'').length;i++) h=(h*31+s.charCodeAt(i))|0;
    return p[Math.abs(h)%p.length];
  }
  let _t; function toast(type,msg){ const el=$('adm-toast'); if(!el)return; el.textContent=msg; el.className=`show ${type}`; clearTimeout(_t); _t=setTimeout(()=>el.classList.remove('show'),3200); }
  function x(s){ return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ──────────────────────────────────────────────────────────────
     GITHUB SYNC
  ────────────────────────────────────────────────────────────── */
  function ghCfg()      { try { return JSON.parse(localStorage.getItem(GH_KEY)||'{}'); } catch(e) { return {}; } }
  function saveGhCfg(c) { localStorage.setItem(GH_KEY, JSON.stringify(c)); }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function pushFileToGitHub(ghPath, blob) {
    const c = ghCfg();
    if (!c.token || !c.owner || !c.repo) return null;
    try {
      const encoded = await blobToBase64(blob);
      const api  = `https://api.github.com/repos/${c.owner}/${c.repo}/contents/${ghPath}`;
      const hdrs = { 'Authorization':'token '+c.token, 'Accept':'application/vnd.github.v3+json', 'Content-Type':'application/json' };
      const getRes = await fetch(api, { headers: hdrs });
      const sha    = getRes.ok ? (await getRes.json()).sha : null;
      const body   = { message:'Subir: '+ghPath.split('/').pop(), content: encoded, branch: c.branch||'main' };
      if (sha) body.sha = sha;
      const putRes = await fetch(api, { method:'PUT', headers:hdrs, body:JSON.stringify(body) });
      if (!putRes.ok) { console.warn('[TIKICIA] file push failed', putRes.status); return null; }
      return ghPath;
    } catch(e) { console.warn('[TIKICIA] file push:', e); return null; }
  }

  function renderGhSettings() {
    const c = ghCfg();
    const set = (id, v) => { const el = $(id); if (el) el.value = v || ''; };
    set('gh-token',  c.token  || '');
    set('gh-owner',  c.owner  || 'grafitico');
    set('gh-repo',   c.repo   || 'tikicia-records');
    set('gh-branch', c.branch || 'main');
    const st = $('gh-status');
    if (st && c.token) { st.style.color = '#8a7660'; st.textContent = '✓ Token configurado · probá la conexión para verificar'; }
  }

  function genDataJs() {
    const d = new Date().toLocaleDateString('es-CR');
    return `// TIKICIA RECORDS — Catálogo\n// Auto-generado: ${d} · Panel admin ⚙\n// Para editar: abrí el panel admin en el sitio\n\n(function () { "use strict";\n\nwindow.__TRACKS__   = ${JSON.stringify(cat.tracks,   null, 2)};\n\nwindow.__ARTISTS__  = ${JSON.stringify(cat.artists,  null, 2)};\n\nwindow.__RELEASES__ = ${JSON.stringify(cat.releases, null, 2)};\n\n})();\n`;
  }

  async function pushToGitHub() {
    const c = ghCfg();
    if (!c.token || !c.owner || !c.repo) return;
    toast('inf', 'Publicando en GitHub…');
    try {
      const api  = `https://api.github.com/repos/${c.owner}/${c.repo}/contents/data.js`;
      const hdrs = { 'Authorization': 'token ' + c.token, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' };
      const getRes = await fetch(api, { headers: hdrs });
      const sha    = getRes.ok ? (await getRes.json()).sha : null;
      const encoded = btoa(unescape(encodeURIComponent(genDataJs())));
      const body   = { message: 'Actualizar catálogo desde panel admin', content: encoded, branch: c.branch || 'main' };
      if (sha) body.sha = sha;
      const putRes = await fetch(api, { method: 'PUT', headers: hdrs, body: JSON.stringify(body) });
      if (putRes.ok) {
        toast('ok', 'data.js actualizado en GitHub ✓ · Todos los dispositivos verán los cambios en ~1 min');
      } else {
        const err = await putRes.json().catch(() => ({}));
        toast('err', 'GitHub: ' + (err.message || 'Error al guardar — revisá la config'));
      }
    } catch (e) {
      toast('err', 'Sin conexión a GitHub');
      console.warn('[TIKICIA] GH push:', e);
    }
  }

  /* ──────────────────────────────────────────────────────────────
     INIT
  ────────────────────────────────────────────────────────────── */
  function init() {
    loadCat(); css(); html();
    window.__adm = { openForm, deleteItem, playSong, exportDataJs, onDrop };
    setTimeout(()=>refreshSite(), 200);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
