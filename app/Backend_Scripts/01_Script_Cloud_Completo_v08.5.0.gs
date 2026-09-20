/**
 * SCRIPT BACKEND CENTURIA - VERSIÓN v08.5.0
 * Cursos activos (grado + carrera + sección) + nómina de alumnos + asignación de docentes
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
 * v06 (2026-09-15): Fotos de perfil en Almacenamiento Cloud (subir_foto, obtener_foto, eliminar_foto)
 * v06.1 (2026-09-16): Diagnóstico (action=diagnostico: nombre/ID de planilla + conteo de filas)
 * v06.2 (2026-09-16): Misma base en ambos lados: guardar_asignatura (upsert por Codigo)
 * v06.3 (2026-09-16): inicializarBaseDatos + poblarCatalogosBase (28 hojas)
 * v06.4 (2026-09-16): sembrar_todo por URL (datos conocidos) + TIC sin clave obligatoria
 * v06.5 (2026-09-16): registro sin asignatura forzada + listar_grados/carreras/secciones para el formulario
 * v06.6 (2026-09-16): verificar_alumno también busca en Roles (admin/docente entran en GitHub)
 * v06.7 (2026-09-16): enviar_provisoria por Gmail (remitente/replyTo configurable)
 * v06.8 (2026-09-16): seeds alineados a datos corregidos (12 carreras G-/E-/M-/D-, 9 secciones S026/LV026/MJ026)
 * v06.9 (2026-09-16): Pagos con Factura + Tipo (columnas al final, sin romper lecturas)
 * v06.10 (2026-09-16): ?action=health para el panel de salud
 *         + cursos y catálogo leídos de la hoja Asignaturas (mapaAsignaturas)
 * v08.5.8 (2026-09-20): ruta mis_cursos (10_Mis_Cursos_v08.5.gs): cursos y asignaturas del alumno según la hoja Cursos (Activo / Pendiente / Desarrollado), unidos a Asignaturas por UUID; libreta, dashboard y materiales la usan.
 * v08.5.7 (2026-09-20): listar_asignaturas ya no descarta filas sin ID (basta Código o Nombre) y mapaAsignaturas acepta «Activo/ACTIVO».
 * v08.5.6 (2026-09-20): FACTURAS DEL ALUMNO (09_Facturas_v08.5.gs): el alumno registra fecha, número, concepto y foto de cada factura; la ven Atención al Estudiante,
 *         Administración, Filial, Tesorería y quien se habilite. Foto en carpeta privada de Drive. Rutas fac_* (POST con token). Hojas FacturasAlumno y FacturasAccesos.
 * v08.5.5 (2026-09-20): MENSAJES A LOS ALUMNOS (08_Mensajes_Alumnos_v08.5.gs): cualquier rol de atención (y docentes a su sección) escribe a todos o a un grupo;
 *         el alumno lo ve en su dashboard. Rutas msg_* (POST con token). Hojas MensajesAlumnos y MensajesLeidos.
 * v08.5.4 (2026-09-20): ATENCIÓN AL ALUMNO (07_Consultas_v08.5.gs): el alumno escribe consultas que ve directo el personal de atención/académico;
 *         se puede sumar personas o derivar a áreas; respuestas y notas internas forman el expediente. Rutas con_* (POST con token). Hojas Consultas y ConsultaMensajes.
 * v08.5.3 (2026-09-20): Módulo de EVENTOS (06_Eventos_v08.5.gs): eventos ligados al calendario con mapa, contactos, código de activación
 *         y asistencia leyendo varios QR a la vez; panel por grado/carrera/sección. Rutas evt_* (POST con token). Hojas Eventos y EventoAsistencias.
 * v08.5.2 (2026-09-20): Credencial con QR DINÁMICO (05_Credencial_QR_v08.5.gs): rutas qr_credencial y qr_verificar (POST con token).
 *         Lotes de 6 códigos (uno por ventana de QR_PASO segundos, 20 por defecto): de un solo uso, sin datos personales,
 *         y el celular los rota sin pedir nada al servidor en cada cambio.
 * v08.5.0 (2026-09-20): Rol "Asistencia al Estudiante" (asistencia_estudiante): ficha del estudiante, cumpleaños con beneficios,
 *         quejas derivables por mail; mensaje de cumpleaños del alumno (cumple_mio). Lógica en 04_Asistencia_Estudiante_v08.5.gs
 *         (hojas BeneficiosCumple y Quejas; rutas asist_* y cumple_mio, todas por POST con token de sesión).
 *         Incluye lo de v08.4.2: ruta guardar_matricula (la matrícula del formulario no se guardaba) y columnas Nacionalidad,
 *         EstadoCivil, DepartamentoCodigo, CiudadCodigo y BarrioCodigo al final de Matriculaciones.
 * v08.4.1 (2026-09-20): Catálogos (Grados/Carreras/Secciones) tolerantes: encabezados sin distinguir mayúsculas/tildes,
 *         Nombre<->Codigo de respaldo, pestaña por nombre aproximado y respaldo por gid para Secciones;
 *         listar_secciones vacío devuelve _diag (pestañas y encabezados). Sin cambios en 02 ni 03.
 * v08.4 (2026-09-20): Cursos activos: grado + carrera + sección con nómina independiente de usuarios.
 *         Asignación de múltiples docentes/asignaturas por curso.
 *         Hojas: Cursos, NominaCurso; rutas: cursos_listar, curso_guardar, curso_nomina_*, asignacion_*.
 *         (ver 03_Asignaciones_Academico_v08.4.gs; lógica de examen en 02_Examenes_Factura_v08.4.gs)
 * v08.1 (2026-09-19): Exámenes por factura: el alumno carga su N° de factura, recibe enlace + clave por mail,
 *         el docente fija fecha/hora de inicio y cierre e intentos (ver 02_Examenes_Factura_v08.4.gs;
 *         hojas ConfigExamen, AccesoExamen, IntentosExamen)
 * v07.1 (2026-09-16): CONSTRUCTOR ACADÉMICO (hojas propias SubjectDrafts/Programs/Units/
 *         Blocks/Activities/Evaluations/QuestionBank/Reviews + CRUD + flujo editorial +
 *         ponderación ≤100% + duplicar; sin tocar producción ni TIC)
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

  // ── HEALTH para el panel de salud (v06.9) ──
  if (action === 'health') {
    try {
      var d = diagnosticoSheets(ss);
      return responderJSON({ ok: true, data: { api: { ok: true }, cloudSheets: { ok: true, planilla: d.planilla_nombre }, auth: { ok: true } }, requestId: 'health-' + Date.now() });
    }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── CONSTRUCTOR ACADÉMICO v07.1: lectura ──
  if (action === 'constructor_list_drafts' || action === 'constructor_get_subject' ||
      action === 'constructor_list_bank' || action === 'constructor_list_reviews') {
    try { return responderJSON(ctRead(ss, action, e.parameter)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── AUTENTICACIÓN Y SESIÓN v08 ──
  if (action === 'validar_sesion') {
    try { return responderJSON(cvAuthValidateSession(ss, e.parameter)); }
    catch (error) { return responderJSON({ ok: false, valid: false, error: error.message }); }
  }
  if (action === 'obtener_perfil') {
    try { return responderJSON(cvAuthGetProfile(ss, e.parameter)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── VERIFICAR ALUMNO ──
  if (action === 'verificar_alumno') {
    var cedula = e.parameter.cedula;
    var userAuth = cvAuthFindUser(ss, cedula);
    if (userAuth) {
      return responderJSON({
        existe: true,
        nombre: (userAuth.nombre + ' ' + userAuth.apellido).trim() || userAuth.nombre,
        nombre_separado: { nombre: userAuth.nombre || '', apellido: userAuth.apellido || '' },
        email: userAuth.email || '',
        grado: userAuth.grado || '',
        carrera: userAuth.carrera || '',
        seccion: userAuth.seccion || '',
        rol: userAuth.rol || 'alumno',
        estado: userAuth.estado || 'activo'
      });
    }
    var solicitudDocente = cvDocenteFind(ss, cedula);
    if (solicitudDocente) return responderJSON({ existe: true, managed_docente: true });
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

  // ── EXÁMENES POR FACTURA v08.1 (lógica en 02_Examenes_Factura_v08.4.gs) ──
  if (action === 'pagos_ultimos' || action === 'examen_config_listar' || action === 'examen_config_publica' || action === 'examen_solicitudes') {
    try {
      if (action === 'pagos_ultimos') return responderJSON(cvPagosUltimos(ss, e.parameter));
      if (action === 'examen_config_listar') return responderJSON(cvExamenConfigListar(ss, e.parameter));
      if (action === 'examen_config_publica') return responderJSON(cvExamenConfigPublica(ss, e.parameter));
      return responderJSON(cvExamenSolicitudes(ss, e.parameter));
    } catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── ACCESO ACADÉMICO v08.2 (lógica en 03_Asignaciones_Academico_v08.4.gs) ──
  if (action === 'asignaciones_docentes' || action === 'examen_listar_pendientes_aprobacion' || action === 'examen_estado_aprobacion') {
    try {
      if (action === 'asignaciones_docentes') return responderJSON(cvAsigDocentesListar(ss, e.parameter));
      if (action === 'examen_listar_pendientes_aprobacion') return responderJSON(cvExamenAprobLista(ss, e.parameter));
      return responderJSON(cvExamenAprobEstado(ss, e.parameter));
    } catch (error) { return responderJSON({ ok: false, error: error.message, aprobado: false }); }
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

  // ── HISTORIAL DE JUSTIFICACIONES del alumno (v06.10) ──
  if (action === 'mis_justificaciones') {
    try { return responderJSON({ ok: true, justificaciones: misJustificaciones(ss, e.parameter.cedula) }); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
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
    try {
      var secs = listarCatalogoSimple(ss, 'Secciones');
      var resp = { secciones: secs };
      if (!secs.length) { // diagnóstico: solo nombres de pestañas y encabezados (sin datos de alumnos)
        resp._diag = ss.getSheets().map(function (h) {
          var cols = h.getLastColumn();
          return { hoja: h.getName(), gid: h.getSheetId(), filas: h.getLastRow(),
                   encabezados: (cols > 0 && h.getLastRow() > 0) ? h.getRange(1, 1, 1, Math.min(cols, 15)).getValues()[0] : [] };
        });
      }
      return responderJSON(resp);
    }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── MIS ALUMNOS (docente por carrera y sección) ──
  if (action === 'mis_alumnos') {
    try { return responderJSON(cvAlumnosPorCarreraSeccion(ss, e.parameter.carrera, e.parameter.seccion)); }
    catch (error) { return responderJSON({ ok: false, error: error.message, alumnos: [] }); }
  }

  // ── LISTAR USUARIOS (admin y docente) ──
  if (action === 'listar_usuarios' || action === 'usuarios') {
    try { return responderJSON(cvListarUsuarios(ss)); }
    catch (error) { return responderJSON({ ok: false, error: error.message, usuarios: [], data: [] }); }
  }

  // ── LISTAR NOTAS (alumnos y docentes) ──
  if (action === 'listar_notas' || action === 'grades_list') {
    try { return responderJSON(cvListarNotas(ss, e.parameter.cedula, e.parameter.asignatura)); }
    catch (error) { return responderJSON({ ok: false, error: error.message, data: [] }); }
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

  // ── AUTENTICACIÓN, REGISTRO Y PERFIL v08 ──
  if (data.action === 'login') {
    try { return responderJSON(cvAuthLogin(ss, data)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }
  if (data.action === 'register' || data.action === 'registrar_usuario') {
    try { return responderJSON(cvAuthRegister(ss, data)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }
  if (data.action === 'validar_sesion') {
    try { return responderJSON(cvAuthValidateSession(ss, data)); }
    catch (error) { return responderJSON({ ok: false, valid: false, error: error.message }); }
  }
  if (data.action === 'logout') {
    try { return responderJSON(cvAuthLogout(ss, data)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }
  if (data.action === 'actualizar_perfil') {
    try { return responderJSON(cvAuthUpdateProfile(ss, data)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }
  if (data.action === 'cambiar_password') {
    try { return responderJSON(cvAuthChangePassword(ss, data)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }
  if (data.action === 'recuperar_acceso') {
    try { return responderJSON(cvAuthRecoverAccess(ss, data)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // Solicitudes docentes v1: respuestas confirmadas y aprobación autorizada en servidor.
  if (data.action && data.action.indexOf('docente_') === 0) {
    try { return responderJSON(cvDocenteDispatch(ss, data)); }
    catch (error) { return responderJSON({ ok: false, contract: 'docentes-v1', code: error.code || 'REQUEST_FAILED', error: error.message }); }
  }
  // Los endpoints antiguos no pueden activar ni sobrescribir una solicitud docente.
  if (['registrar_alumno', 'asignar_rol', 'desactivar_rol'].indexOf(data.action) >= 0 && cvDocenteFind(ss, data.cedula)) {
    return responderJSON({ ok: false, error: 'Gestiona esta cuenta desde Solicitudes docentes.' });
  }

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

  // ── JUSTIFICAR AUSENCIA del alumno (v06.10) ──
  if (data.action === 'justificar_ausencia') {
    try { return responderJSON(guardarJustificacion(ss, data)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── CONSTRUCTOR ACADÉMICO v07.1: escritura ──
  if (data.action && data.action.indexOf('constructor_') === 0) {
    try { return responderJSON(ctWrite(ss, data)); }
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

  // ── 1. REGISTRAR ALUMNO (v06.10: + FechaHora de registro) ──
  if (data.action === 'registrar_alumno') {
    var sheetAlumnos = ss.getSheetByName('RegistroAlumnos');
    if (!sheetAlumnos) {
      sheetAlumnos = ss.insertSheet('RegistroAlumnos');
      sheetAlumnos.appendRow(['Cédula', 'Nombre', 'Apellido', 'Email', 'Grado', 'Carrera', 'Sección', 'FechaHora']);
    } else {
      var hReg = sheetAlumnos.getRange(1, 1, 1, sheetAlumnos.getLastColumn()).getValues()[0];
      if (hReg.indexOf('FechaHora') < 0) sheetAlumnos.getRange(1, sheetAlumnos.getLastColumn() + 1).setValue('FechaHora');
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
    var tsReg = Utilities.formatDate(new Date(), 'America/Asuncion', 'yyyy-MM-dd HH:mm:ss');
    sheetAlumnos.appendRow([
      data.cedula, nombre, apellido, data.email || '',
      data.grado || '', data.carrera || '', data.seccion || '', tsReg
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

  // ── 4. MARCAR ASISTENCIA (v06.10: + IP y Dispositivo al final) ──
  if (data.action === 'marcar_asistencia') {
    var sheetAsistencia = ss.getSheetByName('Asistencias');
    if (!sheetAsistencia) {
      sheetAsistencia = ss.insertSheet('Asistencias');
      sheetAsistencia.appendRow(['Fecha/Hora', 'Cédula', 'Unidad/Lugar', 'Observación', 'IP', 'Dispositivo']);
    } else {
      var ha = sheetAsistencia.getRange(1, 1, 1, sheetAsistencia.getLastColumn()).getValues()[0];
      if (ha.indexOf('IP') < 0) sheetAsistencia.getRange(1, sheetAsistencia.getLastColumn() + 1).setValue('IP');
      if (ha.indexOf('Dispositivo') < 0) sheetAsistencia.getRange(1, sheetAsistencia.getLastColumn() + 1).setValue('Dispositivo');
    }
    var ts3 = new Date().toLocaleString('es-ES', { timeZone: 'America/Asuncion' });
    sheetAsistencia.appendRow([ts3, data.cedula, data.unidad || "Presencial", data.observacion || "",
      data.ip || '', data.dispositivo || '']);
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

  // ── GUARDAR NOTAS ASIGNATURA (múltiples alumnos) ──
  if (data.action === 'guardar_notas_asignatura' || data.action === 'record_subject') {
    try { return responderJSON(cvGuardarNotasAsignatura(ss, data)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── EXÁMENES POR FACTURA v08.1 (lógica en 02_Examenes_Factura_v08.4.gs) ──
  if (data.action === 'examen_config_guardar' || data.action === 'examen_solicitar' ||
      data.action === 'examen_resolver' || data.action === 'examen_acceso_validar') {
    try {
      if (data.action === 'examen_config_guardar') return responderJSON(cvExamenConfigGuardar(ss, data));
      if (data.action === 'examen_solicitar') return responderJSON(cvExamenSolicitar(ss, data));
      if (data.action === 'examen_resolver') return responderJSON(cvExamenResolver(ss, data));
      return responderJSON(cvExamenAccesoValidar(ss, data));
    } catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── ACCESO ACADÉMICO v08.2 (lógica en 03_Asignaciones_Academico_v08.4.gs) ──
  if (['asignacion_guardar', 'asignacion_revocar', 'asignacion_docente_decidir', 'examen_aprobar', 'examen_rechazar', 'examen_revocar_aprobacion'].indexOf(data.action) >= 0) {
    try {
      if (data.action === 'asignacion_guardar') return responderJSON(cvAsigGuardar(ss, data));
      if (data.action === 'asignacion_revocar') return responderJSON(cvAsigRevocar(ss, data));
      if (data.action === 'asignacion_docente_decidir') return responderJSON(cvAsigDocenteDecidir(ss, data));
      var estadoAprob = data.action === 'examen_aprobar' ? 'aprobado' : (data.action === 'examen_rechazar' ? 'rechazado' : 'pendiente');
      return responderJSON(cvExamenAprobDecidir(ss, data, estadoAprob));
    } catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── CREDENCIAL QR DINÁMICO v08.5.2 (lógica en 05_Credencial_QR_v08.5.gs) — por POST: el token no viaja en la URL ──
  if (data.action === 'qr_credencial' || data.action === 'qr_verificar') {
    try {
      return responderJSON(data.action === 'qr_credencial' ? cvQrGenerar(ss, data) : cvQrVerificar(ss, data));
    } catch (error) {
      return responderJSON({ ok: false, error: error.message });
    }
  }

  // ── EVENTOS v08.5.3 (lógica en 06_Eventos_v08.5.gs) — por POST con token de sesión ──
  if (String(data.action || '').indexOf('evt_') === 0) {
    try {
      switch (data.action) {
        case 'evt_listar': return responderJSON(cvEvtListar(ss, data));
        case 'evt_info': return responderJSON(cvEvtInfo(ss, data));
        case 'evt_guardar': return responderJSON(cvEvtGuardar(ss, data));
        case 'evt_estado': return responderJSON(cvEvtEstado(ss, data));
        case 'evt_codigo_nuevo': return responderJSON(cvEvtCodigoNuevoRuta(ss, data));
        case 'evt_marcar': return responderJSON(cvEvtMarcar(ss, data));
        case 'evt_panel': return responderJSON(cvEvtPanel(ss, data));
        case 'evt_asistentes': return responderJSON(cvEvtAsistentes(ss, data));
      }
    } catch (error) {
      return responderJSON({ ok: false, error: error.message });
    }
  }

  // ── MIS CURSOS v08.5.8 (lógica en 10_Mis_Cursos_v08.5.gs): cursos y asignaturas reales del alumno según la hoja Cursos ──
  if (data.action === 'mis_cursos') {
    try {
      return responderJSON(cvMcDespachar(ss, data));
    } catch (error) {
      return responderJSON({ ok: false, error: error.message });
    }
  }

  // ── FACTURAS DEL ALUMNO v08.5.6 (lógica en 09_Facturas_v08.5.gs) — por POST con token de sesión ──
  if (String(data.action || '').indexOf('fac_') === 0) {
    try {
      return responderJSON(cvFacDespachar(ss, data));
    } catch (error) {
      return responderJSON({ ok: false, error: error.message });
    }
  }

  // ── MENSAJES A LOS ALUMNOS v08.5.5 (lógica en 08_Mensajes_Alumnos_v08.5.gs) — por POST con token de sesión ──
  if (String(data.action || '').indexOf('msg_') === 0) {
    try {
      return responderJSON(cvMsgDespachar(ss, data));
    } catch (error) {
      return responderJSON({ ok: false, error: error.message });
    }
  }

  // ── ATENCIÓN AL ALUMNO v08.5.4 (consultas con expediente; lógica en 07_Consultas_v08.5.gs) — por POST con token de sesión ──
  if (String(data.action || '').indexOf('con_') === 0) {
    try {
      return responderJSON(cvConDespachar(ss, data));
    } catch (error) {
      return responderJSON({ ok: false, error: error.message });
    }
  }

  // ── ASISTENCIA AL ESTUDIANTE v08.5 (lógica en 04_Asistencia_Estudiante_v08.5.gs) — todo por POST: el token no viaja en la URL ──
  if (String(data.action || '').indexOf('asist_') === 0 || data.action === 'cumple_mio') {
    try {
      switch (data.action) {
        case 'asist_catalogos': return responderJSON(cvAsistCatalogos(ss, data));
        case 'asist_buscar': return responderJSON(cvAsistBuscar(ss, data));
        case 'asist_ficha': return responderJSON(cvAsistFicha(ss, data));
        case 'asist_cumpleanos': return responderJSON(cvAsistCumpleanos(ss, data));
        case 'asist_beneficio_otorgar': return responderJSON(cvAsistBeneficioOtorgar(ss, data));
        case 'asist_beneficio_estado': return responderJSON(cvAsistBeneficioEstado(ss, data));
        case 'asist_queja_registrar': return responderJSON(cvAsistQuejaRegistrar(ss, data));
        case 'asist_queja_listar': return responderJSON(cvAsistQuejaListar(ss, data));
        case 'asist_queja_enviar': return responderJSON(cvAsistQuejaEnviar(ss, data));
        case 'asist_queja_cerrar': return responderJSON(cvAsistQuejaCerrar(ss, data));
        case 'cumple_mio': return responderJSON(cvAsistCumpleMio(ss, data));
      }
      return responderJSON({ ok: false, error: 'Acción no reconocida.' });
    } catch (error) { return responderJSON({ ok: false, error: error.message }); }
  }

  // ── GUARDAR RESPUESTAS DE EXAMEN (detalle pregunta por pregunta) ──
  if (data.action === 'guardar_respuestas_examen') {
    try { return responderJSON(cvGuardarRespuestasExamen(ss, data)); }
    catch (error) { return responderJSON({ ok: false, error: error.message }); }
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

  // ── 9. REGISTRAR PAGO (v06.9: + Factura y Tipo al final, sin mover columnas) ──
  if (data.action === 'registrar_pago') {
    var sheetPagos = ss.getSheetByName('Pagos');
    if (!sheetPagos) {
      sheetPagos = ss.insertSheet('Pagos');
      sheetPagos.appendRow(['Cédula', 'Nombre', 'Módulo', 'Monto', 'Fecha', 'Estado', 'Comprobante', 'RegistradoPor', 'Factura', 'Tipo']);
    } else {
      var hp = sheetPagos.getRange(1, 1, 1, sheetPagos.getLastColumn()).getValues()[0];
      if (hp.indexOf('Factura') < 0) sheetPagos.getRange(1, sheetPagos.getLastColumn() + 1).setValue('Factura');
      if (hp.indexOf('Tipo') < 0) sheetPagos.getRange(1, sheetPagos.getLastColumn() + 1).setValue('Tipo');
    }
    var ts6 = new Date().toLocaleString('es-ES', { timeZone: 'America/Asuncion' });
    sheetPagos.appendRow([
      data.cedula || '', data.nombre || '', data.modulo || data.concepto || '',
      data.monto || 0, data.fecha || ts6, data.estado || 'pendiente',
      data.comprobante || '', data.registrado_por || 'admin',
      data.factura || data.factura_numero || '', data.tipo || 'modulo'
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
          pagosData[q][2] === (data.modulo || data.concepto || '')) {
          if (data.estado) sheetPagos2.getRange(q + 1, 6).setValue(data.estado);
          if (data.comprobante) sheetPagos2.getRange(q + 1, 7).setValue(data.comprobante);
          if (data.factura || data.factura_numero) sheetPagos2.getRange(q + 1, 9).setValue(data.factura || data.factura_numero);
          if (data.tipo) sheetPagos2.getRange(q + 1, 10).setValue(data.tipo);
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
  if (data.action === 'matricular_alumno' || data.action === 'guardar_matricula') {
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

// ═══ REGISTRO DOCENTE v07.1 ═══
// La clave REGISTRO_DOCENTE_ADMIN_KEY se configura SOLO en Script Properties.
// No se confía en cédula, rol ni token PHP enviados por el navegador.
var CV_DOCENTE_HEADERS = ['id', 'cedula', 'nombre', 'apellido', 'email', 'telefono', 'grado', 'carrera', 'seccion', 'credential_hash', 'estado', 'created_at', 'reviewed_at'];

function cvDocenteError(code, message) {
  var error = new Error(message); error.code = code; throw error;
}
function cvDocenteHash(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}
function cvDocenteEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  var diff = a.length ^ b.length;
  for (var i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
function cvDocenteAdmin(data) {
  var key = PropertiesService.getScriptProperties().getProperty('REGISTRO_DOCENTE_ADMIN_KEY');
  if (!key || key.length < 32) cvDocenteError('NOT_CONFIGURED', 'Administración debe habilitar la aprobación docente en el servidor.');
  if (!cvDocenteEqual(cvDocenteHash(key), cvDocenteHash(data.admin_key || ''))) cvDocenteError('FORBIDDEN', 'Autorización administrativa incorrecta.');
}
function cvDocenteRows(ss) {
  var sheet = ss.getSheetByName('SolicitudesDocentes');
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  return values.slice(1).map(function (row, i) {
    var obj = { _row: i + 2 };
    values[0].forEach(function (h, j) { obj[h] = row[j]; });
    return obj;
  });
}
function cvDocenteFind(ss, cedula) {
  return cvDocenteRows(ss).filter(function (r) { return String(r.cedula) === String(cedula || ''); })[0] || null;
}
function cvDocenteText(value, max, required) {
  var text = String(value || '').trim();
  if ((required && !text) || text.length > max || /^[=+@\-]/.test(text) || /[\x00-\x1f<>]/.test(text)) cvDocenteError('VALIDATION', 'Revisa los datos: hay un campo vacío, demasiado largo o con caracteres no permitidos.');
  return text;
}
function cvDocenteCedula(value) {
  var cedula = String(value || '').replace(/\./g, '').trim();
  if (!/^\d{4,15}$/.test(cedula)) cvDocenteError('VALIDATION', 'La cédula debe contener entre 4 y 15 dígitos.');
  return cedula;
}
function cvDocentePublic(row) {
  var result = {};
  CV_DOCENTE_HEADERS.forEach(function (h) { if (h !== 'credential_hash') result[h] = row[h]; });
  result.rol_solicitado = 'docente';
  result.origen = 'cloud';
  return result;
}
function cvDocenteUpdate(ss, row, fields) {
  var sheet = ss.getSheetByName('SolicitudesDocentes');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Object.keys(fields).forEach(function (h) {
    var col = headers.indexOf(h);
    if (col < 0) throw Error('Esquema de solicitudes incompatible.');
    sheet.getRange(row._row, col + 1).setValue(fields[h]);
  });
}
function cvDocenteActive(ss, cedula) {
  return obtenerRoles(ss, cedula).some(function (r) { return r.rol === 'docente' && r.estado === 'activo'; });
}
function cvDocenteDispatch(ss, data) {
  var result = { ok: true, contract: 'docentes-v1' };
  if (data.action === 'docente_estado') {
    var row = cvDocenteFind(ss, cvDocenteCedula(data.cedula));
    result.managed = !!row;
    // No exponer datos personales ni el estado de revisión en esta consulta pública.
    return result;
  }
  if (data.action === 'docente_pendientes') {
    cvDocenteAdmin(data);
    result.pendientes = cvDocenteRows(ss).filter(function (r) { return r.estado === 'pendiente' || r.estado === 'aprobando'; }).map(cvDocentePublic);
    return result;
  }
  if (data.action === 'docente_ingresar') {
    var cedula = cvDocenteCedula(data.cedula);
    var cache = CacheService.getScriptCache();
    var attemptsKey = 'docente-attempts-' + cvDocenteHash(cedula);
    var attempts = Number(cache.get(attemptsKey) || 0);
    if (attempts >= 8) cvDocenteError('RATE_LIMIT', 'Demasiados intentos. Intenta nuevamente en 15 minutos.');
    var account = cvDocenteFind(ss, cedula);
    if (!account || !/^[a-f0-9]{48}$/.test(String(data.password || '')) || !cvDocenteEqual(account.credential_hash, cvDocenteHash(data.password))) {
      cache.put(attemptsKey, String(attempts + 1), 900);
      cvDocenteError('INVALID_CREDENTIALS', 'Cédula o contraseña incorrecta.');
    }
    if (account.estado !== 'aprobado') cvDocenteError('PENDING', account.estado === 'rechazado' ? 'Tu solicitud no fue aprobada. Contacta a administración.' : 'Tu solicitud está pendiente de aprobación administrativa.');
    if (!cvDocenteActive(ss, cedula)) cvDocenteError('INACTIVE', 'Tu acceso docente está inactivo. Contacta a administración.');
    cache.remove(attemptsKey);
    var token = Utilities.getUuid() + Utilities.getUuid();
    cache.put('docente-session-' + cvDocenteHash(token), cedula, 3600);
    result.token = token;
    result.user = { cedula: cedula, nombre: account.nombre, apellido: account.apellido, rol: 'docente' };
    return result;
  }
  if (data.action === 'docente_sesion' || data.action === 'docente_salir') {
    var sessionKey = 'docente-session-' + cvDocenteHash(data.token || '');
    var sessionCache = CacheService.getScriptCache();
    var sessionCedula = sessionCache.get(sessionKey);
    if (data.action === 'docente_salir') { sessionCache.remove(sessionKey); return result; }
    var sessionAccount = sessionCedula && cvDocenteFind(ss, sessionCedula);
    if (!sessionAccount || sessionAccount.estado !== 'aprobado' || !cvDocenteActive(ss, sessionCedula)) cvDocenteError('UNAUTHORIZED', 'Tu sesión venció. Ingresa nuevamente.');
    result.cedula = sessionCedula;
    return result;
  }
  if (data.action !== 'docente_solicitar' && data.action !== 'docente_revisar') cvDocenteError('UNKNOWN_ACTION', 'Operación docente no reconocida.');
  if (data.action === 'docente_revisar') cvDocenteAdmin(data);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) cvDocenteError('BUSY', 'Servidor ocupado. Reintenta en unos segundos.');
  try {
    if (data.action === 'docente_solicitar') {
      var ci = cvDocenteCedula(data.cedula);
      var hash = String(data.credential_hash || '');
      if (!/^[a-f0-9]{64}$/.test(hash)) cvDocenteError('VALIDATION', 'Falta la contraseña de acceso generada.');
      var existing = cvDocenteFind(ss, ci);
      if (existing) {
        if (existing.estado === 'pendiente' && cvDocenteEqual(existing.credential_hash, hash)) {
          result.id = existing.id; result.estado = 'pendiente'; return result;
        }
        cvDocenteError('DUPLICATE', 'Ya existe una cuenta o solicitud para esta cédula. Contacta a administración.');
      }
      var alumnos = ss.getSheetByName('RegistroAlumnos');
      if ((alumnos && alumnos.getDataRange().getValues().slice(1).some(function (r) { return String(r[0]) === ci; })) || obtenerRoles(ss, ci).length) cvDocenteError('DUPLICATE', 'Ya existe una cuenta para esta cédula. Solicita a administración agregar el rol docente.');
      var email = cvDocenteText(data.email, 254, true);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) cvDocenteError('VALIDATION', 'Ingresa un correo electrónico válido.');
      var request = { id: 'DOC-' + Utilities.getUuid(), cedula: ci,
        nombre: cvDocenteText(data.nombre, 100, true).toUpperCase(), apellido: cvDocenteText(data.apellido, 100, true).toUpperCase(),
        email: email, telefono: cvDocenteText(data.telefono, 40, false), grado: cvDocenteText(data.grado, 150, false),
        carrera: cvDocenteText(data.carrera, 200, false), seccion: cvDocenteText(data.seccion, 60, false),
        credential_hash: hash, estado: 'pendiente', created_at: new Date().toISOString(), reviewed_at: '' };
      var sheet = ss.getSheetByName('SolicitudesDocentes');
      if (!sheet) { sheet = ss.insertSheet('SolicitudesDocentes'); sheet.appendRow(CV_DOCENTE_HEADERS); }
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      if (CV_DOCENTE_HEADERS.some(function (h) { return headers.indexOf(h) < 0; })) throw Error('Esquema de solicitudes incompatible.');
      sheet.appendRow(headers.map(function (h) { return request[h] || ''; }));
      SpreadsheetApp.flush();
      result.id = request.id; result.estado = 'pendiente'; return result;
    }
    if (['aprobar', 'rechazar'].indexOf(data.decision) < 0) cvDocenteError('VALIDATION', 'Decisión no válida.');
    var pending = cvDocenteRows(ss).filter(function (r) { return r.id === data.id; })[0];
    if (!pending) cvDocenteError('NOT_FOUND', 'Solicitud no encontrada.');
    var target = data.decision === 'aprobar' ? 'aprobado' : 'rechazado';
    if (pending.estado === target) { result.estado = target; return result; }
    if (pending.estado !== 'pendiente' && !(pending.estado === 'aprobando' && target === 'aprobado')) cvDocenteError('CONFLICT', 'La solicitud ya fue procesada. Actualiza la lista.');
    if (target === 'aprobado') {
      cvDocenteUpdate(ss, pending, { estado: 'aprobando' });
      var roles = ss.getSheetByName('Roles');
      if (!roles) {
        roles = ss.insertSheet('Roles');
        roles.appendRow(['Cédula', 'Nombre', 'Rol', 'Carrera', 'Sección', 'Asignatura', 'Estado', 'FechaAsignación', 'AsignadoPor']);
      }
      // Reintentar una aprobación parcial no duplica el rol.
      var marker = 'solicitud:' + pending.id;
      var exists = roles.getDataRange().getValues().slice(1).some(function (r) { return String(r[0]) === String(pending.cedula) && r[8] === marker; });
      if (!exists) roles.appendRow([pending.cedula, pending.nombre + ' ' + pending.apellido, 'docente', pending.carrera, pending.seccion, '', 'activo', new Date().toISOString(), marker]);
    }
    cvDocenteUpdate(ss, pending, { estado: target, reviewed_at: new Date().toISOString() });
    SpreadsheetApp.flush();
    result.estado = target; return result;
  } finally { lock.releaseLock(); }
}

// ══════════════════════════════════════════════════════════════
// ═══ AUTENTICACIÓN, REGISTRO Y GESTIÓN DE SESIONES CENTURIA v08 ═══
// ══════════════════════════════════════════════════════════════

var CV_USUARIOS_HEADERS = [
  'id', 'uuid', 'cedula', 'nombre', 'apellido', 'email', 'telefono',
  'rol', 'estado', 'password_hash', 'salt', 'grado', 'carrera', 'seccion',
  'foto_url', 'created_at', 'updated_at', 'last_login', 'token_actual', 'token_expires'
];

var CV_SESIONES_HEADERS = [
  'token', 'cedula', 'rol', 'created_at', 'expires_at', 'estado', 'ip', 'user_agent'
];

function cvAuthEnsureSheets(ss) {
  var userSheet = ss.getSheetByName('Usuarios');
  if (!userSheet) {
    userSheet = ss.insertSheet('Usuarios');
    userSheet.appendRow(CV_USUARIOS_HEADERS);
    var r1 = userSheet.getRange(1, 1, 1, CV_USUARIOS_HEADERS.length);
    r1.setFontWeight('bold');
    r1.setBackground('#007A33');
    r1.setFontColor('#FFFFFF');
    userSheet.setFrozenRows(1);
  } else {
    var h = userSheet.getRange(1, 1, 1, Math.max(1, userSheet.getLastColumn())).getValues()[0];
    var hMap = h.map(function(x) { return String(x).toLowerCase().trim(); });
    CV_USUARIOS_HEADERS.forEach(function(reqH) {
      if (hMap.indexOf(reqH.toLowerCase()) < 0) {
        userSheet.getRange(1, userSheet.getLastColumn() + 1).setValue(reqH);
      }
    });
  }

  var sesSheet = ss.getSheetByName('Sesiones');
  if (!sesSheet) {
    sesSheet = ss.insertSheet('Sesiones');
    sesSheet.appendRow(CV_SESIONES_HEADERS);
    var r2 = sesSheet.getRange(1, 1, 1, CV_SESIONES_HEADERS.length);
    r2.setFontWeight('bold');
    r2.setBackground('#007A33');
    r2.setFontColor('#FFFFFF');
    sesSheet.setFrozenRows(1);
  } else {
    var hs = sesSheet.getRange(1, 1, 1, Math.max(1, sesSheet.getLastColumn())).getValues()[0];
    var hsMap = hs.map(function(x) { return String(x).toLowerCase().trim(); });
    CV_SESIONES_HEADERS.forEach(function(reqH) {
      if (hsMap.indexOf(reqH.toLowerCase()) < 0) {
        sesSheet.getRange(1, sesSheet.getLastColumn() + 1).setValue(reqH);
      }
    });
  }
}

function cvAuthHash(password, salt) {
  return cvDocenteHash(String(salt || '') + ':' + String(password || ''));
}

function cvAuthNormalizeCedula(val) {
  return String(val || '').replace(/[\.\s\-]/g, '').trim();
}

function cvAuthNormalizeEmail(val) {
  return String(val || '').toLowerCase().trim();
}

function cvAuthSanitizeText(val, maxLen) {
  var s = String(val || '').trim();
  if (s.length > (maxLen || 100)) s = s.substring(0, maxLen || 100);
  return s.replace(/<[^>]*>/g, '');
}

function cvAuthGetAllUsers(ss) {
  cvAuthEnsureSheets(ss);
  var sheet = ss.getSheetByName('Usuarios');
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim().replace(/[^a-z0-9]/g, '_'); });
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var obj = { _row: i + 1 };
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    out.push(obj);
  }
  return out;
}

function cvAuthFindUser(ss, cedula) {
  var c = cvAuthNormalizeCedula(cedula);
  if (!c) return null;
  var users = cvAuthGetAllUsers(ss);
  for (var i = 0; i < users.length; i++) {
    if (cvAuthNormalizeCedula(users[i].cedula) === c) return users[i];
  }
  // Búsqueda de respaldo en Roles (para cuentas admin/docentes sembradas)
  var sheetR = ss.getSheetByName('Roles');
  if (sheetR) {
    var rData = sheetR.getDataRange().getValues();
    for (var k = 1; k < rData.length; k++) {
      if (cvAuthNormalizeCedula(rData[k][0]) === c) {
        var full = String(rData[k][1] || '').trim();
        var p = full.split(/\s+/);
        return {
          id: 'ROL-' + c,
          uuid: 'ROL-' + c,
          cedula: c,
          nombre: p[0] || full,
          apellido: p.slice(1).join(' ') || '',
          email: '',
          rol: String(rData[k][2] || 'alumno').toLowerCase(),
          carrera: String(rData[k][3] || ''),
          seccion: String(rData[k][4] || ''),
          estado: String(rData[k][6] || 'activo').toLowerCase(),
          is_legacy: true
        };
      }
    }
  }

  // Búsqueda de respaldo en RegistroAlumnos
  var sheetAl = ss.getSheetByName('RegistroAlumnos');
  if (sheetAl) {
    var alData = sheetAl.getDataRange().getValues();
    for (var a = 1; a < alData.length; a++) {
      if (cvAuthNormalizeCedula(alData[a][0]) === c) {
        var carAl = String(alData[a][5] || '').trim();
        var secAl = String(alData[a][6] || '').trim();
        var rolCalculado = (carAl.toUpperCase() === 'ADMIN' || secAl.toUpperCase() === 'ADMIN') ? 'admin' : 'alumno';
        return {
          id: 'LEG-' + c,
          uuid: 'LEG-' + c,
          cedula: c,
          nombre: String(alData[a][1] || '').trim(),
          apellido: String(alData[a][2] || '').trim(),
          email: cvAuthNormalizeEmail(alData[a][3]),
          grado: String(alData[a][4] || '').trim(),
          carrera: carAl,
          seccion: secAl,
          rol: rolCalculado,
          estado: 'activo',
          is_legacy: true
        };
      }
    }
  }
  return null;
}

function cvAuthSanitizeUser(u) {
  if (!u) return null;
  return {
    id: u.id || u.uuid || ('USR-' + u.cedula),
    uuid: u.uuid || u.id || ('USR-' + u.cedula),
    cedula: cvAuthNormalizeCedula(u.cedula),
    nombre: u.nombre || '',
    apellido: u.apellido || '',
    email: u.email || '',
    telefono: u.telefono || '',
    rol: u.rol || 'alumno',
    estado: u.estado || 'activo',
    grado: u.grado || '',
    carrera: u.carrera || '',
    seccion: u.seccion || '',
    foto_url: u.foto_url || '',
    created_at: u.created_at || '',
    updated_at: u.updated_at || '',
    last_login: u.last_login || '',
    must_change_password: u.must_change_password ? 1 : 0
  };
}

function cvAuthRegister(ss, data) {
  data = data || {};
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw new Error('El servidor está ocupado. Intenta nuevamente en unos segundos.');

  try {
    cvAuthEnsureSheets(ss);
    var cedula = cvAuthNormalizeCedula(data.cedula);
    if (!cedula || !/^\d{4,15}$/.test(cedula)) {
      throw new Error('La cédula es obligatoria y debe contener entre 4 y 15 dígitos sin puntos ni espacios.');
    }
    var nombre = cvAuthSanitizeText(data.nombre, 100).toUpperCase();
    var apellido = cvAuthSanitizeText(data.apellido, 100).toUpperCase();
    if (!nombre || !apellido) {
      throw new Error('Nombre y apellido son campos obligatorios.');
    }
    var email = cvAuthNormalizeEmail(data.email);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('El correo electrónico no tiene un formato válido.');
    }
    var password = String(data.password || '');
    if (!password || password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }

    // Comprobar duplicado por cédula
    var existing = cvAuthFindUser(ss, cedula);
    if (existing && !existing.is_legacy) {
      throw new Error('La cédula ' + cedula + ' ya está registrada. Si olvidaste tu contraseña, recupérala.');
    }

    // Comprobar duplicado por correo electrónico
    if (email) {
      var allUsers = cvAuthGetAllUsers(ss);
      var emailDup = allUsers.some(function(u) {
        return cvAuthNormalizeCedula(u.cedula) !== cedula && cvAuthNormalizeEmail(u.email) === email;
      });
      if (emailDup) {
        throw new Error('El correo ' + email + ' ya está registrado para otra cuenta.');
      }
    }

    var rol = String(data.rol || 'alumno').toLowerCase().trim();
    if (['alumno', 'docente', 'admin', 'academico'].indexOf(rol) < 0) rol = 'alumno';
    var estado = (rol === 'docente' && data.requiere_aprobacion) ? 'pendiente' : 'activo';

    var uuid = 'USR-' + Utilities.getUuid();
    var salt = Utilities.getUuid().replace(/-/g, '');
    var hash = cvAuthHash(password, salt);
    var nowIso = new Date().toISOString();
    var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    var expiresIso = new Date(Date.now() + 8 * 3600 * 1000).toISOString();

    var userSheet = ss.getSheetByName('Usuarios');
    var rowData = [
      uuid, uuid, cedula, nombre, apellido, email, cvAuthSanitizeText(data.telefono, 40),
      rol, estado, hash, salt, cvAuthSanitizeText(data.grado, 100), cvAuthSanitizeText(data.carrera, 150),
      cvAuthSanitizeText(data.seccion, 50), cvAuthSanitizeText(data.foto || data.foto_url, 500),
      nowIso, nowIso, nowIso, token, expiresIso
    ];
    userSheet.appendRow(rowData);

    // Sincronizar con RegistroAlumnos y Roles para compatibilidad total con reportes y catálogos
    var alSheet = ss.getSheetByName('RegistroAlumnos');
    if (alSheet) {
      var alData = alSheet.getDataRange().getValues();
      var foundAl = false;
      for (var a = 1; a < alData.length; a++) {
        if (cvAuthNormalizeCedula(alData[a][0]) === cedula) { foundAl = true; break; }
      }
      if (!foundAl) {
        alSheet.appendRow([cedula, nombre, apellido, email, data.grado || '', data.carrera || '', data.seccion || '', nowIso]);
      }
    }

    var rolSheet = ss.getSheetByName('Roles');
    if (rolSheet) {
      var rData = rolSheet.getDataRange().getValues();
      var foundR = false;
      for (var r = 1; r < rData.length; r++) {
        if (cvAuthNormalizeCedula(rData[r][0]) === cedula && String(rData[r][2]).toLowerCase() === rol) {
          foundR = true; break;
        }
      }
      if (!foundR) {
        rolSheet.appendRow([cedula, nombre + ' ' + apellido, rol, data.carrera || '', data.seccion || '', data.asignatura || '', 'activo', nowIso, 'auto-registro']);
      }
    }

    // Registrar sesión activa
    var sesSheet = ss.getSheetByName('Sesiones');
    if (sesSheet) {
      sesSheet.appendRow([token, cedula, rol, nowIso, expiresIso, 'activo', data.ip || '', data.dispositivo || '']);
    }

    try {
      var cache = CacheService.getScriptCache();
      cache.put('cv-session-' + cvDocenteHash(token), JSON.stringify({ cedula: cedula, rol: rol, expires_at: expiresIso }), 21600);
    } catch(cx) {}

    SpreadsheetApp.flush();

    var safeUser = {
      id: uuid, uuid: uuid, cedula: cedula, nombre: nombre, apellido: apellido,
      email: email, telefono: data.telefono || '', rol: rol, estado: estado,
      grado: data.grado || '', carrera: data.carrera || '', seccion: data.seccion || '',
      foto_url: data.foto || data.foto_url || '', created_at: nowIso, updated_at: nowIso,
      roles: [{ rol: rol, carrera: data.carrera || '', seccion: data.seccion || '', estado: 'activo' }]
    };

    return {
      ok: true,
      status: 'Éxito',
      mensaje: 'Usuario registrado correctamente.',
      token: token,
      token_expires: expiresIso,
      user: safeUser
    };
  } finally {
    lock.releaseLock();
  }
}

function cvAuthLogin(ss, data) {
  data = data || {};
  cvAuthEnsureSheets(ss);
  var cedula = cvAuthNormalizeCedula(data.cedula || data.username);
  var password = String(data.password || '').trim();

  if (!cedula || !password) {
    return { ok: false, error: 'Debes ingresar tu cédula y contraseña.' };
  }

  var user = cvAuthFindUser(ss, cedula);
  if (!user) {
    return { ok: false, error: 'Cédula o contraseña incorrecta.' };
  }

  // Estado de cuenta
  var estado = String(user.estado || 'activo').toLowerCase();
  if (estado === 'inactivo') {
    return { ok: false, error: 'Tu cuenta está inactiva. Contacta al administrador.' };
  }
  if (estado === 'bloqueado') {
    return { ok: false, error: 'Tu cuenta ha sido bloqueada por seguridad. Contacta al administrador.' };
  }
  if (estado === 'pendiente') {
    return { ok: false, error: 'Tu solicitud de cuenta está pendiente de aprobación institucional.' };
  }

  // Verificación de credenciales
  var passValid = false;
  var mustChange = false;

  if (user.password_hash && user.salt) {
    var expectedHash = cvAuthHash(password, user.salt);
    passValid = cvDocenteEqual(user.password_hash, expectedHash);
  } else {
    // Cuenta heredada / migración transparente: verificar fórmula institucional
    var n = (user.nombre || '').trim().split(/\s+/)[0] || '';
    var a = (user.apellido || '').trim().split(/\s+/)[0] || '';
    var formula = (n.charAt(0).toUpperCase() + a.charAt(0).toLowerCase() + cedula + '*');
    if (password === formula || password === (cedula + '*')) {
      passValid = true;
      mustChange = true;
    }
  }

  if (!passValid) {
    return { ok: false, error: 'Cédula o contraseña incorrecta.' };
  }

  // Si fue migración heredada exitosa, persistir el hash de inmediato en Usuarios
  var salt = user.salt;
  var hash = user.password_hash;
  if (!salt || !hash) {
    salt = Utilities.getUuid().replace(/-/g, '');
    hash = cvAuthHash(password, salt);
    mustChange = true;
    try {
      var uSheet = ss.getSheetByName('Usuarios');
      var nowIso = new Date().toISOString();
      if (user._row) {
        var hCols = uSheet.getRange(1, 1, 1, uSheet.getLastColumn()).getValues()[0].map(function(x){return String(x).toLowerCase().trim();});
        var colPass = hCols.indexOf('password_hash');
        var colSalt = hCols.indexOf('salt');
        if (colPass >= 0) uSheet.getRange(user._row, colPass + 1).setValue(hash);
        if (colSalt >= 0) uSheet.getRange(user._row, colSalt + 1).setValue(salt);
      } else {
        var rowMig = [
          user.uuid || ('USR-' + cedula), user.uuid || ('USR-' + cedula), cedula,
          user.nombre, user.apellido, user.email || '', user.telefono || '',
          user.rol || 'alumno', 'activo', hash, salt, user.grado || '', user.carrera || '',
          user.seccion || '', '', nowIso, nowIso, nowIso, '', ''
        ];
        uSheet.appendRow(rowMig);
      }
    } catch(mx) {}
  }

  // Generar token seguro
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  var expiresIso = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
  var nowIso = new Date().toISOString();

  // Guardar sesión en Sesiones y Cache
  var sesSheet = ss.getSheetByName('Sesiones');
  if (sesSheet) {
    sesSheet.appendRow([token, cedula, user.rol || 'alumno', nowIso, expiresIso, 'activo', data.ip || '', data.dispositivo || '']);
  }

  try {
    var cache = CacheService.getScriptCache();
    cache.put('cv-session-' + cvDocenteHash(token), JSON.stringify({ cedula: cedula, rol: user.rol || 'alumno', expires_at: expiresIso }), 21600);
  } catch(cx) {}

  // Actualizar LastLogin y Token en Usuarios si está presente
  try {
    if (user._row) {
      var uSheet2 = ss.getSheetByName('Usuarios');
      var hCols2 = uSheet2.getRange(1, 1, 1, uSheet2.getLastColumn()).getValues()[0].map(function(x){return String(x).toLowerCase().trim();});
      var colLog = hCols2.indexOf('last_login');
      var colTok = hCols2.indexOf('token_actual');
      var colExp = hCols2.indexOf('token_expires');
      if (colLog >= 0) uSheet2.getRange(user._row, colLog + 1).setValue(nowIso);
      if (colTok >= 0) uSheet2.getRange(user._row, colTok + 1).setValue(token);
      if (colExp >= 0) uSheet2.getRange(user._row, colExp + 1).setValue(expiresIso);
    }
  } catch(ux) {}

  // Roles activos de la persona
  var rolesActivos = obtenerRoles(ss, cedula);
  if (!rolesActivos || !rolesActivos.length) {
    rolesActivos = [{ cedula: cedula, rol: user.rol || 'alumno', estado: 'activo', carrera: user.carrera || '', seccion: user.seccion || '' }];
  }

  var safeUser = cvAuthSanitizeUser(user);
  safeUser.must_change_password = mustChange ? 1 : 0;
  safeUser.roles = rolesActivos;

  return {
    ok: true,
    status: 'Éxito',
    token: token,
    token_expires: expiresIso,
    user: safeUser
  };
}

function cvAuthValidateSession(ss, data) {
  data = data || {};
  cvAuthEnsureSheets(ss);
  var token = String(data.token || '').trim();
  if (!token) return { ok: false, valid: false, error: 'Token de sesión no proporcionado.' };

  var cedula = '';
  var rol = '';
  var expiresAt = '';

  // 1. Intentar Caché
  try {
    var cache = CacheService.getScriptCache();
    var cachedStr = cache.get('cv-session-' + cvDocenteHash(token));
    if (cachedStr) {
      var cObj = JSON.parse(cachedStr);
      if (new Date(cObj.expires_at) > new Date()) {
        cedula = cObj.cedula;
        rol = cObj.rol;
        expiresAt = cObj.expires_at;
      }
    }
  } catch(cx) {}

  // 2. Si no está en caché, revisar hoja Sesiones
  if (!cedula) {
    var sesSheet = ss.getSheetByName('Sesiones');
    if (sesSheet) {
      var sData = sesSheet.getDataRange().getValues();
      for (var i = sData.length - 1; i >= 1; i--) {
        if (String(sData[i][0]) === token) {
          var st = String(sData[i][5] || 'activo').toLowerCase();
          var exp = new Date(sData[i][4]);
          if (st === 'activo' && exp > new Date()) {
            cedula = cvAuthNormalizeCedula(sData[i][1]);
            rol = String(sData[i][2] || 'alumno');
            expiresAt = exp.toISOString();
            break;
          }
        }
      }
    }
  }

  if (!cedula) {
    return { ok: false, valid: false, error: 'Sesión inválida o expirada. Ingresa nuevamente.' };
  }

  var user = cvAuthFindUser(ss, cedula);
  if (!user || user.estado === 'inactivo' || user.estado === 'bloqueado') {
    return { ok: false, valid: false, error: 'Usuario no disponible o desactivado.' };
  }

  var safe = cvAuthSanitizeUser(user);
  safe.roles = obtenerRoles(ss, cedula);

  return {
    ok: true,
    valid: true,
    cedula: cedula,
    rol: user.rol || rol,
    user: safe
  };
}

function cvAuthLogout(ss, data) {
  data = data || {};
  cvAuthEnsureSheets(ss);
  var token = String(data.token || '').trim();
  if (token) {
    try {
      var cache = CacheService.getScriptCache();
      cache.remove('cv-session-' + cvDocenteHash(token));
    } catch(cx) {}

    var sesSheet = ss.getSheetByName('Sesiones');
    if (sesSheet) {
      var sData = sesSheet.getDataRange().getValues();
      for (var i = 1; i < sData.length; i++) {
        if (String(sData[i][0]) === token) {
          sesSheet.getRange(i + 1, 6).setValue('revocado');
        }
      }
    }
  }
  return { ok: true, status: 'Éxito', mensaje: 'Sesión cerrada exitosamente.' };
}

function cvAuthGetProfile(ss, data) {
  data = data || {};
  cvAuthEnsureSheets(ss);
  var cedula = cvAuthNormalizeCedula(data.cedula);
  if (!cedula && data.token) {
    var ses = cvAuthValidateSession(ss, data);
    if (ses && ses.valid && ses.user) return { ok: true, user: ses.user };
  }
  if (!cedula) return { ok: false, error: 'Cédula no proporcionada.' };
  var user = cvAuthFindUser(ss, cedula);
  if (!user) return { ok: false, error: 'Usuario no encontrado.' };
  var safe = cvAuthSanitizeUser(user);
  safe.roles = obtenerRoles(ss, cedula);
  return { ok: true, user: safe };
}

function cvAuthUpdateProfile(ss, data) {
  data = data || {};
  cvAuthEnsureSheets(ss);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Servidor ocupado. Reintenta en unos momentos.');

  try {
    var cedula = cvAuthNormalizeCedula(data.cedula);
    if (!cedula) throw new Error('Cédula no proporcionada.');
    var user = cvAuthFindUser(ss, cedula);
    if (!user) throw new Error('Usuario no encontrado.');

    // Permitir editar datos personales y académicos: nombre, apellido, email, telefono, foto_url, grado, carrera, seccion, estado
    var nombre = data.nombre !== undefined ? cvAuthSanitizeText(data.nombre, 100).toUpperCase() : user.nombre;
    var apellido = data.apellido !== undefined ? cvAuthSanitizeText(data.apellido, 100).toUpperCase() : user.apellido;
    var email = data.email !== undefined ? cvAuthNormalizeEmail(data.email) : user.email;
    var telefono = data.telefono !== undefined ? cvAuthSanitizeText(data.telefono, 40) : user.telefono;
    var grado = data.grado !== undefined ? cvAuthSanitizeText(data.grado, 80).toUpperCase() : user.grado;
    var carrera = data.carrera !== undefined ? cvAuthSanitizeText(data.carrera, 120).toUpperCase() : user.carrera;
    var seccion = data.seccion !== undefined ? cvAuthSanitizeText(data.seccion, 40).toUpperCase() : user.seccion;
    var estado = data.estado !== undefined ? cvAuthSanitizeText(data.estado, 30).toLowerCase() : (user.estado || 'activo');
    var foto = data.foto || data.foto_url || user.foto_url || '';
    var nowIso = new Date().toISOString();

    if (email && email !== user.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('El correo electrónico no es válido.');
      var allUsers = cvAuthGetAllUsers(ss);
      var emailDup = allUsers.some(function(u) {
        return cvAuthNormalizeCedula(u.cedula) !== cedula && cvAuthNormalizeEmail(u.email) === email;
      });
      if (emailDup) throw new Error('El correo ' + email + ' ya está registrado en otra cuenta.');
    }

    var uSheet = ss.getSheetByName('Usuarios');
    if (user._row) {
      var hCols = uSheet.getRange(1, 1, 1, uSheet.getLastColumn()).getValues()[0].map(function(x){return String(x).toLowerCase().trim();});
      var mapSet = {
        'nombre': nombre, 'apellido': apellido, 'email': email,
        'telefono': telefono, 'grado': grado, 'carrera': carrera,
        'seccion': seccion, 'estado': estado, 'foto_url': foto, 'updated_at': nowIso
      };
      Object.keys(mapSet).forEach(function(k) {
        var idx = hCols.indexOf(k);
        if (idx >= 0) uSheet.getRange(user._row, idx + 1).setValue(mapSet[k]);
      });
    } else {
      var rowNew = [
        user.uuid || ('USR-' + cedula), user.uuid || ('USR-' + cedula), cedula,
        nombre, apellido, email, telefono, user.rol || 'alumno', estado,
        user.password_hash || '', user.salt || '', grado || '', carrera || '',
        seccion || '', foto, nowIso, nowIso, nowIso, '', ''
      ];
      uSheet.appendRow(rowNew);
    }

    // Actualizar también en RegistroAlumnos para consistencia
    var alSheet = ss.getSheetByName('RegistroAlumnos');
    if (alSheet) {
      var alData = alSheet.getDataRange().getValues();
      for (var a = 1; a < alData.length; a++) {
        if (cvAuthNormalizeCedula(alData[a][0]) === cedula) {
          alSheet.getRange(a + 1, 2).setValue(nombre);
          alSheet.getRange(a + 1, 3).setValue(apellido);
          alSheet.getRange(a + 1, 4).setValue(email);
          if (grado) alSheet.getRange(a + 1, 5).setValue(grado);
          if (carrera) alSheet.getRange(a + 1, 6).setValue(carrera);
          if (seccion) alSheet.getRange(a + 1, 7).setValue(seccion);
          break;
        }
      }
    }

    // Actualizar también en Roles si existe
    var rSheet = ss.getSheetByName('Roles');
    if (rSheet) {
      var rData = rSheet.getDataRange().getValues();
      for (var r = 1; r < rData.length; r++) {
        if (cvAuthNormalizeCedula(rData[r][0]) === cedula) {
          if (nombre || apellido) rSheet.getRange(r + 1, 2).setValue((nombre + ' ' + apellido).trim());
          if (carrera) rSheet.getRange(r + 1, 4).setValue(carrera);
          if (seccion) rSheet.getRange(r + 1, 5).setValue(seccion);
          if (estado) rSheet.getRange(r + 1, 7).setValue(estado);
        }
      }
    }

    SpreadsheetApp.flush();

    return {
      ok: true,
      status: 'Éxito',
      mensaje: 'Perfil y expediente actualizados correctamente.',
      user: {
        cedula: cedula,
        nombre: nombre,
        apellido: apellido,
        email: email,
        telefono: telefono,
        grado: grado,
        carrera: carrera,
        seccion: seccion,
        estado: estado,
        foto_url: foto
      }
    };
  } finally {
    lock.releaseLock();
  }
}

function cvAuthChangePassword(ss, data) {
  data = data || {};
  cvAuthEnsureSheets(ss);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Servidor ocupado. Reintenta en unos momentos.');

  try {
    var cedula = cvAuthNormalizeCedula(data.cedula);
    var oldPass = String(data.old_password || data.password_actual || '');
    var newPass = String(data.new_password || data.password_nueva || '');

    if (!cedula) throw new Error('Cédula no proporcionada.');
    if (!oldPass || !newPass) throw new Error('Debes ingresar la contraseña actual y la nueva contraseña.');
    if (newPass.length < 6) throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');

    var user = cvAuthFindUser(ss, cedula);
    if (!user) throw new Error('Usuario no encontrado.');

    // Verificar contraseña actual
    var oldValid = false;
    if (user.password_hash && user.salt) {
      oldValid = cvDocenteEqual(user.password_hash, cvAuthHash(oldPass, user.salt));
    } else {
      var n = (user.nombre || '').trim().split(/\s+/)[0] || '';
      var a = (user.apellido || '').trim().split(/\s+/)[0] || '';
      var formula = (n.charAt(0).toUpperCase() + a.charAt(0).toLowerCase() + cedula + '*');
      oldValid = (oldPass === formula || oldPass === (cedula + '*'));
    }

    if (!oldValid) throw new Error('La contraseña actual es incorrecta.');

    // Generar nuevo salt y hash
    var newSalt = Utilities.getUuid().replace(/-/g, '');
    var newHash = cvAuthHash(newPass, newSalt);
    var nowIso = new Date().toISOString();

    var uSheet = ss.getSheetByName('Usuarios');
    if (user._row) {
      var hCols = uSheet.getRange(1, 1, 1, uSheet.getLastColumn()).getValues()[0].map(function(x){return String(x).toLowerCase().trim();});
      var colPass = hCols.indexOf('password_hash');
      var colSalt = hCols.indexOf('salt');
      var colUpd = hCols.indexOf('updated_at');
      if (colPass >= 0) uSheet.getRange(user._row, colPass + 1).setValue(newHash);
      if (colSalt >= 0) uSheet.getRange(user._row, colSalt + 1).setValue(newSalt);
      if (colUpd >= 0) uSheet.getRange(user._row, colUpd + 1).setValue(nowIso);
    } else {
      var rowNew = [
        user.uuid || ('USR-' + cedula), user.uuid || ('USR-' + cedula), cedula,
        user.nombre, user.apellido, user.email || '', user.telefono || '',
        user.rol || 'alumno', 'activo', newHash, newSalt, user.grado || '', user.carrera || '',
        user.seccion || '', user.foto_url || '', nowIso, nowIso, nowIso, '', ''
      ];
      uSheet.appendRow(rowNew);
    }

    SpreadsheetApp.flush();

    return {
      ok: true,
      status: 'Éxito',
      mensaje: 'Contraseña actualizada correctamente.'
    };
  } finally {
    lock.releaseLock();
  }
}

function cvAuthRecoverAccess(ss, data) {
  data = data || {};
  cvAuthEnsureSheets(ss);
  var cedula = cvAuthNormalizeCedula(data.cedula);
  var email = cvAuthNormalizeEmail(data.email);

  if (!cedula) return { ok: false, error: 'Ingresa tu número de cédula.' };

  var user = cvAuthFindUser(ss, cedula);
  if (!user) {
    return { ok: false, error: 'La cédula ingresada no se encuentra registrada.' };
  }

  if (email && user.email && cvAuthNormalizeEmail(user.email) !== email) {
    return { ok: false, error: 'El correo electrónico no coincide con el registrado para esta cédula.' };
  }

  var targetEmail = email || user.email;
  // Código de 3 letras + 3 números (más fácil de leer y de escribir a mano que 8 caracteres mixtos).
  // Se excluyen letras/números ambiguos (I, O, L, 0, 1).
  var letras = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  var numeros = '23456789';
  var provisoria = '';
  for (var i = 0; i < 3; i++) {
    provisoria += letras.charAt(Math.floor(Math.random() * letras.length));
  }
  for (var i = 0; i < 3; i++) {
    provisoria += numeros.charAt(Math.floor(Math.random() * numeros.length));
  }

  var salt = Utilities.getUuid().replace(/-/g, '');
  var hash = cvAuthHash(provisoria, salt);
  var nowIso = new Date().toISOString();

  var uSheet = ss.getSheetByName('Usuarios');
  if (user._row) {
    var hCols = uSheet.getRange(1, 1, 1, uSheet.getLastColumn()).getValues()[0].map(function(x){return String(x).toLowerCase().trim();});
    var colPass = hCols.indexOf('password_hash');
    var colSalt = hCols.indexOf('salt');
    var colUpd = hCols.indexOf('updated_at');
    if (colPass >= 0) uSheet.getRange(user._row, colPass + 1).setValue(hash);
    if (colSalt >= 0) uSheet.getRange(user._row, colSalt + 1).setValue(salt);
    if (colUpd >= 0) uSheet.getRange(user._row, colUpd + 1).setValue(nowIso);
  } else {
    var rowNew = [
      user.uuid || ('USR-' + cedula), user.uuid || ('USR-' + cedula), cedula,
      user.nombre, user.apellido, user.email || targetEmail || '', user.telefono || '',
      user.rol || 'alumno', 'activo', hash, salt, user.grado || '', user.carrera || '',
      user.seccion || '', user.foto_url || '', nowIso, nowIso, nowIso, '', ''
    ];
    uSheet.appendRow(rowNew);
  }

  SpreadsheetApp.flush();

  var enviado = false;
  if (targetEmail) {
    try {
      var r = enviarProvisoria(ss, { email: targetEmail, nombre: user.nombre, password: provisoria });
      enviado = !!(r && r.ok);
    } catch(ex) { enviado = false; }
  }

  if (enviado) {
    return {
      ok: true,
      status: 'Éxito',
      enviado: true,
      mensaje: 'Te enviamos un código de acceso a tu correo registrado (' + targetEmail.slice(0, 3) + '***). Ingresá con ese código y el sistema te va a pedir que lo cambies.'
    };
  } else {
    return {
      ok: true,
      status: 'Éxito',
      enviado: false,
      mensaje: 'Se ha restablecido tu acceso, pero no pudimos enviarte el código por correo. Comunícate con Secretaría Académica para obtenerlo.'
    };
  }
}

function cvAlumnosPorCarreraSeccion(ss, carrera, seccion) {
  var list = [];
  var seen = {};
  carrera = String(carrera || '').toLowerCase().trim();
  seccion = String(seccion || '').toLowerCase().trim();

  var uSheet = ss.getSheetByName('Usuarios');
  if (uSheet && uSheet.getLastRow() > 1) {
    var uData = uSheet.getDataRange().getValues();
    var h = uData[0].map(function(x) { return String(x).toLowerCase().trim(); });
    var colCed = h.indexOf('cedula');
    var colNom = h.indexOf('nombre');
    var colApe = h.indexOf('apellido');
    var colCar = h.indexOf('carrera');
    var colSec = h.indexOf('seccion');
    var colRol = h.indexOf('rol');
    var colEst = h.indexOf('estado');

    for (var i = 1; i < uData.length; i++) {
      var r = uData[i];
      var ced = cvAuthNormalizeCedula(r[colCed]);
      if (!ced || seen[ced]) continue;
      var rol = colRol >= 0 ? String(r[colRol]).toLowerCase().trim() : 'alumno';
      if (rol !== 'alumno') continue;
      var est = colEst >= 0 ? String(r[colEst]).toLowerCase().trim() : 'activo';
      if (est === 'inactivo' || est === 'bloqueado') continue;
      var uCar = colCar >= 0 ? String(r[colCar]).toLowerCase().trim() : '';
      var uSec = colSec >= 0 ? String(r[colSec]).toLowerCase().trim() : '';
      if (carrera && uCar && uCar !== carrera) continue;
      if (seccion && uSec && uSec !== seccion) continue;

      seen[ced] = true;
      var nom = colNom >= 0 ? String(r[colNom] || '') : '';
      var ape = colApe >= 0 ? String(r[colApe] || '') : '';
      list.push({
        id: ced,
        cedula: ced,
        nombre: (nom + ' ' + ape).trim() || nom,
        nombre_completo: (nom + ' ' + ape).trim() || nom,
        carrera: colCar >= 0 ? r[colCar] : '',
        seccion: colSec >= 0 ? r[colSec] : '',
        rol: 'alumno'
      });
    }
  }

  var alSheet = ss.getSheetByName('RegistroAlumnos');
  if (alSheet && alSheet.getLastRow() > 1) {
    var alData = alSheet.getDataRange().getValues();
    for (var j = 1; j < alData.length; j++) {
      var rAl = alData[j];
      var cedAl = cvAuthNormalizeCedula(rAl[0]);
      if (!cedAl || seen[cedAl]) continue;
      var carAl = String(rAl[5] || '').toLowerCase().trim();
      var secAl = String(rAl[6] || '').toLowerCase().trim();
      if (carrera && carAl && carAl !== carrera) continue;
      if (seccion && secAl && secAl !== seccion) continue;

      seen[cedAl] = true;
      var nAl = String(rAl[1] || '').trim();
      var aAl = String(rAl[2] || '').trim();
      list.push({
        id: cedAl,
        cedula: cedAl,
        nombre: (nAl + ' ' + aAl).trim() || nAl,
        nombre_completo: (nAl + ' ' + aAl).trim() || nAl,
        carrera: rAl[5] || '',
        seccion: rAl[6] || '',
        rol: 'alumno'
      });
    }
  }

  return { ok: true, status: 'Éxito', alumnos: list, data: list };
}

function cvListarUsuarios(ss) {
  var raw = cvAuthGetAllUsers(ss);
  var list = raw.map(function(u) {
    var s = cvAuthSanitizeUser(u);
    s.roles = [{ rol: s.rol || 'alumno', carrera: s.carrera || '', seccion: s.seccion || '' }];
    return s;
  });
  return { ok: true, status: 'Éxito', usuarios: list, data: list };
}

function cvListarNotas(ss, cedula, asignatura) {
  var sheetNotas = ss.getSheetByName('Notas');
  if (!sheetNotas) return { ok: true, data: [] };
  var dataNotas = sheetNotas.getDataRange().getValues();
  var list = [];
  var cFiltro = cvAuthNormalizeCedula(cedula);
  var aFiltro = String(asignatura || '').toLowerCase().trim();

  for (var j = 1; j < dataNotas.length; j++) {
    var row = dataNotas[j];
    var c = cvAuthNormalizeCedula(row[0]);
    if (!c) continue;
    if (cFiltro && c !== cFiltro) continue;
    var asig = String(row[6] || '').toLowerCase().trim();
    if (aFiltro && asig && asig !== aFiltro) continue;

    list.push({
      cedula: c,
      nombre: row[1] || '',
      asistencia: row[2] || 0,
      parcial1: row[3] || 0,
      parcial2: row[4] || 0,
      final: row[5] || 0,
      asignatura: row[6] || '',
      carrera: row[7] || '',
      seccion: row[8] || ''
    });
  }
  return { ok: true, data: list };
}

function cvGuardarNotasAsignatura(ss, data) {
  data = data || {};
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Servidor ocupado. Intenta de nuevo.');

  try {
    var sheetNotas = ss.getSheetByName('Notas');
    if (!sheetNotas) {
      sheetNotas = ss.insertSheet('Notas');
      sheetNotas.appendRow(['Cédula', 'Nombre', 'Asistencia', 'Parcial1', 'Parcial2', 'Final', 'Asignatura', 'Carrera', 'Sección']);
    }

    var notas = data.notas || data.grades || data.alumnos || [];
    var asig = data.asignatura || data.subject || '';
    var car = data.carrera || '';
    var sec = data.seccion || '';

    if (!Array.isArray(notas) && typeof notas === 'object') {
      var arr = [];
      Object.keys(notas).forEach(function(c) {
        var item = notas[c];
        item.cedula = c;
        arr.push(item);
      });
      notas = arr;
    }

    var existingData = sheetNotas.getDataRange().getValues();
    var rowMap = {};
    for (var i = 1; i < existingData.length; i++) {
      var k = cvAuthNormalizeCedula(existingData[i][0]) + '_' + String(existingData[i][6] || '').toLowerCase().trim();
      rowMap[k] = i + 1;
    }

    notas.forEach(function(n) {
      var ced = cvAuthNormalizeCedula(n.cedula);
      if (!ced) return;
      var a = String(n.asignatura || asig || '').toLowerCase().trim();
      var key = ced + '_' + a;
      var p1 = n.parcial1 !== undefined ? n.parcial1 : '';
      var p2 = n.parcial2 !== undefined ? n.parcial2 : '';
      var fin = n.final !== undefined ? n.final : '';
      var asist = n.asistencia !== undefined ? n.asistencia : '';

      if (rowMap[key]) {
        var rIdx = rowMap[key];
        if (asist !== '') sheetNotas.getRange(rIdx, 3).setValue(asist);
        if (p1 !== '') sheetNotas.getRange(rIdx, 4).setValue(p1);
        if (p2 !== '') sheetNotas.getRange(rIdx, 5).setValue(p2);
        if (fin !== '') sheetNotas.getRange(rIdx, 6).setValue(fin);
      } else {
        sheetNotas.appendRow([
          ced, n.nombre || '', asist || 0, p1 || 0, p2 || 0, fin || 0,
          n.asignatura || asig, n.carrera || car, n.seccion || sec
        ]);
        rowMap[key] = sheetNotas.getLastRow();
      }
    });

    SpreadsheetApp.flush();
    return { ok: true, status: 'Éxito', mensaje: 'Calificaciones guardadas correctamente.' };
  } finally {
    lock.releaseLock();
  }
}

function cvGuardarRespuestasExamen(ss, data) {
  data = data || {};
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Servidor ocupado. Intenta de nuevo.');

  try {
    var sheetResp = ss.getSheetByName('RespuestasExamen');
    if (!sheetResp) {
      sheetResp = ss.insertSheet('RespuestasExamen');
      sheetResp.appendRow(['Fecha', 'Cedula', 'Nombre', 'Asignatura', 'Evaluacion', 'Indicador', 'Pregunta', 'RespuestaTexto', 'Correcta', 'Puntaje']);
      sheetResp.setFrozenRows(1);
    }

    var cedula = String(data.cedula || '').trim();
    if (!cedula) throw new Error('Falta la cedula del alumno.');
    var nombre = data.nombre || '';
    var asignatura = data.asignatura || '';
    var evaluacion = data.evaluacion || '';
    var respuestas = data.respuestas || [];
    if (!Array.isArray(respuestas)) throw new Error('El formato de respuestas es invalido.');

    var nowIso = new Date().toISOString();
    var filas = respuestas.map(function(r) {
      return [
        nowIso, cedula, nombre, asignatura, evaluacion,
        r.indicador || '', r.pregunta || '', r.respuesta || '',
        r.correcta ? 'Si' : 'No', r.puntaje || 0
      ];
    });

    if (filas.length > 0) {
      sheetResp.getRange(sheetResp.getLastRow() + 1, 1, filas.length, filas[0].length).setValues(filas);
    }

    SpreadsheetApp.flush();
    return { ok: true, status: 'Exito', mensaje: 'Respuestas registradas correctamente.', total: filas.length };
  } finally {
    lock.releaseLock();
  }
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
    // v08.5.7: no distingue mayúsculas ("Activo", "ACTIVO"); solo se omiten las marcadas como inactivas
    if (['inactivo', 'inactiva', 'baja', 'false', 'no', '0'].indexOf(String(est).toLowerCase().trim()) >= 0) continue;
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
  var HEADERS = ['ID', 'UUID', 'Nombre', 'Codigo', 'Carrera', 'Grado', 'Semestre', 'Modulo',
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
      case 'Modulo': return data.modulo || '';
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
        registrado_por: data[i][7] || '',
        factura: data[i][8] || '',
        tipo: data[i][9] || 'modulo'
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
      'Observaciones', 'CreatedAt', 'UpdatedAt', 'Nacionalidad', 'EstadoCivil',
      'DepartamentoCodigo', 'CiudadCodigo', 'BarrioCodigo'
    ]);
  } else {
    // v08.4.2: hojas existentes reciben las columnas nuevas al final (no se mueve ninguna columna)
    var _nuevas = ['Nacionalidad', 'EstadoCivil', 'DepartamentoCodigo', 'CiudadCodigo', 'BarrioCodigo'];
    var _cabs = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    for (var n = 0; n < _nuevas.length; n++) {
      if (_cabs.indexOf(_nuevas[n]) === -1) { sheet.getRange(1, 40 + n).setValue(_nuevas[n]); }
    }
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
    data.observaciones || '', ts, ts,
    data.nacionalidad || '', data.estado_civil || '',
    data.departamento_codigo || '', data.ciudad_codigo || '', data.barrio_codigo || ''
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
  // v08.5.7: una fila vale si tiene ID, Código o Nombre (las filas cargadas a mano o por guardarAsignaturaDrive pueden no traer ID:
  // antes se descartaban y el alumno veía «0 asignaturas»). Además de la clave tal cual, se entrega una en minúscula sin tildes
  // ("Código" → "codigo") para que el frontend encuentre la columna aunque el encabezado varíe.
  var iCod = -1, iNom = -1;
  for (var h = 0; h < headers.length; h++) {
    var kh = _catNorm(headers[h]);
    if (kh === 'codigo' && iCod < 0) iCod = h;
    if (kh === 'nombre' && iNom < 0) iNom = h;
  }

  for (var i = 1; i < data.length; i++) {
    var vacia = !data[i][0] && !(iCod >= 0 && data[i][iCod]) && !(iNom >= 0 && data[i][iNom]);
    if (!vacia) {
      var asig = {};
      for (var j = 0; j < headers.length; j++) {
        asig[headers[j]] = data[i][j];
        var kn = _catNorm(headers[j]);
        if (kn && asig[kn] === undefined) asig[kn] = data[i][j];
      }
      asignaturas.push(asig);
    }
  }
  return asignaturas;
}

// Lee una hoja de catálogo y devuelve [{nombre, codigo, grado, carrera}] (v06.5)
// ── Catálogos simples (Grados / Carreras / Secciones) ─────────────────────────
// Tolerante con la planilla: encabezados sin distinguir mayúsculas/tildes ("codigo", "Código",
// "CODIGO"), nombre de pestaña sin distinguir mayúsculas/singular ("Seccion"), y si falta la
// columna Nombre se usa Codigo (y al revés). Solo se omite la fila si NO tiene ni nombre ni código.
var CV_SECCIONES_GID = 626602208; // pestaña de la planilla con las secciones (respaldo si "Secciones" no da filas)

function _catNorm(v) {
  return String(v == null ? '' : v).trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function _catHoja(ss, nombreHoja) {
  var exacta = ss.getSheetByName(nombreHoja);
  if (exacta) return exacta;
  var want = _catNorm(nombreHoja), sing = want.replace(/(es|s)$/, '');
  var hojas = ss.getSheets();
  for (var i = 0; i < hojas.length; i++) {
    var n = _catNorm(hojas[i].getName());
    if (n === want || n === sing) return hojas[i];
  }
  return null;
}

function _catLeer(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getDataRange().getValues();
  var idx = {};
  for (var j = 0; j < data[0].length; j++) {
    var k = _catNorm(data[0][j]);
    if (k && idx[k] === undefined) idx[k] = j;
  }
  function col(row, nombres) {
    for (var n = 0; n < nombres.length; n++) {
      if (idx[nombres[n]] !== undefined) return row[idx[nombres[n]]];
    }
    return '';
  }
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var nombre = String(col(row, ['nombre', 'seccion', 'descripcion']) || '').trim();
    var codigo = String(col(row, ['codigo', 'cod', 'code']) || '').trim();
    if (!nombre && !codigo) continue;
    if (!nombre) nombre = codigo;
    var act = col(row, ['activo', 'estado']);
    var off = act === false || act === 0 || act === '0' ||
      ['false', 'no', 'inactivo', 'inactiva'].indexOf(_catNorm(act)) >= 0;
    if (off) continue;
    out.push({
      nombre: nombre,
      codigo: codigo,
      grado: String(col(row, ['grado']) || '').trim(),
      carrera: String(col(row, ['carrera']) || '').trim()
    });
  }
  return out;
}

function listarCatalogoSimple(ss, nombreHoja) {
  var out = _catLeer(_catHoja(ss, nombreHoja));
  if (!out.length && nombreHoja === 'Secciones') {
    var hojas = ss.getSheets();
    for (var i = 0; i < hojas.length; i++) {
      if (hojas[i].getSheetId() === CV_SECCIONES_GID) { out = _catLeer(hojas[i]); break; }
    }
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
// v06: FOTOS DE PERFIL EN ALMACENAMIENTO CLOUD
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

// Justificación de ausencia del alumno (v06.10). Hoja JustificacionesTIC.
function guardarJustificacion(ss, data) {
  var cedula = (data.cedula || '').toString().trim();
  var fecha = (data.fechaAusencia || data.fecha || '').toString().trim();
  var motivo = (data.motivo || '').toString().trim();
  if (!cedula || !fecha || !motivo) return { ok: false, error: 'Faltan datos' };
  var sheet = ss.getSheetByName('JustificacionesTIC');
  if (!sheet) {
    sheet = ss.insertSheet('JustificacionesTIC');
    sheet.appendRow(['Fecha', 'Cédula', 'Nombre', 'Motivo', 'Observacion', 'Estado', 'IP']);
  } else {
    var h = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var need = ['Nombre', 'Observacion', 'Estado', 'IP'];
    for (var k = 0; k < need.length; k++) {
      if (h.indexOf(need[k]) < 0) sheet.getRange(1, sheet.getLastColumn() + 1).setValue(need[k]);
    }
  }
  sheet.appendRow([fecha, cedula, data.nombre || '', motivo,
    data.observacion || '', 'Pendiente', data.ip || '']);
  return { ok: true };
}

function misJustificaciones(ss, cedula) {
  cedula = (cedula || '').toString().trim();
  var sheet = ss.getSheetByName('JustificacionesTIC');
  if (!sheet || !cedula) return [];
  var data = sheet.getDataRange().getValues();
  var out = [];
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][1].toString() === cedula) {
      out.push({ Fecha: data[i][0] || '', Motivo: data[i][3] || '', Estado: data[i][5] || 'Pendiente', MarcaTemporal: data[i][0] || '' });
    }
  }
  return out;
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
    var textoPlano = 'Hola ' + nombre + ',\n\n' +
      'Recibimos una solicitud para restablecer tu acceso al Campus Virtual.\n\n' +
      'Tu código de acceso es: ' + pass + '\n\n' +
      'Ingresá con tu cédula y este código como contraseña. Por seguridad, el sistema te va a pedir que lo cambies apenas entres.\n\n' +
      'Si no solicitaste este cambio, comunicate con Secretaría Académica.\n\n' +
      rnombre;

    var htmlBody = '' +
      '<div style="font-family:Arial,Helvetica,sans-serif;max-width:440px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0">' +
      '<h2 style="color:#0f172a;margin:0 0 12px;font-size:18px">Hola ' + nombre + ',</h2>' +
      '<p style="color:#334155;font-size:14px;line-height:1.5;margin:0 0 18px">Recibimos una solicitud para restablecer tu acceso al <strong>Campus Virtual</strong> del Instituto Superior Centuria. Usá este código para ingresar:</p>' +
      '<div style="background:#007A33;color:#ffffff;text-align:center;padding:20px 10px;border-radius:12px;margin:0 0 18px">' +
      '<span style="font-family:\'Courier New\',Courier,monospace;font-size:30px;font-weight:bold;letter-spacing:8px;user-select:all">' + pass + '</span>' +
      '</div>' +
      '<p style="color:#334155;font-size:13px;line-height:1.5;margin:0 0 6px">Tocá el código para seleccionarlo y copiarlo. Ingresá con tu cédula y ese código como contraseña — el sistema te va a pedir que lo cambies apenas entres.</p>' +
      '<p style="color:#64748b;font-size:12px;line-height:1.5;margin:18px 0 0">Si no solicitaste este cambio, comunicate con Secretaría Académica.</p>' +
      '<p style="color:#94a3b8;font-size:11px;margin:20px 0 0;padding-top:12px;border-top:1px solid #e2e8f0">' + rnombre + '</p>' +
      '</div>';

    var opts = {
      to: email,
      subject: 'Tu código de acceso - ' + rnombre,
      body: textoPlano,
      htmlBody: htmlBody
    };
    if (remitente) { opts.replyTo = remitente; opts.name = rnombre; }
    MailApp.sendEmail(opts);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}

function diagnosticoSheets(ss) {
  var nombres = ['Usuarios', 'Sesiones', 'RegistroAlumnos', 'Roles', 'Matriculaciones', 'FormulariosCarrera',
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
// v06.3: INICIALIZACIÓN DE BASE DE DATOS CLOUD
// Crea todas las hojas requeridas con cabeceras correctas.
// Ejecutar UNA VEZ desde el editor (▶ inicializarBaseDatos) tras publicar.
// ═══════════════════════════════════════════════════════════════

function inicializarBaseDatos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var creadas = [];

  // 0. Usuarios y Sesiones (v08: gestión central de usuarios, credenciales protegidas y sesiones)
  asegurarHoja(ss, 'Usuarios', CV_USUARIOS_HEADERS, creadas);
  asegurarHoja(ss, 'Sesiones', CV_SESIONES_HEADERS, creadas);

  // 1. RegistroAlumnos (v06.10: + FechaHora de registro)
  asegurarHoja(ss, 'RegistroAlumnos', ['Cédula', 'Nombre', 'Apellido', 'Email', 'Grado', 'Carrera', 'Sección', 'FechaHora'], creadas);

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
  asegurarHoja(ss, 'Matriculaciones', ['ID', 'UUID', 'UserId', 'CodigoFormulario', 'LegajoNumero', 'FechaInscripcion', 'Nombres', 'Apellidos', 'Cedula', 'LugarNacimiento', 'FechaNacimiento', 'Pais', 'Direccion', 'Ciudad', 'Departamento', 'BarrioCompania', 'TelefonoFijo', 'TelefonoMovil', 'CorreoElectronico', 'TituloBachiller', 'InstitucionOrigen', 'CiudadPaisEstudio', 'AnioPromocion', 'Semestre', 'Carrera', 'TipoAlumno', 'MatriculaGuaranies', 'Mensualidad', 'PlanPago', 'AsignaturasPendientes', 'SemestresPendientes', 'InformacionAdicional', 'AceptaDeclaracion', 'Firma', 'Estado', 'RegistradoPor', 'Observaciones', 'CreatedAt', 'UpdatedAt', 'Nacionalidad', 'EstadoCivil', 'DepartamentoCodigo', 'CiudadCodigo', 'BarrioCodigo'], creadas);

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
  asegurarHoja(ss, 'Asistencias', ['Fecha/Hora', 'Cédula', 'Unidad/Lugar', 'Observación', 'IP', 'Dispositivo'], creadas);

  // 18. JustificacionesTIC
  asegurarHoja(ss, 'JustificacionesTIC', ['Fecha', 'Cédula', 'Nombre', 'Motivo', 'Observacion', 'Estado', 'IP'], creadas);

  // 19. ProgresoUnidades
  asegurarHoja(ss, 'ProgresoUnidades', ['Fecha/Hora', 'Cédula', 'Unidad', 'Sección', 'Estado'], creadas);

  // 20. ProgresoDetalle
  asegurarHoja(ss, 'ProgresoDetalle', ['Fecha/Hora', 'Cédula', 'Unidad', 'Sección', 'Leído', 'Página'], creadas);

  // 21. Notas
  asegurarHoja(ss, 'Notas', ['Cédula', 'Nombre', 'Asistencia', 'Parcial1', 'Parcial2', 'Final'], creadas);

  // 22. Pagos (v06.9: + Factura y Tipo al final)
  asegurarHoja(ss, 'Pagos', ['Cédula', 'Nombre', 'Módulo', 'Monto', 'Fecha', 'Estado', 'Comprobante', 'RegistradoPor', 'Factura', 'Tipo'], creadas);

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
    ['RegistroAlumnos', ['Cédula', 'Nombre', 'Apellido', 'Email', 'Grado', 'Carrera', 'Sección', 'FechaHora']],
    ['Roles', ['Cédula', 'Nombre', 'Rol', 'Carrera', 'Sección', 'Asignatura', 'Estado', 'FechaAsignación', 'AsignadoPor']],
    ['Asignaturas', ['ID', 'UUID', 'Nombre', 'Codigo', 'Carrera', 'Grado', 'Semestre', 'Modulo', 'CargaHoraria', 'Color', 'Icono', 'Estado', 'CreatedAt', 'UpdatedAt']],
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
    ['Pagos', ['Cédula', 'Nombre', 'Módulo', 'Monto', 'Fecha', 'Estado', 'Comprobante', 'RegistradoPor', 'Factura', 'Tipo']],
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

// ══════════════════════════════════════════════════════════════
// v07.1 CONSTRUCTOR ACADÉMICO DE ASIGNATURAS (hojas propias, no toca producción)
// ══════════════════════════════════════════════════════════════
var CT_SHEETS = {
  SubjectDrafts: ['ID', 'Codigo', 'Nombre', 'Carrera', 'Grado', 'Semestre', 'Modalidad', 'CargaHoraria', 'DocenteCedula', 'Estado', 'Version', 'CreatedAt', 'UpdatedAt', 'DeletedAt'],
  Programs: ['ID', 'SubjectID', 'Fundamentacion', 'ObjetivoGeneral', 'ObjetivosEspecificos', 'Competencias', 'Capacidades', 'Metodologia', 'Requisitos', 'Bibliografia', 'CreatedAt', 'UpdatedAt'],
  Units: ['ID', 'SubjectID', 'Numero', 'Titulo', 'Resumen', 'Objetivos', 'Indicadores', 'DuracionMin', 'Estado', 'FechaPublicacion', 'Orden', 'CreatedAt', 'UpdatedAt', 'DeletedAt'],
  Blocks: ['ID', 'UnitID', 'Tipo', 'Titulo', 'Contenido', 'Orden', 'Visible', 'CreatedAt', 'UpdatedAt', 'DeletedAt'],
  Activities: ['ID', 'SubjectID', 'UnitID', 'Titulo', 'Instrucciones', 'Objetivo', 'Puntaje', 'Rubrica', 'FechaEntrega', 'PermiteTardia', 'TiposArchivo', 'TamMaxMB', 'Modalidad', 'Estado', 'Retroalimentacion', 'CreatedAt', 'UpdatedAt', 'DeletedAt'],
  Evaluations: ['ID', 'SubjectID', 'Nombre', 'Tipo', 'PuntajeMax', 'Ponderacion', 'FechaApertura', 'FechaCierre', 'DuracionMin', 'IntentosMax', 'Modalidad', 'Aleatorizar', 'PublicarResultados', 'Estado', 'CreatedAt', 'UpdatedAt', 'DeletedAt'],
  QuestionBank: ['ID', 'SubjectID', 'UnitID', 'Tipo', 'Pregunta', 'OpcionesJson', 'Correcta', 'Indicador', 'Dificultad', 'Puntaje', 'Retroalimentacion', 'Estado', 'CreatedAt', 'UpdatedAt', 'DeletedAt'],
  Reviews: ['ID', 'SubjectID', 'DeEstado', 'AEstado', 'PorRol', 'PorCedula', 'Comentario', 'CreatedAt']
};
var CT_ESTADOS = ['borrador', 'en_revision', 'observado', 'corregido', 'aprobado', 'publicado', 'archivado'];

function ctSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(CT_SHEETS[name]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function ctHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function ctNewId(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 6);
}

function ctRowToObj(headers, row) {
  var o = {};
  for (var j = 0; j < headers.length; j++) o[headers[j]] = row[j];
  return o;
}

function ctUpsert(ss, name, id, obj) {
  var sheet = ctSheet(ss, name);
  var headers = ctHeaders(sheet);
  var idx = {};
  for (var j = 0; j < headers.length; j++) idx[headers[j]] = j;
  var ts = new Date().toISOString();
  var vals = sheet.getDataRange().getValues();
  var row = -1;
  if (id) {
    for (var i = 1; i < vals.length; i++) {
      if (String(vals[i][idx['ID']]) === String(id)) { row = i + 1; break; }
    }
  }
  if (!id) id = ctNewId(name.substr(0, 4).toUpperCase());
  var fila = headers.map(function (h) {
    if (h === 'ID') return id;
    if (h === 'CreatedAt') return (row > 0 && vals[row - 1][idx[h]]) ? vals[row - 1][idx[h]] : ts;
    if (h === 'UpdatedAt') return ts;
    if (obj && obj[h] !== undefined) return obj[h];
    return (row > 0) ? vals[row - 1][idx[h]] : '';
  });
  if (row > 0) sheet.getRange(row, 1, 1, headers.length).setValues([fila]);
  else sheet.appendRow(fila);
  return id;
}

function ctList(ss, name, filter) {
  var sheet = ctSheet(ss, name);
  var headers = ctHeaders(sheet);
  var vals = sheet.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < vals.length; i++) {
    var o = ctRowToObj(headers, vals[i]);
    if (o.DeletedAt) continue;
    var ok = true;
    if (filter) {
      for (var k in filter) {
        if (filter[k] !== '' && String(o[k]) !== String(filter[k])) { ok = false; break; }
      }
    }
    if (ok) out.push(o);
  }
  return out;
}

function ctGet(ss, name, id) {
  var list = ctList(ss, name, { ID: id });
  return list.length ? list[0] : null;
}

function ctBorradoLogico(ss, name, id) {
  var sheet = ctSheet(ss, name);
  var headers = ctHeaders(sheet);
  if (headers.indexOf('DeletedAt') < 0) return false;
  var vals = sheet.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(id)) {
      sheet.getRange(i + 1, headers.indexOf('DeletedAt') + 1).setValue(new Date().toISOString());
      sheet.getRange(i + 1, headers.indexOf('UpdatedAt') + 1).setValue(new Date().toISOString());
      return true;
    }
  }
  return false;
}

function ctSetEstado(ss, name, id, estado) {
  var sheet = ctSheet(ss, name);
  var headers = ctHeaders(sheet);
  var vals = sheet.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(id)) {
      sheet.getRange(i + 1, headers.indexOf('Estado') + 1).setValue(estado);
      sheet.getRange(i + 1, headers.indexOf('UpdatedAt') + 1).setValue(new Date().toISOString());
      return true;
    }
  }
  return false;
}

function ctSumaPonderacion(ss, subjectID, excludeId) {
  var evs = ctList(ss, 'Evaluations', { SubjectID: subjectID });
  var s = 0;
  for (var i = 0; i < evs.length; i++) {
    if (excludeId && String(evs[i].ID) === String(excludeId)) continue;
    s += parseFloat(evs[i].Ponderacion) || 0;
  }
  return s;
}

function ctReview(ss, subjectID, deEstado, aEstado, porRol, porCedula, comentario) {
  var sheet = ctSheet(ss, 'Reviews');
  sheet.appendRow([ctNewId('REV'), subjectID, deEstado, aEstado, porRol || '', porCedula || '',
    comentario || '', new Date().toISOString()]);
}

// ── Lectura ──
function ctRead(ss, action, p) {
  p = p || {};
  if (action === 'constructor_list_drafts') {
    var f = {};
    if (p.estado) f.Estado = p.estado;
    if (p.carrera) f.Carrera = p.carrera;
    if (p.docente) f.DocenteCedula = p.docente;
    return { ok: true, drafts: ctList(ss, 'SubjectDrafts', f) };
  }
  if (action === 'constructor_get_subject') {
    var id = p.id || '';
    var draft = ctGet(ss, 'SubjectDrafts', id);
    if (!draft) return { ok: false, error: 'Asignatura no encontrada' };
    var units = ctList(ss, 'Units', { SubjectID: id });
    units.sort(function (a, b) { return (parseFloat(a.Orden) || 0) - (parseFloat(b.Orden) || 0); });
    for (var i = 0; i < units.length; i++) {
      var blocks = ctList(ss, 'Blocks', { UnitID: units[i].ID });
      blocks.sort(function (a, b) { return (parseFloat(a.Orden) || 0) - (parseFloat(b.Orden) || 0); });
      units[i].blocks = blocks;
    }
    return {
      ok: true,
      draft: draft,
      program: ctList(ss, 'Programs', { SubjectID: id })[0] || null,
      units: units,
      activities: ctList(ss, 'Activities', { SubjectID: id }),
      evaluations: ctList(ss, 'Evaluations', { SubjectID: id }),
      reviews: ctList(ss, 'Reviews', { SubjectID: id })
    };
  }
  if (action === 'constructor_list_bank') {
    var fb = {};
    if (p.subjectID) fb.SubjectID = p.subjectID;
    if (p.unitID) fb.UnitID = p.unitID;
    if (p.tipo) fb.Tipo = p.tipo;
    var all = ctList(ss, 'QuestionBank', fb);
    // Nunca exponer la correcta en listados
    return {
      ok: true,
      questions: all.map(function (q) {
        return { ID: q.ID, SubjectID: q.SubjectID, UnitID: q.UnitID, Tipo: q.Tipo, Pregunta: q.Pregunta,
          OpcionesJson: q.OpcionesJson, Indicador: q.Indicador, Dificultad: q.Dificultad,
          Puntaje: q.Puntaje, Retroalimentacion: q.Retroalimentacion, Estado: q.Estado };
      })
    };
  }
  if (action === 'constructor_list_reviews') {
    return { ok: true, reviews: ctList(ss, 'Reviews', p.subjectID ? { SubjectID: p.subjectID } : null) };
  }
  return { ok: false, error: 'Acción no válida' };
}

// ── Escritura ──
function ctWrite(ss, data) {
  var a = data.action;
  var ts = new Date().toISOString();

  if (a === 'constructor_save_draft') {
    if (!data.nombre) return { ok: false, error: 'Falta nombre' };
    var id = ctUpsert(ss, 'SubjectDrafts', data.id || '', {
      Codigo: data.codigo || '', Nombre: data.nombre || '', Carrera: data.carrera || '',
      Grado: data.grado || '', Semestre: data.semestre || '', Modalidad: data.modalidad || '',
      CargaHoraria: data.carga_horaria || 0, DocenteCedula: data.docente_cedula || '',
      Estado: data.estado || 'borrador', Version: data.version || 1
    });
    return { ok: true, id: id };
  }

  if (a === 'constructor_save_program') {
    if (!data.subjectID) return { ok: false, error: 'Falta subjectID' };
    var ex = ctList(ss, 'Programs', { SubjectID: data.subjectID })[0];
    var pid = ctUpsert(ss, 'Programs', ex ? ex.ID : '', {
      SubjectID: data.subjectID, Fundamentacion: data.fundamentacion || '',
      ObjetivoGeneral: data.objetivo_general || '', ObjetivosEspecificos: data.objetivos_especificos || '',
      Competencias: data.competencias || '', Capacidades: data.capacidades || '',
      Metodologia: data.metodologia || '', Requisitos: data.requisitos || '',
      Bibliografia: data.bibliografia || ''
    });
    return { ok: true, id: pid };
  }

  if (a === 'constructor_save_unit') {
    if (!data.subjectID || !data.titulo) return { ok: false, error: 'Faltan datos' };
    var uid = ctUpsert(ss, 'Units', data.id || '', {
      SubjectID: data.subjectID, Numero: data.numero || '', Titulo: data.titulo || '',
      Resumen: data.resumen || '', Objetivos: data.objetivos || '', Indicadores: data.indicadores || '',
      DuracionMin: data.duracion_min || 0, Estado: data.estado || 'borrador',
      FechaPublicacion: data.fecha_publicacion || '', Orden: data.orden || 0
    });
    return { ok: true, id: uid };
  }

  if (a === 'constructor_delete_unit') {
    if (!data.id) return { ok: false, error: 'Falta id' };
    return { ok: ctBorradoLogico(ss, 'Units', data.id) };
  }

  if (a === 'constructor_save_block') {
    if (!data.unitID || !data.tipo) return { ok: false, error: 'Faltan datos' };
    var bid = ctUpsert(ss, 'Blocks', data.id || '', {
      UnitID: data.unitID, Tipo: data.tipo, Titulo: data.titulo || '',
      Contenido: data.contenido || '', Orden: data.orden || 0,
      Visible: data.visible === false ? false : true
    });
    return { ok: true, id: bid };
  }

  if (a === 'constructor_delete_block') {
    if (!data.id) return { ok: false, error: 'Falta id' };
    return { ok: ctBorradoLogico(ss, 'Blocks', data.id) };
  }

  if (a === 'constructor_save_activity') {
    if (!data.subjectID || !data.titulo) return { ok: false, error: 'Faltan datos' };
    var aid = ctUpsert(ss, 'Activities', data.id || '', {
      SubjectID: data.subjectID, UnitID: data.unitID || '', Titulo: data.titulo || '',
      Instrucciones: data.instrucciones || '', Objetivo: data.objetivo || '',
      Puntaje: data.puntaje || 0, Rubrica: data.rubrica || '',
      FechaEntrega: data.fecha_entrega || '', PermiteTardia: data.permite_tardia || false,
      TiposArchivo: data.tipos_archivo || '', TamMaxMB: data.tam_max || 0,
      Modalidad: data.modalidad || 'individual', Estado: data.estado || 'borrador',
      Retroalimentacion: data.retroalimentacion || ''
    });
    return { ok: true, id: aid };
  }

  if (a === 'constructor_save_evaluation') {
    if (!data.subjectID || !data.nombre) return { ok: false, error: 'Faltan datos' };
    var pond = parseFloat(data.ponderacion) || 0;
    var suma = ctSumaPonderacion(ss, data.subjectID, data.id || '');
    if (suma + pond > 100) {
      return { ok: false, error: 'La suma de ponderaciones superaría 100% (actual ' + suma + '%)' };
    }
    var eid = ctUpsert(ss, 'Evaluations', data.id || '', {
      SubjectID: data.subjectID, Nombre: data.nombre || '', Tipo: data.tipo || 'parcial',
      PuntajeMax: data.puntaje_max || 0, Ponderacion: pond,
      FechaApertura: data.fecha_apertura || '', FechaCierre: data.fecha_cierre || '',
      DuracionMin: data.duracion_min || 0, IntentosMax: data.intentos_max || 1,
      Modalidad: data.modalidad || 'virtual', Aleatorizar: data.aleatorizar || false,
      PublicarResultados: data.publicar_resultados || false, Estado: data.estado || 'borrador'
    });
    return { ok: true, id: eid, suma_ponderacion: suma + pond };
  }

  if (a === 'constructor_save_question') {
    if (!data.subjectID || !data.pregunta) return { ok: false, error: 'Faltan datos' };
    var qid = ctUpsert(ss, 'QuestionBank', data.id || '', {
      SubjectID: data.subjectID, UnitID: data.unitID || '', Tipo: data.tipo || 'multiple',
      Pregunta: data.pregunta || '', OpcionesJson: data.opciones_json || '[]',
      Correcta: data.correcta || '', Indicador: data.indicador || '',
      Dificultad: data.dificultad || 'media', Puntaje: data.puntaje || 0,
      Retroalimentacion: data.retroalimentacion || '', Estado: data.estado || 'activo'
    });
    return { ok: true, id: qid };
  }

  if (a === 'constructor_delete_question') {
    if (!data.id) return { ok: false, error: 'Falta id' };
    return { ok: ctBorradoLogico(ss, 'QuestionBank', data.id) };
  }

  if (a === 'constructor_delete_activity') {
    if (!data.id) return { ok: false, error: 'Falta id' };
    return { ok: ctBorradoLogico(ss, 'Activities', data.id) };
  }

  if (a === 'constructor_delete_evaluation') {
    if (!data.id) return { ok: false, error: 'Falta id' };
    return { ok: ctBorradoLogico(ss, 'Evaluations', data.id) };
  }

  if (a === 'constructor_submit_review') {
    var sub = ctGet(ss, 'SubjectDrafts', data.id || '');
    if (!sub) return { ok: false, error: 'Asignatura no encontrada' };
    if (['borrador', 'observado', 'corregido'].indexOf(sub.Estado) < 0) {
      return { ok: false, error: 'Solo borrador/observado/corregido pueden enviarse' };
    }
    ctSetEstado(ss, 'SubjectDrafts', sub.ID, 'en_revision');
    ctReview(ss, sub.ID, sub.Estado, 'en_revision', data.por_rol || 'docente', data.por_cedula || '', data.comentario || '');
    return { ok: true };
  }

  if (a === 'constructor_review_decision') {
    var rev = ctGet(ss, 'SubjectDrafts', data.id || '');
    if (!rev) return { ok: false, error: 'Asignatura no encontrada' };
    if (rev.Estado !== 'en_revision') return { ok: false, error: 'No está en revisión' };
    var decision = data.decision || '';
    var nuevo = decision === 'aprobar' ? 'aprobado' : (decision === 'observar' ? 'observado' : '');
    if (!nuevo) return { ok: false, error: 'Decisión inválida (aprobar/observar)' };
    ctSetEstado(ss, 'SubjectDrafts', rev.ID, nuevo);
    ctReview(ss, rev.ID, 'en_revision', nuevo, data.por_rol || 'academico', data.por_cedula || '', data.comentario || '');
    return { ok: true };
  }

  if (a === 'constructor_publish') {
    var pub = ctGet(ss, 'SubjectDrafts', data.id || '');
    if (!pub) return { ok: false, error: 'Asignatura no encontrada' };
    if (pub.Estado !== 'aprobado') return { ok: false, error: 'Solo se publica lo aprobado' };
    ctSetEstado(ss, 'SubjectDrafts', pub.ID, 'publicado');
    var sheet = ctSheet(ss, 'SubjectDrafts');
    var headers = ctHeaders(sheet);
    var vals = sheet.getDataRange().getValues();
    for (var i = 1; i < vals.length; i++) {
      if (String(vals[i][0]) === String(pub.ID)) {
        sheet.getRange(i + 1, headers.indexOf('Version') + 1).setValue((parseInt(pub.Version) || 1));
        sheet.getRange(i + 1, headers.indexOf('UpdatedAt') + 1).setValue(new Date().toISOString());
        break;
      }
    }
    ctReview(ss, pub.ID, 'aprobado', 'publicado', data.por_rol || 'admin', data.por_cedula || '', data.comentario || '');
    return { ok: true };
  }

  if (a === 'constructor_archive') {
    if (!data.id) return { ok: false, error: 'Falta id' };
    var arc = ctGet(ss, 'SubjectDrafts', data.id || '');
    if (!arc) return { ok: false, error: 'Asignatura no encontrada' };
    ctSetEstado(ss, 'SubjectDrafts', arc.ID, 'archivado');
    ctReview(ss, arc.ID, arc.Estado, 'archivado', data.por_rol || 'admin', data.por_cedula || '', data.comentario || '');
    return { ok: true };
  }

  if (a === 'constructor_duplicate') {
    var orig = ctGet(ss, 'SubjectDrafts', data.id || '');
    if (!orig) return { ok: false, error: 'Asignatura no encontrada' };
    var nid = ctUpsert(ss, 'SubjectDrafts', '', {
      Codigo: (orig.Codigo || '') + '-Copia', Nombre: (orig.Nombre || '') + ' (copia)',
      Carrera: orig.Carrera || '', Grado: orig.Grado || '', Semestre: orig.Semestre || '',
      Modalidad: orig.Modalidad || '', CargaHoraria: orig.CargaHoraria || 0,
      DocenteCedula: data.docente_cedula || orig.DocenteCedula || '',
      Estado: 'borrador', Version: 1
    });
    var uorig = ctList(ss, 'Units', { SubjectID: orig.ID });
    for (var u = 0; u < uorig.length; u++) {
      var nu = ctUpsert(ss, 'Units', '', {
        SubjectID: nid, Numero: uorig[u].Numero, Titulo: uorig[u].Titulo,
        Resumen: uorig[u].Resumen, Objetivos: uorig[u].Objetivos,
        Indicadores: uorig[u].Indicadores, DuracionMin: uorig[u].DuracionMin,
        Estado: 'borrador', FechaPublicacion: '', Orden: uorig[u].Orden
      });
      var borig = ctList(ss, 'Blocks', { UnitID: uorig[u].ID });
      for (var b = 0; b < borig.length; b++) {
        ctUpsert(ss, 'Blocks', '', {
          UnitID: nu, Tipo: borig[b].Tipo, Titulo: borig[b].Titulo,
          Contenido: borig[b].Contenido, Orden: borig[b].Orden, Visible: borig[b].Visible
        });
      }
    }
    return { ok: true, id: nid };
  }

  return { ok: false, error: 'Acción no válida' };
}
