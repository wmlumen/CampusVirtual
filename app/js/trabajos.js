// trabajos.js (v2026-10-07) — Trabajos prácticos en PDF.
// Alumno: entrega su PDF por unidad y ve sus calificaciones.   CenturiaTrabajos.montarAlumno(el, { asignatura, unidades })
// Docente: ve las entregas, abre el PDF y carga la nota.       CenturiaTrabajos.montarDocente(el, { asignatura })
// Requiere js/api.js (CenturiaAPI.trabajos). El estilo hereda colores para verse bien en fondo claro u oscuro.
(function () {
    'use strict';

    const MAX_MB = 8;
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fecha = (f) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(f || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : '-'; };
    const nota = (t) => t.calificacion == null ? '—' : (t.calificacion + ' / ' + t.puntaje_max);
    const mb = (b) => (b / 1048576).toFixed(1) + ' MB';

    function estilos() {
        if (document.getElementById('trab-css')) return;
        const s = document.createElement('style');
        s.id = 'trab-css';
        s.textContent = `
.trab-box{font-size:.85rem}
.trab-row{display:flex;flex-wrap:wrap;gap:8px;align-items:end;margin-bottom:10px}
.trab-row label{display:block;font-size:.7rem;font-weight:700;text-transform:uppercase;opacity:.75;margin-bottom:3px}
.trab-row input,.trab-row select,.trab-box textarea{padding:7px 10px;border:1px solid rgba(128,128,128,.45);border-radius:8px;font-size:.82rem;background:transparent;color:inherit}
.trab-row select option{color:#111}
.trab-btn{padding:8px 14px;border:none;border-radius:8px;font-weight:700;font-size:.78rem;cursor:pointer;background:#007A33;color:#fff}
.trab-btn[disabled]{opacity:.55;cursor:wait}
.trab-btn.sec{background:rgba(128,128,128,.25);color:inherit}
.trab-tbl{width:100%;border-collapse:collapse;font-size:.8rem}
.trab-tbl th,.trab-tbl td{padding:7px 8px;border-bottom:1px solid rgba(128,128,128,.3);text-align:left;vertical-align:top}
.trab-tbl th{font-size:.68rem;text-transform:uppercase;opacity:.75}
.trab-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:.7rem;font-weight:700}
.trab-ok{background:#d1fae5;color:#065f46}.trab-pend{background:#fef3c7;color:#92400e}
.trab-msg{margin:6px 0;font-weight:600;font-size:.8rem}.trab-err{color:#dc2626}.trab-good{color:#16a34a}
.trab-scroll{overflow-x:auto}`;
        document.head.appendChild(s);
    }

    function leerPdf(file) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error('Elegí el archivo PDF.'));
            if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return reject(new Error('El archivo debe ser un PDF.'));
            if (file.size > MAX_MB * 1048576) return reject(new Error('El PDF pesa ' + mb(file.size) + '; el máximo es ' + MAX_MB + ' MB.'));
            const r = new FileReader();
            r.onload = () => resolve('data:application/pdf;base64,' + String(r.result).split(',')[1]);
            r.onerror = () => reject(new Error('No se pudo leer el archivo.'));
            r.readAsDataURL(file);
        });
    }

    // Abre el PDF en otra pestaña (la ventana se abre antes de la espera para que el navegador no la bloquee).
    async function abrirPdf(id) {
        const w = window.open('', '_blank');
        if (w) w.document.write('<p style="font-family:sans-serif">Cargando PDF…</p>');
        const r = await CenturiaAPI.trabajos.pdf(id).catch(e => ({ ok: false, error: e.message }));
        if (!r || !r.ok) { if (w) w.close(); alert(r && r.error || 'No se pudo abrir el PDF.'); return; }
        const bin = atob(r.base64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        if (w) w.location.href = url; else window.open(url, '_blank');
    }

    // ═══ ALUMNO ═══
    function montarAlumno(el, opts) {
        if (!el || !window.CenturiaAPI) return;
        estilos();
        const asig = (opts && opts.asignatura) || 'TIC';
        const n = (opts && opts.unidades) || 10;
        el.innerHTML = `
<div class="trab-box">
  <form class="trab-row" data-f>
    <div><label for="trab-unidad">Unidad</label><select id="trab-unidad" required>
      ${Array.from({ length: n }, (_, i) => `<option value="${i + 1}">Unidad ${i + 1}</option>`).join('')}</select></div>
    <div style="flex:1;min-width:160px"><label for="trab-titulo">Título (opcional)</label><input id="trab-titulo" maxlength="120" placeholder="Ej.: Trabajo práctico 1" style="width:100%"></div>
    <div><label for="trab-archivo">Archivo PDF (máx. ${MAX_MB} MB)</label><input id="trab-archivo" type="file" accept="application/pdf,.pdf" required></div>
    <button class="trab-btn" type="submit"><i class="bi bi-cloud-upload"></i> Subir trabajo</button>
  </form>
  <div class="trab-msg" role="status" data-msg></div>
  <div class="trab-scroll"><table class="trab-tbl">
    <thead><tr><th>Unidad</th><th>Trabajo</th><th>Entregado</th><th>Estado</th><th>Puntaje</th><th>Comentario del docente</th></tr></thead>
    <tbody data-tb><tr><td colspan="6">Cargando…</td></tr></tbody></table></div>
</div>`;
        const msg = el.querySelector('[data-msg]'), tb = el.querySelector('[data-tb]'), form = el.querySelector('[data-f]');
        const aviso = (t, ok) => { msg.textContent = t; msg.className = 'trab-msg ' + (ok ? 'trab-good' : 'trab-err'); };

        async function cargar() {
            const r = await CenturiaAPI.trabajos.mios(asig).catch(e => ({ ok: false, error: e.message }));
            if (!r || !r.ok) { tb.innerHTML = `<tr><td colspan="6" class="trab-err">${esc(r && r.error || 'No se pudieron cargar tus trabajos.')}</td></tr>`; return; }
            tb.innerHTML = r.trabajos.length ? r.trabajos.map(t => `<tr>
                <td>${esc(t.unidad)}</td>
                <td><a href="#" data-pdf="${esc(t.id)}">${esc(t.titulo || t.archivo_nombre)}</a></td>
                <td>${fecha(t.entregado_fecha)} ${esc(t.entregado_hora)}</td>
                <td><span class="trab-badge ${t.estado === 'calificado' ? 'trab-ok' : 'trab-pend'}">${t.estado === 'calificado' ? 'Calificado' : 'Entregado'}</span></td>
                <td><strong>${esc(nota(t))}</strong></td>
                <td>${esc(t.comentario || '—')}</td></tr>`).join('')
                : '<tr><td colspan="6">Todavía no entregaste trabajos.</td></tr>';
        }

        tb.addEventListener('click', (e) => { const a = e.target.closest('[data-pdf]'); if (a) { e.preventDefault(); abrirPdf(a.dataset.pdf); } });
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button'), file = form.querySelector('#trab-archivo').files[0];
            btn.disabled = true; aviso('Subiendo… no cierres la página.', true);
            try {
                const archivo = await leerPdf(file);
                const r = await CenturiaAPI.trabajos.entregar({
                    asignatura: asig, unidad: form.querySelector('#trab-unidad').value,
                    titulo: form.querySelector('#trab-titulo').value, archivo: archivo, nombre_archivo: file.name
                });
                if (!r || !r.ok) throw new Error(r && r.error || 'No se pudo subir el trabajo.');
                aviso(r.mensaje, true); form.reset(); cargar();
            } catch (err) { aviso(err.message, false); }
            btn.disabled = false;
        });
        cargar();
    }

    // ═══ DOCENTE ═══
    function montarDocente(el, opts) {
        if (!el || !window.CenturiaAPI) return;
        estilos();
        let todos = [];
        el.innerHTML = `
<div class="trab-box">
  <div class="trab-row">
    <div><label for="trab-f-asig">Asignatura</label><select id="trab-f-asig"><option value="">Todas</option></select></div>
    <div><label for="trab-f-est">Estado</label><select id="trab-f-est"><option value="">Todos</option><option value="entregado">Sin calificar</option><option value="calificado">Calificados</option></select></div>
    <div style="flex:1;min-width:160px"><label for="trab-f-q">Buscar</label><input id="trab-f-q" placeholder="Nombre o cédula" style="width:100%"></div>
    <button class="trab-btn sec" type="button" data-rec><i class="bi bi-arrow-clockwise"></i> Actualizar</button>
  </div>
  <div class="trab-msg" role="status" data-msg></div>
  <div class="trab-scroll"><table class="trab-tbl">
    <thead><tr><th>Alumno</th><th>Sección</th><th>Asig. / Unidad</th><th>Trabajo</th><th>Entregado</th><th>Calificación</th></tr></thead>
    <tbody data-tb><tr><td colspan="6">Cargando…</td></tr></tbody></table></div>
</div>`;
        const $ = (s) => el.querySelector(s), tb = $('[data-tb]'), msg = $('[data-msg]');
        const aviso = (t, ok) => { msg.textContent = t; msg.className = 'trab-msg ' + (ok ? 'trab-good' : 'trab-err'); };

        function pintar() {
            const a = $('#trab-f-asig').value, est = $('#trab-f-est').value, q = $('#trab-f-q').value.trim().toLowerCase();
            const lista = todos.filter(t => (!a || t.asignatura === a) && (!est || t.estado === est) &&
                (!q || (t.nombre + ' ' + t.cedula).toLowerCase().includes(q)));
            tb.innerHTML = lista.length ? lista.map(t => `<tr>
                <td><strong>${esc(t.nombre || '-')}</strong><br><small>${esc(t.cedula)}</small></td>
                <td>${esc(t.seccion || '-')}</td>
                <td>${esc(t.asignatura)} · U${esc(t.unidad)}</td>
                <td><a href="#" data-pdf="${esc(t.id)}"><i class="bi bi-file-earmark-pdf"></i> ${esc(t.titulo || t.archivo_nombre)}</a><br><small>${mb(t.tamano)}</small></td>
                <td>${fecha(t.entregado_fecha)}<br><small>${esc(t.entregado_hora)}</small></td>
                <td><form class="trab-row" style="margin:0" data-cal="${esc(t.id)}">
                    <input name="nota" type="number" min="0" step="0.5" required value="${t.calificacion == null ? '' : t.calificacion}" style="width:70px" aria-label="Calificación">
                    <span>/</span><input name="max" type="number" min="1" max="100" step="1" required value="${t.puntaje_max || 10}" style="width:60px" aria-label="Puntaje máximo">
                    <input name="com" maxlength="500" placeholder="Comentario" value="${esc(t.comentario)}" style="min-width:120px;flex:1" aria-label="Comentario">
                    <button class="trab-btn" type="submit">${t.estado === 'calificado' ? 'Actualizar' : 'Guardar'}</button></form>
                    ${t.estado === 'calificado' ? `<small>Calificado por ${esc(t.calificado_por)}</small>` : ''}</td></tr>`).join('')
                : '<tr><td colspan="6">No hay trabajos entregados con esos filtros.</td></tr>';
        }

        async function cargar() {
            tb.innerHTML = '<tr><td colspan="6">Cargando…</td></tr>';
            const r = await CenturiaAPI.trabajos.listar('').catch(e => ({ ok: false, error: e.message }));
            if (!r || !r.ok) { tb.innerHTML = `<tr><td colspan="6" class="trab-err">${esc(r && r.error || 'No se pudieron cargar los trabajos.')}</td></tr>`; return; }
            todos = r.trabajos;
            const sel = $('#trab-f-asig'), actual = sel.value || (opts && opts.asignatura) || '';
            const asigs = [...new Set(todos.map(t => t.asignatura).filter(Boolean))].sort();
            sel.innerHTML = '<option value="">Todas</option>' + asigs.map(a => `<option value="${esc(a)}">${esc(a)}</option>`).join('');
            sel.value = asigs.includes(actual) ? actual : '';
            const pend = todos.filter(t => t.estado !== 'calificado').length;
            aviso(todos.length + ' trabajos entregados · ' + pend + ' sin calificar', true);
            pintar();
        }

        ['#trab-f-asig', '#trab-f-est'].forEach(s => $(s).addEventListener('change', pintar));
        $('#trab-f-q').addEventListener('input', pintar);
        $('[data-rec]').addEventListener('click', cargar);
        tb.addEventListener('click', (e) => { const a = e.target.closest('[data-pdf]'); if (a) { e.preventDefault(); abrirPdf(a.dataset.pdf); } });
        tb.addEventListener('submit', async (e) => {
            const f = e.target.closest('[data-cal]');
            if (!f) return;
            e.preventDefault();
            const btn = f.querySelector('button'); btn.disabled = true;
            const r = await CenturiaAPI.trabajos.calificar(f.dataset.cal, f.nota.value, f.max.value, f.com.value).catch(err => ({ ok: false, error: err.message }));
            btn.disabled = false;
            if (!r || !r.ok) { aviso(r && r.error || 'No se pudo guardar la calificación.', false); return; }
            await cargar(); aviso('Calificación guardada.', true);
        });
        cargar();
    }

    window.CenturiaTrabajos = { montarAlumno, montarDocente, abrirPdf };
})();
