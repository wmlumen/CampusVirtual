<?php
/**
 * Calendar Events API — Planificación docente con detección de conflictos
 * Endpoints:
 *   GET  ?action=list&career=X&month=X&year=X   → listar eventos (filtrable)
 *   GET  ?action=get&id=X                        → obtener un evento
 *   GET  ?action=conflicts&date=X&career=X       → verificar conflictos de fecha
 *   GET  ?action=teacher_days&teacher_id=X       → días ya planificados por docente
 *   POST action=create                           → crear evento (docente/admin)
 *   POST action=update                           → actualizar evento
 *   POST action=delete                           → eliminar evento
 *   GET  ?action=carreras                        → listar carreras disponibles
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');

// ═══════════════════════════════════════════════════════
// GET — Consultas
// ═══════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $action = $_GET['action'];
    $pdo = db();

    // ── Listar eventos del calendario ──
    if ($action === 'list') {
        $career = trim($_GET['career'] ?? '');
        $modality = trim($_GET['modality'] ?? '');
        $month = intval($_GET['month'] ?? date('m'));
        $year = intval($_GET['year'] ?? date('Y'));
        $teacher_id = intval($_GET['teacher_id'] ?? 0);
        $event_type = trim($_GET['event_type'] ?? '');

        // Calcular rango de fechas del mes
        $start = sprintf('%04d-%02d-01', $year, $month);
        $end = sprintf('%04d-%02d-31', $year, $month);

        $conditions = ["date >= ?", "date <= ?"];
        $params = [$start, $end];

        if ($career !== '') {
            $conditions[] = "(career = ? OR career = '')";
            $params[] = $career;
        }
        if ($modality !== '') {
            $conditions[] = "(modality = ? OR modality = '')";
            $params[] = $modality;
        }
        if ($teacher_id > 0) {
            $conditions[] = "created_by = ?";
            $params[] = $teacher_id;
        }
        if ($event_type !== '') {
            $conditions[] = "event_type = ?";
            $params[] = $event_type;
        }

        $where = implode(' AND ', $conditions);
        $stmt = $pdo->prepare("SELECT e.*, u.firstname, u.lastname FROM calendar_events e LEFT JOIN users u ON e.created_by = u.id WHERE $where ORDER BY e.date, e.start_time");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $events = [];
        foreach ($rows as $r) {
            $events[] = [
                'id' => intval($r['id']),
                'title' => $r['title'],
                'description' => $r['description'],
                'event_type' => $r['event_type'],
                'date' => $r['date'],
                'start_time' => $r['start_time'],
                'end_time' => $r['end_time'],
                'is_virtual' => intval($r['is_virtual']),
                'virtual_link' => $r['virtual_link'],
                'career' => $r['career'],
                'modality' => $r['modality'],
                'group_name' => $r['group_name'],
                'course_id' => intval($r['course_id']),
                'created_by' => intval($r['created_by']),
                'teacher_name' => trim(($r['firstname'] ?? '') . ' ' . ($r['lastname'] ?? '')),
            ];
        }

        echo json_encode(['ok' => true, 'events' => $events, 'total' => count($events)]);
        exit;
    }

    // ── Obtener un evento ──
    if ($action === 'get') {
        $id = intval($_GET['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'id requerido']); exit; }

        $stmt = $pdo->prepare("SELECT e.*, u.firstname, u.lastname FROM calendar_events e LEFT JOIN users u ON e.created_by = u.id WHERE e.id = ?");
        $stmt->execute([$id]);
        $r = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$r) { http_response_code(404); echo json_encode(['error' => 'Evento no encontrado']); exit; }

        echo json_encode(['ok' => true, 'event' => [
            'id' => intval($r['id']),
            'title' => $r['title'],
            'description' => $r['description'],
            'event_type' => $r['event_type'],
            'date' => $r['date'],
            'start_time' => $r['start_time'],
            'end_time' => $r['end_time'],
            'is_virtual' => intval($r['is_virtual']),
            'virtual_link' => $r['virtual_link'],
            'career' => $r['career'],
            'modality' => $r['modality'],
            'group_name' => $r['group_name'],
            'course_id' => intval($r['course_id']),
            'created_by' => intval($r['created_by']),
            'teacher_name' => trim(($r['firstname'] ?? '') . ' ' . ($r['lastname'] ?? '')),
        ]]);
        exit;
    }

    // ── Verificar conflictos de fecha ──
    if ($action === 'conflicts') {
        $date = $_GET['date'] ?? '';
        $career = trim($_GET['career'] ?? '');
        $exclude_id = intval($_GET['exclude_id'] ?? 0);

        if (!$date) { http_response_code(400); echo json_encode(['error' => 'date requerido']); exit; }

        $conditions = ["date = ?"];
        $params = [$date];

        if ($career !== '') {
            $conditions[] = "(career = ? OR career = '')";
            $params[] = $career;
        }
        if ($exclude_id > 0) {
            $conditions[] = "id != ?";
            $params[] = $exclude_id;
        }

        $where = implode(' AND ', $conditions);
        $stmt = $pdo->prepare("SELECT e.*, u.firstname, u.lastname FROM calendar_events e LEFT JOIN users u ON e.created_by = u.id WHERE $where ORDER BY e.start_time");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conflicts = [];
        foreach ($rows as $r) {
            $conflicts[] = [
                'id' => intval($r['id']),
                'title' => $r['title'],
                'event_type' => $r['event_type'],
                'start_time' => $r['start_time'],
                'end_time' => $r['end_time'],
                'career' => $r['career'],
                'group_name' => $r['group_name'],
                'teacher_name' => trim(($r['firstname'] ?? '') . ' ' . ($r['lastname'] ?? '')),
            ];
        }

        echo json_encode(['ok' => true, 'has_conflicts' => count($conflicts) > 0, 'conflicts' => $conflicts]);
        exit;
    }

    // ── Días planificados por docente ──
    if ($action === 'teacher_days') {
        $teacher_id = intval($_GET['teacher_id'] ?? 0);
        $month = intval($_GET['month'] ?? date('m'));
        $year = intval($_GET['year'] ?? date('Y'));

        if (!$teacher_id) { http_response_code(400); echo json_encode(['error' => 'teacher_id requerido']); exit; }

        $start = sprintf('%04d-%02d-01', $year, $month);
        $end = sprintf('%04d-%02d-31', $year, $month);

        $stmt = $pdo->prepare("SELECT date, COUNT(*) as total, GROUP_CONCAT(title, ' | ') as titulos FROM calendar_events WHERE created_by = ? AND date >= ? AND date <= ? GROUP BY date ORDER BY date");
        $stmt->execute([$teacher_id, $start, $end]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $days = [];
        foreach ($rows as $r) {
            $days[] = [
                'date' => $r['date'],
                'total_events' => intval($r['total']),
                'titles' => $r['titulos'],
            ];
        }

        echo json_encode(['ok' => true, 'days' => $days]);
        exit;
    }

    // ── Carreras disponibles ──
    if ($action === 'carreras') {
        try {
            $stmt = $pdo->query("SELECT DISTINCT carrera FROM asignaturas WHERE carrera != '' AND estado = 'activo' ORDER BY carrera");
            $carreras = $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (Exception $e) {
            $carreras = [];
        }
        echo json_encode(['ok' => true, 'carreras' => $carreras]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Accion no valida']);
    exit;
}

// ═══════════════════════════════════════════════════════
// POST — Crear / Actualizar / Eliminar
// ═══════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_REQUEST['action'] ?? null;
    if (!$action) {
        $json = json_decode(file_get_contents('php://input'), true);
        $action = $json['action'] ?? null;
    }
    if (!$action) { http_response_code(400); echo json_encode(['error' => 'Accion requerida']); exit; }

    $pdo = db();

    // ── Crear evento ──
    if ($action === 'create') {
        $decoded = require_auth();
        $role = $decoded->role;

        if (!in_array($role, ['teacher', 'docente', 'admin', 'academico', 'administrador_plataforma'])) {
            http_response_code(403);
            echo json_encode(['error' => 'Solo docentes y admins pueden crear eventos']);
            exit;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) $input = $_POST;

        $title = trim($input['title'] ?? '');
        $description = trim($input['description'] ?? '');
        $event_type = trim($input['event_type'] ?? 'clase');
        $date = $input['date'] ?? '';
        $start_time = $input['start_time'] ?? '';
        $end_time = $input['end_time'] ?? '';
        $is_virtual = intval($input['is_virtual'] ?? 0);
        $virtual_link = trim($input['virtual_link'] ?? '');
        $career = trim($input['career'] ?? '');
        $modality = trim($input['modality'] ?? '');
        $group_name = trim($input['group_name'] ?? '');
        $course_id = intval($input['course_id'] ?? 0);

        if (!$title || !$date) {
            http_response_code(400);
            echo json_encode(['error' => 'title y date son requeridos']);
            exit;
        }

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            http_response_code(400);
            echo json_encode(['error' => 'Formato de fecha invalido (YYYY-MM-DD)']);
            exit;
        }

        // Verificar conflictos antes de crear
        $conflict_conditions = ["date = ?"];
        $conflict_params = [$date];

        if ($career !== '') {
            $conflict_conditions[] = "(career = ? OR career = '')";
            $conflict_params[] = $career;
        }

        $conflict_where = implode(' AND ', $conflict_conditions);
        $check = $pdo->prepare("SELECT id, title, start_time, end_time FROM calendar_events WHERE $conflict_where");
        $check->execute($conflict_params);
        $existing = $check->fetchAll(PDO::FETCH_ASSOC);

        // Verificar solapamiento de horario
        $has_real_conflict = false;
        if ($start_time && $end_time) {
            foreach ($existing as $ex) {
                if ($ex['start_time'] && $ex['end_time']) {
                    if ($start_time < $ex['end_time'] && $end_time > $ex['start_time']) {
                        $has_real_conflict = true;
                        break;
                    }
                } else {
                    // Sin horario definido = conflicto total el mismo día
                    $has_real_conflict = true;
                    break;
                }
            }
        } elseif (!empty($existing)) {
            $has_real_conflict = true;
        }

        if ($has_real_conflict) {
            echo json_encode([
                'ok' => false,
                'conflict' => true,
                'error' => 'Ya existe un evento planificado para esta fecha' . ($career ? " en $career" : ''),
                'existing_events' => $existing
            ]);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO calendar_events (title, description, event_type, date, start_time, end_time, is_virtual, virtual_link, career, modality, group_name, course_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$title, $description, $event_type, $date, $start_time, $end_time, $is_virtual, $virtual_link, $career, $modality, $group_name, $course_id, $decoded->user_id]);

        echo json_encode([
            'ok' => true,
            'id' => $pdo->lastInsertId(),
            'mensaje' => 'Evento creado exitosamente'
        ]);
        exit;
    }

    // ── Actualizar evento ──
    if ($action === 'update') {
        $decoded = require_auth();
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) $input = $_POST;

        $id = intval($input['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'id requerido']); exit; }

        // Verificar permisos: solo el creador o admin
        $stmt = $pdo->prepare("SELECT created_by FROM calendar_events WHERE id = ?");
        $stmt->execute([$id]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$event) { http_response_code(404); echo json_encode(['error' => 'Evento no encontrado']); exit; }

        if ($event['created_by'] != $decoded->user_id && !in_array($decoded->role, ['admin', 'administrador_plataforma'])) {
            http_response_code(403);
            echo json_encode(['error' => 'No tienes permiso para editar este evento']);
            exit;
        }

        $sets = [];
        $vals = [];

        $fields = ['title', 'description', 'event_type', 'date', 'start_time', 'end_time', 'is_virtual', 'virtual_link', 'career', 'modality', 'group_name', 'course_id'];
        foreach ($fields as $f) {
            if (isset($input[$f])) {
                $sets[] = "$f = ?";
                $vals[] = (is_int($input[$f]) || $f === 'is_virtual' || $f === 'course_id') ? intval($input[$f]) : trim($input[$f]);
            }
        }

        if (empty($sets)) { http_response_code(400); echo json_encode(['error' => 'Sin cambios']); exit; }

        $sets[] = "updated_at = CURRENT_TIMESTAMP";
        $vals[] = $id;

        $sql = "UPDATE calendar_events SET " . implode(', ', $sets) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($vals);

        echo json_encode(['ok' => true, 'mensaje' => 'Evento actualizado']);
        exit;
    }

    // ── Eliminar evento ──
    if ($action === 'delete') {
        $decoded = require_auth();
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) $input = $_POST;

        $id = intval($input['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'id requerido']); exit; }

        $stmt = $pdo->prepare("SELECT created_by FROM calendar_events WHERE id = ?");
        $stmt->execute([$id]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$event) { http_response_code(404); echo json_encode(['error' => 'Evento no encontrado']); exit; }

        if ($event['created_by'] != $decoded->user_id && !in_array($decoded->role, ['admin', 'administrador_plataforma'])) {
            http_response_code(403);
            echo json_encode(['error' => 'No tienes permiso para eliminar este evento']);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM calendar_events WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['ok' => true, 'mensaje' => 'Evento eliminado']);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Accion no valida']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Metodo no permitido']);
