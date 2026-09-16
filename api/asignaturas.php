<?php
/**
 * Asignaturas API — CRUD completo para asignaturas del Instituto Superior Centuria
 * Los datos se almacenan en la BD y se sirven dinámicamente
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

// ═══ ASEGURAR TABLA (+ columna modulo/Mes) ═══
function ensureAsignaturasTable($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS asignaturas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        nombre_completo TEXT DEFAULT '',
        carrera TEXT DEFAULT '',
        grado TEXT DEFAULT '',
        semestre TEXT DEFAULT '',
        modulo TEXT DEFAULT '',
        carga_horaria INTEGER DEFAULT 0,
        unidades INTEGER DEFAULT 10,
        descripcion TEXT DEFAULT '',
        color TEXT DEFAULT '#00B140',
        icono TEXT DEFAULT 'bi-book',
        estado TEXT DEFAULT 'activo',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    try {
        $cols = [];
        foreach ($pdo->query("PRAGMA table_info(asignaturas)") as $r) { $cols[] = $r['name']; }
        if (!in_array('modulo', $cols)) { $pdo->exec("ALTER TABLE asignaturas ADD COLUMN modulo TEXT DEFAULT ''"); }
    } catch (Exception $e) {}
}

// ═══ LISTAR (con docente vinculado; ?estado=todas|activo|inactivo, por defecto activo) ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'list') {
    $pdo = db();
    ensureAsignaturasTable($pdo);

    $carrera = trim($_GET['carrera'] ?? '');
    $estado = trim($_GET['estado'] ?? 'activo');
    if (!in_array($estado, ['activo', 'inactivo', 'todas'])) $estado = 'activo';

    $where = [];
    $params = [];
    if ($carrera !== '') { $where[] = "a.carrera = ?"; $params[] = $carrera; }
    if ($estado !== 'todas') { $where[] = "a.estado = ?"; $params[] = $estado; }

    $sql = "SELECT a.*,
                GROUP_CONCAT(TRIM(u.firstname || ' ' || u.lastname) || ' (' || u.username || ')', ' | ') AS docentes,
                COUNT(DISTINCT CASE WHEN ur.estado = 'activo' THEN ur.user_id END) AS total_docentes
            FROM asignaturas a
            LEFT JOIN user_roles ur ON ur.asignatura = a.codigo AND ur.rol IN ('docente','teacher') AND ur.estado = 'activo'
            LEFT JOIN users u ON u.id = ur.user_id";
    if ($where) $sql .= " WHERE " . implode(' AND ', $where);
    $sql .= " GROUP BY a.id ORDER BY a.carrera, a.semestre, a.nombre";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    api_response(['items' => $items, 'count' => count($items), 'estado' => $estado]);
}

// ═══ OBTENER POR CÓDIGO ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get') {
    $codigo = $_GET['codigo'] ?? '';
    if (!$codigo) api_error('Código requerido', 400);
    
    $pdo = db();
    ensureAsignaturasTable($pdo);
    
    $stmt = $pdo->prepare("SELECT * FROM asignaturas WHERE codigo = ?");
    $stmt->execute([$codigo]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$item) api_error('Asignatura no encontrada', 404);
    api_response($item);
}

// ═══ CREAR (solo admin/academico) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'create') {
    $decoded = require_auth();
    if (!in_array($decoded->role, ['admin','administrador_plataforma','academico'])) {
        api_error('Solo administradores pueden crear asignaturas', 403);
    }

    $pdo = db();
    ensureAsignaturasTable($pdo);
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;
    
    $codigo = strtoupper(trim($input['codigo'] ?? ''));
    $nombre = trim($input['nombre'] ?? '');
    $nombre_completo = trim($input['nombre_completo'] ?? '');
    $carrera = trim($input['carrera'] ?? '');
    $grado = trim($input['grado'] ?? '');
    $semestre = trim($input['semestre'] ?? '');
    $modulo = trim($input['modulo'] ?? '');
    $carga_horaria = intval($input['carga_horaria'] ?? 0);
    $unidades = intval($input['unidades'] ?? 10);
    $descripcion = trim($input['descripcion'] ?? '');
    $color = trim($input['color'] ?? '#00B140');
    $icono = trim($input['icono'] ?? 'bi-book');

    if (empty($codigo) || empty($nombre)) api_error('Codigo y nombre requeridos', 400);

    $stmt = $pdo->prepare("INSERT INTO asignaturas (codigo, nombre, nombre_completo, carrera, grado, semestre, modulo, carga_horaria, unidades, descripcion, color, icono) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
    try {
        $stmt->execute([$codigo, $nombre, $nombre_completo, $carrera, $grado, $semestre, $modulo, $carga_horaria, $unidades, $descripcion, $color, $icono]);
        api_response(['status' => 'Exito', 'mensaje' => 'Asignatura creada', 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'UNIQUE') !== false) api_error('Ya existe una asignatura con ese codigo', 409);
        api_error('Error: ' . $e->getMessage(), 500);
    }
}

// ═══ EDITAR (solo admin/academico) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'update') {
    $decoded = require_auth();
    if (!in_array($decoded->role, ['admin','administrador_plataforma','academico'])) {
        api_error('Solo administradores pueden editar asignaturas', 403);
    }

    $pdo = db();
    ensureAsignaturasTable($pdo);
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;
    
    $id = intval($input['id'] ?? 0);
    if (!$id) api_error('ID requerido', 400);
    
    $codigo = strtoupper(trim($input['codigo'] ?? ''));
    $nombre = trim($input['nombre'] ?? '');
    $nombre_completo = trim($input['nombre_completo'] ?? '');
    $carrera = trim($input['carrera'] ?? '');
    $grado = trim($input['grado'] ?? '');
    $semestre = trim($input['semestre'] ?? '');
    $modulo = trim($input['modulo'] ?? '');
    $carga_horaria = intval($input['carga_horaria'] ?? 0);
    $unidades = intval($input['unidades'] ?? 10);
    $descripcion = trim($input['descripcion'] ?? '');
    $color = trim($input['color'] ?? '#00B140');
    $icono = trim($input['icono'] ?? 'bi-book');
    $estado = trim($input['estado'] ?? 'activo');

    $stmt = $pdo->prepare("UPDATE asignaturas SET codigo=?, nombre=?, nombre_completo=?, carrera=?, grado=?, semestre=?, modulo=?, carga_horaria=?, unidades=?, descripcion=?, color=?, icono=?, estado=? WHERE id=?");
    try {
        $stmt->execute([$codigo, $nombre, $nombre_completo, $carrera, $grado, $semestre, $modulo, $carga_horaria, $unidades, $descripcion, $color, $icono, $estado, $id]);
        api_response(['status' => 'Exito', 'mensaje' => 'Asignatura actualizada']);
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'UNIQUE') !== false) api_error('Ya existe otra asignatura con ese codigo', 409);
        api_error('Error', 500);
    }
}

// ═══ ELIMINAR (desactivar, solo admin/academico) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'delete') {
    $decoded = require_auth();
    if (!in_array($decoded->role, ['admin','administrador_plataforma','academico'])) {
        api_error('Solo administradores pueden eliminar asignaturas', 403);
    }

    $pdo = db();
    ensureAsignaturasTable($pdo);
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;
    
    $id = intval($input['id'] ?? 0);
    if (!$id) api_error('ID requerido', 400);
    
    $stmt = $pdo->prepare("UPDATE asignaturas SET estado = 'inactivo' WHERE id = ?");
    $stmt->execute([$id]);
    api_response(['status' => 'Exito', 'mensaje' => 'Asignatura desactivada']);
}

// ═══ SEMBRAR DATOS INICIALES (solo admin) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'seed') {
    $decoded = require_auth();
    if (!in_array($decoded->role, ['admin','administrador_plataforma'])) {
        api_error('Solo administradores pueden sembrar datos', 403);
    }

    $pdo = db();
    ensureAsignaturasTable($pdo);
    
    $asignaturas = [
        ['TIC', 'TIC', 'Tecnología de la Información y Comunicación', 'Administración de Empresas', 'Grado', '3er Semestre', 120, 10, 'Gestión de bases de datos, sistemas integrados, comercio electrónico e inteligencia artificial', '#00B140', 'bi-laptop'],
        ['SOC', 'Sociología', 'Sociología General', 'Administración de Empresas', 'Grado', '2do Semestre', 80, 8, 'Estudio de la sociedad, cultura y comportamiento humano', '#7C4DFF', 'bi-people'],
        ['DER', 'Derecho', 'Derecho Empresarial', 'Administración de Empresas', 'Grado', '3er Semestre', 80, 8, 'Marco legal empresarial, contratos y legislación laboral', '#FF6B9D', 'bi-balance-scale'],
        ['CON', 'Contabilidad', 'Contabilidad General', 'Contabilidad', 'Grado', '1er Semestre', 120, 10, 'Principios contables, estados financieros y análisis contable', '#4A90D9', 'bi-calculator'],
        ['ADM', 'Administración', 'Administración General', 'Administración de Empresas', 'Grado', '2do Semestre', 100, 9, 'Principios de administración, planificación y gestión empresarial', '#FF8C42', 'bi-briefcase'],
        ['ECO', 'Economía', 'Economía Empresarial', 'Administración de Empresas', 'Grado', '1er Semestre', 80, 8, 'Micro y macroeconomía, mercados y política económica', '#C5A55A', 'bi-graph-up'],
        ['MAT', 'Matemática', 'Matemática Aplicada', 'Administración de Empresas', 'Grado', '1er Semestre', 100, 9, 'Álgebra, estadística y matemática financiera', '#E91E63', 'bi-percent'],
        ['ING', 'Inglés', 'Inglés Empresarial', 'Administración de Empresas', 'Grado', '1er Semestre', 80, 8, 'Comunicación en inglés para el entorno empresarial', '#00BCD4', 'bi-translate'],
        ['AUD', 'Auditoría', 'Auditoría Financiera', 'Contabilidad', 'Grado', '4to Semestre', 100, 9, 'Técnicas de auditoría, control interno y evaluación financiera', '#9C27B0', 'bi-search'],
        ['TRI', 'Tributaria', 'Gestión Tributaria', 'Contabilidad', 'Grado', '4to Semestre', 80, 8, 'Impuestos, declaraciones fiscales y planificación tributaria', '#F44336', 'bi-file-earmark-text'],
    ];
    
    $stmt = $pdo->prepare("INSERT OR IGNORE INTO asignaturas (codigo, nombre, nombre_completo, carrera, grado, semestre, carga_horaria, unidades, descripcion, color, icono) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
    
    $count = 0;
    foreach ($asignaturas as $a) {
        try {
            $stmt->execute($a);
            if ($stmt->rowCount() > 0) $count++;
        } catch (PDOException $e) {
            // Skip duplicates
        }
    }
    
    api_response(['status' => 'Éxito', 'mensaje' => "{$count} asignaturas sembradas", 'total' => count($asignaturas)]);
}
