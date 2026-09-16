<?php
/**
 * Tesorería API — Pagos de módulos, cursos y seminarios con número de factura
 * GET  ?action=my&cedula=X              → pagos de un alumno (auth)
 * GET  ?action=list                     → todos con filtros (admin/académico)
 * GET  ?action=stats                    → totales (admin/académico)
 * POST ?action=save                     → registrar pago (admin/académico)
 * POST ?action=update_status            → cambiar estado/factura (admin/académico)
 * POST ?action=delete                   → eliminar (solo admin)
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

function pagos_roles_ok($auth, $roles) {
    return in_array($auth->role, $roles);
}

// ═══ MIS PAGOS (alumno ve los suyos) ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'my') {
    $auth = require_auth();
    $cedula = trim($_GET['cedula'] ?? '');
    if ($cedula === '') api_error('Cédula requerida', 400);

    $pdo = db();
    $stmt = $pdo->prepare("SELECT * FROM pagos WHERE cedula = ? ORDER BY fecha DESC, id DESC");
    $stmt->execute([$cedula]);
    api_response(['pagos' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

// ═══ LISTAR (admin/académico, con filtros) ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'list') {
    $auth = require_auth();
    if (!pagos_roles_ok($auth, ['admin','administrador_plataforma','academico','academic'])) {
        api_error('Solo administración', 403);
    }

    $pdo = db();
    $where = [];
    $params = [];
    if (!empty($_GET['estado'])) { $where[] = "estado = ?"; $params[] = $_GET['estado']; }
    if (!empty($_GET['tipo'])) { $where[] = "tipo = ?"; $params[] = $_GET['tipo']; }
    if (!empty($_GET['q'])) {
        $where[] = "(cedula LIKE ? OR nombre LIKE ? OR factura_numero LIKE ? OR concepto LIKE ?)";
        $q = '%' . $_GET['q'] . '%';
        $params[] = $q; $params[] = $q; $params[] = $q; $params[] = $q;
    }
    $sql = "SELECT * FROM pagos";
    if ($where) $sql .= " WHERE " . implode(' AND ', $where);
    $sql .= " ORDER BY fecha DESC, id DESC LIMIT 500";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    api_response(['pagos' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

// ═══ ESTADÍSTICAS (admin/académico) ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'stats') {
    $auth = require_auth();
    if (!pagos_roles_ok($auth, ['admin','administrador_plataforma','academico','academic'])) {
        api_error('Solo administración', 403);
    }

    $pdo = db();
    $recaudado = (float)$pdo->query("SELECT COALESCE(SUM(monto),0) FROM pagos WHERE estado = 'pagado'")->fetchColumn();
    $pendiente = (float)$pdo->query("SELECT COALESCE(SUM(monto),0) FROM pagos WHERE estado = 'pendiente'")->fetchColumn();
    $porEstado = $pdo->query("SELECT estado, COUNT(*) AS n FROM pagos GROUP BY estado")->fetchAll(PDO::FETCH_ASSOC);
    $porTipo = $pdo->query("SELECT tipo, COUNT(*) AS n, COALESCE(SUM(monto),0) AS total FROM pagos WHERE estado <> 'anulado' GROUP BY tipo")->fetchAll(PDO::FETCH_ASSOC);
    $facturas = (int)$pdo->query("SELECT COUNT(*) FROM pagos WHERE factura_numero <> '' AND estado <> 'anulado'")->fetchColumn();
    $total = (int)$pdo->query("SELECT COUNT(*) FROM pagos")->fetchColumn();

    api_response([
        'recaudado' => $recaudado,
        'pendiente' => $pendiente,
        'por_estado' => $porEstado,
        'por_tipo' => $porTipo,
        'facturas' => $facturas,
        'total' => $total
    ]);
}

// ═══ REGISTRAR PAGO (admin/académico) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'save') {
    $auth = require_auth();
    if (!pagos_roles_ok($auth, ['admin','administrador_plataforma','academico','academic'])) {
        api_error('Solo administración', 403);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;

    $cedula = trim($input['cedula'] ?? '');
    $nombre = trim($input['nombre'] ?? '');
    $concepto = trim($input['concepto'] ?? '');
    $tipo = trim($input['tipo'] ?? 'modulo');
    $monto = floatval($input['monto'] ?? 0);
    $moneda = trim($input['moneda'] ?? 'Gs.');
    $fecha = trim($input['fecha'] ?? date('Y-m-d'));
    $factura = trim($input['factura_numero'] ?? $input['factura'] ?? '');
    $estado = trim($input['estado'] ?? 'pendiente');
    $comprobante = trim($input['comprobante'] ?? '');

    if ($cedula === '' || $concepto === '') api_error('Cédula y concepto requeridos', 400);
    if (!in_array($tipo, ['modulo','curso','seminario','otro'])) $tipo = 'modulo';
    if (!in_array($estado, ['pendiente','pagado','anulado'])) $estado = 'pendiente';

    $pdo = db();
    $user_id = null;
    $stmt = $pdo->prepare("SELECT id, firstname, lastname FROM users WHERE username = ?");
    $stmt->execute([$cedula]);
    if ($u = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $user_id = $u['id'];
        if ($nombre === '') $nombre = trim($u['firstname'] . ' ' . $u['lastname']);
    }

    $stmt = $pdo->prepare("INSERT INTO pagos (uuid, user_id, cedula, nombre, concepto, tipo, monto, moneda, fecha, factura_numero, estado, comprobante, registrado_por) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
    $uuid = 'PAG-' . time() . '-' . substr(md5(uniqid((string)mt_rand(), true)), 0, 8);
    $stmt->execute([$uuid, $user_id, $cedula, $nombre, $concepto, $tipo, $monto, $moneda, $fecha, $factura, $estado, $comprobante, $auth->username]);

    api_response(['status' => 'Éxito', 'mensaje' => 'Pago registrado', 'id' => $pdo->lastInsertId()]);
}

// ═══ CAMBIAR ESTADO / FACTURA (admin/académico) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'update_status') {
    $auth = require_auth();
    if (!pagos_roles_ok($auth, ['admin','administrador_plataforma','academico','academic'])) {
        api_error('Solo administración', 403);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;
    $id = intval($input['id'] ?? 0);
    if (!$id) api_error('ID requerido', 400);

    $pdo = db();
    $sets = ["updated_at = CURRENT_TIMESTAMP"];
    $vals = [];
    if (isset($input['estado']) && in_array($input['estado'], ['pendiente','pagado','anulado'])) {
        $sets[] = "estado = ?"; $vals[] = $input['estado'];
    }
    if (isset($input['factura_numero']) || isset($input['factura'])) {
        $sets[] = "factura_numero = ?"; $vals[] = trim($input['factura_numero'] ?? $input['factura'] ?? '');
    }
    if (isset($input['comprobante'])) { $sets[] = "comprobante = ?"; $vals[] = trim($input['comprobante']); }
    if (isset($input['monto'])) { $sets[] = "monto = ?"; $vals[] = floatval($input['monto']); }
    if (count($sets) === 1) api_error('Nada que actualizar', 400);

    $vals[] = $id;
    $stmt = $pdo->prepare("UPDATE pagos SET " . implode(', ', $sets) . " WHERE id = ?");
    $stmt->execute($vals);

    api_response(['status' => 'Éxito', 'mensaje' => 'Pago actualizado']);
}

// ═══ ELIMINAR (solo admin) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'delete') {
    $auth = require_auth();
    if (!in_array($auth->role, ['admin','administrador_plataforma'])) api_error('Solo administradores', 403);

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;
    $id = intval($input['id'] ?? 0);
    if (!$id) api_error('ID requerido', 400);

    $pdo = db();
    $stmt = $pdo->prepare("DELETE FROM pagos WHERE id = ?");
    $stmt->execute([$id]);

    api_response(['status' => 'Éxito', 'mensaje' => 'Pago eliminado']);
}
