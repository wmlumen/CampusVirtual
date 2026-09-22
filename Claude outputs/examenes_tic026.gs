/** Examen Parcial TIC026 - Web App de Google Apps Script. */
const TIC026_CONFIG = Object.freeze({
  spreadsheetId: '1uryk-XaMqH4_I3BHT4vYNTQmtQBhpq011dH_Ny483_Y',
  respuestasSheet: 'RespuestasAlumnos', resultadosSheet: 'ResultadosFinal',
  maxIntentos: 2, puntajeAprobacion: 70, lockTimeoutMs: 30000
});

const HEADERS_RESPUESTAS = Object.freeze([
  'Cédula', 'Nombre', 'Apellido', 'Carrera', 'Sección', 'Código Examen',
  'Intento', 'Respuestas', 'Puntaje', 'Timestamp'
]);
const HEADERS_RESULTADOS = Object.freeze([
  'Cédula', 'Nombre', 'Apellido', 'Carrera', 'Sección', 'Código Examen',
  'Intentos Realizados', 'Último Intento', 'Mejor Puntaje', 'Estado', 'Aprobado/Reprobado'
]);

/** Abrir la URL /exec debe devolver este health check en JSON. */
function doGet() {
  return responderJson_({ success: true, service: 'TIC026', status: 'ok', timestamp: new Date().toISOString() });
}

function doPost(e) {
  try {
    const entrada = validarEntrada_(obtenerParametros_(e));
    return responderJson_(guardarIntento_(entrada));
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return responderJson_({ success: false, error: mensajeError_(error) });
  }
}

/** Admite el formulario actual y JSON para pruebas controladas. */
function obtenerParametros_(e) {
  if (!e) throw new Error('Solicitud POST vacía.');
  const tipo = String(e.postData && e.postData.type || '').toLowerCase();
  if (tipo.indexOf('application/json') !== -1) {
    try { return JSON.parse(e.postData.contents || '{}'); }
    catch (error) { throw new Error('El cuerpo JSON no es válido.'); }
  }
  return e.parameter || {};
}

function validarEntrada_(p) {
  const entrada = {
    cedula: textoRequerido_(p.cedula, 'Cédula', 30),
    nombre: textoRequerido_(p.nombre, 'Nombre', 120),
    apellido: textoOpcional_(p.apellido, 120),
    carrera: textoRequerido_(p.carrera, 'Carrera', 160),
    seccion: textoRequerido_(p.seccion, 'Sección', 60),
    codigoExamen: textoRequerido_(p.codigo_examen, 'Código de examen', 30).toUpperCase(),
    respuestas: textoRequerido_(p.respuestas, 'Respuestas', 20000),
    puntaje: entero_(p.puntaje, 'Puntaje'),
    intentoInformado: entero_(p.intento, 'Intento')
  };
  if (!/^[0-9A-Za-z.\-]+$/.test(entrada.cedula)) throw new Error('La cédula contiene caracteres no permitidos.');
  if (!/^TIC026-P[12]$/.test(entrada.codigoExamen)) throw new Error('Código inválido. Use TIC026-P1 o TIC026-P2.');
  if (entrada.intentoInformado < 1 || entrada.intentoInformado > TIC026_CONFIG.maxIntentos) throw new Error('Número de intento inválido.');
  if (entrada.puntaje < 0 || entrada.puntaje > 100) throw new Error('El puntaje debe estar entre 0 y 100.');
  try {
    const respuestas = JSON.parse(entrada.respuestas);
    if (!respuestas || typeof respuestas !== 'object' || Array.isArray(respuestas)) throw new Error();
  } catch (error) { throw new Error('Las respuestas no contienen un objeto JSON válido.'); }
  return entrada;
}

function guardarIntento_(entrada) {
  const lock = LockService.getScriptLock();
  lock.waitLock(TIC026_CONFIG.lockTimeoutMs);
  try {
    const ss = SpreadsheetApp.openById(TIC026_CONFIG.spreadsheetId);
    const hojas = asegurarHojas_(ss);
    const previos = buscarIntentos_(hojas.respuestas, entrada.cedula, entrada.codigoExamen);
    if (previos.length >= TIC026_CONFIG.maxIntentos) {
      throw new Error('Ya se alcanzó el máximo de ' + TIC026_CONFIG.maxIntentos + ' intentos para este examen.');
    }
    // El servidor asigna el intento real; no confía en el contador del navegador.
    const intentoReal = previos.length + 1;
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    hojas.respuestas.appendRow([
      celdaSegura_(entrada.cedula), celdaSegura_(entrada.nombre), celdaSegura_(entrada.apellido),
      celdaSegura_(entrada.carrera), celdaSegura_(entrada.seccion), entrada.codigoExamen,
      intentoReal, entrada.respuestas, entrada.puntaje, timestamp
    ]);
    const puntajes = previos.map(function (x) { return x.puntaje; });
    puntajes.push(entrada.puntaje);
    const mejor = Math.max.apply(null, puntajes);
    actualizarFinal_(hojas.resultados, entrada, intentoReal, mejor);
    return {
      success: true, message: 'Respuestas guardadas correctamente.', cedula: entrada.cedula,
      codigo_examen: entrada.codigoExamen, intento: intentoReal,
      intentos_disponibles: TIC026_CONFIG.maxIntentos - intentoReal,
      puntaje: entrada.puntaje, mejor_puntaje: mejor
    };
  } finally { lock.releaseLock(); }
}

function buscarIntentos_(sheet, cedula, codigo) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, HEADERS_RESPUESTAS.length).getValues()
    .filter(function (r) { return String(r[0]).trim() === cedula && String(r[5]).trim() === codigo; })
    .map(function (r) { return { intento: Number(r[6]) || 0, puntaje: Number(r[8]) || 0 }; });
}

function actualizarFinal_(sheet, entrada, intentoReal, mejor) {
  const last = sheet.getLastRow();
  const valores = last >= 2 ? sheet.getRange(2, 1, last - 1, HEADERS_RESULTADOS.length).getValues() : [];
  let filaExistente = 0;
  for (let i = 0; i < valores.length; i += 1) {
    if (String(valores[i][0]).trim() === entrada.cedula && String(valores[i][5]).trim() === entrada.codigoExamen) {
      filaExistente = i + 2; break;
    }
  }
  const fila = [
    celdaSegura_(entrada.cedula), celdaSegura_(entrada.nombre), celdaSegura_(entrada.apellido),
    celdaSegura_(entrada.carrera), celdaSegura_(entrada.seccion), entrada.codigoExamen,
    intentoReal, intentoReal, mejor,
    intentoReal >= TIC026_CONFIG.maxIntentos ? 'Finalizado' : 'En curso',
    mejor >= TIC026_CONFIG.puntajeAprobacion ? 'Aprobado' : 'Reprobado'
  ];
  if (filaExistente) sheet.getRange(filaExistente, 1, 1, fila.length).setValues([fila]);
  else sheet.appendRow(fila);
}

function asegurarHojas_(ss) {
  return {
    respuestas: asegurarHoja_(ss, TIC026_CONFIG.respuestasSheet, HEADERS_RESPUESTAS),
    resultados: asegurarHoja_(ss, TIC026_CONFIG.resultadosSheet, HEADERS_RESULTADOS)
  };
}

function asegurarHoja_(ss, nombre, headers) {
  let sheet = ss.getSheetByName(nombre);
  if (!sheet) sheet = ss.insertSheet(nombre);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

/** Ejecutar una vez desde el editor para autorizar y crear/verificar las hojas. */
function instalarTIC026() {
  const ss = SpreadsheetApp.openById(TIC026_CONFIG.spreadsheetId);
  asegurarHojas_(ss);
  return 'TIC026 instalado correctamente.';
}

/** Diagnóstico sin insertar intentos. */
function probarConfiguracionTIC026() {
  const ss = SpreadsheetApp.openById(TIC026_CONFIG.spreadsheetId);
  const hojas = asegurarHojas_(ss);
  return { success: Boolean(hojas.respuestas && hojas.resultados), spreadsheet: ss.getName(), timezone: Session.getScriptTimeZone() };
}

function textoRequerido_(valor, etiqueta, maximo) {
  const texto = String(valor == null ? '' : valor).trim();
  if (!texto) throw new Error(etiqueta + ' es obligatorio.');
  if (texto.length > maximo) throw new Error(etiqueta + ' excede ' + maximo + ' caracteres.');
  return texto;
}
function textoOpcional_(valor, maximo) {
  const texto = String(valor == null ? '' : valor).trim();
  if (texto.length > maximo) throw new Error('Un campo excede ' + maximo + ' caracteres.');
  return texto;
}
function entero_(valor, etiqueta) {
  const numero = Number(valor);
  if (!Number.isInteger(numero)) throw new Error(etiqueta + ' debe ser un número entero.');
  return numero;
}
/** Evita que texto del usuario se interprete como fórmula de Sheets. */
function celdaSegura_(valor) {
  const texto = String(valor == null ? '' : valor);
  return /^[=+\-@]/.test(texto) ? "'" + texto : texto;
}
function responderJson_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
function mensajeError_(error) {
  return error && error.message ? error.message : String(error || 'Error interno no identificado.');
}
