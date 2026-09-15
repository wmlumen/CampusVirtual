<?php
// Check database structure for admin data
$pdo = new PDO('sqlite:api/centuria.db');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);
echo "Tables: " . implode(', ', ($tables ?: [])) . "\n";

// Check user_roles table structure
$stmt = $pdo->prepare('PRAGMA table_info(user_roles)');
$stmt->execute();
$cols2 = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "user_roles columns: " . implode(', ', array_column($cols2, 'name')) . "\n";

// Check filiales table structure
$stmt2 = $pdo->prepare('PRAGMA table_info(filiales)');
$stmt2->execute();
$cols3 = $stmt2->fetchAll(PDO::FETCH_ASSOC);
echo "filiales columns: " . implode(', ', array_column($cols3, 'name')) . "\n";

// Check if there are admin users
try {
    $stmt3 = $pdo->prepare("SELECT * FROM user_roles WHERE role='Administrador General' OR role='Administrador de Plataforma' LIMIT 5");
    $stmt3->execute();
    $admins = $stmt3->fetchAll(PDO::FETCH_ASSOC);
    echo "Admin users in user_roles:\n";
    print_r($admins);
} catch (Exception $e) {
    echo "Error querying admin users: " . $e->getMessage() . "\n";
}

// Check users table
try {
    $stmt4 = $pdo->prepare("SELECT * FROM users LIMIT 5");
    $stmt4->execute();
    $users = $stmt4->fetchAll(PDO::FETCH_ASSOC);
    echo "Users in users table:\n";
    print_r($users);
} catch (Exception $e) {
    echo "Error querying users: " . $e->getMessage() . "\n";
}
?>