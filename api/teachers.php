<?php
/**
 * Teachers API — Gestión de docentes, asignaturas y estadísticas
 * Endpoints:
 *   GET  ?action=list       → Listar todos los docentes con roles y asignaturas
 *   GET  ?action=get&id=X   → Detalle de docente + cursos + cantidad de alumnos
 *   POST ?action=assign     → Asignar asignatura a un docente
 *   POST ?action=unassign   → Quitar asignatura a un docente
 *   GET  ?action=stats      → Estadísticas generales de docentes
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

// ═══ LISTAR TODOS LOS DOCENTES ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'list') {
    require_auth();

    $pdo = db();

    $stmt = $pdo->query("
        SELECT u.id, u.username AS cedula, u.firstname, u.lastname, u.email,
               u.telefono, u.carrera, u.seccion, u.estado,
               ur.rol, ur.asignatura, ur.seccion AS seccion_asig
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.rol IN ('teacher', 'docente')
        ORDER BY u.lastname, u.firstname
    ");
    $docentes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Enriquecer con conteo de alumnos por asignación
    foreach ($docentes as &$d) {
        if (!empty($d['asignatura']) && !empty($d['seccion_asig'])) {
            $cnt = $pdo->prepare("
                SELECT COUNT(*) FROM user_roles
                WHERE asignatura = ? AND seccion = ? AND rol IN ('student','alumno') AND estado = 'activo'
            ");
            $cnt->execute([$d['asignatura'], $d['seccion_asig']]);
            $d['alumnos'] = (int)$cnt->fetchColumn();
        } else {
            $d['alumnos'] = 0;
        }
        $d['nombre_completo'] = trim($d['firstname'] . ' ' . $d['lastname']);
    }
    unset($d);

    api_response(['docentes' => $docentes, 'total' => count($docentes)]);
}

// ═══ DETALLE DE DOCENTE ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get') {
    require_auth();

    $userId = intval($_GET['id'] ?? 0);
    if (!$userId) api_error('ID requerido', 400);

    $pdo = db();

    // Datos básicos del usuario
    $stmt = $pdo->prepare("
        SELECT u.id, u.username AS cedula, u.firstname, u.lastname, u.email,
               u.telefono, u.carrera, u.seccion, u.foto, u.estado,
               u.role AS role_sistema, u.created_at
        FROM users u WHERE u.id = ?
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) api_error('Docente no encontrado', 404);
    $user['nombre_completo'] = trim($user['firstname'] . ' ' . $user['lastname']);

    // Roles / asignaturas del docente
    $stmt = $pdo->prepare("SELECT * FROM user_roles WHERE user_id = ? AND rol IN ('teacher','docente') ORDER BY id");
    $stmt->execute([$userId]);
    $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $user['asignaciones'] = $roles;

    // Cursos asociados vía courses.created_by
    $stmt = $pdo->prepare("SELECT id, name, shortname, description FROM courses WHERE created_by = ?");
    $stmt->execute([$userId]);
    $cursos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Contar alumnos por curso
    foreach ($cursos as &$c) {
        $stmt2 = $pdo->prepare("SELECT COUNT(DISTINCT user_id) FROM grades WHERE course_id = ?");
        $stmt2->execute([$c['id']]);
        $c['alumnos'] = (int)$stmt2->fetchColumn();
    }
    unset($c);
    $user['cursos'] = $cursos;

    // Resumen
    $user['total_asignaciones'] = count($roles);
    $user['total_cursos'] = count($cursos);

    api_response(['docente' => $user]);
}

// ═══ ASIGNAR ASIGNATURA A DOCENTE ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'assign') {
    $auth = require_auth();
    if (!in_array($auth->role, ['admin', 'academic'])) {
        api_error('Solo administradores o académicos', 403);
    }

    $userId     = intval($_POST['user_id'] ?? 0);
    $asignatura = trim($_POST['asignatura'] ?? '');
    $carrera    = trim($_POST['carrera'] ?? '');
    $seccion    = trim($_POST['seccion'] ?? '');

    if (!$userId || !$asignatura) api_error('user_id y asignatura requeridos', 400);

    $pdo = db();

    // Verificar que el usuario exista
    $stmt = $pdo->prepare("SELECT id, firstname, lastname FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) api_error('Usuario no encontrado', 404);

    // Verificar que no tenga ya esa asignatura activa
    $stmt = $pdo->prepare("SELECT id FROM user_roles WHERE user_id = ? AND asignatura = ? AND estado = 'activo'");
    $stmt->execute([$userId, $asignatura]);
    if ($stmt->fetchColumn()) {
        api_error('Ya tiene asignada la asignatura ' . $asignatura, 409);
    }

    $stmt = $pdo->prepare("
        INSERT INTO user_roles (user_id, rol, carrera, seccion, asignatura, asignado_por, estado)
        VALUES (?, 'teacher', ?, ?, ?, ?, 'activo')
    ");
    $stmt->execute([$userId, $carrera, $seccion, $asignatura, $auth->username]);

    $roleId = $pdo->lastInsertId();

    // Si el role_sistema no es teacher, actualizarlo
    $currentRole = $pdo->query("SELECT role FROM users WHERE id = $userId")->fetchColumn();
    $jerarquia = ['admin' => 4, 'academic' => 3, 'teacher' => 2, 'student' => 1];
    if (($jerarquia['teacher'] ?? 0) > ($jerarquia[$currentRole] ?? 0)) {
        $pdo->prepare("UPDATE users SET role = 'teacher' WHERE id = ?")->execute([$userId]);
    }

    api_response([
        'status' => 'Éxito',
        'mensaje' => "Asignatura '$asignatura' asignada a {$user['firstname']} {$user['lastname']}",
        'role_id' => $roleId
    ]);
}

// ═══ DESASIGNAR ASIGNATURA ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'unassign') {
    $auth = require_auth();
    if (!in_array($auth->role, ['admin', 'academic'])) {
        api_error('Solo administradores o académicos', 403);
    }

    $roleId = intval($_POST['user_role_id'] ?? 0);
    if (!$roleId) api_error('user_role_id requerido', 400);

    $pdo = db();

    // Obtener info antes de borrar
    $stmt = $pdo->prepare("SELECT user_id, asignatura FROM user_roles WHERE id = ? AND rol IN ('teacher','docente')");
    $stmt->execute([$roleId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) api_error('Asignación no encontrada', 404);

    $stmt = $pdo->prepare("DELETE FROM user_roles WHERE id = ?");
    $stmt->execute([$roleId]);

    // Recalcular role_sistema si ya no tiene asignaciones docentes
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM user_roles WHERE user_id = ? AND rol IN ('teacher','docente') AND estado = 'activo'");
    $stmt->execute([$row['user_id']]);
    $remaining = (int)$stmt->fetchColumn();

    if ($remaining === 0) {
        $pdo->prepare("UPDATE users SET role = 'student' WHERE id = ?")->execute([$row['user_id']]);
    }

    api_response([
        'status' => 'Éxito',
        'mensaje' => "Asignatura '{$row['asignatura']}' removida"
    ]);
}

// ═══ ESTADÍSTICAS DE DOCENTES ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'stats') {
    require_auth();

    $pdo = db();

    // Total de docentes únicos
    $totalDocentes = $pdo->query("
        SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE rol IN ('teacher','docente') AND estado = 'activo'
    ")->fetchColumn();

    // Total de asignaturas asignadas
    $totalAsignaturas = $pdo->query("
        SELECT COUNT(*) FROM user_roles WHERE rol IN ('teacher','docente') AND asignatura != '' AND estado = 'activo'
    ")->fetchColumn();

    // Promedio de alumnos por docente (asignatura-sección)
    $avgStmt = $pdo->query("
        SELECT ur.user_id, ur.asignatura, ur.seccion,
               (SELECT COUNT(*) FROM user_roles ur2
                WHERE ur2.rol IN ('student','alumno')
                  AND ur2.asignatura = ur.asignatura
                  AND ur2.seccion = ur.seccion
                  AND ur2.estado = 'activo') AS total_alumnos
        FROM user_roles ur
        WHERE ur.rol IN ('teacher','docente') AND ur.asignatura != '' AND ur.estado = 'activo'
    ");
    $asignaciones = $avgStmt->fetchAll(PDO::FETCH_ASSOC);

    $totalAlumnos = 0;
    foreach ($asignaciones as $a) {
        $totalAlumnos += $a['total_alumnos'];
    }
    $promedioAlumnos = count($asignaciones) > 0 ? round($totalAlumnos / count($asignaciones), 1) : 0;

    // Docentes por carrera
    $carreras = $pdo->query("
        SELECT carrera, COUNT(DISTINCT user_id) AS total
        FROM user_roles
        WHERE rol IN ('teacher','docente') AND carrera != '' AND estado = 'activo'
        GROUP BY carrera ORDER BY total DESC
    ")->fetchAll(PDO::FETCH_ASSOC);

    api_response([
        'total_docentes' => (int)$totalDocentes,
        'total_asignaturas' => (int)$totalAsignaturas,
        'total_alumnos_en_docencia' => (int)$totalAlumnos,
        'promedio_alumnos_por_asignacion' => $promedioAlumnos,
        'docentes_por_carrera' => $carreras
    ]);
}
