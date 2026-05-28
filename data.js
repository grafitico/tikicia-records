/* =====================================================================
   TIKICIA RECORDS — Catálogo de datos
   ─────────────────────────────────────────────────────────────────────
   Para editar el catálogo de forma visual y rápida, abrí admin.html.

   Si querés editar a mano:
   1. Poné tus MP3 en /assets/audio/
   2. Poné las carátulas (JPG/WebP) en /assets/covers/
   3. Poné tu logo en /assets/img/logo.png
   4. Editá los campos "audio" y "cover" de cada track abajo.

   Si audio queda vacío → modo demo (suena silencio, se muestra info).
   ===================================================================== */

(function () {
  "use strict";

  /* ============ ARTISTAS ============ */
  window.__ARTISTS__ = [
    {
      id: "jaxdane",
      name: "Jaxdane Flores",
      genre: "Norteña",
      photo: "",            /* ← ruta a foto: "assets/img/jaxdane.jpg" */
      colorA: "#c8341a",
      colorB: "#e8520f"
    },
    {
      id: "tropikana",
      name: "Tropikana Sound",
      genre: "Cumbia",
      photo: "",
      colorA: "#d08e30",
      colorB: "#e8520f"
    },
    {
      id: "djfiesta",
      name: "DJ Fiesta",
      genre: "Sonidero",
      photo: "",
      colorA: "#8e2d9a",
      colorB: "#2c56c0"
    },
    {
      id: "deylis",
      name: "Deylis E.C",
      genre: "Cumbia",
      photo: "",
      colorA: "#c8341a",
      colorB: "#8e2d9a"
    },
    {
      id: "manueldelmar",
      name: "Manuel del Mar",
      genre: "Tropical",
      photo: "",
      colorA: "#d08e30",
      colorB: "#2c56c0"
    },
    {
      id: "kombocaliente",
      name: "Kombo Caliente",
      genre: "Chichamera",
      photo: "",
      colorA: "#e8520f",
      colorB: "#d08e30"
    }
  ];

  /* ============ ÁLBUMES / LANZAMIENTOS ============ */
  window.__RELEASES__ = [
    {
      id: "rel01",
      title: "Fiesta Brava",
      artist: "Los Karkis",
      type: "Álbum",
      year: 2025,
      large: true,
      cover: "",            /* ← "assets/covers/fiesta-brava.jpg" */
      colorA: "#c8341a",
      colorB: "#8e2d9a"
    },
    {
      id: "rel02",
      title: "Sonidero Vol. 1",
      artist: "DJ Fiesta",
      type: "EP",
      year: 2025,
      large: false,
      cover: "",
      colorA: "#8e2d9a",
      colorB: "#2c56c0"
    },
    {
      id: "rel03",
      title: "Tropikana",
      artist: "Tropikana Sound",
      type: "Álbum",
      year: 2024,
      large: false,
      cover: "",
      colorA: "#d08e30",
      colorB: "#e8520f"
    },
    {
      id: "rel04",
      title: "Cumbia Pa' Bailar",
      artist: "Deylis E.C",
      type: "Single",
      year: 2026,
      large: false,
      cover: "",
      colorA: "#c8341a",
      colorB: "#e8520f"
    },
    {
      id: "rel05",
      title: "Caliente",
      artist: "Kombo Caliente",
      type: "EP",
      year: 2025,
      large: false,
      cover: "",
      colorA: "#e8520f",
      colorB: "#d08e30"
    },
    {
      id: "rel06",
      title: "Mar Adentro",
      artist: "Manuel del Mar",
      type: "Álbum",
      year: 2025,
      large: true,
      cover: "",
      colorA: "#2c56c0",
      colorB: "#d08e30"
    },
    {
      id: "rel07",
      title: "Fiesta Brava II",
      artist: "Los Karkis",
      type: "Single",
      year: 2026,
      large: false,
      cover: "",
      colorA: "#8e2d9a",
      colorB: "#2c56c0"
    },
    {
      id: "rel08",
      title: "Sonidero Nights",
      artist: "DJ Fiesta",
      type: "EP",
      year: 2026,
      large: false,
      cover: "",
      colorA: "#2c56c0",
      colorB: "#8e2d9a"
    }
  ];

  /* ============ TRACKS (canciones) ============
     CAMPOS:
       id       — único, sin espacios
       title    — nombre de la canción
       artist   — nombre del artista
       album    — álbum al que pertenece
       duration — solo visual; el reproductor lee la duración real del MP3
       audio    — ruta al MP3 (ej. "assets/audio/cancion.mp3")
                  Si está vacío → modo demo.
       cover    — ruta a la carátula. Vacío = SVG generado con colorA/B
       colorA, colorB — colores del placeholder SVG
   ============ */
  window.__TRACKS__ = [
    {
      id: "t01",
      title: "La Fiesta No Para",
      artist: "Los Karkis",
      album: "Fiesta Brava",
      duration: "3:42",
      audio: "",            /* ← "assets/audio/la-fiesta-no-para.mp3" */
      cover: "",
      colorA: "#c8341a",
      colorB: "#8e2d9a"
    },
    {
      id: "t02",
      title: "Cumbia del Sol",
      artist: "Tropikana Sound",
      album: "Tropikana",
      duration: "4:15",
      audio: "",
      cover: "",
      colorA: "#d08e30",
      colorB: "#e8520f"
    },
    {
      id: "t03",
      title: "Sonidero Mix",
      artist: "DJ Fiesta",
      album: "Sonidero Vol. 1",
      duration: "5:08",
      audio: "",
      cover: "",
      colorA: "#8e2d9a",
      colorB: "#2c56c0"
    },
    {
      id: "t04",
      title: "Mueve la Cintura",
      artist: "Deylis E.C",
      album: "Cumbia Pa' Bailar",
      duration: "3:28",
      audio: "",
      cover: "",
      colorA: "#c8341a",
      colorB: "#e8520f"
    },
    {
      id: "t05",
      title: "Brisas del Pacífico",
      artist: "Manuel del Mar",
      album: "Mar Adentro",
      duration: "4:50",
      audio: "",
      cover: "",
      colorA: "#2c56c0",
      colorB: "#d08e30"
    },
    {
      id: "t06",
      title: "Kombo Pa' la Casa",
      artist: "Kombo Caliente",
      album: "Caliente",
      duration: "3:55",
      audio: "",
      cover: "",
      colorA: "#e8520f",
      colorB: "#d08e30"
    },
    {
      id: "t07",
      title: "El Viejón",
      artist: "Jaxdane Flores",
      album: "Fiesta Brava",
      duration: "4:22",
      audio: "audio/El viejon.mp3",   /* ← archivo existente en el repo */
      cover: "",
      colorA: "#c8341a",
      colorB: "#d08e30"
    },
    {
      id: "t08",
      title: "La Rumba Empezó",
      artist: "Tropikana Sound",
      album: "Tropikana",
      duration: "3:38",
      audio: "",
      cover: "",
      colorA: "#d08e30",
      colorB: "#8e2d9a"
    },
    {
      id: "t09",
      title: "Noche de Sonidero",
      artist: "DJ Fiesta",
      album: "Sonidero Nights",
      duration: "6:12",
      audio: "",
      cover: "",
      colorA: "#8e2d9a",
      colorB: "#2c56c0"
    },
    {
      id: "t10",
      title: "Sabrosura",
      artist: "Deylis E.C",
      album: "Cumbia Pa' Bailar",
      duration: "3:15",
      audio: "",
      cover: "",
      colorA: "#c8341a",
      colorB: "#8e2d9a"
    }
  ];

})();
