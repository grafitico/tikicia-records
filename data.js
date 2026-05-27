/* =====================================================================
   TIKICIA RECORDS — Catálogo de datos
   Editar este archivo para agregar/quitar canciones, artistas, álbumes.

   IMPORTANTE: Para que las canciones suenen DE VERDAD, debés:
   1. Poner tus archivos MP3 en /assets/audio/
   2. Poner las carátulas (JPG/WebP) en /assets/covers/
   3. Editar el campo "audio" de cada track abajo:
      audio: "assets/audio/mi-cancion.mp3"
      cover: "assets/covers/mi-album.jpg"

   Si no hay archivo de audio, el reproductor muestra la info pero
   no reproduce sonido (modo demo).
   ===================================================================== */

(function () {
  "use strict";

  // ============ ARTISTAS ============
  // colorA y colorB son colores hex para el SVG placeholder cuando no hay foto.
  // Cuando tengás fotos reales: pone "photo: 'assets/img/nombre.jpg'" en cada artista.
  window.__ARTISTS__ = [
    { id: "karkis",   name: "Los Karkis",       genre: "Chichamera",  colorA: "#ff5a1f", colorB: "#d63384" },
    { id: "tropical", name: "Tropikana Sound",  genre: "Cumbia",      colorA: "#ffb454", colorB: "#ff5a1f" },
    { id: "fiesta",   name: "DJ Fiesta",        genre: "Sonidero",    colorA: "#b8d63a", colorB: "#ffb454" },
    { id: "sabrosa",  name: "La Sabrosa",       genre: "Cumbia Pop",  colorA: "#d63384", colorB: "#ff5a1f" },
    { id: "manuel",   name: "Manuel del Mar",   genre: "Tropical",    colorA: "#ffb454", colorB: "#b8d63a" },
    { id: "kombo",    name: "Kombo Caliente",   genre: "Chichamera",  colorA: "#ff5a1f", colorB: "#ffb454" }
  ];

  // ============ ÁLBUMES / RELEASES ============
  window.__RELEASES__ = [
    { id: "rel01", title: "Fiesta Brava",        artist: "Los Karkis",      type: "Álbum", year: 2025, large: true,  colorA: "#ff5a1f", colorB: "#d63384" },
    { id: "rel02", title: "Sonidero Vol. 1",     artist: "DJ Fiesta",       type: "EP",    year: 2025, large: false, colorA: "#b8d63a", colorB: "#ffb454" },
    { id: "rel03", title: "Tropikana",           artist: "Tropikana Sound", type: "Álbum", year: 2024, large: false, colorA: "#ffb454", colorB: "#ff5a1f" },
    { id: "rel04", title: "Cumbia Pa' Bailar",   artist: "La Sabrosa",      type: "Single",year: 2026, large: false, colorA: "#d63384", colorB: "#ff5a1f" },
    { id: "rel05", title: "Caliente",            artist: "Kombo Caliente",  type: "EP",    year: 2025, large: false, colorA: "#ff5a1f", colorB: "#ffb454" },
    { id: "rel06", title: "Mar Adentro",         artist: "Manuel del Mar",  type: "Álbum", year: 2025, large: true,  colorA: "#ffb454", colorB: "#b8d63a" },
    { id: "rel07", title: "Fiesta Brava II",     artist: "Los Karkis",      type: "Single",year: 2026, large: false, colorA: "#d63384", colorB: "#b8d63a" },
    { id: "rel08", title: "Sonidero Nights",     artist: "DJ Fiesta",       type: "EP",    year: 2026, large: false, colorA: "#b8d63a", colorB: "#d63384" }
  ];

  // ============ TRACKS (canciones) ============
  // CAMPOS POR TRACK:
  //   id        — único, sin espacios
  //   title     — nombre de la canción
  //   artist    — nombre del artista (debe matchear los de arriba para mostrar mejor)
  //   album     — álbum o single
  //   duration  — solo para mostrar; el reproductor lee la duración real del MP3
  //   audio     — ruta al MP3 (ej. "assets/audio/cancion.mp3"). Si está vacío = modo demo.
  //   cover     — ruta a la carátula. Si está vacío, usa SVG generado con colorA/B.
  //   colorA, colorB — colores del placeholder
  window.__TRACKS__ = [
    { id: "t01", title: "La Fiesta No Para",     artist: "Los Karkis",      album: "Fiesta Brava",    duration: "3:42", audio: "", cover: "", colorA: "#ff5a1f", colorB: "#d63384" },
    { id: "t02", title: "Cumbia del Sol",        artist: "Tropikana Sound", album: "Tropikana",       duration: "4:15", audio: "", cover: "", colorA: "#ffb454", colorB: "#ff5a1f" },
    { id: "t03", title: "Sonidero Mix",          artist: "DJ Fiesta",       album: "Sonidero Vol. 1", duration: "5:08", audio: "", cover: "", colorA: "#b8d63a", colorB: "#ffb454" },
    { id: "t04", title: "Mueve la Cintura",      artist: "La Sabrosa",      album: "Cumbia Pa' Bailar", duration: "3:28", audio: "", cover: "", colorA: "#d63384", colorB: "#ff5a1f" },
    { id: "t05", title: "Brisas del Pacífico",   artist: "Manuel del Mar",  album: "Mar Adentro",     duration: "4:50", audio: "", cover: "", colorA: "#ffb454", colorB: "#b8d63a" },
    { id: "t06", title: "Kombo Pa' la Casa",     artist: "Kombo Caliente",  album: "Caliente",        duration: "3:55", audio: "", cover: "", colorA: "#ff5a1f", colorB: "#ffb454" },
    { id: "t07", title: "Karkis En Vivo",        artist: "Los Karkis",      album: "Fiesta Brava",    duration: "4:22", audio: "", cover: "", colorA: "#d63384", colorB: "#ffb454" },
    { id: "t08", title: "La Rumba Empezó",       artist: "Tropikana Sound", album: "Tropikana",       duration: "3:38", audio: "", cover: "", colorA: "#ff5a1f", colorB: "#b8d63a" },
    { id: "t09", title: "Noche de Sonidero",     artist: "DJ Fiesta",       album: "Sonidero Nights", duration: "6:12", audio: "", cover: "", colorA: "#b8d63a", colorB: "#d63384" },
    { id: "t10", title: "Sabrosura",             artist: "La Sabrosa",      album: "Cumbia Pa' Bailar", duration: "3:15", audio: "", cover: "", colorA: "#d63384", colorB: "#ffb454" }
  ];

})();
