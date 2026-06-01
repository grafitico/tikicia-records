/* =====================================================================
   TIKICIA RECORDS — Config Admin
   Cambiar contraseña y settings sin tocar panel.js
   ===================================================================== */

const TIKICIA_CONFIG = {
  // Cambiar esta contraseña aquí (NO en panel.js)
  admin_password: 'tikicia2024',

  // Límites de archivo
  max_audio_size_mb: 50,    // 50 MB para MP3
  max_image_size_mb: 5,     // 5 MB para imágenes

  // Extensiones permitidas
  allowed_audio: ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
  allowed_image: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],

  // GitHub (opcional, para sync automático)
  // Si no querés sync automático, dejá estos vacíos
  github_default_owner: 'grafitico',
  github_default_repo: 'tikicia-records',
  github_default_branch: 'main',
};

// Exportar para que lo use panel.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TIKICIA_CONFIG;
}
