<?php
$pdo = new PDO('sqlite:api/centuria.db');

// Check user_roles structure
$stmt = $pdo->prepare('PRAGMA table_info(user_roles)');
$stmt->execute();
$cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo 'user_roles columns: ' . implode(', ', array_column($cols, 'name')) . PHP_EOL;

// Check existing teacher roles
$stmt2 = $pdo->query("SELECT ur.*, u.firstname, u.lastname FROM user_roles ur JOIN users u ON ur.user_id = u.id LIMIT 10");
$all = $stmt2->fetchAll(PDO::FETCH_ASSOC);
echo PHP_EOL . 'All user_roles:' . PHP_EOL;
foreach ($all as $row) {
    echo "  ID:{$row['id']} User:{$row['firstname']} {$row['lastname']} Rol:{$row['rol']} Carrera:{$row['carrera']} Asignatura:{$row['asignatura']} Estado:{$row['estado']}" . PHP_EOL;
}
