<?php
require_once __DIR__ . '/api/db.php';
$pdo = db();

echo "=== ROLES CONFIG ===" . PHP_EOL;
$stmt = $pdo->query("SELECT * FROM roles_config ORDER BY id");
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo "  {$r['id']} | {$r['nombre']} | {$r['descripcion']} | Permisos: {$r['permisos']}" . PHP_EOL;
}

echo PHP_EOL . "=== USER ROLES ===" . PHP_EOL;
$stmt2 = $pdo->query("SELECT ur.*, u.firstname, u.lastname FROM user_roles ur JOIN users u ON ur.user_id = u.id ORDER BY ur.user_id");
foreach ($stmt2->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo "  {$r['firstname']} {$r['lastname']} | Rol: {$r['rol']} | Carrera: {$r['carrera']} | Asignatura: {$r['asignatura']} | Estado: {$r['estado']}" . PHP_EOL;
}
