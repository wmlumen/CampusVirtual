// ══════════════════════════════════════════════════════════════
// v08.4: CURSOS ACTIVOS — gestión de cursos (grado + carrera + sección) y nómina de alumnos
// v08.2: ACCESO ACADÉMICO — asignación de docentes a grupos y aprobación de exámenes
//
// Asignación (hoja Roles, la misma que ya lee docente.html vía listar_cursos):
//   1. El docente se registra (queda 'pendiente') y/o solicita asignaturas.
//   2. Acceso Académico ve la cola en su panel (asignaciones_docentes), aprueba o rechaza la cuenta
//      y asigna asignatura + uno o más grupos (grado, carrera, sección): una fila de Roles por grupo.
//   3. Puede revocar una asignación (Estado = 'inactivo'; no se borra nada).
//
// Aprobación de exámenes (hoja AprobacionExamen, una fila por ExamenId):
//   Académico aprueba/rechaza/revoca cada examen ANTES de que los alumnos puedan rendirlo.
//   exam-lock.js consulta examen_estado_aprobacion.
//
// Requiere 02_Examenes_Factura_v08.4.gs (comparte CV_TZ, cvExamHoja, cvExamFilas, cvExamTxt, CV_EXAM_PAGINAS, CV_EXAM_NOMBRES,
// cvExamenValidarId) y las utilidades cvAuth* de 01_Script_Cloud_Completo_v08.4.1.gs.
// ══════════════════════════════════════════════════════════════

var CV_ROLES_ASIGNADORES = ['academico', 'académico', 'academic', 'admin', 'administrador', 'administrador_plataforma', 'admin_plataforma'];
var CV_ROLES_DOCENTE = ['docente', 'teacher'];
var CV_ROLES_HEADERS = ['Cédula', 'Nombre', 'Rol', 'Carrera', 'Sección', 'Asignatura', 'Estado', 'FechaAsignación', 'AsignadoPor', 'Grado'];
var CV_APROB_EXAMEN_HEADERS = ['ExamenId', 'Estado', 'AcademicoCédula', 'Motivo', 'Fecha', 'Actualizado'];
var CV_APROB_ESTADOS = ['pendiente', 'aprobado', 'rechazado'];

// ── Utilidades ──

function cvAsigNorm(s) { return String(s == null ? '' : s).toLowerCase().trim(); }

function cvAsigAhora() { return Utilities.formatDate(new Date(), CV_TZ, 'dd/MM/yyyy HH:mm'); }

// ¿Puede asignar docentes y aprobar exámenes? (rol en Usuarios o fila activa en Roles)
function cvAsigPuede(ss, cedula) {
  var ced = cvAuthNormalizeCedula(cedula);
  if (!ced) return false;
  var u = cvAuthFindUser(ss, ced);
  if (u && ['inactivo', 'bloqueado', 'pendiente', 'baja'].indexOf(cvAsigNorm(u.estado)) < 0 &&
      CV_ROLES_ASIGNADORES.indexOf(cvAsigNorm(u.rol)) >= 0) return true;
  var sh = ss.getSheetByName('Roles');
  if (sh && sh.getLastRow() > 1) {
    var rd = sh.getDataRange().getValues();
    for (var i = 1; i < rd.length; i++) {
      if (cvAuthNormalizeCedula(rd[i][0]) === ced && CV_ROLES_ASIGNADORES.indexOf(cvAsigNorm(rd[i][2])) >= 0 &&
          cvAsigNorm(rd[i][6] || 'activo') !== 'inactivo') return true;
    }
  }
  return false;
}

function cvAsigExigirPermiso(ss, cedula) {
  if (!cvAsigPuede(ss, cedula)) throw new Error('Solo Acceso Académico o administración pueden hacer esto.');
  return cvAuthNormalizeCedula(cedula);
}

function cvAsigHojaRoles(ss) {
  var sh = ss.getSheetByName('Roles');
  if (!sh) {
    sh = ss.insertSheet('Roles');
    sh.appendRow(CV_ROLES_HEADERS);
  } else if (!String(sh.getRange(1, 10).getValue() || '').trim() && sh.getLastRow() >= 1) {
    sh.getRange(1, 10).setValue('Grado');   // columna nueva al final: no rompe lecturas existentes
  }
  return sh;
}

function cvAsigFilasRolesDocente(ss) {
  var sh = ss.getSheetByName('Roles');
  var out = [];
  if (!sh || sh.getLastRow() < 2) return out;
  var rd = sh.getDataRange().getValues();
  for (var i = 1; i < rd.length; i++) {
    if (CV_ROLES_DOCENTE.indexOf(cvAsigNorm(rd[i][2])) < 0) continue;
    out.push({
      fila: i + 1, cedula: cvAuthNormalizeCedula(rd[i][0]), nombre: String(rd[i][1] || ''),
      carrera: String(rd[i][3] || ''), seccion: String(rd[i][4] || ''), asignatura: String(rd[i][5] || ''),
      estado: cvAsigNorm(rd[i][6] || 'activo') || 'activo', fecha: cvExamTxt(rd[i][7], 'fecha'),
      asignado_por: String(rd[i][8] || ''), grado: String(rd[i][9] || '')
    });
  }
  return out;
}

function cvAsigNombreCompleto(u) {
  return (String(u.nombre || '') + ' ' + String(u.apellido || '')).trim();
}

// Cambia el estado de la cuenta en Usuarios (busca la columna por cabecera)
function cvAsigSetEstadoUsuario(ss, cedula, estado) {
  var sh = ss.getSheetByName('Usuarios');
  if (!sh || sh.getLastRow() < 2) throw new Error('No se encontró la hoja de usuarios.');
  var data = sh.getDataRange().getValues();
  var norm = function (h) { return String(h).toLowerCase().trim().replace(/[^a-z0-9]/g, '_'); };
  var hdr = data[0].map(norm);
  var cCed = hdr.indexOf('cedula'), cEst = hdr.indexOf('estado');
  if (cCed < 0 || cEst < 0) throw new Error('La hoja de usuarios no tiene las columnas cédula/estado.');
  for (var i = 1; i < data.length; i++) {
    if (cvAuthNormalizeCedula(data[i][cCed]) === cedula) {
      sh.getRange(i + 1, cEst + 1).setValue(estado);
      var cUpd = hdr.indexOf('updated_at');
      if (cUpd >= 0) sh.getRange(i + 1, cUpd + 1).setValue(new Date().toISOString());
      return true;
    }
  }
  return false;
}

// ── Cola de docentes y sus asignaciones (GET asignaciones_docentes) ──

function cvAsigDocentesListar(ss, params) {
  params = params || {};
  cvAsigExigirPermiso(ss, params.academico_cedula);

  var filas = cvAsigFilasRolesDocente(ss);
  var porCed = {};
  filas.forEach(function (f) { (porCed[f.cedula] = porCed[f.cedula] || []).push(f); });

  var docentes = {}, orden = [];
  cvAuthGetAllUsers(ss).forEach(function (u) {
    var ced = cvAuthNormalizeCedula(u.cedula);
    if (!ced || CV_ROLES_DOCENTE.indexOf(cvAsigNorm(u.rol)) < 0) return;
    docentes[ced] = {
      cedula: ced, nombre: cvAsigNombreCompleto(u), email: String(u.email || ''),
      estado: cvAsigNorm(u.estado || 'activo') || 'activo',
      declarado: { grado: String(u.grado || ''), carrera: String(u.carrera || ''), seccion: String(u.seccion || '') }
    };
    orden.push(ced);
  });
  // docentes que solo figuran en Roles (rol agregado a una cuenta de alumno)
  Object.keys(porCed).forEach(function (ced) {
    if (docentes[ced]) return;
    var u = cvAuthFindUser(ss, ced) || {};
    docentes[ced] = {
      cedula: ced, nombre: cvAsigNombreCompleto(u) || porCed[ced][0].nombre, email: String(u.email || ''),
      estado: cvAsigNorm(u.estado || 'activo') || 'activo',
      declarado: { grado: String(u.grado || ''), carrera: String(u.carrera || ''), seccion: String(u.seccion || '') }
    };
    orden.push(ced);
  });

  var lista = orden.map(function (ced) {
    var d = docentes[ced];
    d.asignaciones = (porCed[ced] || []).map(function (f) {
      return { fila: f.fila, asignatura: f.asignatura, grado: f.grado, carrera: f.carrera, seccion: f.seccion, estado: f.estado, fecha: f.fecha, asignado_por: f.asignado_por };
    });
    d.activas = d.asignaciones.filter(function (a) { return a.estado !== 'inactivo'; }).length;
    d.pendiente = d.estado === 'pendiente';
    return d;
  });
  // primero las cuentas pendientes, luego las que aún no tienen grupos, luego el resto por nombre
  lista.sort(function (a, b) {
    var ra = a.pendiente ? 0 : (a.activas ? 2 : 1), rb = b.pendiente ? 0 : (b.activas ? 2 : 1);
    return ra !== rb ? ra - rb : String(a.nombre).localeCompare(String(b.nombre));
  });
  return {
    ok: true, docentes: lista,
    pendientes: lista.filter(function (d) { return d.pendiente; }).length,
    sin_asignar: lista.filter(function (d) { return !d.pendiente && !d.activas; }).length
  };
}

// ── Asignar asignatura + grupos (POST asignacion_guardar) ──
// data: { academico_cedula, docente_cedula, asignatura, grupos: [{grado, carrera, seccion}], aprobar }

function cvAsigGuardar(ss, data) {
  data = data || {};
  var academico = cvAsigExigirPermiso(ss, data.academico_cedula);
  var ced = cvAuthNormalizeCedula(data.docente_cedula);
  var asig = cvAuthSanitizeText(data.asignatura, 60);
  if (!ced) throw new Error('Falta el docente.');
  if (!asig) throw new Error('Elegí la asignatura.');
  var grupos = (data.grupos || []).map(function (g) {
    return { grado: cvAuthSanitizeText(g.grado, 40), carrera: cvAuthSanitizeText(g.carrera, 80), seccion: cvAuthSanitizeText(g.seccion, 20).toUpperCase() };
  }).filter(function (g) { return g.carrera && g.seccion; });
  if (!grupos.length) throw new Error('Agregá al menos un grupo (carrera y sección).');

  var usuario = cvAuthFindUser(ss, ced);
  var esDocente = (usuario && CV_ROLES_DOCENTE.indexOf(cvAsigNorm(usuario.rol)) >= 0) ||
    cvAsigFilasRolesDocente(ss).some(function (f) { return f.cedula === ced; });
  if (!usuario || !esDocente) throw new Error('Esa cédula no corresponde a un docente registrado.');
  var estadoU = cvAsigNorm(usuario.estado);
  if (['inactivo', 'bloqueado', 'baja'].indexOf(estadoU) >= 0) throw new Error('La cuenta del docente está ' + estadoU + '.');
  if (estadoU === 'pendiente' && !data.aprobar) throw new Error('La cuenta del docente está pendiente: aprobala junto con la asignación.');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Servidor ocupado. Intentá de nuevo.');
  try {
    var sh = cvAsigHojaRoles(ss);
    var existentes = cvAsigFilasRolesDocente(ss).filter(function (f) { return f.cedula === ced && f.asignatura === asig; });
    var agregados = 0, reactivados = 0, repetidos = 0;
    var nombre = cvAsigNombreCompleto(usuario);
    grupos.forEach(function (g) {
      var dup = existentes.filter(function (f) { return cvAsigNorm(f.carrera) === cvAsigNorm(g.carrera) && cvAsigNorm(f.seccion) === cvAsigNorm(g.seccion); })[0];
      if (dup) {
        if (dup.estado === 'inactivo') {
          sh.getRange(dup.fila, 7).setValue('activo');
          sh.getRange(dup.fila, 9).setValue(academico);
          sh.getRange(dup.fila, 10).setValue(g.grado);
          reactivados++;
        } else repetidos++;
        return;
      }
      sh.appendRow([ced, nombre, 'docente', g.carrera, g.seccion, asig, 'activo', cvAsigAhora(), academico, g.grado]);
      existentes.push({ fila: sh.getLastRow(), carrera: g.carrera, seccion: g.seccion, estado: 'activo' });
      agregados++;
    });
    var cuentaAprobada = false;
    if (estadoU === 'pendiente' && data.aprobar) cuentaAprobada = cvAsigSetEstadoUsuario(ss, ced, 'activo');
    SpreadsheetApp.flush();
    return {
      ok: true, agregados: agregados, reactivados: reactivados, repetidos: repetidos, cuenta_aprobada: cuentaAprobada,
      mensaje: 'Asignación guardada: ' + (agregados + reactivados) + ' grupo(s) para ' + nombre + ' en ' + asig +
        (repetidos ? ' (' + repetidos + ' ya existían)' : '') + (cuentaAprobada ? '. Cuenta aprobada.' : '.')
    };
  } finally { lock.releaseLock(); }
}

// ── Revocar una asignación (POST asignacion_revocar): Estado = 'inactivo' ──

function cvAsigRevocar(ss, data) {
  data = data || {};
  var academico = cvAsigExigirPermiso(ss, data.academico_cedula);
  var ced = cvAuthNormalizeCedula(data.docente_cedula);
  var fila = parseInt(data.fila, 10);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Servidor ocupado. Intentá de nuevo.');
  try {
    var f = cvAsigFilasRolesDocente(ss).filter(function (x) { return x.fila === fila && x.cedula === ced; })[0];
    if (!f) throw new Error('No se encontró esa asignación.');
    var sh = ss.getSheetByName('Roles');
    sh.getRange(fila, 7).setValue('inactivo');
    sh.getRange(fila, 9).setValue(academico);
    SpreadsheetApp.flush();
    return { ok: true, mensaje: 'Asignación revocada (' + f.asignatura + ' · ' + f.carrera + ' · ' + f.seccion + ').' };
  } finally { lock.releaseLock(); }
}

// ── Aprobar / rechazar la cuenta de un docente pendiente (POST asignacion_docente_decidir) ──

function cvAsigDocenteDecidir(ss, data) {
  data = data || {};
  cvAsigExigirPermiso(ss, data.academico_cedula);
  var ced = cvAuthNormalizeCedula(data.docente_cedula);
  var decision = String(data.decision || '');
  if (['aprobar', 'rechazar'].indexOf(decision) < 0) throw new Error('Decisión no válida.');
  var u = cvAuthFindUser(ss, ced);
  if (!u || CV_ROLES_DOCENTE.indexOf(cvAsigNorm(u.rol)) < 0) throw new Error('Esa cédula no es de un docente registrado.');
  if (cvAsigNorm(u.estado) !== 'pendiente') throw new Error('La cuenta ya no está pendiente.');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Servidor ocupado. Intentá de nuevo.');
  try {
    cvAsigSetEstadoUsuario(ss, ced, decision === 'aprobar' ? 'activo' : 'inactivo');
    SpreadsheetApp.flush();
    return { ok: true, estado: decision === 'aprobar' ? 'activo' : 'inactivo', mensaje: decision === 'aprobar' ? 'Cuenta de docente aprobada.' : 'Solicitud de docente rechazada.' };
  } finally { lock.releaseLock(); }
}

// ══════════════════════════════════════════════════════════════
// Aprobación académica de exámenes
// ══════════════════════════════════════════════════════════════

function cvAprobFilas(ss) {
  return cvExamFilas(ss.getSheetByName('AprobacionExamen'));
}

// Lista todos los exámenes con su estado. Se puede aprobar antes de que el docente lo configure.
function cvExamenAprobLista(ss, params) {
  params = params || {};
  cvAsigExigirPermiso(ss, params.academico_cedula);
  var aprob = {};
  cvAprobFilas(ss).forEach(function (r) { aprob[String(r.ExamenId)] = r; });
  var cfgs = cvExamFilas(ss.getSheetByName('ConfigExamen'));
  var out = Object.keys(CV_EXAM_PAGINAS).map(function (id) {
    var cs = cfgs.filter(function (c) { return String(c.ExamenId) === id; });
    var docentes = [], asignaturas = [], intentos = 0;
    cs.forEach(function (c) {
      var ced = cvAuthNormalizeCedula(c.ConfiguradoPor);
      var u = ced ? cvAuthFindUser(ss, ced) : null;
      var n = u ? cvAsigNombreCompleto(u) : ced;
      if (n && docentes.indexOf(n) < 0) docentes.push(n);
      if (asignaturas.indexOf(String(c.Asignatura)) < 0) asignaturas.push(String(c.Asignatura));
      intentos = Math.max(intentos, parseInt(c.Intentos, 10) || 0);
    });
    var a = aprob[id];
    return {
      examen_id: id, examen_nombre: CV_EXAM_NOMBRES[id] || id,
      docente_nombre: docentes.join(', '), asignaturas: asignaturas, configurado: cs.length > 0,
      num_intentos: intentos || null,
      estado: a ? String(a.Estado) : 'pendiente', fecha: a ? cvExamTxt(a.Actualizado) : '', motivo: a ? String(a.Motivo || '') : ''
    };
  });
  return { ok: true, examenes: out, pendientes_count: out.filter(function (e) { return e.estado === 'pendiente'; }).length };
}

// Decisión: estado = 'aprobado' | 'rechazado' | 'pendiente' (revocar)
function cvExamenAprobDecidir(ss, data, estado) {
  data = data || {};
  var academico = cvAsigExigirPermiso(ss, data.academico_cedula);
  var id = cvExamenValidarId(data.examen_id);
  if (CV_APROB_ESTADOS.indexOf(estado) < 0) throw new Error('Estado no válido.');
  var motivo = cvAuthSanitizeText(data.motivo, 300);
  if (estado === 'rechazado' && !motivo) motivo = 'Rechazado por Acceso Académico';
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Servidor ocupado. Intentá de nuevo.');
  try {
    var sh = cvExamHoja(ss, 'AprobacionExamen', CV_APROB_EXAMEN_HEADERS);
    var f = cvExamFilas(sh).filter(function (r) { return String(r.ExamenId) === id; })[0];
    var fila = [id, estado, academico, motivo, cvAsigAhora(), String(Date.now())];
    if (f) sh.getRange(f._row, 1, 1, fila.length).setValues([fila]);
    else sh.appendRow(fila);
    SpreadsheetApp.flush();
    var etiqueta = { aprobado: 'aprobado', rechazado: 'rechazado', pendiente: 'devuelto a pendiente' }[estado];
    return { ok: true, estado: estado, mensaje: '«' + (CV_EXAM_NOMBRES[id] || id) + '» ' + etiqueta + '.' };
  } finally { lock.releaseLock(); }
}

// Público (lo consulta exam-lock.js antes de mostrar el examen al alumno)
function cvExamenAprobEstado(ss, params) {
  params = params || {};
  var id = cvExamenValidarId(params.examen_id);
  var f = cvAprobFilas(ss).filter(function (r) { return String(r.ExamenId) === id; })[0];
  var estado = f ? String(f.Estado) : 'pendiente';
  return { ok: true, estado: estado, aprobado: estado === 'aprobado', fecha_aprobacion: f && estado === 'aprobado' ? cvExamTxt(f.Fecha) : null, academico_cedula: null };
}
