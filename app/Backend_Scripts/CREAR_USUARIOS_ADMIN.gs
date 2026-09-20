/**
 * SCRIPT PARA CREAR USUARIOS ADMINISTRATIVOS
 * 
 * Usuarios a crear:
 * 1. Administrador - cedula: "999999999", contraseña: "admin123"
 * 2. Acceso Académico - cedula: "888888888", contraseña: "academico123"
 * 
 * Ejecución:
 * 1. Copiar este código en Google Apps Script
 * 2. Ejecutar: crearUsuariosAdmin()
 * 3. Ver resultado en logs
 */

function crearUsuariosAdmin() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Datos de usuarios a crear
  const usuarios = [
    {
      cedula: '999999999',
      nombre: 'Usuario',
      apellido: 'Administrador',
      email: 'wmlumen@gmail.com',
      rol: 'Administrador',
      carrera: '-',
      seccion: '-',
      asignatura: '-'
    },
    {
      cedula: '888888888',
      nombre: 'Usuario',
      apellido: 'Académico',
      email: 'wmlumen@gmail.com',
      rol: 'Acceso Académico',
      carrera: '-',
      seccion: '-',
      asignatura: '-'
    }
  ];
  
  // Insertar en hojas
  insertarEnRegistroAlumnos(ss, usuarios);
  insertarEnRoles(ss, usuarios);
  
  Logger.log('✅ Usuarios administrativos creados exitosamente');
  Logger.log('Administrador: cedula=999999999, contraseña=admin123');
  Logger.log('Académico: cedula=888888888, contraseña=academico123');
}

function insertarEnRegistroAlumnos(ss, usuarios) {
  let sheet = ss.getSheetByName('RegistroAlumnos');
  
  if (!sheet) {
    sheet = ss.insertSheet('RegistroAlumnos');
    sheet.appendRow(['Cédula', 'Nombre', 'Apellido', 'Email', 'Grado', 'Carrera', 'Sección']);
  }
  
  // Verificar si usuario ya existe
  const data = sheet.getDataRange().getValues();
  
  usuarios.forEach(usuario => {
    const existe = data.some(row => row[0] == usuario.cedula);
    
    if (!existe) {
      sheet.appendRow([
        usuario.cedula,
        usuario.nombre,
        usuario.apellido,
        usuario.email,
        '-',  // Grado
        usuario.carrera,
        usuario.seccion
      ]);
      Logger.log(`Insertado en RegistroAlumnos: ${usuario.nombre} ${usuario.apellido} (${usuario.cedula})`);
    } else {
      Logger.log(`⚠️  ${usuario.cedula} ya existe en RegistroAlumnos`);
    }
  });
}

function insertarEnRoles(ss, usuarios) {
  let sheet = ss.getSheetByName('Roles');
  
  if (!sheet) {
    sheet = ss.insertSheet('Roles');
    sheet.appendRow([
      'Cédula', 'Nombre', 'Rol', 'Carrera', 'Sección', 'Asignatura', 
      'Estado', 'FechaAsignación', 'AsignadoPor'
    ]);
  }
  
  // Verificar si usuario ya existe
  const data = sheet.getDataRange().getValues();
  const ahora = new Date().toISOString().split('T')[0];
  
  usuarios.forEach(usuario => {
    const existe = data.some(row => row[0] == usuario.cedula && row[2] == usuario.rol);
    
    if (!existe) {
      sheet.appendRow([
        usuario.cedula,
        usuario.nombre + ' ' + usuario.apellido,
        usuario.rol,
        usuario.carrera,
        usuario.seccion,
        usuario.asignatura,
        'Activo',           // Estado
        ahora,               // FechaAsignación
        'Sistema'            // AsignadoPor
      ]);
      Logger.log(`Insertado en Roles: ${usuario.nombre} ${usuario.apellido} como ${usuario.rol}`);
    } else {
      Logger.log(`⚠️  ${usuario.cedula} ya existe en Roles como ${usuario.rol}`);
    }
  });
}

/**
 * PASO 1: Ejecutar crearUsuariosAdmin()
 * PASO 2: Crear contraseñas en la hoja de contraseñas
 * 
 * En Google Sheets, crear hoja "Contraseñas" si no existe con:
 * - Cédula | Contraseña (hasheada)
 * 
 * Para desarrollo/testing, se puede usar contraseña en plain text
 */
function configurarContrasenasAdmin(ss) {
  let sheet = ss.getSheetByName('Contraseñas');
  
  if (!sheet) {
    sheet = ss.insertSheet('Contraseñas');
    sheet.appendRow(['Cédula', 'PasswordHash', 'Último cambio']);
  }
  
  const contrasenas = [
    { cedula: '999999999', password: 'admin123' },
    { cedula: '888888888', password: 'academico123' }
  ];
  
  const data = sheet.getDataRange().getValues();
  const ahora = new Date().toISOString();
  
  contrasenas.forEach(item => {
    const existe = data.some(row => row[0] == item.cedula);
    
    if (!existe) {
      // EN PRODUCCIÓN: hashear con bcrypt o similar
      // Por ahora se guarda en plain text para testing
      const hash = Utilities.base64Encode(item.password);
      sheet.appendRow([
        item.cedula,
        hash,
        ahora
      ]);
      Logger.log(`✅ Contraseña configurada para ${item.cedula}`);
    }
  });
}

/**
 * VERIFICAR QUE LOS USUARIOS FUERON CREADOS
 */
function verificarUsuariosAdmin() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Logger.log('=== VERIFICACIÓN DE USUARIOS ADMIN ===');
  
  // Verificar RegistroAlumnos
  const sheetAlumnos = ss.getSheetByName('RegistroAlumnos');
  if (sheetAlumnos) {
    const data = sheetAlumnos.getDataRange().getValues();
    Logger.log('\nRegistroAlumnos:');
    data.forEach((row, i) => {
      if (row[0] === '999999999' || row[0] === '888888888') {
        Logger.log(`  Fila ${i+1}: ${row[1]} ${row[2]} (${row[0]}) - ${row[3]}`);
      }
    });
  }
  
  // Verificar Roles
  const sheetRoles = ss.getSheetByName('Roles');
  if (sheetRoles) {
    const data = sheetRoles.getDataRange().getValues();
    Logger.log('\nRoles:');
    data.forEach((row, i) => {
      if (row[0] === '999999999' || row[0] === '888888888') {
        Logger.log(`  Fila ${i+1}: ${row[1]} - Rol: ${row[2]} - Estado: ${row[6]}`);
      }
    });
  }
}
