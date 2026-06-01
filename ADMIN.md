# 🔐 Panel Admin — TIKICIA RECORDS

## Acceso rápido

**Botón flotante:** En la esquina inferior derecha del sitio (⚙ icon), o abrí `index.html` en tu navegador.

**Contraseña por defecto:** `tikicia2024`

---

## 🔧 Configuración

### Cambiar la contraseña

1. Abrí `config.js` con un editor de texto
2. Busca la línea: `admin_password: 'tikicia2024',`
3. Cambiar por tu contraseña: `admin_password: 'mi-contraseña-nueva',`
4. Guardá el archivo

**IMPORTANTE:** No compartas el archivo `config.js` públicamente ni lo commiteés con la contraseña real en repositorios públicos.

---

## 📤 Funciones principales

### 🎵 Agregar una canción

1. Tocá el botón **⚙ (Admin)** en la esquina inferior derecha
2. Ingresá la contraseña
3. Tocá **+ Nueva canción**
4. Completá los campos:
   - **Título** *obligatorio
   - **Artista** *obligatorio  
   - **Álbum / Sencillo**
   - **Audio (MP3)** — Arrastrá el archivo o tocá para seleccionar (máx 50 MB)
   - **Carátula** — Imagen opcional (máx 5 MB)
   - **Duración** — Se detecta automáticamente del MP3
   - **Año, Género, BPM** — Opcional

5. Tocá **Guardar ◆** — La canción aparece al instante en el sitio

---

### 👤 Agregar un artista

1. Abrí el panel Admin → Tab **👤 Artistas**
2. Tocá **+ Nuevo artista**
3. Completá:
   - **Nombre artístico** *obligatorio
   - **Género musical** — opcional
   - **Foto** — Tu imagen (máx 5 MB)

4. Tocá **Guardar ◆**

---

### 💿 Agregar un lanzamiento (Álbum/EP)

1. Abrí el panel Admin → Tab **💿 Lanzamientos**
2. Tocá **+ Nuevo lanzamiento**
3. Completá:
   - **Título** *obligatorio
   - **Artista** *obligatorio
   - **Tipo** — Single / EP / Álbum
   - **Año**
   - **Portada** — Imagen opcional
   - **Destacado** — ⭐ Aparece más grande en la grilla

4. Tocá **Guardar ◆**

---

## 🔄 Sincronizar con GitHub (automático)

El panel puede subir tus cambios a GitHub automáticamente para que se vean en todos los dispositivos.

### Configurar GitHub Sync

1. Abrí el panel Admin → Tab **⚙ GitHub**
2. Creá un **Personal Access Token** en GitHub:
   - Andá a https://github.com/settings/tokens/new
   - Nombre: "Tikicia Admin Panel"
   - Permisos: ✓ `repo` (full control)
   - Copiar el token (empieza con `ghp_`)

3. En el panel, pegá el token en **Token de GitHub**
4. Verificá que Owner, Repo y Branch sean correctos:
   - Owner: `grafitico` (tu usuario/organización)
   - Repo: `tikicia-records`
   - Branch: `main`

5. Tocá **Guardar config ◆** y luego **Probar conexión**

### ¿Qué pasa después?

- Cada vez que guardés una canción, artista o lanzamiento, **se sube automáticamente a GitHub**
- Los cambios aparecen en el sitio en ~1 minuto
- Si abrís el panel en otro navegador/dispositivo, ves los mismos datos

### Subir archivos MP3 y carátulas

Los MP3 y imágenes **se guardan localmente** en IndexedDB (en tu navegador). Para que aparezcan en otros dispositivos:

**Opción 1: Con GitHub Token** (recomendado)
- El panel sube automáticamente los archivos a GitHub
- Se verán en todos lados

**Opción 2: Manual**
- Subí los archivos a GitHub en `assets/audio/` y `assets/covers/`
- El panel los detecta automáticamente

---

## 📥 Exportar datos

Tocá el botón **⬇ Exportar data.js** para descargar el archivo con todos tus datos. Úsalo para hacer backup o transferir datos entre dispositivos.

---

## ⚠️ Límites y validaciones

| Tipo | Límite | Formato |
|------|--------|---------|
| MP3 | 50 MB | .mp3, .wav, .ogg, .m4a, .flac |
| Imagen | 5 MB | .jpg, .jpeg, .png, .webp, .gif |
| Título | 200 caracteres | Texto |
| Artista | 100 caracteres | Texto |

---

## 🔒 Seguridad

- La contraseña se guarda en `config.js` (no se transmite a ningún servidor)
- El token de GitHub se almacena en **sessionStorage** (se borra cuando cierras el navegador)
- Los archivos se guardan en **IndexedDB** (solo en tu navegador)
- No compartás `config.js` con la contraseña

---

## 🆘 Solucionar problemas

### "Error al subir a GitHub"
- Verificá que el token sea válido (Tab **⚙ GitHub** → Probar conexión)
- El token no debe estar expirado
- Verificá que el Owner y Repo sean correctos

### "La canción no aparece en el sitio"
- Recargá la página (F5)
- Si usás GitHub Sync, esperá ~1 minuto
- Verificá que el audio tenga duración (el MP3 es válido)

### "No puedo cambiar la contraseña"
- Abrí `config.js` con un editor de texto (no Word)
- Guardá como UTF-8 (texto plano)
- Recargá la página después de cambiar

---

## 📞 Soporte

Si tenés problemas, enviá un mensaje a **6113 3381** (WhatsApp) o escribí a `tikiciarecords@gmail.com`.
