<?php
/**
 * Subjects API — CRUD + stats for subject/assignment management
 * Uses SQLite database with token-based authentication
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

// ═══════════════════════════════════════════════════════════════
// GET ?action=list  —  List all subjects with enrollment count
// ═══════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'list') {
    $decoded = require_auth();
    $pdo = db();

    $stmt = $pdo->query("
        SELECT c.id, c.name, c.shortname, c.description, c.created_by,
               c.created_at,
               (SELECT COUNT(DISTINCT g.user_id) FROM grades g WHERE g.course_id = c.id) AS enrolled_by_grades,
               (SELECT COUNT(DISTINCT a.user_id) FROM attendance a WHERE a.course_id = c.id) AS enrolled_by_attendance,
               (SELECT COUNT(*) FROM grades g2 WHERE g2.course_id = c.id) AS total_grades,
               (SELECT COUNT(*) FROM attendance a2 WHERE a2.course_id = c.id) AS total_attendance
        FROM courses c
        ORDER BY c.shortname
    ");
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($courses as &$c) {
        $c['enrolled_count'] = max((int)$c['enrolled_by_grades'], (int)$c['enrolled_by_attendance']);
        unset($c['enrolled_by_grades'], $c['enrolled_by_attendance']);
    }
    unset($c);

    api_response(['ok' => true, 'asignaturas' => $courses]);
}

// ═══════════════════════════════════════════════════════════════
// GET ?action=get&id=X  —  Subject detail with teacher & averages
// ═══════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get') {
    $decoded = require_auth();
    $id = intval($_GET['id'] ?? 0);
    if (!$id) api_error('ID requerido', 400);

    $pdo = db();

    // Course info
    $stmt = $pdo->prepare("SELECT * FROM courses WHERE id = ?");
    $stmt->execute([$id]);
    $course = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$course) api_error('Asignatura no encontrada', 404);

    // Teacher assigned via user_roles
    $stmt = $pdo->prepare("
        SELECT u.id, u.username, u.firstname, u.lastname, u.email
        FROM user_roles ur
        JOIN users u ON ur.user_id = u.id
        WHERE ur.rol = 'docente' AND ur.asignatura = ? AND ur.estado = 'activo'
        LIMIT 1
    ");
    $stmt->execute([$course['name']]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

    // Enrolled students (via user_roles)
    $stmt = $pdo->prepare("
        SELECT u.id, u.username, u.firstname, u.lastname
        FROM user_roles ur
        JOIN users u ON ur.user_id = u.id
        WHERE ur.rol = 'alumno' AND ur.asignatura = ? AND ur.estado = 'activo'
    ");
    $stmt->execute([$course['name']]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Average grade per student
    $stmt = $pdo->prepare("
        SELECT user_id,
               ROUND(AVG(CASE WHEN max_score > 0 THEN score * 100.0 / max_score ELSE 0 END), 2) AS avg_pct
        FROM grades
        WHERE course_id = ?
        GROUP BY user_id
    ");
    $stmt->execute([$id]);
    $grade_map = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $grade_map[$row['user_id']] = $row['avg_pct'];
    }

    foreach ($students as &$s) {
        $s['avg_grade'] = $grade_map[$s['id']] ?? null;
    }
    unset($s);

    $overall_avg = null;
    if (!empty($grade_map)) {
        $overall_avg = round(array_sum($grade_map) / count($grade_map), 2);
    }

    api_response([
        'ok' => true,
        'asignatura' => $course,
        'docente' => $teacher,
        'estudiantes' => $students,
        'promedio_general' => $overall_avg
    ]);
}

// ═══════════════════════════════════════════════════════════════
// POST action=create  —  Create new subject
// ═══════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'create') {
    $decoded = require_auth();
    if (!in_array($decoded->role, ['admin', 'academic'])) {
        api_error('Solo admin/academic pueden crear asignaturas', 403);
    }

    $name        = trim($_POST['name'] ?? '');
    $shortname   = trim($_POST['shortname'] ?? '');
    $description = trim($_POST['description'] ?? '');

    if (empty($name) || empty($shortname)) {
        api_error('name y shortname son requeridos', 400);
    }

    $pdo = db();

    $stmt = $pdo->prepare("SELECT id FROM courses WHERE shortname = ?");
    $stmt->execute([$shortname]);
    if ($stmt->fetchColumn()) {
        api_error('Ya existe una asignatura con ese shortname', 409);
    }

    $stmt = $pdo->prepare(
        "INSERT INTO courses (name, shortname, description, created_by) VALUES (?, ?, ?, ?)"
    );

    try {
        $stmt->execute([$name, $shortname, $description, $decoded->user_id]);
        api_response([
            'ok' => true,
            'mensaje' => 'Asignatura creada',
            'id' => $pdo->lastInsertId()
        ], 201);
    } catch (PDOException $e) {
        api_error('Error de base de datos: ' . $e->getMessage(), 500);
    }
}

// ═══════════════════════════════════════════════════════════════
// POST action=update  —  Update subject
// ═══════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'update') {
    $decoded = require_auth();
    if (!in_array($decoded->role, ['admin', 'academic'])) {
        api_error('Solo admin/academic pueden actualizar asignaturas', 403);
    }

    $id          = intval($_POST['id'] ?? 0);
    $name        = trim($_POST['name'] ?? '');
    $shortname   = trim($_POST['shortname'] ?? '');
    $description = trim($_POST['description'] ?? '');

    if (!$id)                       api_error('ID requerido', 400);
    if (empty($name) || empty($shortname)) api_error('name y shortname son requeridos', 400);

    $pdo = db();

    $stmt = $pdo->prepare("SELECT id FROM courses WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetchColumn()) {
        api_error('Asignatura no encontrada', 404);
    }

    $stmt = $pdo->prepare("SELECT id FROM courses WHERE shortname = ? AND id != ?");
    $stmt->execute([$shortname, $id]);
    if ($stmt->fetchColumn()) {
        api_error('Otra asignatura ya usa ese shortname', 409);
    }

    $stmt = $pdo->prepare(
        "UPDATE courses SET name = ?, shortname = ?, description = ? WHERE id = ?"
    );

    try {
        $stmt->execute([$name, $shortname, $description, $id]);
        api_response(['ok' => true, 'mensaje' => 'Asignatura actualizada']);
    } catch (PDOException $e) {
        api_error('Error de base de datos: ' . $e->getMessage(), 500);
    }
}

// ═══════════════════════════════════════════════════════════════
// POST action=delete  —  Soft delete (set estado = inactivo)
// ═══════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'delete') {
    $decoded = require_auth();
    if (!in_array($decoded->role, ['admin'])) {
        api_error('Solo admin puede eliminar asignaturas', 403);
    }

    $id = intval($_POST['id'] ?? 0);
    if (!$id) api_error('ID requerido', 400);

    $pdo = db();

    // The courses table has no 'estado' column natively, so we store it
    // via a column add if missing.  We check first to avoid errors.
    $cols = $pdo->query("PRAGMA table_info(courses)")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('estado', $cols)) {
        $pdo->exec("ALTER TABLE courses ADD COLUMN estado TEXT DEFAULT 'activo'");
    }

    $stmt = $pdo->prepare("UPDATE courses SET estado = 'inactivo' WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        api_error('Asignatura no encontrada', 404);
    }

    api_response(['ok' => true, 'mensaje' => 'Asignatura desactivada']);
}

// ═══════════════════════════════════════════════════════════════
// GET ?action=roster&id=X  —  Students enrolled with grades
// ═══════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'roster') {
    $decoded = require_auth();
    $id = intval($_GET['id'] ?? 0);
    if (!$id) api_error('ID requerido', 400);

    $pdo = db();

    $stmt = $pdo->prepare("SELECT name, shortname FROM courses WHERE id = ?");
    $stmt->execute([$id]);
    $course = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$course) api_error('Asignatura no encontrada', 404);

    // Students via user_roles
    $stmt = $pdo->prepare("
        SELECT u.id, u.username, u.firstname, u.lastname, u.email
        FROM user_roles ur
        JOIN users u ON ur.user_id = u.id
        WHERE ur.rol = 'alumno' AND ur.asignatura = ? AND ur.estado = 'activo'
        ORDER BY u.lastname, u.firstname
    ");
    $stmt->execute([$course['name']]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Grades per student for this course
    $stmt = $pdo->prepare("
        SELECT user_id, component, score, max_score,
               CASE WHEN max_score > 0 THEN ROUND(score * 100.0 / max_score, 2) ELSE 0 END AS pct
        FROM grades
        WHERE course_id = ?
        ORDER BY user_id
    ");
    $stmt->execute([$id]);
    $all_grades = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $grades_by_user = [];
    foreach ($all_grades as $g) {
        $uid = $g['user_id'];
        if (!isset($grades_by_user[$uid])) {
            $grades_by_user[$uid] = ['components' => [], 'total' => 0, 'max_total' => 0];
        }
        $grades_by_user[$uid]['components'][] = $g;
        $grades_by_user[$uid]['total']   += $g['score'];
        $grades_by_user[$uid]['max_total'] += $g['max_score'];
    }

    foreach ($students as &$s) {
        $g = $grades_by_user[$s['id']] ?? null;
        $s['grades']    = $g ? $g['components'] : [];
        $s['avg_grade'] = ($g && $g['max_total'] > 0)
            ? round($g['total'] * 100.0 / $g['max_total'], 2)
            : null;
    }
    unset($s);

    api_response([
        'ok' => true,
        'asignatura' => $course,
        'roster' => $students,
        'total' => count($students)
    ]);
}

// ═══════════════════════════════════════════════════════════════
// GET ?action=stats  —  Subject statistics
// ═══════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'stats') {
    $decoded = require_auth();
    $pdo = db();

    $total_courses = $pdo->query("SELECT COUNT(*) FROM courses")->fetchColumn();

    $enrolled_stmt = $pdo->query("
        SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE rol = 'alumno' AND estado = 'activo'
    ");
    $total_enrolled = $enrolled_stmt->fetchColumn();

    $avg_stmt = $pdo->query("
        SELECT c.id, c.name, c.shortname,
               ROUND(AVG(CASE WHEN g.max_score > 0 THEN g.score * 100.0 / g.max_score ELSE 0 END), 2) AS avg_pct,
               COUNT(DISTINCT g.user_id) AS student_count
        FROM courses c
        LEFT JOIN grades g ON g.course_id = c.id
        GROUP BY c.id
        ORDER BY c.shortname
    ");
    $per_subject = $avg_stmt->fetchAll(PDO::FETCH_ASSOC);

    $overall_avg = null;
    $valid_avgs = array_column(array_filter($per_subject, fn($r) => $r['avg_pct'] !== null), 'avg_pct');
    if (!empty($valid_avgs)) {
        $overall_avg = round(array_sum($valid_avgs) / count($valid_avgs), 2);
    }

    api_response([
        'ok' => true,
        'total_asignaturas'    => (int)$total_courses,
        'total_estudiantes'    => (int)$total_enrolled,
        'promedio_general'     => $overall_avg,
        'por_asignatura'       => $per_subject
    ]);
}

// ═══════════════════════════════════════════════════════════════
// Fallback
// ═══════════════════════════════════════════════════════════════
api_error('Acción no válida', 400);
