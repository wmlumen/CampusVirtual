<?php
/**
 * Usuarios API — Gestión completa de usuarios registrados
 * Endpoints:
 *   GET  ?action=list         → Todos los usuarios con sus roles
 *   GET  ?action=pendientes   → Usuarios que se registraron pendientes de aprobación
 *   GET  ?action=get&id=X     → Detalle de un usuario + todos sus roles
 *   POST ?action=update       → Editar datos del usuario
 *   POST ?action=aprobar      → Aprobar un usuario pendiente → crear en users + user_roles
 *   POST ?action=rechazar     → Rechazar un usuario pendiente
 *   POST ?action=add_role     → Asignar un rol adicional a un usuario
 *   POST ?action=remove_role  → Quitar un rol a un usuario
 *   POST ?action=update_role  → Editar un rol asignado
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

function ensureUserColumns($pdo) {
    // Asegurar columnas extras en users
    $cols = $pdo->query("PRAGMA table_info(users)")->fetchAll(PDO::FETCH_COLUMN, 1);
    $extras = [
        'telefono' => "ALTER TABLE users ADD COLUMN telefono TEXT DEFAULT ''",
        'grado'    => "ALTER TABLE users ADD COLUMN grado TEXT DEFAULT ''",
        'carrera'  => "ALTER TABLE users ADD COLUMN carrera TEXT DEFAULT ''",
        'seccion'  => "ALTER TABLE users ADD COLUMN seccion TEXT DEFAULT ''",
        'foto'     => "ALTER TABLE users ADD COLUMN foto TEXT DEFAULT ''",
        'estado'   => "ALTER TABLE users ADD COLUMN estado TEXT DEFAULT 'activo'",
        'provisional_password' => "ALTER TABLE users ADD COLUMN provisional_password TEXT DEFAULT ''",
        'must_change_password' => "ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0",
        'password_updated_at'  => "ALTER TABLE users ADD COLUMN password_updated_at DATETIME",
        'uuid'        => "ALTER TABLE users ADD COLUMN uuid TEXT DEFAULT ''",
        'last_login'  => "ALTER TABLE users ADD COLUMN last_login DATETIME",
        'deleted_at'  => "ALTER TABLE users ADD COLUMN deleted_at DATETIME",
        'sync_version'=> "ALTER TABLE users ADD COLUMN sync_version INTEGER DEFAULT 1",
        'sync_status' => "ALTER TABLE users ADD COLUMN sync_status TEXT DEFAULT 'sincronizado'"
    ];
    foreach ($extras as $col => $sql) {
        if (!in_array($col, $cols)) {
            try { $pdo->exec($sql); } catch (Exception $e) {}
        }
    }
}

// ═══ LISTAR TODOS LOS USUARIOS CON SUS ROLES ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'list') {
    $auth = require_auth();
    $pdo = db();
    ensureUserColumns($pdo);

    $stmt = $pdo->query("
        SELECT u.id, u.username AS cedula, u.firstname, u.lastname, u.email,
               u.telefono, u.grado, u.carrera, u.seccion, u.foto,
               u.estado, u.role AS role_sistema, u.created_at
        FROM users u
        ORDER BY u.created_at DESC
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Cargar roles de cada usuario
    $stmtRoles = $pdo->prepare("SELECT * FROM user_roles WHERE user_id = ? ORDER BY id");
    foreach ($users as &$u) {
        $stmtRoles->execute([$u['id']]);
        $u['roles'] = $stmtRoles->fetchAll(PDO::FETCH_ASSOC);
        $u['nombre_completo'] = trim($u['firstname'] . ' ' . $u['lastname']);
    }
    unset($u);

    api_response(['usuarios' => $users, 'total' => count($users)]);
}

// ═══ USUARIOS PENDIENTES DE APROBACIÓN ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'pendientes') {
    $auth = require_auth();
    $pdo = db();

    $stmt = $pdo->query("SELECT * FROM usuarios_pendientes WHERE estado = 'pendiente' ORDER BY created_at DESC");
    $pendientes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    api_response(['pendientes' => $pendientes, 'total' => count($pendientes)]);
}

// ═══ DETALLE DE USUARIO ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get') {
    $auth = require_auth();
    $userId = intval($_GET['id'] ?? 0);
    if (!$userId) api_error('ID requerido', 400);

    $pdo = db();
    ensureUserColumns($pdo);

    $stmt = $pdo->prepare("
        SELECT u.id, u.username AS cedula, u.firstname, u.lastname, u.email,
               u.telefono, u.grado, u.carrera, u.seccion, u.foto,
               u.estado, u.role AS role_sistema, u.created_at
        FROM users u WHERE u.id = ?
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) api_error('Usuario no encontrado', 404);

    $stmtRoles = $pdo->prepare("SELECT * FROM user_roles WHERE user_id = ?");
    $stmtRoles->execute([$userId]);
    $user['roles'] = $stmtRoles->fetchAll(PDO::FETCH_ASSOC);
    $user['nombre_completo'] = trim($user['firstname'] . ' ' . $user['lastname']);

    api_response(['usuario' => $user]);
}

// ═══ EDITAR DATOS DEL USUARIO ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'update') {
    $auth = require_auth();
    if ($auth->role !== 'admin') api_error('Solo administradores', 403);

    $userId = intval($_POST['id'] ?? 0);
    if (!$userId) api_error('ID requerido', 400);

    $pdo = db();
    ensureUserColumns($pdo);

    $firstname = trim($_POST['firstname'] ?? '');
    $lastname  = trim($_POST['lastname'] ?? '');
    $email     = trim($_POST['email'] ?? '');
    $telefono  = trim($_POST['telefono'] ?? '');
    $grado     = trim($_POST['grado'] ?? '');
    $carrera   = trim($_POST['carrera'] ?? '');
    $seccion   = trim($_POST['seccion'] ?? '');
    $estado    = trim($_POST['estado'] ?? 'activo');

    if ($firstname) {
        $stmt = $pdo->prepare("UPDATE users SET firstname=?, lastname=?, email=?, telefono=?, grado=?, carrera=?, seccion=?, estado=?, updated_at=datetime('now') WHERE id=?");
        $stmt->execute([$firstname, $lastname, $email, $telefono, $grado, $carrera, $seccion, $estado, $userId]);
    }

    api_response(['status' => 'Éxito', 'mensaje' => 'Usuario actualizado']);
}

// ═══ APROBAR USUARIO PENDIENTE ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'aprobar') {
    $auth = require_auth();
    if ($auth->role !== 'admin') api_error('Solo administradores', 403);

    $pendienteId = intval($_POST['id'] ?? 0);
    $rolAsignar  = trim($_POST['rol'] ?? 'alumno');
    if (!$pendienteId) api_error('ID requerido', 400);

    $pdo = db();
    ensureUserColumns($pdo);

    // Obtener datos del pendiente
    $stmt = $pdo->prepare("SELECT * FROM usuarios_pendientes WHERE id = ? AND estado = 'pendiente'");
    $stmt->execute([$pendienteId]);
    $p = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$p) api_error('Pendiente no encontrado o ya procesado', 404);

    // Verificar si ya existe en users
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$p['cedula']]);
    if ($stmt->fetchColumn()) {
        api_error('Ya existe un usuario con cédula ' . $p['cedula'], 409);
    }

    // Crear en tabla users
    $password = $p['nombre'][0] . strtolower($p['apellido'][0]) . $p['cedula'] . '*';
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO users (username, password, firstname, lastname, email, role, telefono, grado, carrera, seccion, foto, estado) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $p['cedula'], $hash,
        strtoupper($p['nombre']), strtoupper($p['apellido']),
        $p['email'], normalize_role($rolAsignar),
        $p['telefono'], $p['grado'], $p['carrera'], $p['seccion'], $p['foto'],
        'activo'
    ]);
    $newUserId = $pdo->lastInsertId();

    // Asignar rol en user_roles
    $stmt = $pdo->prepare("INSERT INTO user_roles (user_id, rol, carrera, seccion, asignado_por, estado) VALUES (?,?,?,?,?,?)");
    $stmt->execute([$newUserId, $rolAsignar, $p['carrera'], $p['seccion'], $auth->username, 'activo']);

    // Marcar como aprobado
    $stmt = $pdo->prepare("UPDATE usuarios_pendientes SET estado='aprobado', revisado_por=?, reviewed_at=datetime('now') WHERE id=?");
    $stmt->execute([$auth->username, $pendienteId]);

    api_response([
        'status' => 'Éxito',
        'mensaje' => $p['nombre'] . ' ' . $p['apellido'] . ' aprobado como ' . $rolAsignar,
        'user_id' => $newUserId,
        'password_generado' => $password
    ]);
}

// ═══ RECHAZAR USUARIO PENDIENTE ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'rechazar') {
    $auth = require_auth();
    if ($auth->role !== 'admin') api_error('Solo administradores', 403);

    $pendienteId = intval($_POST['id'] ?? 0);
    if (!$pendienteId) api_error('ID requerido', 400);

    $pdo = db();
    $stmt = $pdo->prepare("UPDATE usuarios_pendientes SET estado='rechazado', revisado_por=?, reviewed_at=datetime('now') WHERE id=? AND estado='pendiente'");
    $stmt->execute([$auth->username, $pendienteId]);

    if ($stmt->rowCount() == 0) api_error('No encontrado o ya procesado', 404);
    api_response(['status' => 'Éxito', 'mensaje' => 'Registro rechazado']);
}

// Rol sistema máximo según roles activos (bilingüe + equivalencia de personalizados)
function max_system_role($pdo, $userId) {
    $jerarquia = ['admin' => 4, 'administrador_plataforma' => 4, 'academico' => 3, 'academic' => 3,
                  'docente' => 2, 'teacher' => 2, 'alumno' => 1, 'student' => 1];
    $stmt = $pdo->prepare("SELECT DISTINCT rol FROM user_roles WHERE user_id = ? AND estado = 'activo'");
    $stmt->execute([$userId]);
    $max = 'student';
    foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $r) {
        $er = normalize_role($r);
        if ($er === 'student') {
            $b = $pdo->prepare("SELECT base_rol FROM roles_config WHERE nombre = ?");
            $b->execute([$r]);
            if ($base = $b->fetchColumn()) $er = normalize_role($base);
        }
        if (isset($jerarquia[$er]) && $jerarquia[$er] > ($jerarquia[$max] ?? 0)) $max = $er;
    }
    return $max;
}

// ═══ AGREGAR ROL ADICIONAL ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'add_role') {
    $auth = require_auth();
    if ($auth->role !== 'admin') api_error('Solo administradores', 403);

    $userId = intval($_POST['user_id'] ?? 0);
    $rol    = trim($_POST['rol'] ?? '');
    $carrera = trim($_POST['carrera'] ?? '');
    $seccion = trim($_POST['seccion'] ?? '');
    $asignatura = trim($_POST['asignatura'] ?? '');

    if (!$userId || !$rol) api_error('user_id y rol requeridos', 400);

    $pdo = db();

    // Verificar que no tenga ya ese rol en esa carrera
    $stmt = $pdo->prepare("SELECT id FROM user_roles WHERE user_id = ? AND rol = ? AND carrera = ? AND estado = 'activo'");
    $stmt->execute([$userId, $rol, $carrera]);
    if ($stmt->fetchColumn()) {
        api_error('Ya tiene el rol ' . $rol . ' en esa carrera', 409);
    }

    $stmt = $pdo->prepare("INSERT INTO user_roles (user_id, rol, carrera, seccion, asignatura, asignado_por, estado) VALUES (?,?,?,?,?,?,?)");
    $stmt->execute([$userId, $rol, $carrera, $seccion, $asignatura, $auth->username, 'activo']);

    // Actualizar role_sistema al más alto (incluye equivalencias)
    $pdo->prepare("UPDATE users SET role = ? WHERE id = ?")->execute([max_system_role($pdo, $userId), $userId]);

    api_response(['status' => 'Éxito', 'mensaje' => 'Rol asignado', 'role_id' => $pdo->lastInsertId()]);
}

// ═══ PERMISOS EFECTIVOS (roles base + personalizados con equivalencia) ═══
// Admin ve cualquiera; un usuario ve los suyos. Para puertas como Tesorería.
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'permisos') {
    $auth = require_auth();
    $cedula = trim($_GET['cedula'] ?? '');
    if ($cedula === '') api_error('Cédula requerida', 400);
    if (!in_array($auth->role, ['admin','administrador_plataforma']) && $auth->username !== $cedula) {
        api_error('Solo administradores o el propio usuario', 403);
    }

    $pdo = db();
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$cedula]);
    $uid = $stmt->fetchColumn();
    if (!$uid) api_error('Usuario no encontrado', 404);

    // Permisos base según rol sistema
    $basePerms = [
        'student' => ['ver_cursos','ver_notas','ver_asistencia','ver_calendario','ver_documentos'],
        'alumno'  => ['ver_cursos','ver_notas','ver_asistencia','ver_calendario','ver_documentos'],
        'teacher' => ['ver_cursos','editar_cursos','ver_notas','editar_notas','ver_asistencia','editar_asistencia','ver_calendario','ver_documentos','ver_reportes'],
        'docente' => ['ver_cursos','editar_cursos','ver_notas','editar_notas','ver_asistencia','editar_asistencia','ver_calendario','ver_documentos','ver_reportes'],
        'academic' => ['ver_cursos','ver_notas','ver_asistencia','ver_calendario','ver_documentos','ver_reportes','gestionar_docentes'],
        'academico' => ['ver_cursos','ver_notas','ver_asistencia','ver_calendario','ver_documentos','ver_reportes','gestionar_docentes'],
        'admin' => ['*'],
        'administrador_plataforma' => ['*'],
    ];

    $stmt = $pdo->prepare("SELECT rol FROM user_roles WHERE user_id = ? AND estado = 'activo'");
    $stmt->execute([$uid]);
    $roles = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $permisos = [];
    $detalle = [];
    foreach ($roles as $r) {
        $rl = mb_strtolower(trim($r), 'UTF-8');
        if (isset($basePerms[$rl])) {
            $permisos = array_merge($permisos, $basePerms[$rl]);
            $detalle[] = ['rol' => $r, 'origen' => 'base'];
        } else {
            $c = $pdo->prepare("SELECT permisos, base_rol FROM roles_config WHERE nombre = ?");
            $c->execute([$r]);
            if ($cfg = $c->fetch(PDO::FETCH_ASSOC)) {
                $pp = json_decode($cfg['permisos'] ?? '[]', true) ?: [];
                $permisos = array_merge($permisos, $pp);
                if (!empty($cfg['base_rol'])) {
                    $b = mb_strtolower(trim($cfg['base_rol']), 'UTF-8');
                    if (isset($basePerms[$b])) $permisos = array_merge($permisos, $basePerms[$b]);
                }
                $detalle[] = ['rol' => $r, 'origen' => 'personalizado'];
            } else {
                $detalle[] = ['rol' => $r, 'origen' => 'desconocido'];
            }
        }
    }
    $permisos = array_values(array_unique($permisos));

    api_response(['roles' => $roles, 'permisos' => $permisos, 'detalle' => $detalle]);
}

// ═══ QUITAR ROL ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'remove_role') {
    $auth = require_auth();
    if ($auth->role !== 'admin') api_error('Solo administradores', 403);

    $roleId = intval($_POST['role_id'] ?? 0);
    if (!$roleId) api_error('role_id requerido', 400);

    $pdo = db();

    // Obtener info del rol antes de borrar
    $stmt = $pdo->prepare("SELECT user_id FROM user_roles WHERE id = ?");
    $stmt->execute([$roleId]);
    $userId = $stmt->fetchColumn();
    if (!$userId) api_error('Rol no encontrado', 404);

    $stmt = $pdo->prepare("DELETE FROM user_roles WHERE id = ?");
    $stmt->execute([$roleId]);

    // Recalcular role_sistema (incluye equivalencias)
    $pdo->prepare("UPDATE users SET role = ? WHERE id = ?")->execute([max_system_role($pdo, $userId), $userId]);

    api_response(['status' => 'Éxito', 'mensaje' => 'Rol eliminado']);
}

// ═══ EDITAR ROL ASIGNADO ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'update_role') {
    $auth = require_auth();
    if ($auth->role !== 'admin') api_error('Solo administradores', 403);

    $roleId = intval($_POST['role_id'] ?? 0);
    if (!$roleId) api_error('role_id requerido', 400);

    $carrera    = trim($_POST['carrera'] ?? '');
    $seccion    = trim($_POST['seccion'] ?? '');
    $asignatura = trim($_POST['asignatura'] ?? '');
    $estado     = trim($_POST['estado'] ?? 'activo');

    $pdo = db();
    $stmt = $pdo->prepare("UPDATE user_roles SET carrera=?, seccion=?, asignatura=?, estado=? WHERE id=?");
    $stmt->execute([$carrera, $seccion, $asignatura, $estado, $roleId]);

    if ($stmt->rowCount() == 0) api_error('No encontrado', 404);
    api_response(['status' => 'Éxito', 'mensaje' => 'Rol actualizado']);
}

// ═══ REGISTRO DIRECTO POR ADMIN (sin cola de pendientes) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'registrar_directo') {
    $auth = require_auth();
    if ($auth->role !== 'admin') api_error('Solo administradores', 403);

    $cedula   = trim($_POST['cedula'] ?? '');
    $nombre   = trim($_POST['nombre'] ?? '');
    $apellido = trim($_POST['apellido'] ?? '');
    $email    = trim($_POST['email'] ?? '');
    $telefono = trim($_POST['telefono'] ?? '');
    $grado    = trim($_POST['grado'] ?? '');
    $carrera  = trim($_POST['carrera'] ?? '');
    $seccion  = trim($_POST['seccion'] ?? '');
    $rol      = trim($_POST['rol'] ?? 'alumno');

    if (empty($cedula) || empty($nombre) || empty($apellido)) {
        api_error('Cedula, nombre y apellido requeridos', 400);
    }

    $pdo = db();
    ensureUserColumns($pdo);

    // Verificar que no exista
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$cedula]);
    if ($stmt->fetchColumn()) {
        api_error('Ya existe un usuario con cedula ' . $cedula, 409);
    }

    // Generar password
    $password = $nombre[0] . strtolower($apellido[0]) . $cedula . '*';
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO users (username, password, firstname, lastname, email, role, telefono, grado, carrera, seccion, estado) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $cedula, $hash,
        strtoupper($nombre), strtoupper($apellido),
        $email, normalize_role($rol),
        $telefono, $grado, $carrera, $seccion, 'activo'
    ]);
    $newUserId = $pdo->lastInsertId();

    // Crear rol en user_roles
    $stmt = $pdo->prepare("INSERT INTO user_roles (user_id, rol, carrera, seccion, asignado_por, estado) VALUES (?,?,?,?,?,?)");
    $stmt->execute([$newUserId, $rol, $carrera, $seccion, $auth->username, 'activo']);

    api_response([
        'status' => 'Éxito',
        'mensaje' => strtoupper($nombre) . ' ' . strtoupper($apellido) . ' registrado como ' . $rol,
        'user_id' => $newUserId,
        'password_generado' => $password
    ]);
}

// ═══ #3 ACTUALIZAR PERFIL PROPIO ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'update_profile') {
    $decoded = require_auth();

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;

    $email    = trim($input['email'] ?? '');
    $telefono = trim($input['telefono'] ?? '');
    $grado    = trim($input['grado'] ?? '');
    $carrera  = trim($input['carrera'] ?? '');
    $seccion  = trim($input['seccion'] ?? '');
    $foto     = trim($input['foto'] ?? '');

    $pdo = db();
    $sets = [];
    $vals = [];

    if ($email !== '')    { $sets[] = 'email = ?';    $vals[] = $email; }
    if ($telefono !== '') { $sets[] = 'telefono = ?'; $vals[] = $telefono; }
    if ($grado !== '')    { $sets[] = 'grado = ?';    $vals[] = $grado; }
    if ($carrera !== '')  { $sets[] = 'carrera = ?';  $vals[] = $carrera; }
    if ($seccion !== '')  { $sets[] = 'seccion = ?';  $vals[] = $seccion; }
    if ($foto !== '')     { $sets[] = 'foto = ?';     $vals[] = $foto; }

    if (empty($sets)) {
        api_error('No hay campos para actualizar', 400);
    }

    $sets[] = 'updated_at = CURRENT_TIMESTAMP';
    $vals[] = $decoded->user_id;

    $sql = 'UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($vals);

    api_response(['ok' => true, 'mensaje' => 'Perfil actualizado']);
}
