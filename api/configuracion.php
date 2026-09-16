<?php
/**
 * Configuración API — Ajustes del sistema (ej. mail remitente de comunicaciones)
 * GET  ?action=get          → todas las claves (solo admin)
 * POST ?action=set          → guardar clave=valor (solo admin)
 * POST ?action=test_mail    → enviar correo de prueba al remitente (solo admin)
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

function config_ensure($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS configuracion (
        clave TEXT PRIMARY KEY,
        valor TEXT DEFAULT '',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    $seed = ['mail_remitente' => '', 'mail_nombre' => 'Instituto Superior Centuria'];
    foreach ($seed as $k => $v) {
        $chk = $pdo->prepare("SELECT COUNT(*) FROM configuracion WHERE clave = ?");
        $chk->execute([$k]);
        if (!$chk->fetchColumn()) {
            $ins = $pdo->prepare("INSERT INTO configuracion (clave, valor) VALUES (?, ?)");
            $ins->execute([$k, $v]);
        }
    }
}

function config_get_all($pdo) {
    config_ensure($pdo);
    $rows = $pdo->query("SELECT clave, valor FROM configuracion")->fetchAll(PDO::FETCH_ASSOC);
    $out = [];
    foreach ($rows as $r) $out[$r['clave']] = $r['valor'];
    return $out;
}

// Leer una clave (uso interno del servidor, sin auth)
function config_val($pdo, $clave, $def = '') {
    try {
        config_ensure($pdo);
        $stmt = $pdo->prepare("SELECT valor FROM configuracion WHERE clave = ?");
        $stmt->execute([$clave]);
        $v = $stmt->fetchColumn();
        return ($v === false) ? $def : $v;
    } catch (Exception $e) { return $def; }
}

// ═══ LEER (solo admin) ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get') {
    $auth = require_auth();
    if (!in_array($auth->role, ['admin','administrador_plataforma'])) api_error('Solo administradores', 403);
    $pdo = db();
    api_response(['config' => config_get_all($pdo)]);
}

// ═══ GUARDAR (solo admin) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'set') {
    $auth = require_auth();
    if (!in_array($auth->role, ['admin','administrador_plataforma'])) api_error('Solo administradores', 403);

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;
    $clave = trim($input['clave'] ?? '');
    $valor = trim($input['valor'] ?? '');

    $permitidas = ['mail_remitente', 'mail_nombre'];
    if (!in_array($clave, $permitidas)) api_error('Clave no permitida', 400);
    if ($clave === 'mail_remitente' && $valor !== '' && !filter_var($valor, FILTER_VALIDATE_EMAIL)) {
        api_error('Email remitente no válido', 400);
    }

    $pdo = db();
    config_ensure($pdo);
    $stmt = $pdo->prepare("INSERT INTO configuracion (clave, valor, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, updated_at = CURRENT_TIMESTAMP");
    $stmt->execute([$clave, $valor]);

    api_response(['status' => 'Éxito', 'mensaje' => 'Configuración guardada', 'clave' => $clave]);
}

// ═══ CORREO DE PRUEBA (solo admin) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'test_mail') {
    $auth = require_auth();
    if (!in_array($auth->role, ['admin','administrador_plataforma'])) api_error('Solo administradores', 403);

    $pdo = db();
    $remitente = config_val($pdo, 'mail_remitente', '');
    $nombre = config_val($pdo, 'mail_nombre', 'Instituto Superior Centuria');
    if ($remitente === '') api_error('Primero configura el mail remitente', 400);

    $asunto = 'Prueba de correo - ' . $nombre;
    $cuerpo = "Hola,\n\nEste es un correo de prueba del sistema $nombre.\nSi lo recibiste, las comunicaciones (contraseñas provisorias, avisos) llegarán a este buzón.\n\n$nombre";
    $cabeceras = "From: $nombre <$remitente>\r\nReply-To: $remitente\r\nContent-Type: text/plain; charset=UTF-8";

    $ok = @mail($remitente, $asunto, $cuerpo, $cabeceras);
    if ($ok) {
        api_response(['status' => 'Éxito', 'mensaje' => 'Correo de prueba enviado a ' . $remitente]);
    } else {
        api_error('PHP no pudo enviar (revisa SMTP del servidor). El remitente quedó guardado igual.', 500);
    }
}
