/* =====================================================================
   TIKICIA RECORDS — sign.js
   Firma digital por plan: pad de firma + generación de PDF de respaldo.
   ===================================================================== */
(function () {
  'use strict';

  function safe(name, fn) {
    try { fn(); } catch (e) { console.warn('[TIKICIA:sign]', name, e); }
  }

  const PLAN_SLUGS = ['independiente', 'alianza', 'sello'];

  // ─── Extrae el texto de las cláusulas directamente del DOM ────────────
  // (misma fuente que ve el cliente en pantalla; evita que el PDF quede
  // desactualizado si el texto de la página cambia).
  function extractSectionClauses(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return [];

    if (sectionId === 'comunes') {
      return Array.from(section.querySelectorAll('dl > div')).map(div => ({
        title: div.querySelector('dt')?.textContent.trim() || '',
        body: div.querySelector('dd')?.textContent.trim() || ''
      }));
    }

    return Array.from(section.querySelectorAll('.clause')).map(clause => {
      const title = clause.querySelector('.clause-title')?.textContent.trim() || '';
      const parts = [];
      clause.querySelectorAll('p, li').forEach(el => {
        if (el.classList.contains('clause-title')) return;
        parts.push(el.textContent.trim());
      });
      return { title, body: parts.join('  •  ') };
    });
  }

  // ─── Pad de firma (canvas, mouse + touch) ──────────────────────────────
  function initSignaturePad(canvas) {
    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#f0e8d2';

    let drawing = false;
    let hasSignature = false;

    function pos(e) {
      const r = canvas.getBoundingClientRect();
      const t = e.touches && e.touches[0] ? e.touches[0] : e;
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    }
    function start(e) {
      drawing = true;
      hasSignature = true;
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      e.preventDefault();
    }
    function move(e) {
      if (!drawing) return;
      const p = pos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      e.preventDefault();
    }
    function end() { drawing = false; }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);

    return {
      clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasSignature = false;
      },
      isEmpty() { return !hasSignature; },
      dataURL() { return canvas.toDataURL('image/png'); }
    };
  }

  // ─── Genera el PDF de respaldo con jsPDF ───────────────────────────────
  function generatePlanPdf({ planId, planLabel, formData, signatureDataURL }) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - marginX * 2;
    let y = 56;

    function ensureSpace(h) {
      if (y + h > pageHeight - 56) { doc.addPage(); y = 56; }
    }
    function addTitle(text) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
      ensureSpace(24);
      doc.text(text, marginX, y);
      y += 24;
    }
    function addSubtitle(text) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(10);
      ensureSpace(16);
      doc.text(text, marginX, y);
      y += 22;
    }
    function addHeading(text) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5);
      ensureSpace(20);
      doc.text(text, marginX, y);
      y += 18;
    }
    function addClauseTitle(text) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.splitTextToSize(text, maxWidth).forEach(line => {
        ensureSpace(13);
        doc.text(line, marginX, y);
        y += 13;
      });
    }
    function addBody(text) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
      doc.splitTextToSize(text, maxWidth).forEach(line => {
        ensureSpace(13);
        doc.text(line, marginX, y);
        y += 13;
      });
      y += 5;
    }

    addTitle('TIKICIA RECORDS');
    addSubtitle('Registro de aceptación electrónica — ' + planLabel);

    addHeading('Datos del Artista / Firmante');
    addBody('Nombre completo: ' + formData.nombre);
    addBody('Cédula / DIMEX: ' + formData.cedula);
    addBody('Email: ' + formData.email);
    addBody('WhatsApp: ' + formData.whatsapp);
    addBody('Plan seleccionado: ' + planLabel);
    addBody('Fecha y hora de firma: ' + formData.timestamp);
    y += 4;

    addHeading('Cláusulas del ' + planLabel);
    extractSectionClauses(planId).forEach(c => {
      if (c.title) addClauseTitle(c.title);
      if (c.body) addBody(c.body);
    });

    addHeading('Cláusulas comunes a los tres planes');
    extractSectionClauses('comunes').forEach(c => {
      if (c.title) addClauseTitle(c.title);
      if (c.body) addBody(c.body);
    });

    ensureSpace(150);
    addHeading('Firma del Artista');
    if (signatureDataURL) {
      doc.addImage(signatureDataURL, 'PNG', marginX, y, 220, 90);
    }
    y += 100;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text('Firmado electrónicamente por ' + formData.nombre + ' el ' + formData.timestamp, marginX, y);
    y += 20;

    doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
    const disclaimer = 'Este documento es un registro de aceptación electrónica generado automáticamente por el sitio de Tikicia Records, a partir de los datos ingresados por el firmante en este dispositivo. Constituye evidencia de aceptación de las cláusulas anteriores conforme a la cláusula de Firmas del documento de referencia (casilla de aceptación con registro de fecha y datos del Artista).';
    doc.splitTextToSize(disclaimer, maxWidth).forEach(line => {
      ensureSpace(11);
      doc.text(line, marginX, y);
      y += 11;
    });

    const diacritics = /[\u0300-\u036f]/g;
    const safeName = formData.nombre
      .normalize('NFD').replace(diacritics, '')
      .replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
    const filename = `TikiciaRecords-${planLabel.replace(/\s+/g, '')}-${safeName}-${formData.fechaArchivo}.pdf`;
    doc.save(filename);
  }

  // ─── Marcado del bloque de firma, inyectado por plan ───────────────────
  function buildSignBlockHTML(slug, label) {
    return `
    <div class="sign-block" id="firmar-${slug}">
      <h4 class="sign-heading">Firmar el ${label}</h4>
      <p class="sign-sub">Completá tus datos, firmá en el recuadro y descargá tu PDF de respaldo con fecha, hora y tus datos.</p>
      <form class="sign-form" novalidate>
        <div class="sign-row">
          <label>Nombre completo
            <input type="text" name="nombre" required placeholder="Tu nombre y apellidos">
          </label>
          <label>Cédula / DIMEX
            <input type="text" name="cedula" required placeholder="0-0000-0000">
          </label>
        </div>
        <div class="sign-row">
          <label>Email
            <input type="email" name="email" required placeholder="vos@email.com">
          </label>
          <label>WhatsApp
            <input type="tel" name="whatsapp" required placeholder="+506 6000 0000">
          </label>
        </div>
        <label class="sign-check">
          <input type="checkbox" name="acepto" required>
          <span>He leído y acepto las cláusulas del <strong>${label}</strong> y las cláusulas comunes de esta página.</span>
        </label>
        <div class="sign-pad-wrap">
          <p class="sign-pad-label">Firmá aquí con el mouse o el dedo:</p>
          <canvas class="sign-canvas"></canvas>
          <button type="button" class="sign-clear">Limpiar firma</button>
        </div>
        <button type="submit" class="btn btn-primary sign-submit">Firmar y descargar PDF ◆</button>
        <p class="sign-error" hidden></p>
        <div class="sign-success" hidden>
          <p>✔ Firmado. Tu PDF se descargó a tu dispositivo — guardalo como respaldo. Envíanoslo también por WhatsApp para que quede registrado de nuestro lado.</p>
          <a href="#" class="btn btn-whatsapp sign-wa-btn" target="_blank" rel="noopener">Enviar copia por WhatsApp</a>
        </div>
      </form>
    </div>`;
  }

  safe('sign-blocks', function () {
    PLAN_SLUGS.forEach(slug => {
      const section = document.getElementById(slug);
      if (!section) return;
      const label = section.querySelector('.plan-doc-title')?.textContent.trim() || ('Plan ' + slug);
      section.insertAdjacentHTML('beforeend', buildSignBlockHTML(slug, label));

      const form = section.querySelector('.sign-form');
      const canvas = form.querySelector('.sign-canvas');
      const pad = initSignaturePad(canvas);

      form.querySelector('.sign-clear').addEventListener('click', () => pad.clear());

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const errorEl = form.querySelector('.sign-error');
        const successEl = form.querySelector('.sign-success');
        errorEl.hidden = true;
        successEl.hidden = true;

        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        if (pad.isEmpty()) {
          errorEl.textContent = 'Por favor firmá en el recuadro antes de continuar.';
          errorEl.hidden = false;
          return;
        }

        const fd = new FormData(form);
        const nombre = String(fd.get('nombre') || '').trim();
        const cedula = String(fd.get('cedula') || '').trim();
        const email = String(fd.get('email') || '').trim();
        const whatsapp = String(fd.get('whatsapp') || '').trim();
        const now = new Date();
        const timestamp = now.toLocaleString('es-CR', { dateStyle: 'full', timeStyle: 'medium' });
        const fechaArchivo = now.toISOString().slice(0, 10);

        const submitBtn = form.querySelector('.sign-submit');
        const originalLabel = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Generando PDF…';

        try {
          generatePlanPdf({
            planId: slug,
            planLabel: label,
            formData: { nombre, cedula, email, whatsapp, timestamp, fechaArchivo },
            signatureDataURL: pad.dataURL()
          });

          const waText = encodeURIComponent(
            `Hola, firmé el ${label} de Tikicia Records.\nNombre: ${nombre}\nCédula: ${cedula}\nFecha: ${timestamp}\nAdjunto el PDF de respaldo.`
          );
          form.querySelector('.sign-wa-btn').href = `https://wa.me/50661133381?text=${waText}`;
          successEl.hidden = false;
          form.querySelector('.sign-submit').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (err) {
          console.error('[TIKICIA:sign] PDF error', err);
          errorEl.textContent = 'Hubo un problema generando el PDF. Intentá de nuevo.';
          errorEl.hidden = false;
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
      });
    });
  });
})();
