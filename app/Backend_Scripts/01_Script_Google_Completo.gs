/**
 * SCRIPT BACKEND CENTURIA - VERSIÓN 06.8
 * Sistema multi-rol + matrícula + asistencia con código + calendario + formularios + filiales + fotos en Drive
 * 
 * Hojas esperadas:
 * - RegistroAlumnos: [Cédula, Nombre, Apellido, Email, Grado, Carrera, Sección]
 * - Roles: [Cédula, Nombre, Rol, Carrera, Sección, Asignatura, Estado, FechaAsignación, AsignadoPor]
 * - Asistencias: [Fecha/Hora, Cédula, Unidad/Lugar, Observación]
 * - ProgresoUnidades: [Fecha/Hora, Cédula, Unidad, Sección, Estado]
 * - ProgresoDetalle: [Fecha/Hora, Cédula, Unidad, Sección, Leído, Página]
 * - Notas: [Cédula, Nombre, Asistencia, Parcial1, Parcial2, Final]
 * - Pagos: [Cédula, Nombre, Módulo, Monto, Fecha, Estado, Comprobante, RegistradoPor]
 * - Accesos: [Fecha/Hora, Cédula, Página, Dispositivo, Tipo]
 * - Matriculaciones: [ID, UUID, UserId, CodigoFormulario, LegajoNumero, FechaInscripcion, Nombres, Apellidos, Cedula, ...]
 * - FormulariosCarrera: [ID, UUID, Codigo, Nombre, Carrera, Campos, Activo, ...]
 * - FormulariosAlumno: [ID, UUID, FormularioId, UserId, Cedula, Datos, Estado, ...]
 * - AttendanceEvents: [ID, UUID, CodigoUnico, Asignatura, Unidad, Lugar, Fecha, HoraInicio, HoraFin, CreadoPor, Estado, ...]
 * - AttendanceRecords: [ID, UUID, EventId, UserId, Cedula, Estado, HoraRegistro, Observacion, ...]
 * - CalendarEvents: [ID, UUID, Titulo, Descripcion, FechaInicio, FechaFin, HoraInicio, HoraFin, Tipo, Color, CreadoPor, ...]
 * - Filiales: [ID, UUID, Nombre, Codigo, Direccion, Telefono, Estado, CreadoPor, ...]
 * - Fotos: [Cedula, Nombre, FileId, Url, Fecha] (solo URLs cortas; el archivo vive en Drive)
 * 
 * Changelog:
 * v05 (2026-09-15): Matrícula, asistencia con código, calendario, formularios, filiales
 * v06 (2026-09-15): Fotos de perfil en Google Drive (subir_foto, obtener_foto, eliminar_foto)
 * v06.1 (2026-09-16): Diagnóstico (action=diagnostico: nombre/ID de planilla + conteo de filas)
 * v06.2 (2026-09-16): Misma base en ambos lados: guardar_asignatura (upsert por Codigo)
 * v06.3 (2026-09-16): inicializarBaseDatos + poblarCatalogosBase (28 hojas)
 * v06.4 (2026-09-16): sembrar_todo por URL (datos conocidos) + TIC sin clave obligatoria
 * v06.5 (2026-09-16): registro sin asignatura forzada + listar_grados/carreras/secciones para el formulario
 * v06.6 (2026-09-16): verificar_alumno también busca en Roles (admin/docente entran en GitHub)
 * v06.7 (2026-09-16): enviar_provisoria por Gmail (remitente/replyTo configurable)
 * v06.8 (2026-09-16): seeds alineados a datos corregidos (12 carreras G-/E-/M-/D-, 9 secciones S026/LV026/MJ026)
 *         + cursos y catálogo leídos de la hoja Asignaturas (mapaAsignaturas)
 * v04: Multi-rol, progreso automático, pagos por módulo
 */

// ══════════════════════════════════════════════════════════════
// doGet - Peticiones GET
// ══════════════════════════════════════════════════════════════

function doGet(e) {
  if (!e || !e.parameter) return responderJSON({ ok: false, error: 'Falta parámetro action' });
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = e.parameter.action;

  // ── ASISTENCIA TIC ──
  if (action === 'resumen_asistencia_tic') {
    try { return responderJSON(ticResumen(ss, e.parameter.cedula)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── FOTO DE PERFIL EN DRIVE (v06) ──
  if (action === 'obtener_foto') {
    try { return responderJSON(obtenerFotoDrive(ss, e.parameter.cedula)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── DIAGNÓSTICO: qué planilla está conectada y cuántas filas tiene (v06) ──
  if (action === 'diagnostico') {
    try { return responderJSON(diagnosticoSheets(ss)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── SEMBRAR TODO con datos conocidos (v06.4, solo rellena hojas vacías) ──
  if (action === 'sembrar_todo') {
    try { return responderJSON(sembrarTodo(ss)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── VERIFICAR ALUMNO ──
  if (action === 'verificar_alumno') {
    var cedula = e.parameter.cedula;
    var sheetAlumnos = ss.getSheetByName('RegistroAlumnos');
    if (!sheetAlumnos) return responderJSON({ existe: false });

    var data = sheetAlumnos.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === cedula.toString()) {
        var nombre = data[i][1] || '';
        var apellido = data[i][2] || '';
        var nombreCompleto = (nombre + ' ' + apellido).trim();
        return responderJSON({
          existe: true,
          nombre: nombreCompleto || nombre,
          nombre_separado: { nombre: nombre, apellido: apellido },
          email: data[i][3] || '',
          grado: data[i][4] || '',
          carrera: data[i][5] || '',
          seccion: data[i][6] || ''
        });
      }
    }

    // ── v06.6: también buscar en Roles (admin/docentes no están en RegistroAlumnos) ──
    var sheetRoles = ss.getSheetByName('Roles');
    if (sheetRoles) {
      var dr = sheetRoles.getDataRange().getValues();
      for (var k = 1; k < dr.length; k++) {
        if (dr[k][0].toString() === cedula.toString()) {
          var est = (dr[k][6] || 'activo').toString().toLowerCase();
          if (est !== 'activo') continue;
          var full = (dr[k][1] || '').toString().trim();
          var parts = full.split(/\s+/);
          var nn = parts[0] || '';
          var aa = parts.slice(1).join(' ') || '';
          return responderJSON({
            existe: true,
            nombre: full,
            nombre_separado: { nombre: nn, apellido: aa },
            email: '',
            grado: '',
            carrera: dr[k][3] || '',
            seccion: dr[k][4] || '',
            rol: dr[k][2] || ''
          });
        }
      }
    }
    return responderJSON({ existe: false });
  }

  // ── VERIFICAR ROLES ──
  if (action === 'verificar_roles') {
    var cedula = e.parameter.cedula;
    var roles = obtenerRoles(ss, cedula);
    return responderJSON({ roles: roles });
  }

  // ── LISTAR CURSOS ──
  if (action === 'listar_cursos') {
    var cedula = e.parameter.cedula;
    var rol = e.parameter.rol || 'alumno';
    var carrera = e.parameter.carrera || '';
    var cursos = obtenerCursosPorRol(ss, cedula, rol, carrera);
    return responderJSON({ cursos: cursos });
  }

  // ── CONSULTAR PAGOS ──
  if (action === 'consultar_pagos') {
    var cedula = e.parameter.cedula;
    var pagos = obtenerPagos(ss, cedula);
    return responderJSON({ pagos: pagos });
  }

  // ── CONSULTAR PROGRESO ──
  if (action === 'consultar_progreso') {
    var cedula = e.parameter.cedula;
    var progreso = obtenerProgreso(ss, cedula);
    return responderJSON({ progreso: progreso });
  }

  // ── RESUMEN ADMIN ──
  if (action === 'resumen_admin') {
    var resumen = obtenerResumenAdmin(ss);
    return responderJSON(resumen);
  }

  // ════ v05: MATRÍCULA ════

  // ── VERIFICAR MATRÍCULA ──
  if (action === 'verificar_matricula') {
    var cedula = e.parameter.cedula;
    var resultado = verificarMatricula(ss, cedula);
    return responderJSON(resultado);
  }

  // ── OBTENER MI MATRÍCULA ──
  if (action === 'obtener_matricula') {
    var cedula = e.parameter.cedula;
    var matricula = obtenerMatricula(ss, cedula);
    return responderJSON(matricula);
  }

  // ── LISTAR MATRÍCULAS (admin) ──
  if (action === 'listar_matriculas') {
    var matriculas = listarMatriculas(ss);
    return responderJSON({ matriculas: matriculas });
  }

  // ── DETALLE MATRÍCULA ──
  if (action === 'detalle_matricula') {
    var id = e.parameter.id;
    var cedula = e.parameter.cedula;
    var detalle = detalleMatricula(ss, id, cedula);
    return responderJSON(detalle);
  }

  // ── ESTADÍSTICAS MATRÍCULA ──
  if (action === 'estadisticas_matricula') {
    var stats = estadisticasMatricula(ss);
    return responderJSON(stats);
  }

  // ════ v05: FORMULARIOS POR CARRERA ════

  // ── LISTAR FORMULARIOS ──
  if (action === 'listar_formularios') {
    var carrera = e.parameter.carrera || '';
    var formularios = listarFormularios(ss, carrera);
    return responderJSON({ formularios: formularios });
  }

  // ── OBTENER FORMULARIO ──
  if (action === 'obtener_formulario') {
    var codigo = e.parameter.codigo;
    var formulario = obtenerFormulario(ss, codigo);
    return responderJSON(formulario);
  }

  // ── FORMULARIOS DE UN ALUMNO ──
  if (action === 'mis_formularios') {
    var cedula = e.parameter.cedula;
    var formularios = misFormularios(ss, cedula);
    return responderJSON({ formularios: formularios });
  }

  // ── COMPLETITUD DE FORMULARIOS ──
  if (action === 'completitud_formularios') {
    var completitud = completitudFormularios(ss);
    return responderJSON(completitud);
  }

  // ════ v05: ASISTENCIA CON CÓDIGO ════

  // ── LISTAR EVENTOS DE ASISTENCIA ──
  if (action === 'listar_eventos_asistencia') {
    var asignatura = e.parameter.asignatura || '';
    var eventos = listarEventosAsistencia(ss, asignatura);
    return responderJSON({ eventos: eventos });
  }

  // ── VALIDAR CÓDIGO DE ASISTENCIA ──
  if (action === 'validar_codigo_asistencia') {
    var codigo = e.parameter.codigo;
    var resultado = validarCodigoAsistencia(ss, codigo);
    return responderJSON(resultado);
  }

  // ── DETALLE EVENTO DE ASISTENCIA ──
  if (action === 'detalle_evento_asistencia') {
    var eventoId = e.parameter.evento_id;
    var detalle = detalleEventoAsistencia(ss, eventoId);
    return responderJSON(detalle);
  }

  // ── MIS EVENTOS DE ASISTENCIA ──
  if (action === 'mis_eventos_asistencia') {
    var cedula = e.parameter.cedula;
    var eventos = misEventosAsistencia(ss, cedula);
    return responderJSON({ eventos: eventos });
  }

  // ════ v05: CALENDARIO ════

  // ── LISTAR EVENTOS DEL CALENDARIO ──
  if (action === 'listar_eventos_calendario') {
    var fechaInicio = e.parameter.fecha_inicio || '';
    var fechaFin = e.parameter.fecha_fin || '';
    var eventos = listarEventosCalendario(ss, fechaInicio, fechaFin);
    return responderJSON({ eventos: eventos });
  }

  // ── DETALLE EVENTO DEL CALENDARIO ──
  if (action === 'detalle_evento_calendario') {
    var eventoId = e.parameter.evento_id;
    var detalle = detalleEventoCalendario(ss, eventoId);
    return responderJSON(detalle);
  }

  // ── VERIFICAR CONFLICTOS DE HORARIO ──
  if (action === 'verificar_conflictos_calendario') {
    var fecha = e.parameter.fecha;
    var horaInicio = e.parameter.hora_inicio;
    var horaFin = e.parameter.hora_fin;
    var excludeId = e.parameter.exclude_id || '';
    var conflictos = verificarConflictosCalendario(ss, fecha, horaInicio, horaFin, excludeId);
    return responderJSON({ conflictos: conflictos });
  }

  // ════ v05: FILIALES ════

  // ── LISTAR FILIALES ──
  if (action === 'listar_filiales') {
    var filiales = listarFiliales(ss);
    return responderJSON({ filiales: filiales });
  }

  // ── ADMINS POR FILIAL ──
  if (action === 'admins_por_filial') {
    var filial = e.parameter.filial;
    var admins = adminsPorFilial(ss, filial);
    return responderJSON({ admins: admins });
  }

  // ── ASIGNATURAS (catálogo) ──
  if (action === 'listar_asignaturas') {
    var asignaturas = listarAsignaturas(ss);
    return responderJSON({ asignaturas: asignaturas });
  }

  // ── CATÁLOGOS para el formulario de registro (v06.5) ──
  if (action === 'listar_grados') {
    try { return responderJSON({ grados: listarCatalogoSimple(ss, 'Grados') }); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }
  if (action === 'listar_carreras') {
    try { return responderJSON({ carreras: listarCatalogoSimple(ss, 'Carreras') }); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }
  if (action === 'listar_secciones') {
    try { return responderJSON({ secciones: listarCatalogoSimple(ss, 'Secciones') }); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── DEFAULT: Notas (fallback) ──
  var sheetNotas = ss.getSheetByName('Notas') || ss.getActiveSheet();
  var dataNotas = sheetNotas.getDataRange().getValues();
  var result = [];
  for (var j = 1; j < dataNotas.length; j++) {
    var row = dataNotas[j];
    if (!row[0]) continue;
    result.push({
      cedula: row[0].toString(), nombre: row[1],
      asistencia: row[2] || 0, parcial1: row[3] || 0, parcial2: row[4] || 0, final: row[5] || 0
    });
  }
  return responderJSON(result);
}

// ══════════════════════════════════════════════════════════════
// doPost - Peticiones POST
// ══════════════════════════════════════════════════════════════

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = JSON.parse(e.postData.contents);

  // ── ASISTENCIA TIC ──
  if (data.action === 'guardar_clase_tic' || data.action === 'justificar_ausencia_tic') {
    try { return responderJSON(ticGuardar(ss, data)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── ESPEJO DE ASIGNATURAS SQLite -> Sheets (v06.2) ──
  if (data.action === 'guardar_asignatura') {
    try { return responderJSON(guardarAsignaturaDrive(ss, data)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── ENVIAR PROVISORIA POR EMAIL (v06.7, remitente configurable) ──
  if (data.action === 'enviar_provisoria') {
    try { return responderJSON(enviarProvisoria(ss, data)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── FOTOS DE PERFIL EN DRIVE (v06) ──
  if (data.action === 'subir_foto') {
    try { return responderJSON(subirFotoDrive(ss, data)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }
  if (data.action === 'eliminar_foto') {
    try { return responderJSON(eliminarFotoDrive(ss, data)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ════ ACCIONES LEGACY (v04) ════

  // ── 1. REGISTRAR ALUMNO ──
  if (data.action === 'registrar_alumno') {
    var sheetAlumnos = ss.getSheetByName('RegistroAlumnos');
    if (!sheetAlumnos) {
      sheetAlumnos = ss.insertSheet('RegistroAlumnos');
      sheetAlumnos.appendRow(['Cédula', 'Nombre', 'Apellido', 'Email', 'Grado', 'Carrera', 'Sección']);
    }
    var nombre = '', apellido = '';
    if (data.nombre_separado) {
      nombre = data.nombre_separado.nombre || '';
      apellido = data.nombre_separado.apellido || '';
    } else if (data.nombre) {
      var partes = data.nombre.trim().split(/\s+/);
      nombre = partes[0] || '';
      apellido = partes.slice(1).join(' ');
    }
    sheetAlumnos.appendRow([
      data.cedula, nombre, apellido, data.email || '',
      data.grado || '', data.carrera || '', data.seccion || ''
    ]);

    var sheetRoles = ss.getSheetByName('Roles');
    if (!sheetRoles) {
      sheetRoles = ss.insertSheet('Roles');
      sheetRoles.appendRow(['Cédula', 'Nombre', 'Rol', 'Carrera', 'Sección', 'Asignatura', 'Estado', 'FechaAsignación', 'AsignadoPor']);
    }
    var ts = new Date().toLocaleString('es-ES', { timeZone: 'America/Asuncion' });
    sheetRoles.appendRow([
      data.cedula, nombre + ' ' + apellido, 'alumno',
      data.carrera || '', data.seccion || '', data.asignatura || '',
      'activo', ts, 'auto-registro'
    ]);

    return responderJSON({ status: "Éxito", mensaje: "Alumno y rol registrado correctamente" });
  }

  // ── 2. ASIGNAR ROL ──
  if (data.action === 'asignar_rol') {
    var sheetRoles = ss.getSheetByName('Roles');
    if (!sheetRoles) {
      sheetRoles = ss.insertSheet('Roles');
      sheetRoles.appendRow(['Cédula', 'Nombre', 'Rol', 'Carrera', 'Sección', 'Asignatura', 'Estado', 'FechaAsignación', 'AsignadoPor']);
    }
    var ts2 = new Date().toLocaleString('es-ES', { timeZone: 'America/Asuncion' });
    sheetRoles.appendRow([
      data.cedula, data.nombre || '', data.rol || 'alumno',
      data.carrera || '', data.seccion || '', data.asignatura || '',
      data.estado || 'activo', ts2, data.asignado_por || 'admin'
    ]);
    return responderJSON({ status: "Éxito", mensaje: "Rol asignado correctamente" });
  }

  // ── 3. DESACTIVAR ROL ──
  if (data.action === 'desactivar_rol') {
    var sheetRoles2 = ss.getSheetByName('Roles');
    if (sheetRoles2) {
      var rolesData = sheetRoles2.getDataRange().getValues();
      for (var r = 1; r < rolesData.length; r++) {
        if (rolesData[r][0].toString() === data.cedula.toString() &&
          rolesData[r][2] === data.rol &&
          rolesData[r][3] === data.carrera) {
          sheetRoles2.getRange(r + 1, 7).setValue('inactivo');
          return responderJSON({ status: "Éxito", mensaje: "Rol desactivado" });
        }
      }
    }
    return responderJSON({ status: "Error", mensaje: "Rol no encontrado" });
  }

  // ── 4. MARCAR ASISTENCIA ──
  if (data.action === 'marcar_asistencia') {
    var sheetAsistencia = ss.getSheetByName('Asistencias');
    if (!sheetAsistencia) {
      sheetAsistencia = ss.insertSheet('Asistencias');
      sheetAsistencia.appendRow(['Fecha/Hora', 'Cédula', 'Unidad/Lugar', 'Observación']);
    }
    var ts3 = new Date().toLocaleString('es-ES', { timeZone: 'America/Asuncion' });
    sheetAsistencia.appendRow([ts3, data.cedula, data.unidad || "Presencial", data.observacion || ""]);
    return responderJSON({ status: "Éxito" });
  }

  // ── 5. REGISTRAR PROGRESO ──
  if (data.action === 'registrar_progreso') {
    var sheetProgreso = ss.getSheetByName('ProgresoUnidades');
    if (!sheetProgreso) {
      sheetProgreso = ss.insertSheet('ProgresoUnidades');
      sheetProgreso.appendRow(['Fecha/Hora', 'Cédula', 'Unidad', 'Sección', 'Estado']);
    }
    var ts4 = new Date().toLocaleString('es-ES', { timeZone: 'America/Asuncion' });
    sheetProgreso.appendRow([ts4, data.cedula, data.unidad || '', data.seccion || '', "Completado"]);
    return responderJSON({ status: "Éxito" });
  }

  // ── 6. GUARDAR CALIFICACIONES ──
  if (data.action === 'guardar_nota') {
    var sheetNotas = ss.getSheetByName('Notas');
    if (sheetNotas) {
      var notasData = sheetNotas.getDataRange().getValues();
      var colIndex = -1;
      if (data.evaluacion === 'parcial1') colIndex = 4;
      if (data.evaluacion === 'parcial2') colIndex = 5;
      if (data.evaluacion === 'final') colIndex = 6;
      if (colIndex !== -1) {
        for (var k = 1; k < notasData.length; k++) {
          if (notasData[k][0].toString() === data.cedula.toString()) {
            sheetNotas.getRange(k + 1, colIndex).setValue(data.puntaje);
            return responderJSON({ status: "Nota Guardada" });
          }
        }
      }
    }
    return responderJSON({ status: "Error: Alumno no encontrado en pestaña Notas" });
  }

  // ── 7. REGISTRAR ACCESO A CURSO ──
  if (data.action === 'registrar_acceso_curso') {
    return responderJSON({ status: "Acceso registrado" });
  }

  // ── 8. REGISTRAR PROGRESO DETALLADO ──
  if (data.action === 'registrar_progreso_detalle') {
    var sheetPD = ss.getSheetByName('ProgresoDetalle');
    if (!sheetPD) {
      sheetPD = ss.insertSheet('ProgresoDetalle');
      sheetPD.appendRow(['Fecha/Hora', 'Cédula', 'Unidad', 'Sección', 'Leído', 'Página']);
    }
    var ts5 = new Date().toLocaleString('es-ES', { timeZone: 'America/Asuncion' });
    var pdData = sheetPD.getDataRange().getValues();
    var encontrado = false;
    for (var p = 1; p < pdData.length; p++) {
      if (pdData[p][1].toString() === data.cedula.toString() &&
        pdData[p][2] === (data.unidad || '') &&
        pdData[p][3] === (data.seccion || '')) {
        sheetPD.getRange(p + 1, 5).setValue(data.leido ? 'Sí' : 'No');
        sheetPD.getRange(p + 1, 1).setValue(ts5);
        encontrado = true;
        break;
      }
    }
    if (!encontrado) {
      sheetPD.appendRow([
        ts5, data.cedula, data.unidad || '', data.seccion || '',
        data.leido ? 'Sí' : 'No', data.pagina || ''
      ]);
    }
    return responderJSON({ status: "Éxito", mensaje: "Progreso detallado registrado" });
  }

  // ── 9. REGISTRAR PAGO ──
  if (data.action === 'registrar_pago') {
    var sheetPagos = ss.getSheetByName('Pagos');
    if (!sheetPagos) {
      sheetPagos = ss.insertSheet('Pagos');
      sheetPagos.appendRow(['Cédula', 'Nombre', 'Módulo', 'Monto', 'Fecha', 'Estado', 'Comprobante', 'RegistradoPor']);
    }
    var ts6 = new Date().toLocaleString('es-ES', { timeZone: 'America/Asuncion' });
    sheetPagos.appendRow([
      data.cedula || '', data.nombre || '', data.modulo || '',
      data.monto || 0, data.fecha || ts6, data.estado || 'pendiente',
      data.comprobante || '', data.registrado_por || 'admin'
    ]);
    return responderJSON({ status: "Éxito", mensaje: "Pago registrado correctamente" });
  }

  // ── 10. ACTUALIZAR PAGO ──
  if (data.action === 'actualizar_pago') {
    var sheetPagos2 = ss.getSheetByName('Pagos');
    if (sheetPagos2) {
      var pagosData = sheetPagos2.getDataRange().getValues();
      for (var q = 1; q < pagosData.length; q++) {
        if (pagosData[q][0].toString() === data.cedula.toString() &&
          pagosData[q][2] === (data.modulo || '')) {
          if (data.estado) sheetPagos2.getRange(q + 1, 6).setValue(data.estado);
          if (data.comprobante) sheetPagos2.getRange(q + 1, 7).setValue(data.comprobante);
          return responderJSON({ status: "Éxito", mensaje: "Pago actualizado" });
        }
      }
    }
    return responderJSON({ status: "Error", mensaje: "Pago no encontrado" });
  }

  // ── 11. REGISTRAR ACCESO ──
  if (data.action === 'registrar_acceso') {
    var sheetAccesos = ss.getSheetByName('Accesos');
    if (!sheetAccesos) {
      sheetAccesos = ss.insertSheet('Accesos');
      sheetAccesos.appendRow(['Fecha/Hora', 'Cédula', 'Página', 'Dispositivo', 'Tipo']);
    }
    var ts7 = new Date().toLocaleString('es-ES', { timeZone: 'America/Asuncion' });
    sheetAccesos.appendRow([
      ts7, data.cedula || '', data.pagina || '',
      data.dispositivo || '', data.tipo || 'login'
    ]);
    return responderJSON({ status: "Éxito" });
  }

  // ── 12. SYNC MASIVO DE PROGRESO ──
  if (data.action === 'sync_progreso_batch') {
    var sheetPD2 = ss.getSheetByName('ProgresoDetalle');
    if (!sheetPD2) {
      sheetPD2 = ss.insertSheet('ProgresoDetalle');
      sheetPD2.appendRow(['Fecha/Hora', 'Cédula', 'Unidad', 'Sección', 'Leído', 'Página']);
    }
    var ts8 = new Date().toLocaleString('es-ES', { timeZone: 'America/Asuncion' });
    var registros = data.registros || [];
    var guardados = 0;
    var pdData2 = sheetPD2.getDataRange().getValues();

    for (var b = 0; b < registros.length; b++) {
      var reg = registros[b];
      var duplicado = false;
      for (var d = 1; d < pdData2.length; d++) {
        if (pdData2[d][1].toString() === (reg.cedula || data.cedula || '').toString() &&
          pdData2[d][2] === (reg.unidad || '') &&
          pdData2[d][3] === (reg.seccion || '')) {
          sheetPD2.getRange(d + 1, 5).setValue(reg.leido ? 'Sí' : 'No');
          sheetPD2.getRange(d + 1, 1).setValue(ts8);
          duplicado = true;
          guardados++;
          break;
        }
      }
      if (!duplicado) {
        sheetPD2.appendRow([
          ts8, reg.cedula || data.cedula || '', reg.unidad || '',
          reg.seccion || '', reg.leido ? 'Sí' : 'No', reg.pagina || ''
        ]);
        guardados++;
      }
    }
    return responderJSON({ status: "Éxito", guardados: guardados, total: registros.length });
  }

  // ════ v05: NUEVAS ACCIONES ════

  // ── 13. GUARDAR MATRÍCULA ──
  if (data.action === 'matricular_alumno') {
    var resultado = guardarMatricula(ss, data);
    return responderJSON(resultado);
  }

  // ── 14. ACTUALIZAR ESTADO DE MATRÍCULA ──
  if (data.action === 'actualizar_estado_matricula') {
    var resultado = actualizarEstadoMatricula(ss, data);
    return responderJSON(resultado);
  }

  // ── 15. ELIMINAR MATRÍCULA ──
  if (data.action === 'eliminar_matricula') {
    var resultado = eliminarMatricula(ss, data);
    return responderJSON(resultado);
  }

  // ── 16. CREAR FORMULARIO ──
  if (data.action === 'crear_formulario') {
    var resultado = crearFormulario(ss, data);
    return responderJSON(resultado);
  }

  // ── 17. ACTUALIZAR FORMULARIO ──
  if (data.action === 'actualizar_formulario') {
    var resultado = actualizarFormulario(ss, data);
    return responderJSON(resultado);
  }

  // ── 18. ELIMINAR FORMULARIO ──
  if (data.action === 'eliminar_formulario') {
    var resultado = eliminarFormulario(ss, data);
    return responderJSON(resultado);
  }

  // ── 19. GUARDAR DATOS DE FORMULARIO ──
  if (data.action === 'registrar_formulario') {
    var resultado = guardarFormularioAlumno(ss, data);
    return responderJSON(resultado);
  }

  // ── 20. CREAR EVENTO DE ASISTENCIA ──
  if (data.action === 'crear_evento_asistencia') {
    var resultado = crearEventoAsistencia(ss, data);
    return responderJSON(resultado);
  }

  // ── 21. CERRAR EVENTO DE ASISTENCIA ──
  if (data.action === 'cerrar_evento_asistencia') {
    var resultado = cerrarEventoAsistencia(ss, data);
    return responderJSON(resultado);
  }

  // ── 22. REGISTRAR ASISTENCIA POR CÓDIGO ──
  if (data.action === 'registrar_asistencia_codigo') {
    var resultado = registrarAsistenciaCodigo(ss, data);
    return responderJSON(resultado);
  }

  // ── 23. CREAR EVENTO DEL CALENDARIO ──
  if (data.action === 'crear_evento_calendario') {
    var resultado = crearEventoCalendario(ss, data);
    return responderJSON(resultado);
  }

  // ── 24. ACTUALIZAR EVENTO DEL CALENDARIO ──
  if (data.action === 'actualizar_evento_calendario') {
    var resultado = actualizarEventoCalendario(ss, data);
    return responderJSON(resultado);
  }

  // ── 25. ELIMINAR EVENTO DEL CALENDARIO ──
  if (data.action === 'eliminar_evento_calendario') {
    var resultado = eliminarEventoCalendario(ss, data);
    return responderJSON(resultado);
  }

  // ── 26. CREAR FILIAL ──
  if (data.action === 'crear_filial') {
    var resultado = crearFilial(ss, data);
    return responderJSON(resultado);
  }

  // ── 27. TOGGLE FILIAL ──
  if (data.action === 'toggle_filial') {
    var resultado = toggleFilial(ss, data);
    return responderJSON(resultado);
  }

  // ── 28. ASIGNAR ADMIN A FILIAL ──
  if (data.action === 'asignar_admin_filial') {
    var resultado = asignarAdminFilial(ss, data);
    return responderJSON(resultado);
  }

  // ── 29. CREAR ASIGNATURA ──
  if (data.action === 'crear_asignatura') {
    var resultado = crearAsignatura(ss, data);
    return responderJSON(resultado);
  }

  // ── 30. ACTUALIZAR ASIGNATURA ──
  if (data.action === 'actualizar_asignatura') {
    var resultado = actualizarAsignatura(ss, data);
    return responderJSON(resultado);
  }

  // ── 31. ELIMINAR ASIGNATURA ──
  if (data.action === 'eliminar_asignatura') {
    var resultado = eliminarAsignatura(ss, data);
    return responderJSON(resultado);
  }

  return responderJSON({ status: "Error", mensaje: "Acción no reconocida: " + data.action });
}

// ══════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES - ROLES Y CURSOS (v04)
// ══════════════════════════════════════════════════════════════

function obtenerRoles(ss, cedula) {
  var sheetRoles = ss.getSheetByName('Roles');
  if (!sheetRoles) return [];

  var data = sheetRoles.getDataRange().getValues();
  var roles = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === cedula.toString() && data[i][6] === 'activo') {
      roles.push({
        cedula: data[i][0].toString(),
        nombre: data[i][1] || '',
        rol: data[i][2] || 'alumno',
        carrera: data[i][3] || '',
        seccion: data[i][4] || '',
        asignatura: data[i][5] || '',
        estado: data[i][6] || 'activo'
      });
    }
  }

  if (roles.length === 0) {
    var sheetAlumnos = ss.getSheetByName('RegistroAlumnos');
    if (sheetAlumnos) {
      var alumnos = sheetAlumnos.getDataRange().getValues();
      for (var j = 1; j < alumnos.length; j++) {
        if (alumnos[j][0].toString() === cedula.toString()) {
          roles.push({
            cedula: cedula,
            nombre: (alumnos[j][1] + ' ' + alumnos[j][2]).trim(),
            rol: 'alumno',
            carrera: alumnos[j][5] || '',
            seccion: alumnos[j][6] || '',
            asignatura: 'TIC',
            estado: 'activo'
          });
          break;
        }
      }
    }
  }

  return roles;
}

function obtenerCursosPorRol(ss, cedula, rol, carrera) {
  // Fuente única: hoja Asignaturas (espejo de SQLite). Sin hoja, usa valores base.
  var mapa = mapaAsignaturas(ss);

  if (rol === 'admin' || rol === 'academico') {
    var todas = Object.keys(mapa).map(function (k) { return cursoDesdeMapa(mapa[k], rol, '', ''); });
    if (todas.length === 0) {
      todas = [{ id: 'TIC', nombre: 'TIC - Tecnología de la Información y Comunicación', codigo: 'ADE18', seccion: '', color: '#007A33', icono: 'bi-laptop', rol: rol }];
    }
    if (rol === 'admin') {
      todas.push({ id: 'ADMIN', nombre: 'Panel de Administración', codigo: 'ADM', seccion: '', color: '#2D2D2D', icono: 'bi-gear', rol: 'admin' });
    }
    return todas;
  }

  var sheetRoles = ss.getSheetByName('Roles');
  var cursos = [];

  if (sheetRoles) {
    var data = sheetRoles.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === cedula.toString() && data[i][2] === rol && data[i][6] === 'activo') {
        var asignatura = data[i][5] || 'TIC';
        var car = data[i][3] || '';
        var sec = data[i][4] || '';
        var det = mapa[asignatura.toString().toUpperCase()];
        if (det) {
          cursos.push(cursoDesdeMapa(det, rol, car, sec));
        } else {
          cursos.push({
            id: asignatura.replace(/\s+/g, '_'),
            nombre: asignatura + (car ? ' - ' + car : ''),
            codigo: car || (rol === 'docente' ? 'DOC' : 'ADE18'),
            seccion: sec,
            color: rol === 'docente' ? '#00B140' : '#007A33',
            icono: rol === 'docente' ? 'bi-easel' : (asignatura.toUpperCase().includes('TIC') ? 'bi-laptop' : 'bi-book'),
            rol: rol
          });
        }
      }
    }
  }

  if (cursos.length === 0) {
    cursos.push({
      id: 'TIC', nombre: 'TIC - Tecnología de la Información y Comunicación',
      codigo: 'ADE18', seccion: '', color: '#007A33',
      icono: rol === 'docente' ? 'bi-easel' : 'bi-laptop', rol: rol
    });
  }

  return cursos;
}

// Mapa codigo(UPPER) -> {nombre, codigo, carrera, grado, color, icono} desde la hoja Asignaturas
function mapaAsignaturas(ss) {
  var map = {};
  var sheet = ss.getSheetByName('Asignaturas');
  if (!sheet) return map;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idx = {};
  for (var j = 0; j < headers.length; j++) idx[headers[j]] = j;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var cod = (data[i][idx['Codigo']] || '').toString().toUpperCase();
    if (!cod) continue;
    var est = (idx['Estado'] !== undefined ? data[i][idx['Estado']] : 'activo') || 'activo';
    if (est !== 'activo') continue;
    map[cod] = {
      nombre: data[i][idx['Nombre']] || cod,
      codigo: (data[i][idx['Codigo']] || '').toString(),
      carrera: (idx['Carrera'] !== undefined ? data[i][idx['Carrera']] : '') || '',
      grado: (idx['Grado'] !== undefined ? data[i][idx['Grado']] : '') || '',
      color: (idx['Color'] !== undefined ? data[i][idx['Color']] : '') || '#007A33',
      icono: (idx['Icono'] !== undefined ? data[i][idx['Icono']] : '') || 'bi-book'
    };
  }
  return map;
}

function cursoDesdeMapa(det, rol, car, sec) {
  return {
    id: det.codigo.replace(/\s+/g, '_'),
    nombre: det.nombre + ((car || det.carrera) ? ' - ' + (car || det.carrera) : ''),
    codigo: det.codigo,
    carrera: car || det.carrera || '',
    seccion: sec || '',
    color: det.color,
    icono: rol === 'docente' ? 'bi-easel' : det.icono,
    rol: rol
  };
}

// Espejo SQLite -> Sheets: crea o actualiza por Codigo (misma base en ambos lados)
function guardarAsignaturaDrive(ss, data) {
  var HEADERS = ['ID', 'UUID', 'Nombre', 'Codigo', 'Carrera', 'Grado', 'Semestre',
    'CargaHoraria', 'Color', 'Icono', 'Estado', 'CreatedAt', 'UpdatedAt'];
  var sheet = ss.getSheetByName('Asignaturas');
  if (!sheet) {
    sheet = ss.insertSheet('Asignaturas');
    sheet.appendRow(HEADERS);
  } else {
    var h0 = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    for (var h = 0; h < HEADERS.length; h++) {
      if (h0.indexOf(HEADERS[h]) < 0) sheet.getRange(1, sheet.getLastColumn() + 1).setValue(HEADERS[h]);
    }
  }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idx = {};
  for (var j = 0; j < headers.length; j++) idx[headers[j]] = j;
  if (idx['Codigo'] === undefined) return { ok: false, error: 'Sin columna Codigo' };

  var codigo = (data.codigo || '').toString().toUpperCase();
  if (!codigo) return { ok: false, error: 'Falta codigo' };

  var vals = sheet.getDataRange().getValues();
  var row = -1;
  for (var i = 1; i < vals.length; i++) {
    if ((vals[i][idx['Codigo']] || '').toString().toUpperCase() === codigo) { row = i + 1; break; }
  }
  var ts = new Date().toISOString();
  var prev = row > 0 ? vals[row - 1] : null;
  var fila = headers.map(function (hh) {
    switch (hh) {
      case 'ID': return (prev && prev[idx['ID']]) || data.id || '';
      case 'UUID': return (prev && prev[idx['UUID']]) || data.uuid || ('ASIG-' + Date.now());
      case 'Nombre': return data.nombre || '';
      case 'Codigo': return codigo;
      case 'Carrera': return data.carrera || '';
      case 'Grado': return data.grado || '';
      case 'Semestre': return data.semestre || '';
      case 'CargaHoraria': return data.carga_horaria || 0;
      case 'Color': return data.color || '#10b981';
      case 'Icono': return data.icono || 'bi-book';
      case 'Estado': return data.estado || 'activo';
      case 'CreatedAt': return (prev && prev[idx['CreatedAt']]) || ts;
      case 'UpdatedAt': return ts;
      default: return prev ? prev[idx[hh]] : '';
    }
  });
  if (row > 0) sheet.getRange(row, 1, 1, headers.length).setValues([fila]);
  else sheet.appendRow(fila);
  return { ok: true, codigo: codigo };
}

function obtenerPagos(ss, cedula) {
  var sheetPagos = ss.getSheetByName('Pagos');
  if (!sheetPagos) return [];

  var data = sheetPagos.getDataRange().getValues();
  var pagos = [];

  for (var i = 1; i < data.length; i++) {
    if (!cedula || data[i][0].toString() === cedula.toString()) {
      pagos.push({
        cedula: data[i][0].toString(),
        nombre: data[i][1] || '',
        modulo: data[i][2] || '',
        monto: data[i][3] || 0,
        fecha: data[i][4] || '',
        estado: data[i][5] || 'pendiente',
        comprobante: data[i][6] || '',
        registrado_por: data[i][7] || ''
      });
    }
  }

  return pagos;
}

function obtenerProgreso(ss, cedula) {
  var sheetPD = ss.getSheetByName('ProgresoDetalle');
  if (!sheetPD) return [];

  var data = sheetPD.getDataRange().getValues();
  var progreso = [];

  for (var i = 1; i < data.length; i++) {
    if (!cedula || data[i][1].toString() === cedula.toString()) {
      progreso.push({
        cedula: data[i][1].toString(),
        unidad: data[i][2] || '',
        seccion: data[i][3] || '',
        leido: data[i][4] || 'No',
        pagina: data[i][5] || '',
        fecha: data[i][0] || ''
      });
    }
  }

  return progreso;
}

function obtenerResumenAdmin(ss) {
  var resultado = {
    totalAlumnos: 0,
    totalDocentes: 0,
    totalAdmins: 0,
    totalPagos: 0,
    montoTotal: 0,
    pagosPendientes: 0,
    progresoPromedio: 0
  };

  var sheetRoles = ss.getSheetByName('Roles');
  if (sheetRoles) {
    var data = sheetRoles.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][6] === 'activo') {
        var rol = data[i][2];
        if (rol === 'alumno') resultado.totalAlumnos++;
        else if (rol === 'docente') resultado.totalDocentes++;
        else if (rol === 'admin') resultado.totalAdmins++;
      }
    }
  }

  var sheetPagos = ss.getSheetByName('Pagos');
  if (sheetPagos) {
    var pData = sheetPagos.getDataRange().getValues();
    for (var j = 1; j < pData.length; j++) {
      resultado.totalPagos++;
      resultado.montoTotal += parseFloat(pData[j][3]) || 0;
      if (pData[j][5] === 'pendiente') resultado.pagosPendientes++;
    }
  }

  var sheetPD = ss.getSheetByName('ProgresoDetalle');
  if (sheetPD && resultado.totalAlumnos > 0) {
    var pdData = sheetPD.getDataRange().getValues();
    var completadas = 0;
    for (var k = 1; k < pdData.length; k++) {
      if (pdData[k][4] === 'Sí') completadas++;
    }
    var totalPosible = resultado.totalAlumnos * 10;
    resultado.progresoPromedio = totalPosible > 0 ? Math.round((completadas / totalPosible) * 100) : 0;
  }

  return resultado;
}

// ══════════════════════════════════════════════════════════════
// FUNCIONES v05 - MATRÍCULA
// ══════════════════════════════════════════════════════════════

function verificarMatricula(ss, cedula) {
  var sheet = ss.getSheetByName('Matriculaciones');
  if (!sheet) return { existe: false };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][8] && data[i][8].toString() === cedula.toString()) {
      return {
        existe: true,
        id: data[i][0],
        uuid: data[i][1],
        estado: data[i][34] || 'pendiente',
        carrera: data[i][22] || '',
        semestre: data[i][21] || ''
      };
    }
  }
  return { existe: false };
}

function obtenerMatricula(ss, cedula) {
  var sheet = ss.getSheetByName('Matriculaciones');
  if (!sheet) return { existe: false };

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][8] && data[i][8].toString() === cedula.toString()) {
      var matricula = {};
      for (var j = 0; j < headers.length; j++) {
        matricula[headers[j]] = data[i][j];
      }
      return { existe: true, matricula: matricula };
    }
  }
  return { existe: false };
}

function listarMatriculas(ss) {
  var sheet = ss.getSheetByName('Matriculaciones');
  if (!sheet) return [];

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getDataRange().getValues();
  var matriculas = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      var mat = {};
      for (var j = 0; j < headers.length; j++) {
        mat[headers[j]] = data[i][j];
      }
      matriculas.push(mat);
    }
  }
  return matriculas;
}

function detalleMatricula(ss, id, cedula) {
  var sheet = ss.getSheetByName('Matriculaciones');
  if (!sheet) return { existe: false };

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var matchId = id && data[i][0].toString() === id.toString();
    var matchCedula = cedula && data[i][8] && data[i][8].toString() === cedula.toString();
    if (matchId || matchCedula) {
      var mat = {};
      for (var j = 0; j < headers.length; j++) {
        mat[headers[j]] = data[i][j];
      }
      return { existe: true, matricula: mat };
    }
  }
  return { existe: false };
}

function estadisticasMatricula(ss) {
  var sheet = ss.getSheetByName('Matriculaciones');
  if (!sheet) return { total: 0, pendientes: 0, aprobadas: 0, rechazadas: 0 };

  var data = sheet.getDataRange().getValues();
  var stats = { total: 0, pendientes: 0, aprobadas: 0, rechazadas: 0, porCarrera: {} };

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      stats.total++;
      var estado = (data[i][34] || 'pendiente').toLowerCase();
      if (estado === 'pendiente') stats.pendientes++;
      else if (estado === 'aprobada' || estado === 'activo') stats.aprobadas++;
      else if (estado === 'rechazada') stats.rechazadas++;

      var carrera = data[i][22] || 'Sin carrera';
      stats.porCarrera[carrera] = (stats.porCarrera[carrera] || 0) + 1;
    }
  }
  return stats;
}

function guardarMatricula(ss, data) {
  var sheet = ss.getSheetByName('Matriculaciones');
  if (!sheet) {
    sheet = ss.insertSheet('Matriculaciones');
    sheet.appendRow([
      'ID', 'UUID', 'UserId', 'CodigoFormulario', 'LegajoNumero', 'FechaInscripcion',
      'Nombres', 'Apellidos', 'Cedula', 'LugarNacimiento', 'FechaNacimiento', 'Pais',
      'Direccion', 'Ciudad', 'Departamento', 'BarrioCompania', 'TelefonoFijo', 'TelefonoMovil',
      'CorreoElectronico', 'TituloBachiller', 'InstitucionOrigen', 'CiudadPaisEstudio',
      'AnioPromocion', 'Semestre', 'Carrera', 'TipoAlumno', 'MatriculaGuaranies',
      'Mensualidad', 'PlanPago', 'AsignaturasPendientes', 'SemestresPendientes',
      'InformacionAdicional', 'AceptaDeclaracion', 'Firma', 'Estado', 'RegistradoPor',
      'Observaciones', 'CreatedAt', 'UpdatedAt'
    ]);
  }

  var ts = new Date().toISOString();
  var uuid = 'MAT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  var cedula = data.cedula || '';

  // Verificar si ya existe (upsert)
  var existingData = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < existingData.length; i++) {
    if (existingData[i][8] && existingData[i][8].toString() === cedula.toString()) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowData = [
    data.id || '', uuid, data.user_id || '', data.codigo_formulario || 'CEN-AS-SM-AGP005',
    data.legajo_numero || '', data.fecha_inscripcion || ts.split('T')[0],
    data.nombres || '', data.apellidos || '', cedula,
    data.lugar_nacimiento || '', data.fecha_nacimiento || '', data.pais || 'ECUADOR',
    data.direccion || '', data.ciudad || '', data.departamento || '',
    data.barrio_compania || '', data.telefono_fijo || '', data.telefono_movil || '',
    data.correo_electronico || '', data.titulo_bachiller || '',
    data.institucion_origen || '', data.ciudad_pais_estudio || '',
    data.anio_promocion || '', data.semestre || '', data.carrera || '',
    data.tipo_alumno || 'nuevo', data.matricula_guaranies || '',
    data.mensualidad || '', data.plan_pago || '',
    data.asignaturas_pendientes || '', data.semestres_pendientes || '',
    data.informacion_adicional || '', data.acepta_declaracion ? 1 : 0,
    data.firma || '', data.estado || 'pendiente', data.registrado_por || '',
    data.observaciones || '', ts, ts
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return { status: "Éxito", mensaje: "Matrícula actualizada", uuid: uuid };
  } else {
    sheet.appendRow(rowData);
    return { status: "Éxito", mensaje: "Matrícula registrada", uuid: uuid };
  }
}

function actualizarEstadoMatricula(ss, data) {
  var sheet = ss.getSheetByName('Matriculaciones');
  if (!sheet) return { status: "Error", mensaje: "Hoja no encontrada" };

  var dataSheet = sheet.getDataRange().getValues();
  for (var i = 1; i < dataSheet.length; i++) {
    if (dataSheet[i][0].toString() === data.id.toString()) {
      sheet.getRange(i + 1, 35).setValue(data.estado); // Columna 35 = Estado
      sheet.getRange(i + 1, 39).setValue(new Date().toISOString()); // UpdatedAt
      if (data.observaciones) {
        sheet.getRange(i + 1, 37).setValue(data.observaciones); // Observaciones
      }
      return { status: "Éxito", mensaje: "Estado actualizado" };
    }
  }
  return { status: "Error", mensaje: "Matrícula no encontrada" };
}

function eliminarMatricula(ss, data) {
  var sheet = ss.getSheetByName('Matriculaciones');
  if (!sheet) return { status: "Error", mensaje: "Hoja no encontrada" };

  var dataSheet = sheet.getDataRange().getValues();
  for (var i = 1; i < dataSheet.length; i++) {
    if (dataSheet[i][0].toString() === data.id.toString()) {
      sheet.deleteRow(i + 1);
      return { status: "Éxito", mensaje: "Matrícula eliminada" };
    }
  }
  return { status: "Error", mensaje: "Matrícula no encontrada" };
}

// ══════════════════════════════════════════════════════════════
// FUNCIONES v05 - FORMULARIOS POR CARRERA
// ══════════════════════════════════════════════════════════════

function listarFormularios(ss, carrera) {
  var sheet = ss.getSheetByName('FormulariosCarrera');
  if (!sheet) return [];

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getDataRange().getValues();
  var formularios = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][7] === 1) { // Solo activos
      var matchCarrera = !carrera || data[i][3] === carrera;
      if (matchCarrera) {
        var form = {};
        for (var j = 0; j < headers.length; j++) {
          form[headers[j]] = data[i][j];
        }
        formularios.push(form);
      }
    }
  }
  return formularios;
}

function obtenerFormulario(ss, codigo) {
  var sheet = ss.getSheetByName('FormulariosCarrera');
  if (!sheet) return { existe: false };

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][2] && data[i][2].toString() === codigo.toString()) {
      var form = {};
      for (var j = 0; j < headers.length; j++) {
        form[headers[j]] = data[i][j];
      }
      return { existe: true, formulario: form };
    }
  }
  return { existe: false };
}

function misFormularios(ss, cedula) {
  var sheet = ss.getSheetByName('FormulariosAlumno');
  if (!sheet) return [];

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getDataRange().getValues();
  var formularios = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][3] && data[i][3].toString() === cedula.toString()) {
      var form = {};
      for (var j = 0; j < headers.length; j++) {
        form[headers[j]] = data[i][j];
      }
      formularios.push(form);
    }
  }
  return formularios;
}

function completitudFormularios(ss) {
  var sheet = ss.getSheetByName('FormulariosAlumno');
  if (!sheet) return { total: 0, completados: 0, pendientes: 0 };

  var data = sheet.getDataRange().getValues();
  var stats = { total: 0, completados: 0, pendientes: 0, porCarrera: {} };

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      stats.total++;
      var estado = (data[i][5] || 'pendiente').toLowerCase();
      if (estado === 'completado' || estado === 'aprobado') stats.completados++;
      else stats.pendientes++;
    }
  }
  return stats;
}

function crearFormulario(ss, data) {
  var sheet = ss.getSheetByName('FormulariosCarrera');
  if (!sheet) {
    sheet = ss.insertSheet('FormulariosCarrera');
    sheet.appendRow([
      'ID', 'UUID', 'Codigo', 'Nombre', 'Carrera', 'Descripcion',
      'Campos', 'Activo', 'CreatedAt', 'UpdatedAt'
    ]);
  }

  var ts = new Date().toISOString();
  var uuid = 'FORM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  sheet.appendRow([
    data.id || '', uuid, data.codigo || '', data.nombre || '',
    data.carrera || '', data.descripcion || '',
    JSON.stringify(data.campos || []), data.activo !== false ? 1 : 0,
    ts, ts
  ]);

  return { status: "Éxito", mensaje: "Formulario creado", uuid: uuid };
}

function actualizarFormulario(ss, data) {
  var sheet = ss.getSheetByName('FormulariosCarrera');
  if (!sheet) return { status: "Error", mensaje: "Hoja no encontrada" };

  var dataSheet = sheet.getDataRange().getValues();
  for (var i = 1; i < dataSheet.length; i++) {
    if (dataSheet[i][0].toString() === data.id.toString()) {
      var ts = new Date().toISOString();
      if (data.nombre) sheet.getRange(i + 1, 4).setValue(data.nombre);
      if (data.carrera) sheet.getRange(i + 1, 5).setValue(data.carrera);
      if (data.descripcion) sheet.getRange(i + 1, 6).setValue(data.descripcion);
      if (data.campos) sheet.getRange(i + 1, 7).setValue(JSON.stringify(data.campos));
      if (data.activo !== undefined) sheet.getRange(i + 1, 8).setValue(data.activo ? 1 : 0);
      sheet.getRange(i + 1, 10).setValue(ts);
      return { status: "Éxito", mensaje: "Formulario actualizado" };
    }
  }
  return { status: "Error", mensaje: "Formulario no encontrado" };
}

function eliminarFormulario(ss, data) {
  var sheet = ss.getSheetByName('FormulariosCarrera');
  if (!sheet) return { status: "Error", mensaje: "Hoja no encontrada" };

  var dataSheet = sheet.getDataRange().getValues();
  for (var i = 1; i < dataSheet.length; i++) {
    if (dataSheet[i][0].toString() === data.id.toString()) {
      sheet.deleteRow(i + 1);
      return { status: "Éxito", mensaje: "Formulario eliminado" };
    }
  }
  return { status: "Error", mensaje: "Formulario no encontrado" };
}

function guardarFormularioAlumno(ss, data) {
  var sheet = ss.getSheetByName('FormulariosAlumno');
  if (!sheet) {
    sheet = ss.insertSheet('FormulariosAlumno');
    sheet.appendRow([
      'ID', 'UUID', 'FormularioId', 'Cedula', 'UserId',
      'Datos', 'Estado', 'CreatedAt', 'UpdatedAt'
    ]);
  }

  var ts = new Date().toISOString();
  var uuid = 'FAL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  // Upsert por cedula + formularioId
  var existingData = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var i = 1; i < existingData.length; i++) {
    if (existingData[i][3].toString() === data.cedula.toString() &&
      existingData[i][2].toString() === (data.formulario_id || '').toString()) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowData = [
    data.id || '', uuid, data.formulario_id || '', data.cedula || '',
    data.user_id || '', JSON.stringify(data.datos || {}),
    data.estado || 'pendiente', ts, ts
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    return { status: "Éxito", mensaje: "Formulario actualizado", uuid: uuid };
  } else {
    sheet.appendRow(rowData);
    return { status: "Éxito", mensaje: "Formulario registrado", uuid: uuid };
  }
}

// ══════════════════════════════════════════════════════════════
// FUNCIONES v05 - ASISTENCIA CON CÓDIGO
// ══════════════════════════════════════════════════════════════

function listarEventosAsistencia(ss, asignatura) {
  var sheet = ss.getSheetByName('AttendanceEvents');
  if (!sheet) return [];

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getDataRange().getValues();
  var eventos = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      var matchAsig = !asignatura || data[i][3] === asignatura;
      if (matchAsig) {
        var ev = {};
        for (var j = 0; j < headers.length; j++) {
          ev[headers[j]] = data[i][j];
        }
        eventos.push(ev);
      }
    }
  }
  return eventos;
}

function validarCodigoAsistencia(ss, codigo) {
  var sheet = ss.getSheetByName('AttendanceEvents');
  if (!sheet) return { valido: false, mensaje: "No hay eventos" };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][2] && data[i][2].toString().toUpperCase() === codigo.toUpperCase()) {
      var estado = data[i][10] || 'activo';
      if (estado === 'cerrado') {
        return { valido: false, mensaje: "El evento ya está cerrado" };
      }
      return {
        valido: true,
        evento_id: data[i][0],
        asignatura: data[i][3] || '',
        unidad: data[i][4] || '',
        lugar: data[i][5] || '',
        fecha: data[i][6] || '',
        hora_inicio: data[i][7] || '',
        hora_fin: data[i][8] || ''
      };
    }
  }
  return { valido: false, mensaje: "Código no válido" };
}

function detalleEventoAsistencia(ss, eventoId) {
  var sheet = ss.getSheetByName('AttendanceEvents');
  if (!sheet) return { existe: false };

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === eventoId.toString()) {
      var ev = {};
      for (var j = 0; j < headers.length; j++) {
        ev[headers[j]] = data[i][j];
      }

      // Obtener asistentes
      var sheetRecords = ss.getSheetByName('AttendanceRecords');
      var asistentes = [];
      if (sheetRecords) {
        var recData = sheetRecords.getDataRange().getValues();
        for (var k = 1; k < recData.length; k++) {
          if (recData[k][1].toString() === eventoId.toString()) {
            asistentes.push({
              cedula: recData[k][3] || '',
              estado: recData[k][4] || '',
              hora_registro: recData[k][5] || '',
              observacion: recData[k][6] || ''
            });
          }
        }
      }
      ev.asistentes = asistentes;
      return { existe: true, evento: ev };
    }
  }
  return { existe: false };
}

function misEventosAsistencia(ss, cedula) {
  var sheet = ss.getSheetByName('AttendanceRecords');
  if (!sheet) return [];

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getDataRange().getValues();
  var eventos = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][3] && data[i][3].toString() === cedula.toString()) {
      var ev = {};
      for (var j = 0; j < headers.length; j++) {
        ev[headers[j]] = data[i][j];
      }
      eventos.push(ev);
    }
  }
  return eventos;
}

function crearEventoAsistencia(ss, data) {
  var sheet = ss.getSheetByName('AttendanceEvents');
  if (!sheet) {
    sheet = ss.insertSheet('AttendanceEvents');
    sheet.appendRow([
      'ID', 'UUID', 'CodigoUnico', 'Asignatura', 'Unidad', 'Lugar',
      'Fecha', 'HoraInicio', 'HoraFin', 'CreadoPor', 'Estado',
      'Descripcion', 'CreatedAt', 'UpdatedAt'
    ]);
  }

  var ts = new Date().toISOString();
  var uuid = 'AEV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  var codigo = data.codigo_unico || generarCodigoUnico();

  sheet.appendRow([
    data.id || '', uuid, codigo, data.asignatura || '',
    data.unidad || '', data.lugar || '',
    data.fecha || ts.split('T')[0], data.hora_inicio || '',
    data.hora_fin || '', data.creado_por || '', 'activo',
    data.descripcion || '', ts, ts
  ]);

  return { status: "Éxito", mensaje: "Evento creado", codigo: codigo, uuid: uuid };
}

function cerrarEventoAsistencia(ss, data) {
  var sheet = ss.getSheetByName('AttendanceEvents');
  if (!sheet) return { status: "Error", mensaje: "Hoja no encontrada" };

  var dataSheet = sheet.getDataRange().getValues();
  for (var i = 1; i < dataSheet.length; i++) {
    if (dataSheet[i][0].toString() === data.evento_id.toString()) {
      sheet.getRange(i + 1, 11).setValue('cerrado');
      sheet.getRange(i + 1, 14).setValue(new Date().toISOString());
      return { status: "Éxito", mensaje: "Evento cerrado" };
    }
  }
  return { status: "Error", mensaje: "Evento no encontrado" };
}

function registrarAsistenciaCodigo(ss, data) {
  var sheet = ss.getSheetByName('AttendanceRecords');
  if (!sheet) {
    sheet = ss.insertSheet('AttendanceRecords');
    sheet.appendRow([
      'ID', 'UUID', 'EventId', 'UserId', 'Cedula',
      'Estado', 'HoraRegistro', 'Observacion', 'CreatedAt', 'UpdatedAt'
    ]);
  }

  var ts = new Date().toISOString();
  var uuid = 'AREC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  // Verificar duplicado
  var existingData = sheet.getDataRange().getValues();
  for (var i = 1; i < existingData.length; i++) {
    if (existingData[i][1].toString() === data.evento_id.toString() &&
      existingData[i][4].toString() === data.cedula.toString()) {
      return { status: "Error", mensaje: "Ya registró asistencia en este evento" };
    }
  }

  sheet.appendRow([
    data.id || '', uuid, data.evento_id || '', data.user_id || '',
    data.cedula || '', data.estado || 'presente',
    ts, data.observacion || '', ts, ts
  ]);

  return { status: "Éxito", mensaje: "Asistencia registrada" };
}

function generarCodigoUnico() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var codigo = '';
  for (var i = 0; i < 6; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

// ══════════════════════════════════════════════════════════════
// FUNCIONES v05 - CALENDARIO
// ══════════════════════════════════════════════════════════════

function listarEventosCalendario(ss, fechaInicio, fechaFin) {
  var sheet = ss.getSheetByName('CalendarEvents');
  if (!sheet) return [];

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getDataRange().getValues();
  var eventos = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      var fecha = data[i][4] || '';
      var incluir = true;
      if (fechaInicio && fecha < fechaInicio) incluir = false;
      if (fechaFin && fecha > fechaFin) incluir = false;

      if (incluir) {
        var ev = {};
        for (var j = 0; j < headers.length; j++) {
          ev[headers[j]] = data[i][j];
        }
        eventos.push(ev);
      }
    }
  }
  return eventos;
}

function detalleEventoCalendario(ss, eventoId) {
  var sheet = ss.getSheetByName('CalendarEvents');
  if (!sheet) return { existe: false };

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === eventoId.toString()) {
      var ev = {};
      for (var j = 0; j < headers.length; j++) {
        ev[headers[j]] = data[i][j];
      }
      return { existe: true, evento: ev };
    }
  }
  return { existe: false };
}

function verificarConflictosCalendario(ss, fecha, horaInicio, horaFin, excludeId) {
  var sheet = ss.getSheetByName('CalendarEvents');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var conflictos = [];

  for (var i = 1; i < data.length; i++) {
    if (excludeId && data[i][0].toString() === excludeId.toString()) continue;

    if (data[i][4] === fecha) {
      var evHoraInicio = data[i][5] || '';
      var evHoraFin = data[i][6] || '';

      if (horaInicio < evHoraFin && horaFin > evHoraInicio) {
        conflictos.push({
          id: data[i][0],
          titulo: data[i][1] || '',
          hora_inicio: evHoraInicio,
          hora_fin: evHoraFin
        });
      }
    }
  }
  return conflictos;
}

function crearEventoCalendario(ss, data) {
  var sheet = ss.getSheetByName('CalendarEvents');
  if (!sheet) {
    sheet = ss.insertSheet('CalendarEvents');
    sheet.appendRow([
      'ID', 'UUID', 'Titulo', 'Descripcion', 'FechaInicio', 'FechaFin',
      'HoraInicio', 'HoraFin', 'Tipo', 'Color', 'CreadoPor',
      'Asignatura', 'CreatedAt', 'UpdatedAt'
    ]);
  }

  var ts = new Date().toISOString();
  var uuid = 'CEV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  sheet.appendRow([
    data.id || '', uuid, data.titulo || '', data.descripcion || '',
    data.fecha_inicio || '', data.fecha_fin || data.fecha_inicio || '',
    data.hora_inicio || '', data.hora_fin || '',
    data.tipo || 'evento', data.color || '#007A33',
    data.creado_por || '', data.asignatura || '', ts, ts
  ]);

  return { status: "Éxito", mensaje: "Evento creado", uuid: uuid };
}

function actualizarEventoCalendario(ss, data) {
  var sheet = ss.getSheetByName('CalendarEvents');
  if (!sheet) return { status: "Error", mensaje: "Hoja no encontrada" };

  var dataSheet = sheet.getDataRange().getValues();
  for (var i = 1; i < dataSheet.length; i++) {
    if (dataSheet[i][0].toString() === data.id.toString()) {
      var ts = new Date().toISOString();
      if (data.titulo) sheet.getRange(i + 1, 3).setValue(data.titulo);
      if (data.descripcion) sheet.getRange(i + 1, 4).setValue(data.descripcion);
      if (data.fecha_inicio) sheet.getRange(i + 1, 5).setValue(data.fecha_inicio);
      if (data.fecha_fin) sheet.getRange(i + 1, 6).setValue(data.fecha_fin);
      if (data.hora_inicio) sheet.getRange(i + 1, 7).setValue(data.hora_inicio);
      if (data.hora_fin) sheet.getRange(i + 1, 8).setValue(data.hora_fin);
      if (data.tipo) sheet.getRange(i + 1, 9).setValue(data.tipo);
      if (data.color) sheet.getRange(i + 1, 10).setValue(data.color);
      sheet.getRange(i + 1, 14).setValue(ts);
      return { status: "Éxito", mensaje: "Evento actualizado" };
    }
  }
  return { status: "Error", mensaje: "Evento no encontrado" };
}

function eliminarEventoCalendario(ss, data) {
  var sheet = ss.getSheetByName('CalendarEvents');
  if (!sheet) return { status: "Error", mensaje: "Hoja no encontrada" };

  var dataSheet = sheet.getDataRange().getValues();
  for (var i = 1; i < dataSheet.length; i++) {
    if (dataSheet[i][0].toString() === data.id.toString()) {
      sheet.deleteRow(i + 1);
      return { status: "Éxito", mensaje: "Evento eliminado" };
    }
  }
  return { status: "Error", mensaje: "Evento no encontrado" };
}

// ══════════════════════════════════════════════════════════════
// FUNCIONES v05 - FILIALES
// ══════════════════════════════════════════════════════════════

function listarFiliales(ss) {
  var sheet = ss.getSheetByName('Filiales');
  if (!sheet) return [];

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getDataRange().getValues();
  var filiales = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      var fil = {};
      for (var j = 0; j < headers.length; j++) {
        fil[headers[j]] = data[i][j];
      }
      filiales.push(fil);
    }
  }
  return filiales;
}

function adminsPorFilial(ss, filial) {
  var sheet = ss.getSheetByName('Roles');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var admins = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][3] === filial && (data[i][2] === 'admin_filial' || data[i][2] === 'admin') && data[i][6] === 'activo') {
      admins.push({
        cedula: data[i][0].toString(),
        nombre: data[i][1] || '',
        rol: data[i][2] || ''
      });
    }
  }
  return admins;
}

function crearFilial(ss, data) {
  var sheet = ss.getSheetByName('Filiales');
  if (!sheet) {
    sheet = ss.insertSheet('Filiales');
    sheet.appendRow([
      'ID', 'UUID', 'Nombre', 'Codigo', 'Direccion', 'Telefono',
      'Estado', 'CreadoPor', 'CreatedAt', 'UpdatedAt'
    ]);
  }

  var ts = new Date().toISOString();
  var uuid = 'FIL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  sheet.appendRow([
    data.id || '', uuid, data.nombre || '', data.codigo || '',
    data.direccion || '', data.telefono || '',
    'activo', data.creado_por || '', ts, ts
  ]);

  return { status: "Éxito", mensaje: "Filial creada", uuid: uuid };
}

function toggleFilial(ss, data) {
  var sheet = ss.getSheetByName('Filiales');
  if (!sheet) return { status: "Error", mensaje: "Hoja no encontrada" };

  var dataSheet = sheet.getDataRange().getValues();
  for (var i = 1; i < dataSheet.length; i++) {
    if (dataSheet[i][0].toString() === data.id.toString()) {
      var estadoActual = dataSheet[i][6] || 'activo';
      var nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
      sheet.getRange(i + 1, 7).setValue(nuevoEstado);
      sheet.getRange(i + 1, 10).setValue(new Date().toISOString());
      return { status: "Éxito", mensaje: "Filial " + nuevoEstado, estado: nuevoEstado };
    }
  }
  return { status: "Error", mensaje: "Filial no encontrada" };
}

function asignarAdminFilial(ss, data) {
  var sheetRoles = ss.getSheetByName('Roles');
  if (!sheetRoles) {
    sheetRoles = ss.insertSheet('Roles');
    sheetRoles.appendRow(['Cédula', 'Nombre', 'Rol', 'Carrera', 'Sección', 'Asignatura', 'Estado', 'FechaAsignación', 'AsignadoPor']);
  }

  var ts = new Date().toISOString();
  sheetRoles.appendRow([
    data.cedula, data.nombre || '', 'admin_filial',
    data.filial || '', '', '', 'activo', ts, data.asignado_por || 'admin'
  ]);

  return { status: "Éxito", mensaje: "Admin asignado a filial" };
}

// ══════════════════════════════════════════════════════════════
// FUNCIONES v05 - ASIGNATURAS (CATÁLOGO)
// ══════════════════════════════════════════════════════════════

function listarAsignaturas(ss) {
  var sheet = ss.getSheetByName('Asignaturas');
  if (!sheet) return [];

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getDataRange().getValues();
  var asignaturas = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      var asig = {};
      for (var j = 0; j < headers.length; j++) {
        asig[headers[j]] = data[i][j];
      }
      asignaturas.push(asig);
    }
  }
  return asignaturas;
}

// Lee una hoja de catálogo y devuelve [{nombre, codigo, grado, carrera}] (v06.5)
function listarCatalogoSimple(ss, nombreHoja) {
  var sheet = ss.getSheetByName(nombreHoja);
  if (!sheet) return [];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idx = {};
  for (var j = 0; j < headers.length; j++) idx[headers[j]] = j;
  var data = sheet.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var nombre = (idx['Nombre'] !== undefined ? data[i][idx['Nombre']] : '') || '';
    if (!nombre) continue;
    var act = idx['Activo'] !== undefined ? data[i][idx['Activo']] : '';
    var off = act === false || act === 0 || act === '0' || ['false', 'no', 'inactivo', 'inactiva'].indexOf(String(act).toLowerCase()) >= 0;
    if (off) continue;
    out.push({
      nombre: nombre.toString(),
      codigo: (idx['Codigo'] !== undefined ? data[i][idx['Codigo']] : '') || '',
      grado: (idx['Grado'] !== undefined ? data[i][idx['Grado']] : '') || '',
      carrera: (idx['Carrera'] !== undefined ? data[i][idx['Carrera']] : '') || ''
    });
  }
  return out;
}

function crearAsignatura(ss, data) {
  var sheet = ss.getSheetByName('Asignaturas');
  if (!sheet) {
    sheet = ss.insertSheet('Asignaturas');
    sheet.appendRow([
      'ID', 'UUID', 'Nombre', 'Codigo', 'Carrera', 'Semestre',
      'CargaHoraria', 'Color', 'Icono', 'CreatedAt', 'UpdatedAt'
    ]);
  }

  var ts = new Date().toISOString();
  var uuid = 'ASIG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  sheet.appendRow([
    data.id || '', uuid, data.nombre || '', data.codigo || '',
    data.carrera || '', data.semestre || 1,
    data.carga_horaria || 0, data.color || '#10b981',
    data.icono || 'bi-book', ts, ts
  ]);

  return { status: "Éxito", mensaje: "Asignatura creada", uuid: uuid };
}

function actualizarAsignatura(ss, data) {
  var sheet = ss.getSheetByName('Asignaturas');
  if (!sheet) return { status: "Error", mensaje: "Hoja no encontrada" };

  var dataSheet = sheet.getDataRange().getValues();
  for (var i = 1; i < dataSheet.length; i++) {
    if (dataSheet[i][0].toString() === data.id.toString()) {
      var ts = new Date().toISOString();
      if (data.nombre) sheet.getRange(i + 1, 3).setValue(data.nombre);
      if (data.codigo) sheet.getRange(i + 1, 4).setValue(data.codigo);
      if (data.carrera) sheet.getRange(i + 1, 5).setValue(data.carrera);
      if (data.semestre) sheet.getRange(i + 1, 6).setValue(data.semestre);
      if (data.carga_horaria) sheet.getRange(i + 1, 7).setValue(data.carga_horaria);
      if (data.color) sheet.getRange(i + 1, 8).setValue(data.color);
      if (data.icono) sheet.getRange(i + 1, 9).setValue(data.icono);
      sheet.getRange(i + 1, 11).setValue(ts);
      return { status: "Éxito", mensaje: "Asignatura actualizada" };
    }
  }
  return { status: "Error", mensaje: "Asignatura no encontrada" };
}

function eliminarAsignatura(ss, data) {
  var sheet = ss.getSheetByName('Asignaturas');
  if (!sheet) return { status: "Error", mensaje: "Hoja no encontrada" };

  var dataSheet = sheet.getDataRange().getValues();
  for (var i = 1; i < dataSheet.length; i++) {
    if (dataSheet[i][0].toString() === data.id.toString()) {
      sheet.deleteRow(i + 1);
      return { status: "Éxito", mensaje: "Asignatura eliminada" };
    }
  }
  return { status: "Error", mensaje: "Asignatura no encontrada" };
}

// ══════════════════════════════════════════════════════════════
// UTILIDADES
// ══════════════════════════════════════════════════════════════

function responderJSON(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}

// ══════════════════════════════════════════════════════════════
// v06: FOTOS DE PERFIL EN GOOGLE DRIVE
// Carpeta institucional: https://drive.google.com/drive/folders/1zWbMUeXNRzO6Jzd7UIh1opRtOtgLgQzI
// - El archivo vive en Drive; en la hoja 'Fotos' solo se guarda la URL corta.
//   (Un base64 NO cabe en una celda de Sheets: límite 50.000 caracteres.)
// - El archivo queda "cualquiera con el enlace puede ver" para que el
//   perfil lo muestre sin login. Para uso privado, cambiar a
//   DriveApp.Access.PRIVATE y servir vía obtener_foto.
// ══════════════════════════════════════════════════════════════
var FOTO_FOLDER_ID = '1zWbMUeXNRzO6Jzd7UIh1opRtOtgLgQzI';

function fotosSheet(ss) {
  var sheet = ss.getSheetByName('Fotos');
  if (!sheet) {
    sheet = ss.insertSheet('Fotos');
    sheet.appendRow(['Cedula', 'Nombre', 'FileId', 'Url', 'Fecha']);
  }
  return sheet;
}

function subirFotoDrive(ss, data) {
  var cedula = (data.cedula || '').toString().trim();
  var raw = data.foto || '';
  if (!cedula) return { ok: false, error: 'Falta cedula' };
  if (!raw) return { ok: false, error: 'Falta foto' };

  // Acepta dataURL (data:image/jpeg;base64,...) o base64 puro
  var base64 = raw.indexOf('base64,') >= 0 ? raw.split('base64,')[1] : raw;
  var mime = 'image/jpeg';
  var ext = 'jpg';
  var m = raw.match(/^data:(image\/[a-z]+);base64,/);
  if (m) {
    mime = m[1];
    ext = (mime === 'image/png') ? 'png' : 'jpg';
  }
  var blob = Utilities.newBlob(Utilities.base64Decode(base64), mime, 'foto_' + cedula + '.' + ext);

  var folder = DriveApp.getFolderById(FOTO_FOLDER_ID);

  // Borra fotos anteriores de la misma cédula para no duplicar
  var it = folder.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    var nm = f.getName();
    if (nm === 'foto_' + cedula + '.jpg' || nm === 'foto_' + cedula + '.png') {
      f.setTrashed(true);
    }
  }

  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var fileId = file.getId();
  var url = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400';

  // Upsert en hoja Fotos por cédula
  var sheet = fotosSheet(ss);
  var vals = sheet.getDataRange().getValues();
  var ts = new Date().toISOString();
  var found = false;
  for (var i = 1; i < vals.length; i++) {
    if (vals[i][0].toString() === cedula) {
      sheet.getRange(i + 1, 2).setValue(data.nombre || vals[i][1] || '');
      sheet.getRange(i + 1, 3).setValue(fileId);
      sheet.getRange(i + 1, 4).setValue(url);
      sheet.getRange(i + 1, 5).setValue(ts);
      found = true;
      break;
    }
  }
  if (!found) sheet.appendRow([cedula, data.nombre || '', fileId, url, ts]);

  return { ok: true, url: url, fileId: fileId };
}

function obtenerFotoDrive(ss, cedula) {
  cedula = (cedula || '').toString().trim();
  if (!cedula) return { ok: false, error: 'Falta cedula' };
  var sheet = ss.getSheetByName('Fotos');
  if (!sheet) return { ok: true, existe: false };
  var vals = sheet.getDataRange().getValues();
  for (var i = vals.length - 1; i >= 1; i--) {
    if (vals[i][0].toString() === cedula && vals[i][3]) {
      return { ok: true, existe: true, url: vals[i][3], fileId: vals[i][2] || '' };
    }
  }
  return { ok: true, existe: false };
}

// Envía la contraseña provisoria al mail del alumno (v06.7).
// El remitente se configura en el panel admin (se usa como replyTo y nombre).
function enviarProvisoria(ss, data) {
  var email = (data.email || '').toString().trim();
  var nombre = (data.nombre || '').toString().trim();
  var pass = (data.password || '').toString();
  if (!email || !pass) return { ok: false, error: 'Falta email o contraseña' };
  var remitente = (data.remitente || '').toString().trim();
  var rnombre = (data.remitente_nombre || 'Instituto Superior Centuria').toString();
  try {
    var opts = {
      to: email,
      subject: 'Tu contraseña provisoria - ' + rnombre,
      body: 'Hola ' + nombre + ',\n\nTu contraseña provisoria es: ' + pass +
        '\n\nPor seguridad, cambiala en tu primer ingreso (Mi Perfil > Contraseña).\n\n' + rnombre
    };
    if (remitente) { opts.replyTo = remitente; opts.name = rnombre; }
    MailApp.sendEmail(opts);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}

function diagnosticoSheets(ss) {
  var nombres = ['RegistroAlumnos', 'Roles', 'Matriculaciones', 'FormulariosCarrera',
    'FormulariosAlumno', 'AttendanceEvents', 'AttendanceRecords', 'CalendarEvents',
    'Filiales', 'Asignaturas', 'Fotos', 'Secciones', 'Carreras', 'Grados', 'Modalidades'];
  var conteos = {};
  for (var i = 0; i < nombres.length; i++) {
    var sh = ss.getSheetByName(nombres[i]);
    conteos[nombres[i]] = sh ? Math.max(0, sh.getLastRow() - 1) : -1;
  }
  return { ok: true, planilla_nombre: ss.getName(), planilla_id: ss.getId(), conteos: conteos };
}

function eliminarFotoDrive(ss, data) {
  var cedula = (data.cedula || '').toString().trim();
  if (!cedula) return { ok: false, error: 'Falta cedula' };
  try {
    var folder = DriveApp.getFolderById(FOTO_FOLDER_ID);
    var it = folder.getFiles();
    while (it.hasNext()) {
      var f = it.next();
      var nm = f.getName();
      if (nm === 'foto_' + cedula + '.jpg' || nm === 'foto_' + cedula + '.png') {
        f.setTrashed(true);
      }
    }
  } catch (e) {}
  var sheet = ss.getSheetByName('Fotos');
  if (sheet) {
    var vals = sheet.getDataRange().getValues();
    for (var i = 1; i < vals.length; i++) {
      if (vals[i][0].toString() === cedula) {
        sheet.getRange(i + 1, 3).setValue('');
        sheet.getRange(i + 1, 4).setValue('');
        sheet.getRange(i + 1, 5).setValue(new Date().toISOString());
      }
    }
  }
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════
// v06.3: INICIALIZACIÓN DE BASE DE DATOS GOOGLE SHEETS
// Crea todas las hojas requeridas con cabeceras correctas.
// Ejecutar UNA VEZ desde el editor (▶ inicializarBaseDatos) tras publicar.
// ═══════════════════════════════════════════════════════════════

function inicializarBaseDatos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var creadas = [];

  // 1. RegistroAlumnos (ya existe con 29 filas, solo asegurar cabeceras)
  asegurarHoja(ss, 'RegistroAlumnos', ['Cédula', 'Nombre', 'Apellido', 'Email', 'Grado', 'Carrera', 'Sección'], creadas);

  // 2. Roles
  asegurarHoja(ss, 'Roles', ['Cédula', 'Nombre', 'Rol', 'Carrera', 'Sección', 'Asignatura', 'Estado', 'FechaAsignación', 'AsignadoPor'], creadas);

  // 3. Asignaturas (catálogo maestro)
  asegurarHoja(ss, 'Asignaturas', ['ID', 'UUID', 'Nombre', 'Codigo', 'Carrera', 'Grado', 'Semestre', 'CargaHoraria', 'Color', 'Icono', 'Estado', 'CreatedAt', 'UpdatedAt'], creadas);

  // 4. Secciones
  asegurarHoja(ss, 'Secciones', ['ID', 'UUID', 'Nombre', 'Codigo', 'Carrera', 'Grado', 'Capacidad', 'Activo', 'CreatedAt', 'UpdatedAt'], creadas);

  // 5. Carreras (catálogo)
  asegurarHoja(ss, 'Carreras', ['ID', 'UUID', 'Nombre', 'Codigo', 'Grado', 'Activo', 'CreatedAt', 'UpdatedAt'], creadas);

  // 6. Grados (catálogo)
  asegurarHoja(ss, 'Grados', ['ID', 'UUID', 'Nombre', 'Activo', 'CreatedAt', 'UpdatedAt'], creadas);

  // 7. Modalidades (catálogo)
  asegurarHoja(ss, 'Modalidades', ['ID', 'UUID', 'Nombre', 'Activo', 'CreatedAt', 'UpdatedAt'], creadas);

  // 8. Matriculaciones
  asegurarHoja(ss, 'Matriculaciones', ['ID', 'UUID', 'UserId', 'CodigoFormulario', 'LegajoNumero', 'FechaInscripcion', 'Nombres', 'Apellidos', 'Cedula', 'LugarNacimiento', 'FechaNacimiento', 'Pais', 'Direccion', 'Ciudad', 'Departamento', 'BarrioCompania', 'TelefonoFijo', 'TelefonoMovil', 'CorreoElectronico', 'TituloBachiller', 'InstitucionOrigen', 'CiudadPaisEstudio', 'AnioPromocion', 'Semestre', 'Carrera', 'TipoAlumno', 'MatriculaGuaranies', 'Mensualidad', 'PlanPago', 'AsignaturasPendientes', 'SemestresPendientes', 'InformacionAdicional', 'AceptaDeclaracion', 'Firma', 'Estado', 'RegistradoPor', 'Observaciones', 'CreatedAt', 'UpdatedAt'], creadas);

  // 9. FormulariosCarrera
  asegurarHoja(ss, 'FormulariosCarrera', ['ID', 'UUID', 'Codigo', 'Nombre', 'Carrera', 'Tipo', 'CamposJson', 'Activo', 'CreatedAt', 'UpdatedAt'], creadas);

  // 10. FormulariosAlumno
  asegurarHoja(ss, 'FormulariosAlumno', ['ID', 'UUID', 'FormularioId', 'UserId', 'Cedula', 'Datos', 'Estado', 'CreatedAt', 'UpdatedAt'], creadas);

  // 11. AttendanceEvents
  asegurarHoja(ss, 'AttendanceEvents', ['ID', 'UUID', 'CodigoUnico', 'Asignatura', 'Unidad', 'Lugar', 'Fecha', 'HoraInicio', 'HoraFin', 'CreadoPor', 'Estado', 'CreatedAt', 'UpdatedAt'], creadas);

  // 12. AttendanceRecords
  asegurarHoja(ss, 'AttendanceRecords', ['ID', 'UUID', 'EventId', 'UserId', 'Cedula', 'Estado', 'HoraRegistro', 'Observacion', 'CreatedAt', 'UpdatedAt'], creadas);

  // 13. CalendarEvents
  asegurarHoja(ss, 'CalendarEvents', ['ID', 'UUID', 'Titulo', 'Descripcion', 'FechaInicio', 'FechaFin', 'HoraInicio', 'HoraFin', 'Tipo', 'Color', 'CreadoPor', 'Asignatura', 'CreatedAt', 'UpdatedAt'], creadas);

  // 14. Filiales
  asegurarHoja(ss, 'Filiales', ['ID', 'UUID', 'Nombre', 'Codigo', 'Direccion', 'Telefono', 'Estado', 'CreadoPor', 'CreatedAt', 'UpdatedAt'], creadas);

  // 15. Fotos
  asegurarHoja(ss, 'Fotos', ['Cedula', 'Nombre', 'FileId', 'Url', 'Fecha'], creadas);

  // 16. ClasesTIC
  asegurarHoja(ss, 'ClasesTIC', ['Fecha', 'Carrera', 'Sección'], creadas);

  // 17. Asistencias
  asegurarHoja(ss, 'Asistencias', ['Fecha', 'Cédula', 'Unidad/Lugar', 'Observación'], creadas);

  // 18. JustificacionesTIC
  asegurarHoja(ss, 'JustificacionesTIC', ['Fecha', 'Cédula', 'Motivo'], creadas);

  // 19. ProgresoUnidades
  asegurarHoja(ss, 'ProgresoUnidades', ['Fecha/Hora', 'Cédula', 'Unidad', 'Sección', 'Estado'], creadas);

  // 20. ProgresoDetalle
  asegurarHoja(ss, 'ProgresoDetalle', ['Fecha/Hora', 'Cédula', 'Unidad', 'Sección', 'Leído', 'Página'], creadas);

  // 21. Notas
  asegurarHoja(ss, 'Notas', ['Cédula', 'Nombre', 'Asistencia', 'Parcial1', 'Parcial2', 'Final'], creadas);

  // 22. Pagos
  asegurarHoja(ss, 'Pagos', ['Cédula', 'Nombre', 'Módulo', 'Monto', 'Fecha', 'Estado', 'Comprobante', 'RegistradoPor'], creadas);

  // 23. Accesos
  asegurarHoja(ss, 'Accesos', ['Fecha/Hora', 'Cédula', 'Página', 'Dispositivo', 'Tipo'], creadas);

  // 24. Catálogos
  asegurarHoja(ss, 'Catálogos', ['ID', 'UUID', 'Tipo', 'Nombre', 'Codigo', 'Activo', 'CreatedAt', 'UpdatedAt'], creadas);

  // 25. Planificaciones
  asegurarHoja(ss, 'Planificaciones', ['ID', 'UUID', 'Titulo', 'Descripcion', 'Fecha', 'Asignatura', 'Carrera', 'Seccion', 'Docente', 'Estado', 'CreatedAt', 'UpdatedAt'], creadas);

  // 26. ProgresoG (grupal)
  asegurarHoja(ss, 'ProgresoG', ['Fecha/Hora', 'Carrera', 'Seccion', 'Unidad', 'TotalAlumnos', 'Completados', 'Porcentaje'], creadas);

  // 27. Auditoria
  asegurarHoja(ss, 'Auditoria', ['Fecha/Hora', 'Usuario', 'Accion', 'Tabla', 'RegistroId', 'DatosAntes', 'DatosDespues', 'IP'], creadas);

  // 28. SyncControl
  asegurarHoja(ss, 'SyncControl', ['Tabla', 'UltimoSync', 'Errores', 'Estado'], creadas);

  return { ok: true, mensaje: 'Base de datos inicializada', hojas_creadas: creadas.length, detalle: creadas };
}

function asegurarHoja(ss, nombre, cabeceras, creadas) {
  var sheet = ss.getSheetByName(nombre);
  if (!sheet) {
    sheet = ss.insertSheet(nombre);
    sheet.appendRow(cabeceras);
    // Formato cabecera: negrita, fondo, congelar
    var range = sheet.getRange(1, 1, 1, cabeceras.length);
    range.setFontWeight('bold');
    range.setBackground('#007A33');
    range.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    creadas.push(nombre + ' (' + cabeceras.length + ' cols)');
  } else {
    // Verificar que la cabecera coincida (primera fila)
    var actual = sheet.getRange(1, 1, 1, cabeceras.length).getValues()[0];
    var coincide = true;
    for (var i = 0; i < cabeceras.length; i++) {
      if ((actual[i] || '').toString().trim() !== cabeceras[i]) { coincide = false; break; }
    }
    if (!coincide) {
      sheet.getRange(1, 1, 1, cabeceras.length).setValues([cabeceras]);
      creadas.push(nombre + ' (cabeceras actualizadas)');
    }
  }
}

// Función para poblar catálogos base si están vacíos
function poblarCatalogosBase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var res = { carreras: 0, grados: 0, secciones: 0, modalidades: 0 };

  // Carreras corregidas (12: 3 bases x 4 grados)
  var cSheet = ss.getSheetByName('Carreras');
  if (cSheet.getLastRow() <= 1) {
    var carreras = [
      ['CARR-G-AGP', 'ADMINISTRACIÓN DE LA GESTIÓN PUBLICA', 'G-AGP', 'GRADO', true],
      ['CARR-G-AE', 'ADMINISTRACION DE EMPRESAS', 'G-AE', 'GRADO', true],
      ['CARR-G-AD', 'ADMINISTRACIÓN ADUANERA', 'G-AD', 'GRADO', true],
      ['CARR-E-AGP', 'ADMINISTRACIÓN DE LA GESTIÓN PUBLICA', 'E-AGP', 'ESPECIALIZACION', true],
      ['CARR-E-AE', 'ADMINISTRACION DE EMPRESAS', 'E-AE', 'ESPECIALIZACION', true],
      ['CARR-E-AD', 'ADMINISTRACIÓN ADUANERA', 'E-AD', 'ESPECIALIZACION', true],
      ['CARR-M-AGP', 'ADMINISTRACIÓN DE LA GESTIÓN PUBLICA', 'M-AGP', 'MAESTRIA', true],
      ['CARR-M-AE', 'ADMINISTRACION DE EMPRESAS', 'M-AE', 'MAESTRIA', true],
      ['CARR-M-AD', 'ADMINISTRACIÓN ADUANERA', 'M-AE', 'MAESTRIA', true],
      ['CARR-D-AGP', 'ADMINISTRACIÓN DE LA GESTIÓN PUBLICA', 'D-AGP', 'DOCTORADO', true],
      ['CARR-D-AE', 'ADMINISTRACION DE EMPRESAS', 'D-AE', 'DOCTORADO', true],
      ['CARR-D-AD', 'ADMINISTRACIÓN ADUANERA', 'D-AD', 'DOCTORADO', true],
    ];
    carreras.forEach(function(c) { cSheet.appendRow(['', 'CARR-' + Date.now() + '-' + Math.random().toString(36).substr(2,5)].concat(c)); });
    res.carreras = carreras.length;
  }

  // Grados
  var gSheet = ss.getSheetByName('Grados');
  if (gSheet.getLastRow() <= 1) {
    var grados = [
      ['GRD-001', 'GRD-001', 'GRADO', true],
      ['GRD-002', 'GRD-002', 'ESPECIALIZACIÓN', true],
      ['GRD-003', 'GRD-003', 'MAESTRÍA', true],
      ['GRD-004', 'GRD-004', 'DOCTORADO', true],
    ];
    grados.forEach(function(g) { gSheet.appendRow(['', 'GRD-' + Date.now() + '-' + Math.random().toString(36).substr(2,5)].concat(g)); });
    res.grados = grados.length;
  }

  // Secciones corregidas (9: S026/LV026/MJ026 x 3 carreras)
  var sSheet = ss.getSheetByName('Secciones');
  if (sSheet.getLastRow() <= 1) {
    var secciones = [
      ['SEC-S026-AGP', 'SABADO', 'S026', 'ADMINISTRACIÓN DE LA GESTIÓN PUBLICA', 'GRADO', 40, true],
      ['SEC-S026-AE', 'SABADO', 'S026', 'ADMINISTRACION DE EMPRESAS', 'GRADO', 40, true],
      ['SEC-S026-AD', 'SABADO', 'S026', 'ADMINISTRACIÓN ADUANERA', 'GRADO', 40, true],
      ['SEC-LV026-AGP', 'LUNES - VIERNES', 'LV026', 'ADMINISTRACIÓN DE LA GESTIÓN PUBLICA', 'GRADO', 40, true],
      ['SEC-LV026-AE', 'LUNES - VIERNES', 'LV026', 'ADMINISTRACION DE EMPRESAS', 'GRADO', 40, true],
      ['SEC-LV026-AD', 'LUNES - VIERNES', 'LV026', 'ADMINISTRACIÓN ADUANERA', 'GRADO', 40, true],
      ['SEC-MJ026-AGP', 'MARTES - JUEVES', 'MJ026', 'ADMINISTRACIÓN DE LA GESTIÓN PUBLICA', 'GRADO', 40, true],
      ['SEC-MJ026-AE', 'MARTES - JUEVES', 'MJ026', 'ADMINISTRACION DE EMPRESAS', 'GRADO', 40, true],
      ['SEC-MJ026-AD', 'MARTES - JUEVES', 'MJ026', 'ADMINISTRACIÓN ADUANERA', 'GRADO', 40, true],
    ];
    secciones.forEach(function(s) { sSheet.appendRow(['', 'SEC-' + Date.now() + '-' + Math.random().toString(36).substr(2,5)].concat(s)); });
    res.secciones = secciones.length;
  }

  // Modalidades
  var mSheet = ss.getSheetByName('Modalidades');
  if (mSheet.getLastRow() <= 1) {
    var modalidades = [
      ['MOD-001', 'MOD-001', 'PRESENCIAL', true],
      ['MOD-002', 'MOD-002', 'SEMIPRESENCIAL', true],
      ['MOD-003', 'MOD-003', 'VIRTUAL', true],
    ];
    modalidades.forEach(function(m) { mSheet.appendRow(['', 'MOD-' + Date.now() + '-' + Math.random().toString(36).substr(2,5)].concat(m)); });
    res.modalidades = modalidades.length;
  }

  return { ok: true, mensaje: 'Catálogos base poblados', ...res };
}

// ══════════════════════════════════════════════════════════════
// v06.4: SEMBRAR TODO con los datos conocidos (solo rellena vacías)
// Se ejecuta por URL: ?action=sembrar_todo (una vez tras publicar)
// ══════════════════════════════════════════════════════════════

function sembrarTodo(ss) {
  var res = { hojas_creadas: [], filas: {} };

  // 1) Asegurar hojas (reusa v06.3)
  var defs = [
    ['RegistroAlumnos', ['Cédula', 'Nombre', 'Apellido', 'Email', 'Grado', 'Carrera', 'Sección']],
    ['Roles', ['Cédula', 'Nombre', 'Rol', 'Carrera', 'Sección', 'Asignatura', 'Estado', 'FechaAsignación', 'AsignadoPor']],
    ['Asignaturas', ['ID', 'UUID', 'Nombre', 'Codigo', 'Carrera', 'Grado', 'Semestre', 'CargaHoraria', 'Color', 'Icono', 'Estado', 'CreatedAt', 'UpdatedAt']],
    ['Secciones', ['ID', 'UUID', 'Nombre', 'Codigo', 'Carrera', 'Grado', 'Capacidad', 'Activo', 'CreatedAt', 'UpdatedAt']],
    ['Carreras', ['ID', 'UUID', 'Nombre', 'Codigo', 'Grado', 'Activo', 'CreatedAt', 'UpdatedAt']],
    ['Grados', ['ID', 'UUID', 'Nombre', 'Activo', 'CreatedAt', 'UpdatedAt']],
    ['Modalidades', ['ID', 'UUID', 'Nombre', 'Activo', 'CreatedAt', 'UpdatedAt']],
    ['Filiales', ['ID', 'UUID', 'Nombre', 'Codigo', 'Direccion', 'Telefono', 'Estado', 'CreadoPor', 'CreatedAt', 'UpdatedAt']],
    ['Matriculaciones', ['ID', 'UUID', 'UserId', 'CodigoFormulario', 'LegajoNumero', 'FechaInscripcion', 'Nombres', 'Apellidos', 'Cedula', 'Carrera', 'Semestre', 'TipoAlumno', 'TelefonoMovil', 'CorreoElectronico', 'Estado', 'CreatedAt', 'UpdatedAt']],
    ['FormulariosCarrera', ['ID', 'UUID', 'Codigo', 'Nombre', 'Carrera', 'Tipo', 'CamposJson', 'Activo', 'CreatedAt', 'UpdatedAt']],
    ['FormulariosAlumno', ['ID', 'UUID', 'FormularioId', 'UserId', 'Cedula', 'Datos', 'Estado', 'CreatedAt', 'UpdatedAt']],
    ['AttendanceEvents', ['ID', 'UUID', 'CodigoUnico', 'Asignatura', 'Unidad', 'Lugar', 'Fecha', 'HoraInicio', 'HoraFin', 'CreadoPor', 'Estado', 'CreatedAt', 'UpdatedAt']],
    ['AttendanceRecords', ['ID', 'UUID', 'EventId', 'UserId', 'Cedula', 'Estado', 'HoraRegistro', 'Observacion', 'CreatedAt', 'UpdatedAt']],
    ['CalendarEvents', ['ID', 'UUID', 'Titulo', 'Descripcion', 'FechaInicio', 'FechaFin', 'HoraInicio', 'HoraFin', 'Tipo', 'Color', 'CreadoPor', 'Asignatura', 'CreatedAt', 'UpdatedAt']],
    ['Fotos', ['Cedula', 'Nombre', 'FileId', 'Url', 'Fecha']],
    ['Notas', ['Cédula', 'Nombre', 'Asistencia', 'Parcial1', 'Parcial2', 'Final']],
    ['Pagos', ['Cédula', 'Nombre', 'Módulo', 'Monto', 'Fecha', 'Estado', 'Comprobante', 'RegistradoPor']],
    ['Accesos', ['Fecha/Hora', 'Cédula', 'Página', 'Dispositivo', 'Tipo']]
  ];
  var antes = [];
  for (var d = 0; d < defs.length; d++) asegurarHoja(ss, defs[d][0], defs[d][1], antes);
  res.hojas_creadas = antes;

  var ts = new Date().toISOString();
  function vacia(nombre) {
    var sh = ss.getSheetByName(nombre);
    return sh && sh.getLastRow() <= 1;
  }
  function sembrar(nombre, filas) {
    if (!vacia(nombre)) return 0;
    var sh = ss.getSheetByName(nombre);
    for (var i = 0; i < filas.length; i++) sh.appendRow(filas[i]);
    res.filas[nombre] = filas.length;
    return filas.length;
  }

  // 2) Carreras corregidas (12: 3 bases x 4 grados, códigos G-/E-/M-/D-)
  sembrar('Carreras', [
    ['', 'CARR-G-AGP', 'ADMINISTRACIÓN DE LA GESTIÓN PUBLICA', 'G-AGP', 'GRADO', true, ts, ts],
    ['', 'CARR-G-AE', 'ADMINISTRACION DE EMPRESAS', 'G-AE', 'GRADO', true, ts, ts],
    ['', 'CARR-G-AD', 'ADMINISTRACIÓN ADUANERA', 'G-AD', 'GRADO', true, ts, ts],
    ['', 'CARR-E-AGP', 'ADMINISTRACIÓN DE LA GESTIÓN PUBLICA', 'E-AGP', 'ESPECIALIZACION', true, ts, ts],
    ['', 'CARR-E-AE', 'ADMINISTRACION DE EMPRESAS', 'E-AE', 'ESPECIALIZACION', true, ts, ts],
    ['', 'CARR-E-AD', 'ADMINISTRACIÓN ADUANERA', 'E-AD', 'ESPECIALIZACION', true, ts, ts],
    ['', 'CARR-M-AGP', 'ADMINISTRACIÓN DE LA GESTIÓN PUBLICA', 'M-AGP', 'MAESTRIA', true, ts, ts],
    ['', 'CARR-M-AE', 'ADMINISTRACION DE EMPRESAS', 'M-AE', 'MAESTRIA', true, ts, ts],
    ['', 'CARR-M-AD', 'ADMINISTRACIÓN ADUANERA', 'M-AE', 'MAESTRIA', true, ts, ts],
    ['', 'CARR-D-AGP', 'ADMINISTRACIÓN DE LA GESTIÓN PUBLICA', 'D-AGP', 'DOCTORADO', true, ts, ts],
    ['', 'CARR-D-AE', 'ADMINISTRACION DE EMPRESAS', 'D-AE', 'DOCTORADO', true, ts, ts],
    ['', 'CARR-D-AD', 'ADMINISTRACIÓN ADUANERA', 'D-AD', 'DOCTORADO', true, ts, ts]
  ]);

  // 3) Grados conocidos
  sembrar('Grados', [
    ['', 'GRD-001', 'GRADO', true, ts, ts],
    ['', 'GRD-002', 'ESPECIALIZACION', true, ts, ts],
    ['', 'GRD-003', 'MAESTRIA', true, ts, ts],
    ['', 'GRD-004', 'DOCTORADO', true, ts, ts]
  ]);

  // 4) Secciones corregidas (9: S026=SABADO, LV026=LUNES-VIERNES, MJ026=MARTES-JUEVES x 3 carreras)
  sembrar('Secciones', [
    ['', 'SEC-S026-AGP', 'SABADO', 'S026', 'ADMINISTRACIÓN DE LA GESTIÓN PUBLICA', 'GRADO', 40, true, ts, ts],
    ['', 'SEC-S026-AE', 'SABADO', 'S026', 'ADMINISTRACION DE EMPRESAS', 'GRADO', 40, true, ts, ts],
    ['', 'SEC-S026-AD', 'SABADO', 'S026', 'ADMINISTRACIÓN ADUANERA', 'GRADO', 40, true, ts, ts],
    ['', 'SEC-LV026-AGP', 'LUNES - VIERNES', 'LV026', 'ADMINISTRACIÓN DE LA GESTIÓN PUBLICA', 'GRADO', 40, true, ts, ts],
    ['', 'SEC-LV026-AE', 'LUNES - VIERNES', 'LV026', 'ADMINISTRACION DE EMPRESAS', 'GRADO', 40, true, ts, ts],
    ['', 'SEC-LV026-AD', 'LUNES - VIERNES', 'LV026', 'ADMINISTRACIÓN ADUANERA', 'GRADO', 40, true, ts, ts],
    ['', 'SEC-MJ026-AGP', 'MARTES - JUEVES', 'MJ026', 'ADMINISTRACIÓN DE LA GESTIÓN PUBLICA', 'GRADO', 40, true, ts, ts],
    ['', 'SEC-MJ026-AE', 'MARTES - JUEVES', 'MJ026', 'ADMINISTRACION DE EMPRESAS', 'GRADO', 40, true, ts, ts],
    ['', 'SEC-MJ026-AD', 'MARTES - JUEVES', 'MJ026', 'ADMINISTRACIÓN ADUANERA', 'GRADO', 40, true, ts, ts]
  ]);

  // 5) Modalidades
  sembrar('Modalidades', [
    ['', 'MOD-001', 'PRESENCIAL', true, ts, ts],
    ['', 'MOD-002', 'SEMIPRESENCIAL', true, ts, ts],
    ['', 'MOD-003', 'VIRTUAL', true, ts, ts]
  ]);

  // 6) Asignaturas conocidas (10)
  sembrar('Asignaturas', [
    ['', 'ASIG-TIC', 'Tecnologia de la Informacion y Comunicacion', 'TIC', 'TECNOLOGIA DE LA INFORMACION Y COMUNICACION', 'GRADO', '3er Semestre', 120, '#00B140', 'bi-laptop', 'activo', ts, ts],
    ['', 'ASIG-SOC', 'Sociologia General', 'SOC', 'ADMINISTRACION DE EMPRESAS', 'GRADO', '2do Semestre', 80, '#7C4DFF', 'bi-people', 'activo', ts, ts],
    ['', 'ASIG-DER', 'Derecho Empresarial', 'DER', 'ADMINISTRACION DE EMPRESAS', 'GRADO', '3er Semestre', 80, '#FF6B9D', 'bi-balance-scale', 'activo', ts, ts],
    ['', 'ASIG-CON', 'Contabilidad General', 'CON', 'CONTABILIDAD', 'GRADO', '1er Semestre', 120, '#4A90D9', 'bi-calculator', 'activo', ts, ts],
    ['', 'ASIG-ADM', 'Administracion General', 'ADM', 'ADMINISTRACION DE EMPRESAS', 'GRADO', '2do Semestre', 100, '#FF8C42', 'bi-briefcase', 'activo', ts, ts],
    ['', 'ASIG-ECO', 'Economia Empresarial', 'ECO', 'ADMINISTRACION DE EMPRESAS', 'GRADO', '1er Semestre', 80, '#C5A55A', 'bi-graph-up', 'activo', ts, ts],
    ['', 'ASIG-MAT', 'Matematica Aplicada', 'MAT', 'ADMINISTRACION DE EMPRESAS', 'GRADO', '1er Semestre', 100, '#E91E63', 'bi-percent', 'activo', ts, ts],
    ['', 'ASIG-ING', 'Ingles Empresarial', 'ING', 'ADMINISTRACION DE EMPRESAS', 'GRADO', '1er Semestre', 80, '#00BCD4', 'bi-translate', 'activo', ts, ts],
    ['', 'ASIG-AUD', 'Auditoria Financiera', 'AUD', 'CONTABILIDAD', 'GRADO', '4to Semestre', 100, '#9C27B0', 'bi-search', 'activo', ts, ts],
    ['', 'ASIG-TRI', 'Gestion Tributaria', 'TRI', 'CONTABILIDAD', 'GRADO', '4to Semestre', 80, '#F44336', 'bi-file-earmark-text', 'activo', ts, ts]
  ]);

  // 7) Filiales conocidas (6)
  sembrar('Filiales', [
    ['', 'FIL-001', 'Asuncion', '001', 'Avda Herrera', '', 'activo', 'admin', ts, ts],
    ['', 'FIL-002', 'Sede Central', 'SC', 'Instituto Superior Centuria - Sede Principal', '', 'activo', 'admin', ts, ts],
    ['', 'FIL-003', 'Filial Este', 'FE', 'Zona Este - Centuria', '', 'activo', 'admin', ts, ts],
    ['', 'FIL-004', 'Filial Norte', 'FN', 'Zona Norte - Centuria', '', 'activo', 'admin', ts, ts],
    ['', 'FIL-005', 'Filial Oeste', 'FO', 'Zona Oeste - Centuria', '', 'activo', 'admin', ts, ts],
    ['', 'FIL-006', 'Filial Sur', 'FS', 'Zona Sur - Centuria', '', 'activo', 'admin', ts, ts]
  ]);

  // 8) Roles conocidos (9 usuarios, sin contraseñas: el login usa la formula)
  sembrar('Roles', [
    ['1340130', 'CHRISTHIAN KEIM', 'admin', '', '', '', 'activo', ts, 'sistema'],
    ['1340125', 'Natalie Keim', 'teacher', '', '', '', 'activo', ts, 'sistema'],
    ['1801234', 'Carlos Mendoza', 'alumno', '', '', 'TIC', 'activo', ts, 'sistema'],
    ['1801235', 'Maria Garcia', 'alumno', '', '', 'TIC', 'activo', ts, 'sistema'],
    ['1801236', 'Luis Rodriguez', 'alumno', '', '', 'TIC', 'activo', ts, 'sistema'],
    ['1801237', 'Ana Torres', 'alumno', '', '', 'TIC', 'activo', ts, 'sistema'],
    ['1801238', 'Pedro Lopez', 'alumno', '', '', 'TIC', 'activo', ts, 'sistema'],
    ['1801239', 'Sofia Ramirez', 'alumno', '', '', 'TIC', 'activo', ts, 'sistema'],
    ['1886139', 'CHRISTHIAN JOSE RAUL KEIM JARA', 'alumno', '', '', 'TIC', 'activo', ts, 'sistema']
  ]);

  // 9) Formulario de matricula base
  sembrar('FormulariosCarrera', [
    ['', 'FORM-001', 'CEN-AS-SM-AGP005', 'Formulario de Matricula - Instituto Superior Centuria', '', 'matricula', '[]', 1, ts, ts]
  ]);

  return { ok: true, mensaje: 'Siembra completa (solo hojas vacías)', planilla: ss.getName(), detalle: res };
}

// ═══════════════════════════════════════════════════════════════
// v06.2: ASISTENCIA TIC (antes en Asistencia_Por_Fechas.gs)
// ═══════════════════════════════════════════════════════════════

function ticFecha(value) {
  if (value instanceof Date) return Utilities.formatDate(value, 'America/Asuncion', 'yyyy-MM-dd');
  var s = String(value || '').trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
  if (!m) { var d = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\D|$)/); if(d) m = [d[0],d[3],('0'+d[2]).slice(-2),('0'+d[1]).slice(-2)]; }
  if (!m) return '';
  var key=m[1]+'-'+m[2]+'-'+m[3], date=new Date(key+'T12:00:00Z');
  return !isNaN(date.getTime()) && date.toISOString().slice(0,10)===key ? key : '';
}

function ticFilas(ss, nombre) {
  var s=ss.getSheetByName(nombre); return s ? s.getDataRange().getValues().slice(1) : [];
}

function ticResumen(ss, cedula) {
  var alumnos=ticFilas(ss,'RegistroAlumnos'), alumno=alumnos.find(function(r){return String(r[0])===String(cedula);});
  if(!alumno || !alumno[3] || !alumno[4]) throw Error('Falta carrera o sección en RegistroAlumnos. El docente debe completar esos datos.');
  var carrera=String(alumno[3]).trim(), seccion=String(alumno[4]).trim();
  var grupo=new Set(alumnos.filter(function(r){return String(r[3]).trim()===carrera && String(r[4]).trim()===seccion;}).map(function(r){return String(r[0]);}));
  var dias={}, propios=new Set(), justificados=new Set(), hoy=ticFecha(new Date());
  ticFilas(ss,'ClasesTIC').forEach(function(r){var f=ticFecha(r[0]); if(f && String(r[1]).trim()===carrera && String(r[2]).trim()===seccion) dias[f]='Docente';});
  ticFilas(ss,'Asistencias').forEach(function(r){
    var f=ticFecha(r[0]);
    if(!f || String(r[2]).trim().toLowerCase()!=='presencial' || !grupo.has(String(r[1]))) return;
    dias[f]=dias[f] ? 'Docente y asistencia del grupo' : 'Asistencia del grupo';
    if(String(r[1])===String(cedula)) propios.add(f);
  });
  ticFilas(ss,'JustificacionesTIC').forEach(function(r){if(String(r[1])===String(cedula)) justificados.add(ticFecha(r[0]));});
  var detalle=Object.keys(dias).sort().map(function(f){return {fecha:f,origen:dias[f],estado:propios.has(f)?'Presente':justificados.has(f)?'Ausente justificado':f>=hoy?'Pendiente':'Ausente sin justificar'};});
  return {ok:true,carrera:carrera,seccion:seccion,detalle:detalle};
}

function ticGuardar(ss, data) {
  var clave=PropertiesService.getScriptProperties().getProperty('TIC_DOCENTE_KEY');
  if(clave && data.clave!==clave) throw Error('Clave docente incorrecta.');
  var fecha=ticFecha(data.fecha);
  if(!fecha || fecha!==data.fecha) throw Error('Fecha inválida.');
  var nombre, headers, fila, coincide;
  function texto(v){var t=String(v||'').trim(); if(!t || t.length>300 || /^[=+@\-]/.test(t)) throw Error('Texto obligatorio o no válido.'); return t;}
  if(data.action==='guardar_clase_tic') {
    var carrera=texto(data.carrera), seccion=texto(data.seccion);
    nombre='ClasesTIC'; headers=['Fecha','Carrera','Sección']; fila=[fecha,carrera,seccion];
    coincide=function(r){return ticFecha(r[0])===fecha && String(r[1])===carrera && String(r[2])===seccion;};
  } else {
    if(fecha>ticFecha(new Date())) throw Error('No se justifican fechas futuras.');
    var cedula=texto(data.cedula), motivo=texto(data.motivo);
    if(!ticResumen(ss,cedula).detalle.some(function(r){return r.fecha===fecha && r.estado!=='Presente';})) throw Error('No existe una ausencia para esa fecha.');
    nombre='JustificacionesTIC'; headers=['Fecha','Cédula','Motivo']; fila=[fecha,cedula,motivo];
    coincide=function(r){return ticFecha(r[0])===fecha && String(r[1])===cedula;};
  }
  var lock=LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var sheet=ss.getSheetByName(nombre); if(!sheet){sheet=ss.insertSheet(nombre);sheet.appendRow(headers);}
    var rows=ticFilas(ss,nombre), index=rows.findIndex(coincide);
    sheet.getRange(index<0 ? sheet.getLastRow()+1 : index+2,1,1,fila.length).setNumberFormat('@').setValues([fila]);
  } finally {lock.releaseLock();}
  return {ok:true};
}
