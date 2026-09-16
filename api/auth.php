<?php
/**
 * Authentication module for Centuria API
 * Handles login, registration, and session validation
 * Uses SQLite database with token-based auth (no JWT extension needed)
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/config.php';

// Helper: Generate password hash
function hash_password($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

// Helper: Verify password
function verify_password($password, $hash) {
    return password_verify($password, $hash);
}

// Helper: generar contraseña provisoria aleatoria (sin caracteres ambiguos)
function generar_provisoria($len = 10) {
    $abc = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    $out = '';
    for ($i = 0; $i < $len; $i++) $out .= $abc[random_int(0, strlen($abc) - 1)];
    return $out;
}

// Helper: leer remitente configurado (crea la tabla si falta)
function mail_config($pdo) {
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS configuracion (clave TEXT PRIMARY KEY, valor TEXT DEFAULT '', updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
        $stmt = $pdo->prepare("SELECT clave, valor FROM configuracion WHERE clave IN ('mail_remitente','mail_nombre')");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        return [
            'remitente' => $rows['mail_remitente'] ?? '',
            'nombre' => $rows['mail_nombre'] ?? 'Instituto Superior Centuria'
        ];
    } catch (Exception $e) {
        return ['remitente' => '', 'nombre' => 'Instituto Superior Centuria'];
    }
}

// Helper: intentar enviar provisoria por mail PHP. Devuelve ['mailed'=>bool]
function enviar_provisoria_mail($pdo, $email, $nombre, $provisoria) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return ['mailed' => false, 'motivo' => 'sin-email'];
    $cfg = mail_config($pdo);
    $asunto = 'Tu contraseña provisoria - ' . $cfg['nombre'];
    $cuerpo = "Hola $nombre,\n\nTu contraseña provisoria es: $provisoria\n\nPor seguridad, cámbiala en tu primer ingreso (Mi Perfil > Contraseña).\n\n" . $cfg['nombre'];
    $cab = "Content-Type: text/plain; charset=UTF-8\r\n";
    if ($cfg['remitente'] !== '') $cab .= "From: {$cfg['nombre']} <{$cfg['remitente']}>\r\nReply-To: {$cfg['remitente']}\r\n";
    $ok = @mail($email, $asunto, $cuerpo, $cab);
    return ['mailed' => (bool)$ok, 'motivo' => $ok ? '' : 'smtp-no-disponible'];
}

function email_mascarado($email) {
    $p = explode('@', $email);
    if (count($p) !== 2 || $p[0] === '') return '';
    return substr($p[0], 0, 1) . '***@' . $p[1];
}

// Helper: Generate session token
function generate_token($length = 32) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $token = '';
    for ($i = 0; $i < $length; $i++) {
        $token .= $characters[random_int(0, strlen($characters) - 1)];
    }
    return $token;
}

// Helper: Get IP address for session binding
function get_client_ip() {
    $ip = '0.0.0.0';
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        $ip = $_SERVER['HTTP_X_REAL_IP'];
    } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
        $ip = $_SERVER['REMOTE_ADDR'];
    }
    return $ip;
}

// Middleware: require authentication (sessions table)
function require_auth() {
    $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (empty($auth_header) && function_exists('getallheaders')) {
        $h = getallheaders();
        $auth_header = $h['Authorization'] ?? $h['authorization'] ?? '';
    }

    if (empty($auth_header)) {
        api_error('Authorization header required', 401);
    }

    $parts = explode(' ', $auth_header);
    if (count($parts) !== 2 || $parts[0] !== 'Bearer') {
        api_error('Invalid authorization format', 401);
    }

    $pdo = db();
    $stmt = $pdo->prepare("SELECT s.user_id, u.role, u.username FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires > datetime('now')");
    $stmt->execute([$parts[1]]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        api_error('Invalid or expired token', 401);
    }

    $obj = new stdClass();
    $obj->user_id = (int)$row['user_id'];
    $obj->role = $row['role'];
    $obj->username = $row['username'];
    return $obj;
}

// Login endpoint
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'login') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        api_error('Username and password required', 400);
    }
    
    $pdo = db();
    $stmt = $pdo->prepare("SELECT id, username, password, role, firstname, lastname, email, estado, must_change_password FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || !verify_password($password, $user['password'])) {
        api_error('Cedula o contrasena incorrecta', 401);
    }

    // FIX #3: Verificar que el usuario no este inactivo
    if (isset($user['estado']) && $user['estado'] === 'inactivo') {
        api_error('Tu cuenta esta desactivada. Contacta al administrador.', 403);
    }

    // Obtener roles activos del usuario desde user_roles
    $stmt_roles = $pdo->prepare("SELECT rol, carrera, seccion, asignatura, estado FROM user_roles WHERE user_id = ? AND (estado IS NULL OR estado = 'activo')");
    $stmt_roles->execute([$user['id']]);
    $roles = $stmt_roles->fetchAll(PDO::FETCH_ASSOC);

    // Determinar el rol principal
    $primary_role = $user['role'];
    if (!empty($roles)) {
        // Prioridad: admin > academico > docente > alumno
        $role_priority = ['admin' => 4, 'administrador_plataforma' => 4, 'academico' => 3, 'docente' => 2, 'teacher' => 2, 'alumno' => 1, 'student' => 1];
        $best_role = $primary_role;
        $best_priority = $role_priority[$primary_role] ?? 0;
        foreach ($roles as $r) {
            $p = $role_priority[$r['rol']] ?? 0;
            if ($p > $best_priority) {
                $best_role = $r['rol'];
                $best_priority = $p;
            }
        }
        $primary_role = $best_role;
    }
    
    // Generate session token
    $token = generate_token(48);
    
    // Delete old tokens for this user
    $stmt = $pdo->prepare("DELETE FROM sessions WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    
    // Store new token
    $user_agent = !empty($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
    $client_ip = get_client_ip();
    
    $stmt = $pdo->prepare(
        "INSERT INTO sessions (token, user_id, expires, ip_address, user_agent) 
         VALUES (?, ?, datetime('now', '+8 hours'), ?, ?)"
    );
    $stmt->execute([$token, $user['id'], $client_ip, $user_agent]);

    // Registrar ultimo acceso
    $pdo->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?")->execute([$user['id']]);
    
    api_response([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'firstname' => $user['firstname'],
            'lastname' => $user['lastname'],
            'email' => $user['email'] ?? '',
            'role' => $primary_role,
            'roles' => $roles,
            'must_change_password' => intval($user['must_change_password'] ?? 0)
        ]
    ]);
}

// Register endpoint
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'register') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $firstname = $_POST['firstname'] ?? '';
    $lastname = $_POST['lastname'] ?? '';
    $email = $_POST['email'] ?? '';
    $course_id = $_POST['course_id'] ?? null;
    $role = normalize_role($_POST['role'] ?? 'student');
    $telefono = $_POST['telefono'] ?? '';
    $grado = $_POST['grado'] ?? '';
    $carrera = $_POST['carrera'] ?? '';
    $seccion = $_POST['seccion'] ?? '';
    $foto = $_POST['foto'] ?? '';
    
    if (empty($username) || empty($password) || empty($firstname) || empty($lastname)) {
        api_error('All required fields must be provided', 400);
    }
    
    $pdo = db();
    
    // Check if username already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    
    if ($stmt->fetchColumn()) {
        api_error('Username already exists', 409);
    }
    
    // Hash password
    $hashed_password = hash_password($password);
    
    // Insert new user (la contraseña generada se guarda como provisoria y debe cambiarse)
    $stmt = $pdo->prepare(
        "INSERT INTO users (username, password, firstname, lastname, email, course_id, role, telefono, grado, carrera, seccion, foto, provisional_password, must_change_password, password_updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)"
    );

    try {
        $stmt->execute([$username, $hashed_password, $firstname, $lastname, $email, $course_id, $role, $telefono, $grado, $carrera, $seccion, $foto, $password]);
        
        $user_id = $pdo->lastInsertId();
        
        // Create session token for new user
        $token = generate_token(48);
        
        $user_agent = !empty($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
        $client_ip = get_client_ip();
        
        $stmt = $pdo->prepare(
            "INSERT INTO sessions (token, user_id, expires, ip_address, user_agent) 
             VALUES (?, ?, datetime('now', '+1 hour'), ?, ?)"
        );
        $stmt->execute([$token, $user_id, $client_ip, $user_agent]);
        
        api_response([
            'token' => $token,
            'user' => [
                'id' => $user_id,
                'username' => $username,
                'firstname' => $firstname,
                'lastname' => $lastname,
                'role' => $role,
                'grado' => $grado,
                'carrera' => $carrera,
                'seccion' => $seccion,
                'foto' => $foto,
                'must_change_password' => 1
            ]
        ], 201);
    } catch (PDOException $e) {
        api_error('Database error: ' . $e->getMessage(), 500);
    }
}

// Buscar usuario por cédula (para recuperar contraseña institucional).
// No expone el hash: el frontend deriva la contraseña con el formato oficial.
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'find_user') {
    $cedula = trim($_GET['cedula'] ?? '');

    if ($cedula === '') {
        api_error('Cedula required', 400);
    }

    $pdo = db();
    $stmt = $pdo->prepare("SELECT username, firstname, lastname, role FROM users WHERE username = ?");
    $stmt->execute([$cedula]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        api_response(['found' => true, 'user' => $user]);
    } else {
        api_response(['found' => false]);
    }
}

// Session validation endpoint
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'validate') {
    $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($auth_header)) {
        api_error('Authorization header required', 401);
    }
    
    // Extract token from Bearer token
    $parts = explode(' ', $auth_header);
    if (count($parts) !== 2 || $parts[0] !== 'Bearer') {
        api_error('Invalid authorization format', 401);
    }
    
    $token = $parts[1];
    
    // Verify token against sessions table
    $pdo = db();
    $stmt = $pdo->prepare("SELECT s.user_id, s.expires, u.role, u.firstname, u.lastname, u.username, u.must_change_password
                           FROM sessions s
                           JOIN users u ON s.user_id = u.id
                           WHERE s.token = ? AND s.expires > datetime('now')");
    $stmt->execute([$token]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($session) {
        api_response([
            'valid' => true,
            'user' => [
                'id' => $session['user_id'],
                'username' => $session['username'],
                'firstname' => $session['firstname'],
                'lastname' => $session['lastname'],
                'role' => $session['role'],
                'must_change_password' => intval($session['must_change_password'] ?? 0)
            ]
        ]);
    } else {
        api_error('Invalid or expired token', 401);
    }
}

// Logout endpoint
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'logout') {
    $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (!empty($auth_header)) {
        $parts = explode(' ', $auth_header);
        if (count($parts) === 2 && $parts[0] === 'Bearer') {
            $token = $parts[1];
            // Delete token from sessions table
            $pdo = db();
            $stmt = $pdo->prepare("DELETE FROM sessions WHERE token = ?");
            $stmt->execute([$token]);
        }
    }
    
    // Clear session
    session_destroy();
    
    api_response(['success' => true, 'message' => 'Logged out successfully']);
}

// ═══ #1 Cambiar contraseña (usuario) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'change_password') {
    $decoded = require_auth();

    // Leer de JSON body O de $_POST
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = [];
    $current_password = $input['current_password'] ?? $_POST['current_password'] ?? '';
    $new_password = $input['new_password'] ?? $_POST['new_password'] ?? '';

    if (empty($current_password) || empty($new_password)) {
        api_error('Contrasena actual y nueva contrasena requeridas', 400);
    }
    if (strlen($new_password) < 6) {
        api_error('La nueva contrasena debe tener al menos 6 caracteres', 400);
    }

    $pdo = db();
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$decoded->user_id]);
    $hash = $stmt->fetchColumn();

    if (!$hash || !verify_password($current_password, $hash)) {
        api_error('La contrasena actual es incorrecta', 401);
    }

    $new_hash = hash_password($new_password);
    $stmt = $pdo->prepare("UPDATE users SET password = ?, provisional_password = '', must_change_password = 0, password_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    $stmt->execute([$new_hash, $decoded->user_id]);

    api_response(['ok' => true, 'mensaje' => 'Contrasena actualizada correctamente']);
}

// ═══ #2 Reset contraseña (admin) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'reset_password') {
    $decoded = require_auth();
    if (!in_array($decoded->role, ['admin','administrador_plataforma'])) {
        api_error('Solo administradores pueden resetear contrasenas', 403);
    }

    // Leer de JSON body O de $_POST
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = [];
    $user_id = intval($input['user_id'] ?? $_POST['user_id'] ?? 0);
    $new_password = $input['new_password'] ?? $_POST['new_password'] ?? '';

    if (!$user_id) {
        api_error('user_id requerido', 400);
    }

    $pdo = db();

    $stmt = $pdo->prepare("SELECT username, firstname, lastname, email FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $u = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$u) {
        api_error('Usuario no encontrado', 404);
    }

    // Si NO se proporciona contrasena, generar provisoria ALEATORIA (debe cambiarla)
    if (empty($new_password)) {
        $new_password = generar_provisoria(10);
    }

    $new_hash = hash_password($new_password);
    $stmt = $pdo->prepare("UPDATE users SET password = ?, provisional_password = ?, must_change_password = 1, password_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    $stmt->execute([$new_hash, $new_password, $user_id]);

    $nombre = trim($u['firstname'] . ' ' . $u['lastname']);
    $envio = enviar_provisoria_mail($pdo, $u['email'] ?? '', $nombre, $new_password);

    api_response([
        'ok' => true,
        'mensaje' => 'Contrasena provisoria generada. Debe cambiarla por seguridad.',
        'new_password' => $new_password,
        'mailed' => $envio['mailed'],
        'email' => email_mascarado($u['email'] ?? ''),
        'email_enviado' => $envio['mailed'] ? ('Enviada a ' . email_mascarado($u['email'] ?? '')) : 'No se pudo enviar por mail (sin SMTP o sin email). Entrégala por otro medio.'
    ]);
}

// ═══ #3 Recuperar: ver provisoria guardada (público, misma exposición que la fórmula) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'recover') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;
    $cedula = trim($input['cedula'] ?? '');

    if ($cedula === '') api_error('Cédula requerida', 400);

    $pdo = db();
    $stmt = $pdo->prepare("SELECT firstname, lastname, email, provisional_password, must_change_password FROM users WHERE username = ?");
    $stmt->execute([$cedula]);
    $u = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$u) api_response(['found' => false]);

    $fn = explode(' ', trim($u['firstname']))[0] ?? '';
    $ln = explode(' ', trim($u['lastname']))[0] ?? '';
    api_response([
        'found' => true,
        'nombre' => $fn,
        'apellido' => $ln,
        'tiene_provisoria' => ($u['provisional_password'] ?? '') !== '',
        'provisional' => $u['provisional_password'] ?? '',
        'email_masked' => email_mascarado($u['email'] ?? ''),
        'must_change' => intval($u['must_change_password'] ?? 0)
    ]);
}

// ═══ #4 Enviar provisoria NUEVA al mail (público, con antispam 2 min) ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action']) && $_REQUEST['action'] === 'recover_send') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;
    $cedula = trim($input['cedula'] ?? '');

    if ($cedula === '') api_error('Cédula requerida', 400);

    $pdo = db();
    $stmt = $pdo->prepare("SELECT id, firstname, lastname, email, password_updated_at FROM users WHERE username = ?");
    $stmt->execute([$cedula]);
    $u = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$u) api_response(['found' => false]);
    if (!filter_var($u['email'] ?? '', FILTER_VALIDATE_EMAIL)) {
        api_response(['found' => true, 'mailed' => false, 'mensaje' => 'No tienes email registrado. Pide tu provisoria al administrador.']);
    }
    if (!empty($u['password_updated_at']) && (time() - strtotime($u['password_updated_at']) < 120)) {
        api_error('Espera 2 minutos antes de pedir otra provisoria', 429);
    }

    $nueva = generar_provisoria(10);
    $stmt = $pdo->prepare("UPDATE users SET password = ?, provisional_password = ?, must_change_password = 1, password_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    $stmt->execute([hash_password($nueva), $nueva, $u['id']]);

    $nombre = trim($u['firstname'] . ' ' . $u['lastname']);
    $envio = enviar_provisoria_mail($pdo, $u['email'], $nombre, $nueva);

    api_response([
        'found' => true,
        'mailed' => $envio['mailed'],
        'email_masked' => email_mascarado($u['email']),
        'mensaje' => $envio['mailed']
            ? 'Provisoria enviada a ' . email_mascarado($u['email']) . '. Cámbiala al entrar.'
            : 'No se pudo enviar por mail. Pide tu provisoria al administrador.'
    ]);
}