/**
 * examenes_tic026.gs
 * Funciones para manejar examen parcial TIC026
 * v08.5 — Examen con código de acceso, intentos y guardado en Sheets
 */

// ===== CONFIGURACIÓN =====
const CONFIG_EXAMEN = {
  codigo: 'TIC026',
  nombre: 'Examen Parcial TIC026',
  maxIntentos: 2,
  totalPreguntas: 20,
  puntajeMaximo: 100,
  hojaResultados: 'RespuestasAlumnos',
  hojaResultadosFinal: 'ResultadosFinal'
};

// ===== RUTA: GUARDAR RESPUESTAS DEL EXAMEN =====
function examen_respuestas_guardar(cedula, nombre, apellido, carrera, seccion, codigo_examen, intento, respuestas, puntaje) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_EXAMEN.hojaResultados);

    if (!sheet) {
      return {
        success: false,
        error: 'Hoja de resultados no encontrada'
      };
    }

    // Agregar fila con respuestas
    const timestamp = new Date().toLocaleString('es-ES');
    sheet.appendRow([
      cedula,
      nombre,
      apellido,
      carrera,
      seccion,
      codigo_examen,
      intento,
      respuestas,
      puntaje,
      timestamp
    ]);

    // Actualizar resultado final (mejor puntaje)
    actualizarResultadoFinal(cedula, nombre, apellido, carrera, seccion, codigo_examen, intento, puntaje);

    return {
      success: true,
      message: 'Respuestas guardadas correctamente',
      cedula: cedula,
      puntaje: puntaje,
      intento: intento
    };

  } catch (error) {
    Logger.log('Error en examen_respuestas_guardar: ' + error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ===== ACTUALIZAR RESULTADO FINAL (mejor puntaje) =====
function actualizarResultadoFinal(cedula, nombre, apellido, carrera, seccion, codigo_examen, intento, puntaje) {
  try {
    const sheetFinal = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_EXAMEN.hojaResultadosFinal);

    if (!sheetFinal) {
      Logger.log('Hoja de resultados finales no encontrada');
      return;
    }

    // Buscar si la cédula ya existe
    const datos = sheetFinal.getDataRange().getValues();
    let filaExistente = -1;

    for (let i = 1; i < datos.length; i++) {
      if (datos[i][0] == cedula && datos[i][4] == codigo_examen) {
        filaExistente = i;
        break;
      }
    }

    if (filaExistente >= 0) {
      // Actualizar fila existente con mejor puntaje
      const puntajeActual = sheetFinal.getRange(filaExistente + 1, 9).getValue();
      const mejorPuntaje = Math.max(puntajeActual, puntaje);

      sheetFinal.getRange(filaExistente + 1, 9).setValue(mejorPuntaje);
      sheetFinal.getRange(filaExistente + 1, 11).setValue(mejorPuntaje >= 70 ? 'Aprobado' : 'Reprobado');

    } else {
      // Crear nueva fila
      const mejorPuntaje = puntaje;
      sheetFinal.appendRow([
        cedula,
        nombre,
        apellido,
        carrera,
        seccion,
        codigo_examen,
        intento,
        puntaje,
        mejorPuntaje,
        'Completado',
        mejorPuntaje >= 70 ? 'Aprobado' : 'Reprobado'
      ]);
    }

  } catch (error) {
    Logger.log('Error en actualizarResultadoFinal: ' + error);
  }
}

// ===== RUTA: OBTENER RESULTADOS DEL ALUMNO =====
function examen_resultados_obtener(cedula, codigo_examen) {
  try {
    const sheetFinal = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_EXAMEN.hojaResultadosFinal);

    if (!sheetFinal) {
      return {
        success: false,
        error: 'Hoja de resultados no encontrada'
      };
    }

    const datos = sheetFinal.getDataRange().getValues();

    for (let i = 1; i < datos.length; i++) {
      if (datos[i][0] == cedula && datos[i][4] == codigo_examen) {
        return {
          success: true,
          cedula: datos[i][0],
          nombre: datos[i][1],
          apellido: datos[i][2],
          carrera: datos[i][3],
          seccion: datos[i][4],
          puntaje_maximo: datos[i][8],
          aprobado: datos[i][10] === 'Aprobado',
          intentos_realizados: datos[i][6]
        };
      }
    }

    return {
      success: false,
      error: 'Alumno no encontrado'
    };

  } catch (error) {
    Logger.log('Error en examen_resultados_obtener: ' + error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ===== RUTA: LISTAR TODOS LOS RESULTADOS (para docente) =====
function examen_resultados_listar(codigo_examen) {
  try {
    const sheetFinal = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_EXAMEN.hojaResultadosFinal);

    if (!sheetFinal) {
      return {
        success: false,
        error: 'Hoja de resultados no encontrada'
      };
    }

    const datos = sheetFinal.getDataRange().getValues();
    const resultados = [];

    for (let i = 1; i < datos.length; i++) {
      if (datos[i][4] == codigo_examen) {
        resultados.push({
          cedula: datos[i][0],
          nombre: datos[i][1],
          apellido: datos[i][2],
          carrera: datos[i][3],
          seccion: datos[i][4],
          puntaje: datos[i][8],
          aprobado: datos[i][10] === 'Aprobado',
          intentos: datos[i][6]
        });
      }
    }

    return {
      success: true,
      total: resultados.length,
      resultados: resultados
    };

  } catch (error) {
    Logger.log('Error en examen_resultados_listar: ' + error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ===== CREAR HOJAS AUTOMÁTICAMENTE (si no existen) =====
function crearHojasExamen() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Crear hoja de respuestas
    if (!ss.getSheetByName(CONFIG_EXAMEN.hojaResultados)) {
      const sheetRespuestas = ss.insertSheet(CONFIG_EXAMEN.hojaResultados);
      sheetRespuestas.appendRow([
        'Cédula',
        'Nombre',
        'Apellido',
        'Carrera',
        'Sección',
        'Código Examen',
        'Intento',
        'Respuestas',
        'Puntaje',
        'Timestamp'
      ]);
    }

    // Crear hoja de resultados finales
    if (!ss.getSheetByName(CONFIG_EXAMEN.hojaResultadosFinal)) {
      const sheetFinal = ss.insertSheet(CONFIG_EXAMEN.hojaResultadosFinal);
      sheetFinal.appendRow([
        'Cédula',
        'Nombre',
        'Apellido',
        'Carrera',
        'Sección',
        'Código Examen',
        'Intentos Realizados',
        'Último Intento',
        'Mejor Puntaje',
        'Estado',
        'Aprobado/Reprobado'
      ]);
    }

    return {
      success: true,
      message: 'Hojas creadas correctamente'
    };

  } catch (error) {
    Logger.log('Error en crearHojasExamen: ' + error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ===== ENDPOINT PARA POST (integración con HTML) =====
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);

    const resultado = examen_respuestas_guardar(
      params.cedula,
      params.nombre,
      params.apellido,
      params.carrera,
      params.seccion,
      params.codigo_examen,
      params.intento,
      params.respuestas,
      params.puntaje
    );

    return ContentService.createTextOutput(JSON.stringify(resultado))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== TEST: Verificar que funciona =====
function testExamen() {
  Logger.log('=== TEST EXAMEN TIC026 ===');

  // Crear hojas
  Logger.log(JSON.stringify(crearHojasExamen()));

  // Simular respuesta
  const resultado = examen_respuestas_guardar(
    '12345678',
    'Juan',
    'Pérez',
    'Administración de Empresa',
    'S026',
    'TIC026',
    1,
    '{"1":"A","2":"B","3":"A"}',
    75
  );

  Logger.log('Resultado de guardado: ' + JSON.stringify(resultado));

  // Obtener resultado
  const obtenido = examen_resultados_obtener('12345678', 'TIC026');
  Logger.log('Resultado obtenido: ' + JSON.stringify(obtenido));

  Logger.log('=== FIN TEST ===');
}
