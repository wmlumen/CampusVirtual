// ══════════════════════════════════════════════════════════════
// v08.4: EXÁMENES POR FACTURA — habilitación, ventana horaria, intentos y clave por mail
// v08.1: Original implementation — part of Campus Virtual v08.4
//
// Flujo:
//   1. El docente configura cada examen de su asignatura: fecha/hora de inicio y cierre + N° de intentos
//      (hoja ConfigExamen) y ve los 4 últimos pagos de cada alumno.
//   2. El alumno carga su N° de factura (examen_solicitar). Si la factura figura como pagada y el examen
//      está habilitado, se le envía el mail con el enlace + clave automáticamente; si no, queda
//      "solicitado" y el docente decide (examen_resolver).
//   3. El alumno entra con el enlace directo (clave incluida) o con mail + clave (examen_acceso_validar),
//      que controla ventana horaria e intentos en el servidor (hora de Asunción).
// Hojas: ConfigExamen, AccesoExamen (la clave se guarda solo como hash), IntentosExamen.
// ══════════════════════════════════════════════════════════════

var CV_TZ = 'America/Asuncion';
var CV_PAGOS_A_MOSTRAR = 4;
var CV_EXAM_SESION_MAX_MS = 3 * 60 * 60 * 1000;   // una sesión de examen abierta se puede retomar (recarga) hasta 3 h sin gastar otro intento
var CV_EXAM_REENVIO_MS = 5 * 60 * 1000;           // espera mínima entre mails al mismo alumno/examen
var CV_EXAM_MAX_FALLOS = 10;                      // claves erróneas por mail cada 15 min
var CV_ROLES_HABILITADORES = ['docente', 'teacher', 'admin', 'administrador', 'academico', 'académico', 'academic', 'admin_plataforma', 'admin_filial'];

var CV_CONFIG_EXAMEN_HEADERS = ['ExamenId', 'Asignatura', 'Habilitado', 'FechaInicio', 'HoraInicio', 'FechaCierre', 'HoraCierre', 'Intentos', 'ConfiguradoPor', 'Actualizado'];
var CV_ACCESO_EXAMEN_HEADERS = ['Cédula', 'Nombre', 'Email', 'Asignatura', 'ExamenId', 'Factura', 'FacturaVerificada', 'Estado', 'ClaveHash', 'Salt', 'ResueltoPor', 'Fecha', 'EmitidoMs', 'PagosSnapshot', 'Observación'];
var CV_INTENTOS_EXAMEN_HEADERS = ['Cédula', 'ExamenId', 'Asignatura', 'Intento', 'SesionId', 'InicioMs', 'Inicio'];

// Página de cada examen (relativa a la raíz de la app publicada)
var CV_EXAM_PAGINAS = {
  examen_parcial_1: 'academic/examen_parcial1.html',
  examen_parcial_2: 'academic/examen_parcial2.html',
  examen_virtual: 'academic/examen_virtual.html',
  examen_virtual_completo: 'academic/examen_virtual_completo.html',
  examen_final_virtual: 'academic/examen_final_virtual.html',
  examen_final_escrito: 'academic/examen_final_escrito.html'
};
var CV_EXAM_NOMBRES = {
  examen_parcial_1: 'Parcial 1', examen_parcial_2: 'Parcial 2', examen_virtual: 'Examen Virtual',
  examen_virtual_completo: 'Examen Virtual Completo', examen_final_virtual: 'Final Virtual', examen_final_escrito: 'Final Escrito'
};

// ── Utilidades ──

function cvExamBaseUrl() {
  var u = PropertiesService.getScriptProperties().getProperty('EXAM_BASE_URL') || 'https://wmlumen.github.io/CampusVirtual/app/';
  return u.replace(/\/?$/, '/');
}

// Devuelve la hoja; si no existe la crea con formato de texto (evita que Sheets convierta '2026-09-19' en fecha)
function cvExamHoja(ss, nombre, headers) {
  var sheet = ss.getSheetByName(nombre);
  if (!sheet) {
    sheet = ss.insertSheet(nombre);
    sheet.appendRow(headers);
    var r = sheet.getRange(1, 1, 1, headers.length);
    r.setFontWeight('bold'); r.setBackground('#007A33'); r.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.getRange(2, 1, 1000, headers.length).setNumberFormat('@');
  }
  return sheet;
}

// Filas de la hoja como objetos {Cabecera: valor, _row: n}
function cvExamFilas(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getDataRange().getValues();
  var h = data[0], out = [];
  for (var i = 1; i < data.length; i++) {
    var o = { _row: i + 1 };
    for (var j = 0; j < h.length; j++) o[h[j]] = data[i][j];
    out.push(o);
  }
  return out;
}

// Texto de fecha 'yyyy-MM-dd' / hora 'HH:mm' aunque Sheets haya guardado un Date
function cvExamTxt(v, tipo) {
  if (v instanceof Date) return Utilities.formatDate(v, CV_TZ, tipo === 'hora' ? 'HH:mm' : 'yyyy-MM-dd');
  return String(v == null ? '' : v).trim();
}

// 'yyyy-MM-dd' + 'HH:mm' (hora de Asunción) → milisegundos
function cvExamMs(fecha, hora) {
  var f = String(fecha || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  var h = String(hora || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!f || !h) return 0;
  var d = Utilities.parseDate(f[1] + '-' + f[2] + '-' + f[3] + ' ' + ('0' + h[1]).slice(-2) + ':' + h[2], CV_TZ, 'yyyy-MM-dd HH:mm');
  return d.getTime();
}

function cvExamFmtMs(ms) {
  return Utilities.formatDate(new Date(ms), CV_TZ, 'dd/MM/yyyy HH:mm');
}

function cvExamConfigNormalizada(r) {
  var fi = cvExamTxt(r.FechaInicio, 'fecha'), hi = cvExamTxt(r.HoraInicio, 'hora');
  var fc = cvExamTxt(r.FechaCierre, 'fecha'), hc = cvExamTxt(r.HoraCierre, 'hora');
  return {
    examen_id: String(r.ExamenId), asignatura: String(r.Asignatura),
    habilitado: String(r.Habilitado).toLowerCase() === 'sí' || String(r.Habilitado).toLowerCase() === 'si',
    fecha_inicio: fi, hora_inicio: hi, fecha_cierre: fc, hora_cierre: hc,
    inicio_ms: cvExamMs(fi, hi), cierre_ms: cvExamMs(fc, hc),
    intentos: parseInt(r.Intentos, 10) || 1
  };
}

function cvExamBuscarConfig(ss, examenId, asignatura) {
  var filas = cvExamFilas(ss.getSheetByName('ConfigExamen'));
  for (var i = 0; i < filas.length; i++) {
    if (String(filas[i].ExamenId) === examenId && String(filas[i].Asignatura) === asignatura) return cvExamConfigNormalizada(filas[i]);
  }
  return null;
}

// ¿La cédula pertenece a alguien autorizado a habilitar exámenes?
function cvExamenPuedeHabilitar(ss, cedula) {
  var ced = cvAuthNormalizeCedula(cedula);
  if (!ced) return false;
  var u = cvAuthFindUser(ss, ced);
  if (u && u.estado !== 'inactivo' && u.estado !== 'bloqueado' &&
      CV_ROLES_HABILITADORES.indexOf(String(u.rol || '').toLowerCase().trim()) >= 0) return true;
  var sheetRoles = ss.getSheetByName('Roles');
  if (sheetRoles && sheetRoles.getLastRow() > 1) {
    var rd = sheetRoles.getDataRange().getValues();
    for (var i = 1; i < rd.length; i++) {
      if (cvAuthNormalizeCedula(rd[i][0]) === ced &&
          CV_ROLES_HABILITADORES.indexOf(String(rd[i][2] || '').toLowerCase().trim()) >= 0 &&
          String(rd[i][6] || 'activo').toLowerCase() !== 'inactivo') return true;
    }
  }
  return false;
}

function cvExamenValidarId(examenId) {
  examenId = String(examenId || '').trim();
  if (!CV_EXAM_PAGINAS.hasOwnProperty(examenId)) throw new Error('Examen desconocido.');
  return examenId;
}

// ── Pagos: últimos N por cédula (excluye anulados). Acepta cedula=... o cedulas=a,b,c ──

function cvPagoFechaMs(v) {
  if (v instanceof Date) return v.getTime();
  var t = String(v || '').trim();
  if (!t) return 0;
  var m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)).getTime();
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)).getTime();
  var d = new Date(t);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function cvPagoFechaTexto(v) {
  if (v instanceof Date) return Utilities.formatDate(v, CV_TZ, 'dd/MM/yyyy');
  return String(v || '');
}

function cvPagosUltimos(ss, params) {
  params = params || {};
  var lista = String(params.cedulas || params.cedula || '').split(',')
    .map(function (c) { return cvAuthNormalizeCedula(c); })
    .filter(function (c) { return c; });
  if (!lista.length) throw new Error('Falta la cédula del alumno.');
  var limite = Math.max(1, Math.min(12, parseInt(params.limite, 10) || CV_PAGOS_A_MOSTRAR));

  var pedidas = {};
  lista.forEach(function (c) { pedidas[c] = []; });

  var sheet = ss.getSheetByName('Pagos');
  if (sheet && sheet.getLastRow() > 1) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var ced = cvAuthNormalizeCedula(data[i][0]);
      if (!pedidas.hasOwnProperty(ced)) continue;
      var estado = String(data[i][5] || 'pendiente').toLowerCase().trim();
      if (estado === 'anulado') continue;
      pedidas[ced].push({
        _ms: cvPagoFechaMs(data[i][4]), _fila: i,
        concepto: String(data[i][2] || ''),
        monto: Number(data[i][3]) || 0,
        fecha: cvPagoFechaTexto(data[i][4]),
        estado: estado,
        comprobante: String(data[i][6] || ''),
        factura: String(data[i][8] || ''),
        tipo: String(data[i][9] || 'modulo')
      });
    }
  }

  var resultados = {};
  lista.forEach(function (c) {
    var pagos = pedidas[c].sort(function (a, b) { return (b._ms - a._ms) || (b._fila - a._fila); }).slice(0, limite);
    var pendientes = pagos.filter(function (p) { return p.estado !== 'pagado'; }).length;
    pagos.forEach(function (p) { delete p._ms; delete p._fila; });
    resultados[c] = { pagos: pagos, total: pagos.length, pendientes: pendientes, al_dia: pagos.length > 0 && pendientes === 0 };
  });
  return { ok: true, limite: limite, resultados: resultados };
}

// Estado de la factura que cargó el alumno frente a la hoja Pagos: 'Sí' (pagada) | 'Pendiente' | 'No' (no figura)
function cvExamVerificarFactura(ss, cedula, factura) {
  var sheet = ss.getSheetByName('Pagos');
  if (!sheet || sheet.getLastRow() < 2) return 'No';
  var data = sheet.getDataRange().getValues();
  var f = String(factura).toLowerCase().trim(), res = 'No';
  for (var i = 1; i < data.length; i++) {
    if (cvAuthNormalizeCedula(data[i][0]) !== cedula) continue;
    if (String(data[i][8] || '').toLowerCase().trim() !== f) continue;
    var est = String(data[i][5] || 'pendiente').toLowerCase().trim();
    if (est === 'anulado') continue;
    if (est === 'pagado') return 'Sí';
    res = 'Pendiente';
  }
  return res;
}

// ── Configuración del examen (docente): ventana horaria + intentos ──

function cvExamenConfigListar(ss, params) {
  params = params || {};
  var asig = String(params.asignatura || '').trim();
  var out = cvExamFilas(ss.getSheetByName('ConfigExamen')).map(cvExamConfigNormalizada)
    .filter(function (c) { return !asig || c.asignatura === asig; });
  return { ok: true, configs: out };
}

// Lo que ve el alumno: configuraciones habilitadas cuyo cierre no pasó
function cvExamenConfigPublica(ss, params) {
  var examenId = cvExamenValidarId((params || {}).examen_id);
  var ahora = Date.now();
  var out = cvExamFilas(ss.getSheetByName('ConfigExamen')).map(cvExamConfigNormalizada)
    .filter(function (c) { return c.examen_id === examenId && c.habilitado && c.cierre_ms > ahora; })
    .map(function (c) { return { asignatura: c.asignatura, fecha_inicio: c.fecha_inicio, hora_inicio: c.hora_inicio, fecha_cierre: c.fecha_cierre, hora_cierre: c.hora_cierre, intentos: c.intentos }; });
  return { ok: true, configs: out };
}

function cvExamenConfigGuardar(ss, data) {
  data = data || {};
  if (!cvExamenPuedeHabilitar(ss, data.docente_cedula)) throw new Error('No tenés permiso para habilitar exámenes.');
  var examenId = cvExamenValidarId(data.examen_id);
  var asig = cvAuthSanitizeText(data.asignatura, 60);
  if (!asig) throw new Error('Falta la asignatura.');
  var habilitado = !(data.habilitado === false || String(data.habilitado).toLowerCase() === 'false');
  var fi = String(data.fecha_inicio || '').trim(), hi = String(data.hora_inicio || '').trim();
  var fc = String(data.fecha_cierre || '').trim(), hc = String(data.hora_cierre || '').trim();
  var intentos = parseInt(data.intentos, 10);
  if (habilitado) {
    var ini = cvExamMs(fi, hi), cie = cvExamMs(fc, hc);
    if (!ini || !cie) throw new Error('Indicá fecha y hora de inicio y de cierre.');
    if (cie <= ini) throw new Error('El cierre debe ser posterior al inicio.');
    if (!(intentos >= 1 && intentos <= 99)) throw new Error('La cantidad de intentos debe ser un número entre 1 y 99.');
  }
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Servidor ocupado. Intentá de nuevo.');
  try {
    var sheet = cvExamHoja(ss, 'ConfigExamen', CV_CONFIG_EXAMEN_HEADERS);
    var fila = [examenId, asig, habilitado ? 'Sí' : 'No', fi, hi, fc, hc, intentos || 1,
      cvAuthNormalizeCedula(data.docente_cedula), Utilities.formatDate(new Date(), CV_TZ, 'dd/MM/yyyy HH:mm')];
    var existente = cvExamFilas(sheet).filter(function (r) { return String(r.ExamenId) === examenId && String(r.Asignatura) === asig; })[0];
    if (existente) sheet.getRange(existente._row, 1, 1, fila.length).setValues([fila]);
    else sheet.appendRow(fila);
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
  return { ok: true, mensaje: habilitado ? 'Examen habilitado con la ventana e intentos indicados.' : 'Examen deshabilitado.' };
}

// ── Clave + mail ──

function cvExamGenerarClave() {
  var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // sin 0/O/1/I para no confundir al tipear
  var hex = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  var c = '';
  for (var i = 0; i < 8; i++) c += abc.charAt(parseInt(hex.substr(i * 2, 2), 16) % abc.length);
  return c;
}

function cvExamEnviarMail(usuario, examenId, cfg, clave) {
  var email = String(usuario.email || '').trim();
  var nombre = String(usuario.nombre || '').trim();
  var pagina = cvExamBaseUrl() + CV_EXAM_PAGINAS[examenId];
  var enlaceClave = pagina + '?em=' + encodeURIComponent(email) + '&k=' + encodeURIComponent(clave);
  var nombreExamen = CV_EXAM_NOMBRES[examenId] || examenId;
  var ventana = 'Desde ' + cvExamFmtMs(cfg.inicio_ms) + ' hasta ' + cvExamFmtMs(cfg.cierre_ms) + ' (hora de Asunción)';
  var intentos = cfg.intentos + (cfg.intentos === 1 ? ' intento' : ' intentos');
  var remitente = PropertiesService.getScriptProperties().getProperty('EXAM_MAIL_REMITENTE') || '';
  var rnombre = 'Instituto Superior Centuria';

  var texto = 'Hola ' + nombre + ',\n\nTu examen ' + nombreExamen + ' (' + cfg.asignatura + ') está habilitado.\n\n' +
    'Disponible: ' + ventana + '\nIntentos: ' + intentos + '\n\n' +
    'Opción 1 - Ingresar directamente (la clave ya viene cargada):\n' + enlaceClave + '\n\n' +
    'Opción 2 - Abrir el examen e ingresar tu mail y esta clave:\n' + pagina + '\nClave: ' + clave + '\n\n' +
    'La clave es personal. No la compartas.\n' + rnombre;

  var html = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:460px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0">' +
    '<h2 style="color:#0f172a;margin:0 0 12px;font-size:18px">Hola ' + cvAuthSanitizeText(nombre, 80) + ',</h2>' +
    '<p style="color:#334155;font-size:14px;line-height:1.5;margin:0 0 14px">Tu examen <strong>' + nombreExamen + '</strong> (' + cvAuthSanitizeText(cfg.asignatura, 60) + ') está habilitado.</p>' +
    '<p style="color:#334155;font-size:13px;line-height:1.6;margin:0 0 16px">📅 ' + ventana + '<br>🔁 ' + intentos + '</p>' +
    '<p style="text-align:center;margin:0 0 18px"><a href="' + enlaceClave + '" style="display:inline-block;background:#007A33;color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 22px;border-radius:10px">Ingresar directamente al examen</a></p>' +
    '<p style="color:#334155;font-size:13px;line-height:1.5;margin:0 0 8px">O abrí <a href="' + pagina + '" style="color:#007A33">el examen</a> e ingresá tu mail y esta clave:</p>' +
    '<div style="background:#007A33;color:#ffffff;text-align:center;padding:16px 10px;border-radius:12px;margin:0 0 16px">' +
    '<span style="font-family:\'Courier New\',Courier,monospace;font-size:28px;font-weight:bold;letter-spacing:6px;user-select:all">' + clave + '</span></div>' +
    '<p style="color:#64748b;font-size:12px;margin:0">La clave es personal. No la compartas.</p>' +
    '<p style="color:#94a3b8;font-size:11px;margin:18px 0 0;padding-top:12px;border-top:1px solid #e2e8f0">' + rnombre + '</p></div>';

  var opts = { to: email, subject: 'Tu examen ' + nombreExamen + ' — enlace y clave de acceso', body: texto, htmlBody: html, name: rnombre };
  if (remitente) opts.replyTo = remitente;
  MailApp.sendEmail(opts);
}

// Genera clave nueva, la guarda como hash, pasa a 'habilitado' y envía el mail. Devuelve el mail al que se envió.
function cvExamEmitirClave(ss, fila, cfg, usuario, resueltoPor) {
  var email = String(usuario.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('El alumno no tiene un correo válido en su perfil.');
  var clave = cvExamGenerarClave();
  var salt = Utilities.getUuid();
  cvExamEnviarMail({ email: email, nombre: usuario.nombre }, String(fila.ExamenId), cfg, clave);   // si el mail falla, no se toca la hoja
  var sheet = ss.getSheetByName('AccesoExamen');
  var h = CV_ACCESO_EXAMEN_HEADERS;
  sheet.getRange(fila._row, h.indexOf('Email') + 1).setValue(email);
  sheet.getRange(fila._row, h.indexOf('Estado') + 1).setValue('habilitado');
  sheet.getRange(fila._row, h.indexOf('ClaveHash') + 1).setValue(cvAuthHash(clave, salt));
  sheet.getRange(fila._row, h.indexOf('Salt') + 1).setValue(salt);
  sheet.getRange(fila._row, h.indexOf('ResueltoPor') + 1).setValue(resueltoPor);
  sheet.getRange(fila._row, h.indexOf('Fecha') + 1).setValue(Utilities.formatDate(new Date(), CV_TZ, 'dd/MM/yyyy HH:mm'));
  sheet.getRange(fila._row, h.indexOf('EmitidoMs') + 1).setValue(String(Date.now()));
  return email;
}

function cvExamSnapshotPagos(ss, cedula) {
  var pg = cvPagosUltimos(ss, { cedula: cedula }).resultados[cedula] || { pagos: [] };
  return pg.pagos.map(function (p) { return (p.factura || 's/f') + ' · ' + p.fecha + ' · ' + p.monto + ' · ' + p.estado; }).join(' | ');
}

// ── Alumno: carga su N° de factura ──

function cvExamenSolicitar(ss, data) {
  data = data || {};
  var ced = cvAuthNormalizeCedula(data.cedula);
  var examenId = cvExamenValidarId(data.examen_id);
  var asig = cvAuthSanitizeText(data.asignatura, 60);
  var factura = cvAuthSanitizeText(data.factura, 40);
  if (!ced) throw new Error('Falta tu cédula.');
  if (!asig) throw new Error('Elegí la asignatura.');
  if (!/^[A-Za-z0-9][A-Za-z0-9\-\/\. ]{2,39}$/.test(factura)) throw new Error('Ingresá el N° de factura tal como figura en tu comprobante.');
  var usuario = cvAuthFindUser(ss, ced);
  if (!usuario) throw new Error('No encontramos tu usuario.');
  if (usuario.estado === 'inactivo' || usuario.estado === 'bloqueado') throw new Error('Tu cuenta no está activa. Consultá con Secretaría.');
  var cfg = cvExamBuscarConfig(ss, examenId, asig);
  if (!cfg || !cfg.habilitado || cfg.cierre_ms <= Date.now()) throw new Error('Este examen todavía no fue habilitado por el docente para esa asignatura.');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Servidor ocupado. Intentá de nuevo.');
  try {
    var sheet = cvExamHoja(ss, 'AccesoExamen', CV_ACCESO_EXAMEN_HEADERS);
    var nombre = ((usuario.nombre || '') + ' ' + (usuario.apellido || '')).trim();
    var email = String(usuario.email || '').trim();
    var verificada = cvExamVerificarFactura(ss, ced, factura);
    var fila = cvExamFilas(sheet).filter(function (r) {
      return cvAuthNormalizeCedula(r['Cédula']) === ced && String(r.ExamenId) === examenId && String(r.Asignatura) === asig;
    })[0];

    if (fila && String(fila.Estado) === 'rechazado') throw new Error('Tu solicitud fue rechazada por el docente. Consultá con él.');
    if (fila && String(fila.Estado) === 'habilitado' && Date.now() - (parseInt(fila.EmitidoMs, 10) || 0) < CV_EXAM_REENVIO_MS)
      throw new Error('Ya te enviamos el mail hace instantes. Revisá tu bandeja (y spam) o probá de nuevo en unos minutos.');

    if (!fila) {
      sheet.appendRow([ced, nombre, email, asig, examenId, factura, verificada, 'solicitado', '', '', '',
        Utilities.formatDate(new Date(), CV_TZ, 'dd/MM/yyyy HH:mm'), '', cvExamSnapshotPagos(ss, ced), '']);
      fila = cvExamFilas(sheet).filter(function (r) { return r._row === sheet.getLastRow(); })[0];
    } else {
      var h = CV_ACCESO_EXAMEN_HEADERS;
      sheet.getRange(fila._row, h.indexOf('Factura') + 1).setValue(factura);
      sheet.getRange(fila._row, h.indexOf('FacturaVerificada') + 1).setValue(verificada);
      sheet.getRange(fila._row, h.indexOf('PagosSnapshot') + 1).setValue(cvExamSnapshotPagos(ss, ced));
      fila.Factura = factura;
    }

    if (verificada === 'Sí') {
      var enviadoA = cvExamEmitirClave(ss, fila, cfg, { email: email, nombre: nombre }, 'automático');
      SpreadsheetApp.flush();
      return { ok: true, estado: 'habilitado', mensaje: 'Factura verificada. Te enviamos el enlace y la clave a ' + cvExamEnmascarar(enviadoA) + '.' };
    }
    SpreadsheetApp.flush();
    return { ok: true, estado: 'solicitado', mensaje: verificada === 'Pendiente'
      ? 'Tu factura figura con pago pendiente. El docente revisará tu solicitud y, si te habilita, recibirás el enlace por mail.'
      : 'No pudimos verificar esa factura automáticamente. El docente revisará tu solicitud y, si te habilita, recibirás el enlace por mail.' };
  } finally { lock.releaseLock(); }
}

function cvExamEnmascarar(email) {
  var p = String(email).split('@');
  return p.length < 2 ? email : p[0].charAt(0) + '***@' + p[1];
}

// ── Docente: solicitudes con los 4 últimos pagos, y decisión ──

function cvExamenSolicitudes(ss, params) {
  params = params || {};
  var asig = String(params.asignatura || '').trim();
  var examenId = String(params.examen_id || '').trim();
  var filas = cvExamFilas(ss.getSheetByName('AccesoExamen')).filter(function (r) {
    return (!asig || String(r.Asignatura) === asig) && (!examenId || String(r.ExamenId) === examenId);
  });
  var cedulas = [];
  var solicitudes = filas.map(function (r) {
    var ced = cvAuthNormalizeCedula(r['Cédula']);
    if (cedulas.indexOf(ced) < 0) cedulas.push(ced);
    var intentosUsados = cvExamFilas(ss.getSheetByName('IntentosExamen')).filter(function (i) {
      return cvAuthNormalizeCedula(i['Cédula']) === ced && String(i.ExamenId) === String(r.ExamenId) && String(i.Asignatura) === String(r.Asignatura);
    }).length;
    return {
      cedula: ced, nombre: r.Nombre, email: r.Email, asignatura: String(r.Asignatura), examen_id: String(r.ExamenId),
      factura: String(r.Factura), factura_verificada: String(r.FacturaVerificada), estado: String(r.Estado),
      resuelto_por: r.ResueltoPor, fecha: cvExamTxt(r.Fecha, 'fecha'), observacion: r['Observación'] || '', intentos_usados: intentosUsados
    };
  });
  var pagos = cedulas.length ? cvPagosUltimos(ss, { cedulas: cedulas.join(',') }).resultados : {};
  return { ok: true, solicitudes: solicitudes, pagos: pagos };
}

function cvExamenResolver(ss, data) {
  data = data || {};
  var docente = cvAuthNormalizeCedula(data.docente_cedula);
  if (!cvExamenPuedeHabilitar(ss, docente)) throw new Error('No tenés permiso para habilitar exámenes.');
  var ced = cvAuthNormalizeCedula(data.cedula);
  var examenId = cvExamenValidarId(data.examen_id);
  var asig = cvAuthSanitizeText(data.asignatura, 60);
  var decision = String(data.decision || '');
  if (['habilitar', 'rechazar'].indexOf(decision) < 0) throw new Error('Decisión no válida.');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Servidor ocupado. Intentá de nuevo.');
  try {
    var sheet = ss.getSheetByName('AccesoExamen');
    var fila = cvExamFilas(sheet).filter(function (r) {
      return cvAuthNormalizeCedula(r['Cédula']) === ced && String(r.ExamenId) === examenId && String(r.Asignatura) === asig;
    })[0];
    if (!fila) throw new Error('No hay solicitud de ese alumno para este examen.');
    var h = CV_ACCESO_EXAMEN_HEADERS;
    if (decision === 'rechazar') {
      sheet.getRange(fila._row, h.indexOf('Estado') + 1).setValue('rechazado');
      sheet.getRange(fila._row, h.indexOf('ClaveHash') + 1).setValue('');   // invalida cualquier clave ya enviada
      sheet.getRange(fila._row, h.indexOf('ResueltoPor') + 1).setValue(docente);
      sheet.getRange(fila._row, h.indexOf('Observación') + 1).setValue(cvAuthSanitizeText(data.observacion, 300));
      SpreadsheetApp.flush();
      return { ok: true, estado: 'rechazado', mensaje: 'Solicitud rechazada.' };
    }
    var cfg = cvExamBuscarConfig(ss, examenId, asig);
    if (!cfg || !cfg.habilitado) throw new Error('Primero configurá fecha, hora e intentos del examen.');
    if (cfg.cierre_ms <= Date.now()) throw new Error('La ventana del examen ya cerró. Actualizá las fechas.');
    var usuario = cvAuthFindUser(ss, ced) || {};
    var enviadoA = cvExamEmitirClave(ss, fila, cfg, { email: usuario.email || fila.Email, nombre: fila.Nombre }, docente);
    sheet.getRange(fila._row, h.indexOf('Observación') + 1).setValue(cvAuthSanitizeText(data.observacion, 300));
    sheet.getRange(fila._row, h.indexOf('PagosSnapshot') + 1).setValue(cvExamSnapshotPagos(ss, ced));
    SpreadsheetApp.flush();
    return { ok: true, estado: 'habilitado', mensaje: 'Alumno habilitado. Se envió el enlace y la clave a ' + cvExamEnmascarar(enviadoA) + '.' };
  } finally { lock.releaseLock(); }
}

// ── Alumno: entra al examen (enlace directo o mail + clave) ──

function cvExamenAccesoValidar(ss, data) {
  data = data || {};
  var examenId = cvExamenValidarId(data.examen_id);
  var email = String(data.email || '').trim().toLowerCase();
  var clave = String(data.clave || '').trim().toUpperCase();
  if (!email || !clave) return { ok: false, motivo: 'datos', mensaje: 'Ingresá tu mail y la clave que te enviamos.' };

  var cache = CacheService.getScriptCache();
  var claveCache = 'exf:' + email;
  var fallos = parseInt(cache.get(claveCache), 10) || 0;
  if (fallos >= CV_EXAM_MAX_FALLOS) return { ok: false, motivo: 'bloqueado', mensaje: 'Demasiados intentos con clave incorrecta. Esperá 15 minutos y probá de nuevo.' };

  var fila = cvExamFilas(ss.getSheetByName('AccesoExamen')).filter(function (r) {
    return String(r.ExamenId) === examenId && String(r.Email).trim().toLowerCase() === email &&
      String(r.Estado) === 'habilitado' && String(r.ClaveHash) && cvDocenteEqual(cvAuthHash(clave, r.Salt), String(r.ClaveHash));
  })[0];
  if (!fila) {
    cache.put(claveCache, String(fallos + 1), 900);
    return { ok: false, motivo: 'clave', mensaje: 'Mail o clave incorrectos.' };
  }

  var ced = cvAuthNormalizeCedula(fila['Cédula']);
  var asig = String(fila.Asignatura);
  var cfg = cvExamBuscarConfig(ss, examenId, asig);
  if (!cfg || !cfg.habilitado) return { ok: false, motivo: 'deshabilitado', mensaje: 'El docente deshabilitó este examen.' };
  var ahora = Date.now();
  if (ahora < cfg.inicio_ms) return { ok: false, motivo: 'no_iniciado', mensaje: 'El examen todavía no comenzó. Se abre el ' + cvExamFmtMs(cfg.inicio_ms) + ' (hora de Asunción).', inicio_ms: cfg.inicio_ms };
  if (ahora >= cfg.cierre_ms) return { ok: false, motivo: 'cerrado', mensaje: 'El examen cerró el ' + cvExamFmtMs(cfg.cierre_ms) + '.' };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Servidor ocupado. Intentá de nuevo.');
  try {
    var sheet = cvExamHoja(ss, 'IntentosExamen', CV_INTENTOS_EXAMEN_HEADERS);
    var previos = cvExamFilas(sheet).filter(function (i) {
      return cvAuthNormalizeCedula(i['Cédula']) === ced && String(i.ExamenId) === examenId && String(i.Asignatura) === asig;
    });
    var sesionId = String(data.sesion_id || '');
    var abierta = sesionId ? previos.filter(function (i) { return String(i.SesionId) === sesionId && ahora - (parseInt(i.InicioMs, 10) || 0) < CV_EXAM_SESION_MAX_MS; })[0] : null;
    var intento;
    if (abierta) {
      intento = parseInt(abierta.Intento, 10);
    } else {
      if (previos.length >= cfg.intentos) return { ok: false, motivo: 'sin_intentos', mensaje: 'Ya usaste todos tus intentos (' + cfg.intentos + ').' };
      intento = previos.length + 1;
      sesionId = Utilities.getUuid();
      sheet.appendRow([ced, examenId, asig, intento, sesionId, String(ahora), cvExamFmtMs(ahora)]);
      SpreadsheetApp.flush();
    }
    cache.remove(claveCache);
    return { ok: true, sesion_id: sesionId, intento: intento, intentos_max: cfg.intentos, cierre_ms: cfg.cierre_ms, cedula: ced, nombre: fila.Nombre, asignatura: asig };
  } finally { lock.releaseLock(); }
}
