<?php
/**
 * Filiales API — Gestión de sedes/filiales
 * Endpoints:
 *   GET  ?action=list           → Todas las filiales
 *   GET  ?action=get&id=X       → Detalle de filial
 *   POST ?action=create         → Crear filial
 *   POST ?action=update         → Actualizar filial
 *   POST ?action=delete         → Desactivar filial
 *   POST ?action=assign-admin   → Asignar admin a filial
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

// ═══ LISTAR FILIALES ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'list') {
    $auth = require_auth();
    $pdo = db();
    $stmt = $pdo->query("SELECT * FROM filiales WHERE activo = 1 ORDER BY nombre");
    $filiales = $stmt->fetchAll(PDO::FETCH_ASSOC);
    api_response(['filiales' => $filiales, 'total' => count($filiales)]);
}

// ═══ OBTENER FILIAL ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get') {
    $auth = require_auth();
    $id = intval($_GET['id'] ?? 0);
    $pdo = db();
    $stmt = $pdo->prepare("SELECT * FROM filiales WHERE id = ?");
    $stmt->execute([$id]);
    $filial = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($filial) {
        api_response(['filial' => $filial]);
    } else {
        api_error('Filial no encontrada', 404);
    }
}

// ═══ CREAR FILIAL ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'create') {
    $auth = require_auth();
    if ($auth->role !== 'admin') {
        api_error('Solo administradores pueden crear filiales', 403);
    }
    
    $nombre = trim($_POST['nombre'] ?? '');
    $codigo = strtoupper(trim($_POST['codigo'] ?? ''));
    $direccion = trim($_POST['direccion'] ?? '');
    $telefono = trim($_POST['telefono'] ?? '');
    
    if (empty($nombre) || empty($codigo)) {
        api_error('Nombre y código requeridos', 400);
    }
    
    $pdo = db();
    try {
        $stmt = $pdo->prepare("INSERT INTO filiales (nombre, codigo, direccion, telefono, creado_por) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$nombre, $codigo, $direccion, $telefono, $auth->username]);
        api_response(['status' => 'Exito', 'filial_id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        api_error('Filial ya existe', 409);
    }
}

// ═══ ACTUALIZAR FILIAL ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'update') {
    $auth = require_auth();
    if ($auth->role !== 'admin') {
        api_error('Solo administradores pueden actualizar filiales', 403);
    }
    
    $id = intval($_POST['id'] ?? 0);
    $nombre = trim($_POST['nombre'] ?? '');
    $codigo = strtoupper(trim($_POST['codigo'] ?? ''));
    $direccion = trim($_POST['direccion'] ?? '');
    $telefono = trim($_POST['telefono'] ?? '');
    
    $pdo = db();
    $stmt = $pdo->prepare("UPDATE filiales SET nombre=?, codigo=?, direccion=?, telefono=? WHERE id=?");
    $stmt->execute([$nombre, $codigo, $direccion, $telefono, $id]);
    api_response(['status' => 'Exito']);
}

// ═══ DESACTIVAR FILIAL ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'delete') {
    $auth = require_auth();
    if ($auth->role !== 'admin') {
        api_error('Solo administradores pueden desactivar filiales', 403);
    }
    
    $id = intval($_POST['id'] ?? 0);
    $pdo = db();
    $stmt = $pdo->prepare("UPDATE filiales SET activo=0 WHERE id=?");
    $stmt->execute([$id]);
    api_response(['status' => 'Exito']);
}

// ═══ ASIGNAR ADMIN A FILIAL ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'assign-admin') {
    $auth = require_auth();
    if ($auth->role !== 'admin') {
        api_error('Solo administradores pueden asignar admins', 403);
    }
    
    $user_id = intval($_POST['user_id'] ?? 0);
    $filial_id = intval($_POST['filial_id'] ?? 0);
    $rol = trim($_POST['rol'] ?? 'administrador_plataforma');
    
    $pdo = db();
    
    // Verificar que el usuario existe
    $stmt = $pdo->prepare("SELECT id, username, role FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        api_error('Usuario no encontrado', 404);
    }
    
    // Verificar que la filial existe
    $stmt = $pdo->prepare("SELECT id, nombre FROM filiales WHERE id = ?");
    $stmt->execute([$filial_id]);
    $filial = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$filial) {
        api_error('Filial no encontrada', 404);
    }
    
    // Actualizar el role del usuario en user_roles
    $stmt = $pdo->prepare("UPDATE user_roles SET rol = ?, filial = ?, estado = 'activo' WHERE user_id = ? AND rol = ?");
    $stmt->execute([$rol, $filial['nombre'], $user_id, 'administrador_plataforma']);
    
    // Si no tiene ese role, insertar
    if ($stmt->rowCount() === 0) {
        $stmt = $pdo->prepare("INSERT INTO user_roles (user_id, rol, filial, estado, asignado_por) VALUES (?, ?, ?, 'activo', ?)");
        $stmt->execute([$user_id, $rol, $filial['nombre'], $auth->username]);
    }
    
    api_response(['status' => 'Exito', 'mensaje' => 'Admin asignado a ' . $filial['nombre']]);
}

// ═══ LISTAR ADMINS POR FILIAL ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'admins-by-filial') {
    $auth = require_auth();
    $pdo = db();
    
    $stmt = $pdo->query("
        SELECT ur.user_id, u.username, u.firstname, u.lastname, ur.rol, ur.filial, f.nombre as filial_nombre
        FROM user_roles ur
        JOIN users u ON ur.user_id = u.id
        LEFT JOIN filiales f ON ur.filial = f.nombre
        WHERE ur.rol IN ('administrador_plataforma', 'admin') AND ur.estado = 'activo'
        ORDER BY f.nombre, u.firstname
    ");
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    api_response(['admins' => $admins, 'total' => count($admins)]);
}
