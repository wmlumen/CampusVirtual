<?php
/**
 * Docente API — Obtener asignaturas asignadas y herramientas del docente
 * El docente solo ve lo que tiene habilitado
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

// ═══ OBTENER ASIGNATURAS DEL DOCENTE ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'my_subjects') {
    $user_id = intval($_GET['user_id'] ?? 0);
    $cedula = $_GET['cedula'] ?? '';
    
    if (!$user_id && !$cedula) api_error('user_id o cédula requerido', 400);
    
    $pdo = db();
    
    // Get user_id from cedula if needed
    if (!$user_id && $cedula) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$cedula]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) api_error('Usuario no encontrado', 404);
        $user_id = $user['id'];
    }
    
    // Get assigned subjects from user_roles
    $stmt = $pdo->prepare("
        SELECT ur.asignatura, ur.carrera, ur.seccion, ur.rol, ur.estado
        FROM user_roles ur
        WHERE ur.user_id = ? AND ur.estado = 'activo' AND ur.rol IN ('docente', 'teacher')
    ");
    $stmt->execute([$user_id]);
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get full subject details from asignaturas table
    $subjects = [];
    foreach ($assignments as $a) {
        if ($a['asignatura']) {
            $stmt2 = $pdo->prepare("SELECT * FROM asignaturas WHERE codigo = ? AND estado = 'activo'");
            $stmt2->execute([$a['asignatura']]);
            $subject = $stmt2->fetch(PDO::FETCH_ASSOC);
            if ($subject) {
                $subject['carrera_asignada'] = $a['carrera'];
                $subject['seccion_asignada'] = $a['seccion'];
                $subjects[] = $subject;
            }
        }
    }
    
    // NO devolver todas las asignaturas si el docente no tiene asignaciones
    // Un docente nuevo sin asignación verá el estado vacío
    
    api_response([
        'subjects' => $subjects,
        'assignments' => $assignments,
        'count' => count($subjects)
    ]);
}

// ═══ ASIGNAR ASIGNATURA A DOCENTE (solo admin) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'assign_subject') {
    $decoded = require_auth();
    if (!in_array($decoded->role, ['admin','administrador_plataforma','academico'])) {
        api_error('Solo administradores pueden asignar cátedras', 403);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;
    $user_id = intval($input['user_id'] ?? 0);
    $asignatura = strtoupper(trim($input['asignatura'] ?? ''));
    $carrera = trim($input['carrera'] ?? '');
    $seccion = trim($input['seccion'] ?? '');
    
    if (!$user_id || !$asignatura) api_error('user_id y asignatura requeridos', 400);
    
    $pdo = db();
    
    // Check if assignment already exists
    $stmt = $pdo->prepare("SELECT id FROM user_roles WHERE user_id = ? AND asignatura = ? AND carrera = ?");
    $stmt->execute([$user_id, $asignatura, $carrera]);
    if ($stmt->fetch()) {
        api_error('Esta asignatura ya está asignada a este docente', 409);
    }
    
    // Create assignment
    $stmt2 = $pdo->prepare("INSERT INTO user_roles (user_id, rol, carrera, seccion, asignatura, estado) VALUES (?, 'docente', ?, ?, ?, 'activo')");
    $stmt2->execute([$user_id, $carrera, $seccion, $asignatura]);
    
    api_response(['status' => 'Éxito', 'mensaje' => 'Asignatura asignada al docente', 'id' => $pdo->lastInsertId()]);
}

// ═══ QUITAR ASIGNATURA A DOCENTE (solo admin) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'unassign_subject') {
    $decoded = require_auth();
    if (!in_array($decoded->role, ['admin','administrador_plataforma','academico'])) {
        api_error('Solo administradores pueden desasignar cátedras', 403);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;
    $id = intval($input['id'] ?? 0);
    if (!$id) api_error('ID requerido', 400);
    
    $pdo = db();
    $stmt = $pdo->prepare("UPDATE user_roles SET estado = 'inactivo' WHERE id = ?");
    $stmt->execute([$id]);
    
    api_response(['status' => 'Éxito', 'mensaje' => 'Asignatura desasignada']);
}
