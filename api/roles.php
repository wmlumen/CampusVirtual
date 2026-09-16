<?php
/**
 * Roles API — Catálogo de roles con permisos
 * Endpoints:
 *   GET  ?action=list           → Todos los roles del catálogo
 *   POST ?action=create         → Crear nuevo rol
 *   POST ?action=update         → Editar rol
 *   POST ?action=delete         → Desactivar rol
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

// ═══ LISTAR ROLES ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'list') {
    $auth = require_auth();
    $pdo = db();
    $stmt = $pdo->query("SELECT * FROM roles_config WHERE activo = 1 ORDER BY nombre");
    $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // Decodificar permisos JSON
    foreach ($roles as &$r) {
        $r['permisos'] = json_decode($r['permisos'], true) ?: [];
    }
    unset($r);
    api_response(['roles' => $roles, 'total' => count($roles)]);
}

// ═══ CREAR ROL ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'create') {
    $auth = require_auth();
    if ($auth->role !== 'admin') api_error('Solo administradores', 403);

    $nombre    = trim($_POST['nombre'] ?? '');
    $desc      = trim($_POST['descripcion'] ?? '');
    $permisos  = $_POST['permisos'] ?? '{}';
    $color     = trim($_POST['color'] ?? '#64748b');
    $icono     = trim($_POST['icono'] ?? 'bi-person');
    $base_rol  = trim($_POST['base_rol'] ?? '');
    if (!in_array($base_rol, ['', 'alumno', 'docente', 'academico', 'admin'])) $base_rol = '';

    if (empty($nombre)) api_error('Nombre requerido', 400);

    // Si permisos viene como string JSON, decodificar
    if (is_string($permisos)) {
        $permisosArr = json_decode($permisos, true) ?: [];
    } else {
        $permisosArr = $permisos;
    }

    $pdo = db();
    try { $pdo->exec("ALTER TABLE roles_config ADD COLUMN base_rol TEXT DEFAULT ''"); } catch (Exception $e) {}
    $stmt = $pdo->prepare("INSERT INTO roles_config (nombre, descripcion, permisos, color, icono, base_rol) VALUES (?,?,?,?,?,?)");
    try {
        $stmt->execute([$nombre, $desc, json_encode($permisosArr), $color, $icono, $base_rol]);
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'UNIQUE') !== false) api_error('Ya existe un rol con ese nombre', 409);
        api_error('Error: ' . $e->getMessage(), 500);
    }

    api_response(['status' => 'Éxito', 'mensaje' => 'Rol creado', 'id' => $pdo->lastInsertId()]);
}

// ═══ EDITAR ROL ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'update') {
    $auth = require_auth();
    if ($auth->role !== 'admin') api_error('Solo administradores', 403);

    $roleId   = intval($_POST['id'] ?? 0);
    $nombre   = trim($_POST['nombre'] ?? '');
    $desc     = trim($_POST['descripcion'] ?? '');
    $permisos = $_POST['permisos'] ?? '{}';
    $color    = trim($_POST['color'] ?? '#64748b');
    $icono    = trim($_POST['icono'] ?? 'bi-person');
    $base_rol  = trim($_POST['base_rol'] ?? '');
    if (!in_array($base_rol, ['', 'alumno', 'docente', 'academico', 'admin'])) $base_rol = '';

    if (!$roleId) api_error('ID requerido', 400);

    if (is_string($permisos)) {
        $permisosArr = json_decode($permisos, true) ?: [];
    } else {
        $permisosArr = $permisos;
    }

    $pdo = db();
    try { $pdo->exec("ALTER TABLE roles_config ADD COLUMN base_rol TEXT DEFAULT ''"); } catch (Exception $e) {}
    $stmt = $pdo->prepare("UPDATE roles_config SET nombre=?, descripcion=?, permisos=?, color=?, icono=?, base_rol=? WHERE id=?");
    try {
        $stmt->execute([$nombre, $desc, json_encode($permisosArr), $color, $icono, $base_rol, $roleId]);
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'UNIQUE') !== false) api_error('Ya existe un rol con ese nombre', 409);
        api_error('Error', 500);
    }

    if ($stmt->rowCount() == 0) api_error('No encontrado', 404);
    api_response(['status' => 'Éxito', 'mensaje' => 'Rol actualizado']);
}

// ═══ DESACTIVAR ROL ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'delete') {
    $auth = require_auth();
    if ($auth->role !== 'admin') api_error('Solo administradores', 403);

    $roleId = intval($_POST['id'] ?? 0);
    if (!$roleId) api_error('ID requerido', 400);

    $pdo = db();
    $stmt = $pdo->prepare("UPDATE roles_config SET activo = 0 WHERE id = ?");
    $stmt->execute([$roleId]);

    if ($stmt->rowCount() == 0) api_error('No encontrado', 404);
    api_response(['status' => 'Éxito', 'mensaje' => 'Rol desactivado']);
}
