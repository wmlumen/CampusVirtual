<?php
/**
 * Records module for Centuria API
 * REST API for official academic records (actas, notas, reportes)
 * Uses SQLite database with token-based authentication
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

// Helper: convert percentage to 1-5 scale
function percentage_to_nota($percentage) {
    if ($percentage >= 95) return 5.0;
    if ($percentage >= 85) return 4.0;
    if ($percentage >= 75) return 3.0;
    if ($percentage >= 65) return 2.0;
    if ($percentage >= 50) return 1.0;
    return 0.0;
}

// Helper: nota label
function nota_label($nota) {
    if ($nota >= 4.5) return 'AD';
    if ($nota >= 4.0) return 'A';
    if ($nota >= 3.5) return 'B+';
    if ($nota >= 3.0) return 'B';
    if ($nota >= 2.5) return 'C+';
    if ($nota >= 2.0) return 'C';
    if ($nota >= 1.0) return 'D';
    return 'F';
}

// Helper: asistencia percentage
function calculate_attendance_rate($pdo, $user_id, $course_id) {
    $stmt = $pdo->prepare(
        "SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
            SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused_count
         FROM attendance WHERE user_id = ? AND course_id = ?"
    );
    $stmt->execute([$user_id, $course_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row['total'] == 0) return 100.0;

    $effective = $row['present_count'] + $row['excused_count'];
    return round($effective / $row['total'] * 100, 2);
}

// ─── 1. GET action=acta — Generate official grade report (acta) ───
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'acta') {
    $decoded = require_auth();

    $course_id = $_GET['course_id'] ?? 0;
    $periodo = trim($_GET['periodo'] ?? '');

    if ($course_id == 0) {
        api_error('course_id is required', 400);
    }

    $pdo = db();

    $stmt = $pdo->prepare("SELECT id, name, shortname FROM courses WHERE id = ?");
    $stmt->execute([$course_id]);
    $course = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$course) {
        api_error('Course not found', 404);
    }

    // Get students enrolled in this course
    $stmt = $pdo->prepare(
        "SELECT id, username, firstname, lastname FROM users WHERE course_id = ? AND role = 'student' ORDER BY lastname, firstname"
    );
    $stmt->execute([$course_id]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $acta_rows = [];

    foreach ($students as $student) {
        $sid = $student['id'];

        // Get grades grouped by component
        $stmt = $pdo->prepare(
            "SELECT component, score, max_score FROM grades WHERE user_id = ? AND course_id = ?"
        );
        $stmt->execute([$sid, $course_id]);
        $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $componentes = [
            'asistencia' => ['score' => 0, 'max_score' => 0],
            'parcial1'   => ['score' => 0, 'max_score' => 0],
            'parcial2'   => ['score' => 0, 'max_score' => 0],
            'final'      => ['score' => 0, 'max_score' => 0],
        ];

        foreach ($grades as $g) {
            $comp = strtolower(trim($g['component']));
            if (isset($componentes[$comp])) {
                $componentes[$comp]['score'] = $g['score'];
                $componentes[$comp]['max_score'] = $g['max_score'];
            }
        }

        // Use real attendance rate if asistencia component not manually set
        if ($componentes['asistencia']['max_score'] == 0) {
            $att_rate = calculate_attendance_rate($pdo, $sid, $course_id);
            $componentes['asistencia'] = ['score' => $att_rate, 'max_score' => 100];
        }

        // Calculate final percentage
        $total_score = 0;
        $total_max = 0;
        foreach ($componentes as $c) {
            $total_score += $c['score'];
            $total_max += $c['max_score'];
        }

        $final_percentage = $total_max > 0 ? round($total_score / $total_max * 100, 2) : 0;
        $nota_final = percentage_to_nota($final_percentage);

        $acta_rows[] = [
            'user_id'          => $sid,
            'cedula'           => $student['username'],
            'nombre'           => $student['firstname'] . ' ' . $student['lastname'],
            'asistencia'       => $componentes['asistencia']['score'],
            'parcial1'         => $componentes['parcial1']['score'],
            'parcial1_max'     => $componentes['parcial1']['max_score'],
            'parcial2'         => $componentes['parcial2']['score'],
            'parcial2_max'     => $componentes['parcial2']['max_score'],
            'final_examen'     => $componentes['final']['score'],
            'final_max'        => $componentes['final']['max_score'],
            'porcentaje_total' => $final_percentage,
            'nota_final'       => $nota_final,
            'concepto'         => nota_label($nota_final),
        ];
    }

    api_response([
        'curso'   => $course['name'],
        'periodo' => $periodo,
        'total_estudiantes' => count($acta_rows),
        'acta'    => $acta_rows,
    ]);
}

// ─── 2. GET action=notas — All grades for a course organized by component ───
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'notas') {
    $decoded = require_auth();

    $course_id = $_GET['course_id'] ?? 0;

    if ($course_id == 0) {
        api_error('course_id is required', 400);
    }

    $pdo = db();

    $stmt = $pdo->prepare("SELECT id, name FROM courses WHERE id = ?");
    $stmt->execute([$course_id]);
    $course = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$course) {
        api_error('Course not found', 404);
    }

    $stmt = $pdo->prepare(
        "SELECT g.user_id, u.firstname, u.lastname, u.username,
                g.component, g.score, g.max_score, g.created_at
         FROM grades g
         JOIN users u ON g.user_id = u.id
         WHERE g.course_id = ?
         ORDER BY u.lastname, u.firstname, g.component"
    );
    $stmt->execute([$course_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Organize by student
    $by_student = [];
    foreach ($rows as $r) {
        $sid = $r['user_id'];
        if (!isset($by_student[$sid])) {
            $by_student[$sid] = [
                'user_id'    => $sid,
                'cedula'     => $r['username'],
                'nombre'     => $r['firstname'] . ' ' . $r['lastname'],
                'componentes' => [],
            ];
        }
        $by_student[$sid]['componentes'][] = [
            'component' => $r['component'],
            'score'     => $r['score'],
            'max_score' => $r['max_score'],
            'fecha'     => $r['created_at'],
        ];
    }

    api_response([
        'curso'   => $course['name'],
        'total_estudiantes' => count($by_student),
        'notas'   => array_values($by_student),
    ]);
}

// ─── 3. POST action=guardar_acta — Save acta to documentos ───
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'guardar_acta') {
    $decoded = require_auth();
    $role = $decoded->role;

    if (!in_array($role, ['teacher', 'admin', 'academic'])) {
        api_error('Permission denied: only teacher/admin/academic can save actas', 403);
    }

    $curso   = trim($_POST['curso'] ?? '');
    $periodo = trim($_POST['periodo'] ?? '');
    $datos   = $_POST['datos'] ?? '';

    if ($curso === '' || $periodo === '') {
        api_error('curso and periodo are required', 400);
    }

    // Validate JSON datos
    $decoded_data = json_decode($datos);
    if (json_last_error() !== JSON_ERROR_NONE) {
        api_error('datos must be valid JSON', 400);
    }

    $pdo = db();

    $stmt = $pdo->prepare(
        "INSERT INTO documentos (tipo, curso, periodo, datos, docente, updated_at)
         VALUES ('acta', ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(tipo, curso, periodo)
         DO UPDATE SET datos = excluded.datos, docente = excluded.docente, updated_at = CURRENT_TIMESTAMP"
    );

    $docente = $decoded->username ?? '';

    try {
        $stmt->execute([$curso, $periodo, $datos, $docente]);
        api_response(['message' => 'Acta guardada exitosamente.']);
    } catch (PDOException $e) {
        api_error('Database error: ' . $e->getMessage(), 500);
    }
}

// ─── 4. GET action=ver_acta — View saved acta ───
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'ver_acta') {
    $decoded = require_auth();

    $curso   = trim($_GET['curso'] ?? '');
    $periodo = trim($_GET['periodo'] ?? '');

    if ($curso === '' || $periodo === '') {
        api_error('curso and periodo are required', 400);
    }

    $pdo = db();

    $stmt = $pdo->prepare(
        "SELECT id, tipo, curso, periodo, datos, docente, updated_at
         FROM documentos WHERE tipo = 'acta' AND curso = ? AND periodo = ?"
    );
    $stmt->execute([$curso, $periodo]);
    $doc = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($doc) {
        api_response(['found' => true, 'documento' => $doc]);
    } else {
        api_response(['found' => false]);
    }
}

// ─── 5. GET action=reporte_general — General report across all courses ───
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'reporte_general') {
    $decoded = require_auth();

    $pdo = db();

    // Average grade per course
    $stmt = $pdo->prepare(
        "SELECT c.id, c.name,
                COUNT(DISTINCT g.user_id) as total_estudiantes,
                ROUND(AVG(CASE WHEN g.max_score > 0 THEN g.score / g.max_score * 100 ELSE 0 END), 2) as promedio_porcentaje
         FROM courses c
         LEFT JOIN grades g ON g.course_id = c.id
         GROUP BY c.id
         ORDER BY c.name"
    );
    $stmt->execute();
    $cursos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $reporte = [];
    foreach ($cursos as $c) {
        $promedio_pct = $c['promedio_porcentaje'] ?? 0;
        $nota_avg = percentage_to_nota($promedio_pct);

        // Pass/fail counts
        $stmt2 = $pdo->prepare(
            "SELECT 
                SUM(CASE WHEN g.max_score > 0 AND (g.score / g.max_score * 100) >= 50 THEN 1 ELSE 0 END) as aprobados,
                SUM(CASE WHEN g.max_score > 0 AND (g.score / g.max_score * 100) < 50 THEN 1 ELSE 0 END) as reprobados
             FROM grades g
             WHERE g.course_id = ? AND g.component = 'final'"
        );
        $stmt2->execute([$c['id']]);
        $pf = $stmt2->fetch(PDO::FETCH_ASSOC);

        // Attendance rate
        $stmt3 = $pdo->prepare(
            "SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count
             FROM attendance WHERE course_id = ?"
        );
        $stmt3->execute([$c['id']]);
        $att = $stmt3->fetch(PDO::FETCH_ASSOC);
        $att_rate = $att['total'] > 0 ? round($att['present_count'] / $att['total'] * 100, 2) : 0;

        $reporte[] = [
            'curso_id'          => $c['id'],
            'curso'             => $c['name'],
            'total_estudiantes' => $c['total_estudiantes'],
            'promedio_porcentaje' => $promedio_pct,
            'nota_promedio'     => $nota_avg,
            'aprobados'         => (int)($pf['aprobados'] ?? 0),
            'reprobados'        => (int)($pf['reprobados'] ?? 0),
            'asistencia_promedio' => $att_rate,
        ];
    }

    api_response([
        'total_cursos' => count($reporte),
        'reporte' => $reporte,
    ]);
}

// ─── 6. GET action=reporte_alumno — Student academic report ───
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'reporte_alumno') {
    $decoded = require_auth();

    $user_id = $_GET['user_id'] ?? 0;

    if ($user_id == 0) {
        api_error('user_id is required', 400);
    }

    // Students can only see their own report
    if ($decoded->role === 'student' && $decoded->user_id != $user_id) {
        api_error('Permission denied: students can only view their own report', 403);
    }

    $pdo = db();

    $stmt = $pdo->prepare("SELECT id, username, firstname, lastname, email, carrera, grado, seccion FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        api_error('User not found', 404);
    }

    // All grades across courses
    $stmt = $pdo->prepare(
        "SELECT g.course_id, c.name as curso, g.component, g.score, g.max_score, g.created_at
         FROM grades g
         JOIN courses c ON g.course_id = c.id
         WHERE g.user_id = ?
         ORDER BY c.name, g.component"
    );
    $stmt->execute([$user_id]);
    $all_grades = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Group by course
    $cursos = [];
    foreach ($all_grades as $g) {
        $cid = $g['curso'];
        if (!isset($cursos[$cid])) {
            $cursos[$cid] = ['curso' => $cid, 'componentes' => []];
        }
        $cursos[$cid]['componentes'][] = [
            'component' => $g['component'],
            'score'     => $g['score'],
            'max_score' => $g['max_score'],
            'fecha'     => $g['created_at'],
        ];
    }

    // Calculate final nota per course
    $resumen = [];
    foreach ($cursos as $curso_nombre => $data) {
        $total_score = 0;
        $total_max = 0;
        foreach ($data['componentes'] as $c) {
            $total_score += $c['score'];
            $total_max += $c['max_score'];
        }
        $pct = $total_max > 0 ? round($total_score / $total_max * 100, 2) : 0;
        $nota = percentage_to_nota($pct);

        $resumen[] = [
            'curso'         => $curso_nombre,
            'porcentaje'    => $pct,
            'nota_final'    => $nota,
            'concepto'      => nota_label($nota),
            'componentes'   => $data['componentes'],
        ];
    }

    // Attendance history
    $stmt = $pdo->prepare(
        "SELECT a.course_id, c.name as curso, a.date, a.status
         FROM attendance a
         JOIN courses c ON a.course_id = c.id
         WHERE a.user_id = ?
         ORDER BY a.date DESC"
    );
    $stmt->execute([$user_id]);
    $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);

    api_response([
        'alumno'   => $user,
        'cursos'   => $resumen,
        'asistencia' => $attendance,
    ]);
}

// ─── 7. POST action=calificar — Enter/update a grade ───
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'calificar') {
    $decoded = require_auth();
    $role = $decoded->role;

    if (!in_array($role, ['teacher', 'admin', 'academic'])) {
        api_error('Permission denied: only teacher/admin/academic can enter grades', 403);
    }

    $user_id   = $_POST['user_id'] ?? 0;
    $course_id = $_POST['course_id'] ?? 0;
    $component = trim($_POST['component'] ?? '');
    $score     = $_POST['score'] ?? null;
    $max_score = $_POST['max_score'] ?? 100;

    if ($user_id == 0 || $course_id == 0 || $component === '' || $score === null) {
        api_error('user_id, course_id, component, and score are required', 400);
    }

    $pdo = db();

    // Verify course exists
    $stmt = $pdo->prepare("SELECT id FROM courses WHERE id = ?");
    $stmt->execute([$course_id]);
    if (!$stmt->fetchColumn()) {
        api_error('Course not found', 404);
    }

    // Verify user exists
    $stmt = $pdo->prepare("SELECT id, role FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    if (!$stmt->fetchColumn()) {
        api_error('User not found', 404);
    }

    // Upsert grade
    $stmt = $pdo->prepare(
        "INSERT INTO grades (user_id, course_id, component, score, max_score)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, course_id, component)
         DO UPDATE SET score = excluded.score, max_score = excluded.max_score, updated_at = CURRENT_TIMESTAMP"
    );

    try {
        $stmt->execute([$user_id, $course_id, $component, $score, $max_score]);
        api_response(['message' => 'Calificación registrada exitosamente.']);
    } catch (PDOException $e) {
        api_error('Database error: ' . $e->getMessage(), 500);
    }
}

// ─── Fallback ───
api_error('Invalid or missing action parameter', 400);
