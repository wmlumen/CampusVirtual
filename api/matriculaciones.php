<?php
/**
 * API Matrículas — Registro completo de matrícula por alumno
 * Campus Virtual Centuria
 *
 * Acciones:
 *   save     — Alumno/Admin: guardar o actualizar matrícula (upsert por user_id)
 *   my       — Alumno: obtener mi matrícula
 *   list     — Admin/Académico: listar todas las matrículas con filtros
 *   detail   — Admin/Académico: detalle de una matrícula por ID o cédula
 *   update_status — Admin: cambiar estado (aprobado/rechazado)
 *   stats    — Admin/Académico: estadísticas de matrículas
 *   check    — Verificar si un alumno ya tiene matrícula
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

$action = $_REQUEST['action'] ?? '';

// Campos permitidos para guardar (whitelist de seguridad)
$ALLOWED_FIELDS = [
    'codigo_formulario','legajo_numero','fecha_inscripcion',
    'nombres','apellidos','cedula',
    'lugar_nacimiento','fecha_nacimiento','pais',
    'direccion','ciudad','departamento','barrio_compania',
    'telefono_fijo','telefono_movil','correo_electronico',
    'titulo_bachiller','institucion_origen','ciudad_pais_estudio','anio_promocion',
    'semestre','carrera','tipo_alumno',
    'matricula_guaranies','mensualidad','plan_pago',
    'asignaturas_pendientes','semestres_pendientes',
    'informacion_adicional','acepta_declaracion','firma'
];

switch ($action) {

    // ═══════════════════════════════════════════════
    // GUARDAR MATRÍCULA (upsert)
    // ═══════════════════════════════════════════════
    case 'save':
        $user = require_auth();
        $pdo = db();
        $uid = $user->user_id;
        $cedula = $_POST['cedula'] ?? '';

        if (!$cedula) api_error('Cédula es requerida');

        // Verificar si ya existe una matrícula para este usuario
        $check = $pdo->prepare("SELECT id FROM matriculaciones WHERE user_id = ? OR cedula = ?");
        $check->execute([$uid, $cedula]);
        $existing = $check->fetch(PDO::FETCH_ASSOC);

        // Construir campos dinámicamente (solo los permitidos)
        $fields = [];
        $params = [];
        foreach ($ALLOWED_FIELDS as $f) {
            if (isset($_POST[$f])) {
                $fields[] = "$f = ?";
                $params[] = trim($_POST[$f]);
            }
        }

        // Estado según completitud
        $acepta = ($_POST['acepta_declaracion'] ?? '0') === '1' ? 1 : 0;
        $firma = trim($_POST['firma'] ?? '');
        $nombres = trim($_POST['nombres'] ?? '');
        $apellidos = trim($_POST['apellidos'] ?? '');

        if ($acepta && $firma && $nombres && $apellidos) {
            $fields[] = "estado = 'completado'";
        }

        if ($existing) {
            // UPDATE
            $fields[] = "updated_at = datetime('now')";
            $params[] = $existing['id'];
            $sql = "UPDATE matriculaciones SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $id = $existing['id'];
        } else {
            // INSERT
            $fields[] = "user_id";
            $params[] = $uid;
            $fields[] = "registrado_por";
            $params[] = $user->username;
            $placeholders = array_fill(0, count($fields), '?');
            $sql = "INSERT INTO matriculaciones (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $id = $pdo->lastInsertId();
        }

        api_response([
            'status' => 'Exito',
            'id' => $id,
            'message' => 'Matrícula guardada correctamente'
        ]);
        break;

    // ═══════════════════════════════════════════════
    // MI MATRÍCULA
    // ═══════════════════════════════════════════════
    case 'my':
        $user = require_auth();
        $pdo = db();
        $uid = $user->user_id;

        $stmt = $pdo->prepare("SELECT * FROM matriculaciones WHERE user_id = ? ORDER BY id DESC LIMIT 1");
        $stmt->execute([$uid]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        api_response(['matricula' => $row ?: null]);
        break;

    // ═══════════════════════════════════════════════
    // VERIFICAR SI EXISTE
    // ═══════════════════════════════════════════════
    case 'check':
        $user = require_auth();
        $pdo = db();
        $cedula = $_GET['cedula'] ?? '';
        $uid = $user->user_id;

        $stmt = $pdo->prepare("SELECT id, estado, created_at FROM matriculaciones WHERE user_id = ? OR cedula = ?");
        $stmt->execute([$uid, $cedula]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        api_response(['existe' => (bool)$row, 'matricula' => $row ?: null]);
        break;

    // ═══════════════════════════════════════════════
    // LISTAR (Admin/Académico)
    // ═══════════════════════════════════════════════
    case 'list':
        $user = require_auth();
        if (!in_array($user->role, ['admin', 'academico', 'administrador_plataforma', 'admin_filial'])) {
            api_error('No tienes permisos', 403);
        }
        $pdo = db();

        $estado = $_GET['estado'] ?? '';
        $carrera = $_GET['carrera'] ?? '';
        $search = $_GET['search'] ?? '';
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(10, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $sql = "SELECT m.*, u.username AS cedula_usuario
                FROM matriculaciones m
                LEFT JOIN users u ON m.user_id = u.id
                WHERE 1=1";
        $countSql = "SELECT COUNT(*) FROM matriculaciones m WHERE 1=1";
        $params = [];
        $countParams = [];

        if ($estado) {
            $sql .= " AND m.estado = ?";
            $countSql .= " AND m.estado = ?";
            $params[] = $estado;
            $countParams[] = $estado;
        }
        if ($carrera) {
            $sql .= " AND m.carrera LIKE ?";
            $countSql .= " AND m.carrera LIKE ?";
            $params[] = "%$carrera%";
            $countParams[] = "%$carrera%";
        }
        if ($search) {
            $sql .= " AND (m.cedula LIKE ? OR m.nombres LIKE ? OR m.apellidos LIKE ?)";
            $countSql .= " AND (m.cedula LIKE ? OR m.nombres LIKE ? OR m.apellidos LIKE ?)";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $countParams[] = $searchTerm;
            $countParams[] = $searchTerm;
            $countParams[] = $searchTerm;
        }

        // Total
        $stmtCount = $pdo->prepare($countSql);
        $stmtCount->execute($countParams);
        $total = (int)$stmtCount->fetchColumn();

        $sql .= " ORDER BY m.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        api_response([
            'matriculas' => $rows,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pages' => ceil($total / $limit)
        ]);
        break;

    // ═══════════════════════════════════════════════
    // DETALLE (Admin/Académico)
    // ═══════════════════════════════════════════════
    case 'detail':
        $user = require_auth();
        if (!in_array($user->role, ['admin', 'academico', 'administrador_plataforma', 'admin_filial'])) {
            api_error('No tienes permisos', 403);
        }
        $pdo = db();
        $id = $_GET['id'] ?? 0;
        $cedula = $_GET['cedula'] ?? '';

        if ($id) {
            $stmt = $pdo->prepare("SELECT m.*, u.username AS cedula_usuario, u.firstname, u.lastname, u.email, u.grado, u.seccion
                FROM matriculaciones m LEFT JOIN users u ON m.user_id = u.id WHERE m.id = ?");
            $stmt->execute([$id]);
        } elseif ($cedula) {
            $stmt = $pdo->prepare("SELECT m.*, u.username AS cedula_usuario, u.firstname, u.lastname, u.email, u.grado, u.seccion
                FROM matriculaciones m LEFT JOIN users u ON m.user_id = u.id WHERE m.cedula = ? ORDER BY m.id DESC LIMIT 1");
            $stmt->execute([$cedula]);
        } else {
            api_error('ID o cédula requerido');
        }

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) api_error('Matrícula no encontrada', 404);

        api_response(['matricula' => $row]);
        break;

    // ═══════════════════════════════════════════════
    // CAMBIAR ESTADO (Admin)
    // ═══════════════════════════════════════════════
    case 'update_status':
        $user = require_auth();
        if ($user->role !== 'admin') api_error('Solo admin', 403);
        $pdo = db();
        $id = $_POST['id'] ?? 0;
        $nuevoEstado = $_POST['estado'] ?? '';
        $obs = trim($_POST['observaciones'] ?? '');

        if (!$id || !in_array($nuevoEstado, ['pendiente', 'completado', 'aprobado', 'rechazado'])) {
            api_error('Parámetros inválidos');
        }

        $stmt = $pdo->prepare("UPDATE matriculaciones SET estado = ?, observaciones = ?, updated_at = datetime('now') WHERE id = ?");
        $stmt->execute([$nuevoEstado, $obs, $id]);
        api_response(['status' => 'Exito']);
        break;

    // ═══════════════════════════════════════════════
    // ESTADÍSTICAS (Admin/Académico)
    // ═══════════════════════════════════════════════
    case 'stats':
        $user = require_auth();
        if (!in_array($user->role, ['admin', 'academico', 'administrador_plataforma'])) {
            api_error('No tienes permisos', 403);
        }
        $pdo = db();

        $total = (int)$pdo->query("SELECT COUNT(*) FROM matriculaciones")->fetchColumn();
        $pendientes = (int)$pdo->query("SELECT COUNT(*) FROM matriculaciones WHERE estado = 'pendiente'")->fetchColumn();
        $completados = (int)$pdo->query("SELECT COUNT(*) FROM matriculaciones WHERE estado = 'completado'")->fetchColumn();
        $aprobados = (int)$pdo->query("SELECT COUNT(*) FROM matriculaciones WHERE estado = 'aprobado'")->fetchColumn();
        $rechazados = (int)$pdo->query("SELECT COUNT(*) FROM matriculaciones WHERE estado = 'rechazado'")->fetchColumn();

        // Por carrera
        $carreras = $pdo->query("SELECT carrera, COUNT(*) AS total FROM matriculaciones WHERE carrera != '' GROUP BY carrera ORDER BY total DESC")->fetchAll(PDO::FETCH_ASSOC);

        // Por tipo
        $tipos = $pdo->query("SELECT tipo_alumno, COUNT(*) AS total FROM matriculaciones GROUP BY tipo_alumno ORDER BY total DESC")->fetchAll(PDO::FETCH_ASSOC);

        api_response([
            'total' => $total,
            'pendientes' => $pendientes,
            'completados' => $completados,
            'aprobados' => $aprobados,
            'rechazados' => $rechazados,
            'por_carrera' => $carreras,
            'por_tipo' => $tipos
        ]);
        break;

    // ═══════════════════════════════════════════════
    // ELIMINAR
    // ═══════════════════════════════════════════════
    case 'delete':
        $user = require_auth();
        if ($user->role !== 'admin') api_error('Solo admin', 403);
        $pdo = db();
        $id = $_POST['id'] ?? 0;
        if (!$id) api_error('ID requerido');
        $pdo->prepare("DELETE FROM matriculaciones WHERE id = ?")->execute([$id]);
        api_response(['status' => 'Exito']);
        break;

    default:
        api_error('Acción no válida: ' . $action);
}
