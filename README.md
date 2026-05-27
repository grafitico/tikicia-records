# TIKICIA RECORDS — Sitio web

Sitio estilo Spotify para la disquera. HTML/CSS/JS puro: ningún servidor, ninguna instalación necesaria. Listo para subir a Hostinger, Netlify, o cualquier hosting estático.

---

## 🚀 Cómo subir el sitio a Hostinger

1. Abrí el panel de Hostinger → **Archivos** → **Administrador de archivos**.
2. Entrá a la carpeta `public_html`.
3. Arrastrá TODOS los archivos de esta carpeta dentro de `public_html`:
   - `index.html`
   - `styles.css`
   - `main.js`
   - `data.js`
   - `.htaccess` (importante para el caché)
   - Carpeta `assets/`
4. Listo. Tu sitio está online.

> Si usás Netlify: arrastrá la carpeta entera al panel de Netlify. Sin más.

---

## 🎵 Cómo agregar tus canciones REALES

Por defecto el sitio funciona en **modo demo** (muestra info pero no reproduce sonido). Para que las canciones suenen:

### 1. Subí los archivos MP3
Pone tus archivos de audio en `assets/audio/`. Por ejemplo:
```
assets/audio/la-fiesta-no-para.mp3
assets/audio/cumbia-del-sol.mp3
```

### 2. Subí las carátulas
Pone las imágenes de portada en `assets/covers/`. Recomendado: **600×600 px**, JPG o WebP.
```
assets/covers/fiesta-brava.jpg
assets/covers/tropikana.jpg
```

### 3. Editá `data.js`
Abrí `data.js` con cualquier editor de texto. Por cada canción, llená los campos `audio` y `cover`:

**Antes (modo demo):**
```js
{ id: "t01", title: "La Fiesta No Para", artist: "Los Karkis", album: "Fiesta Brava",
  duration: "3:42", audio: "", cover: "", colorA: "#ff5a1f", colorB: "#d63384" }
```

**Después (con tu canción real):**
```js
{ id: "t01", title: "La Fiesta No Para", artist: "Los Karkis", album: "Fiesta Brava",
  duration: "3:42",
  audio: "assets/audio/la-fiesta-no-para.mp3",
  cover: "assets/covers/fiesta-brava.jpg",
  colorA: "#ff5a1f", colorB: "#d63384" }
```

### 4. Agregá más canciones
Copiá un objeto de canción dentro del array `window.__TRACKS__` y cambialo. Cada uno necesita un `id` único.

### 5. Agregá más artistas / álbumes
Mismo patrón en los arrays `window.__ARTISTS__` y `window.__RELEASES__` de `data.js`.

---

## 🎨 Personalización visual

### Cambiar colores
Abrí `styles.css` y editá las variables CSS al inicio del archivo:
```css
:root {
  --accent:   #ff5a1f;   /* color principal — mandarina */
  --accent-3: #ffb454;   /* dorado tropical */
  --magenta:  #d63384;   /* acento fucsia */
  --lime:     #b8d63a;   /* acento verde */
}
```

### Cambiar nombre / textos
Editá directamente `index.html`. Los textos están en español y se ven a simple vista.

### Cambiar fotos de artistas
1. Pone la foto en `assets/img/nombre-artista.jpg`
2. En `data.js`, agregá el campo `photo` al artista:
```js
{ id: "karkis", name: "Los Karkis", genre: "Chichamera",
  photo: "assets/img/karkis.jpg",
  colorA: "#ff5a1f", colorB: "#d63384" }
```

---

## 📧 Formulario de contacto

El formulario muestra "demo" cuando se envía. Para que **realmente** te llegue el correo, opciones gratuitas:

**Opción 1: Formspree** (más fácil)
1. Andá a [formspree.io](https://formspree.io) → crea cuenta → nuevo form → te da una URL como `https://formspree.io/f/xxxxxx`.
2. En `index.html`, cambiá:
   ```html
   <form class="contact-form" id="contactForm" onsubmit="return false;">
   ```
   por:
   ```html
   <form class="contact-form" id="contactForm" action="https://formspree.io/f/TU-CODIGO" method="POST">
   ```
3. En `main.js`, eliminá el `e.preventDefault()` dentro del handler del form.

**Opción 2: Netlify Forms** (si hosteás en Netlify, gratis)
1. Agregá el atributo `netlify` al `<form>` en HTML.
2. Listo, Netlify capta los envíos automáticamente.

---

## ⌨️ Atajos del reproductor

- **Espacio** = play/pausa
- **Click en barra de progreso** = saltar a esa posición
- **Click en barra de volumen** = cambiar volumen

---

## 🐛 Si algo no funciona

- **El audio no reproduce**: revisá que la ruta en `data.js` sea exacta y que el archivo MP3 esté en `assets/audio/`.
- **Las carátulas no aparecen**: si dejás el campo `cover` vacío, se genera una carátula de gradiente con las iniciales. Eso es a propósito.
- **El sitio se ve "viejo" después de actualizar**: forzá refresh con `Ctrl+Shift+R` (o `Cmd+Shift+R` en Mac). El `.htaccess` ya está configurado para evitar caché agresiva.

---

## 📁 Estructura de archivos

```
tikicia/
├── index.html              ← Página principal
├── styles.css              ← Todos los estilos
├── main.js                 ← Lógica + reproductor
├── data.js                 ← TUS canciones, artistas, álbumes ← EDITAR AQUÍ
├── .htaccess               ← Config de caché (Apache/Hostinger)
├── README.md               ← Este archivo
└── assets/
    ├── audio/              ← TUS MP3s
    ├── covers/             ← TUS carátulas de álbumes
    └── img/                ← Fotos de artistas (opcional)
```

---

Hecho con cariño en Costa Rica · 2026
