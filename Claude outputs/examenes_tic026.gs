/**
 * Backend único TIC026 — Versión V01.
 * Configurar TIC026_CODIGO_DOCENTE en Propiedades del script y desplegar como aplicación web.
 */
const TIC026_SPREADSHEET_ID = '1uryk-XaMqH4_I3BHT4vYNTQmtQBhpq011dH_Ny483_Y';
const TIC026_MAX_INTENTOS = 2;
const TIC026_RESPUESTAS = {
  'TIC026-P1': ['B', 'A', 'A', 'C', 'B', 'B', 'B', 'B', 'B', 'B'],
  'TIC026-P2': ['B', 'C', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B']
};

function doGet() {
  return tic026Json_({ success: true, servicio: 'TIC026', version: '10.0' });
}

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    const accion = String(p.accion || 'guardar_examen');
    let resultado;
    if (accion === 'validar_dispositivo') resultado = tic026RegistrarDispositivo_(p);
    else if (accion === 'guardar_examen') resultado = tic026GuardarExamen_(p);
    else if (accion === 'obtener_revision') resultado = tic026ObtenerRevision_(p);
    else if (accion === 'consultar_resultados') resultado = tic026ConsultarResultados_(p);
    else throw new Error('Acción no admitida.');
    return tic026Json_(resultado);
  } catch (error) {
    return tic026Json_({ success: false, error: error.message || String(error), codigo: error.codigo || 'ERROR_INTERNO' });
  }
}

function tic026RegistrarDispositivo_(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ss = SpreadsheetApp.openById(TIC026_SPREADSHEET_ID);
    tic026PrepararHojas_(ss);
    return tic026ValidarDispositivo_(p, true, ss);
  } finally {
    lock.releaseLock();
  }
}

function tic026GuardarExamen_(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ss = SpreadsheetApp.openById(TIC026_SPREADSHEET_ID);
    tic026PrepararHojas_(ss);
    const acceso = tic026ValidarDispositivo_(p, false, ss);
    if (!acceso.success) return acceso;

    const cedula = tic026Texto_(p.cedula, 20);
    const codigoExamen = tic026CodigoExamen_(p.codigo_examen);
    const respuestas = tic026ParsearRespuestas_(p.respuestas);
    const hoja = ss.getSheetByName('RespuestasAlumnos');
    const intentos = tic026Intentos_(hoja.getDataRange().getValues(), cedula, codigoExamen);
    if (intentos >= TIC026_MAX_INTENTOS) return tic026Fallo_('INTENTOS_AGOTADOS', 'Ya completaste los dos intentos permitidos.');

    const intento = intentos + 1;
    const clave = TIC026_RESPUESTAS[codigoExamen];
    const puntaje = clave.reduce(function(total, correcta, indice) {
      return total + (respuestas[String(indice + 1)] === correcta ? 1 : 0);
    }, 0);
    hoja.appendRow([
      cedula, tic026Texto_(p.nombre, 100), tic026Texto_(p.apellido, 60), tic026Texto_(p.carrera, 80),
      tic026Texto_(p.seccion, 20), codigoExamen, intento, JSON.stringify(respuestas), puntaje,
      new Date(), tic026Ip_(p.ip), tic026Huella_(p.huella_dispositivo)
    ]);
    tic026ActualizarResultado_(ss, p, codigoExamen, intento, puntaje);
    return {
      success: true,
      puntaje: puntaje,
      intentos_realizados: intento,
      puede_reintentar: intento < TIC026_MAX_INTENTOS,
      revision_disponible: intento >= TIC026_MAX_INTENTOS
    };
  } finally {
    lock.releaseLock();
  }
}

function tic026ValidarDispositivo_(p, registrar, ss) {
  const cedula = tic026Texto_(p.cedula, 20);
  const codigoExamen = tic026CodigoExamen_(p.codigo_examen);
  const ip = tic026Ip_(p.ip);
  const huella = tic026Huella_(p.huella_dispositivo);
  const dispositivos = ss.getSheetByName('DispositivosExamen');
  const filas = dispositivos.getDataRange().getValues();
  for (let i = 1; i < filas.length; i++) {
    const otraCedula = String(filas[i][0]).trim();
    const mismaIp = String(filas[i][2]).trim() === ip;
    const mismaHuella = String(filas[i][3]).trim() === huella;
    if (otraCedula !== cedula && (mismaIp || mismaHuella)) {
      return tic026Fallo_('DISPOSITIVO_DUPLICADO', 'Esta IP o dispositivo ya fue utilizado por otro alumno. Intenta desde otro dispositivo.');
    }
  }
  const respuestas = ss.getSheetByName('RespuestasAlumnos');
  const intentos = tic026Intentos_(respuestas.getDataRange().getValues(), cedula, codigoExamen);
  if (intentos >= TIC026_MAX_INTENTOS) return tic026Fallo_('INTENTOS_AGOTADOS', 'Ya completaste los dos intentos permitidos.');
  if (registrar && !filas.some(function(fila, i) { return i > 0 && String(fila[0]).trim() === cedula && String(fila[2]).trim() === ip && String(fila[3]).trim() === huella; })) {
    dispositivos.appendRow([cedula, codigoExamen, ip, huella, new Date()]);
  }
  return { success: true, siguiente_intento: intentos + 1 };
}

function tic026ObtenerRevision_(p) {
  const codigoConfigurado = PropertiesService.getScriptProperties().getProperty('TIC026_CODIGO_DOCENTE');
  if (!codigoConfigurado) return tic026Fallo_('CODIGO_NO_CONFIGURADO', 'El código del profesor no está configurado en el servidor.');
  if (!tic026ComparacionSegura_(String(p.codigo_docente || ''), codigoConfigurado)) return tic026Fallo_('CODIGO_INCORRECTO', 'Código del profesor incorrecto.');

  const cedula = tic026Texto_(p.cedula, 20);
  const codigoExamen = tic026CodigoExamen_(p.codigo_examen);
  const ss = SpreadsheetApp.openById(TIC026_SPREADSHEET_ID);
  const hoja = ss.getSheetByName('RespuestasAlumnos');
  const filas = hoja.getDataRange().getValues();
  const propias = filas.slice(1).filter(function(fila) { return String(fila[0]).trim() === cedula && String(fila[5]).trim() === codigoExamen; });
  if (propias.length < TIC026_MAX_INTENTOS) return tic026Fallo_('REVISION_BLOQUEADA', 'La revisión se habilita después de completar los dos intentos.');
  propias.sort(function(a, b) { return Number(a[6]) - Number(b[6]); });
  const ultima = propias[propias.length - 1];
  const respuestas = tic026ParsearRespuestas_(ultima[7]);
  const clave = TIC026_RESPUESTAS[codigoExamen];
  return {
    success: true,
    detalle: clave.map(function(correcta, indice) {
      const alumno = respuestas[String(indice + 1)] || '';
      return { numero: indice + 1, respuesta_alumno: alumno, respuesta_correcta: correcta, correcta: alumno === correcta };
    })
  };
}

function tic026ConsultarResultados_(p) {
  const cedula = tic026Texto_(p.cedula, 20);
  const codigoExamen = tic026CodigoExamen_(p.codigo_examen);
  const ss = SpreadsheetApp.openById(TIC026_SPREADSHEET_ID);
  const hoja = ss.getSheetByName('RespuestasAlumnos');
  if (!hoja) return tic026Fallo_('SIN_RESULTADOS', 'No se encontraron resultados para esta cédula.');
  const filas = hoja.getDataRange().getValues();
  const propias = filas.slice(1)
    .filter(function(fila) { return String(fila[0]).trim() === cedula && String(fila[5]).trim() === codigoExamen; })
    .sort(function(a, b) { return Number(a[6]) - Number(b[6]); });
  if (!propias.length) return tic026Fallo_('SIN_RESULTADOS', 'No se encontraron resultados para esta cédula y parcial.');

  const primera = propias[0];
  const segunda = propias.find(function(fila) { return Number(fila[6]) === 2; });
  const puntajes = propias.map(function(fila) { return Number(fila[8]); }).filter(function(valor) { return Number.isFinite(valor); });
  return {
    success: true,
    cedula: String(primera[0]).trim(),
    nombre: String(primera[1] || '').trim(),
    carrera: String(primera[3] || '').trim(),
    seccion: String(primera[4] || '').trim(),
    codigo_examen: codigoExamen,
    intentos_realizados: propias.length,
    primer_puntaje: Number(primera[8]),
    segundo_puntaje: segunda ? Number(segunda[8]) : '',
    puntaje_definitivo: puntajes.length ? Math.max.apply(null, puntajes) : '',
    revision_disponible: propias.length >= TIC026_MAX_INTENTOS
  };
}

function tic026PrepararHojas_(ss) {
  ss = ss || SpreadsheetApp.openById(TIC026_SPREADSHEET_ID);
  tic026AsegurarHoja_(ss, 'RespuestasAlumnos', ['Cédula','Nombre','Apellido','Carrera','Sección','Código Examen','Intento','Respuestas','Puntaje','Timestamp','IP','Huella Dispositivo']);
  tic026AsegurarHoja_(ss, 'ResultadosFinal', ['Cédula','Nombre','Apellido','Carrera','Sección','Código Examen','Intentos Realizados','Último Puntaje','Mejor Puntaje','Estado','Aprobado/Reprobado']);
  tic026AsegurarHoja_(ss, 'DispositivosExamen', ['Cédula','Código Examen','IP','Huella Dispositivo','Primer acceso']);
  tic026MigrarEscala10_(ss);
}

function tic026MigrarEscala10_(ss) {
  const propiedades = PropertiesService.getScriptProperties();
  if (propiedades.getProperty('TIC026_ESCALA_10_MIGRADA') === 'SI') return;

  const respuestas = ss.getSheetByName('RespuestasAlumnos');
  if (respuestas.getLastRow() > 1) {
    const rangoPuntajes = respuestas.getRange(2, 9, respuestas.getLastRow() - 1, 1);
    const puntajes = rangoPuntajes.getValues().map(function(fila) {
      const valor = Number(fila[0]);
      return [Number.isFinite(valor) ? valor / 10 : fila[0]];
    });
    rangoPuntajes.setValues(puntajes);
  }

  const finales = ss.getSheetByName('ResultadosFinal');
  if (finales.getLastRow() > 1) {
    const cantidad = finales.getLastRow() - 1;
    const rango = finales.getRange(2, 8, cantidad, 4);
    const valores = rango.getValues().map(function(fila) {
      const ultimo = Number(fila[0]);
      const mejor = Number(fila[1]);
      const ultimo10 = Number.isFinite(ultimo) ? ultimo / 10 : fila[0];
      const mejor10 = Number.isFinite(mejor) ? mejor / 10 : fila[1];
      return [ultimo10, mejor10, fila[2], mejor10 >= 7 ? 'Aprobado' : 'Reprobado'];
    });
    rango.setValues(valores);
  }

  propiedades.setProperty('TIC026_ESCALA_10_MIGRADA', 'SI');
}

function tic026AsegurarHoja_(ss, nombre, cabeceras) {
  let hoja = ss.getSheetByName(nombre);
  if (!hoja) hoja = ss.insertSheet(nombre);
  if (hoja.getLastRow() === 0) hoja.appendRow(cabeceras);
  else if (hoja.getLastColumn() < cabeceras.length) hoja.getRange(1, 1, 1, cabeceras.length).setValues([cabeceras]);
}

function tic026ActualizarResultado_(ss, p, codigo, intento, puntaje) {
  const hoja = ss.getSheetByName('ResultadosFinal');
  const datos = hoja.getDataRange().getValues();
  const cedula = tic026Texto_(p.cedula, 20);
  let fila = -1;
  for (let i = 1; i < datos.length; i++) if (String(datos[i][0]).trim() === cedula && String(datos[i][5]).trim() === codigo) { fila = i + 1; break; }
  if (fila > 0) {
    const mejor = Math.max(Number(hoja.getRange(fila, 9).getValue()) || 0, puntaje);
    hoja.getRange(fila, 7, 1, 5).setValues([[intento, puntaje, mejor, intento >= TIC026_MAX_INTENTOS ? 'Completado' : 'En curso', mejor >= 7 ? 'Aprobado' : 'Reprobado']]);
  } else {
    hoja.appendRow([cedula, tic026Texto_(p.nombre,100), tic026Texto_(p.apellido,60), tic026Texto_(p.carrera,80), tic026Texto_(p.seccion,20), codigo, intento, puntaje, puntaje, intento >= TIC026_MAX_INTENTOS ? 'Completado' : 'En curso', puntaje >= 7 ? 'Aprobado' : 'Reprobado']);
  }
}

function tic026Intentos_(filas, cedula, codigo) {
  return filas.slice(1).filter(function(fila) { return String(fila[0]).trim() === cedula && String(fila[5]).trim() === codigo; }).length;
}

function tic026ParsearRespuestas_(valor) {
  let respuestas;
  try { respuestas = typeof valor === 'string' ? JSON.parse(valor) : valor; } catch (e) { throw new Error('Formato de respuestas inválido.'); }
  if (!respuestas || typeof respuestas !== 'object') throw new Error('Las respuestas son obligatorias.');
  for (let i = 1; i <= 10; i++) if (!/^[A-D]$/.test(String(respuestas[String(i)] || ''))) throw new Error('Falta una respuesta válida en la pregunta ' + i + '.');
  return respuestas;
}

function tic026CodigoExamen_(valor) {
  const codigo = String(valor || '').trim().toUpperCase();
  if (!TIC026_RESPUESTAS[codigo]) throw new Error('Código de examen inválido.');
  return codigo;
}

function tic026Texto_(valor, maximo) {
  const texto = String(valor || '').trim();
  if (!texto || texto.length > maximo || /^[=+\-@]/.test(texto)) throw new Error('Dato obligatorio inválido.');
  return texto;
}

function tic026Ip_(valor) {
  const ip = String(valor || '').trim();
  if (!/^[0-9a-fA-F:.]{3,45}$/.test(ip)) throw new Error('No fue posible validar la IP del dispositivo.');
  return ip;
}

function tic026Huella_(valor) {
  const huella = String(valor || '').trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(huella)) throw new Error('Huella de dispositivo inválida.');
  return huella;
}

function tic026ComparacionSegura_(a, b) {
  const aa = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, a.trim());
  const bb = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, b.trim());
  if (aa.length !== bb.length) return false;
  let diferencia = 0;
  for (let i = 0; i < aa.length; i++) diferencia |= aa[i] ^ bb[i];
  return diferencia === 0;
}

function tic026Fallo_(codigo, mensaje) { return { success: false, codigo: codigo, error: mensaje }; }
function tic026Json_(objeto) { return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON); }
