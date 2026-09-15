<?php
/**
 * Progress API — Guarda y carga progreso de unidades en la nube
 * Endpoints:
 *   GET  ?action=get&user_id=X&unidad=X  → progreso de una unidad
 *   GET  ?action=all&user_id=X           → progreso de todas las unidades
 *   GET  ?action=teacher_view            → progreso de todos los alumnos (docente)
 *   POST action=save                     → guardar progreso
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

// GET — Obtener progreso
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $action = $_GET['action'];
    $pdo = db();

    if ($action === 'get') {
        $user_id = intval($_GET['user_id'] ?? 0);
        $unidad = intval($_GET['unidad'] ?? 0);
        if (!$user_id || !$unidad) { http_response_code(400); echo json_encode(['error'=>'user_id y unidad requeridos']); exit; }
        $stmt = $pdo->prepare("SELECT * FROM unit_progress WHERE user_id=? AND unidad=?");
        $stmt->execute([$user_id, $unidad]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($row ? [
            'ok'=>true,
            'unidad'=>$row['unidad'],
            'secciones_leidas'=>json_decode($row['secciones_leidas'],true),
            'total_secciones'=>$row['total_secciones'],
            'completada'=>intval($row['completada']),
            'asistencia'=>intval($row['asistencia'])
        ] : ['ok'=>true,'unidad'=>$unidad,'secciones_leidas'=>[],'total_secciones'=>10,'completada'=>0,'asistencia'=>0]);
        exit;
    }

    if ($action === 'all') {
        $user_id = intval($_GET['user_id'] ?? 0);
        if (!$user_id) { http_response_code(400); echo json_encode(['error'=>'user_id requerido']); exit; }
        $stmt = $pdo->prepare("SELECT * FROM unit_progress WHERE user_id=? ORDER BY unidad");
        $stmt->execute([$user_id]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $result = [];
        foreach ($rows as $r) {
            $result[$r['unidad']] = [
                'secciones_leidas'=>json_decode($r['secciones_leidas'],true),
                'total_secciones'=>$r['total_secciones'],
                'completada'=>intval($r['completada']),
                'asistencia'=>intval($r['asistencia'])
            ];
        }
        echo json_encode(['ok'=>true,'progreso'=>$result]);
        exit;
    }

    // ═══ #10 VISTA DOCENTE: Progreso de todos los alumnos ═══
    if ($action === 'teacher_view') {
        $decoded = require_auth();
        if (!in_array($decoded->role, ['teacher','admin','academic'])) {
            http_response_code(403); echo json_encode(['error'=>'Solo docentes/admins']); exit;
        }

        // Obtener todos los alumnos con progreso
        $stmt = $pdo->prepare("
            SELECT u.id, u.username as cedula, u.firstname, u.lastname,
                   up.unidad, up.secciones_leidas, up.total_secciones, up.completada, up.asistencia
            FROM users u
            LEFT JOIN unit_progress up ON u.id = up.user_id
            WHERE u.role = 'student' OR u.id IN (SELECT DISTINCT user_id FROM user_roles WHERE rol = 'alumno')
            ORDER BY u.lastname, u.firstname, up.unidad
        ");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $alumnos = [];
        foreach ($rows as $r) {
            $uid = $r['id'];
            if (!isset($alumnos[$uid])) {
                $alumnos[$uid] = [
                    'id'=>$uid,
                    'cedula'=>$r['cedula'],
                    'nombre'=>$r['firstname'].' '.$r['lastname'],
                    'unidades'=>[]
                ];
            }
            if ($r['unidad']) {
                $leidos = json_decode($r['secciones_leidas'], true);
                $alumnos[$uid]['unidades'][$r['unidad']] = [
                    'leidos'=>count($leidos),
                    'total'=>$r['total_secciones'],
                    'completada'=>intval($r['completada']),
                    'asistencia'=>intval($r['asistencia'])
                ];
            }
        }

        echo json_encode(['ok'=>true,'alumnos'=>array_values($alumnos)]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error'=>'Acción no válida']);
    exit;
}

// POST — Guardar progreso
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;

    $user_id = intval($input['user_id'] ?? 0);
    $unidad = intval($input['unidad'] ?? 0);
    $secciones_leidas = $input['secciones_leidas'] ?? [];
    $total_secciones = intval($input['total_secciones'] ?? 10);
    $completada = intval($input['completada'] ?? 0);
    $asistencia = intval($input['asistencia'] ?? 0);

    if (!$user_id || !$unidad) {
        http_response_code(400);
        echo json_encode(['error'=>'user_id y unidad requeridos']);
        exit;
    }

    $pdo = db();
    $json_leidos = json_encode($secciones_leidas);

    $stmt = $pdo->prepare("
        INSERT INTO unit_progress (user_id, unidad, secciones_leidas, total_secciones, completada, asistencia, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, unidad) DO UPDATE SET
            secciones_leidas=excluded.secciones_leidas,
            total_secciones=excluded.total_secciones,
            completada=excluded.completada,
            asistencia=excluded.asistencia,
            updated_at=CURRENT_TIMESTAMP
    ");
    $stmt->execute([$user_id, $unidad, $json_leidos, $total_secciones, $completada, $asistencia]);

    echo json_encode(['ok'=>true,'mensaje'=>'Progreso guardado en la nube']);
    exit;
}

http_response_code(405);
echo json_encode(['error'=>'Método no permitido']);
