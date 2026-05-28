// ================================================================
//  TIKICIA RECORDS — Catálogo
//  ────────────────────────────────────────────────────────────────
//
//  ▶ CÓMO AGREGAR UNA CANCIÓN (3 pasos):
//
//  1. Subí el MP3 a la carpeta  assets/audio/  en GitHub
//     (entrá a esa carpeta → "Add file" → "Upload files")
//
//  2. Copiá uno de los bloques de canción de abajo
//
//  3. Pegalo antes de la línea ══ y cambiá los datos.
//     Guardá con "Commit changes" y listo ✓
//
// ================================================================

(function () { "use strict";


// ================================================================
//  🎵 CANCIONES
// ================================================================

window.__TRACKS__ = [

  // ── Canción 1 ──
  {
    id: "t01",
    title:    "El Viejón",
    artist:   "Jaxdane Flores",
    album:    "Sencillo",
    duration: "4:22",
    audio:    "audio/El viejon.mp3",
    cover:    "",
    colorA: "#c8341a", colorB: "#d08e30"
  },

  // ── Canción 2 ──
  {
    id: "t02",
    title:    "La Fiesta No Para",
    artist:   "Los Karkis",
    album:    "Fiesta Brava",
    duration: "3:42",
    audio:    "",
    cover:    "",
    colorA: "#8e2d9a", colorB: "#c8341a"
  },

  // ── Canción 3 ──
  {
    id: "t03",
    title:    "Cumbia del Sol",
    artist:   "Tropikana Sound",
    album:    "Tropikana",
    duration: "4:15",
    audio:    "",
    cover:    "",
    colorA: "#d08e30", colorB: "#e8520f"
  },

  // ── Canción 4 ──
  {
    id: "t04",
    title:    "Sonidero Mix",
    artist:   "DJ Fiesta",
    album:    "Sonidero Vol. 1",
    duration: "5:08",
    audio:    "",
    cover:    "",
    colorA: "#8e2d9a", colorB: "#2c56c0"
  },

  // ── Canción 5 ──
  {
    id: "t05",
    title:    "Brisas del Pacífico",
    artist:   "Manuel del Mar",
    album:    "Mar Adentro",
    duration: "4:50",
    audio:    "",
    cover:    "",
    colorA: "#2c56c0", colorB: "#d08e30"
  },

  // ════════════════════════════════════════════════════════════
  // PARA AGREGAR UNA CANCIÓN NUEVA: copiá este bloque completo,
  // pegalo arriba de esta línea y completá los datos
  // ════════════════════════════════════════════════════════════
  // {
  //   id: "t06",
  //   title:    "Nombre de la canción",
  //   artist:   "Nombre del artista",
  //   album:    "Nombre del álbum o Sencillo",
  //   duration: "3:30",
  //   audio:    "audio/nombre-del-archivo.mp3",
  //   cover:    "assets/covers/nombre-caratula.jpg",
  //   colorA: "#e8520f", colorB: "#d08e30"
  // },

];


// ================================================================
//  👤 ARTISTAS
//  Para las fotos: subí la imagen a assets/covers/ en GitHub
//  y poné el nombre exacto del archivo en "photo"
// ================================================================

window.__ARTISTS__ = [

  {
    id: "a01",
    name:   "Jaxdane Flores",
    genre:  "Norteña",
    photo:  "assets/covers/hf_20260406_210533_a38916b1-57ad-4bfd-8f06-639fb826436a.png",
    colorA: "#c8341a", colorB: "#e8520f"
  },

  {
    id: "a02",
    name:   "Leo Jimenez",
    genre:  "Banda",
    photo:  "assets/covers/Captura.JPG",
    colorA: "#d08e30", colorB: "#e8520f"
  },

  {
    id: "a03",
    name:   "Danny Jimenez",
    genre:  "Sonidero",
    photo:  "assets/covers/WhatsApp Image 2026-04-28 at 2.53.18 PM.jpeg",
    colorA: "#8e2d9a", colorB: "#2c56c0"
  },

  {
    id: "a04",
    name:   "Deylis Enrique Córdoba",
    genre:  "Cumbia",
    photo:  "assets/covers/Captura.JPG",
    colorA: "#c8341a", colorB: "#8e2d9a"
  },

  {
    id: "a05",
    name:   "Los Compitas del ritmo",
    genre:  "Norteño",
    photo:  "assets/covers/499194521_704570635295790_5993493926384281360_n.jpg",
    colorA: "#2c56c0", colorB: "#d08e30"
  },

  {
    id: "a06",
    name:   "Jungle Tico",
    genre:  "Reggae Dancehall",
    photo:  "assets/covers/499194521_704570635295790_5993493926384281360_n.jpg",
    colorA: "#e8520f", colorB: "#d08e30"
  },

  // { id: "a07", name: "Nuevo Artista", genre: "Género", photo: "", colorA: "#c8341a", colorB: "#d08e30" },

];


// ================================================================
//  💿 ÁLBUMES Y LANZAMIENTOS
// ================================================================

window.__RELEASES__ = [
  { id: "r01", title: "Fiesta Brava",      artist: "Los Karkis",      type: "Álbum",  year: 2025, large: true,  cover: "", colorA: "#c8341a", colorB: "#8e2d9a" },
  { id: "r02", title: "Sonidero Vol. 1",   artist: "DJ Fiesta",       type: "EP",     year: 2025, large: false, cover: "", colorA: "#8e2d9a", colorB: "#2c56c0" },
  { id: "r03", title: "Tropikana",         artist: "Tropikana Sound", type: "Álbum",  year: 2024, large: false, cover: "", colorA: "#d08e30", colorB: "#e8520f" },
  { id: "r04", title: "Mar Adentro",       artist: "Manuel del Mar",  type: "Álbum",  year: 2025, large: true,  cover: "", colorA: "#2c56c0", colorB: "#d08e30" },
  { id: "r05", title: "Caliente",          artist: "Kombo Caliente",  type: "EP",     year: 2025, large: false, cover: "", colorA: "#e8520f", colorB: "#d08e30" },
  { id: "r06", title: "Cumbia Pa' Bailar", artist: "Deylis E.C",      type: "Single", year: 2026, large: false, cover: "", colorA: "#c8341a", colorB: "#e8520f" },
];

})();
