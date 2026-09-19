/**
 * CREAR USUARIOS DE PRUEBA PARA CADA ROL
 * 
 * INSTRUCCIONES:
 * 1. Abre el editor de Apps Script: https://script.google.com/u/0/home/projects/1U-oq56MNy4zsD_J04xZBMhfQqaNHCDJbpyAQ4YEAAhnenfJE3DwtJHM2/edit
 * 2. Crea un nuevo archivo: "CrearUsuariosPrueba.gs"
 * 3. Pega este código
 * 4. Ejecuta la función: crearUsuariosPrueba()
 * 5. Revisa los logs (Ctrl+Enter) para ver las credenciales creadas
 * 
 * USUARIOS QUE SE CREAN:
 * - Alumno:          CI: 9000001  | Pass: Alumno2026*
 * - Docente:         CI: 9000002  | Pass: Docente2026*
 * - Académico:       CI: 9000003  | Pass: Academico2026*
 * - Admin General:   CI: 9000004  | Pass: AdminGen2026*
 * - Admin Sede:      CI: 9000005  | Pass: AdminSede2026*
 * - Alumno (sección): CI: 9000006 | Pass: Alumno2026* (con carrera/sección)
 */

function crearUsuariosPrueba() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var resultados = [];
  
  // Configuración de usuarios a crear
  var usuarios = [
    {
      cedula: '9000001',
      nombre: 'ALUMNO',
      apellido: 'PRUEBA',
      email: 'alumno.prueba@centuria.edu.py',
      telefono: '0981111111',
      password: 'Alumno2026*',
      rol: 'alumno',
      grado: 'GRADO',
      carrera: 'ADMINISTRACION DE EMPRESAS',
      seccion: 'S026',
      descripcion: 'ALUMNO - Acceso a dashboard, materiales, libreta, asistencia, calendario, tesorería'
    },
    {
      cedula: '9000002',
      nombre: 'DOCENTE',
      apellido: 'PRUEBA',
      email: 'docente.prueba@centuria.edu.py',
      telefono: '0981222222',
      password: 'Docente2026*',
      rol: 'docente',
      grado: 'GRADO',
      carrera: 'ADMINISTRACION DE EMPRESAS',
      seccion: 'S026',
      asignatura: 'TIC',
      descripcion: 'DOCENTE - Mis asignaturas, eventos asistencia, calificaciones, alumnos, solicitar materias'
    },
    {
      cedula: '9000003',
      nombre: 'ACADEMICO',
      apellido: 'PRUEBA',
      email: 'academico.prueba@centuria.edu.py',
      telefono: '0981333333',
      password: 'Academico2026*',
      rol: 'academico',
      grado: 'GRADO',
      carrera: 'ADMINISTRACION DE EMPRESAS',
      seccion: 'S026',
      descripcion: 'ACCESO ACADÉMICO - Plan estudios, horarios, evaluaciones, constructor, catálogos, reportes'
    },
    {
      cedula: '9000004',
      nombre: 'ADMIN',
      apellido: 'GENERAL',
      email: 'admin.general@centuria.edu.py',
      telefono: '0981444444',
      password: 'AdminGen2026*',
      rol: 'admin',
      grado: '',
      carrera: '',
      seccion: '',
      descripcion: 'ADMIN GENERAL - Todas las sedes, roles globales, catálogos maestros, constructor, auditoría, salud sistema'
    },
    {
      cedula: '9000005',
      nombre: 'ADMIN',
      apellido: 'SEDE',
      email: 'admin.sede@centuria.edu.py',
      telefono: '0981555555',
      password: 'AdminSede2026*',
      rol: 'admin',
      grado: '',
      carrera: '',
      seccion: '',
      filial: 'Sede Central',
      descripcion: 'ADMIN DE SEDE - Usuarios locales, horarios aulas, docentes sede, reportes locales, config filial'
    },
    {
      cedula: '9000006',
      nombre: 'ALUMNO',
      apellido: 'SECCION LV',
      email: 'alumno.lv@centuria.edu.py',
      telefono: '0981666666',
      password: 'Alumno2026*',
      rol: 'alumno',
      grado: 'GRADO',
      carrera: 'ADMINISTRACION DE EMPRESAS',
      seccion: 'LV026',
      descripcion: 'ALUMNO (Sección Lunes-Viernes) - Mismo acceso que alumno regular pero sección LV026'
    }
  ];
  
  usuarios.forEach(function(u) {
    try {
      // Verificar si ya existe
      var existing = cvAuthFindUser(ss, u.cedula);
      if (existing && !existing.is_legacy) {
        resultados.push({ cedula: u.cedula, rol: u.rol, status: 'EXISTE', mensaje: 'Usuario ya registrado' });
        return;
      }
      
      // Preparar datos para registro
      var userData = {
        cedula: u.cedula,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        telefono: u.telefono,
        password: u.password,
        rol: u.rol,
        grado: u.grado,
        carrera: u.carrera,
        seccion: u.seccion
      };
      
      // Para docente, agregar asignatura
      if (u.asignatura) userData.asignatura = u.asignatura;
      
      // Registrar usuario
      var result = cvAuthRegister(ss, userData);
      
      if (result.ok) {
        // Para Admin Sede, agregar rol en hoja Roles con filial
        if (u.cedula === '9000005' && u.filial) {
          var rolSheet = ss.getSheetByName('Roles');
          if (rolSheet) {
            var nowIso = new Date().toISOString();
            rolSheet.appendRow([
              u.cedula, u.nombre + ' ' + u.apellido, 'admin',
              u.filial, '', '', 'activo', nowIso, 'setup-script'
            ]);
          }
        }
        
        resultados.push({ 
          cedula: u.cedula, 
          rol: u.rol, 
          status: 'CREADO', 
          password: u.password,
          email: u.email,
          descripcion: u.descripcion
        });
      } else {
        resultados.push({ cedula: u.cedula, rol: u.rol, status: 'ERROR', mensaje: result.mensaje || result.error });
      }
      
    } catch (e) {
      resultados.push({ cedula: u.cedula, rol: u.rol, status: 'EXCEPTION', mensaje: e.message });
    }
  });
  
  // Mostrar resultados en logs
  Logger.log('=== RESULTADOS CREACIÓN USUARIOS PRUEBA ===');
  resultados.forEach(function(r) {
    if (r.status === 'CREADO') {
      Logger.log('✅ ' + r.rol.toUpperCase() + ' | CI: ' + r.cedula + ' | Pass: ' + r.password + ' | Email: ' + r.email);
      Logger.log('   → ' + r.descripcion);
    } else if (r.status === 'EXISTE') {
      Logger.log('⏭️  ' + r.rol.toUpperCase() + ' | CI: ' + r.cedula + ' | YA EXISTE');
    } else {
      Logger.log('❌ ' + r.rol.toUpperCase() + ' | CI: ' + r.cedula + ' | ERROR: ' + (r.mensaje || 'desconocido'));
    }
  });
  
  // Resumen final
  var creados = resultados.filter(function(r){return r.status==='CREADO'}).length;
  var existentes = resultados.filter(function(r){return r.status==='EXISTE'}).length;
  var errores = resultados.filter(function(r){return r.status==='ERROR'||r.status==='EXCEPTION'}).length;
  
  Logger.log('');
  Logger.log('=== RESUMEN ===');
  Logger.log('Creados: ' + creados);
  Logger.log('Ya existían: ' + existentes);
  Logger.log('Errores: ' + errores);
  
  return resultados;
}

/**
 * FUNCIÓN AUXILIAR: Limpiar usuarios de prueba (solo para testing)
 * Ejecutar solo si querés borrar los usuarios creados arriba
 */
function limpiarUsuariosPrueba() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ceds = ['9000001','9000002','9000003','9000004','9000005','9000006'];
  var hojas = ['Usuarios','Sesiones','RegistroAlumnos','Roles'];
  
  ceds.forEach(function(ced) {
    hojas.forEach(function(hName) {
      var sh = ss.getSheetByName(hName);
      if (!sh) return;
      var data = sh.getDataRange().getValues();
      for (var i = data.length - 1; i >= 1; i--) {
        if (cvAuthNormalizeCedula(data[i][0]) === ced) {
          sh.deleteRow(i + 1);
        }
      }
    });
  });
  Logger.log('Usuarios de prueba eliminados');
}

/**
 * FUNCIÓN AUXILIAR: Verificar usuarios creados
 */
function verificarUsuariosPrueba() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ceds = ['9000001','9000002','9000003','9000004','9000005','9000006'];
  
  ceds.forEach(function(ced) {
    var user = cvAuthFindUser(ss, ced);
    if (user) {
      var roles = obtenerRoles(ss, ced);
      Logger.log('CI: ' + ced + ' | ' + user.nombre + ' ' + user.apellido + ' | Rol: ' + user.rol + ' | Estado: ' + user.estado + ' | Roles activos: ' + roles.length);
      roles.forEach(function(r) { Logger.log('  - ' + r.rol + ' | Carrera: ' + r.carrera + ' | Sección: ' + r.seccion + ' | Asignatura: ' + r.asignatura); });
    } else {
      Logger.log('CI: ' + ced + ' | NO ENCONTRADO');
    }
  });
}