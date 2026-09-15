<?php
// Seed asignaturas in the database
require_once __DIR__ . '/db.php';

$pdo = db();

// Ensure table exists
$pdo->exec("CREATE TABLE IF NOT EXISTS asignaturas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    nombre_completo TEXT DEFAULT '',
    carrera TEXT DEFAULT '',
    grado TEXT DEFAULT '',
    semestre TEXT DEFAULT '',
    carga_horaria INTEGER DEFAULT 0,
    unidades INTEGER DEFAULT 10,
    descripcion TEXT DEFAULT '',
    color TEXT DEFAULT '#00B140',
    icono TEXT DEFAULT 'bi-book',
    estado TEXT DEFAULT 'activo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");

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

echo "Asignaturas sembradas: {$count}/" . count($asignaturas) . "\n";

// Show all asignaturas
$stmt2 = $pdo->query("SELECT codigo, nombre, carrera, semestre FROM asignaturas ORDER BY carrera, semestre");
$items = $stmt2->fetchAll(PDO::FETCH_ASSOC);
echo "\nAsignaturas en BD:\n";
foreach ($items as $item) {
    echo "  {$item['codigo']} - {$item['nombre']} ({$item['carrera']}) - {$item['semestre']}\n";
}
