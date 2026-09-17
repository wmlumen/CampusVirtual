<?php
/**
 * Constructor Académico API — Espejo local (SQLite) del backend GAS v07.0
 * Mismas acciones y reglas: borrador→revisión→aprobado→publicado, ponderación ≤100%.
 * GET  ?action=list_drafts[&estado=] / get_subject&id= / list_bank / list_reviews
 * POST ?action=save_draft|save_program|save_unit|delete_unit|save_block|delete_block|
 *             save_activity|save_evaluation|save_question|delete_question|
 *             submit_review|review_decision|publish|archive|duplicate
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

function ct_ensure($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS subject_drafts (
        id TEXT PRIMARY KEY, codigo TEXT DEFAULT '', nombre TEXT NOT NULL,
        carrera TEXT DEFAULT '', grado TEXT DEFAULT '', semestre TEXT DEFAULT '',
        modalidad TEXT DEFAULT '', carga_horaria INTEGER DEFAULT 0,
        docente_cedula TEXT DEFAULT '', estado TEXT DEFAULT 'borrador',
        version INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, deleted_at DATETIME
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS ct_programs (
        id TEXT PRIMARY KEY, subject_id TEXT NOT NULL, fundamentacion TEXT DEFAULT '',
        objetivo_general TEXT DEFAULT '', objetivos_especificos TEXT DEFAULT '',
        competencias TEXT DEFAULT '', capacidades TEXT DEFAULT '',
        metodologia TEXT DEFAULT '', requisitos TEXT DEFAULT '', bibliografia TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS ct_units (
        id TEXT PRIMARY KEY, subject_id TEXT NOT NULL, numero TEXT DEFAULT '',
        titulo TEXT NOT NULL, resumen TEXT DEFAULT '', objetivos TEXT DEFAULT '',
        indicadores TEXT DEFAULT '', duracion_min INTEGER DEFAULT 0, estado TEXT DEFAULT 'borrador',
        fecha_publicacion TEXT DEFAULT '', orden INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS ct_blocks (
        id TEXT PRIMARY KEY, unit_id TEXT NOT NULL, tipo TEXT NOT NULL,
        titulo TEXT DEFAULT '', contenido TEXT DEFAULT '', orden INTEGER DEFAULT 0,
        visible INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS ct_activities (
        id TEXT PRIMARY KEY, subject_id TEXT NOT NULL, unit_id TEXT DEFAULT '',
        titulo TEXT NOT NULL, instrucciones TEXT DEFAULT '', objetivo TEXT DEFAULT '',
        puntaje REAL DEFAULT 0, rubrica TEXT DEFAULT '', fecha_entrega TEXT DEFAULT '',
        permite_tardia INTEGER DEFAULT 0, tipos_archivo TEXT DEFAULT '', tam_max_mb INTEGER DEFAULT 0,
        modalidad TEXT DEFAULT 'individual', estado TEXT DEFAULT 'borrador',
        retroalimentacion TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS ct_evaluations (
        id TEXT PRIMARY KEY, subject_id TEXT NOT NULL, nombre TEXT NOT NULL,
        tipo TEXT DEFAULT 'parcial', puntaje_max REAL DEFAULT 0, ponderacion REAL DEFAULT 0,
        fecha_apertura TEXT DEFAULT '', fecha_cierre TEXT DEFAULT '', duracion_min INTEGER DEFAULT 0,
        intentos_max INTEGER DEFAULT 1, modalidad TEXT DEFAULT 'virtual',
        aleatorizar INTEGER DEFAULT 0, publicar_resultados INTEGER DEFAULT 0,
        estado TEXT DEFAULT 'borrador',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS ct_questions (
        id TEXT PRIMARY KEY, subject_id TEXT NOT NULL, unit_id TEXT DEFAULT '',
        tipo TEXT DEFAULT 'multiple', pregunta TEXT NOT NULL, opciones_json TEXT DEFAULT '[]',
        correcta TEXT DEFAULT '', indicador TEXT DEFAULT '', dificultad TEXT DEFAULT 'media',
        puntaje REAL DEFAULT 0, retroalimentacion TEXT DEFAULT '', estado TEXT DEFAULT 'activo',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS ct_reviews (
        id TEXT PRIMARY KEY, subject_id TEXT NOT NULL, de_estado TEXT DEFAULT '',
        a_estado TEXT DEFAULT '', por_rol TEXT DEFAULT '', por_cedula TEXT DEFAULT '',
        comentario TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
}

function ct_id($p = 'CT') {
    return $p . '-' . base_convert((string)(microtime(true) * 1000), 10, 36) . substr(md5(uniqid((string)mt_rand(), true)), 0, 6);
}

function ct_upsert($pdo, $tabla, $id, $data) {
    if (!$id) {
        $id = ct_id(strtoupper(substr($tabla, 0, 4)));
        $cols = array_merge(['id'], array_keys($data), ['created_at']);
        $vals = array_merge([$id], array_values($data), [date('Y-m-d H:i:s')]);
        $stmt = $pdo->prepare("INSERT INTO $tabla (" . implode(',', $cols) . ") VALUES (" . implode(',', array_fill(0, count($cols), '?')) . ")");
        $stmt->execute($vals);
        return $id;
    }
    $sets = [];
    $vals = [];
    foreach ($data as $k => $v) { $sets[] = "$k = ?"; $vals[] = $v; }
    $sets[] = "updated_at = datetime('now')";
    $vals[] = $id;
    $pdo->prepare("UPDATE $tabla SET " . implode(',', $sets) . " WHERE id = ?")->execute($vals);
    return $id;
}

function ct_list($pdo, $tabla, $filter = []) {
    $sql = "SELECT * FROM $tabla";
    $where = [];
    $params = [];
    foreach ($filter as $k => $v) { $where[] = "$k = ?"; $params[] = $v; }
    if (in_array('deleted_at', array_column($pdo->query("PRAGMA table_info($tabla)")->fetchAll(PDO::FETCH_ASSOC), 'name'))) {
        $where[] = "deleted_at IS NULL";
    }
    if ($where) $sql .= " WHERE " . implode(' AND ', $where);
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

$pdo = db();
ct_ensure($pdo);

// ═══ LECTURA ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $action = $_GET['action'];

    if ($action === 'list_drafts') {
        $f = [];
        if (!empty($_GET['estado'])) $f['estado'] = $_GET['estado'];
        if (!empty($_GET['carrera'])) $f['carrera'] = $_GET['carrera'];
        if (!empty($_GET['docente'])) $f['docente_cedula'] = $_GET['docente'];
        api_response(['ok' => true, 'drafts' => ct_list($pdo, 'subject_drafts', $f)]);
    }

    if ($action === 'get_subject') {
        $id = $_GET['id'] ?? '';
        $d = ct_list($pdo, 'subject_drafts', ['id' => $id]);
        if (!$d) api_error('Asignatura no encontrada', 404);
        $units = ct_list($pdo, 'ct_units', ['subject_id' => $id]);
        usort($units, fn($a, $b) => ((float)($a['orden'] ?? 0)) <=> ((float)($b['orden'] ?? 0)));
        foreach ($units as &$u) {
            $blocks = ct_list($pdo, 'ct_blocks', ['unit_id' => $u['id']]);
            usort($blocks, fn($a, $b) => ((float)($a['orden'] ?? 0)) <=> ((float)($b['orden'] ?? 0)));
            $u['blocks'] = $blocks;
        }
        unset($u);
        $prog = ct_list($pdo, 'ct_programs', ['subject_id' => $id]);
        api_response([
            'ok' => true,
            'draft' => $d[0],
            'program' => $prog[0] ?? null,
            'units' => $units,
            'activities' => ct_list($pdo, 'ct_activities', ['subject_id' => $id]),
            'evaluations' => ct_list($pdo, 'ct_evaluations', ['subject_id' => $id]),
            'reviews' => ct_list($pdo, 'ct_reviews', ['subject_id' => $id])
        ]);
    }

    if ($action === 'list_bank') {
        $f = [];
        foreach (['subjectID' => 'subject_id', 'unitID' => 'unit_id', 'tipo' => 'tipo'] as $q => $col) {
            if (!empty($_GET[$q])) $f[$col] = $_GET[$q];
        }
        $all = ct_list($pdo, 'ct_questions', $f);
        $out = array_map(function ($q) {
            unset($q['correcta']);
            return $q;
        }, $all);
        api_response(['ok' => true, 'questions' => $out]);
    }

    if ($action === 'list_reviews') {
        $f = [];
        if (!empty($_GET['subjectID'])) $f['subject_id'] = $_GET['subjectID'];
        api_response(['ok' => true, 'reviews' => ct_list($pdo, 'ct_reviews', $f)]);
    }
}

// ═══ ESCRITURA ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;
    $action = $input['action'] ?? $_REQUEST['action'] ?? '';
    $g = fn($k, $d = '') => isset($input[$k]) ? $input[$k] : $d;

    $needsAuth = !in_array($action, []);
    if ($needsAuth) require_auth();

    if ($action === 'save_draft') {
        if (!$g('nombre')) api_error('Falta nombre', 400);
        $id = ct_upsert($pdo, 'subject_drafts', $g('id'), [
            'codigo' => $g('codigo'), 'nombre' => $g('nombre'), 'carrera' => $g('carrera'),
            'grado' => $g('grado'), 'semestre' => $g('semestre'), 'modalidad' => $g('modalidad'),
            'carga_horaria' => intval($g('carga_horaria', 0)), 'docente_cedula' => $g('docente_cedula'),
            'estado' => $g('estado', 'borrador') ?: 'borrador', 'version' => intval($g('version', 1))
        ]);
        api_response(['ok' => true, 'id' => $id]);
    }

    if ($action === 'save_program') {
        if (!$g('subjectID')) api_error('Falta subjectID', 400);
        $ex = ct_list($pdo, 'ct_programs', ['subject_id' => $g('subjectID')]);
        $pid = ct_upsert($pdo, 'ct_programs', $ex[0]['id'] ?? '', [
            'subject_id' => $g('subjectID'), 'fundamentacion' => $g('fundamentacion'),
            'objetivo_general' => $g('objetivo_general'), 'objetivos_especificos' => $g('objetivos_especificos'),
            'competencias' => $g('competencias'), 'capacidades' => $g('capacidades'),
            'metodologia' => $g('metodologia'), 'requisitos' => $g('requisitos'),
            'bibliografia' => $g('bibliografia')
        ]);
        api_response(['ok' => true, 'id' => $pid]);
    }

    if (in_array($action, ['save_unit', 'delete_unit', 'save_block', 'delete_block', 'save_activity',
                           'save_evaluation', 'save_question', 'delete_question'])) {
        $map = [
            'save_unit' => ['ct_units', ['subject_id' => $g('subjectID'), 'numero' => $g('numero'), 'titulo' => $g('titulo'), 'resumen' => $g('resumen'), 'objetivos' => $g('objetivos'), 'indicadores' => $g('indicadores'), 'duracion_min' => intval($g('duracion_min', 0)), 'estado' => $g('estado', 'borrador') ?: 'borrador', 'fecha_publicacion' => $g('fecha_publicacion'), 'orden' => intval($g('orden', 0))], ['subjectID', 'titulo']],
            'save_block' => ['ct_blocks', ['unit_id' => $g('unitID'), 'tipo' => $g('tipo'), 'titulo' => $g('titulo'), 'contenido' => $g('contenido'), 'orden' => intval($g('orden', 0)), 'visible' => empty($g('visible')) && $g('visible') !== '' ? 0 : 1], ['unitID', 'tipo']],
            'save_activity' => ['ct_activities', ['subject_id' => $g('subjectID'), 'unit_id' => $g('unitID'), 'titulo' => $g('titulo'), 'instrucciones' => $g('instrucciones'), 'objetivo' => $g('objetivo'), 'puntaje' => floatval($g('puntaje', 0)), 'rubrica' => $g('rubrica'), 'fecha_entrega' => $g('fecha_entrega'), 'permite_tardia' => !empty($g('permite_tardia')) ? 1 : 0, 'tipos_archivo' => $g('tipos_archivo'), 'tam_max_mb' => intval($g('tam_max', 0)), 'modalidad' => $g('modalidad', 'individual') ?: 'individual', 'estado' => $g('estado', 'borrador') ?: 'borrador', 'retroalimentacion' => $g('retroalimentacion')], ['subjectID', 'titulo']],
            'save_evaluation' => ['ct_evaluations', ['subject_id' => $g('subjectID'), 'nombre' => $g('nombre'), 'tipo' => $g('tipo', 'parcial') ?: 'parcial', 'puntaje_max' => floatval($g('puntaje_max', 0)), 'ponderacion' => floatval($g('ponderacion', 0)), 'fecha_apertura' => $g('fecha_apertura'), 'fecha_cierre' => $g('fecha_cierre'), 'duracion_min' => intval($g('duracion_min', 0)), 'intentos_max' => intval($g('intentos_max', 1)), 'modalidad' => $g('modalidad', 'virtual') ?: 'virtual', 'aleatorizar' => !empty($g('aleatorizar')) ? 1 : 0, 'publicar_resultados' => !empty($g('publicar_resultados')) ? 1 : 0, 'estado' => $g('estado', 'borrador') ?: 'borrador'], ['subjectID', 'nombre']],
            'save_question' => ['ct_questions', ['subject_id' => $g('subjectID'), 'unit_id' => $g('unitID'), 'tipo' => $g('tipo', 'multiple') ?: 'multiple', 'pregunta' => $g('pregunta'), 'opciones_json' => $g('opciones_json', '[]'), 'correcta' => $g('correcta'), 'indicador' => $g('indicador'), 'dificultad' => $g('dificultad', 'media') ?: 'media', 'puntaje' => floatval($g('puntaje', 0)), 'retroalimentacion' => $g('retroalimentacion'), 'estado' => $g('estado', 'activo') ?: 'activo'], ['subjectID', 'pregunta']],
        ];
        if (isset($map[$action])) {
            [$tabla, $datos, $req] = $map[$action];
            foreach ($req as $campo) {
                if ($campo === 'subjectID' && !$g('subjectID')) api_error('Faltan datos', 400);
                if ($campo === 'unitID' && !$g('unitID')) api_error('Faltan datos', 400);
                if ($campo === 'tipo' && !$g('tipo')) api_error('Faltan datos', 400);
                if ($campo === 'titulo' && !$g('titulo')) api_error('Faltan datos', 400);
                if ($campo === 'nombre' && !$g('nombre')) api_error('Faltan datos', 400);
                if ($campo === 'pregunta' && !$g('pregunta')) api_error('Faltan datos', 400);
            }
            if ($action === 'save_evaluation') {
                $suma = (float)$pdo->query("SELECT COALESCE(SUM(ponderacion),0) FROM ct_evaluations WHERE subject_id = " . $pdo->quote($g('subjectID')) . " AND deleted_at IS NULL" . ($g('id') ? " AND id <> " . $pdo->quote($g('id')) : ""))->fetchColumn();
                if ($suma + floatval($g('ponderacion', 0)) > 100) {
                    api_error('La suma de ponderaciones superaría 100% (actual ' . $suma . '%)', 400);
                }
            }
            $id = ct_upsert($pdo, $tabla, $g('id'), $datos);
            $extra = [];
            if ($action === 'save_evaluation') {
                $extra['suma_ponderacion'] = (float)$pdo->query("SELECT COALESCE(SUM(ponderacion),0) FROM ct_evaluations WHERE subject_id = " . $pdo->quote($g('subjectID')) . " AND deleted_at IS NULL")->fetchColumn();
            }
            api_response(array_merge(['ok' => true, 'id' => $id], $extra));
        }
        $dels = ['delete_unit' => 'ct_units', 'delete_block' => 'ct_blocks', 'delete_question' => 'ct_questions', 'delete_activity' => 'ct_activities', 'delete_evaluation' => 'ct_evaluations'];
        if (isset($dels[$action])) {
            if (!$g('id')) api_error('Falta id', 400);
            $pdo->prepare("UPDATE {$dels[$action]} SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?")->execute([$g('id')]);
            api_response(['ok' => true]);
        }
    }

    if (in_array($action, ['submit_review', 'review_decision', 'publish', 'archive', 'duplicate'])) {
        $id = $g('id');
        $d = ct_list($pdo, 'subject_drafts', ['id' => $id]);
        if (!$d) api_error('Asignatura no encontrada', 404);
        $est = $d[0]['estado'];
        $rev = function ($de, $a) use ($pdo, $id, $g) {
            $pdo->prepare("UPDATE subject_drafts SET estado = ?, updated_at = datetime('now') WHERE id = ?")->execute([$a, $id]);
            $pdo->prepare("INSERT INTO ct_reviews (id, subject_id, de_estado, a_estado, por_rol, por_cedula, comentario) VALUES (?,?,?,?,?,?,?)")
                ->execute([ct_id('REV'), $id, $de, $a, $g('por_rol', 'docente'), $g('por_cedula'), $g('comentario')]);
        };
        if ($action === 'submit_review') {
            if (!in_array($est, ['borrador', 'observado', 'corregido'])) api_error('Solo borrador/observado/corregido', 400);
            $rev($est, 'en_revision');
            api_response(['ok' => true]);
        }
        if ($action === 'review_decision') {
            if ($est !== 'en_revision') api_error('No está en revisión', 400);
            $nuevo = $g('decision') === 'aprobar' ? 'aprobado' : ($g('decision') === 'observar' ? 'observado' : '');
            if (!$nuevo) api_error('Decisión inválida', 400);
            $rev('en_revision', $nuevo);
            api_response(['ok' => true]);
        }
        if ($action === 'publish') {
            if ($est !== 'aprobado') api_error('Solo se publica lo aprobado', 400);
            $rev('aprobado', 'publicado');
            api_response(['ok' => true]);
        }
        if ($action === 'archive') {
            $rev($est, 'archivado');
            api_response(['ok' => true]);
        }
        if ($action === 'duplicate') {
            $nid = ct_upsert($pdo, 'subject_drafts', '', [
                'codigo' => ($d[0]['codigo'] ?? '') . '-Copia', 'nombre' => ($d[0]['nombre'] ?? '') . ' (copia)',
                'carrera' => $d[0]['carrera'] ?? '', 'grado' => $d[0]['grado'] ?? '',
                'semestre' => $d[0]['semestre'] ?? '', 'modalidad' => $d[0]['modalidad'] ?? '',
                'carga_horaria' => $d[0]['carga_horaria'] ?? 0, 'docente_cedula' => $g('docente_cedula', $d[0]['docente_cedula'] ?? ''),
                'estado' => 'borrador', 'version' => 1
            ]);
            foreach (ct_list($pdo, 'ct_units', ['subject_id' => $id]) as $u) {
                $nu = ct_upsert($pdo, 'ct_units', '', [
                    'subject_id' => $nid, 'numero' => $u['numero'], 'titulo' => $u['titulo'],
                    'resumen' => $u['resumen'], 'objetivos' => $u['objetivos'],
                    'indicadores' => $u['indicadores'], 'duracion_min' => $u['duracion_min'],
                    'estado' => 'borrador', 'fecha_publicacion' => '', 'orden' => $u['orden']
                ]);
                foreach (ct_list($pdo, 'ct_blocks', ['unit_id' => $u['id']]) as $b) {
                    ct_upsert($pdo, 'ct_blocks', '', [
                        'unit_id' => $nu, 'tipo' => $b['tipo'], 'titulo' => $b['titulo'],
                        'contenido' => $b['contenido'], 'orden' => $b['orden'], 'visible' => $b['visible']
                    ]);
                }
            }
            api_response(['ok' => true, 'id' => $nid]);
        }
    }
}
