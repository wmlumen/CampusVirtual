/**
 * examenes_tic026.gs — VERSIÓN DESPLEGADA
 * Guarda respuestas del Examen Parcial TIC026 en Google Sheets.
 * Recibe FormData del HTML (e.parameter), no JSON.
 * Hoja base: 1uryk-XaMqH4_I3BHT4vYNTQmtQBhpq011dH_Ny483_Y
 */

const SPREADSHEET_ID = '1uryk-XaMqH4_I3BHT4vYNTQmtQBhpq011dH_Ny483_Y';

function doPost(e) {
  try {
    const params = e.parameter;
    Logger.log('Parámetros: ' + JSON.stringify(params));

    const resultado = examen_respuestas_guardar(
      params.cedula,
      params.nombre,
      params.apellido,
      params.carrera,
      params.seccion,
      params.codigo_examen,
      parseInt(params.intento),
      params.respuestas,
      parseInt(params.puntaje)
    );

    return ContentService.createTextOutput(JSON.stringify(resultado)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({success: false, error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function examen_respuestas_guardar(cedula, nombre, apellido, carrera, seccion, codigo_examen, intento, respuestas, puntaje) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    crearHojasExamen();
    const sheet = ss.getSheetByName('RespuestasAlumnos');

    const timestamp = new Date().toLocaleString('es-ES');
    sheet.appendRow([cedula, nombre, apellido, carrera, seccion, codigo_examen, intento, respuestas, puntaje, timestamp]);

    actualizarResultadoFinal(cedula, nombre, apellido, carrera, seccion, codigo_examen, intento, puntaje);

    return {success: true, cedula: cedula, puntaje: puntaje, intento: intento};
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return {success: false, error: error.toString()};
  }
}

function actualizarResultadoFinal(cedula, nombre, apellido, carrera, seccion, codigo_examen, intento, puntaje) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetFinal = ss.getSheetByName('ResultadosFinal');
    const datos = sheetFinal.getDataRange().getValues();

    let filaExistente = -1;
    for (let i = 1; i < datos.length; i++) {
      if (datos[i][0] == cedula && datos[i][4] == codigo_examen) {
        filaExistente = i;
        break;
      }
    }

    if (filaExistente >= 0) {
      const puntajeActual = sheetFinal.getRange(filaExistente + 1, 9).getValue();
      const mejorPuntaje = Math.max(puntajeActual, puntaje);
      sheetFinal.getRange(filaExistente + 1, 9).setValue(mejorPuntaje);
      sheetFinal.getRange(filaExistente + 1, 11).setValue(mejorPuntaje >= 70 ? 'Aprobado' : 'Reprobado');
    } else {
      sheetFinal.appendRow([cedula, nombre, apellido, carrera, seccion, codigo_examen, intento, puntaje, puntaje, 'Completado', puntaje >= 70 ? 'Aprobado' : 'Reprobado']);
    }
  } catch (error) {
    Logger.log('Error: ' + error.toString());
  }
}

function crearHojasExamen() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (!ss.getSheetByName('RespuestasAlumnos')) {
      const sheet = ss.insertSheet('RespuestasAlumnos');
      sheet.appendRow(['Cédula', 'Nombre', 'Apellido', 'Carrera', 'Sección', 'Código Examen', 'Intento', 'Respuestas', 'Puntaje', 'Timestamp']);
    }

    if (!ss.getSheetByName('ResultadosFinal')) {
      const sheetFinal = ss.insertSheet('ResultadosFinal');
      sheetFinal.appendRow(['Cédula', 'Nombre', 'Apellido', 'Carrera', 'Sección', 'Código Examen', 'Intentos', 'Último', 'Mejor Puntaje', 'Estado', 'Aprobado/Reprobado']);
    }
  } catch (error) {
    Logger.log('Error: ' + error.toString());
  }
}
