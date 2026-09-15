<?php
/**
 * Subject Kit API — Gestión del kit de habilitación de asignaturas
 * 
 * Componentes del kit:
 *   programa      → Programa (fundamentación, objetivos, estrategias, evaluación, bibliografía)
 *   unidades      → Contenido de todas las unidades (resumen, desarrollo, autoevaluación, mapa, fuentes)
 *   indicadores   → Indicadores de aprendizaje por unidad
 *   criterios     → Criterios de evaluación por unidad
 *   examen_p1     → Examen Parcial 1
 *   examen_p2     → Examen Parcial 2
 *   examen_final  → Examen Final
 *   glosario      → Glosario técnico
 *   documentos    → Documentos del docente (plan, planilla, acta, registro)
 *   calendario    → Eventos del calendario académico
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

// ═══ COMPONENTES VÁLIDOS ═══
$COMPONENTES = [
    'programa'     => ['nombre' => 'Programa', 'icono' => 'bi-book', 'desc' => 'Fundamentación, objetivos, estrategias, evaluación y bibliografía'],
    'unidades'     => ['nombre' => 'Unidades', 'icono' => 'bi-layers', 'desc' => 'Contenido de todas las unidades del curso'],
    'indicadores'  => ['nombre' => 'Indicadores', 'icono' => 'bi-bullseye', 'desc' => 'Indicadores de aprendizaje por unidad'],
    'criterios'    => ['nombre' => 'Criterios', 'icono' => 'bi-clipboard-check', 'desc' => 'Criterios de evaluación por unidad'],
    'examen_p1'    => ['nombre' => 'Examen Parcial 1', 'icono' => 'bi-file-earmark-text', 'desc' => 'Examen parcial 1 (unidades 1-3)'],
    'examen_p2'    => ['nombre' => 'Examen Parcial 2', 'icono' => 'bi-file-earmark-text', 'desc' => 'Examen parcial 2 (unidades 4-6)'],
    'examen_final' => ['nombre' => 'Examen Final', 'icono' => 'bi-file-earmark-medical', 'desc' => 'Examen final (todas las unidades)'],
    'glosario'     => ['nombre' => 'Glosario', 'icono' => 'bi-fonts', 'desc' => 'Glosario técnico de la asignatura'],
    'documentos'   => ['nombre' => 'Documentos', 'icono' => 'bi-folder', 'desc' => 'Plan de clases, planilla, acta y registro'],
    'calendario'   => ['nombre' => 'Calendario', 'icono' => 'bi-calendar3', 'desc' => 'Eventos del calendario académico'],
];

// ═══ GET: Estado del kit ═══
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
    $pdo = db();

    // action=status — Estado completo del kit de una o todas las asignaturas
    if ($_GET['action'] === 'status') {
        $asig = $_GET['asignatura'] ?? '';

        if ($asig) {
            // Kit de una sola asignatura
            $stmt = $pdo->prepare("SELECT componente, completado, datos, completado_por, completado_at FROM subject_kit WHERE asignatura = ?");
            $stmt->execute([strtoupper($asig)]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $kit = [];
            foreach ($COMPONENTES as $key => $meta) {
                $found = null;
                foreach ($rows as $r) {
                    if ($r['componente'] === $key) { $found = $r; break; }
                }
                $kit[$key] = [
                    'nombre'      => $meta['nombre'],
                    'icono'       => $meta['icono'],
                    'desc'        => $meta['desc'],
                    'completado'  => $found ? (int)$found['completado'] : 0,
                    'datos'       => $found ? json_decode($found['datos'] ?? '{}', true) : [],
                    'completado_por' => $found['completado_por'] ?? '',
                    'completado_at'  => $found['completado_at'] ?? '',
                ];
            }

            $total = count($kit);
            $completados = count(array_filter($kit, fn($k) => $k['completado']));
            $habilitado = $completados === $total;

            api_response([
                'asignatura'  => strtoupper($asig),
                'kit'         => $kit,
                'total'       => $total,
                'completados' => $completados,
                'habilitado'  => $habilitado,
                'porcentaje'  => $total > 0 ? round(($completados / $total) * 100) : 0,
            ]);
        } else {
            // Kit de todas las asignaturas (resumen)
            $stmt = $pdo->query("SELECT asignatura, componente, completado FROM subject_kit");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Obtener todas las asignaturas activas
            $stmt2 = $pdo->query("SELECT codigo, nombre, nombre_completo, carrera, semestre, color, icono FROM asignaturas WHERE estado = 'activo'");
            $asignaturas = $stmt2->fetchAll(PDO::FETCH_ASSOC);

            $resultado = [];
            foreach ($asignaturas as $a) {
                $cod = $a['codigo'];
                $comps = [];
                foreach ($rows as $r) {
                    if ($r['asignatura'] === $cod) {
                        $comps[$r['componente']] = (int)$r['completado'];
                    }
                }
                $total = count($COMPONENTES);
                $completados = count(array_filter($comps));
                $resultado[] = [
                    'codigo'       => $cod,
                    'nombre'       => $a['nombre'],
                    'nombre_completo' => $a['nombre_completo'],
                    'carrera'      => $a['carrera'],
                    'semestre'     => $a['semestre'],
                    'color'        => $a['color'],
                    'icono'        => $a['icono'],
                    'total'        => $total,
                    'completados'  => $completados,
                    'habilitado'   => $completados === $total,
                    'porcentaje'   => $total > 0 ? round(($completados / $total) * 100) : 0,
                ];
            }

            api_response(['asignaturas' => $resultado]);
        }
    }

    // action=componentes — Lista de componentes válidos
    if ($_GET['action'] === 'componentes') {
        api_response(['componentes' => $COMPONENTES]);
    }

    // action=habilitadas — Solo asignaturas con kit completo
    if ($_GET['action'] === 'habilitadas') {
        $stmt = $pdo->query("SELECT asignatura, COUNT(*) as total, SUM(completado) as completados FROM subject_kit GROUP BY asignatura");
        $kits = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $habilitadas = [];
        foreach ($kits as $k) {
            if ((int)$k['total'] >= count($COMPONENTES) && (int)$k['completados'] === count($COMPONENTES)) {
                $habilitadas[] = $k['asignatura'];
            }
        }

        // Obtener detalles de las habilitadas
        if (count($habilitadas) > 0) {
            $placeholders = str_repeat('?,', count($habilitadas) - 1) . '?';
            $stmt2 = $pdo->prepare("SELECT codigo, nombre, nombre_completo, carrera, semestre, color, icono, descripcion FROM asignaturas WHERE codigo IN ($placeholders) AND estado = 'activo'");
            $stmt2->execute($habilitadas);
            $asignaturas = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $asignaturas = [];
        }

        api_response(['asignaturas' => $asignaturas, 'count' => count($asignaturas)]);
    }
}

// ═══ POST: Marcar componente como completado ═══
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_REQUEST['action'])) {
    $pdo = db();
    $action = $_REQUEST['action'];

    // action=toggle — Marcar/desmarcar un componente
    if ($action === 'toggle') {
        $asignatura = strtoupper(trim($_POST['asignatura'] ?? ''));
        $componente = strtolower(trim($_POST['componente'] ?? ''));
        $completado = intval($_POST['completado'] ?? 1);
        $datos = $_POST['datos'] ?? '{}';
        $por = $_POST['completado_por'] ?? '';

        if (!$asignatura || !$componente) api_error('asignatura y componente requeridos', 400);
        if (!isset($COMPONENTES[$componente])) api_error('Componente no válido: ' . $componente, 400);

        // Upsert
        $stmt = $pdo->prepare("SELECT id FROM subject_kit WHERE asignatura = ? AND componente = ?");
        $stmt->execute([$asignatura, $componente]);
        $exists = $stmt->fetch();

        if ($exists) {
            $stmt = $pdo->prepare("UPDATE subject_kit SET completado = ?, datos = ?, completado_por = ?, completado_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE completado_at END WHERE asignatura = ? AND componente = ?");
            $stmt->execute([$completado, $datos, $por, $completado, $asignatura, $componente]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO subject_kit (asignatura, componente, completado, datos, completado_por, completado_at) VALUES (?, ?, ?, ?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END)");
            $stmt->execute([$asignatura, $componente, $completado, $datos, $por, $completado]);
        }

        // Verificar si la asignatura está completa
        $stmt = $pdo->prepare("SELECT COUNT(*) as total, SUM(completado) as completados FROM subject_kit WHERE asignatura = ?");
        $stmt->execute([$asignatura]);
        $summary = $stmt->fetch(PDO::FETCH_ASSOC);
        $habilitado = ((int)$summary['total'] >= count($COMPONENTES) && (int)$summary['completados'] === count($COMPONENTES));

        api_response([
            'status'     => 'ok',
            'asignatura' => $asignatura,
            'componente' => $componente,
            'completado' => $completado,
            'habilitado' => $habilitado,
            'total'      => (int)$summary['total'],
            'completados'=> (int)$summary['completados'],
        ]);
    }

    // action=toggle_all — Marcar todos los componentes de una asignatura
    if ($action === 'toggle_all') {
        $asignatura = strtoupper(trim($_POST['asignatura'] ?? ''));
        $completado = intval($_POST['completado'] ?? 1);
        $por = $_POST['completado_por'] ?? '';

        if (!$asignatura) api_error('asignatura requerida', 400);

        foreach ($COMPONENTES as $key => $meta) {
            $stmt = $pdo->prepare("SELECT id FROM subject_kit WHERE asignatura = ? AND componente = ?");
            $stmt->execute([$asignatura, $key]);
            if ($stmt->fetch()) {
                $stmt = $pdo->prepare("UPDATE subject_kit SET completado = ?, completado_por = ?, completado_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END WHERE asignatura = ? AND componente = ?");
                $stmt->execute([$completado, $por, $completado, $asignatura, $key]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO subject_kit (asignatura, componente, completado, completado_por, completado_at) VALUES (?, ?, ?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END)");
                $stmt->execute([$asignatura, $key, $completado, $por, $completado]);
            }
        }

        api_response(['status' => 'ok', 'asignatura' => $asignatura, 'completado' => $completado]);
    }
}

api_error('Acción no válida', 400);
