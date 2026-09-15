<?php
/**
 * Reports API — Dashboard y estadísticas consolidadas
 * Endpoints:
 *   GET  ?action=dashboard       → Datos para dashboard admin
 *   GET  ?action=notas_stats     → Estadísticas de notas por curso
 *   GET  ?action=asistencia_stats → Estadísticas de asistencia por curso
 *   GET  ?action=exportar&formato=csv → Exportar datos académicos
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $action = $_GET['action'];
    $pdo = db();

    // ═══ #16 DASHBOARD DATA ═══
    if ($action === 'dashboard') {
        $decoded = require_auth();

        // Total usuarios
        $total_users = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $total_alumnos = $pdo->query("SELECT COUNT(*) FROM users WHERE role='student'")->fetchColumn();
        $total_docentes = $pdo->query("SELECT COUNT(*) FROM users WHERE role IN ('teacher','docente')")->fetchColumn();
        $total_admins = $pdo->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn();

        // Usuarios activos hoy
        $hoy = date('Y-m-d');
        $activos_hoy = $pdo->query("SELECT COUNT(DISTINCT user_id) FROM sessions WHERE DATE(created_at) = '$hoy'")->fetchColumn();

        // Cursos
        $total_cursos = $pdo->query("SELECT COUNT(*) FROM courses")->fetchColumn();

        // Notas promedio por curso
        $stmt = $pdo->query("
            SELECT c.shortname, c.name, 
                   ROUND(AVG(g.score),1) as promedio,
                   COUNT(DISTINCT g.user_id) as alumnos_con_nota
            FROM courses c
            LEFT JOIN grades g ON c.id = g.course_id
            GROUP BY c.id
            ORDER BY c.shortname
        ");
        $cursos_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Asistencia hoy
        $asis_hoy = $pdo->query("SELECT COUNT(*) FROM attendance WHERE date='$hoy'")->fetchColumn();
        $asis_presentes = $pdo->query("SELECT COUNT(*) FROM attendance WHERE date='$hoy' AND status='present'")->fetchColumn();

        // Últimos 5 usuarios registrados
        $stmt = $pdo->query("SELECT username, firstname, lastname, role, created_at FROM users ORDER BY created_at DESC LIMIT 5");
        $ultimos_usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Distribución por roles
        $stmt = $pdo->query("SELECT role, COUNT(*) as total FROM users GROUP BY role ORDER BY total DESC");
        $distribucion_roles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Progreso de unidades (si existe la tabla)
        try {
            $progreso_unidades = $pdo->query("
                SELECT unidad, 
                       COUNT(*) as total_alumnos,
                       SUM(CASE WHEN completada=1 THEN 1 ELSE 0 END) as completaron,
                       ROUND(AVG(CAST(secciones_leidas AS FLOAT)/total_secciones*100),1) as promedio_avance
                FROM unit_progress 
                GROUP BY unidad 
                ORDER BY unidad
            ")->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $progreso_unidades = [];
        }

        echo json_encode([
            'ok'=>true,
            'usuarios'=>[
                'total'=>$total_users,
                'alumnos'=>$total_alumnos,
                'docentes'=>$total_docentes,
                'admins'=>$total_admins,
                'activos_hoy'=>$activos_hoy
            ],
            'cursos'=>[
                'total'=>$total_cursos,
                'stats'=>$cursos_stats
            ],
            'asistencia_hoy'=>[
                'registros'=>$asis_hoy,
                'presentes'=>$asis_presentes
            ],
            'distribucion_roles'=>$distribucion_roles,
            'ultimos_usuarios'=>$ultimos_usuarios,
            'progreso_unidades'=>$progreso_unidades
        ]);
        exit;
    }

    // ═══ ESTADÍSTICAS DE NOTAS ═══
    if ($action === 'notas_stats') {
        $decoded = require_auth();
        $course_id = intval($_GET['course_id'] ?? 0);

        $where = $course_id ? "WHERE g.course_id = $course_id" : "";
        $stmt = $pdo->query("
            SELECT c.shortname as curso, g.component,
                   COUNT(*) as total_registros,
                   ROUND(AVG(g.score),1) as promedio,
                   MIN(g.score) as minimo,
                   MAX(g.score) as maximo
            FROM grades g
            JOIN courses c ON g.course_id = c.id
            $where
            GROUP BY c.shortname, g.component
            ORDER BY c.shortname, g.component
        ");
        echo json_encode(['ok'=>true,'stats'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit;
    }

    // ═══ ESTADÍSTICAS DE ASISTENCIA ═══
    if ($action === 'asistencia_stats') {
        $decoded = require_auth();
        $course_id = intval($_GET['course_id'] ?? 0);

        $where = $course_id ? "WHERE a.course_id = $course_id" : "";
        $stmt = $pdo->query("
            SELECT c.shortname as curso,
                   COUNT(*) as total_dias,
                   SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) as presentes,
                   SUM(CASE WHEN a.status='absent' THEN 1 ELSE 0 END) as ausentes,
                   SUM(CASE WHEN a.status='late' THEN 1 ELSE 0 END) as tardanzas,
                   SUM(CASE WHEN a.status='excused' THEN 1 ELSE 0 END) as justificadas
            FROM attendance a
            JOIN courses c ON a.course_id = c.id
            $where
            GROUP BY c.shortname
        ");
        echo json_encode(['ok'=>true,'stats'=>$stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit;
    }

    // ═══ EXPORTAR CSV ═══
    if ($action === 'exportar') {
        $decoded = require_auth();
        $formato = $_GET['formato'] ?? 'csv';

        $stmt = $pdo->query("
            SELECT u.username as cedula, u.firstname, u.lastname, u.email,
                   c.shortname as curso, g.component, g.score, g.max_score, g.created_at
            FROM grades g
            JOIN users u ON g.user_id = u.id
            JOIN courses c ON g.course_id = c.id
            ORDER BY u.lastname, c.shortname, g.component
        ");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if ($formato === 'csv') {
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="notas_centuria_'.date('Y-m-d').'.csv"');
            $output = fopen('php://output', 'w');
            fputcsv($output, ['Cédula','Nombre','Apellido','Email','Curso','Componente','Nota','Máximo','Fecha']);
            foreach ($rows as $r) {
                fputcsv($output, [$r['cedula'],$r['firstname'],$r['lastname'],$r['email'],$r['curso'],$r['component'],$r['score'],$r['max_score'],$r['created_at']]);
            }
            fclose($output);
            exit;
        }

        echo json_encode(['ok'=>true,'datos'=>$rows,'total'=>count($rows)]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error'=>'Acción no válida']);
    exit;
}

http_response_code(405);
echo json_encode(['error'=>'Método no permitido']);
