<?php
require_once __DIR__ . '/db.php';
$pdo = db();

// Update Acceso Academico permissions to include user management for teachers
$newPermisos = json_encode([
    "ver_cursos",
    "editar_cursos",
    "ver_notas",
    "editar_notas",
    "ver_asistencia",
    "editar_asistencia",
    "ver_calendario",
    "editar_calendario",
    "ver_documentos",
    "editar_documentos",
    "gestionar_docentes",  // NEW: Can manage teachers
    "asignar_asignaturas", // NEW: Can assign subjects to teachers
    "ver_reportes",
    "ver_config"
]);

$stmt = $pdo->prepare("UPDATE roles_config SET permisos = ? WHERE nombre = 'Acceso Academico'");
$stmt->execute([$newPermisos]);

echo "Acceso Academico actualizado con permisos: gestionar_docentes, asignar_asignaturas" . PHP_EOL;

// Verify
$stmt2 = $pdo->query("SELECT nombre, permisos FROM roles_config WHERE nombre = 'Acceso Academico'");
$row = $stmt2->fetch(PDO::FETCH_ASSOC);
echo "Permisos actuales: " . $row['permisos'] . PHP_EOL;

// Update Acceso Administrativo to also manage teachers
$newPermisosAdmin = json_encode([
    "ver_cursos",
    "ver_notas",
    "ver_asistencia",
    "ver_calendario",
    "ver_documentos",
    "gestionar_usuarios",
    "gestionar_docentes",
    "asignar_asignaturas",
    "ver_reportes"
]);

$stmt3 = $pdo->prepare("UPDATE roles_config SET permisos = ? WHERE nombre = 'Acceso Administrativo'");
$stmt3->execute([$newPermisosAdmin]);

echo "Acceso Administrativo actualizado" . PHP_EOL;

// Update Administrador General to have all permissions including filial management
$newPermisosGeneral = json_encode([
    "ver_cursos",
    "editar_cursos",
    "ver_notas",
    "editar_notas",
    "ver_asistencia",
    "editar_asistencia",
    "ver_calendario",
    "editar_calendario",
    "ver_documentos",
    "editar_documentos",
    "gestionar_usuarios",
    "gestionar_roles",
    "gestionar_docentes",
    "asignar_asignaturas",
    "gestionar_filiales",
    "ver_reportes",
    "ver_config"
]);

$stmt4 = $pdo->prepare("UPDATE roles_config SET permisos = ? WHERE nombre = 'Administrador General'");
$stmt4->execute([$newPermisosGeneral]);

echo "Administrador General actualizado con permisos completos" . PHP_EOL;
