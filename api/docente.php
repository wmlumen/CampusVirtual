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
        SELECT ur.asignatura, ur.carrera, ur.seccion, ur.rol, ur.estado, ur.periodo
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

// ═══ SOLICITAR ASIGNATURA (docente logueado, queda pendiente) ═══
// El docente busca la materia y la solicita; el admin la aprueba con carrera/sección.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'request_subject') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;
    $cedula = trim($input['cedula'] ?? '');
    $asignatura = strtoupper(trim($input['asignatura'] ?? ''));

    if (!$cedula || !$asignatura) api_error('Cédula y asignatura requeridas', 400);

    $pdo = db();

    $stmt = $pdo->prepare("SELECT id, firstname, lastname, estado FROM users WHERE username = ?");
    $stmt->execute([$cedula]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) api_error('Docente no encontrado', 404);
    if (($user['estado'] ?? 'activo') !== 'activo') api_error('Usuario inactivo', 403);

    $stmt = $pdo->prepare("SELECT codigo, nombre FROM asignaturas WHERE codigo = ? AND estado = 'activo'");
    $stmt->execute([$asignatura]);
    $mat = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$mat) api_error('Asignatura no disponible', 404);

    $stmt = $pdo->prepare("SELECT id, estado FROM user_roles WHERE user_id = ? AND asignatura = ? AND rol IN ('docente','teacher') AND estado IN ('activo','pendiente')");
    $stmt->execute([$user['id'], $asignatura]);
    if ($stmt->fetch()) api_error('Ya tienes esta asignatura asignada o en espera', 409);

    $stmt = $pdo->prepare("INSERT INTO user_roles (user_id, rol, asignatura, estado) VALUES (?, 'docente', ?, 'pendiente')");
    $stmt->execute([$user['id'], $asignatura]);

    api_response(['status' => 'Éxito', 'mensaje' => "Solicitud de '" . $mat['nombre'] . "' enviada. Queda pendiente de aprobación.", 'id' => $pdo->lastInsertId()]);
}

// ═══ MIS SOLICITUDES (docente: pendientes y respondidas) ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'mis_solicitudes') {
    $cedula = $_GET['cedula'] ?? '';
    if (!$cedula) api_error('Cédula requerida', 400);

    $pdo = db();
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$cedula]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) api_error('Usuario no encontrado', 404);

    $stmt = $pdo->prepare("SELECT ur.id, ur.asignatura, ur.carrera, ur.seccion, ur.estado, ur.created_at, a.nombre AS asignatura_nombre FROM user_roles ur LEFT JOIN asignaturas a ON a.codigo = ur.asignatura WHERE ur.user_id = ? AND ur.rol IN ('docente','teacher') AND ur.asignatura <> '' AND ur.estado IN ('pendiente','inactivo') ORDER BY ur.created_at DESC");
    $stmt->execute([$user['id']]);
    api_response(['solicitudes' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

// ═══ SOLICITUDES PENDIENTES (solo admin/académico) ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'pending_requests') {
    $auth = require_auth();
    if (!in_array($auth->role, ['admin','administrador_plataforma','academico','academic'])) api_error('Solo administradores', 403);

    $pdo = db();
    $stmt = $pdo->query("SELECT ur.id, u.username AS cedula, TRIM(u.firstname || ' ' || u.lastname) AS docente, ur.asignatura, a.nombre AS asignatura_nombre, a.carrera AS carrera_sugerida, ur.carrera, ur.seccion, ur.estado, ur.created_at FROM user_roles ur JOIN users u ON u.id = ur.user_id LEFT JOIN asignaturas a ON a.codigo = ur.asignatura WHERE ur.rol IN ('docente','teacher') AND ur.asignatura <> '' AND ur.estado = 'pendiente' ORDER BY ur.created_at DESC");
    api_response(['solicitudes' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

// ═══ APROBAR SOLICITUD (admin asigna carrera + sección) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'approve_request') {
    $auth = require_auth();
    if (!in_array($auth->role, ['admin','administrador_plataforma','academico','academic'])) api_error('Solo administradores', 403);

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;
    $id = intval($input['id'] ?? 0);
    $carrera = trim($input['carrera'] ?? '');
    $seccion = trim($input['seccion'] ?? '');
    if (!$id) api_error('ID requerido', 400);

    $pdo = db();
    $stmt = $pdo->prepare("SELECT * FROM user_roles WHERE id = ? AND estado = 'pendiente'");
    $stmt->execute([$id]);
    $sol = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$sol) api_error('Solicitud no encontrada o ya respondida', 404);

    $stmt = $pdo->prepare("UPDATE user_roles SET estado = 'activo', carrera = ?, seccion = ?, asignado_por = ? WHERE id = ?");
    $stmt->execute([$carrera, $seccion, $auth->username, $id]);

    // Subir rol base si es menor que docente
    $jerarquia = ['admin' => 4, 'administrador_plataforma' => 4, 'academic' => 3, 'academico' => 3, 'teacher' => 2, 'docente' => 2, 'student' => 1, 'alumno' => 1];
    $cur = $pdo->query("SELECT role FROM users WHERE id = " . intval($sol['user_id']))->fetchColumn();
    if (($jerarquia['teacher'] ?? 0) > ($jerarquia[$cur] ?? 0)) {
        $pdo->prepare("UPDATE users SET role = 'teacher' WHERE id = ?")->execute([$sol['user_id']]);
    }

    api_response(['status' => 'Éxito', 'mensaje' => 'Solicitud aprobada. El docente ya ve la asignatura con sus alumnos.']);
}

// ═══ RECHAZAR SOLICITUD (solo admin/académico) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'reject_request') {
    $auth = require_auth();
    if (!in_array($auth->role, ['admin','administrador_plataforma','academico','academic'])) api_error('Solo administradores', 403);

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;
    $id = intval($input['id'] ?? 0);
    if (!$id) api_error('ID requerido', 400);

    $pdo = db();
    $stmt = $pdo->prepare("UPDATE user_roles SET estado = 'inactivo' WHERE id = ? AND estado = 'pendiente'");
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) api_error('Solicitud no encontrada o ya respondida', 404);

    api_response(['status' => 'Éxito', 'mensaje' => 'Solicitud rechazada']);
}

// ═══ MIS ALUMNOS (nombres por carrera + sección) ═══
// Requiere al menos un filtro (nunca vuelca la nómina completa).
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'mis_alumnos') {
    $carrera = trim($_GET['carrera'] ?? '');
    $seccion = trim($_GET['seccion'] ?? '');
    if ($carrera === '' && $seccion === '') {
        http_response_code(400); echo json_encode(['error' => 'carrera o seccion requeridos']); exit;
    }

    $pdo = db();
    $sql = "SELECT DISTINCT u.id, u.username AS cedula, TRIM(u.firstname || ' ' || u.lastname) AS nombre, ur.carrera, ur.seccion
            FROM user_roles ur JOIN users u ON u.id = ur.user_id
            WHERE ur.rol IN ('alumno','student') AND ur.estado = 'activo' AND (u.estado IS NULL OR u.estado = 'activo')";
    $params = [];
    if ($carrera !== '') { $sql .= " AND ur.carrera = ?"; $params[] = $carrera; }
    if ($seccion !== '') { $sql .= " AND ur.seccion = ?"; $params[] = $seccion; }
    $sql .= " ORDER BY u.lastname, u.firstname";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $alumnos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    api_response(['alumnos' => $alumnos, 'total' => count($alumnos), 'carrera' => $carrera, 'seccion' => $seccion]);
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
