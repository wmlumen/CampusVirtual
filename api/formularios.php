<?php
/**
 * API Formularios — CRUD de formularios por carrera + completitud de alumnos
 * Campus Virtual Centuria
 *
 * Acciones:
 *   list_forms          — Admin/Académico: lista todas las plantillas de formularios
 *   list_by_career      — Admin/Académico: formularios de una carrera específica
 *   create              — Admin: crear plantilla
 *   update              — Admin: actualizar plantilla
 *   delete              — Admin: eliminar plantilla
 *   my_forms            — Alumno: sus formularios asignados
 *   save_data           — Alumno: guardar datos del formulario
 *   completions         — Admin/Académico: estado de completitud de todos los alumnos
 *   detail              — Admin/Académico: detalle de un alumno + formulario
 *   seed                — Admin: sembrar formulario de matrícula
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

$action = $_REQUEST['action'] ?? '';

switch ($action) {

    // ═══════════════════════════════════════════════
    // PLANTILLAS: Listar todas
    // ═══════════════════════════════════════════════
    case 'list_forms':
        $user = require_auth();
        $pdo = db();

        $carrera = $_GET['carrera'] ?? '';
        $sql = "SELECT f.*,
                (SELECT COUNT(*) FROM formularios_alumno fa WHERE fa.formulario_id = f.id) AS total_alumnos,
                (SELECT COUNT(*) FROM formularios_alumno fa WHERE fa.formulario_id = f.id AND fa.estado = 'completado') AS completados
                FROM formularios_carrera f WHERE f.activo = 1";
        $params = [];
        if ($carrera) { $sql .= " AND f.carrera = ?"; $params[] = $carrera; }
        $sql .= " ORDER BY f.created_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        api_response(['formularios' => $rows]);
        break;

    // ═══════════════════════════════════════════════
    // PLANTILLAS: Crear
    // ═══════════════════════════════════════════════
    case 'create':
        $user = require_auth();
        if (!in_array($user->role, ['admin', 'academico', 'administrador_plataforma'])) {
            api_error('No tienes permisos para crear formularios', 403);
        }
        $pdo = db();

        $codigo   = trim($_POST['codigo'] ?? '');
        $nombre   = trim($_POST['nombre'] ?? '');
        $carrera  = trim($_POST['carrera'] ?? '');
        $tipo     = trim($_POST['tipo'] ?? 'matricula');
        $campos   = trim($_POST['campos_json'] ?? '[]');

        if (!$codigo || !$nombre) { api_error('Código y nombre son requeridos'); }

        try {
            $stmt = $pdo->prepare("INSERT INTO formularios_carrera (codigo, nombre, carrera, tipo, campos_json) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$codigo, $nombre, $carrera, $tipo, $campos]);
            api_response(['status' => 'Exito', 'id' => $pdo->lastInsertId()]);
        } catch (Exception $e) {
            api_error('Error al crear: ' . $e->getMessage(), 500);
        }
        break;

    // ═══════════════════════════════════════════════
    // PLANTILLAS: Actualizar
    // ═══════════════════════════════════════════════
    case 'update':
        $user = require_auth();
        if (!in_array($user->role, ['admin', 'academico', 'administrador_plataforma'])) {
            api_error('No tienes permisos', 403);
        }
        $pdo = db();
        $id = $_POST['id'] ?? 0;
        if (!$id) api_error('ID requerido');

        $fields = [];
        $params = [];
        foreach (['codigo', 'nombre', 'carrera', 'tipo', 'campos_json'] as $f) {
            if (isset($_POST[$f])) {
                $fields[] = "$f = ?";
                $params[] = trim($_POST[$f]);
            }
        }
        if (!$fields) api_error('Sin cambios');
        $fields[] = "updated_at = datetime('now')";
        $params[] = $id;

        $stmt = $pdo->prepare("UPDATE formularios_carrera SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);
        api_response(['status' => 'Exito']);
        break;

    // ═══════════════════════════════════════════════
    // PLANTILLAS: Eliminar (soft delete)
    // ═══════════════════════════════════════════════
    case 'delete':
        $user = require_auth();
        if ($user->role !== 'admin') api_error('Solo admin puede eliminar', 403);
        $pdo = db();
        $id = $_POST['id'] ?? 0;
        $pdo->prepare("UPDATE formularios_carrera SET activo = 0, updated_at = datetime('now') WHERE id = ?")->execute([$id]);
        api_response(['status' => 'Exito']);
        break;

    // ═══════════════════════════════════════════════
    // ALUMNO: Mis formularios
    // ═══════════════════════════════════════════════
    case 'my_forms':
        $user = require_auth();
        $pdo = db();
        $uid = $user->user_id;

        // Obtener carrera del alumno
        $stmtU = $pdo->prepare("SELECT carrera FROM users WHERE id = ?");
        $stmtU->execute([$uid]);
        $carrera = ($stmtU->fetch(PDO::FETCH_ASSOC))['carrera'] ?? '';

        // Formularios de su carrera (o todos si no tiene carrera)
        $sql = "SELECT f.*, 
                (SELECT fa.estado FROM formularios_alumno fa WHERE fa.formulario_id = f.id AND fa.user_id = ?) AS mi_estado,
                (SELECT fa.datos_json FROM formularios_alumno fa WHERE fa.formulario_id = f.id AND fa.user_id = ?) AS mis_datos,
                (SELECT fa.id FROM formularios_alumno fa WHERE fa.formulario_id = f.id AND fa.user_id = ?) AS mi_registro_id
                FROM formularios_carrera f WHERE f.activo = 1";
        $params = [$uid, $uid, $uid];
        if ($carrera) { $sql .= " AND (f.carrera = ? OR f.carrera = '')"; $params[] = $carrera; }
        $sql .= " ORDER BY f.created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        api_response(['formularios' => $rows]);
        break;

    // ═══════════════════════════════════════════════
    // ALUMNO: Guardar datos del formulario
    // ═══════════════════════════════════════════════
    case 'save_data':
        $user = require_auth();
        $pdo = db();
        $uid = $user->user_id;
        $fid = $_POST['formulario_id'] ?? 0;
        $datos = $_POST['datos_json'] ?? '{}';
        if (!$fid) api_error('formulario_id requerido');

        // Obtener cédula del usuario
        $stmtU = $pdo->prepare("SELECT username, carrera FROM users WHERE id = ?");
        $stmtU->execute([$uid]);
        $urow = $stmtU->fetch(PDO::FETCH_ASSOC);
        $cedula = $urow['username'] ?? '';

        // Upsert: insertar o actualizar
        $check = $pdo->prepare("SELECT id FROM formularios_alumno WHERE user_id = ? AND formulario_id = ?");
        $check->execute([$uid, $fid]);
        $existing = $check->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $stmt = $pdo->prepare("UPDATE formularios_alumno SET datos_json = ?, estado = 'completado', completado_at = datetime('now'), updated_at = datetime('now') WHERE id = ?");
            $stmt->execute([$datos, $existing['id']]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO formularios_alumno (user_id, formulario_id, cedula, estado, datos_json, completado_at) VALUES (?, ?, ?, 'completado', ?, datetime('now'))");
            $stmt->execute([$uid, $fid, $cedula, $datos]);
        }
        api_response(['status' => 'Exito', 'message' => 'Formulario guardado correctamente']);
        break;

    // ═══════════════════════════════════════════════
    // ADMIN/ACADÉMICO: Completitud general
    // ═══════════════════════════════════════════════
    case 'completions':
        $user = require_auth();
        if (!in_array($user->role, ['admin', 'academico', 'administrador_plataforma'])) {
            api_error('No tienes permisos', 403);
        }
        $pdo = db();

        $fid = $_GET['formulario_id'] ?? 0;
        $sql = "SELECT fa.*, 
                u.username AS cedula, u.firstname, u.lastname, u.carrera, u.seccion, u.grado,
                f.nombre AS formulario_nombre
                FROM formularios_alumno fa
                JOIN users u ON fa.user_id = u.id
                JOIN formularios_carrera f ON fa.formulario_id = f.id";
        $params = [];
        if ($fid) { $sql .= " WHERE fa.formulario_id = ?"; $params[] = $fid; }
        $sql .= " ORDER BY u.lastname, u.firstname";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        api_response(['completions' => $rows]);
        break;

    // ═══════════════════════════════════════════════
    // ADMIN/ACADÉMICO: Detalle de un alumno
    // ═══════════════════════════════════════════════
    case 'detail':
        $user = require_auth();
        if (!in_array($user->role, ['admin', 'academico', 'administrador_plataforma'])) {
            api_error('No tienes permisos', 403);
        }
        $pdo = db();
        $cedula = $_GET['cedula'] ?? '';
        if (!$cedula) api_error('Cédula requerida');

        $stmtU = $pdo->prepare("SELECT id, username, firstname, lastname, email, telefono, grado, carrera, seccion, estado FROM users WHERE username = ?");
        $stmtU->execute([$cedula]);
        $alumno = $stmtU->fetch(PDO::FETCH_ASSOC);
        if (!$alumno) api_error('Alumno no encontrado', 404);

        $stmtF = $pdo->prepare("SELECT fa.*, f.codigo, f.nombre AS formulario_nombre, f.tipo FROM formularios_alumno fa JOIN formularios_carrera f ON fa.formulario_id = f.id WHERE fa.user_id = ?");
        $stmtF->execute([$alumno['id']]);
        $formularios = $stmtF->fetchAll(PDO::FETCH_ASSOC);

        api_response(['alumno' => $alumno, 'formularios' => $formularios]);
        break;

    // ═══════════════════════════════════════════════
    // ADMIN: Sembrar formulario de matrícula
    // ═══════════════════════════════════════════════
    case 'seed':
        $user = require_auth();
        if ($user->role !== 'admin') api_error('Solo admin', 403);
        $pdo = db();

        // Verificar si ya existe
        $check = $pdo->query("SELECT id FROM formularios_carrera WHERE codigo = 'CEN-AS-SM-AGP005'")->fetch();
        if ($check) {
            api_response(['status' => 'Ya existe', 'id' => $check['id']]);
            break;
        }

        $campos = json_encode([
            ['key' => 'apellido_paterno', 'label' => 'Apellido Paterno', 'type' => 'text', 'required' => true, 'section' => 'datos_personales'],
            ['key' => 'apellido_materno', 'label' => 'Apellido Materno', 'type' => 'text', 'required' => false, 'section' => 'datos_personales'],
            ['key' => 'nombres', 'label' => 'Nombres', 'type' => 'text', 'required' => true, 'section' => 'datos_personales'],
            ['key' => 'sexo', 'label' => 'Sexo', 'type' => 'select', 'options' => ['M', 'F'], 'required' => true, 'section' => 'datos_personales'],
            ['key' => 'nacimiento', 'label' => 'Fecha de Nacimiento', 'type' => 'date', 'required' => true, 'section' => 'datos_personales'],
            ['key' => 'lugar_nacimiento', 'label' => 'Lugar de Nacimiento', 'type' => 'text', 'required' => false, 'section' => 'datos_personales'],
            ['key' => 'nacionalidad', 'label' => 'Nacionalidad', 'type' => 'text', 'required' => true, 'section' => 'datos_personales'],
            ['key' => 'estado_civil', 'label' => 'Estado Civil', 'type' => 'select', 'options' => ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión de hecho'], 'required' => true, 'section' => 'datos_personales'],
            ['key' => 'direccion', 'label' => 'Dirección Domiciliaria', 'type' => 'text', 'required' => true, 'section' => 'datos_personales'],
            ['key' => 'email', 'label' => 'Email Personal', 'type' => 'email', 'required' => true, 'section' => 'datos_personales'],
            ['key' => 'telefono', 'label' => 'Teléfono / Celular', 'type' => 'text', 'required' => true, 'section' => 'datos_personales'],

            ['key' => 'cedula', 'label' => 'Nro. Cédula / Pasaporte', 'type' => 'text', 'required' => true, 'section' => 'datos_institucionales'],
            ['key' => 'libreta_militar', 'label' => 'Nro. Libreta Militar', 'type' => 'text', 'required' => false, 'section' => 'datos_institucionales'],
            ['key' => 'sangre', 'label' => 'Tipo de Sangre', 'type' => 'select', 'options' => ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'], 'required' => true, 'section' => 'datos_institucionales'],
            ['key' => 'discapacidad', 'label' => '¿Posee alguna discapacidad?', 'type' => 'select', 'options' => ['No', 'Si'], 'required' => true, 'section' => 'datos_institucionales'],
            ['key' => 'carrera', 'label' => 'Carrera que va a cursar', 'type' => 'text', 'required' => true, 'section' => 'datos_institucionales'],
            ['key' => 'semestre', 'label' => 'Semestre / Nivel', 'type' => 'text', 'required' => true, 'section' => 'datos_institucionales'],

            ['key' => 'padre_nombre', 'label' => 'Nombre del Padre', 'type' => 'text', 'required' => false, 'section' => 'info_opcional'],
            ['key' => 'padre_ocupacion', 'label' => 'Ocupación del Padre', 'type' => 'text', 'required' => false, 'section' => 'info_opcional'],
            ['key' => 'madre_nombre', 'label' => 'Nombre de la Madre', 'type' => 'text', 'required' => false, 'section' => 'info_opcional'],
            ['key' => 'madre_ocupacion', 'label' => 'Ocupación de la Madre', 'type' => 'text', 'required' => false, 'section' => 'info_opcional'],
            ['key' => 'emergencia_contacto', 'label' => 'Contacto de Emergencia', 'type' => 'text', 'required' => false, 'section' => 'info_opcional'],
            ['key' => 'emergencia_telefono', 'label' => 'Tel. Emergencia', 'type' => 'text', 'required' => false, 'section' => 'info_opcional'],

            ['key' => 'declaracion_veraz', 'label' => 'Declaración de veracidad', 'type' => 'checkbox', 'required' => true, 'section' => 'declaracion'],
            ['key' => 'firma_alumno', 'label' => 'Firma del Alumno', 'type' => 'text', 'required' => true, 'section' => 'firma']
        ]);

        $stmt = $pdo->prepare("INSERT INTO formularios_carrera (codigo, nombre, carrera, tipo, campos_json) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            'CEN-AS-SM-AGP005',
            'Formulario de Matrícula — Instituto Superior Centuria',
            '',
            'matricula',
            $campos
        ]);
        api_response(['status' => 'Exito', 'id' => $pdo->lastInsertId(), 'message' => 'Formulario de matrícula sembrado correctamente']);
        break;

    default:
        api_error('Acción no válida: ' . $action);
}
