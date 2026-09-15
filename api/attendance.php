<?php
/**
 * Attendance API — Sistema de asistencia con código único por evento
 * 
 * Flujo docente:
 *   POST action=create_event   → crear evento, genera código único
 *   POST action=close_event    → cerrar evento (ya no acepta registros)
 *   GET  ?action=my_events     → listar eventos del docente
 *   GET  ?action=event&id=X    → detalle de evento + asistentes
 * 
 * Flujo alumno (registro):
 *   GET  ?action=validate_code&code=X  → verificar que el código existe y está activo
 *   POST action=register               → registrar asistencia con código
 * 
 * Reportes:
 *   GET  ?action=report&event_id=X     → asistentes de un evento
 *   GET  ?action=report_general        → reporte general con filtros
 *   GET  ?action=exportar&event_id=X   → exportar CSV
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

// ═══════════════════════════════════════════════════════
// Función: generar código único (6 chars alfanumérico)
// ═══════════════════════════════════════════════════════
function generateEventCode() {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin I,O,0,1 para evitar confusión
    $code = '';
    for ($i = 0; $i < 6; $i++) {
        $code .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $code;
}

// ═══════════════════════════════════════════════════════
// GET — Consultas
// ═══════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $action = $_GET['action'];
    $pdo = db();

    // ── Validar código de evento ──
    if ($action === 'validate_code') {
        $code = strtoupper(trim($_GET['code'] ?? ''));
        if (!$code) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Código requerido']); exit; }

        $stmt = $pdo->prepare("SELECT id, event_code, title, description, event_type, career, start_time, end_time, location, is_active FROM attendance_events WHERE event_code = ?");
        $stmt->execute([$code]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$event) {
            echo json_encode(['ok'=>false,'error'=>'Código no encontrado','valid'=>false]);
            exit;
        }
        if (!$event['is_active']) {
            echo json_encode(['ok'=>false,'error'=>'Este evento ya fue cerrado','valid'=>false,'closed'=>true]);
            exit;
        }

        echo json_encode([
            'ok'=>true,'valid'=>true,
            'event'=>[
                'id'=>intval($event['id']),
                'code'=>$event['event_code'],
                'title'=>$event['title'],
                'description'=>$event['description'],
                'type'=>$event['event_type'],
                'career'=>$event['career'],
                'start_time'=>$event['start_time'],
                'end_time'=>$event['end_time'],
                'location'=>$event['location']
            ]
        ]);
        exit;
    }

    // ── Mis eventos (docente) ──
    if ($action === 'my_events') {
        $decoded = require_auth();
        $stmt = $pdo->prepare("SELECT e.*, 
            (SELECT COUNT(*) FROM attendance_records ar WHERE ar.event_id = e.id) as total_asistentes
            FROM attendance_events e WHERE e.created_by = ? ORDER BY e.created_at DESC LIMIT 50");
        $stmt->execute([$decoded->user_id]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $events = [];
        foreach ($rows as $r) {
            $events[] = [
                'id'=>intval($r['id']),
                'code'=>$r['event_code'],
                'title'=>$r['title'],
                'description'=>$r['description'],
                'type'=>$r['event_type'],
                'career'=>$r['career'],
                'modality'=>$r['modality'],
                'start_time'=>$r['start_time'],
                'end_time'=>$r['end_time'],
                'location'=>$r['location'],
                'is_active'=>intval($r['is_active']),
                'total_asistentes'=>intval($r['total_asistentes']),
                'created_at'=>$r['created_at'],
                'closed_at'=>$r['closed_at']
            ];
        }

        echo json_encode(['ok'=>true,'events'=>$events,'total'=>count($events)]);
        exit;
    }

    // ── Detalle de evento + asistentes ──
    if ($action === 'event') {
        $event_id = intval($_GET['id'] ?? 0);
        if (!$event_id) { http_response_code(400); echo json_encode(['error'=>'id requerido']); exit; }

        $stmt = $pdo->prepare("SELECT e.*, u.firstname, u.lastname FROM attendance_events e LEFT JOIN users u ON e.created_by = u.id WHERE e.id = ?");
        $stmt->execute([$event_id]);
        $r = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$r) { http_response_code(404); echo json_encode(['error'=>'Evento no encontrado']); exit; }

        // Asistentes
        $stmt2 = $pdo->prepare("SELECT * FROM attendance_records WHERE event_id = ? ORDER BY hora, nombre");
        $stmt2->execute([$event_id]);
        $attendees = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        $records = [];
        foreach ($attendees as $a) {
            $records[] = [
                'id'=>intval($a['id']),
                'cedula'=>$a['cedula'],
                'nombre'=>$a['nombre'],
                'carrera'=>$a['carrera'],
                'seccion'=>$a['seccion'],
                'grado'=>$a['grado'],
                'estado'=>$a['estado'],
                'fecha'=>$a['fecha'],
                'hora'=>$a['hora'],
                'observacion'=>$a['observacion'],
                'created_at'=>$a['created_at']
            ];
        }

        echo json_encode([
            'ok'=>true,
            'event'=>[
                'id'=>intval($r['id']),
                'code'=>$r['event_code'],
                'title'=>$r['title'],
                'description'=>$r['description'],
                'type'=>$r['event_type'],
                'career'=>$r['career'],
                'modality'=>$r['modality'],
                'start_time'=>$r['start_time'],
                'end_time'=>$r['end_time'],
                'location'=>$r['location'],
                'is_active'=>intval($r['is_active']),
                'created_at'=>$r['created_at'],
                'closed_at'=>$r['closed_at'],
                'teacher'=>trim(($r['firstname']??'').' '.($r['lastname']??''))
            ],
            'attendees'=>$records,
            'total'=>count($records)
        ]);
        exit;
    }

    // ── Reporte general con filtros ──
    if ($action === 'report_general') {
        $career = trim($_GET['career'] ?? '');
        $fecha = $_GET['fecha'] ?? '';
        $event_type = trim($_GET['event_type'] ?? '');
        $seccion = trim($_GET['seccion'] ?? '');

        $conditions = [];
        $params = [];

        if ($career !== '') { $conditions[] = "ar.carrera = ?"; $params[] = $career; }
        if ($fecha !== '') { $conditions[] = "ar.fecha = ?"; $params[] = $fecha; }
        if ($event_type !== '') { $conditions[] = "ae.event_type = ?"; $params[] = $event_type; }
        if ($seccion !== '') { $conditions[] = "ar.seccion = ?"; $params[] = $seccion; }

        $where = count($conditions) > 0 ? 'WHERE ' . implode(' AND ', $conditions) : '';

        $stmt = $pdo->prepare("
            SELECT ar.*, ae.title as event_title, ae.event_code, ae.event_type
            FROM attendance_records ar
            JOIN attendance_events ae ON ar.event_id = ae.id
            $where
            ORDER BY ar.fecha DESC, ar.hora DESC
            LIMIT 500
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $records = [];
        foreach ($rows as $r) {
            $records[] = [
                'cedula'=>$r['cedula'],
                'nombre'=>$r['nombre'],
                'carrera'=>$r['carrera'],
                'seccion'=>$r['seccion'],
                'grado'=>$r['grado'],
                'estado'=>$r['estado'],
                'fecha'=>$r['fecha'],
                'hora'=>$r['hora'],
                'event_title'=>$r['event_title'],
                'event_code'=>$r['event_code'],
                'event_type'=>$r['event_type']
            ];
        }

        echo json_encode(['ok'=>true,'records'=>$records,'total'=>count($records)]);
        exit;
    }

    // ── Exportar CSV ──
    if ($action === 'exportar') {
        $event_id = intval($_GET['event_id'] ?? 0);
        if (!$event_id) { http_response_code(400); echo json_encode(['error'=>'event_id requerido']); exit; }

        $stmt = $pdo->prepare("SELECT ar.*, ae.title as event_title, ae.event_code FROM attendance_records ar JOIN attendance_events ae ON ar.event_id = ae.id WHERE ar.event_id = ? ORDER BY ar.hora, ar.nombre");
        $stmt->execute([$event_id]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="asistencia_' . date('Y-m-d') . '.csv"');
        $output = fopen('php://output', 'w');
        fputcsv($output, ['Cédula','Nombre','Carrera','Sección','Grado','Estado','Fecha','Hora','Evento','Código']);
        foreach ($rows as $r) {
            fputcsv($output, [$r['cedula'],$r['nombre'],$r['carrera'],$r['seccion'],$r['grado'],$r['estado'],$r['fecha'],$r['hora'],$r['event_title'],$r['event_code']]);
        }
        fclose($output);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error'=>'Acción no válida']);
    exit;
}

// ═══════════════════════════════════════════════════════
// POST — Escritura
// ═══════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_REQUEST['action'] ?? null;
    if (!$action) {
        $json = json_decode(file_get_contents('php://input'), true);
        $action = $json['action'] ?? null;
    }
    if (!$action) { http_response_code(400); echo json_encode(['error'=>'Acción requerida']); exit; }

    $pdo = db();

    // ── Crear evento (docente) ──
    if ($action === 'create_event') {
        $decoded = require_auth();
        if (!in_array($decoded->role, ['teacher','docente','admin','academico','administrador_plataforma'])) {
            http_response_code(403); echo json_encode(['error'=>'Solo docentes y admins pueden crear eventos']); exit;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) $input = $_POST;

        $title = trim($input['title'] ?? '');
        $description = trim($input['description'] ?? '');
        $event_type = trim($input['event_type'] ?? 'clase');
        $career = trim($input['career'] ?? '');
        $modality = trim($input['modality'] ?? 'presencial');
        $start_time = $input['start_time'] ?? '';
        $end_time = $input['end_time'] ?? '';
        $location = trim($input['location'] ?? '');

        if (!$title) { http_response_code(400); echo json_encode(['error'=>'Título requerido']); exit; }

        // Generar código único (reintentar si colisiona)
        $code = '';
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $code = generateEventCode();
            $check = $pdo->prepare("SELECT id FROM attendance_events WHERE event_code = ?");
            $check->execute([$code]);
            if (!$check->fetch()) break;
        }

        $now = date('Y-m-d H:i');
        $stmt = $pdo->prepare("INSERT INTO attendance_events (event_code, title, description, event_type, career, modality, start_time, end_time, location, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$code, $title, $description, $event_type, $career, $modality, $start_time, $end_time, $location, $decoded->user_id]);

        echo json_encode([
            'ok'=>true,
            'id'=>$pdo->lastInsertId(),
            'code'=>$code,
            'mensaje'=>'Evento creado. Código: '.$code
        ]);
        exit;
    }

    // ── Cerrar evento ──
    if ($action === 'close_event') {
        $decoded = require_auth();
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) $input = $_POST;

        $event_id = intval($input['event_id'] ?? 0);
        if (!$event_id) { http_response_code(400); echo json_encode(['error'=>'event_id requerido']); exit; }

        // Verificar permisos
        $stmt = $pdo->prepare("SELECT created_by FROM attendance_events WHERE id = ?");
        $stmt->execute([$event_id]);
        $ev = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$ev) { http_response_code(404); echo json_encode(['error'=>'Evento no encontrado']); exit; }
        if ($ev['created_by'] != $decoded->user_id && !in_array($decoded->role, ['admin','administrador_plataforma'])) {
            http_response_code(403); echo json_encode(['error'=>'Sin permiso']); exit;
        }

        $pdo->prepare("UPDATE attendance_events SET is_active = 0, closed_at = CURRENT_TIMESTAMP WHERE id = ?")->execute([$event_id]);
        echo json_encode(['ok'=>true,'mensaje'=>'Evento cerrado']);
        exit;
    }

    // ── Registrar asistencia (alumno, con código) ──
    if ($action === 'register') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) $input = $_POST;

        $code = strtoupper(trim($input['code'] ?? ''));
        $cedula = trim($input['cedula'] ?? '');
        $nombre = trim($input['nombre'] ?? '');
        $carrera = trim($input['carrera'] ?? '');
        $seccion = trim($input['seccion'] ?? '');
        $grado = trim($input['grado'] ?? '');
        $observacion = trim($input['observacion'] ?? '');

        if (!$code || !$cedula || !$nombre) {
            http_response_code(400);
            echo json_encode(['ok'=>false,'error'=>'Código, cédula y nombre son requeridos']);
            exit;
        }

        // Verificar que el código existe y está activo
        $stmt = $pdo->prepare("SELECT id, event_code, title FROM attendance_events WHERE event_code = ? AND is_active = 1");
        $stmt->execute([$code]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$event) {
            echo json_encode(['ok'=>false,'error'=>'Código inválido o evento cerrado']);
            exit;
        }

        // Verificar duplicado (misma cédula en mismo evento)
        $dup = $pdo->prepare("SELECT id FROM attendance_records WHERE event_id = ? AND cedula = ?");
        $dup->execute([$event['id'], $cedula]);
        if ($dup->fetch()) {
            echo json_encode(['ok'=>false,'error'=>'Ya registraste tu asistencia en este evento','duplicate'=>true]);
            exit;
        }

        // Registrar con fecha + hora + minutos
        $fecha = date('Y-m-d');
        $hora = date('H:i');

        $stmt = $pdo->prepare("INSERT INTO attendance_records (event_id, event_code, cedula, nombre, carrera, seccion, grado, estado, fecha, hora, observacion) VALUES (?, ?, ?, ?, ?, ?, ?, 'presente', ?, ?, ?)");
        $stmt->execute([$event['id'], $code, $cedula, strtoupper($nombre), $carrera, $seccion, $grado, $fecha, $hora, $observacion]);

        echo json_encode([
            'ok'=>true,
            'mensaje'=>'Asistencia registrada',
            'event'=>$event['title'],
            'fecha'=>$fecha,
            'hora'=>$hora
        ]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error'=>'Acción no válida']);
    exit;
}

http_response_code(405);
echo json_encode(['error'=>'Método no permitido']);
